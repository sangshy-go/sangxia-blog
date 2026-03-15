---
title: "【JDK源码阅读1-util】Collection"
date: 2016-11-03
category: 随笔杂谈
tags: []
---

   见过一句夸张的话，叫做“没有阅读过jdk源码的人不算学过java”。从今天起开始精读源码。而适合精读的源码无非就是java.io,.util和.lang包下的类。

面试题中对于集合的考察还是比较多的,所以我就先从集合的源码开始看起。

       (一)首先是Collection接口。

       Collection是所有collection类的根接口；Collection继承了Iterable，即所有的Collection中的类都能使用foreach方法。

```
/**
 * Collection是所有collection类的根接口；
 * Collection继承了Iterable，即所有的Collection中的类都能使用foreach方法。
 * @author WGS
 * @param <E>
 */
public interface Collection<E> extends Iterable<E> {
	//返回集合中元素的大小。(如果此大小值超过Integer.MAX_VALUE，就直接返回Integer.MAX_VALUE)
    int size();

    //判断集合是否为空
    boolean isEmpty();

    //判断集合是否包含元素o(注意元素e是否为null及类型是否兼容问题)
    boolean contains(Object o);

    //返回集合中元素的迭代器(顺序不能保证，除非集合指定了顺序)
    Iterator<E> iterator();

    //以数组的形式返回集合中的所有元素，数组是安全
    Object[] toArray();

    //以数组形式返回指定数组类型的集合元素
    <T> T[] toArray(T[] a);

    //此方法可用来判断集合中是否含有元素e;是-false,否-true(在set,map中会经常调用这个方法，在编程题时很有用)
    boolean add(E e);

    //从集合中移除指定的元素
    boolean remove(Object o);

    //用来判断是否含有指定集合中的所以元素
    boolean containsAll(Collection<?> c);

    //将指定集合中的所有元素添加至调用者的集合中
    boolean addAll(Collection<? extends E> c);

    //移除与指定集合相同的元素(即移除两集合交集部分)
    boolean removeAll(Collection<?> c);

    //保留与指定集合中相同的元素(即移除与指定集合不同的元素)
    boolean retainAll(Collection<?> c);

    //清空集合
    void clear();

    //判断与指定元素是否相等
    boolean equals(Object o);

    //返回集合的哈希码值
    int hashCode();
 }
```