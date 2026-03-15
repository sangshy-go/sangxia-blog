---
title: "【JDK源码阅读13-util】Set接口---TreeSet"
date: 2016-11-29
category: 随笔杂谈
tags: []
---

## TreeSet

1 TreeSet是一种排序二叉树。内部是TreeMap的实现：TreeMap中的key就是TreeSet集合的元素，TreeMap中的value = new Object() .

2 存入Set集合中的值，会按照值的大小进行相关的排序操作。使用元素的自然顺序对元素进行排序，或者根据创建 set 时提供的 Comparator 进行排序，

具体取决于使用的构造方法。

3 底层算法是基于红黑树来实现的。

4 TreeSet和HashSet的主要区别在于TreeSet中的元素会按照相关的值进行排序~

5 TreeSet和HashSet的区别和联系

(1). HashSet是通过HashMap实现的,TreeSet是通过TreeMap实现的,只不过Set用的只是Map的key

(2). Map的key和Set都有一个共同的特性就是集合的唯一性.TreeMap更是多了一个排序的功能.

(3). hashCode和equal()是HashMap用的, 因为无需排序所以只需要关注定位和唯一性即可.

**注意，此实现不是同步的。**

SortedSet s = Collections.synchronizedSortedSet(new TreeSet(...));

### 一、继承关系

```
java.lang.Object
  继承者 java.util.AbstractCollection<E>
      继承者 java.util.AbstractSet<E>
          继承者 java.util.TreeSet<E>
```

### 二、定义

```
	public class TreeSet<E>   extends AbstractSet<E>
```

```
			  implements NavigableSet<E>, Cloneable, Serializable
```

### 三、主要方法

#### 1 add()

```
	//将指定的元素添加到此 set（如果该元素尚未存在于 set 中）。
	    //实际是将元素e当做键，常量PRESENT当做值，添加到TreeMap中
	    public boolean add(E e) {
	        return m.put(e, PRESENT)==null;
	    }
```

#### 2 remove()

```
	//将指定的元素从 set 中移除（如果该元素存在于此 set 中）。
	    public boolean remove(Object o) {
	        return m.remove(o)==PRESENT;
	    }
```

#### 3 contains()

```
  	//判断set 是否包含指定的元素，是则返回 true。
	    //实际上判断TreeMap中是否包含键o
	    public boolean contains(Object o) {
	        return m.containsKey(o);
	    }
```

TreeSet内部是TreeMap的实现，代码比较简单，全部调用的是TreeMap的方法，所以这里就不多赘述了。直接看源码：

```
/**
	 * TreeSet
	 *  TreeSet是一种排序二叉树。存入Set集合中的值，会按照值的大小进行相关的排序操作。
	 *  使用元素的自然顺序对元素进行排序，或者根据创建 set 时提供的 Comparator 进行排序，
	 *  具体取决于使用的构造方法。底层算法是基于红黑树来实现的。
	 *  
	 *  
	 *  1.内部同时TreeMap实现，TreeMap中的key就是TreeSet集合的元素，TreeMap中的value = new Object() 
		2.排序规则默认是key自然排序，也可以自定义排序 
		3.TreeMap内部通过红黑树实现，这个树是二叉树 
	 */

	public class TreeSet<E> extends AbstractSet<E>
	    implements NavigableSet<E>, Cloneable, java.io.Serializable
	{
	    //底层是TreeMap的实现
	    private transient NavigableMap<E,Object> m;

	    //TreeMap的key就是TreeSet集合的元素
	    //而TreeMap的value值就用一固定值PRESENT代替
	    private static final Object PRESENT = new Object();

	    TreeSet(NavigableMap<E,Object> m) {
	        this.m = m;
	    }

	    //默认构造方法，根据其元素的自然顺序进行排序.调用 的是TreeMap的构造方法
	    public TreeSet() {
	        this(new TreeMap<E,Object>());
	    }

	    //构造一个新的空 TreeSet，它根据指定比较器进行排序。
	    public TreeSet(Comparator<? super E> comparator) {
	        this(new TreeMap<>(comparator));
	    }

	    //构造一个 包含指定Collection元素的新TreeSet，按照其元素的自然顺序进行排序
	    public TreeSet(Collection<? extends E> c) {
	        this();
	        addAll(c);//添加colection中的所有元素
	    }

	    //构造一个与指定集合有相同映射关系和相同排序的TreeSet
	    public TreeSet(SortedSet<E> s) {
	        this(s.comparator());
	        addAll(s);
	    }
	    //迭代器
	    public Iterator<E> iterator() {
	        return m.navigableKeySet().iterator();
	    }

	    //返回在此 set 元素上按降序进行迭代的迭代器。
	    public Iterator<E> descendingIterator() {
	        return m.descendingKeySet().iterator();
	    }

	    //返回此 set 中所包含元素的逆序视图。
	    public NavigableSet<E> descendingSet() {
	        return new TreeSet<>(m.descendingMap());
	    }

	    //集合大小
	    public int size() {
	        return m.size();
	    }

	    //判断是否空集合
	    public boolean isEmpty() {
	        return m.isEmpty();
	    }

	    //判断set 是否包含指定的元素，是则返回 true。
	    //实际上判断TreeMap中是否包含键o
	    public boolean contains(Object o) {
	        return m.containsKey(o);
	    }

	    //将指定的元素添加到此 set（如果该元素尚未存在于 set 中）。
	    //实际是将元素e当做键，常量PRESENT当做值，添加到TreeMap中
	    public boolean add(E e) {
	        return m.put(e, PRESENT)==null;
	    }

	    //将指定的元素从 set 中移除（如果该元素存在于此 set 中）。
	    public boolean remove(Object o) {
	        return m.remove(o)==PRESENT;
	    }

	    //情况集合set
	    public void clear() {
	        m.clear();
	    }

	    //将指定 collection 中的所有元素添加到此 set 中。
	    public  boolean addAll(Collection<? extends E> c) {
	        // Use linear-time version if applicable
	        if (m.size()==0 && c.size() > 0 &&
	            c instanceof SortedSet &&
	            m instanceof TreeMap) {
	            SortedSet<? extends E> set = (SortedSet<? extends E>) c;
	            TreeMap<E,Object> map = (TreeMap<E, Object>) m;
	            Comparator<? super E> cc = (Comparator<? super E>) set.comparator();
	            Comparator<? super E> mc = map.comparator();
	            if (cc==mc || (cc != null && cc.equals(mc))) {
	                map.addAllForTreeSet(set, PRESENT);
	                return true;
	            }
	        }
	        return super.addAll(c);
	    }

	    //返回此 set 的部分视图
	    public NavigableSet<E> subSet(E fromElement, boolean fromInclusive,
	                                  E toElement,   boolean toInclusive) {
	        return new TreeSet<>(m.subMap(fromElement, fromInclusive,
	                                       toElement,   toInclusive));
	    }

	    //返回此 set 的部分视图
	    public NavigableSet<E> headSet(E toElement, boolean inclusive) {
	        return new TreeSet<>(m.headMap(toElement, inclusive));
	    }

	    //返回此 set 的部分视图，其元素大于（或等于，如果 inclusive 为 true）fromElement。
	    public NavigableSet<E> tailSet(E fromElement, boolean inclusive) {
	        return new TreeSet<>(m.tailMap(fromElement, inclusive));
	    }

	    /**
	     * @throws ClassCastException {@inheritDoc}
	     * @throws NullPointerException if {@code fromElement} or
	     *         {@code toElement} is null and this set uses natural ordering,
	     *         or its comparator does not permit null elements
	     * @throws IllegalArgumentException {@inheritDoc}
	     */
	    public SortedSet<E> subSet(E fromElement, E toElement) {
	        return subSet(fromElement, true, toElement, false);
	    }

	    //返回此 set 的部分视图，其元素严格小于 toElement。
	    public SortedSet<E> headSet(E toElement) {
	        return headSet(toElement, false);
	    }

	    //返回此 set 的部分视图，其元素大于等于 fromElement。
	    public SortedSet<E> tailSet(E fromElement) {
	        return tailSet(fromElement, true);
	    }

	    //返回对此 set 中的元素进行排序的比较器；如果此 set 使用其元素的自然顺序，则返回 null。
	    public Comparator<? super E> comparator() {
	        return m.comparator();
	    }

	    //返回此 set 中当前第一个（最低）元素。
	    public E first() {
	        return m.firstKey();
	    }

	    //返回此 set 中当前最后一个（最高）元素。
	    public E last() {
	        return m.lastKey();
	    }

	    // NavigableSet API methods

	    //返回此 set 中严格小于给定元素的最大元素；如果不存在这样的元素，则返回 null。
	    public E lower(E e) {
	        return m.lowerKey(e);
	    }

	    //返回此 set 中小于等于给定元素的最大元素；如果不存在这样的元素，则返回 null。
	    public E floor(E e) {
	        return m.floorKey(e);
	    }

	    //返回此 set 中  大于等于  给定元素的最小元素；如果不存在这样的元素，则返回 null。
	    public E ceiling(E e) {
	        return m.ceilingKey(e);
	    }

	    //返回此 set 中    大于   给定元素的最小元素；如果不存在这样的元素，则返回 null。
	    public E higher(E e) {
	        return m.higherKey(e);
	    }

	    //获取并移除第一个（最低）元素；如果此 set 为空，则返回 null。
	    public E pollFirst() {
	        Map.Entry<E,?> e = m.pollFirstEntry();
	        return (e == null) ? null : e.getKey();
	    }

	    //获取并移除最后一个（最高）元素；如果此 set 为空，则返回 null。
	    public E pollLast() {
	        Map.Entry<E,?> e = m.pollLastEntry();
	        return (e == null) ? null : e.getKey();
	    }

	    //返回 TreeSet 实例的浅表副本。属于浅拷贝。
	    public Object clone() {
	        TreeSet<E> clone = null;
	        try {
	            clone = (TreeSet<E>) super.clone();
	        } catch (CloneNotSupportedException e) {
	            throw new InternalError();
	        }

	        clone.m = new TreeMap<>(m);
	        return clone;
	    }

	    /**
	     * Save the state of the {@code TreeSet} instance to a stream (that is,
	     * serialize it).
	     *
	     * @serialData Emits the comparator used to order this set, or
	     *             {@code null} if it obeys its elements' natural ordering
	     *             (Object), followed by the size of the set (the number of
	     *             elements it contains) (int), followed by all of its
	     *             elements (each an Object) in order (as determined by the
	     *             set's Comparator, or by the elements' natural ordering if
	     *             the set has no Comparator).
	     */
	    private void writeObject(java.io.ObjectOutputStream s)
	        throws java.io.IOException {
	        // Write out any hidden stuff
	        s.defaultWriteObject();

	        // Write out Comparator
	        s.writeObject(m.comparator());

	        // Write out size
	        s.writeInt(m.size());

	        // Write out all elements in the proper order.
	        for (E e : m.keySet())
	            s.writeObject(e);
	    }

	    /**
	     * Reconstitute the {@code TreeSet} instance from a stream (that is,
	     * deserialize it).
	     */
	    private void readObject(java.io.ObjectInputStream s)
	        throws java.io.IOException, ClassNotFoundException {
	        // Read in any hidden stuff
	        s.defaultReadObject();

	        // Read in Comparator
	        Comparator<? super E> c = (Comparator<? super E>) s.readObject();

	        // Create backing TreeMap
	        TreeMap<E,Object> tm;
	        if (c==null)
	            tm = new TreeMap<>();
	        else
	            tm = new TreeMap<>(c);
	        m = tm;

	        // Read in size
	        int size = s.readInt();

	        tm.readTreeSet(size, s, PRESENT);
	    }

	    private static final long serialVersionUID = -2479143000061671589L;
	}
```