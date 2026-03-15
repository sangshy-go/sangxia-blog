---
title: "【JDK源码阅读8-util】Map接口----HashMap"
date: 2016-11-10
category: 随笔杂谈
tags: []
---

## HashMap

         HashMap要聊的东西太多了，而且由于HashSet接口中底层实现就是用的HashMap,所以建议先看HashMap的源码。这里就直接转载别人的文章中的总结；毕竟别人总结 的非常到位。先说下结构，对HashMap的结构有个大概的了解后，再说些其工作原理以及其中涉及到的哈希算法。

            参考：【http://blog.csdn.net/qq\_27093465/article/details/52207152】

```
public class HashMap<K,V>
 
  extends 
  AbstractMap<K,V>
 
 
  implements 
  Map<K,V>, 
  Cloneable, 
  Serializable
```

数组的特点是：寻址容易，插入和删除困难；而链表的特点是：寻址困难，插入和删除容易。那么我们能不能

综合两者的特性，做出一种寻址容易，插入删除也容易的数据结构？答案是肯定的，这就是我们要提起的哈希表。

HashMap实现了Map接口，继承AbstractMap。其中Map接口定义了键映射到值的规则，而AbstractMap类提供

Map 接口的骨干实现，以最大限度地减少实现此接口所需的工作。

### 一 HashMap结构

![](https://img-blog.csdn.net/20161110212827688?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

上图  可能很直观清晰的介绍了HashMap的结构：从上图我们可以发现哈希表是由数组+链表组成的，HashMap其实也是一个线性的数组实现的,所以可以理解为其存储数据的容器就是一个线性数组。这可能让我们很不解，一个线性的数组怎么实现按键值对来存取数据呢？

1 .首先HashMap里面实现一个静态内部类Entry，其重要的属性有 key , value, next，从属性key,value。

我们就能很明显的看出来Entry就是HashMap键值对实现的一个基础bean，我们上面说到HashMap的基础就是一个线性数组，

这个数组就是Entry[]，Map里面的内容都保存在Entry[]里面。

```
static class Entry<K,V> implements Map.Entry<K,V> {
	        final K key;//键
	        V value;//值
	        Entry<K,V> next;//下个元素指针
	        int hash;//key的hash值
```

```
}
```

       

        2 两个概念：

1）.这里面有个Hash冲突的概念：就像上面的一个数组的位置上出现了一条链，即一个链表的出现，这就是所谓的

hash冲突，解决hash冲突，就是让链表的长度变短，或者干脆就是不产生链表，一个好的hash算法应该是让数据很好的

散列到数组的各个位置，即一个位置存一个数据就是最好的散列，下面说的链地址法，说的就是在hashmap里面冲突的时候，

一个节点可以存多个数据。

        2).还有个桶：bucket，就是上面的数组的每一个成员，数组的每个位置就叫一个桶。对应前面的单词。

### 二 HashMap基本定义

 HashMap也是我们使用非常多的Collection，它是基于哈希表的 Map 接口的实现，以key-value的形式存在。

HashMap可以接受null键值和值，而HashTable则不能；HashMap是非synchronized;HashMap很快；HashMap储存的是键值对。

### 三 构造函数

HashMap提供了三个构造函数：

     HashMap()：构造一个具有默认初始容量 (16) 和默认加载因子 (0.75) 的空 HashMap。

     HashMap(int initialCapacity)：构造一个带指定初始容量和默认加载因子 (0.75) 的空 HashMap。

     HashMap(int initialCapacity, float loadFactor)：构造一个带指定初始容量和加载因子的空 HashMap。

       在这里提到了两个参数：初始容量，加载因子。这两个参数是影响HashMap性能的重要参数，其中容量表示哈希表中桶的数量，初始容量是创建哈希表时的容量，加载因子是哈希表在其容量自动增加之前可以达到多满的一种尺度，它衡量的是一个散列表的空间的使用程度，负载因子越大表示散列表的装填程度越高，反之愈小。

        对于使用链表法的散列表来说，查找一个元素的平均时间是O(1+a)，因此如果负载因子越大，对空间的利用更充分，然而后果是查找效率的降低；如果负载因子太小，那么散列表的数据将过于稀疏，对空间造成严重浪费。系统默认负载因子为0.75，一般情况下我们是无需修改的。

## 四、工作原理

#### 1 存储的实现put(K key,V value)

        核心就是：根据key的hashcode得到桶的位置，往里面添加值；若发现有对应的键存在就覆盖。

        当我们想一个HashMap中添加一对key-value时，系统首先会计算key的hash值，然后根据hash值确认在table中存储的位置。若该位置没有元素，则直接插入。否则迭代该处元素链表并依此比较其key的hash值。如果两个hash值相等且key值相等(e.hash == hash && ((k = e.key) == key || key.equals(k))),则用新的Entry的value覆盖原来节点的value。如果两个hash值相等但key值不等 ，则将该节点插入该链表的链头。

       ①首先判断key==null?,若为null，就调用putForNullKey方法。

       ②若 key != null ，对key调用hashCode()方法，根据hash值确认在table中存储的位置，即桶的位置，确定数据要插入到那个桶中。(bucket位置来储存Entry对象)。

      若桶中有元素，(hash值相同时说明在同个桶中，这时再比较有没有相同 的key(调用equals()))，

                         则遍历桶中元素，看看是否有相同的key，

                          若存在则覆盖原来key的value，否则将该元素保存在链头（最先保存的元素放在链尾）。

        若table在该处没有元素，则直接保存。

注意：

a 迭代处：此处迭代原因就是为了防止存在相同的key值，若发现两个hash值（key）相同时，HashMap的处理方式是用新value替换旧value，

这里并没有处理key，这就解释了HashMap中没有两个相同的key;

b 再看如何计算key的hash值，HashMap的精华所在。

```
//计算键key的hash值(String类的key做了优化)
	    final int hash(Object k) {
	        int h = hashSeed;
	        //这里针对String类的key值做了优化，调用不同的函数(???)
	        if (0 != h && k instanceof String) {
	            return sun.misc.Hashing.stringHash32((String) k);
	        }

	        h ^= k.hashCode();

	        // This function ensures that hashCodes that differ only by
	        // constant multiples at each bit position have a bounded
	        // number of collisions (approximately 8 at default load factor).
	        h ^= (h >>> 20) ^ (h >>> 12);
	        return h ^ (h >>> 7) ^ (h >>> 4);
	    }
```

       

          计算hash值后，怎么才能保证table元素分布均与呢？我们会想到取模，但是由于取模的消耗较大，

HashMap是这样处理的：调用indexFor方法。HashMap的底层数组长度总是2的n次方，在构造函数中存在：capacity <<= 1;这样做总是能够保证HashMap的底层数组长度为2的n次方。

        当length为2的n次方时，h&(length - 1)就相当于对length取模，而且速度比直接取模快得多，这是HashMap在速度上的一个优化。

        我们回到indexFor方法，该方法仅有一条语句：h&(length - 1)，这句话除了上面的取模运算外还有一个非常重要的责任：

 

 均匀分布table数据和充分利用空间。

```
 //??? 根据Hash值和Hash表的大小选择合适的桶???
	    static int indexFor(int h, int length) {
	        // assert Integer.bitCount(length) == 1 : "length must be a non-zero power of 2";
	        return h & (length-1);
	    }<span style="font-family: verdana, Arial, Helvetica, sans-serif; line-height: 25.2px; background-color: rgb(249, 249, 249);">	</span>
```

**c “当两个对象的hashcode相同会发生什么？”**

        当hashcode相同时，它们的bucket位置相同，‘碰撞’会发生。

        因为HashMap使用LinkedList存储对象，这个Entry(包含有键值对的Map.Entry对象)会存储在LinkedList中。所以即使bucket位置相同，插入到同个bucket位置的结点以链表形式所连接。即：

打个比方， 第一个键值对A进来，通过计算其key的hash得到的index=0，记做:Entry[0] = A。一会后又进来一个键值对B，通过计算其index也等于0，现在怎么办？HashMap会这样做:

B.next = A,Entry[0] = B,如果又进来C,index也等于0,那么C.next = B,Entry[0] = C；(即将先加入的结点next指针指向新加入的结点)

       这样我们发现index=0的地方其实存取了A,B,C三个键值对,他们通过next这个属性链接在一起。所以疑问不用担心。也就是说数组中存储的是最后插入的元素。

下面是put的源码;

```
 //将指定value值存放在指定key处；若key处以前有值，就将其覆盖;
	    public V put(K key, V value) {
	        if (table == EMPTY_TABLE) {
	            inflateTable(threshold);//是空表的话，就直接初始化底层结构
	        }
	        //key为null的时候，就放入null键（这里可以看出hashmap集合中可以有null键）
	        if (key == null)
	            return putForNullKey(value);
	        //计算键的哈希值
	        int hash = hash(key);
	        //获取桶的位置
	        int i = indexFor(hash, table.length);
	        //因为表中保存的是桶中结点的头指针；所以找到对应的桶以后就可以从头指针开始进行遍历
	        for (Entry<K,V> e = table[i]; e != null; e = e.next) {
	            Object k;
	            //先判断该条链上有没有hash相同的(hash相同后再比较key值)
	            //有相同的key,就直接覆盖其值
	            if (e.hash == hash && ((k = e.key) == key || key.equals(k))) {
	                V oldValue = e.value;//获取旧值
	                e.value = value;//覆盖旧值
	                e.recordAccess(this);//当集合中以前有值的时候，就调用这个方法
	                return oldValue;//返回旧值
	            }
	        }
	        modCount++;
	        addEntry(hash, key, value, i);//将新加入的键值添加到指定位置i处，i为桶的位置;保存在链头部分
	        return null;
	    }<strong>
</strong>
```

#### 2 读取的实现：get(key)

核心：通过key的hash值找到在table数组中的索引处的Entry，然后返回该key对应的value即可。

```
              //根据键key值获得对应的值
	    //若key==null，调用getForNullKey函数，返回null键对应的值value
	    //若key！=null,先根据key得到对应的entry结点，再得到对应的值
	    public V get(Object key) {
	        if (key == null)
	            return getForNullKey();
	        Entry<K,V> entry = getEntry(key);

	        return null == entry ? null : entry.getValue();
	    }
```

  
 

```
 //根据指定的key找到对应的entry结点
	    final Entry<K,V> getEntry(Object key) {
	        if (size == 0) {
	            return null;//如果集合为空，就直接返回null
	        }
	        //计算key的哈希值；
	        //key==null>>>0;
	        //key!= null >> hash(key),调用hash方法计算key值
	        int hash = (key == null) ? 0 : hash(key);
	        //先根据哈希值找到桶的位置,再遍历桶中的rntry结点
	        for (Entry<K,V> e = table[indexFor(hash, table.length)];
	             e != null;
	             e = e.next) {
	            Object k;
	            //先比价哈希值，哈希值相同再调用equals
	            //这里就是map中为什么重写equals方法时一定要重写hashCode()方法；
	            if (e.hash == hash &&
	                ((k = e.key) == key || (key != null && key.equals(k))))
	                return e;
	        }
	        return null;
	    }
```

       

         在这里能够根据key快速的取到value除了和HashMap的数据结构密不可分外，还和Entry有莫大的关系，

在前面就提到过，HashMap在存储过程中并没有将key，value分开来存储，而是当做一个整体key-value来处理的，这个整体就是Entry对象**。**

同时value也只相当于key的附属而已。在存储的过程中，系统根据key的hashcode来决定Entry在table数组中的存储位置，

在取的过程中同样根据key的hashcode取出相对应的Entry对象。

注：　“如果两个键的hashcode相同，你如何获取值对象？”

正常情况下获取结点值是根据key的hashcode找到对应的entry结点，然后再返回entry对应的结点。

若两个键的hashcode相同时，找到bucket位置之后（两个键的hashcode相同说明在同一个桶中），

                会调用keys.equals()方法去找到LinkedList中正确的节点，最终找到要找的值对象。

```
if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k))))
```

  


#### 3 再哈希操作：默认的负载因子大小为0.75，也就是说，当一个map填满了75%的bucket时候，和其它集合类(如ArrayList等)一样，

#### 将会创建原来HashMap大小的两倍的bucket数组，来重新调整map的大小，并将原来的对象放入新的bucket数组中。

#### 这个过程叫作rehashing，因为它调用hash方法找到新的bucket位置。

现在我们需要看一下当数据量已经超过初始定义的负载因子时，HashMap如何处理？

随着HashMap中元素的数量越来越多，发生碰撞的概率就越来越大，所产生的链表长度就会越来越长，这样势必

会影响HashMap的速度(为啥呢，原来是直接找到数组的index就可以直接根据key取到值了，但是冲突严重，

也就是说链表长，那就得循环链表了，时间就浪费在循环链表上了，也就慢了)，

为了保证HashMap的效率，系统必须要在某个临界点进行扩容处理。该临界点在当HashMap中元素的数量等于table数组长度\*加载因子。但是扩容是一个非常耗时的过程，因为它需要重新计算这些数据在新table数组中的位置并进行复制处理。所以如果我们已经预知HashMap中元素的个数，那么预设元素的个数能够有效的提高HashMap的性能。

在HashMap中当数据量很多时，并且已经达到了负载限度时，会重新做一次哈希，也就是说会再散列。调用的方法为resize()，并且java默认传入的参数为2\*table.length。

```
 //当集合到大阈值threshold时，就对集合进行扩容
	    //在HashMap中当数据量很多时，并且已经达到了负载限度时，会重新做一次哈希，也就是说会再散列。
	    //调用的方法为resize()，并且java默认传入的参数为2*table.length
	    //resize:再哈希是重新建一个指定容量的数组，然后将每个元素重新计算它要放的位置
	    void resize(int newCapacity) {
	        Entry[] oldTable = table;//老的表(集合)
	        int oldCapacity = oldTable.length;//获取老的hashmap集合容量
	        if (oldCapacity == MAXIMUM_CAPACITY) {//若老的hashmap集合容量为最大值，就将阈值设置为最大值并返回
	            threshold = Integer.MAX_VALUE;
	            return;
	        }

	        Entry[] newTable = new Entry[newCapacity];//建一个新的表结构
	        //将老的表中数据拷贝的新表中
	        transfer(newTable, initHashSeedAsNeeded(newCapacity));
	        table = newTable;//修改表的底层结构
	        //修改阈值：newCapacity * loadFactor(不能超过最大值)
	        threshold = (int)Math.min(newCapacity * loadFactor, MAXIMUM_CAPACITY + 1);
	    }

	    //将旧表中的entry结点拷贝到新表中
	    void transfer(Entry[] newTable, boolean rehash) {
	        int newCapacity = newTable.length;//获取新表容量
	        for (Entry<K,V> e : table) {//遍历表中结点
	            while(null != e) {
	                Entry<K,V> next = e.next;
	                if (rehash) {//如果需要重新计算hash值。就重新计算
	                    e.hash = null == e.key ? 0 : hash(e.key);
	                }
	                int i = indexFor(e.hash, newCapacity);//获取桶的位置
	                // ？？？元素连接到桶中，相当于单链表的插入
	                e.next = newTable[i];
	                newTable[i] = e;
	                e = next;
	            }
	        }
```

#### 4.解决hash冲突的办法

1. 开放定址法（线性探测再散列，二次探测再散列，伪随机探测再散列）
2. 再哈希法
3. 链地址法
4. 建立一个公共溢出区

[Java](http://lib.csdn.net/base/17 "Java EE知识库")中hashmap的解决办法就是采用的链地址法。

#### 5 重新调整HashMap大小存在什么问题

当重新调整HashMap大小的时候，确实存在条件竞争，因为如果两个线程都发现HashMap需要重新调整大小了，它们会同时试着调整大小。

在调整大小的过程中，存储在LinkedList中的元素的次序会反过来，因为移动到新的bucket位置的时候，HashMap并不会将元素放在LinkedList的尾部，

而是放在头部，这是为了避免尾部遍历(tail traversing)。如果条件竞争发生了，那么就死循环了。

#### 6 面试题

#### 1为什么String, Interger这样的wrapper类适合作为键？

#### String, Interger这样的wrapper类作为HashMap的键是再适合不过了，而且String最为常用。因为String是不可变的，也是final的，

#### 而且已经重写了equals()和hashCode()方法了。其他的wrapper类也有这个特点。

#### 不可变性是必要的，因为为了要计算hashCode()，就要防止键值改变，如果键值在放入时和获取时返回不同的hashcode的话，

#### 那么就不能从HashMap中找到你想要的对象。

#### 不可变性还有其他的优点如线程安全。如果你可以仅仅通过将某个field声明成final就能保证hashCode是不变的，那么请这么做吧。

#### 因为获取对象的时候要用到equals()和hashCode()方法，那么键对象正确的重写这两个方法是非常重要的。

#### 如果两个不相等的对象返回不同的hashcode的话，那么碰撞的几率就会小些，这样就能提高HashMap的性能。

#### 2我们可以使用自定义的对象作为键吗？

#### 这是前一个问题的延伸。当然你可能使用任何对象作为键，只要它遵守了equals()和hashCode()方法的定义规则，并且当对象插入到Map中

#### 之后将不会再改变了。如果这个自定义对象时不可变的，那么它已经满足了作为键的条件，因为当它创建之后就已经不能改变了。

#### 3我们可以使用CocurrentHashMap来代替HashTable吗？

#### 这是另外一个很热门的面试题，因为ConcurrentHashMap越来越多人用了。我们知道HashTable是synchronized的，

#### 但是ConcurrentHashMap同步性能更好，因为它仅仅根据同步级别对map的一部分进行上锁。ConcurrentHashMap当然可以代替HashTable，

#### 但是HashTable提供更强的线程安全性。

整个HashMap的源码：

```
public  class HashMap<K,V>
	    extends AbstractMap<K,V>
	    implements Map<K,V>, Cloneable, Serializable
	{

	    //初始化容量;2^4=16;必须为2的幂
	    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; 
	    //最大容量：2^30
	    static final int MAXIMUM_CAPACITY = 1 << 30;
	    //初始化加载因子：0.75
	    static final float DEFAULT_LOAD_FACTOR = 0.75f;
	    //HashMap内部的存储结构是一个数组，在未初始化前数组为空
	    static final Entry<?,?>[] EMPTY_TABLE = {};

	    //建一个空的entry数组：即桶，添加entry结点（键值映射对）
	    transient Entry<K,V>[] table = (Entry<K,V>[]) EMPTY_TABLE;

	    //集合中键值映射对的数量；永久化防止被序列化
	    transient int size;

	    //HashMap下次扩容的阈值:即超过这个值就扩容
	    int threshold;

	    //加载因子
	    //final:一次赋值就不再修改
	    final float loadFactor;

	    //Map集合中结构改变的次数
	    transient int modCount;

	    //默认的threshold值
	    static final int ALTERNATIVE_HASHING_THRESHOLD_DEFAULT = Integer.MAX_VALUE;

	    //???不太懂这个
	    //通过虚拟机配置来修改threshold值
	    private static class Holder {

	        static final int ALTERNATIVE_HASHING_THRESHOLD;

	        static {
	            String altThreshold = java.security.AccessController.doPrivileged(
	                new sun.security.action.GetPropertyAction(
	                    "jdk.map.althashing.threshold"));//读取阈值

	            int threshold;
	            try {
	                threshold = (null != altThreshold)//修改threshold值
	                        ? Integer.parseInt(altThreshold)
	                        : ALTERNATIVE_HASHING_THRESHOLD_DEFAULT;

	                // disable alternative hashing if -1
	                if (threshold == -1) {
	                    threshold = Integer.MAX_VALUE;
	                }

	                if (threshold < 0) {
	                    throw new IllegalArgumentException("value must be positive integer.");
	                }
	            } catch(IllegalArgumentException failed) {
	                throw new Error("Illegal value for 'jdk.map.althashing.threshold'", failed);
	            }

	            ALTERNATIVE_HASHING_THRESHOLD = threshold;
	        }
	    }

	    //计算Hash值时的key
	    transient int hashSeed = 0;

	    //构造一个带有指定初试容量和加载因子的HashMap
	    public HashMap(int initialCapacity, float loadFactor) {
	        if (initialCapacity < 0)
	            throw new IllegalArgumentException("Illegal initial capacity: " +
	                                               initialCapacity);
	        if (initialCapacity > MAXIMUM_CAPACITY)
	            initialCapacity = MAXIMUM_CAPACITY;
	        //加载因子非负,且是一个数
	        if (loadFactor <= 0 || Float.isNaN(loadFactor))
	            throw new IllegalArgumentException("Illegal load factor: " +
	                                               loadFactor);

	        this.loadFactor = loadFactor;
	        threshold = initialCapacity;
	        init();
	    }
	    //构造一个有初始化大小的HashMap，此时加载因子默认为0.75
	    public HashMap(int initialCapacity) {
	        this(initialCapacity, DEFAULT_LOAD_FACTOR);
	    }

	    //构造一个空的HashMap,初试容量为默认的16，加载因子为0.75
	    public HashMap() {
	        this(DEFAULT_INITIAL_CAPACITY, DEFAULT_LOAD_FACTOR);
	    }

	    //构建一个指定映射关系与Map集合相同的新的HashMap
	    public HashMap(Map<? extends K, ? extends V> m) {
	        this(Math.max((int) (m.size() / DEFAULT_LOAD_FACTOR) + 1,
	                      DEFAULT_INITIAL_CAPACITY), DEFAULT_LOAD_FACTOR);
	        inflateTable(threshold);//初始化HashMap底层的数组结构
	        putAllForCreate(m);//添加集合m中的元素
	    }

	    //选择合适的容量值，取最接近number的2的幂
	    private static int roundUpToPowerOf2(int number) {
	        // assert number >= 0 : "number must be non-negative";
	        return number >= MAXIMUM_CAPACITY
	                ? MAXIMUM_CAPACITY
	                : (number > 1) ? Integer.highestOneBit((number - 1) << 1) : 1;
	    }

	    //初始化HashMap的底层数据结构
	    private void inflateTable(int toSize) {
	        // Find a power of 2 >= toSize
	        int capacity = roundUpToPowerOf2(toSize);//选合适的容量:比toSize大的2的整数幂次方
	        //选取合适的threshold(扩容阈值)
	        threshold = (int) Math.min(capacity * loadFactor, MAXIMUM_CAPACITY + 1);
	        table = new Entry[capacity];//初始化底层数据结构
	        initHashSeedAsNeeded(capacity);//选择合适的Hash因子
	    }

	    //初始化
	    void init() {
	    }

	    //????选择合适的Hash因子，这里和虚拟机的配置有关
	    final boolean initHashSeedAsNeeded(int capacity) {
	        boolean currentAltHashing = hashSeed != 0;
	        boolean useAltHashing = sun.misc.VM.isBooted() &&
	                (capacity >= Holder.ALTERNATIVE_HASHING_THRESHOLD);
	        boolean switching = currentAltHashing ^ useAltHashing;
	        if (switching) {
	            hashSeed = useAltHashing
	                ? sun.misc.Hashing.randomHashSeed(this)
	                : 0;
	        }
	        return switching;
	    }

	    //计算键key的hash值(String类的key做了优化)
	    final int hash(Object k) {
	        int h = hashSeed;
	        //这里针对String类的key值做了优化，调用不同的函数(???)
	        if (0 != h && k instanceof String) {
	            return sun.misc.Hashing.stringHash32((String) k);
	        }

	        h ^= k.hashCode();
	        
	        h ^= (h >>> 20) ^ (h >>> 12);
	        return h ^ (h >>> 7) ^ (h >>> 4);
	    }

	    //均匀分布table数据和充分利用空间。
	    //这个方法在HashMap中非常重要，凡是与查询、添加、删除有关的方法中都有调用该方法，为什么这么短的一个代码使用率这么高？
	    //根据代码注释我们知道，
	    //这个方法是根据hashCode及当前table的长度（数组的长度，不是map的size）得到该元素应该存放的位置，或者在table中的索引。
	    static int indexFor(int h, int length) {
	        // assert Integer.bitCount(length) == 1 : "length must be a non-zero power of 2";
	        return h & (length-1);
	    }

	    //返回集合的大小
	    public int size() {
	        return size;
	    }

	    //判断集合是否非空
	    public boolean isEmpty() {
	        return size == 0;
	    }

	    //根据键key值获得对应的值:先根据key得到结点entry，再获取其对应的值
	    //若key==null，调用getForNullKey函数，返回null键对应的值value
	    //*若key！=null,先根据key得到对应的entry结点，再得到对应的值
	    public V get(Object key) {
	        if (key == null)
	            return getForNullKey();
	        Entry<K,V> entry = getEntry(key);

	        return null == entry ? null : entry.getValue();
	    }

	    //key==null时，分三种情况讨论
	    private V getForNullKey() {
	        if (size == 0) {//1 集合为空，value为null
	            return null;
	        }
	        //2 key==null,value!=null
	        for (Entry<K,V> e = table[0]; e != null; e = e.next) {
	            if (e.key == null)
	                return e.value;
	        }
	        //3  key==null,value==null
	        return null;
	    }

	    //判断是否包含键key;实际上是调用getEntry，看key对应的entry结点是否存在
	    public boolean containsKey(Object key) {
	        return getEntry(key) != null;
	    }

	    //根据指定的key找到对应的entry结点
	    final Entry<K,V> getEntry(Object key) {
	        if (size == 0) {
	            return null;//如果集合为空，就直接返回null
	        }
	        //计算key的哈希值；
	        //key==null  ==   0;
	        //key!= null >> hash(key),调用hash方法计算key值
	        int hash = (key == null) ? 0 : hash(key);
	        //先根据哈希值找到桶的位置,再遍历桶中的rntry结点
	        for (Entry<K,V> e = table[indexFor(hash, table.length)];
	             e != null;
	             e = e.next) {
	            Object k;
	            //因为在同个桶中，这里的哈希值肯定相同：e.hash == hash
	            //再遍历桶中的结点；寻找结点中的key与要找到key相同的结点：
	            //调用equals方法(k = e.key) == key || (key != null && key.equals(k))
	            //这里解释了：当hashcode相同时(在同个桶中)，需要调用equals进一步进行比较，所以hashcode、equals都需要重写
	            if (e.hash == hash &&
	                ((k = e.key) == key || (key != null && key.equals(k))))
	                return e;
	        }
	        return null;
	    }

	    //将指定value值存放在指定key处；若key处以前有值，就将其覆盖;
	    public V put(K key, V value) {
	        if (table == EMPTY_TABLE) {
	            inflateTable(threshold);//是空表的话，就直接初始化底层结构
	        }
	        //key为null的时候，就放入0号桶中中（这里可以看出hashmap集合中可以有null键）
	        if (key == null)
	            return putForNullKey(value);
	        //计算键的哈希值
	        int hash = hash(key);
	        //获取桶的位置
	        int i = indexFor(hash, table.length);
	        //因为表中保存的是桶中结点的头指针；所以找到对应的桶以后就可以从头指针开始进行遍历
	        for (Entry<K,V> e = table[i]; e != null; e = e.next) {
	            Object k;
	            //首先确保遍历结点的哈希值与要插入的键的哈希值相同：e.hash == hash
	            //有相同的key,就直接覆盖其值
	            if (e.hash == hash && ((k = e.key) == key || key.equals(k))) {
	                V oldValue = e.value;//获取旧值
	                e.value = value;//覆盖旧值
	                e.recordAccess(this);//当集合中以前有值的时候，就调用这个方法
	                return oldValue;//返回旧值
	            }
	        }
	        modCount++;//修改次数
	        addEntry(hash, key, value, i);//将新加入的键值添加到指定位置i处，i为桶的位置;保存在链头部分
	        return null;
	    }

	    //用来添加key==null的元素，添加到第0号的Hash桶中
	    private V putForNullKey(V value) {
	        for (Entry<K,V> e = table[0]; e != null; e = e.next) {
	            if (e.key == null) {
	                V oldValue = e.value;//获取旧值返回
	                e.value = value;//覆盖旧值
	                e.recordAccess(this);
	                return oldValue;
	            }
	        }
	        modCount++;
	        addEntry(0, null, value, 0);//执行链表插入
	        return null;
	    }

	    /**
	     * This method is used instead of put by constructors and
	     * pseudoconstructors (clone, readObject).  It does not resize the table,
	     * check for comodification, etc.  It calls createEntry rather than
	     * addEntry.
	     */
	    //添加元素???
	    private void putForCreate(K key, V value) {
	        int hash = null == key ? 0 : hash(key);//计算key的hash值
	        int i = indexFor(hash, table.length);//定位Hash桶

	        //遍历第i号hash桶
	        //table[i]中保存的是第i号hash桶的头指针，所以要遍历第i号hash桶的头指针，即为e = e.next
	        for (Entry<K,V> e = table[i]; e != null; e = e.next) {
	            Object k;
	          //先比价哈希值，哈希值相同再调用equals
	            if (e.hash == hash &&
	                ((k = e.key) == key || (key != null && key.equals(k)))) {
	                e.value = value;
	                return;
	            }
	        }
	        //创建元素实体，这里即添加到第i号Hash桶中
	        createEntry(hash, key, value, i);
	    }
	    //将m中元素全加到hashMap中
	    private void putAllForCreate(Map<? extends K, ? extends V> m) {
	        for (Map.Entry<? extends K, ? extends V> e : m.entrySet())
	            putForCreate(e.getKey(), e.getValue());
	    }

	    //当集合到大阈值threshold时，就对集合进行扩容
	    //在HashMap中当数据量很多时，并且已经达到了负载限度时，会重新做一次哈希，也就是说会再散列。
	    //调用的方法为resize()，并且java默认传入的参数为2*table.length
	    //resize:再哈希是重新建一个指定容量的数组，然后将每个元素重新计算它要放的位置
	    void resize(int newCapacity) {
	        Entry[] oldTable = table;//老的表(集合)
	        int oldCapacity = oldTable.length;//获取老的hashmap集合容量
	        if (oldCapacity == MAXIMUM_CAPACITY) {//若老的hashmap集合容量为最大值，就将阈值设置为最大值并返回
	            threshold = Integer.MAX_VALUE;
	            return;
	        }

	        Entry[] newTable = new Entry[newCapacity];//建一个新的表结构
	        //将老的表中数据拷贝的新表中
	        transfer(newTable, initHashSeedAsNeeded(newCapacity));
	        table = newTable;//修改表的底层结构
	        //修改阈值：newCapacity * loadFactor(不能超过最大值)
	        threshold = (int)Math.min(newCapacity * loadFactor, MAXIMUM_CAPACITY + 1);
	    }

	    //将旧表中的entry结点拷贝到新表中
	    void transfer(Entry[] newTable, boolean rehash) {
	        int newCapacity = newTable.length;//获取新表容量
	        for (Entry<K,V> e : table) {//遍历表中每个位置的头指针
	            while(null != e) {
	                Entry<K,V> next = e.next;
	                if (rehash) {//如果需要重新计算hash值。就重新计算
	                    e.hash = null == e.key ? 0 : hash(e.key);
	                }
	                int i = indexFor(e.hash, newCapacity);//获取桶的位置
	                // ？？？元素连接到桶中，相当于单链表的插入
	                e.next = newTable[i];
	                newTable[i] = e;
	                e = next;
	            }
	        }
	    }

	    //添加指定集合中的元素
	    public void putAll(Map<? extends K, ? extends V> m) {
	        int numKeysToBeAdded = m.size();
	        if (numKeysToBeAdded == 0)//集合为空，直接返回
	            return;

	        if (table == EMPTY_TABLE) {//底层数组为空，执行初始化？？？？
	            inflateTable((int) Math.max(numKeysToBeAdded * loadFactor, threshold));
	        }

	        //若要添加的集合大小超过阈值，就执行扩容
	        //扩容大小：
	        if (numKeysToBeAdded > threshold) {
	        	//选择容量
	            int targetCapacity = (int)(numKeysToBeAdded / loadFactor + 1);
	            if (targetCapacity > MAXIMUM_CAPACITY)
	                targetCapacity = MAXIMUM_CAPACITY;//超过最大值就设置为最大值
	            int newCapacity = table.length;//当前容量
	            while (newCapacity < targetCapacity)//当前容量小于目标容量，就扩容
	                newCapacity <<= 1;//每次扩容大小 为2的幂次方
	            if (newCapacity > table.length)
	                resize(newCapacity);//？？？？执行扩容
	        }
	        //开始添加元素
	        for (Map.Entry<? extends K, ? extends V> e : m.entrySet())
	            put(e.getKey(), e.getValue());
	    }

	    //移除集合中指定键，返回key对应的值
	    public V remove(Object key) {
	        Entry<K,V> e = removeEntryForKey(key);
	        return (e == null ? null : e.value);
	    }

	    //删除元素，返回键对应的值
	    final Entry<K,V> removeEntryForKey(Object key) {
	        if (size == 0) {
	            return null;//集合为空，就返回null
	        }
	        //计算Key的hash值
	        int hash = (key == null) ? 0 : hash(key);
	        int i = indexFor(hash, table.length);//获取桶的位置
	        Entry<K,V> prev = table[i];//获取头指针，设为prev结点
	        Entry<K,V> e = prev;//保存头指针
	        
	        //从头指针开始遍历
	        while (e != null) {
	            Entry<K,V> next = e.next;//获取下个结点
	            Object k;
	            //遍历桶中结点
	            //若桶中有指定结点的键key，就将其删除
	            if (e.hash == hash &&
	                ((k = e.key) == key || (key != null && key.equals(k)))) {
	                modCount++;
	                size--;
	                //执行链表的删除
	                if (prev == e)//是否是第一个元素
	                    table[i] = next;//将下个结点设置为头指针
	                else
	                    prev.next = next;//直接删除当前值，指向下个元素
	                e.recordRemoval(this);
	                return e;
	            }
	            prev = e;//没有的话就继续遍历桶中结点，指针后移
	            e = next;
	        }
	        return e;
	    }

	    //删除一个Entry实体，通过o的key查找到元素后，删除(和上面方法类似)
	    final Entry<K,V> removeMapping(Object o) {
	        if (size == 0 || !(o instanceof Map.Entry))
	            return null;

	        Map.Entry<K,V> entry = (Map.Entry<K,V>) o;
	        Object key = entry.getKey();
	        int hash = (key == null) ? 0 : hash(key);
	        int i = indexFor(hash, table.length);
	        Entry<K,V> prev = table[i];
	        Entry<K,V> e = prev;

	        while (e != null) {
	            Entry<K,V> next = e.next;
	            if (e.hash == hash && e.equals(entry)) {
	                modCount++;
	                size--;
	                if (prev == e)
	                    table[i] = next;
	                else
	                    prev.next = next;
	                e.recordRemoval(this);
	                return e;
	            }
	            prev = e;
	            e = next;
	        }

	        return e;
	    }

	    //清空集合
	    public void clear() {
	        modCount++;
	        Arrays.fill(table, null);//底层数组设置为null
	        size = 0;
	    }

	    //判断是否包含值为value的元素
	    public boolean containsValue(Object value) {
	        if (value == null)
	            return containsNullValue();

	        Entry[] tab = table;
	        //先获取表中每个索引i所在位置，即每个桶
	        for (int i = 0; i < tab.length ; i++)
	        	//再获取第i个桶的头指针：Entry e = tab[i]
	        	//再遍历桶中的每个结点。判断结点值是否与指定值相等
	            for (Entry e = tab[i] ; e != null ; e = e.next)
	                if (value.equals(e.value))
	                    return true;
	        return false;
	    }

	    //判断是否包含null
	    private boolean containsNullValue() {
	        Entry[] tab = table;
	        //遍历方法同上
	        for (int i = 0; i < tab.length ; i++)
	            for (Entry e = tab[i] ; e != null ; e = e.next)
	                if (e.value == null)
	                    return true;
	        return false;
	    }

	    //浅复制HashMap
	    public Object clone() {
	        HashMap<K,V> result = null;
	        try {
	            result = (HashMap<K,V>)super.clone();
	        } catch (CloneNotSupportedException e) {
	            // assert false;
	        }
	        if (result.table != EMPTY_TABLE) {
	            result.inflateTable(Math.min(
	                (int) Math.min(
	                    size * Math.min(1 / loadFactor, 4.0f),
	                    // we have limits...
	                    HashMap.MAXIMUM_CAPACITY),
	               table.length));
	        }
	        result.entrySet = null;
	        result.modCount = 0;
	        result.size = 0;
	        result.init();
	        result.putAllForCreate(this);

	        return result;
	    }

	    //Entry结点，实现Map,Entry接口，是HashMap内部key和value的一个抽象
	    static class Entry<K,V> implements Map.Entry<K,V> {
	        final K key;//键
	        V value;//值
	        Entry<K,V> next;//下个元素指针
	        int hash;//key的hash值

	        //创建一个Entry结点
	        Entry(int h, K k, V v, Entry<K,V> n) {
	            value = v;
	            next = n;
	            key = k;
	            hash = h;
	        }
	        //获取key
	        public final K getKey() {
	            return key;
	        }
	        //获取值
	        public final V getValue() {
	            return value;
	        }
	        //设置新值，覆盖旧值
	        public final V setValue(V newValue) {
	            V oldValue = value;
	            value = newValue;
	            return oldValue;
	        }
	        //比较是否相等
	        public final boolean equals(Object o) {
	            if (!(o instanceof Map.Entry))
	                return false;
	            Map.Entry e = (Map.Entry)o;
	            Object k1 = getKey();//调用者的key
	            Object k2 = e.getKey();//比较对象的key
	            //比较key
	            if (k1 == k2 || (k1 != null && k1.equals(k2))) {
	                Object v1 = getValue();
	                Object v2 = e.getValue();
	                //比较值
	                if (v1 == v2 || (v1 != null && v1.equals(v2)))
	                    return true;
	            }
	            return false;
	        }
	        //返回hashCode值：？？？怎么返回的？
	        public final int hashCode() {
	            return Objects.hashCode(getKey()) ^ Objects.hashCode(getValue());
	        }

	        public final String toString() {
	            return getKey() + "=" + getValue();
	        }

	        //当集合中有键对应的值被覆盖时就执行这个空方法
	        //???这个方法是干嘛用的
	        void recordAccess(HashMap<K,V> m) {
	        }

	        //当Entry结点被移除的时候就执行这个方法
	        void recordRemoval(HashMap<K,V> m) {
	        }
	        
	        
	    }

	    //将指定键值加入到指定桶中,bucketIndex：桶的位置
	    void addEntry(int hash, K key, V value, int bucketIndex) {
	        if ((size >= threshold) && (null != table[bucketIndex])) {//判断是否要扩容
	            resize(2 * table.length);//两倍扩容
	            hash = (null != key) ? hash(key) : 0;
	            bucketIndex = indexFor(hash, table.length);//定位桶的位置
	        }

	        createEntry(hash, key, value, bucketIndex);
	    }

	    //创建entry：是在链表头加入新加的结点
	    void createEntry(int hash, K key, V value, int bucketIndex) {
	        Entry<K,V> e = table[bucketIndex];//先获取该桶的头指针：table[bucketIndex]
	        table[bucketIndex] = new Entry<>(hash, key, value, e);//新建结点：hash, key, value, e
	        										              //头指针指向此结点
	        size++;
	    }

	    //迭代器
	    private abstract class HashIterator<E> implements Iterator<E> {
	        Entry<K,V> next;        // 下一个返回的实体
	        int expectedModCount;   // 迭代器修改的次数
	        int index;              // Hash桶的索引号
	        Entry<K,V> current;     // 当前实体

	        HashIterator() {
	            expectedModCount = modCount;//获取修改次数
	            if (size > 0) { // 集合不为空s
	                Entry[] t = table;
	                //寻找第一个不为空的桶
	                while (index < t.length && (next = t[index++]) == null);
	            }
	        }
	        //判断是否有下一个元素
	        public final boolean hasNext() {
	            return next != null;
	        }
	        //返回下一个元素
	        final Entry<K,V> nextEntry() {
	        	//迭代期间，修改次数不同即又被修改，则抛出异常
	            if (modCount != expectedModCount)
	                throw new ConcurrentModificationException();
	            Entry<K,V> e = next;//从ｎｅｘｔ开始遍历
	            if (e == null)
	                throw new NoSuchElementException();
	            
	            //如果下个结点为空，则找到下个不为空的桶???
	            if ((next = e.next) == null) {
	                Entry[] t = table;
	                while (index < t.length && (next = t[index++]) == null)
	                    ;
	            }
	            current = e;
	            return e;
	        }
	        //删除元素
	        public void remove() {
	            if (current == null)
	                throw new IllegalStateException();
	            if (modCount != expectedModCount)
	                throw new ConcurrentModificationException();
	            Object k = current.key;
	            current = null;
	            HashMap.this.removeEntryForKey(k);//调用父类删除元素
	            expectedModCount = modCount;//修改并发修改次数
	        }
	    }
	    //HashMap值集迭代器，返回的是nextEntry迭代器值
	    private final class ValueIterator extends HashIterator<V> {
	        public V next() {
	            return nextEntry().value;
	        }
	    }
	    //HashMap键集迭代器，返回的是nextEntry迭代器中键
	    private final class KeyIterator extends HashIterator<K> {
	        public K next() {
	            return nextEntry().getKey();
	        }
	    }

	    private final class EntryIterator extends HashIterator<Map.Entry<K,V>> {
	        public Map.Entry<K,V> next() {
	            return nextEntry();
	        }
	    }

	    // Subclass overrides these to alter behavior of views' iterator() method
	    //返回键集迭代器
	    Iterator<K> newKeyIterator()   {
	        return new KeyIterator();
	    }
	    //返回值集迭代器
	    Iterator<V> newValueIterator()   {
	        return new ValueIterator();
	    }
	    //返回Entry迭代器
	    Iterator<Map.Entry<K,V>> newEntryIterator()   {
	        return new EntryIterator();
	    }

	    // Views
	    //视图集合，HashMap内部Entry集合
	    private transient Set<Map.Entry<K,V>> entrySet = null;

	    //返回键集
	    public Set<K> keySet() {
	        Set<K> ks = keySet;
	        return (ks != null ? ks : (keySet = new KeySet()));
	    }
	    //键集合的实现，实现了AbstractSet抽象类，调用了父类的方法  
	    private final class KeySet extends AbstractSet<K> {
	        public Iterator<K> iterator() {
	            return newKeyIterator();
	        }
	        public int size() {
	            return size;
	        }
	        public boolean contains(Object o) {
	            return containsKey(o);
	        }
	        public boolean remove(Object o) {
	            return HashMap.this.removeEntryForKey(o) != null;
	        }
	        public void clear() {
	            HashMap.this.clear();
	        }
	    }

	    // //返回值集合  
	    public Collection<V> values() {
	        Collection<V> vs = values;
	        return (vs != null ? vs : (values = new Values()));
	    }
	    //值集合的实现，实现了AbstractCollection抽象类，调用了父类的方法来实现  
	    private final class Values extends AbstractCollection<V> {
	        public Iterator<V> iterator() {
	            return newValueIterator();
	        }
	        public int size() {
	            return size;
	        }
	        public boolean contains(Object o) {
	            return containsValue(o);
	        }
	        public void clear() {
	            HashMap.this.clear();
	        }
	    }

	    //entry集合  
	    public Set<Map.Entry<K,V>> entrySet() {
	        return entrySet0();
	    }
	    //返回entry集合  
	    private Set<Map.Entry<K,V>> entrySet0() {
	        Set<Map.Entry<K,V>> es = entrySet;
	        return es != null ? es : (entrySet = new EntrySet());
	    }

	    private final class EntrySet extends AbstractSet<Map.Entry<K,V>> {
	        public Iterator<Map.Entry<K,V>> iterator() {
	            return newEntryIterator();
	        }
	        public boolean contains(Object o) {
	            if (!(o instanceof Map.Entry))
	                return false;
	            Map.Entry<K,V> e = (Map.Entry<K,V>) o;
	            Entry<K,V> candidate = getEntry(e.getKey());
	            return candidate != null && candidate.equals(e);
	        }
	        public boolean remove(Object o) {
	            return removeMapping(o) != null;
	        }
	        public int size() {
	            return size;
	        }
	        public void clear() {
	            HashMap.this.clear();
	        }
	    }

	    //序列化
	    private void writeObject(java.io.ObjectOutputStream s)
	        throws IOException
	    {
	        // Write out the threshold, loadfactor, and any hidden stuff
	        s.defaultWriteObject();

	        // Write out number of buckets
	        if (table==EMPTY_TABLE) {
	            s.writeInt(roundUpToPowerOf2(threshold));
	        } else {
	           s.writeInt(table.length);
	        }

	        // Write out size (number of Mappings)
	        s.writeInt(size);

	        // Write out keys and values (alternating)
	        if (size > 0) {
	            for(Map.Entry<K,V> e : entrySet0()) {
	                s.writeObject(e.getKey());
	                s.writeObject(e.getValue());
	            }
	        }
	    }

	    private static final long serialVersionUID = 362498820763181265L;

	    //反序列化
	    private void readObject(java.io.ObjectInputStream s)
	         throws IOException, ClassNotFoundException
	    {
	        // Read in the threshold (ignored), loadfactor, and any hidden stuff
	        s.defaultReadObject();
	        if (loadFactor <= 0 || Float.isNaN(loadFactor)) {
	            throw new InvalidObjectException("Illegal load factor: " +
	                                               loadFactor);
	        }

	        // set other fields that need values
	        table = (Entry<K,V>[]) EMPTY_TABLE;

	        // Read in number of buckets
	        s.readInt(); // ignored.

	        // Read number of mappings
	        int mappings = s.readInt();
	        if (mappings < 0)
	            throw new InvalidObjectException("Illegal mappings count: " +
	                                               mappings);

	        // capacity chosen by number of mappings and desired load (if >= 0.25)
	        int capacity = (int) Math.min(
	                    mappings * Math.min(1 / loadFactor, 4.0f),
	                    // we have limits...
	                    HashMap.MAXIMUM_CAPACITY);

	        // allocate the bucket array;
	        if (mappings > 0) {
	            inflateTable(capacity);
	        } else {
	            threshold = capacity;
	        }

	        init();  // Give subclass a chance to do its thing.

	        // Read the keys and values, and put the mappings in the HashMap
	        for (int i = 0; i < mappings; i++) {
	            K key = (K) s.readObject();
	            V value = (V) s.readObject();
	            putForCreate(key, value);
	        }
	    }

	    // These methods are used when serializing HashSets
	    int   capacity()     { return table.length; }
	    float loadFactor()   { return loadFactor;   }
	}
```

  
  
  