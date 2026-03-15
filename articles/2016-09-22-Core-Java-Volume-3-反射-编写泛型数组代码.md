---
title: "【Core Java Volume 3】反射---编写泛型数组代码"
date: 2016-09-22
category: 后端开发
tags: []
---

```
import java.lang.reflect.Array;
import java.util.Arrays;

public class CopyOfTest {
	/**
	 * 测试
	 * @date 2016/9/22
	 * @param args
	 * @author WGS
	 */
	public static void main(String[] args) {
		int[] a={1,2,3};
		
		//使用Arrays.copyOf()用于拓展已经填满的数组
		a=Arrays.copyOf(a, 10);
		System.out.println(Arrays.toString(a));
		
		//****通用的能够实现的方法
		a=(int[]) goodCopyOf(a, 10);
		System.out.println(Arrays.toString(a));//[1, 2, 3, 0, 0, 0, 0, 0, 0, 0]
		
		//badCopyOf返回的数组类型是Object[],无法强制转化为String[]
		String[] b={"Harry","Jerry","Tom"};
		b=(String[])badCopyOf(b, 10);
		System.out.println(Arrays.toString(b));//java.lang.ArrayIndexOutOfBoundsException
	}
	
	/**
	 * 将原数组a扩容为长度为newLength的新数组newArray（无法实现）
	 * @param a：将要被转化的数组
	 * @param newLength：新数组长度
	 * @return：返回扩容后的数组
	 */
	public static Object[] badCopyOf(Object[] a,int newLength){
		Object[] newArray = new Object[newLength];
		System.arraycopy(a, 0, newArray, 0, newLength);
		return newArray;
	}
	
	/**
	 * 将原数组a扩容为长度为newLength的新数组newArray(可实现)
	 * @param a：将要被转化的数组
	 * @param newLength：新数组长度
	 * @return：返回扩容后的数组
	 */
	public static Object goodCopyOf(Object a,int newLength){
		//1 获取数组a的类对象
		Class cl=a.getClass();
		//2 确认a是一个数组
		if(!cl.isArray())
			return null;
		// 3 获得数组a的类型
		Class componentType =cl.getComponentType();
		//System.out.println("componentType:"+componentType);int
		//4 获得数组a的长度
		int length = Array.getLength(a);
		//5 Arrays.newIinstance()方法，可以构造新数组，提供了新数组的元素类型和数组长度
		Object newArray = Array.newInstance(componentType, newLength);
		//复制后即可得到与原数组类型相同的newLength长度的新数组
		System.arraycopy(a, 0, newArray, 0, Math.min(length, newLength));
		return newArray;
	}	
	
}
```

  