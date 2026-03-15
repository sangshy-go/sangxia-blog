---
title: "【JDK源码阅读9-util】Map接口之LinkedHashMap"
date: 2016-11-12
category: 随笔杂谈
tags: []
---

## LinkedHashMap

### 一、类继承关系

```
public class LinkedHashMap<K,V>
                  extends HashMap<K,V>
                  implements Map<K,V>
```

### 二、LinkedHashMap实现类特点

与HashMap的异同：同样是基于散列表实现，

区别是LinkedHashMap内部多了一个双向循环链表的维护，该链表是有序，可以按元素插入顺序或元素最近访问顺序(LRU)排列  
      简单地说：LinkedHashMap=散列表+循环双向链表，能够保持遍历的顺序和插入的顺序一致。

总结：

1.LinkedHashMap继承自HashMap，具有HashMap的大部分特性，
比如支持null键和值，默认容量为16，装载因子为0.75，

非线程安全等等；

改为同步：  
\* Map m = Collections.synchronizedMap(new
LinkedHashMap());  
2.LinkedHashMap通过设置accessOrder控制遍历顺序是按照插入顺序还是按照访问顺序。

当accessOrder为true时，可以利用其完成LRU缓存的功能；  
3.LinkedHashMap内部维护了一个双向循环链表，并且其迭代操作时通过链表完成的，而不是去遍历hash表。

4
增加了维护链接列表的开支，性能比HashMap稍逊；

### 三、内部结构

![](https://img-blog.csdn.net/20161112105447683?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

第一张图是LinkedHashMap的全部数据结构，包含散列表和循环双向链表；  
左边的红色箭头引用为Entry节点对象的next引用(散列表中的单链表)，

绿色线条为Entry节点对象的before,
after引用(循环双向链表的前后引用)；

由图可知：LinkedHashMa在遍历的时候直接遍历双向循环链；

![](https://img-blog.csdn.net/20161112105734936?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

第二张图专门把循环双向链表抽取出来，直观一点，注意该循环双向链表的头部存放的是最久访问的节点或最先插入的节点，尾部为最近访问的或最近插入的节点，迭代器遍历方向是从链表的头部开始到链表尾部结束，在链表尾部有一个空的header节点，该节点不存放key-value内容，为LinkedHashMap类的成员属性，循环双向链表的入口；

### 四、源码分析

#### 1 与HashMap不同之处的两个重要属性。

LinkedHashMap比HashMap多了两个成员变量，其中header代表内部双向链表的头结点，后面我们就会发现，LinkedHashMap除了有个桶数组

容纳所有Entry之外，还有一个双向链表保存所有Entry引用。遍历的时候，并不是去遍历桶数组，而是直接遍历双向链表，所以LinkedHashMap的遍历

时间不受桶容量的限制，这是它和HashMap的重要区别之一。

而这个accessOrder代表的是是否按照访问顺序，true代表是，默认是插入顺序。所以我们可以将accessOrder置为true来实现LRU算法，

这可以用来做缓存。

```
            //双向循环链表的头结点
	    private transient Entry<K,V> header;
	    //accessOrder代表链表的排序方式；true为按照访问顺序，false为插入顺序。
	    private final boolean accessOrder;
```

#### 2  构造器

```
           //按指定的初始化容量和加载因子，生成一个空的LinkedHashMap，
	  //默认将accessOrder设为false，按插入顺序排序.
	    public LinkedHashMap(int initialCapacity, float loadFactor) {
	        super(initialCapacity, loadFactor);
	        accessOrder = false;//默认设为插入顺序
	    }
	    //按指定初始化容量，生成一个LinkedHashMap构造器；默认加载因子为0.75
	  //默认将accessOrder设为false，按插入顺序排序.
	    public LinkedHashMap(int initialCapacity) {
	        super(initialCapacity);
	        accessOrder = false;//默认设为插入顺序
	    }
	    //生成一个LinkedHashMap构造器；默认加载因子为0.75，初始化容量为16
	  //默认将accessOrder设为false，按插入顺序排序.
	    public LinkedHashMap() {
	        super();
	        accessOrder = false;
	    }

	    //根据指定的map生成一个新的HashMap,负载因子使用默认值，初始容量大小为Math.max((int) (m.size() / DEFAULT_LOAD_FACTOR) + 1,DEFAULT_INITIAL_CAPACITY)
	     //默认将accessOrder设为false，按插入顺序排序.
	    public LinkedHashMap(Map<? extends K, ? extends V> m) {
	        super(m);
	        accessOrder = false;
	    }
	    //按指定初始化容量，加载因子,链表的排序方式生成一个LinkedHashMap构造器
	    public LinkedHashMap(int initialCapacity,
	                         float loadFactor,
	                         boolean accessOrder) {
	        super(initialCapacity, loadFactor);
	        this.accessOrder = accessOrder;
	    }
```

 
 构造器首先都会调用父类也就是HashMap的构造器来初始化桶数组，而accessOrder之后会被初始化，   除了最后面的一个构造器允许指定accessOrder外，其他构造器都 默认将accessOrder置为了false 。

读者可能很奇怪，不是还有个header么，这个双向链表为啥不在构造器中初始化呢？这得回到HashMap中查看hashMap的构造器了：

```
public HashMap(int initialCapacity, float loadFactor) {
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal initial capacity: " +
                                               initialCapacity);
       ... ...
        init();
    }
```

HashMap构造器最后一步调用了一个init方法，而这个init方法在HashMap中是个空实现，没有任何代码。  
这其实就是所谓的“钩子”，具体代码由子类实现，如果子类希望每次构造的时候都去做一些特定的初始化操作，可以选择复写init方法。

我们看到LinkedHashMap中确实复写了init：

```
 /**
	     * 覆盖HashMap的init方法，在构造方法、Clone、readObject方法里会调用该方法
	     * 作用是生成一个双向链表头节点，初始化其前后节点引用
	     */
	    @Override
	    void init() {
	        header = new Entry<>(-1, null, null, null);//初始化双向链表
	        header.before = header.after = header;//不光是双向链表，还是循环链表
	    }
```

  
            在init方法中，果然初始化了双向链表，而且我们还发现，这不光是个双向链表，还是个循环链表。

#### 3、Entry内部结构

HashMap内部的Entry类并没有before和after指针， 也就是说LinkedHashMap自己重写了一个Entry类 ：

```
 //LinkedHashMap节点对象
	    private static class Entry<K,V> extends HashMap.Entry<K,V> {
	        // These fields comprise the doubly linked list used for iteration.
	        Entry<K,V> before, after;//前后指针
	        //构造函数
	        Entry(int hash, K key, V value, HashMap.Entry<K,V> next) {
	            super(hash, key, value, next);
	        }

	        //移除此节点，并修改前后的引用
	        private void remove() {
	            before.after = after;
	            after.before = before;
	        }

	        //将当前结点(this)插入到existingEntry结点前
	        private void addBefore(Entry<K,V> existingEntry) {
	            after  = existingEntry;//先获取existingEntry的前后节点
	            before = existingEntry.before;
	            before.after = this;//双向指针，都需要修改
	            after.before = this;
	        }

	        /**
	         * 在父类HashMap中的get，set方法会调用此方法recordAccess；
	         * 在LinkedHashMap中，当按访问顺序排序时，该方法会将当前节点插入到链表尾部(头结点的前一个节点)
	         * 否则不做任何事
	         */
	        void recordAccess(HashMap<K,V> m) {
	            LinkedHashMap<K,V> lm = (LinkedHashMap<K,V>)m;
	            if (lm.accessOrder) {//当按访问顺序排序时
	                lm.modCount++;
	                remove();//移除当前节点
	                addBefore(lm.header);//将当前节点插入到头结点前面
	            }
	        }

	        void recordRemoval(HashMap<K,V> m) {
	            remove();
	        }
	    }
```

这里的Entry选择继承父类的Entry类，也就是说
LinkedHashMap中的Entry拥有三个指针，          除了前驱后继指针外用于双向链表的连接外，还有一个next指针用于解决hash冲突（引用链）。  
除此之外，Entry新增了几个方法，remove和addbefore用来操作双向链表不用多说。而recordAccess方法比较特殊，

这个方法在HashMap中也是空实现，并在put方法中会调用此方法：

```
public V put(K key, V value) {//HashMap的put方法
		if (key == null)
			return putForNullKey(value);
		int hash = hash(key);
		int i = indexFor(hash, table.length);
		for (Entry<K,V> e = table[i]; e != null; e = e.next) {
			Object k;
			if (e.hash == hash && ((k = e.key) == key || key.equals(k))) {
				V oldValue = e.value;
				e.value = value;
				e.recordAccess(this);//发生覆盖操作时，会调用此方法
				return oldValue;
			}
		}
	  ... ...
	}
```

此外，在LinkedHashMap的get方法中，也会调用此方法：

```
//根据指定key返回value:先得到entry结点，再返回其值;调用的是HashMap的getEntry方法
	    //与HashMap的区别是：当LinkedHashMap按访问顺序排序的时候，会将访问的当前节点移到链表尾部(头结点的前一个节点)
	    public V get(Object key) {
	        Entry<K,V> e = (Entry<K,V>)getEntry(key);
	        if (e == null)
	            return null;
	        e.recordAccess(this);
	        return e.value;
	    }
```

也就是说，只要涉及到访问结点，那么就会调用这个方法。
观察该方法的逻辑：如果accessOrder为true，

那么会调用addBefore方法将当前Entry放到双向链表的尾部，最终在我们遍历链表的时候就会发现最近最少使用的结点的都集中在

链表头部（
从近期访问最少到近期访问最多的顺序 ），这就是LRU。

LinkedHashMap并没有复写put方法，但是却复写了addEntry和createEntry方法，之前分析HashMap的时候我们就知道了，

put方法会调用addEntry将键值对挂到桶的某个合适位置，而addEntry又会调用createEntry方法创建一个键值对对象。

因而，LinkedHashMap其实是间接更改了put方法，想想也很容易理解，LinkedHashMap除了要向桶中添加键值对外，

还需向链表中增加键值对，所以必须得修改put方法。

```
 /**
	     * 创建节点，插入到LinkedHashMap，该方法覆盖HashMap的addEntry方法
	     */
	    void addEntry(int hash, K key, V value, int bucketIndex) {
	        super.addEntry(hash, key, value, bucketIndex);

	        // eldest：头结点的下个节点header.after，存放于链表头部，是最不经常访问或第一个插入的节点，
	        Entry<K,V> eldest = header.after;
	        //有必要的情况下(如容量不够,具体看removeEldestEntry方法的实现，这里默认为false，不删除)，可以先删除
	        if (removeEldestEntry(eldest)) {
	            removeEntryForKey(eldest.key);
	        }
	    }

	    /**
	     * 创建节点，并将该节点插入到链表尾部
	     */
	    void createEntry(int hash, K key, V value, int bucketIndex) {
	        HashMap.Entry<K,V> old = table[bucketIndex];
	        Entry<K,V> e = new Entry<>(hash, key, value, old);
	        table[bucketIndex] = e;
	        e.addBefore(header);//节点插入到链表尾部
	        size++;
	    }
```

createEntry方法会将键值对分别挂到桶数组和双向链表中。  
比较有意思的是addEntry方法，它提供了一个可选的操作，我们可以通过继承LinkedHashMap并复写removeEldestEntry方法让

该子类可以自动地删除最近最少访问的键值对——这可以用来做缓存!!

#### 4 迭代器

LinkedHashMap自定义了迭代器以及迭代规则，LinkedHashMap是通过内部的双向链表来完成迭代的，遍历时间与键值对总数 成正比，而HashMap遍历时间与容量成正比，所以通常情况下，LinkedHashMap遍历性能是优于HashMap的，但是因为需要额外

维护链表，所以折中来看，两者性能相差无几。

```
 //迭代器
	    private abstract class LinkedHashIterator<T> implements Iterator<T> {
	        Entry<K,V> nextEntry    = header.after;
	        Entry<K,V> lastReturned = null;

	        //用于迭代期间快速失败行为
	        int expectedModCount = modCount;
	        
	        //判断是否还有下个节点；当为头结点的时候说明没有下个节点即返回false
	        public boolean hasNext() {
	            return nextEntry != header;
	        }
	        //移除当前访问的节点
	        public void remove() {
	            if (lastReturned == null)
	                throw new IllegalStateException();
	            if (modCount != expectedModCount)
	                throw new ConcurrentModificationException();

	            LinkedHashMap.this.remove(lastReturned.key);
	            lastReturned = null;
	            expectedModCount = modCount;
	        }

	        Entry<K,V> nextEntry() {
	            if (modCount != expectedModCount)
	                throw new ConcurrentModificationException();
	            if (nextEntry == header)
	                throw new NoSuchElementException();

	            Entry<K,V> e = lastReturned = nextEntry;
	            nextEntry = e.after;
	            return e;
	        }
	    }
```

贴源码：

```
/**
	 * LinkedHashMap接口是的Map接口哈希表和链接列表的实现，
	 * 具有可预知的迭代顺序。这个实现类与HashMap不同之处在于其所有结点都之间以双链表进行维护。
	 * 此链表定义了迭代顺序，此顺序通常就是按键插入到映射中的顺序(插入顺序)。
	 * 注意：如果在映射中重新插入键，则插入顺序不受影响。
	 * 允许null元素；
	 * 增加了维护链接列表的开支，性能比HashMap稍逊；
	 * 此实现不是同步的，改为同步：
	 * 		Map m = Collections.synchronizedMap(new LinkedHashMap());
	 * 
	 */

	public class LinkedHashMap<K,V>
						extends HashMap<K,V>
	    				implements Map<K,V>
	{
	    private static final long serialVersionUID = 3801124242820219131L;

	    //双向循环链表的头结点
	    private transient Entry<K,V> header;
	    //accessOrder代表链表的排序方式；true为按照访问顺序，false为插入顺序。
	    private final boolean accessOrder;

	    //按指定的初始化容量和加载因子，生成一个空的LinkedHashMap，
	  //默认将accessOrder设为false，按插入顺序排序.
	    public LinkedHashMap(int initialCapacity, float loadFactor) {
	        super(initialCapacity, loadFactor);
	        accessOrder = false;//默认设为插入顺序
	    }
	    //按指定初始化容量，生成一个LinkedHashMap构造器；默认加载因子为0.75
	  //默认将accessOrder设为false，按插入顺序排序.
	    public LinkedHashMap(int initialCapacity) {
	        super(initialCapacity);
	        accessOrder = false;//默认设为插入顺序
	    }
	    //生成一个LinkedHashMap构造器；默认加载因子为0.75，初始化容量为16
	  //默认将accessOrder设为false，按插入顺序排序.
	    public LinkedHashMap() {
	        super();
	        accessOrder = false;
	    }

	    //根据指定的map生成一个新的HashMap,负载因子使用默认值，初始容量大小为Math.max((int) (m.size() / DEFAULT_LOAD_FACTOR) + 1,DEFAULT_INITIAL_CAPACITY)
	     //默认将accessOrder设为false，按插入顺序排序.
	    public LinkedHashMap(Map<? extends K, ? extends V> m) {
	        super(m);
	        accessOrder = false;
	    }
	    //按指定初始化容量，加载因子,链表的排序方式生成一个LinkedHashMap构造器
	    public LinkedHashMap(int initialCapacity,
	                         float loadFactor,
	                         boolean accessOrder) {
	        super(initialCapacity, loadFactor);
	        this.accessOrder = accessOrder;
	    }

	    /**
	     * 覆盖HashMap的init方法，在构造方法、Clone、readObject方法里会调用该方法
	     * 作用是生成一个双向链表头节点，初始化其前后节点引用
	     */
	    @Override
	    void init() {
	        header = new Entry<>(-1, null, null, null);//初始化双向链表
	        header.before = header.after = header;//不光是双向链表，还是循环链表
	    }

	    /**
	     * 覆盖HashMap的transfer方法，性能优化，这里遍历方式不采用HashMap的双重循环方式
	     * 而是直接通过双向链表遍历Map中的所有key-value映射
	     */
	    @Override
	    void transfer(HashMap.Entry[] newTable, boolean rehash) {
	        int newCapacity = newTable.length;//获取新表大小
	        //遍历旧Map中的所有key-value
	        for (Entry<K,V> e = header.after; e != header; e = e.after) {
	            //看是否需要进行再哈希操作,需要的话就重新计算key的哈希值
	        	if (rehash)
	                e.hash = (e.key == null) ? 0 : hash(e.key);
	            int index = indexFor(e.hash, newCapacity);//根据数组长度重新计算索引
	            e.next = newTable[index];//插入到链表表头
	            newTable[index] = e;//将e放到索引为i的数组处
	        }
	    }

	    //判断是否含有值value
	    //与HashMap不同地方在于是直接遍历链表进行查询获取，而不用计算key的hash值去寻找桶再遍历
	    public boolean containsValue(Object value) {
	        // Overridden to take advantage of faster iterator
	        if (value==null) {
	            for (Entry e = header.after; e != header; e = e.after)
	                if (e.value==null)
	                    return true;
	        } else {
	            for (Entry e = header.after; e != header; e = e.after)
	                if (value.equals(e.value))
	                    return true;
	        }
	        return false;
	    }

	    //根据指定key返回value:先得到entry结点，再返回其值;调用的是HashMap的getEntry方法
	    //与HashMap的区别是：当LinkedHashMap按访问顺序排序的时候，会将访问的当前节点移到链表尾部(头结点的前一个节点)
	    public V get(Object key) {
	        Entry<K,V> e = (Entry<K,V>)getEntry(key);
	        if (e == null)
	            return null;
	        e.recordAccess(this);
	        return e.value;
	    }

	    //清空链表:调用的父类clear方法
	    public void clear() {
	        super.clear();
	        header.before = header.after = header;
	    }

	    //LinkedHashMap节点对象
	    private static class Entry<K,V> extends HashMap.Entry<K,V> {
	        // These fields comprise the doubly linked list used for iteration.
	        Entry<K,V> before, after;//前后指针
	        //构造函数
	        Entry(int hash, K key, V value, HashMap.Entry<K,V> next) {
	            super(hash, key, value, next);
	        }

	        //移除此节点，并修改前后的引用
	        private void remove() {
	            before.after = after;
	            after.before = before;
	        }

	        //将当前结点(this)插入到existingEntry结点前
	        private void addBefore(Entry<K,V> existingEntry) {
	            after  = existingEntry;//先获取existingEntry的前后节点
	            before = existingEntry.before;
	            before.after = this;//双向指针，都需要修改
	            after.before = this;
	        }

	        /**
	         * 在父类HashMap中的get，set方法会调用此方法recordAccess；
	         * 在LinkedHashMap中，当按访问顺序排序时，该方法会将当前节点插入到链表尾部(头结点的前一个节点)
	         * 否则不做任何事
	         */
	        void recordAccess(HashMap<K,V> m) {
	            LinkedHashMap<K,V> lm = (LinkedHashMap<K,V>)m;
	            if (lm.accessOrder) {//当按访问顺序排序时
	                lm.modCount++;
	                remove();//移除当前节点
	                addBefore(lm.header);//将当前节点插入到头结点前面
	            }
	        }

	        void recordRemoval(HashMap<K,V> m) {
	            remove();
	        }
	    }
	    //迭代器
	    private abstract class LinkedHashIterator<T> implements Iterator<T> {
	        Entry<K,V> nextEntry    = header.after;
	        Entry<K,V> lastReturned = null;

	        //用于迭代期间快速失败行为
	        int expectedModCount = modCount;
	        
	        //判断是否还有下个节点；当为头结点的时候说明没有下个节点即返回false
	        public boolean hasNext() {
	            return nextEntry != header;
	        }
	        //移除当前访问的节点
	        public void remove() {
	            if (lastReturned == null)
	                throw new IllegalStateException();
	            if (modCount != expectedModCount)
	                throw new ConcurrentModificationException();

	            LinkedHashMap.this.remove(lastReturned.key);
	            lastReturned = null;
	            expectedModCount = modCount;
	        }

	        Entry<K,V> nextEntry() {
	            if (modCount != expectedModCount)
	                throw new ConcurrentModificationException();
	            if (nextEntry == header)
	                throw new NoSuchElementException();

	            Entry<K,V> e = lastReturned = nextEntry;
	            nextEntry = e.after;
	            return e;
	        }
	    }
	    //key迭代器
	    private class KeyIterator extends LinkedHashIterator<K> {
	        public K next() { return nextEntry().getKey(); }
	    }
	    //value迭代器
	    private class ValueIterator extends LinkedHashIterator<V> {
	        public V next() { return nextEntry().value; }
	    }
	    //key-value迭代器
	    private class EntryIterator extends LinkedHashIterator<Map.Entry<K,V>> {
	        public Map.Entry<K,V> next() { return nextEntry(); }
	    }

	    // 返回不同的迭代器对象
	    Iterator<K> newKeyIterator()   { return new KeyIterator();   }
	    Iterator<V> newValueIterator() { return new ValueIterator(); }
	    Iterator<Map.Entry<K,V>> newEntryIterator() { return new EntryIterator(); }

	    /**
	     * 创建节点，插入到LinkedHashMap，该方法覆盖HashMap的addEntry方法
	     */
	    void addEntry(int hash, K key, V value, int bucketIndex) {
	        super.addEntry(hash, key, value, bucketIndex);

	        // eldest：头结点的下个节点header.after，存放于链表头部，是最不经常访问或第一个插入的节点，
	        Entry<K,V> eldest = header.after;
	        //有必要的情况下(如容量不够,具体看removeEldestEntry方法的实现，这里默认为false，不删除)，可以先删除
	        if (removeEldestEntry(eldest)) {
	            removeEntryForKey(eldest.key);
	        }
	    }

	    /**
	     * 创建节点，并将该节点插入到链表尾部
	     */
	    void createEntry(int hash, K key, V value, int bucketIndex) {
	        HashMap.Entry<K,V> old = table[bucketIndex];
	        Entry<K,V> e = new Entry<>(hash, key, value, old);
	        table[bucketIndex] = e;
	        e.addBefore(header);//节点插入到链表尾部
	        size++;
	    }

	    /**
	     * 该方法在创建新节点的时候调用，
	     * 判断是否有必要删除链表头部的第一个节点(最不经常访问或最先插入的节点，由accessOrder决定)
	     */
	    protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {
	        return false;
	    }
	}
```