---
title: "【JDK源码阅读5-util】Collection-List---Vector"
date: 2016-11-06
category: 随笔杂谈
tags: []
---

## **Vector实现类**

                                       public class 
Vector<E>


extends 
[AbstractList](http://blog.csdn.net/gjr9596/article/details/52710939 "java.util 中的类")<E>

implements 
[List](http://blog.csdn.net/gjr9596/article/details/52710939 "java.util 中的接口")<E>, 
[RandomAccess](http://blog.csdn.net/gjr9596/article/details/52710939 "java.util 中的接口"),
[Cloneable](http://blog.csdn.net/gjr9596/article/details/52710939 "java.lang 中的接口"),
[Serializable](http://blog.csdn.net/gjr9596/article/details/52710939 "java.io 中的接口")

【转载至】【http://blog.csdn.net/gjr9596/article/details/52710939】

1  与ArrayList的联系：

因为Vector和ArrayList基本一致，`Vector` 类可以实现可增长的对象数组。与数组一样，它包含可以使用整数索引进行访问的组件。Vector是ArrayList的多线程的一个替代品。

2  与ArrayList的区别：

(1)ArrayList是线程不安全的，在多线程的情况下不要使用

Vector是同步的，Vector中的绝大部分方法都使用了同步关键字修饰，在多线程的情况下不会出现并发错误。

(2)扩容大小不同，ArrayList为每次扩容为原始容量的1.5倍,

而Vector是允许设置默认的增长长度，Vector的默认扩容方式为原来的2倍。