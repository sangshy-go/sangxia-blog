---
title: "【JDK源码阅读4-util】Collection-List---LinkedList"
date: 2016-11-06
category: 随笔杂谈
tags: []
---

(二)LinkedList实现类

### java.util 类 LinkedList<E>

```
java.lang.Object
  ![继承者 ]()java.util.AbstractCollection<E>
      ![继承者 ]()java.util.AbstractList<E>
          ![继承者 ]()java.util.AbstractSequentialList<E>
              ![继承者 ]()java.util.LinkedList<E>
```

如图：class LinkedList<E> extends AbstractSequentialList<E>  
                                                         implements List<E>, Deque<E>, Cloneable, java.io.Serializable

List 接口的链接列表实现。实现所有可选的列表操作，并且允许所有元素（包括null）。

                 除了实现 List 接口外，LinkedList 类还为在列表的开头及结尾get、remove 和  insert 元素提供了统一的命名方法。

 这些操作允许将链接列表用作堆栈、队列或双端队列。

上述是JDK中对LinkedList的描述。LinkedList实现类与上节所述的ArrayList实现类同为List接口的实现类，

这两者有什么区别呢？

上节已经说过，ArrayList底层是由数组实现存储的，因此在查询数据方法有大的优势；

但是在插入或者删除数据的时候必须将数组中元素整体向左或右位移，所以就不适合频繁的删除或插入数据；

而本节谈论的LinkedList底层存储的结构使用的链式表(阅读源码后即能理解)，实际上可以理解为LinkedList就是一种双向循环链表的链式线性表。

由于采用的是链式表结构，所以查询数据需要一个一个从头查询，随机访问速度较慢；

但是对于频繁的删除或插入数据很高效(采用前向后向双指针，插入或删除数据的时候直接操作指针即可);

       LinkedList同ArrayList一样，都是非同步的。多线程访问同一个链表的时候，要进行如下操作;

```
      List list = Collections.synchronizedList(new LinkedList(...));
```

        让我们看一下LinkedList链表的内部结构,直接看源码：

```
//结点的结构
    private static class Node<E> {
        E item;//结点值
        Node<E> next;//前向指针
        Node<E> prev;//后向指针

        //构造器
        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }
```

![](https://img-blog.csdn.net/20161106205727424?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)
  

下面是LinkedList中一些主要的实现方法，阅读后有种醍醐灌顶的感觉，能很清晰地了解linkedList插入删除数据的实现(这里有很多疑惑，如删除他写了好几种方法来实现，为什么要这样做？？？)：

```
 //链表首部插入结点e
    /**
     * 	        结点newNode: |null | e | f | 
     *   
     * 			    f>>
     *   插入到头结点：》》  |first| * | *  |last |  
     * @param e
     */
    private void linkFirst(E e) {
        final Node<E> f = first;//f指向头结点(保存着老的头结点的信息)
        final Node<E> newNode = new Node<>(null, e, f);//生成一个新结点，值为e,前向指针为null,后向指针为f
        first = newNode;//头结点first指向新生成的结点
        if (f == null)
            last = newNode;//如果f为空，代表原链表均为空，则直接由尾部结点指向新生结点
        else
            f.prev = newNode;//如果f不为空，则将新生结点插入到链表头结点
        					 //f保存了原结点的头结点信息，即指向头结点
        size++;//链表大小+1
        modCount++;//修改次数+1
    }

    //链表尾部添加结点e
    void linkLast(E e) {
        final Node<E> l = last;//l 指向为尾部结点
        final Node<E> newNode = new Node<>(l, e, null);//生成一个新结点，值为e,前向指针为l,后向指针为null
        last = newNode;//尾部结点last指向新生成的结点
        if (l == null)
            first = newNode;//如果l为空，代表原链表均为空，则头结点也指向newNode
        else
            l.next = newNode;//否则，尾结点的后向指针指向新生结点(即在尾部添加上新生结点)
        size++;//链表大小+1
        modCount++;//修改次数+1
    }

    //在非空结点succ前插入结点e
    void linkBefore(E e, Node<E> succ) {
        // assert succ != null;//使用断言，确保结点succ非空
        final Node<E> pred = succ.prev;//pred结点指向succ的前向结点
        
      //生成一个将要被添加的新的结点，值为e,前向指针为pred，后向指针为succ
        final Node<E> newNode = new Node<>(pred, e, succ);
        succ.prev = newNode;//因为插入到succ之前，所以succ前向指针指向新生结点newNode
        //如果pred为null，
        if (pred == null)
            first = newNode;//pred为null，表示succ为头结点，此时头结点直接指向待插入结点newNode
        else
            pred.next = newNode;//pred后向指针指向待插入结点newNode，表明已完成结点的插入操作
        						//因为pred结点指向succ的前向结点，pred后向指针指向待插入结点newNode
        						//则表明待插入结点newNode在pred后，succ前
        size++;
        modCount++;
    }

    //删除头结点，并返回该结点的值
    private E unlinkFirst(Node<E> f) {
        // assert f == first && f != null;//确保结点f为头结点并且非空
        final E element = f.item;//获取头结点值(删除成功后返回此结点值)
        final Node<E> next = f.next;//结点next指向待删结点f的后向指针
        f.item = null;
        f.next = null; // help GC
        first = next;//first指向next结点(f的后向结点)
        if (next == null)
            last = null;//next为null,说明f的后向指针为null,则删除f后整个链表为空，则last也为null
        else
            next.prev = null;//next!=null ,在删除f结点后(头结点被删除后)，next变为头结点
        					//所以要将next前向指针变为null（因为first结点的前向指针为null）
        size--;
        modCount++;
        return element;
    }

    //删除尾结点，并返回该结点的值
    private E unlinkLast(Node<E> l) {
        // assert l == last && l != null;//断言确保l为尾结点，非空
        final E element = l.item;//获取待删结点l值并返回
        final Node<E> prev = l.prev;//结点prev指向待删结点的前向指针(即获取l的前向结点)
        l.item = null;//置空
        l.prev = null; // help GC
        last = prev;//last指针指向prev结点
        if (prev == null)
            first = null;//若prev结点为null(即待删结点l前向指针为空，说明l也为头结点，删除后整个链表为空)，则first=null
        else
            prev.next = null;//否则，将prev结点后的后向指针置空(此时l结点被删除)
        size--;
        modCount++;
        return element;
    }

    //删除非空结点x
    E unlink(Node<E> x) {
        // assert x != null;
        final E element = x.item;
        final Node<E> next = x.next;//获取待删结点x的前向结点
        final Node<E> prev = x.prev;//获取待删结点x的后向结点

        if (prev == null) {
            first = next;//前向结点为空(即x.prev==null，说明头结点)，删除x结点后，头指针first直接指向x的后向结点next
        } else {
            prev.next = next;//前向结点非空，正常删除，删除x后，前向结点的后向指针（next）直接指向后向结点next
            				 //此处不要被next搞混淆，前next是指针，后next是next结点
            x.prev = null;//同时待删结点的前向指针置空
        }
        
        //处理后向结点，方法同上
        if (next == null) {
            last = prev;
        } else {
            next.prev = prev;
            x.next = null;
        }

        x.item = null;//置空，GC处理
        size--;
        modCount++;
        return element;
    }
```

  

LinkedList其余的实现删除插入等功能的方法中全部都调用上述几个方法，所以上述方法对于了解LinkedList的工作机制还是很有帮助的。下面是LinkedList增删改查的 几个方法，可以联系ArrayList进行对比下：

```
 /************************************LinkedList的增删改查*********************************************/
    //查询:获取链表中指定位置处的元素的值
    public E get(int index) {
        checkElementIndex(index);//检查是否越界
        return node(index).item;//调用 Node<E> node(int index)，使用二分查找法遍历index个位置处的元素
    }

    //改：将指定位置处元素替换为element
    //过程：获取原index位置处元素置返回，替换为element
    public E set(int index, E element) {
        checkElementIndex(index);//检查是否越界
        Node<E> x = node(index);//获取第index个位置处的元素
        E oldVal = x.item;//获取原index位置处的值并返回
        x.item = element;//替换
        return oldVal;
    }

    //增：将指定元素插入到指定位置处
    public void add(int index, E element) {
        checkPositionIndex(index);//检查是否越界

        if (index == size)
            linkLast(element);//若index即为链表尾部的位置，就直接在链表尾部插入
        else
            linkBefore(element, node(index));//否则，调用方法void linkBefore(E e, Node<E> succ) 
        							         //在非空结点succ前插入结点e
        
    }

    //删：直接移除指定位置处元素
    public E remove(int index) {
        checkElementIndex(index);
        return unlink(node(index));
    }
/*******************************-------------End--------------***********************************/
```

  
LinkedList还实现了队列等的操作，这里就不一一赘述了，直接看下面的LinkedList的整个源码

(小白第一次看，解释不到位，以后再进行改正)：

```
public class LinkedList<E> extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
  {
	//链表目前元素个数
    transient int size = 0;
    //链表头结点
    transient Node<E> first;
    //链表尾结点
    transient Node<E> last;

    //生产一个空构造器
    public LinkedList() {
    }

    //构造一个包含指定Collection元素的列表
    public LinkedList(Collection<? extends E> c) {
        this();
        addAll(c);
    }

    //链表首部插入结点e
    /**
     * 	        结点newNode: |null | e | f | 
     *   
     * 			    f>>
     *   插入到头结点：》》  |first| * | *  |last |  
     * @param e
     */
    private void linkFirst(E e) {
        final Node<E> f = first;//f指向头结点(保存着老的头结点的信息)
        final Node<E> newNode = new Node<>(null, e, f);//生成一个新结点，值为e,前向指针为null,后向指针为f
        first = newNode;//头结点first指向新生成的结点
        if (f == null)
            last = newNode;//如果f为空，代表原链表均为空，则直接由尾部结点指向新生结点
        else
            f.prev = newNode;//如果f不为空，则将新生结点插入到链表头结点
        					 //f保存了原结点的头结点信息，即指向头结点
        size++;//链表大小+1
        modCount++;//修改次数+1
    }

    //链表尾部添加结点e
    void linkLast(E e) {
        final Node<E> l = last;//l 指向为尾部结点
        final Node<E> newNode = new Node<>(l, e, null);//生成一个新结点，值为e,前向指针为l,后向指针为null
        last = newNode;//尾部结点last指向新生成的结点
        if (l == null)
            first = newNode;//如果l为空，代表原链表均为空，则头结点也指向newNode
        else
            l.next = newNode;//否则，尾结点的后向指针指向新生结点(即在尾部添加上新生结点)
        size++;//链表大小+1
        modCount++;//修改次数+1
    }

    //在非空结点succ前插入结点e
    void linkBefore(E e, Node<E> succ) {
        // assert succ != null;//使用断言，确保结点succ非空
        final Node<E> pred = succ.prev;//pred结点指向succ的前向结点
        
      //生成一个将要被添加的新的结点，值为e,前向指针为pred，后向指针为succ
        final Node<E> newNode = new Node<>(pred, e, succ);
        succ.prev = newNode;//因为插入到succ之前，所以succ前向指针指向新生结点newNode
        //如果pred为null，
        if (pred == null)
            first = newNode;//pred为null，表示succ为头结点，此时头结点直接指向待插入结点newNode
        else
            pred.next = newNode;//pred后向指针指向待插入结点newNode，表明已完成结点的插入操作
        						//因为pred结点指向succ的前向结点，pred后向指针指向待插入结点newNode
        						//则表明待插入结点newNode在pred后，succ前
        size++;
        modCount++;
    }

    //删除头结点，并返回该结点的值
    private E unlinkFirst(Node<E> f) {
        // assert f == first && f != null;//确保结点f为头结点并且非空
        final E element = f.item;//获取头结点值(删除成功后返回此结点值)
        final Node<E> next = f.next;//结点next指向待删结点f的后向指针
        f.item = null;
        f.next = null; // help GC
        first = next;//first指向next结点(f的后向结点)
        if (next == null)
            last = null;//next为null,说明f的后向指针为null,则删除f后整个链表为空，则last也为null
        else
            next.prev = null;//next!=null ,在删除f结点后(头结点被删除后)，next变为头结点
        					//所以要将next前向指针变为null（因为first结点的前向指针为null）
        size--;
        modCount++;
        return element;
    }

    //删除尾结点，并返回该结点的值
    private E unlinkLast(Node<E> l) {
        // assert l == last && l != null;//断言确保l为尾结点，非空
        final E element = l.item;//获取待删结点l值并返回
        final Node<E> prev = l.prev;//结点prev指向待删结点的前向指针(即获取l的前向结点)
        l.item = null;//置空
        l.prev = null; // help GC
        last = prev;//last指针指向prev结点
        if (prev == null)
            first = null;//若prev结点为null(即待删结点l前向指针为空，说明l也为头结点，删除后整个链表为空)，则first=null
        else
            prev.next = null;//否则，将prev结点后的后向指针置空(此时l结点被删除)
        size--;
        modCount++;
        return element;
    }

    //删除非空结点x
    E unlink(Node<E> x) {
        // assert x != null;
        final E element = x.item;
        final Node<E> next = x.next;//获取待删结点x的前向结点
        final Node<E> prev = x.prev;//获取待删结点x的后向结点

        if (prev == null) {
            first = next;//前向结点为空(即x.prev==null，说明头结点)，删除x结点后，头指针first直接指向x的后向结点next
        } else {
            prev.next = next;//前向结点非空，正常删除，删除x后，前向结点的后向指针（next）直接指向后向结点next
            				 //此处不要被next搞混淆，前next是指针，后next是next结点
            x.prev = null;//同时待删结点的前向指针置空
        }
        
        //处理后向结点，方法同上
        if (next == null) {
            last = prev;
        } else {
            next.prev = prev;
            x.next = null;
        }

        x.item = null;//置空，GC处理
        size--;
        modCount++;
        return element;
    }

    //返回链表中的头结点的值 
    public E getFirst() {
        final Node<E> f = first;
        if (f == null)
            throw new NoSuchElementException();
        return f.item;
    }

    //返回集合中尾结点的值
    public E getLast() {
        final Node<E> l = last;
        if (l == null)
            throw new NoSuchElementException();
        return l.item;
    }

    //移除头结点(注意与上面移除头结点方法 private E unlinkFirst(Node<E> f)区别，这里调用了上面的方法)
    public E removeFirst() {
        final Node<E> f = first;
        if (f == null)
            throw new NoSuchElementException();
        return unlinkFirst(f);
    }

    //移除链表尾结点，调用上述方法private E unlinkLast(Node<E> l) 
    public E removeLast() {
        final Node<E> l = last;
        if (l == null)
            throw new NoSuchElementException();
        return unlinkLast(l);
    }

    //链表首部插入具体的值，调用上面的方法private void linkFirst(E e) 
    public void addFirst(E e) {
        linkFirst(e);
    }

    ///链表尾部插入具体的值e，调用上述方法void linkLast(E e) 
    public void addLast(E e) {
        linkLast(e);
    }

    //判断元素O是否在链表中
    public boolean contains(Object o) {
        return indexOf(o) != -1;//通过调用 public int indexOf(Object o)方法来判断是否含有元素o
        						//若链表中含有元素o,则其位置index>=0
    }

    //返回链表的大小
    public int size() {
        return size;
    }

    //在链表尾部加入元素e,返回true
    //注意同上方法 public void addFirst(E e) 区别
    public boolean add(E e) {
        linkLast(e);//将元素e插入到尾部
        return true;
    }

    //删除链表中第一次出现的元素o(从头开始遍历)
    //没有删除最后一次出现的元素的方法吧？
    public boolean remove(Object o) {
        if (o == null) {
            for (Node<E> x = first; x != null; x = x.next) {//从头开始遍历
                if (x.item == null) {//找到一个值
                    unlink(x);//删除元素
                    return true;
                }
            }
        } else {
            for (Node<E> x = first; x != null; x = x.next) {
                if (o.equals(x.item)) {
                    unlink(x);
                    return true;
                }
            }
        }
        return false;
    }

    //将集合中所有元素都添加到链表尾部,返回boolean
    public boolean addAll(Collection<? extends E> c) {
        return addAll(size, c);
    }

    //将集合中元素插入到指定位置处
    public boolean addAll(int index, Collection<? extends E> c) {
        checkPositionIndex(index);//检查index是否越界

        Object[] a = c.toArray();//将将要添加的集合转化为数组
        int numNew = a.length;//获取待添加集合元素大小
        if (numNew == 0)
            return false;//大小为0的时候，就不要添加了

        Node<E> pred, succ;//定义两个结点，succ代表待插入的第index个结点，pred为succ的前向结点
        if (index == size) {//若index为原链表大小，即第index个结点为尾结点
            succ = null;//succ为null,即直接在原链表尾部添加元素
            pred = last;//指向尾结点  
        } else {
            succ = node(index);//succ指向第index个结点(可以理解为获取第index个元素)
            pred = succ.prev;//pred指向succ的前向结点
        }

        for (Object o : a) {
            @SuppressWarnings("unchecked") E e = (E) o;
            Node<E> newNode = new Node<>(pred, e, null);//将数组中每个元素转化为结点的形式，两个前后向指针
            if (pred == null)
                first = newNode;//若pred为Null,说明e为头结点，first直接指向newNode
            else
                pred.next = newNode;//否则pred后向指针指向newNode
            pred = newNode;//pred结点指向newNode
            //注意这里：pred后向指针本来指向第index个元素，现在指向newNode,即将newNode插入到第index个位置处
        }
        
        //上述for循环后将所有元素均插入到链表指定位置index位置处,此时pred指向为最后一个添加的元素
        if (succ == null) {
            last = pred;//若succ为null,此时last指针直接指向添加的集合中的最后一个元素(即在原集合中尾部添加元素)
        } else {
            pred.next = succ;//否则,pred的后向指针指向succ（即添加的最后一个元素的后向指针指向原index位置处的succ）
            succ.prev = pred;//同时succ的前向指针指向pred
        }

        size += numNew;//链表大小改变
        modCount++;
        return true;
    }

    //清空链表
    public void clear() {
        for (Node<E> x = first; x != null; ) {
            Node<E> next = x.next;//先保存后向结点
            x.item = null;//释放结点值，交由GC处理
            x.next = null;//释放后向指针
            x.prev = null;//释放前向指针
            x = next;//遍历下个结点
        }
        first = last = null;//释放链表首尾指针
        size = 0;
        modCount++;
    }
    	
    /************************************LinkedList的增删改查*********************************************/
    //查询:获取链表中指定位置处的元素的值
    public E get(int index) {
        checkElementIndex(index);//检查是否越界
        return node(index).item;//调用 Node<E> node(int index)，使用二分查找法遍历index个位置处的元素
    }

    //改：将指定位置处元素替换为element
    //过程：获取原index位置处元素置返回，替换为element
    public E set(int index, E element) {
        checkElementIndex(index);//检查是否越界
        Node<E> x = node(index);//获取第index个位置处的元素
        E oldVal = x.item;//获取原index位置处的值并返回
        x.item = element;//替换
        return oldVal;
    }

    //增：将指定元素插入到指定位置处
    public void add(int index, E element) {
        checkPositionIndex(index);//检查是否越界

        if (index == size)
            linkLast(element);//若index即为链表尾部的位置，就直接在链表尾部插入
        else
            linkBefore(element, node(index));//否则，调用方法void linkBefore(E e, Node<E> succ) 
        							         //在非空结点succ前插入结点e
        
    }

    //删：直接移除指定位置处元素
    public E remove(int index) {
        checkElementIndex(index);
        return unlink(node(index));
    }
/*******************************-------------End--------------***********************************/
    //判断index是否是链表中元素的下标
    private boolean isElementIndex(int index) {
        return index >= 0 && index < size;
    }

  	//判断index是否是链表中元素的下标(与上的区别？)
    private boolean isPositionIndex(int index) {
        return index >= 0 && index <= size;
    }

    //越界信息
    private String outOfBoundsMsg(int index) {
        return "Index: "+index+", Size: "+size;
    }

    //检测index是否越界：
    private void checkElementIndex(int index) {
        if (!isElementIndex(index))
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }
    //检测index是否越界：
    private void checkPositionIndex(int index) {
        if (!isPositionIndex(index))
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }

    //获取指定位置处的结点
    Node<E> node(int index) {
        // assert isElementIndex(index);
    	//二分查找法,优化查询速率
        if (index < (size >> 1)) {//小于一半，从头找
            Node<E> x = first;
            for (int i = 0; i < index; i++)
                x = x.next;
            return x;
        } else {//大于一半，从尾部找
            Node<E> x = last;
            for (int i = size - 1; i > index; i--)
                x = x.prev;
            return x;
        }
    }

    //返回元素o在链表中第一次出现的位置；没有则返回-1
    public int indexOf(Object o) {
        int index = 0;
        if (o == null) {//这里的判断方法大同小异。都要判断是否为null，再逐个判断值
            for (Node<E> x = first; x != null; x = x.next) {
                if (x.item == null)
                    return index;
                index++;
            }
        } else {
            for (Node<E> x = first; x != null; x = x.next) {
                if (o.equals(x.item))
                    return index;
                index++;
            }
        }
        return -1;
    }

    //获取结点o在链表中最后一次出现的位置
    //思想：从尾到头遍历，第一次出现的位置即为  o在链表中最后一次出现的位置
    public int lastIndexOf(Object o) {
        int index = size;
        if (o == null) {
            for (Node<E> x = last; x != null; x = x.prev) {
                index--;
                if (x.item == null)
                    return index;
            }
        } else {
            for (Node<E> x = last; x != null; x = x.prev) {
                index--;
                if (o.equals(x.item))
                    return index;
            }
        }
        return -1;
    }

    /************************-----Queue：队列操作------****************************************/
    //实现队列操作，返回第一个元素的值
    public E peek() {
        final Node<E> f = first;
        return (f == null) ? null : f.item;
    }

    //实现队列操作，返回第一个元素的值
    public E element() {
        return getFirst();
    }

    //实现队列操作，弹出结点(得到其值)
    public E poll() {
        final Node<E> f = first;
        return (f == null) ? null : unlinkFirst(f);
    }

    //实现队列操作，删除结点
    public E remove() {
        return removeFirst();
    }

    //添加结点
    public boolean offer(E e) {
        return add(e);
    }
    /************************-----Queue：队列操作:>End-----****************************************/
    
    /************************-----Deque：双向队列操作:>End-----****************************************/
    //添加头结点
    public boolean offerFirst(E e) {
        addFirst(e);
        return true;
    }

    //添加尾结点
    public boolean offerLast(E e) {
        addLast(e);
        return true;
    }

    //返回头结点的值
    public E peekFirst() {
        final Node<E> f = first;
        return (f == null) ? null : f.item;
     }

    //返回尾结点的值
    public E peekLast() {
        final Node<E> l = last;
        return (l == null) ? null : l.item;
    }

    //弹出第一个结点
    public E pollFirst() {
        final Node<E> f = first;
        return (f == null) ? null : unlinkFirst(f);
    }

    //弹出最后一个结点
    public E pollLast() {
        final Node<E> l = last;
        return (l == null) ? null : unlinkLast(l);
    }

    //添加头部结点
    public void push(E e) {
        addFirst(e);
    }

    //弹出第一个结点
    public E pop() {
        return removeFirst();
    }

    //删除值为o的结点
    public boolean removeFirstOccurrence(Object o) {
        return remove(o);
    }

    //删除最后一次出现的值为o的结点
    public boolean removeLastOccurrence(Object o) {
        if (o == null) {
            for (Node<E> x = last; x != null; x = x.prev) {
                if (x.item == null) {
                    unlink(x);
                    return true;
                }
            }
        } else {
            for (Node<E> x = last; x != null; x = x.prev) {
                if (o.equals(x.item)) {
                    unlink(x);
                    return true;
                }
            }
        }
        return false;
    }

    //返回双向迭代器
    public ListIterator<E> listIterator(int index) {
        checkPositionIndex(index);
        return new ListItr(index);
    }
    //私有内部类，实现双向迭代器
    private class ListItr implements ListIterator<E> {
        private Node<E> lastReturned = null;
        private Node<E> next;
        private int nextIndex;
        private int expectedModCount = modCount;

        ListItr(int index) {
            // assert isPositionIndex(index);
            next = (index == size) ? null : node(index);
            nextIndex = index;
        }

        public boolean hasNext() {
            return nextIndex < size;
        }

        public E next() {
            checkForComodification();
            if (!hasNext())
                throw new NoSuchElementException();

            lastReturned = next;
            next = next.next;
            nextIndex++;
            return lastReturned.item;
        }

        public boolean hasPrevious() {
            return nextIndex > 0;
        }

        public E previous() {
            checkForComodification();
            if (!hasPrevious())
                throw new NoSuchElementException();

            lastReturned = next = (next == null) ? last : next.prev;
            nextIndex--;
            return lastReturned.item;
        }

        public int nextIndex() {
            return nextIndex;
        }

        public int previousIndex() {
            return nextIndex - 1;
        }

        public void remove() {
            checkForComodification();
            if (lastReturned == null)
                throw new IllegalStateException();

            Node<E> lastNext = lastReturned.next;
            unlink(lastReturned);
            if (next == lastReturned)
                next = lastNext;
            else
                nextIndex--;
            lastReturned = null;
            expectedModCount++;
        }

        public void set(E e) {
            if (lastReturned == null)
                throw new IllegalStateException();
            checkForComodification();
            lastReturned.item = e;
        }

        public void add(E e) {
            checkForComodification();
            lastReturned = null;
            if (next == null)
                linkLast(e);
            else
                linkBefore(e, next);
            nextIndex++;
            expectedModCount++;
        }

        final void checkForComodification() {
            if (modCount != expectedModCount)
                throw new ConcurrentModificationException();
        }
    }

    //结点的结构
    private static class Node<E> {
        E item;//结点值
        Node<E> next;//前向指针
        Node<E> prev;//后向指针

        //构造器
        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }

    /**
     * @since 1.6
     */
    public Iterator<E> descendingIterator() {
        return new DescendingIterator();
    }

    /**
     * Adapter to provide descending iterators via ListItr.previous
     */
    private class DescendingIterator implements Iterator<E> {
        private final ListItr itr = new ListItr(size());
        public boolean hasNext() {
            return itr.hasPrevious();
        }
        public E next() {
            return itr.previous();
        }
        public void remove() {
            itr.remove();
        }
    }

    @SuppressWarnings("unchecked")
    private LinkedList<E> superClone() {
        try {
            return (LinkedList<E>) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new InternalError();
        }
    }

    //拷贝操作：浅拷贝？？
    public Object clone() {
        LinkedList<E> clone = superClone();

        // Put clone into "virgin" state
        clone.first = clone.last = null;
        clone.size = 0;
        clone.modCount = 0;

        // Initialize clone with our elements
        for (Node<E> x = first; x != null; x = x.next)
            clone.add(x.item);

        return clone;
    }

    //转换为数组
    //过程：从头到尾遍历链表，将每个结点的值加入到数组中
    public Object[] toArray() {
        Object[] result = new Object[size];
        int i = 0;
        for (Node<E> x = first; x != null; x = x.next)
            result[i++] = x.item;
        return result;
    }

    //转化为指定类型的数组
    @SuppressWarnings("unchecked")
    public <T> T[] toArray(T[] a) {
        if (a.length < size)
            a = (T[])java.lang.reflect.Array.newInstance(
                                a.getClass().getComponentType(), size);
        int i = 0;
        Object[] result = a;
        for (Node<E> x = first; x != null; x = x.next)
            result[i++] = x.item;

        if (a.length > size)
            a[size] = null;

        return a;
    }

    private static final long serialVersionUID = 876323262645176354L;

    //序列化
    private void writeObject(java.io.ObjectOutputStream s)
        throws java.io.IOException {
        // Write out any hidden serialization magic
        s.defaultWriteObject();

        // Write out size
        s.writeInt(size);

        // Write out all elements in the proper order.
        for (Node<E> x = first; x != null; x = x.next)
            s.writeObject(x.item);
    }

    //反序列化
    @SuppressWarnings("unchecked")
    private void readObject(java.io.ObjectInputStream s)
        throws java.io.IOException, ClassNotFoundException {
        // Read in any hidden serialization magic
        s.defaultReadObject();

        // Read in size
        int size = s.readInt();

        // Read in all elements in the proper order.
        for (int i = 0; i < size; i++)
            linkLast((E)s.readObject());
    }
}
```

  