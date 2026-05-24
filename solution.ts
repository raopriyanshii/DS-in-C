import * as readline from 'readline';

interface Schema {
  fields: Map<string, FieldInfo>;
}

interface FieldInfo {
  optional: boolean;
  type: TypeUnion;
}

interface TypeUnion {
  primitives: Set<string>;
  object: Schema | null;
  arrayInfo: ArrayInfo | null;
}

type ArrayInfo =
  | { kind: 'unknown' }
  | { kind: 'known'; elementType: ElementTypeUnion };

interface ElementTypeUnion {
  primitives: Set<string>;
  object: Schema | null;
}

function buildSchema(objects: Record<string, any>[]): Schema {
  if (objects.length === 0) return { fields: new Map() };

  const keyToValues = new Map<string, any[]>();

  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      if (!keyToValues.has(key)) keyToValues.set(key, []);
      keyToValues.get(key)!.push(obj[key]);
    }
  }

  const fields = new Map<string, FieldInfo>();
  const total = objects.length;

  for (const [key, values] of keyToValues) {
    const optional = values.length < total;
    const type = buildTypeUnion(values);
    fields.set(key, { optional, type });
  }

  return { fields };
}

function buildTypeUnion(values: any[]): TypeUnion {
  const primitives = new Set<string>();
  const objectValues: Record<string, any>[] = [];
  const arrayValues: any[][] = [];

  for (const v of values) {
    if (v === null) primitives.add('null');
    else if (typeof v === 'string') primitives.add('string');
    else if (typeof v === 'number') primitives.add('number');
    else if (typeof v === 'boolean') primitives.add('boolean');
    else if (Array.isArray(v)) arrayValues.push(v);
    else if (typeof v === 'object') objectValues.push(v);
  }

  const object = objectValues.length > 0 ? buildSchema(objectValues) : null;

  let arrayInfo: ArrayInfo | null = null;
  if (arrayValues.length > 0) {
    const allElements: any[] = [];
    for (const arr of arrayValues) for (const e of arr) allElements.push(e);
    if (allElements.length === 0) {
      arrayInfo = { kind: 'unknown' };
    } else {
      arrayInfo = { kind: 'known', elementType: buildElementTypeUnion(allElements) };
    }
  }

  return { primitives, object, arrayInfo };
}

function buildElementTypeUnion(elements: any[]): ElementTypeUnion {
  const primitives = new Set<string>();
  const objectElements: Record<string, any>[] = [];

  for (const e of elements) {
    if (e === null) primitives.add('null');
    else if (typeof e === 'string') primitives.add('string');
    else if (typeof e === 'number') primitives.add('number');
    else if (typeof e === 'boolean') primitives.add('boolean');
    else if (typeof e === 'object' && !Array.isArray(e)) objectElements.push(e);
  }

  const object = objectElements.length > 0 ? buildSchema(objectElements) : null;
  return { primitives, object };
}

function assignNames(rootName: string, rootSchema: Schema): Map<Schema, string> {
  const schemaToName = new Map<Schema, string>();
  const usedNames = new Set<string>();

  usedNames.add(rootName);
  schemaToName.set(rootSchema, rootName);

  function getSubSchema(field: FieldInfo): Schema | null {
    if (field.type.object !== null) return field.type.object;
    const ai = field.type.arrayInfo;
    if (ai !== null && ai.kind === 'known' && ai.elementType.object !== null) {
      return ai.elementType.object;
    }
    return null;
  }

  function dfs(schema: Schema): void {
    const keys = [...schema.fields.keys()].sort();
    for (const key of keys) {
      const sub = getSubSchema(schema.fields.get(key)!);
      if (sub !== null) {
        const base = key[0].toUpperCase() + key.slice(1);
        let name = base;
        if (usedNames.has(name)) {
          let suffix = 2;
          while (usedNames.has(name + suffix)) suffix++;
          name = name + suffix;
        }
        usedNames.add(name);
        schemaToName.set(sub, name);
        dfs(sub);
      }
    }
  }

  dfs(rootSchema);
  return schemaToName;
}

function typeUnionToString(tu: TypeUnion, schemaToName: Map<Schema, string>): string {
  const parts: string[] = [];

  for (const p of tu.primitives) parts.push(p);

  if (tu.object !== null) parts.push(schemaToName.get(tu.object)!);

  if (tu.arrayInfo !== null) {
    if (tu.arrayInfo.kind === 'unknown') {
      parts.push('unknown[]');
    } else {
      const et = tu.arrayInfo.elementType;
      const ep: string[] = [];
      for (const p of et.primitives) ep.push(p);
      if (et.object !== null) ep.push(schemaToName.get(et.object)!);
      ep.sort();
      parts.push(ep.length === 1 ? ep[0] + '[]' : '(' + ep.join(' | ') + ')[]');
    }
  }

  parts.sort();
  return parts.join(' | ');
}

function generateOutput(schemaToName: Map<Schema, string>): string {
  const all: [string, Schema][] = [...schemaToName].map(([s, n]) => [n, s]);
  all.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

  const blocks: string[] = [];
  for (const [name, schema] of all) {
    const keys = [...schema.fields.keys()].sort();
    if (keys.length === 0) {
      blocks.push(`export interface ${name} {}`);
    } else {
      const lines = [`export interface ${name} {`];
      for (const key of keys) {
        const f = schema.fields.get(key)!;
        const opt = f.optional ? '?' : '';
        lines.push(`  ${key}${opt}: ${typeUnionToString(f.type, schemaToName)};`);
      }
      lines.push('}');
      blocks.push(lines.join('\n'));
    }
  }

  return blocks.join('\n\n');
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin });
  const lines: string[] = [];
  for await (const line of rl) lines.push(line);

  let idx = 0;
  const T = parseInt(lines[idx++], 10);
  const results: string[] = [];

  for (let t = 0; t < T; t++) {
    const rootName = lines[idx++].trim();
    const jsonStr = lines[idx++].trim();
    const objects = JSON.parse(jsonStr) as Record<string, any>[];
    const schema = buildSchema(objects);
    const schemaToName = assignNames(rootName, schema);
    results.push(generateOutput(schemaToName));
  }

  process.stdout.write(results.join('\n---\n') + '\n');
}

main().catch(e => { process.stderr.write(String(e) + '\n'); process.exit(1); });
