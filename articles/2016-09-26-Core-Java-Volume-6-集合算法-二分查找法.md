---
title: "【Core Java Volume 6】集合算法--二分查找法"
date: 2016-09-26
category: 后端开发
tags: []
---

在数组中查找一个对象，当数组是有序的时候可以采用二分查找法。即可以直接查看位于数组中间的元素，看一看是否大于查找的元素。

如果大于，用同样的方法在数组的前半部分继续查找；否则用同样的方法在数组的后半部分继续查找。这样就可以将查找范围缩减一半。

Collections类的binarySeacrch方法实现了这个算法。

【注】集合必须是排好序的，没有排好序的要提供一个比较器对象。

```
public class BinarySearchTest {

	public static void main(String[] args) {
		List<Integer> list=new ArrayList<Integer>();
		list.add(2);list.add(9);list.add(4);list.add(3);list.add(1);
		
		Comparator<Integer> comparator=new Comparator<Integer>(){
			@Override
			public int compare(Integer o1, Integer o2) {
				return o1.compareTo(o2);
			}
		};
		//原集合：2 9 4 3 1
		//排序后：1 2 3 4 9
		int i = Collections.binarySearch(list, 4, comparator);
		System.out.println(i);//4能找到，在原集合第2个位置，所以返回2
		System.out.println(list.get(i));//验证：索引为2的位置就是4
		int j= Collections.binarySearch(list, 5, comparator);//5不能被找到，所以返回负数；返回的数为-（原集合长度+1）
		System.out.println(j);//-6
	}
}
```

如上：binarySeacrch方法返回的值 >= 0,表示找到要找的元素，并返回该元素在原集合中的位置；

<0,未找到，此时可以将该元素插入到原集合尾部：

```
int j= Collections.binarySearch(list, 5, comparator);//5不能被找到，所以返回负数；返回的数为-（原集合长度+1）
		System.out.println(j);//-6
		//可以通过计算插入到正确位置，前提是j<0,即原集合中无此数
		int insertIndex = -j -1;
		list.add(insertIndex, 5);
		
		//排序后：1 2 3 4 5  9
		System.out.println(Collections.binarySearch(list, 5, comparator));//返回5
```

  