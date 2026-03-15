---
title: "【JDK源码阅读6-util】Collection-Set"
date: 2016-11-08
category: 随笔杂谈
tags: []
---

### 接口--Set

```
public interface Set<E>
 
  extends Collection<E>
```

        set集合是存储无序，不可重复的元素。

        直接上fucking source code，主要是看后面的其实现类HashSet,TreeSet,LinkedSet具体实现:

 

```
/**
	 * A collection that contains no duplicate elements.  More formally, sets
	 * contain no pair of elements <code>e1</code> and <code>e2</code> such that
	 * <code>e1.equals(e2)</code>, and at most one null element.  As implied by
	 * its name, this interface models the mathematical <i>set</i> abstraction.
	 *
	 * <p>The <tt>Set</tt> interface places additional stipulations, beyond those
	 * inherited from the <tt>Collection</tt> interface, on the contracts of all
	 * constructors and on the contracts of the <tt>add</tt>, <tt>equals</tt> and
	 * <tt>hashCode</tt> methods.  Declarations for other inherited methods are
	 * also included here for convenience.  (The specifications accompanying these
	 * declarations have been tailored to the <tt>Set</tt> interface, but they do
	 * not contain any additional stipulations.)
	 *
	 * <p>The additional stipulation on constructors is, not surprisingly,
	 * that all constructors must create a set that contains no duplicate elements
	 * (as defined above).
	 *
	 * <p>Note: Great care must be exercised if mutable objects are used as set
	 * elements.  The behavior of a set is not specified if the value of an object
	 * is changed in a manner that affects <tt>equals</tt> comparisons while the
	 * object is an element in the set.  A special case of this prohibition is
	 * that it is not permissible for a set to contain itself as an element.
	 *
	 * <p>Some set implementations have restrictions on the elements that
	 * they may contain.  For example, some implementations prohibit null elements,
	 * and some have restrictions on the types of their elements.  Attempting to
	 * add an ineligible element throws an unchecked exception, typically
	 * <tt>NullPointerException</tt> or <tt>ClassCastException</tt>.  Attempting
	 * to query the presence of an ineligible element may throw an exception,
	 * or it may simply return false; some implementations will exhibit the former
	 * behavior and some will exhibit the latter.  More generally, attempting an
	 * operation on an ineligible element whose completion would not result in
	 * the insertion of an ineligible element into the set may throw an
	 * exception or it may succeed, at the option of the implementation.
	 * Such exceptions are marked as "optional" in the specification for this
	 * interface.
	 *
	 */

	/**
	 * 存储无序，不可重复元素
	 * @author WGS
	 */
	public interface Set<E> extends Collection<E> {

	    //返回set集合大小
	    int size();
	    //判断非空
	    boolean isEmpty();
	    //判断是否含有指定元素o
	    boolean contains(Object o);
	    //返回集合的迭代器；返回元素顺序无序(除非set提供了某种顺序)
	    Iterator<E> iterator();
	    //集合转为数组(无序，除非set提供了某种顺序)
	    Object[] toArray();
	    //返回指定类型的数组
	    <T> T[] toArray(T[] a);

	    //添加元素，若集合中已存在，则返回false，添加失败
	    boolean add(E e);
	    //移除指定元素
	    boolean remove(Object o);

	    //是否包含指定集合
	    boolean containsAll(Collection<?> c);
	    //求两集合并集
	    boolean addAll(Collection<? extends E> c);
	    //求两集合交集：留下含有c集合中的元素
	    boolean retainAll(Collection<?> c);
	    //求两集合差集:移除含有集合c中的元素
	    boolean removeAll(Collection<?> c);
	    //清空集合
	    void clear();

	    //比较
	    boolean equals(Object o);
	    //求set集合的哈希值(所有元素),null的哈希值为0
	    //equals
	    int hashCode();
	}
```

  