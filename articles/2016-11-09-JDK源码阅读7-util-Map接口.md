---
title: "【JDK源码阅读7-util】Map接口"
date: 2016-11-09
category: 随笔杂谈
tags: []
---

## Map接口

     Map接口不是Collection的子接口；

         \*Map集合中将键映射到值的对象。一个映射不包含重复的键，即每个键最多映射一个值；  
\*Map接口提供了三种collection视图，允许以键集、值集或者键值映射关系形式查看映射集合的内容。  
\*               映射顺序定义为迭代器在映射的collection视图上返回其元素的顺序.  
\* 像TreeMap的实现类中实现了特定的顺序来返回集合中元素；而HashMap就没有。  
\*注：将可变对象作为键值时要额外注意；

        下面贴图来对Map集合内部有个清楚的了解：

![](https://img-blog.csdn.net/20161109145208142?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

      如图，Map集合实际上也就是线性的数组实现，,所以可以理解为其存储数据的容器就是一个线性数组。但是每个数组中是一条数据链(由一个或多个Entry结点组成)。可以看下源码中entry结点的组成：

```
//Map集合中的内部元素，对应集合中一个元素
	    //每个Entry结点是桶Bucket中的一个元素，多个Entry以链表形式连接
	    interface Entry<K,V> {
	        //返回Entry集合中的key值
	        K getKey();
	        //返回Entry集合中的value值
	        V getValue();
	        //替换Entry集合中的值
	        V setValue(V value);
	        //与指定对象比较
	        boolean equals(Object o);
	        //返回entry集合的hashcode值
	        int hashCode();
	    }
```

       这个静态内部类Entry，其重要的属性有 key , value, next，从属性key,value我们就能很明显的看出来Entry就是HashMap键值对实现的一个基础bean，我们上面说到HashMap的基础就是一个线性数组，这个数组就是Entry[]，Map里面的内容都保存在Entry[]里面。

       具体的实现在HashMap中再继续学习。

```
package jdk_util;

import java.util.Collection;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;
import java.util.Set;
import java.util.SortedMap;
import java.util.TreeMap;

public class JDK_Map {
	/**
	 *Map集合中将键映射到值的对象。一个映射不包含重复的键，即每个键最多映射一个值；
	 *这个集合替代了Dictionary类，Dictionary类完全是一个抽象类，而不是一个接口；
	 *
	 * Map接口提供了三种collection视图，允许以键集、值集或者键值映射关系形式查看映射集合的内容。
	 * 映射顺序定义为迭代器在映射的collection视图上返回其元素的顺序.
	 * 像TreeMap的实现类中实现了特定的顺序来返回集合中元素；而HashMap就没有。
	 * 
	 *注：将可变对象作为键值时要额外注意；
	 */
	public interface Map<K,V> {
	    // Query Operations
	    //返回map集合中中键值对映射的个数
	    int size();
	    //判断是否非空
	    boolean isEmpty();
	    //判断是否含有指定键key
	    boolean containsKey(Object key);
	    //判断是否含有值value
	    boolean containsValue(Object value);
	    //返回指定键key对应的value值
	    V get(Object key);

	    // Modification Operations
	    //将指定键值加入到集合中
	    //若对应的键key已经存在，就将新的value值覆盖原来的value值
	    V put(K key, V value);
	    //移除指定的键对应的键值对；返回键key对应的value值
	    V remove(Object key);

	    // Bulk Operations
	    //复制集合m中所有键值对到本集合中
	    //若键重复该怎么办：是将新集合m中键值对的value值对其覆盖？
	    void putAll(Map<? extends K, ? extends V> m);
	    //情空集合中所有的映射关系
	    void clear();

	    // Views
	    //返回此映射中包含的键的 Set 视图
	    Set<K> keySet();
	    //返回此映射中包含的值的Set视图
	    Collection<V> values();
	    //返回集合中键值对映射的Set视图
	    Set<Map.Entry<K, V>> entrySet();

	    //Map集合中的内部元素，对应集合中一个元素
	    //每个Entry结点是桶Bucket中的一个元素，多个Entry以链表形式连接
	    interface Entry<K,V> {
	        //返回Entry集合中的key值
	        K getKey();
	        //返回Entry集合中的value值
	        V getValue();
	        //替换Entry集合中的值
	        V setValue(V value);
	        //与指定对象比较
	        boolean equals(Object o);
	        //返回entry集合的hashcode值
	        int hashCode();
	    }
	    // 这两个方法对于Map集合很重要，涉及到哈希算法，必须清晰理解Map集合的内部元素才可
	    //比较
	    boolean equals(Object o);
	    //hashCode值
	    int hashCode();

	}

}
```

  