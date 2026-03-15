---
title: "【JDK源码阅读3-util】ArrayList"
date: 2016-11-05
category: 随笔杂谈
tags: []
---

一  ArrayList

本节主要看下List接口的主要实现类：ArrayList;

ArrayList是List接口的大小可变的数组的实现，底层是由数组实现存储的。

 ArrayList实现了Serializable接口，因此它支持序列化，能够通过序列化传输，

序列化本质是将对象转换为适合于网络传输的二进制

实现了RandomAccess接口，支持快速随机访问，实际上就是通过下标序号进行快速访问，

实现了Cloneable接口，能被克隆。

        所以其优点是访问速度快，可以根据指定位置迅速找到想要的元素；

        缺点是插入或删除元素比较麻烦(在下面阅读源码的过程中我们可以看到，指定位置插入一个元素时即将指定位置处元素及后面的所有元素整体右移，比较麻烦，删除原理相同)。 

```
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
{
}
```

下面是the fucking source code:

```
/**
	 * ArrayList:List接口的大小可变的数组的实现。
	 * @author WGS
	 * @param <E>
	 */
	public static class ArrayList<E> extends AbstractList<E>
	        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
	{
	    private static final long serialVersionUID = 8683452581122892189L;

	   //初始化大小，创建一个集合其大小即为DEFAULT_CAPACITY
	    private static final int DEFAULT_CAPACITY = 10;

	    //? 建立一个空的数组,final
	    private static final Object[] EMPTY_ELEMENTDATA = {};

	    //建立一个储存元素的数组。ArrayList底层实现即为数组
	    //这里字段声明为transient，表明字段不会被序列化
	    private transient Object[] elementData;

	    //集合的大小
	    private int size;

	    //创建一个具体的初始化容量的空集合
	    public ArrayList(int initialCapacity) {
	        super();
	        if (initialCapacity < 0)
	            throw new IllegalArgumentException("Illegal Capacity: "+
	                                               initialCapacity);
	        //初始化大小，集合内容为空
	        this.elementData = new Object[initialCapacity];
	    }

	    //创建一个大小为EMPTY_ELEMENTDATA=10的空集合
	    // Any empty ArrayList with elementData == EMPTY_ELEMENTDATA will be expanded to
	    //DEFAULT_CAPACITY when the first element is added.
	    public ArrayList() {
	        super();
	        this.elementData = EMPTY_ELEMENTDATA;
	    }

	    //创建一个含有特定collection的集合,元素按照他们的迭代器返回他们的顺序的
	    public ArrayList(Collection<? extends E> c) {
	        elementData = c.toArray();
	        size = elementData.length;
	        // c.toArray might (incorrectly) not return Object[] (see 6260652)
	        if (elementData.getClass() != Object[].class)
	            elementData = Arrays.copyOf(elementData, size, Object[].class);
	    }

	    //压缩当前集合。如当集合为大小为10，只存储了5个元素时，即可将ArrayList空间压缩为5
	    public void trimToSize() {
	        modCount++;//修改次数
	        if (size < elementData.length) {
	            elementData = Arrays.copyOf(elementData, size);
	        }
	    }

	    //申请minCapacity个空间
	    public void ensureCapacity(int minCapacity) {
	    	//获取默认的表的初始空间。
	    	//空表空间默认为0，不是空表默认为DEFAULT_CAPACITY(elementData != EMPTY_ELEMENTDATA：不是空表)
	        int minExpand = (elementData != EMPTY_ELEMENTDATA)? 0: DEFAULT_CAPACITY;

	        //只有要minCapacity大于表的默认空间(即我想要10(minCapacity)个空间大小的集合，当前表的大小为5，这时才重新分配空间)
	        if (minCapacity > minExpand) {
	            ensureExplicitCapacity(minCapacity);
	        }
	    }
	    
	  //申请minCapacity个空间
	    private void ensureCapacityInternal(int minCapacity) {
	        if (elementData == EMPTY_ELEMENTDATA) {//空表
	            minCapacity = Math.max(DEFAULT_CAPACITY, minCapacity);
	        }

	        ensureExplicitCapacity(minCapacity);//执行扩容
	    }

	    private void ensureExplicitCapacity(int minCapacity) {
	        modCount++;//集合大小改变的次数

	        //只有要minCapacity大于表的默认空间
	        if (minCapacity - elementData.length > 0)
	            grow(minCapacity);
	    }

	    //JVM支持MAX_ARRAY_SIZE容量的数组
	    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

	    //扩充集合容量,确保集合能容纳最小容量所指的的元素
	    private void grow(int minCapacity) {
	        // overflow-conscious code
	        int oldCapacity = elementData.length;
	        int newCapacity = oldCapacity + (oldCapacity >> 1);//扩容后新的容量是老容量的1.5倍
	        if (newCapacity - minCapacity < 0)
	            newCapacity = minCapacity;
	        if (newCapacity - MAX_ARRAY_SIZE > 0)
	            newCapacity = hugeCapacity(minCapacity);
	        // minCapacity is usually close to size, so this is a win:
	        elementData = Arrays.copyOf(elementData, newCapacity);
	    }

	    private static int hugeCapacity(int minCapacity) {
	        if (minCapacity < 0) // overflow
	            throw new OutOfMemoryError();
	        return (minCapacity > MAX_ARRAY_SIZE) ?
	            Integer.MAX_VALUE :
	            MAX_ARRAY_SIZE;
	    }

	    //返回集合的大小
	    public int size() {
	        return size;
	    }

	    //判断集合是否非空
	    public boolean isEmpty() {
	        return size == 0;
	    }

	   //判断集合是否包含元素o
	    public boolean contains(Object o) {
	        return indexOf(o) >= 0;
	    }

	    //返回指定元素o在指定集合中第一次出现的位置i，没有则返回-1(o可以为null)
	    public int indexOf(Object o) {
	        if (o == null) {
	            for (int i = 0; i < size; i++)
	                if (elementData[i]==null)
	                    return i;
	        } else {
	            for (int i = 0; i < size; i++)
	                if (o.equals(elementData[i]))
	                    return i;//返回位置i
	        }
	        return -1;//没有找到集合中的元素o，则返回-1
	    }

	    //返回指定元素o在指定集合中最后一次出现的位置i，没有则返回-1(o可以为null)
	    public int lastIndexOf(Object o) {
	        if (o == null) {
	            for (int i = size-1; i >= 0; i--)
	                if (elementData[i]==null)
	                    return i;
	        } else {
	            for (int i = size-1; i >= 0; i--)
	                if (o.equals(elementData[i]))
	                    return i;
	        }
	        return -1;
	    }

	    /**
	     * Returns a shallow copy of this <tt>ArrayList</tt> instance.  (The
	     * elements themselves are not copied.)
	     *
	     * @return a clone of this <tt>ArrayList</tt> instance
	     */
	    //？？？返回集合实例的浅副本(?)，元素本身不复制
	    public Object clone() {
	        try {
	            @SuppressWarnings("unchecked")
	                ArrayList<E> v = (ArrayList<E>) super.clone();
	            v.elementData = Arrays.copyOf(elementData, size);
	            v.modCount = 0;
	            return v;
	        } catch (CloneNotSupportedException e) {
	            // this shouldn't happen, since we are Cloneable
	            throw new InternalError();
	        }
	    }

	    //将集合转化为数组
	    public Object[] toArray() {
	        return Arrays.copyOf(elementData, size);
	    }

	    //转换为a类型的数组
	    @SuppressWarnings("unchecked")
	    public <T> T[] toArray(T[] a) {
	    	//指定数组小于列表大小，则分配一个具有指定数组a的类型，和此列表大小的size 新数组
	        if (a.length < size)
	            // Make a new array of a's runtime type, but my contents:
	            return (T[]) Arrays.copyOf(elementData, size, a.getClass());
	        
	        //指定数组能容纳列表，则直接复制并返回
	        System.arraycopy(elementData, 0, a, 0, size);
	        //指定数组a能容纳队列，即数组大小比队列多，则将数组尾部元素置为null
	        if (a.length > size)
	            a[size] = null;
	        return a;
	    }

	    // Positional Access Operations
	    //返回指定位置的元素
	    @SuppressWarnings("unchecked")
	    E elementData(int index) {
	        return (E) elementData[index];
	    }

	   //返回集合中指定位置的元素
	    public E get(int index) {
	        rangeCheck(index);//确保index小于集合容量
	        return elementData(index);
	    }

	    //将指定元素element插入到指定位置index处
	    //注意：返回值是原集合中index处的元素：oldValue
	    public E set(int index, E element) {
	        rangeCheck(index);

	        E oldValue = elementData(index);
	        elementData[index] = element;
	        return oldValue;
	    }

	   //添加元素到集合的尾部--添加成功返回true
	    public boolean add(E e) {
	        ensureCapacityInternal(size + 1);  // Increments modCount!!
//	        elementData[size++] = e;/添加元素到集合的尾部
	        return true;
	    }

	    //将元素插入到指定位置处，位置上的原元素及之后元素整体右移
	    public void add(int index, E element) {
	        rangeCheckForAdd(index);

	        ensureCapacityInternal(size + 1);  // Increments modCount!!
	        System.arraycopy(elementData, index, elementData, index + 1,
	                         size - index);//将原数组elementData从index开始的(size - index)段的 元素
	        							   //复制到数组elementData的index+1处(即后移一位)
	        elementData[index] = element;
	        size++;
	    }

	    //从集合中移除指定位置处的元素；
	    //原理：指定位置Index后的所有元素左移一位(覆盖index处所在的元素)
	    //返回的是index处所在的原元素
	    public E remove(int index) {
	        rangeCheck(index);

	        modCount++;
	        E oldValue = elementData(index);

	        int numMoved = size - index - 1;//计算从 index处后的元素个数(即将要左移的元素个数)
	        if (numMoved > 0)
	            System.arraycopy(elementData, index+1, elementData, index,
	                             numMoved);//将原数组elementData从index+1处，长度为numMoved长的所有元素
	        							   //复制到原数组elementData从index处(即左移一位)
	        elementData[--size] = null; // clear to let GC do its work,最后空的一位设置为null,交给GC处理

	        return oldValue;
	    }

	    //移除集合中第一次出现的元素o，没有返回false
	    public boolean remove(Object o) {
	        if (o == null) {
	            for (int index = 0; index < size; index++)
	                if (elementData[index] == null) {
	                    fastRemove(index);//此方法原理同上E remove(int index)
	                    return true;
	                }
	        } else {
	            for (int index = 0; index < size; index++)
	                if (o.equals(elementData[index])) {
	                    fastRemove(index);
	                    return true;
	                }
	        }
	        return false;
	    }

	    //E remove(int index)的一个快速实现，不返回值
	    private void fastRemove(int index) {
	        modCount++;
	        int numMoved = size - index - 1;
	        if (numMoved > 0)
	            System.arraycopy(elementData, index+1, elementData, index,
	                             numMoved);
	        elementData[--size] = null; // clear to let GC do its work
	    }

	    //清空集合
	    //原理：将所有元素置为null，大小置0 
	    public void clear() {
	        modCount++;

	        // clear to let GC do its work
	        for (int i = 0; i < size; i++)
	            elementData[i] = null;

	        size = 0;
	    }

	   //将集合c中元素添加到原集合尾部
	    public boolean addAll(Collection<? extends E> c) {
	        Object[] a = c.toArray();
	        int numNew = a.length;
	        ensureCapacityInternal(size + numNew);  // Increments modCount
	        System.arraycopy(a, 0, elementData, size, numNew);
	        size += numNew;
	        return numNew != 0;
	    }

	    //将集合中元素添加到原集合指定位置处
	    public boolean addAll(int index, Collection<? extends E> c) {
	        rangeCheckForAdd(index);

	        Object[] a = c.toArray();
	        int numNew = a.length;
	        ensureCapacityInternal(size + numNew);  // Increments modCount

	        int numMoved = size - index;
	        if (numMoved > 0)
	            System.arraycopy(elementData, index, elementData, index + numNew,
	                             numMoved);//先将原集合index处及之后元素复制到index + numNew处，即整体右移numMoved

	        System.arraycopy(a, 0, elementData, index, numNew);
	        size += numNew;
	        return numNew != 0;
	    }

	    //移除指定位置处的元素(包括fromIndex，不包括toIndex)
	    protected void removeRange(int fromIndex, int toIndex) {
	        modCount++;
	        int numMoved = size - toIndex;
	        System.arraycopy(elementData, toIndex, elementData, fromIndex,
	                         numMoved);//将原集合中从toIndex处元素及之后的元素复制到fromIndex处，及左移
	        // clear to let GC do its work
	        int newSize = size - (toIndex-fromIndex);
	        for (int i = newSize; i < size; i++) {
	            elementData[i] = null;
	        }
	        size = newSize;
	    }

	    //检查index是否在范围内
	    private void rangeCheck(int index) {
	        if (index >= size)
	            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
	    }

	    private void rangeCheckForAdd(int index) {
	        if (index > size || index < 0)
	            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
	    }

	    //创建一个范围超标的具体信息
	    private String outOfBoundsMsg(int index) {
	        return "Index: "+index+", Size: "+size;
	    }

	    //删除原集合中与c集合相同的元素
	    public boolean removeAll(Collection<?> c) {
	        return batchRemove(c, false);
	    }

	    //保留与c集合相同的元素；即删除与c集合不同的元素
	    public boolean retainAll(Collection<?> c) {
	        return batchRemove(c, true);
	    }

	    //批量删除
	    private boolean batchRemove(Collection<?> c, boolean complement) {
	        final Object[] elementData = this.elementData;
	        int r = 0, w = 0;
	        boolean modified = false;
	        try {
	            for (; r < size; r++)
	                if (c.contains(elementData[r]) == complement)
	                    elementData[w++] = elementData[r];
	        } finally {
	            // Preserve behavioral compatibility with AbstractCollection,
	            // even if c.contains() throws.
	            if (r != size) {
	                System.arraycopy(elementData, r,
	                                 elementData, w,
	                                 size - r);
	                w += size - r;
	            }
	            if (w != size) {
	                // clear to let GC do its work
	                for (int i = w; i < size; i++)
	                    elementData[i] = null;
	                modCount += size - w;
	                size = w;
	                modified = true;
	            }
	        }
	        return modified;
	    }

	    //？序列化
	    private void writeObject(java.io.ObjectOutputStream s)
	        throws java.io.IOException{
	        // Write out element count, and any hidden stuff
	        int expectedModCount = modCount;
	        s.defaultWriteObject();

	        // Write out size as capacity for behavioural compatibility with clone()
	        s.writeInt(size);

	        // Write out all elements in the proper order.
	        for (int i=0; i<size; i++) {
	            s.writeObject(elementData[i]);
	        }

	        if (modCount != expectedModCount) {
	            throw new ConcurrentModificationException();
	        }
	    }

	    //？反序列化
	    private void readObject(java.io.ObjectInputStream s)
	        throws java.io.IOException, ClassNotFoundException {
	        elementData = EMPTY_ELEMENTDATA;

	        // Read in size, and any hidden stuff
	        s.defaultReadObject();

	        // Read in capacity
	        s.readInt(); // ignored

	        if (size > 0) {
	            // be like clone(), allocate array based upon size not capacity
	            ensureCapacityInternal(size);

	            Object[] a = elementData;
	            // Read in all elements in the proper order.
	            for (int i=0; i<size; i++) {
	                a[i] = s.readObject();
	            }
	        }
	    }

	    /**
	     * Returns a list iterator over the elements in this list (in proper
	     * sequence), starting at the specified position in the list.
	     * The specified index indicates the first element that would be
	     * returned by an initial call to {@link ListIterator#next next}.
	     * An initial call to {@link ListIterator#previous previous} would
	     * return the element with the specified index minus one.
	     *
	     * <p>The returned list iterator is <a href="#fail-fast"><i>fail-fast</i></a>.
	     *
	     * @throws IndexOutOfBoundsException {@inheritDoc}
	     */
	    //从指定位置处输出元素的双向迭代器
	    public ListIterator<E> listIterator(int index) {
	        if (index < 0 || index > size)
	            throw new IndexOutOfBoundsException("Index: "+index);
	        return new ListItr(index);
	    }

	    /**
	     * Returns a list iterator over the elements in this list (in proper
	     * sequence).
	     *
	     * <p>The returned list iterator is <a href="#fail-fast"><i>fail-fast</i></a>.
	     *
	     * @see #listIterator(int)
	     */
	    //输出一个双向迭代器
	    public ListIterator<E> listIterator() {
	        return new ListItr(0);
	    }

	    /**
	     * Returns an iterator over the elements in this list in proper sequence.
	     *
	     * <p>The returned iterator is <a href="#fail-fast"><i>fail-fast</i></a>.
	     *
	     * @return an iterator over the elements in this list in proper sequence
	     */
	    //返回迭代器
	    public Iterator<E> iterator() {
	        return new Itr();
	    }

	    //私有内部类，输出从第0个元素开始的迭代器
	    private class Itr implements Iterator<E> {
	        int cursor;       // index of next element to return
	        int lastRet = -1; // index of last element returned; -1 if no such
	        int expectedModCount = modCount;

	        public boolean hasNext() {
	            return cursor != size;//cursor == size,即到集合最后一个位置，没有下一个了，返回false
	        }

	        @SuppressWarnings("unchecked")
	        public E next() {
	            checkForComodification();
	            int i = cursor;
	            if (i >= size)
	                throw new NoSuchElementException();
	            Object[] elementData = ArrayList.this.elementData;
	            if (i >= elementData.length)
	                throw new ConcurrentModificationException();
	            cursor = i + 1;
	            return (E) elementData[lastRet = i];
	        }

	        public void remove() {
	            if (lastRet < 0)
	                throw new IllegalStateException();
	            checkForComodification();

	            try {
	                ArrayList.this.remove(lastRet);
	                cursor = lastRet;
	                lastRet = -1;
	                expectedModCount = modCount;
	            } catch (IndexOutOfBoundsException ex) {
	                throw new ConcurrentModificationException();
	            }
	        }

	        final void checkForComodification() {
	            if (modCount != expectedModCount)
	                throw new ConcurrentModificationException();
	        }
	    }

	    //私有内部类，输出从Index开始的双向迭代器
	    private class ListItr extends Itr implements ListIterator<E> {
	        ListItr(int index) {
	            super();
	            cursor = index;
	        }

	        public boolean hasPrevious() {
	            return cursor != 0;
	        }

	        public int nextIndex() {
	            return cursor;
	        }

	        public int previousIndex() {
	            return cursor - 1;
	        }

	        @SuppressWarnings("unchecked")
	        public E previous() {
	            checkForComodification();
	            int i = cursor - 1;
	            if (i < 0)
	                throw new NoSuchElementException();
	            Object[] elementData = ArrayList.this.elementData;
	            if (i >= elementData.length)
	                throw new ConcurrentModificationException();
	            cursor = i;
	            return (E) elementData[lastRet = i];
	        }

	        public void set(E e) {
	            if (lastRet < 0)
	                throw new IllegalStateException();
	            checkForComodification();

	            try {
	                ArrayList.this.set(lastRet, e);
	            } catch (IndexOutOfBoundsException ex) {
	                throw new ConcurrentModificationException();
	            }
	        }

	        public void add(E e) {
	            checkForComodification();

	            try {
	                int i = cursor;
	                ArrayList.this.add(i, e);
	                cursor = i + 1;
	                lastRet = -1;
	                expectedModCount = modCount;
	            } catch (IndexOutOfBoundsException ex) {
	                throw new ConcurrentModificationException();
	            }
	        }
	    }

	   //截取部分链表
	    public List<E> subList(int fromIndex, int toIndex) {
	        subListRangeCheck(fromIndex, toIndex, size);
	        return new SubList(this, 0, fromIndex, toIndex);
	    }

	    static void subListRangeCheck(int fromIndex, int toIndex, int size) {
	        if (fromIndex < 0)
	            throw new IndexOutOfBoundsException("fromIndex = " + fromIndex);
	        if (toIndex > size)
	            throw new IndexOutOfBoundsException("toIndex = " + toIndex);
	        if (fromIndex > toIndex)
	            throw new IllegalArgumentException("fromIndex(" + fromIndex +
	                                               ") > toIndex(" + toIndex + ")");
	    }
```

后面代码略..  
  