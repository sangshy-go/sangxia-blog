---
title: "【Core Java Volume 5】集合算法---查找数组、集合最大值的通用方法"
date: 2016-09-26
category: 后端开发
tags: []
---

### 一、查找数组的最大值

1   笔试的时候通常查找数组的最大值，数组类型通常是int类型，可以这样直接写出getMax()代码:

```
      //数组(int 类型)
	public static int getMax(int[] nums){
		if(nums.length <=0)
			return 0;
		int max= nums[0];
		for(int i=0;i<nums.length;i++){
			if(max < nums[i])
				max=nums[i];
		}
		return max;
	}
```

测试：


```
int[]  nums={1,3,9,5,7,2,0,1};
System.out.println(getMax(nums));//9
```

  

2  当需要查找多个数组类型的最大值的时候，可以写出一个通用的方法（实现Comparable接口的）：

【注】T类型需为引用类型，不能为int..基本数据类型

```
        //通用查找数组最大值方法
	public static <T extends Comparable >T getMax(T[] nums){
		if(nums.length <=0)
			throw new NoSuchElementException();
		T max= nums[0];
		for(int i=0;i<nums.length;i++){
			if(max.compareTo(nums[i]) < 0)
				max=nums[i];
		}
		return max;
	}
```

测试：

```
Integer[]  nums={1,3,9,5,7,2,0,1};
System.out.println(getMax2(nums));//9		
String[] arrs={"3","9","1","6"};
System.out.println(getMax2(arrs));//9
```

  

### 二、查找集合最大值的通用方法

```
       //查找集合的最大值
	public static <T extends Comparable> T max(Collection<T> collection){
		//1  判断非空
		if(collection.isEmpty())
			throw new NoSuchElementException();
		//2 获取迭代器
		Iterator<T> iter=collection.iterator();
		//3 初始化最大值，设置为第一个数
		T max=iter.next();
		//4 遍历集合，找寻最大值
		while(iter.hasNext()){
			T next =iter.next();
			if(max.compareTo(next) < 0)//即max < next
				max = next;
		}
		//返回最大值
		return max;
	}
```

  

测试：

```
                //2 集合
		List<Integer> list=new ArrayList<Integer>();
		list.add(2);list.add(9);list.add(4);list.add(3);list.add(1);
		//3 链表 
		List<Integer> linkList = new LinkedList<>();
		linkList.add(2);linkList.add(0);linkList.add(9);linkList.add(1);linkList.add(8);

		System.out.println(max(list));//9
		System.out.println(max(linkList));//9
```

  
  