# include <stdio.h>
# define size 10
void insert(int a[], int n)
{
	int i,item;
	i=n;
	item=a[n];
	while ((i>1)&&(a[i/2]<item))
	{
		a[i]=a[i/2];
		i=i/2;
	}
	a[i]=item;
}
void delmax(int a[], int *n);
void adjust(int a[],int i,int n);
void main()
{
	int a[size],i,n;
	printf("Enter the size of the heap :");
	scanf("%d",&n);
	printf("Enter elements :");
	for (i=1;i<= n;i++)
	{
		scanf("%d",&a[i]);
		insert(a,i);
	}
	printf("Heap elements:\n");
    for (i = 1; i <= n; i++) 
	{
        printf("%d ", a[i]);
    }
    printf("After deleting the max element :");
    delmax(a,&n);
    printf("Heap elements:\n");
    for (i = 1; i <= n; i++) 
	{
        printf("%d ", a[i]);
    }
	
}
void delmax(int a[], int *n)
{
	int x;
	if(*n==0)
	{
			printf("Empty Heap !");
			return;
	}
	x=a[1];
	a[1]=a[*n];
	(*n)--;
	adjust(a,1,*n);
}
void adjust(int a[],int i,int n)
{
	int temp,j;
	temp=a[i];
	j=2*i;
	while (j<=n)
	{
		if ((j<n) && a[j]<a[j+1])
			j=j+1;
		if (temp>=a[j])
			break;
		a[j/2]=a[j];
		j=2*j;
	}
		a[j/2]=temp;
}


