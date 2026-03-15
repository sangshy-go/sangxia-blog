---
title: "【JDK源码阅读2-util】Collection-List"
date: 2016-11-03
category: 随笔杂谈
tags: []
---

List接口是Collection的子接口，除了继承了Collection中的方法外，自身还增添了很多有用的方法。

 **(一)List接口**

  List集合中的元素是有序可重复的，因此List可将元素插入到指定位置处，或者查询指定位置处的元素。

  源码如下：

```
/**
	 * List接口是有序、可重复的元素；
	 * 可以指定位置添加元素、根据索引查询元素
	 */
	public interface List<E> extends Collection<E> {
	   
		int size();
	    boolean isEmpty();
	    boolean contains(Object o);
	    Iterator<E> iterator();
	    Object[] toArray();
	    <T> T[] toArray(T[] a);
	    boolean add(E e);
	    boolean remove(Object o);
	    boolean containsAll(Collection<?> c);
	    boolean addAll(Collection<? extends E> c);
	    boolean removeAll(Collection<?> c);
	    boolean retainAll(Collection<?> c);
	    void clear();
	    boolean equals(Object o);
	    int hashCode();
	    E remove(int index);

	    /*---------------------------上面的方法同Collection--------------------------------------------*/
	    /*----------------------------以下是List接口新增的方法--------------------------------------------*/
	    
	    //指定位置插入指定集合中所有元素
	    boolean addAll(int index, Collection<? extends E> c);
	    //返回集合中中指定位置的元素
	    E get(int index);
	   //用指定元素element替换集合指定位置处的元素
	    E set(int index, E element);
	    //将指定元素插入到指定位置处。(插入的时候，若index处有元素则该元素即后面的元素整体右移)
	    void add(int index, E element);


        //返回元素o在集合中第一次出现的位置；没有该元素则返回-1
	    int indexOf(Object o);
	   //返回元素o在集合中最后一次出现的位置；没有该元素则返回-1
	    int lastIndexOf(Object o);
	   // 返回列表的迭代器
	    ListIterator<E> listIterator();
	    //返回指定为位置处的列表迭代器
	    ListIterator<E> listIterator(int index);

	    // View
	    //返回原集合中从fromIndex开始到toIndex结束的所有元素，以集合形式返回。
	    List<E> subList(int fromIndex, int toIndex);
	}
```

  

(二)ArrayList实现类

 