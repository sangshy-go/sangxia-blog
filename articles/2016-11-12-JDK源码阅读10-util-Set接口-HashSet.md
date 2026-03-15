---
title: "【JDK源码阅读10-util】Set接口---HashSet"
date: 2016-11-12
category: 随笔杂谈
tags: []
---

## HashSet

### 一、类继承关系

![](https://img-blog.csdn.net/20161112154541232?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

```
public class HashSet<E>
                  extends AbstractSet<E>
                  implements Set<E>, Cloneable, Serializable
```

特点：

1   HashSet实现Set 接口，由哈希表支持，底层是一个HashMap 实例。

2   插入元素顺序是无序的(由HashCode决定)。

3   不能添加重复的元素(即添加重复元素的时候会返回false，添加失败),允许添加null 元素。

4  HashSet是非线程同步的，实现同步的操作：

```
        Set set = Collections.synchronizedSet(new HashSet());
```

### 二、HashSet 两个重要特性

学习HashSet一定要清楚，其底层实现是一个HashMap实例，其所有的添加删除等基本操作都是调用HashMap实例中的方法进行操作的；

这也就能理解HashSet的两个重要特性：无序性  和 不可重复性。

即：

 HashSet 底层是由HashMap 实现的:即将Set集合的值作为Map集合的键，而HashMap中 值不用考虑，可以设置个固定值PRESENT。对应关系如下：

map集合的键《《---》》》Set集合

而我们指知道，map集合的键是不能重复的(键key可以为null)，这也就是解释了HashSet集合允许有null元素集合，且不能有重复元素的原因。  

### 三、HashSet 中add（）方法在算法题中的应用

HashSet 最有用的方法就是set.add(Element e)这个方法，可用来判断原集合中是否含有将要添加的元素e：

 如果含有重复元素e,就返回false,添加失败；否则添加成功返回true。

The fucking source code:

```
package jdk_util;

import java.util.AbstractSet;
import java.util.Collection;
import java.util.Collections;
import java.util.ConcurrentModificationException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.TreeSet;

public class JDK_HashSet {

	/**
	 * HashSet底层由于是HashMap实现的，即HashSet集合的值被当做HashMap的键，HashMap值设为定值:伪值--PRESENT
	 * 由于HashMap键允许为null,不能重复；所以HashSet集合允许有null元素，且不能有重复元素。
	 * 
	 *HashSet类是Set的主要实现类，由哈希表支持(实际上是一个HashMap实例)。它不能确保set集合中元素的迭代顺序；
	 *特别是不能确保顺序不变，HashSet允许null元素存在。

	 *假定哈希函数正确地将这些元素分配在桶中。
	 *迭代set集合需要的时间与HashSet实例的大小(元素数量)和底层HashMap实例(桶的数量)的"容量"成比例。
	 *因此，如果迭代性能很重要，就不要将集合初始容量设置太高(即加载因子设置太低)。
	 *
	 * 注意，HashSet是非同步，即非线程安全的。  
	 * 			Set s = Collections.synchronizedSet(new HashSet(...));
	 * 
	 * HashSet 底层是由HashMap 实现的:即将Set集合的值作为Map集合的键。
	 *     而我们指知道，map集合的键是不能重复的(键值可以为null),
	 *     map集合的键《《---》》》Set集合，
	 *     这也就是解释了HashSet集合允许有null元素集合，且不能有重复元素的原因
	 *    而值不用考虑，可以设置个固定值PRESENT
	 */

	public static class HashSet<E>
	    extends AbstractSet<E>
	    implements Set<E>, Cloneable, java.io.Serializable
	{
	    static final long serialVersionUID = -5024744406713321676L;

	    //创建一个HashMap 对象。
	    //transient防止对象被序列化；
	    //由此可看出 HashSet 底层是由HashMap 实现的:即将Set集合的值作为Map集合的键。
	    private transient HashMap<E,Object> map;

	    //用来填充HashMap的值对象(键对象由set集合填充)
	    private static final Object PRESENT = new Object();

	    //构造器：创建空的Set集合；
	    //底层的HashMap的初始化容量为16，加载因子为0.75
	    public HashSet() {
	        map = new HashMap<>();
	    }

	    //创建包含集合对象c的Set集合；
	    //底层的加载因子仍然是0.75；大小不小于16
	    public HashSet(Collection<? extends E> c) {
	        map = new HashMap<>(Math.max((int) (c.size()/.75f) + 1, 16));
	        addAll(c);
	    }

	    //指定初始化容量和加载因子的HashSet;底层即为HashMap
	    public HashSet(int initialCapacity, float loadFactor) {
	        map = new HashMap<>(initialCapacity, loadFactor);
	    }

	    //指定初始化容量HashSet;用HashMap实现,加载因子的默认为0.75
	    public HashSet(int initialCapacity) {
	        map = new HashMap<>(initialCapacity);
	    }

	    //构建一个链式hashSet，指定初始化容量和加载因子；
	    //这个构造器只用来提供给LinkedHashSet使用；
	    //底层的HashMap实例是一个具有指定初始化容量和加载因子的LinkedHashMap
	    //dummy：？
	    HashSet(int initialCapacity, float loadFactor, boolean dummy) {
	        map = new LinkedHashMap<>(initialCapacity, loadFactor);
	    }

	    //返回set集合迭代器，顺序是无序的
	    //底层实现是返回map集合的keySet集合的遍历(再次证明hashset集合值作为hashmap集合的键)
	    public Iterator<E> iterator() {
	        return map.keySet().iterator();
	    }

	    //返回set集合的大小；
	    //实际上是map集合的大小
	    public int size() {
	        return map.size();
	    }

	    //判断是否非空 
	    public boolean isEmpty() {
	        return map.isEmpty();
	    }

	    //判断是否包含元素o,实际上是在map集合中keySet寻找，是否有这样的键值o
	    public boolean contains(Object o) {
	        return map.containsKey(o);
	    }

	    //添加，若待添加的值存在，就返回false
	    //原理：调用的是hashMap.put(key,value);
	    //hashMap中添加元素是先判断键所在位置是否有元素，有的话就将新值value覆盖旧值，并返回旧值；
	    //                      若所在位置没有元素，就加入value值到指定key处，并返回null
	    //这也就解释了hashset中不能有重复元素的原因，因为不能添加重复元素
	    public boolean add(E e) {
	        return map.put(e, PRESENT)==null;//若添加后值==null，说明原来key处无值，就返回true
	        							       //否则返回false
	    }

	    //移除指定元素o
	    public boolean remove(Object o) {
	        return map.remove(o)==PRESENT;
	    }

	    //清空集合
	    public void clear() {
	        map.clear();
	    }

	    //浅复制
	    public Object clone() {
	        try {
	            HashSet<E> newSet = (HashSet<E>) super.clone();
	            newSet.map = (HashMap<E, Object>) map.clone();
	            return newSet;
	        } catch (CloneNotSupportedException e) {
	            throw new InternalError();
	        }
	    }

	    //序列化：将HashSet实例保存在流中
	    private void writeObject(java.io.ObjectOutputStream s)
	        throws java.io.IOException {
	        // Write out any hidden serialization magic
	        s.defaultWriteObject();

	        // Write out HashMap capacity and load factor
	        s.writeInt(map.capacity());//集合的容量
	        s.writeFloat(map.loadFactor());//集合的加载因子

	        // Write out size
	        s.writeInt(map.size());//集合大小

	        // Write out all elements in the proper order.
	        for (E e : map.keySet())
	            s.writeObject(e);//集合的值
	    }

	    //反序列化：读取流中的集合值
	    private void readObject(java.io.ObjectInputStream s)
	        throws java.io.IOException, ClassNotFoundException {
	        // Read in any hidden serialization magic
	        s.defaultReadObject();

	        // Read in HashMap capacity and load factor and create backing HashMap
	        int capacity = s.readInt();
	        float loadFactor = s.readFloat();
	        map = (((HashSet)this) instanceof LinkedHashSet ?
	               new LinkedHashMap<E,Object>(capacity, loadFactor) :
	               new HashMap<E,Object>(capacity, loadFactor));
	        // Read in size
	        int size = s.readInt();
	        // Read in all elements in the proper order.
	        for (int i=0; i<size; i++) {
	            E e = (E) s.readObject();
	            map.put(e, PRESENT);
	        }
	    }
	}

}
```