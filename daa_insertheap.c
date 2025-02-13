# include <stdio.h>
# define size 5
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
	
}