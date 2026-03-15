---
title: "【Core Java Volume 4】java中数组Array和集合之间的相互转换"
date: 2016-09-25
category: 后端开发
tags: []
---

### 1  数组>>>>>>>集合：Arrays,asList()包装器

```
                //数组》》》集合
		String[] arrs={"A","B","C","D"};
		List<String> list=Arrays.asList(arrs);
		for(String l:list){
			System.out.print(l+" ");
		}
```

  

### 2  集合>>>>>>>数组：list.toArray()方法：

集合转化为数组不能直接使用List的toArray()方法，因为这样产生的是一个对象数组，而对象数组不能进行类型转换！

如：

```
//集合》》》数组
String[] temp = (String[]) list.toArray();
```

这样转化方式运行起来没什么问题，但是这种方法不推荐，具体解释见【http://www.cnblogs.com/happyPawpaw/archive/2012/10/22/2734140.html】

应该这样转：

```
String[] values = list.toArray(new String[0]);
```

或者：

```
String[] arrs2 =list.toArray(new String[list.size()]);
```

这样返回的数字与创建的数组类型一样。  
  