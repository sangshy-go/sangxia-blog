---
title: "【JDK源码阅读11-util】Set接口---LinkedHashSet"
date: 2016-11-12
category: 随笔杂谈
tags: []
---

## LinkedHashSet

### 一、类继承关系

```
public class LinkedHashSet<E>
                  extends HashSet<E>
                  implements Set<E>, Cloneable, Serializable
```

LinkedHashSet继承自HashSet，而HashSet基于HashMap实现。此实现与HashSet
的不同之外在于，后者维护着一个运行于所有条目的双重链接列表。

特点：

继承自HashSet，所以具有与HashSet同样的特点：不可重复性，非同步，查询速度快等等

不同之处在于迭代顺序有序，即按插入顺序迭代。迭代性能比HashSet好。

### 二、内部源码分析

LinkedHashSet内部只是定义了四个构造器，而构造器全部调用的父类HashSet的构造器，而HashSet的构造器底层又是由LinkeHashMap实现，LinkeHashMap中又是调用了HashMap的方法；

### 三、总结

LinkedHashSet集合是根据元素的hashCode值来决定元素的存储位置，但是它同时使用链表维护元素的次序。这样使得元素看起来像是以

插入顺序保存的，也就是说，当遍历该集合时候，LinkedHashSet将会以元素的添加顺序访问集合的元素。LinkedHashSet在迭代访问Set中的全部

元素时，性能比HashSet好，但是插入时性能稍微逊色于HashSet。

The fucking source code:

```
/**
	 *  LinkedHashSet是Set接口的哈希表和链接列表的实现。
	 *  这个接口与HashSet不同之处在于,LinkedHashSet内维护着一条运行与所有节点的双向链表。
	 *  即链接列表定义了迭代顺序，即按元素插入链表的顺序进行迭代；
	 *  注意：如果在集合中重新插入元素，这个插入顺序不受影响。
	 */
	public  class LinkedHashSet<E>
	    extends HashSet<E>
	    implements Set<E>, Cloneable, java.io.Serializable {

	    private static final long serialVersionUID = -2851667679971038690L;

	    /**
	     * 建立指定初试化容量和加载因子的空构造器
	                  这里的true看到没，表示全部调用父类的HashSet构造器 
	         HashSet(int initialCapacity, float loadFactor, boolean dummy) {
            	map = new LinkedHashMap<>(initialCapacity, loadFactor);
    		  }
	     */
	    public LinkedHashSet(int initialCapacity, float loadFactor) {
	        super(initialCapacity, loadFactor, true);
	    }

	    //建立指定初试化容量的空构造器,加载因子默认为0.75
	    //调用父类的HashSet构造器
	    public LinkedHashSet(int initialCapacity) {
	        super(initialCapacity, .75f, true);
	    }

	    //建立 空构造器,加载因子默认为0.75,初始化容量为16
	    //调用父类的HashSet构造器
	    public LinkedHashSet() {
	        super(16, .75f, true);
	    }

	    //构建一个指定集合的 构造器，其余参数都是默认的
	    public LinkedHashSet(Collection<? extends E> c) {
	        super(Math.max(2*c.size(), 11), .75f, true);
	        addAll(c);
	    }
	}
```