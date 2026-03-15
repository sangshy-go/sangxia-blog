---
title: "【JDK源码阅读12-util】Map接口----TreeMap"
date: 2016-11-28
category: 随笔杂谈
tags: []
---

### [TreeMap接口](http://blog.csdn.net/noaman_wgs/article/details/53141259)

参考：【http://blog.csdn.net/chenssy/article/details/26668941】

### 一、类继承关系

```
类继承关系
java.lang.Object
    java.util.AbstractMap<K,V>
        java.util.TreeMap<K,V>
```

### 二、定义：

```
public class TreeMap<K,V>
    extends AbstractMap<K,V>
    implements NavigableMap<K,V>, Cloneable, java.io.Serializable
```

\*基于红黑树的NavigableMap实现。  
 1\*TreeMap特点   
 1).利用红黑树存储结点   
 2).插入、删除、查找时间复杂度都是O(logn)   
 3).没有实现同步方法线程不安全 ，效率较高   
 4).结点可以按照排序输出，默认排序是key值，可以自定义排序方法  
   
  2\*HashMap：适用于在Map中插入、删除和定位元素。  
 Treemap：适用于按自然顺序或自定义顺序遍历键(key)。  
 HashMap通常比TreeMap快一点(树和哈希表的数据结构使然)，建议多使用HashMap，在需要排序的Map时候才用TreeMap。  
   
   3 \*注意，此实现不是同步的。  
 \*SortedMap m = Collections.synchronizedSortedMap(new TreeMap(...));

### 三、内部结构

#### 1 TreeMap中属性

```
//比较器，因为TreeMap是有序的，通过comparator接口我们可以对TreeMap的内部排序进行精密的控制
        private final Comparator<? super K> comparator;
        //TreeMap红-黑节点，为TreeMap的内部类
        private transient Entry<K,V> root = null;
        //容器大小
        private transient int size = 0;
        //TreeMap修改次数
        private transient int modCount = 0;
        //红黑树的节点颜色--红色
        private static final boolean RED = false;
        //红黑树的节点颜色--黑色
        private static final boolean BLACK = true;
```

#### 2 叶子节点Entry是TreeMap的内部类，它有几个重要的属性：

```
	//键
        K key;
        //值
        V value;
        //左孩子
        Entry<K,V> left = null;
        //右孩子
        Entry<K,V> right = null;
        //父亲
        Entry<K,V> parent;
        //颜色
        boolean color = BLACK;
```

### 四、TreeMap两个重要方法

#### 1 put()操作

- ### TreeMap put()方法实现分析

  在TreeMap的put()的实现方法中主要分为两个步骤，第一：构建排序二叉树，第二：平衡二叉树。

  对于排序二叉树的创建，其添加节点的过程如下：
- 1、以根节点为初始节点进行检索。
- 2、与当前节点进行比对，若新增节点值较大，则以当前节点的右子节点作为新的当前节点。否则以当前节点的左子节点作为新的当前节点。
- 3、循环递归2步骤知道检索出合适的叶子节点为止。
- 4、将新增节点与3步骤中找到的节点进行比对，如果新增节点较大，则添加为右子节点；否则添加为左子节点。
- 按照这个步骤我们就可以将一个新增节点添加到排序二叉树中合适的位置。如下：
- ```
  public V put(K key, V value) {  
             //用t表示二叉树的当前节点  
              Entry<K,V> t = root;  
              //t为null表示一个空树，即TreeMap中没有任何元素，直接插入  
              if (t == null) {  
                  //比较key值，个人觉得这句代码没有任何意义，空树还需要比较、排序？  
                  compare(key, key); // type (and possibly null) check  
                  //将新的key-value键值对创建为一个Entry节点，并将该节点赋予给root  
                  root = new Entry<>(key, value, null);  
                  //容器的size = 1，表示TreeMap集合中存在一个元素  
                  size = 1;  
                  //修改次数 + 1  
                  modCount++;  
                  return null;  
              }  
              int cmp;     //cmp表示key排序的返回结果  
              Entry<K,V> parent;   //父节点  
              // split comparator and comparable paths  
              Comparator<? super K> cpr = comparator;    //指定的排序算法  
              //如果cpr不为空，则采用既定的排序算法进行创建TreeMap集合  
              if (cpr != null) {  
                  do {  
                      parent = t;      //parent指向上次循环后的t  
                      //比较新增节点的key和当前节点key的大小  
                      cmp = cpr.compare(key, t.key);  
                      //cmp返回值小于0，表示新增节点的key小于当前节点的key，则以当前节点的左子节点作为新的当前节点  
                      if (cmp < 0)  
                          t = t.left;  
                      //cmp返回值大于0，表示新增节点的key大于当前节点的key，则以当前节点的右子节点作为新的当前节点  
                      else if (cmp > 0)  
                          t = t.right;  
                      //cmp返回值等于0，表示两个key值相等，则新值覆盖旧值，并返回新值  
                      else  
                          return t.setValue(value);  
                  } while (t != null);  
              }  
              //如果cpr为空，则采用默认的排序算法进行创建TreeMap集合  
              else {  
                  if (key == null)     //key值为空抛出异常  
                      throw new NullPointerException();  
                  /* 下面处理过程和上面一样 */  
                  Comparable<? super K> k = (Comparable<? super K>) key;  
                  do {  
                      parent = t;  
                      cmp = k.compareTo(t.key);  
                      if (cmp < 0)  
                          t = t.left;  
                      else if (cmp > 0)  
                          t = t.right;  
                      else  
                          return t.setValue(value);  
                  } while (t != null);  
              }  
              //将新增节点当做parent的子节点  
              Entry<K,V> e = new Entry<>(key, value, parent);  
              //如果新增节点的key小于parent的key，则当做左子节点  
              if (cmp < 0)  
                  parent.left = e;  
            //如果新增节点的key大于parent的key，则当做右子节点  
              else  
                  parent.right = e;  
              /*  
               *  上面已经完成了排序二叉树的的构建，将新增节点插入该树中的合适位置  
               *  下面fixAfterInsertion()方法就是对这棵树进行调整、平衡，具体过程参考上面的五种情况  
               */  
              fixAfterInsertion(e);  
              //TreeMap元素数量 + 1  
              size++;  
              //TreeMap容器修改次数 + 1  
              modCount++;  
              return null;  
          }
  ```

  上面代码中do{}代码块是实现排序二叉树的核心算法，通过该算法我们可以确认新增节点在该树的正确位置。找到正确位置后将插入即可，这样做了其实还没有完成，因为我知道TreeMap的底层实现是红黑树，红黑树是一棵平衡排序二叉树，普通的排序二叉树可能会出现失衡的情况，所以下一步就是要进行调整。fixAfterInsertion(e); 调整的过程务必会涉及到红黑树的左旋、右旋、着色三个基本操作。代码如下：
- ```
  /** 
       * 新增节点后的修复操作 
       * x 表示新增节点 
       */  
      private void fixAfterInsertion(Entry<K,V> x) {  
              x.color = RED;    //新增节点的颜色为红色  
              //循环 直到 x不是根节点，且x的父节点不为红色  
              while (x != null && x != root && x.parent.color == RED) {  
                  //如果X的父节点（P）是其父节点的父节点（G）的左节点  
                  if (parentOf(x) == leftOf(parentOf(parentOf(x)))) {  
                      //获取X的叔节点(U)  
                      Entry<K,V> y = rightOf(parentOf(parentOf(x)));  
                      //如果X的叔节点（U） 为红色（情况三）  
                      if (colorOf(y) == RED) {       
                          //将X的父节点（P）设置为黑色  
                          setColor(parentOf(x), BLACK);  
                          //将X的叔节点（U）设置为黑色  
                          setColor(y, BLACK);  
                          //将X的父节点的父节点（G）设置红色  
                          setColor(parentOf(parentOf(x)), RED);  
                          x = parentOf(parentOf(x));  
                      }  
                      //如果X的叔节点（U为黑色）；这里会存在两种情况（情况四、情况五）  
                      else {     
                          //如果X节点为其父节点（P）的右子树，则进行左旋转（情况四）  
                          if (x == rightOf(parentOf(x))) {  
                              //将X的父节点作为X  
                              x = parentOf(x);  
                              //右旋转  
                              rotateLeft(x);  
                          }  
                          //（情况五）  
                          //将X的父节点（P）设置为黑色  
                          setColor(parentOf(x), BLACK);  
                          //将X的父节点的父节点（G）设置红色  
                          setColor(parentOf(parentOf(x)), RED);  
                          //以X的父节点的父节点（G）为中心右旋转  
                          rotateRight(parentOf(parentOf(x)));  
                      }  
                  }  
                  //如果X的父节点（P）是其父节点的父节点（G）的右节点  
                  else {  
                      //获取X的叔节点（U）  
                      Entry<K,V> y = leftOf(parentOf(parentOf(x)));  
                    //如果X的叔节点（U） 为红色（情况三）  
                      if (colorOf(y) == RED) {  
                          //将X的父节点（P）设置为黑色  
                          setColor(parentOf(x), BLACK);  
                          //将X的叔节点（U）设置为黑色  
                          setColor(y, BLACK);  
                          //将X的父节点的父节点（G）设置红色  
                          setColor(parentOf(parentOf(x)), RED);  
                          x = parentOf(parentOf(x));  
                      }  
                    //如果X的叔节点（U为黑色）；这里会存在两种情况（情况四、情况五）  
                      else {  
                          //如果X节点为其父节点（P）的右子树，则进行左旋转（情况四）  
                          if (x == leftOf(parentOf(x))) {  
                              //将X的父节点作为X  
                              x = parentOf(x);  
                             //右旋转  
                              rotateRight(x);  
                          }  
                          //（情况五）  
                          //将X的父节点（P）设置为黑色  
                          setColor(parentOf(x), BLACK);  
                          //将X的父节点的父节点（G）设置红色  
                          setColor(parentOf(parentOf(x)), RED);  
                          //以X的父节点的父节点（G）为中心右旋转  
                          rotateLeft(parentOf(parentOf(x)));  
                      }  
                  }  
              }  
              //将根节点G强制设置为黑色  
              root.color = BLACK;  
          }
  ```

#### 2   delete()方法

- ### TreeMap deleteEntry()方法实现分析
- 通过上面的分析我们确认删除节点的步骤是：找到一个替代子节点C来替代P，然后直接删除C，最后调整这棵红黑树。下面代码是寻找替代节点、删除替代节点。

```
private void deleteEntry(Entry<K,V> p) {  
        modCount++;      //修改次数 +1  
        size--;          //元素个数 -1  
  
        /* 
         * 被删除节点的左子树和右子树都不为空，那么就用 p节点的中序后继节点代替 p 节点 
         * successor(P)方法为寻找P的替代节点。规则是右分支最左边，或者 左分支最右边的节点 
         * ---------------------（1） 
         */  
        if (p.left != null && p.right != null) {    
            Entry<K,V> s = successor(p);  
            p.key = s.key;  
            p.value = s.value;  
            p = s;  
        }  
  
        //replacement为替代节点，如果P的左子树存在那么就用左子树替代，否则用右子树替代  
        Entry<K,V> replacement = (p.left != null ? p.left : p.right);  
  
        /* 
         * 删除节点，分为上面提到的三种情况 
         * -----------------------（2） 
         */  
        //如果替代节点不为空  
        if (replacement != null) {  
            replacement.parent = p.parent;  
            /* 
             *replacement来替代P节点 
             */  
            //若P没有父节点，则跟节点直接变成replacement  
            if (p.parent == null)  
                root = replacement;  
            //如果P为左节点，则用replacement来替代为左节点  
            else if (p == p.parent.left)  
                p.parent.left  = replacement;  
          //如果P为右节点，则用replacement来替代为右节点  
            else  
                p.parent.right = replacement;  
  
            //同时将P节点从这棵树中剔除掉  
            p.left = p.right = p.parent = null;  
  
            /* 
             * 若P为红色直接删除，红黑树保持平衡 
             * 但是若P为黑色，则需要调整红黑树使其保持平衡 
             */  
            if (p.color == BLACK)  
                fixAfterDeletion(replacement);  
        } else if (p.parent == null) {     //p没有父节点，表示为P根节点，直接删除即可  
            root = null;  
        } else {      //P节点不存在子节点，直接删除即可  
            if (p.color == BLACK)         //如果P节点的颜色为黑色，对红黑树进行调整  
                fixAfterDeletion(p);  
  
            //删除P节点  
            if (p.parent != null) {  
                if (p == p.parent.left)  
                    p.parent.left = null;  
                else if (p == p.parent.right)  
                    p.parent.right = null;  
                p.parent = null;  
            }  
        }  
    }
```

  

删除完节点后，就要根据情况来对红黑树进行复杂的调整：fixAfterDeletion()。

```
private void fixAfterDeletion(Entry<K,V> x) {  
        // 删除节点需要一直迭代，知道 直到 x 不是根节点，且 x 的颜色是黑色  
        while (x != root && colorOf(x) == BLACK) {  
            if (x == leftOf(parentOf(x))) {      //若X节点为左节点  
                //获取其兄弟节点  
                Entry<K,V> sib = rightOf(parentOf(x));  
  
                /* 
                 * 如果兄弟节点为红色----（情况3.1） 
                 * 策略：改变W、P的颜色，然后进行一次左旋转 
                 */  
                if (colorOf(sib) == RED) {       
                    setColor(sib, BLACK);       
                    setColor(parentOf(x), RED);    
                    rotateLeft(parentOf(x));  
                    sib = rightOf(parentOf(x));  
                }  
                /* 
                 * 若兄弟节点的两个子节点都为黑色----（情况3.2） 
                 * 策略：将兄弟节点编程红色 
                 */  
                if (colorOf(leftOf(sib))  == BLACK &&  
                    colorOf(rightOf(sib)) == BLACK) {  
                    setColor(sib, RED);  
                    x = parentOf(x);  
                }   
                else {  
                    /* 
                     * 如果兄弟节点只有右子树为黑色----（情况3.3） 
                     * 策略：将兄弟节点与其左子树进行颜色互换然后进行右转 
                     * 这时情况会转变为3.4 
                     */  
                    if (colorOf(rightOf(sib)) == BLACK) {  
                        setColor(leftOf(sib), BLACK);  
                        setColor(sib, RED);  
                        rotateRight(sib);  
                        sib = rightOf(parentOf(x));  
                    }  
                    /* 
                     *----情况3.4 
                     *策略：交换兄弟节点和父节点的颜色， 
                     *同时将兄弟节点右子树设置为黑色，最后左旋转 
                     */  
                    setColor(sib, colorOf(parentOf(x)));  
                    setColor(parentOf(x), BLACK);  
                    setColor(rightOf(sib), BLACK);  
                    rotateLeft(parentOf(x));  
                    x = root;  
                }  
            }   
              
            /** 
             * X节点为右节点与其为做节点处理过程差不多，这里就不在累述了 
             */  
            else {  
                Entry<K,V> sib = leftOf(parentOf(x));  
  
                if (colorOf(sib) == RED) {  
                    setColor(sib, BLACK);  
                    setColor(parentOf(x), RED);  
                    rotateRight(parentOf(x));  
                    sib = leftOf(parentOf(x));  
                }  
  
                if (colorOf(rightOf(sib)) == BLACK &&  
                    colorOf(leftOf(sib)) == BLACK) {  
                    setColor(sib, RED);  
                    x = parentOf(x);  
                } else {  
                    if (colorOf(leftOf(sib)) == BLACK) {  
                        setColor(rightOf(sib), BLACK);  
                        setColor(sib, RED);  
                        rotateLeft(sib);  
                        sib = leftOf(parentOf(x));  
                    }  
                    setColor(sib, colorOf(parentOf(x)));  
                    setColor(parentOf(x), BLACK);  
                    setColor(leftOf(sib), BLACK);  
                    rotateRight(parentOf(x));  
                    x = root;  
                }  
            }  
        }  
        setColor(x, BLACK);
```

这是红黑树在删除节点后，对树的平衡性进行调整的过程，其实现过程与上面四种复杂的情况一一对应，

所以在这个源码的时候一定要对着上面提到的四种情况看。

贴源码：没怎么分析，以后有空再回头看看原理。

```
	/**
	 *基于红黑树的NavigableMap实现。
	 1*TreeMap特点 
		1).利用红黑树存储结点 
		2).插入、删除、查找时间复杂度都是O(logn) 
		3).没有实现同步方法线程不安全 ，效率较高 
		4).结点可以按照排序输出，默认排序是key值，可以自定义排序方法
		
	  2*HashMap：适用于在Map中插入、删除和定位元素。
		Treemap：适用于按自然顺序或自定义顺序遍历键(key)。
		HashMap通常比TreeMap快一点(树和哈希表的数据结构使然)，建议多使用HashMap，在需要排序的Map时候才用TreeMap。

	   3 *注意，此实现不是同步的。
		 *SortedMap m = Collections.synchronizedSortedMap(new TreeMap(...));
	 */

	public static class TreeMap<K,V>
	    extends AbstractMap<K,V>
	    implements NavigableMap<K,V>, Cloneable, java.io.Serializable
	{
	    /**
	     *自定义比较器，默认为null,表示用key自然排序
	     */
	    private final Comparator<? super K> comparator;
	    //根结点
	    private transient Entry<K,V> root = null;
	    //树中结点个数
	    private transient int size = 0;
	    //树结构修改次数
	    private transient int modCount = 0;

	    //建一个空的构造函数，这里面使用了比较器默认值为null，使用key的自然排序
	    public TreeMap() {
	        comparator = null;
	    }

	    //构建一个指定的自定义比较器是comparator的构造函数
	    public TreeMap(Comparator<? super K> comparator) {
	        this.comparator = comparator;
	    }

	    //创建构造函数，放入集合m中的所有元素
	    public TreeMap(Map<? extends K, ? extends V> m) {
	        comparator = null;
	        putAll(m);//
	    }

	    //创建一个构造函数，按照指定集合指定的顺序放入集合中的元素m
	    public TreeMap(SortedMap<K, ? extends V> m) {
	        comparator = m.comparator();
	        try {
	            buildFromSorted(m.size(), m.entrySet().iterator(), null, null);
	        } catch (java.io.IOException cannotHappen) {
	        } catch (ClassNotFoundException cannotHappen) {
	        }
	    }


	    // Query Operations
	    //返回集合中键值对的个数
	    public int size() {
	        return size;
	    }

	    //是否含有指定键key
	    public boolean containsKey(Object key) {
	        return getEntry(key) != null;
	    }

	    //是否含有指定值value
	    public boolean containsValue(Object value) {
	    	//从头结点开始遍历
	        for (Entry<K,V> e = getFirstEntry(); e != null; e = successor(e))
	            if (valEquals(value, e.value))
	                return true;
	        return false;
	    }

	    //获取指定键key对应的value值
	    //先获取指定的结点Entry，再返回对应的结点的值
	    public V get(Object key) {
	        Entry<K,V> p = getEntry(key);//调用的是下面的getEntry()的方法
	        return (p==null ? null : p.value);
	    }
	    //返回遍历器
	    public Comparator<? super K> comparator() {
	        return comparator;
	    }

	    //获取第一个结点的key
	    public K firstKey() {
	        return key(getFirstEntry());//先获取第一个结点，再获取第一个结点的key
	    }

	    //获取最后一个结点的key
	    public K lastKey() {
	        return key(getLastEntry());//先获取最后一个结点，再获取最后一个结点的key
	    }

	    //将指定集合中元素map添加到此集合中
	    //？？？？？？
	    public void putAll(Map<? extends K, ? extends V> map) {
	        int mapSize = map.size();
	        if (size==0 && mapSize!=0 && map instanceof SortedMap) {
	            Comparator c = ((SortedMap)map).comparator();
	            if (c == comparator || (c != null && c.equals(comparator))) {
	                ++modCount;
	                try {
	                    buildFromSorted(mapSize, map.entrySet().iterator(),
	                                    null, null);
	                } catch (java.io.IOException cannotHappen) {
	                } catch (ClassNotFoundException cannotHappen) {
	                }
	                return;
	            }
	        }
	        super.putAll(map);
	    }
	    //？？？？？？
	    
	    /**
	     * 根据指定key返回对应的结点Entry
	     * 方式一:有比较器的情况:getEntryUsingComparator
	     * 方式二：有可比较接口的情况:Comparable
	     */
	    final Entry<K,V> getEntry(Object key) {
	    	 // 方式一：有比较器的情况，返回getEntryUsingComparator(Object key)的结果
	        if (comparator != null)
	            return getEntryUsingComparator(key);
	        
	        if (key == null)
	            throw new NullPointerException();//键为空，抛异常
	        
	        // 方式二：有可比较接口的情况:Comparable
	        //如果没有比较器，而是实现了可比较的接口：Comparable(只含有一个方法：compareTo)
	        Comparable<? super K> k = (Comparable<? super K>) key;
	        Entry<K,V> p = root;//获取根结点
	        //对树进行遍历查找结点
	        while (p != null) {
	        	//把key和当前结点的key(p.key)进行对比
	            int cmp = k.compareTo(p.key);
	            //key小于当前结点的key
	            /**
	             * 解释下为什么左移：当前结点key > 指定key值，那么就要找更小的值，为什么是找左结点而不是找右结点呢？
	             * 原因是：红黑树的特点任一结点都比左边结点值大，比右边结点值小
	             * 	     所以当前结点偏大，要想缩小范围就要继续找左边结点(当前结点的左边结点值均小于当前结点)
	             */
	            //当前结点key > 指定key值
	            if (cmp < 0)
	            	//p移动到左结点上(即比较下个左结点)
	                p = p.left;
	            //当前结点的key  <  指定key
	            else if (cmp > 0)
	            	//p移动到右结点上
	                p = p.right;
	            else
	                return p;//否则就是相等返回当前结点
	        }
	        return null;//没找到则返回null
	    }

	   //方式一:有比较器的情况:getEntryUsingComparator
	    final Entry<K,V> getEntryUsingComparator(Object key) {
	        K k = (K) key;
	        //获取比较器
	        Comparator<? super K> cpr = comparator;
	        //比较器不为空
	        if (cpr != null) {
	            Entry<K,V> p = root;//获取根结点
	            //遍历树
	            while (p != null) {
	            	//判断当前结点与指定结点的key大小,直接调用比较器中方法compare(a,b)
	                int cmp = cpr.compare(k, p.key);
	                //当前结点key 大于 指定key,遍历下个左子节点
	                if (cmp < 0)
	                    p = p.left;
	                //当前结点key大于指定key,遍历下个右子节点
	                else if (cmp > 0)
	                    p = p.right;
	                else
	                    return p;//相等
	            }
	        }
	        return null;//没找到
	    }

	    /**
	     * 寻找key对应的结点。
	     * 如果没有直接对应的节点，
	     * 			若都大于 key，返回最小的结点
	     * 			若都小于key， 返回最大的结点
	     */
	    final Entry<K,V> getCeilingEntry(K key) {
	        Entry<K,V> p = root;
	        while (p != null) {//遍历树
	            int cmp = compare(key, p.key);//比较指定key与当前结点的key
	            //当前结点key > 指定key
	            if (cmp < 0) {
	                if (p.left != null)
	                    p = p.left;
	                else
	                    return p;//返回最小的结点
	            } 
	            //当前结点key < 指定key
	            else if (cmp > 0) {
	                if (p.right != null) {
	                    p = p.right;
	                } else {
	                    Entry<K,V> parent = p.parent;
	                    Entry<K,V> ch = p;
	                    while (parent != null && ch == parent.right) {
	                        ch = parent;
	                        parent = parent.parent;
	                    }
	                    return parent;
	                }
	            } else
	                return p;
	        }
	        return null;
	    }

	    /**
	     * Gets the entry corresponding to the specified key; if no such entry
	     * exists, returns the entry for the greatest key less than the specified
	     * key; if no such entry exists, returns {@code null}.
	     */
	    final Entry<K,V> getFloorEntry(K key) {
	        Entry<K,V> p = root;
	        while (p != null) {
	            int cmp = compare(key, p.key);
	            if (cmp > 0) {
	                if (p.right != null)
	                    p = p.right;
	                else
	                    return p;
	            } else if (cmp < 0) {
	                if (p.left != null) {
	                    p = p.left;
	                } else {
	                    Entry<K,V> parent = p.parent;
	                    Entry<K,V> ch = p;
	                    while (parent != null && ch == parent.left) {
	                        ch = parent;
	                        parent = parent.parent;
	                    }
	                    return parent;
	                }
	            } else
	                return p;

	        }
	        return null;
	    }

	    /**
	     * Gets the entry for the least key greater than the specified
	     * key; if no such entry exists, returns the entry for the least
	     * key greater than the specified key; if no such entry exists
	     * returns {@code null}.
	     */
	    final Entry<K,V> getHigherEntry(K key) {
	        Entry<K,V> p = root;
	        while (p != null) {
	            int cmp = compare(key, p.key);
	            if (cmp < 0) {
	                if (p.left != null)
	                    p = p.left;
	                else
	                    return p;
	            } else {
	                if (p.right != null) {
	                    p = p.right;
	                } else {
	                    Entry<K,V> parent = p.parent;
	                    Entry<K,V> ch = p;
	                    while (parent != null && ch == parent.right) {
	                        ch = parent;
	                        parent = parent.parent;
	                    }
	                    return parent;
	                }
	            }
	        }
	        return null;
	    }

	    /**
	     * Returns the entry for the greatest key less than the specified key; if
	     * no such entry exists (i.e., the least key in the Tree is greater than
	     * the specified key), returns {@code null}.
	     */
	    final Entry<K,V> getLowerEntry(K key) {
	        Entry<K,V> p = root;
	        while (p != null) {
	            int cmp = compare(key, p.key);
	            if (cmp > 0) {
	                if (p.right != null)
	                    p = p.right;
	                else
	                    return p;
	            } else {
	                if (p.left != null) {
	                    p = p.left;
	                } else {
	                    Entry<K,V> parent = p.parent;
	                    Entry<K,V> ch = p;
	                    while (parent != null && ch == parent.left) {
	                        ch = parent;
	                        parent = parent.parent;
	                    }
	                    return parent;
	                }
	            }
	        }
	        return null;
	    }

	    /**
	     * 按指定的排序算法存储值。如果先前有key对应的值，就覆盖
	     */
	    public V put(K key, V value) {
	    	//t表示二叉树的当前结点
	        Entry<K,V> t = root;
	        //t为null，即为空树，直接插入元素
	        if (t == null) {
	            compare(key, key); //自己与自己比较大小
	            root = new Entry<>(key, value, null);//根据指定的key-value键值对直接创建一个Entry结点,赋给root
	            size = 1;//大小设为1
	            modCount++;//修改次数+1
	            return null;
	        }
	        int cmp;//返回的排序结果
	        Entry<K,V> parent;//父节点
	        // split comparator and comparable paths
	        Comparator<? super K> cpr = comparator;//指定的排序算法插入元素
	        //指定了排序算法，就用这个算法创建Treemap集合
	        if (cpr != null) {
	            do {
	                parent = t;//parent指向上次循环后的t  
	                //比较新增节点的key和当前节点key(t.key)的大小  
	                cmp = cpr.compare(key, t.key);
	                //cmp返回值小于0:key  <  t.key
	                //表示新增节点的key小于当前节点的key(t.key)，则以当前节点的左子节点作为新的当前节点  
	                if (cmp < 0)
	                    t = t.left;
	                //同上理
	                else if (cmp > 0)
	                    t = t.right;
	                else
	                    return t.setValue(value);//key已经存在，覆盖原来的值
	            } while (t != null);
	        }
	        //没有指定排序算法,按默认的排序算法进行处理
	        else {
	            if (key == null)
	                throw new NullPointerException();
	            Comparable<? super K> k = (Comparable<? super K>) key;
	            do {
	                parent = t;
	                cmp = k.compareTo(t.key);
	                if (cmp < 0)
	                    t = t.left;
	                else if (cmp > 0)
	                    t = t.right;
	                else
	                    return t.setValue(value);
	            } while (t != null);
	        }
	        //将新增的结点当做parent的子结点
	        Entry<K,V> e = new Entry<>(key, value, parent);
	        //如果新增节点的key小于parent的key，则当做左子节点  
	        if (cmp < 0)
	            parent.left = e;
	      //如果新增节点的key大于parent的key，则当做右子节点  
	        else
	            parent.right = e;
	        /*  
             *  上面已经完成了排序二叉树的的构建，将新增节点插入该树中的合适位置  
             *  下面fixAfterInsertion()方法就是对这棵树进行调整、平衡
             */  
	        fixAfterInsertion(e);
	        size++;
	        modCount++;
	        return null;
	    }

	    //删除key对应的结点
	    public V remove(Object key) {
	        Entry<K,V> p = getEntry(key);//获取key对应的结点
	        if (p == null)
	            return null;

	        V oldValue = p.value;//获取结点对应的值
	        deleteEntry(p);//删除
	        return oldValue;//返回原先值 
	    }

	    //清空
	    public void clear() {
	        modCount++;
	        size = 0;
	        root = null;
	    }

	    //浅拷贝
	    public Object clone() {
	        TreeMap<K,V> clone = null;
	        try {
	            clone = (TreeMap<K,V>) super.clone();
	        } catch (CloneNotSupportedException e) {
	            throw new InternalError();
	        }

	        // Put clone into "virgin" state (except for comparator)
	        clone.root = null;
	        clone.size = 0;
	        clone.modCount = 0;
	        clone.entrySet = null;
	        clone.navigableKeySet = null;
	        clone.descendingMap = null;

	        // Initialize clone with our mappings
	        try {
	            clone.buildFromSorted(size, entrySet().iterator(), null, null);
	        } catch (java.io.IOException cannotHappen) {
	        } catch (ClassNotFoundException cannotHappen) {
	        }

	        return clone;
	    }

	    // NavigableMap API methods
	    //获取第一个结点
	    public Map.Entry<K,V> firstEntry() {
	        return exportEntry(getFirstEntry());
	    }

	    //获取最后一个结点
	    public Map.Entry<K,V> lastEntry() {
	        return exportEntry(getLastEntry());
	    }

	    //弹出第一个结点
	    public Map.Entry<K,V> pollFirstEntry() {
	        Entry<K,V> p = getFirstEntry();
	        Map.Entry<K,V> result = exportEntry(p);
	        if (p != null)
	            deleteEntry(p);
	        return result;
	    }

	    //弹出最后一个结点
	    public Map.Entry<K,V> pollLastEntry() {
	        Entry<K,V> p = getLastEntry();
	        Map.Entry<K,V> result = exportEntry(p);
	        if (p != null)
	            deleteEntry(p);
	        return result;
	    }

	    /**
	     *获取小于key的结点 
	     *	若都小于key，返回最大结点 
	     *	若都大于key，返回最小结点
	     */
	    public Map.Entry<K,V> lowerEntry(K key) {
	        return exportEntry(getLowerEntry(key));
	    }

	    /**
	     *获取小于等于key的结点 
	     *		若都小于key，返回最大的结点 
	     *		若都大于key，返回最小的结点 
	     */
	    public K lowerKey(K key) {
	        return keyOrNull(getLowerEntry(key));
	    }

	    /**
	     *获取大于key的结点 
	     *		若都大于key，返回最小值 
	     *		若都小于key，返回最大值 
	     */
	    public Map.Entry<K,V> floorEntry(K key) {
	        return exportEntry(getFloorEntry(key));
	    }

	    /**
	     * @throws ClassCastException {@inheritDoc}
	     * @throws NullPointerException if the specified key is null
	     *         and this map uses natural ordering, or its comparator
	     *         does not permit null keys
	     * @since 1.6
	     */
	    public K floorKey(K key) {
	        return keyOrNull(getFloorEntry(key));
	    }

	    /**
	     * @throws ClassCastException {@inheritDoc}
	     * @throws NullPointerException if the specified key is null
	     *         and this map uses natural ordering, or its comparator
	     *         does not permit null keys
	     * @since 1.6
	     */
	    public Map.Entry<K,V> ceilingEntry(K key) {
	        return exportEntry(getCeilingEntry(key));
	    }

	    /**
	     * @throws ClassCastException {@inheritDoc}
	     * @throws NullPointerException if the specified key is null
	     *         and this map uses natural ordering, or its comparator
	     *         does not permit null keys
	     * @since 1.6
	     */
	    public K ceilingKey(K key) {
	        return keyOrNull(getCeilingEntry(key));
	    }

	    /**
	     * @throws ClassCastException {@inheritDoc}
	     * @throws NullPointerException if the specified key is null
	     *         and this map uses natural ordering, or its comparator
	     *         does not permit null keys
	     * @since 1.6
	     */
	    public Map.Entry<K,V> higherEntry(K key) {
	        return exportEntry(getHigherEntry(key));
	    }

	    /**
	     * @throws ClassCastException {@inheritDoc}
	     * @throws NullPointerException if the specified key is null
	     *         and this map uses natural ordering, or its comparator
	     *         does not permit null keys
	     * @since 1.6
	     */
	    public K higherKey(K key) {
	        return keyOrNull(getHigherEntry(key));
	    }

	    // Views迭代器相关
	    private transient EntrySet entrySet = null;
	    private transient KeySet<K> navigableKeySet = null;
	    private transient NavigableMap<K,V> descendingMap = null;

	    //keySet
	    public Set<K> keySet() {
	        return navigableKeySet();
	    }

	    /**
	     * @since 1.6
	     */
	    public NavigableSet<K> navigableKeySet() {
	        KeySet<K> nks = navigableKeySet;
	        return (nks != null) ? nks : (navigableKeySet = new KeySet(this));
	    }

	    /**
	     * @since 1.6
	     */
	    public NavigableSet<K> descendingKeySet() {
	        return descendingMap().navigableKeySet();
	    }

	    /**
	     * values
	     */
	    public Collection<V> values() {
	        Collection<V> vs = values;
	        return (vs != null) ? vs : (values = new Values());
	    }

	    /**
	     *entrySet
	     */
	    public Set<Map.Entry<K,V>> entrySet() {
	        EntrySet es = entrySet;
	        return (es != null) ? es : (entrySet = new EntrySet());
	    }

	    /**
	     * @since 1.6
	     */
	    public NavigableMap<K, V> descendingMap() {
	        NavigableMap<K, V> km = descendingMap;
	        return (km != null) ? km :
	            (descendingMap = new DescendingSubMap(this,
	                                                  true, null, true,
	                                                  true, null, true));
	    }

	    /**
	     * @throws ClassCastException       {@inheritDoc}
	     * @throws NullPointerException if {@code fromKey} or {@code toKey} is
	     *         null and this map uses natural ordering, or its comparator
	     *         does not permit null keys
	     * @throws IllegalArgumentException {@inheritDoc}
	     * @since 1.6
	     */
	    public NavigableMap<K,V> subMap(K fromKey, boolean fromInclusive,
	                                    K toKey,   boolean toInclusive) {
	        return new AscendingSubMap(this,
	                                   false, fromKey, fromInclusive,
	                                   false, toKey,   toInclusive);
	    }

	    /**
	     * @throws ClassCastException       {@inheritDoc}
	     * @throws NullPointerException if {@code toKey} is null
	     *         and this map uses natural ordering, or its comparator
	     *         does not permit null keys
	     * @throws IllegalArgumentException {@inheritDoc}
	     * @since 1.6
	     */
	    public NavigableMap<K,V> headMap(K toKey, boolean inclusive) {
	        return new AscendingSubMap(this,
	                                   true,  null,  true,
	                                   false, toKey, inclusive);
	    }

	    /**
	     * @throws ClassCastException       {@inheritDoc}
	     * @throws NullPointerException if {@code fromKey} is null
	     *         and this map uses natural ordering, or its comparator
	     *         does not permit null keys
	     * @throws IllegalArgumentException {@inheritDoc}
	     * @since 1.6
	     */
	    public NavigableMap<K,V> tailMap(K fromKey, boolean inclusive) {
	        return new AscendingSubMap(this,
	                                   false, fromKey, inclusive,
	                                   true,  null,    true);
	    }

	    /**
	     * @throws ClassCastException       {@inheritDoc}
	     * @throws NullPointerException if {@code fromKey} or {@code toKey} is
	     *         null and this map uses natural ordering, or its comparator
	     *         does not permit null keys
	     * @throws IllegalArgumentException {@inheritDoc}
	     */
	    public SortedMap<K,V> subMap(K fromKey, K toKey) {
	        return subMap(fromKey, true, toKey, false);
	    }

	    /**
	     * @throws ClassCastException       {@inheritDoc}
	     * @throws NullPointerException if {@code toKey} is null
	     *         and this map uses natural ordering, or its comparator
	     *         does not permit null keys
	     * @throws IllegalArgumentException {@inheritDoc}
	     */
	    public SortedMap<K,V> headMap(K toKey) {
	        return headMap(toKey, false);
	    }

	    /**
	     * @throws ClassCastException       {@inheritDoc}
	     * @throws NullPointerException if {@code fromKey} is null
	     *         and this map uses natural ordering, or its comparator
	     *         does not permit null keys
	     * @throws IllegalArgumentException {@inheritDoc}
	     */
	    public SortedMap<K,V> tailMap(K fromKey) {
	        return tailMap(fromKey, true);
	    }

	    // View class support

	    class Values extends AbstractCollection<V> {
	        public Iterator<V> iterator() {
	            return new ValueIterator(getFirstEntry());
	        }

	        public int size() {
	            return TreeMap.this.size();
	        }

	        public boolean contains(Object o) {
	            return TreeMap.this.containsValue(o);
	        }

	        public boolean remove(Object o) {
	            for (Entry<K,V> e = getFirstEntry(); e != null; e = successor(e)) {
	                if (valEquals(e.getValue(), o)) {
	                    deleteEntry(e);
	                    return true;
	                }
	            }
	            return false;
	        }

	        public void clear() {
	            TreeMap.this.clear();
	        }
	    }

	    class EntrySet extends AbstractSet<Map.Entry<K,V>> {
	        public Iterator<Map.Entry<K,V>> iterator() {
	            return new EntryIterator(getFirstEntry());
	        }

	        public boolean contains(Object o) {
	            if (!(o instanceof Map.Entry))
	                return false;
	            Map.Entry<K,V> entry = (Map.Entry<K,V>) o;
	            V value = entry.getValue();
	            Entry<K,V> p = getEntry(entry.getKey());
	            return p != null && valEquals(p.getValue(), value);
	        }

	        public boolean remove(Object o) {
	            if (!(o instanceof Map.Entry))
	                return false;
	            Map.Entry<K,V> entry = (Map.Entry<K,V>) o;
	            V value = entry.getValue();
	            Entry<K,V> p = getEntry(entry.getKey());
	            if (p != null && valEquals(p.getValue(), value)) {
	                deleteEntry(p);
	                return true;
	            }
	            return false;
	        }

	        public int size() {
	            return TreeMap.this.size();
	        }

	        public void clear() {
	            TreeMap.this.clear();
	        }
	    }

	    /*
	     * Unlike Values and EntrySet, the KeySet class is static,
	     * delegating to a NavigableMap to allow use by SubMaps, which
	     * outweighs the ugliness of needing type-tests for the following
	     * Iterator methods that are defined appropriately in main versus
	     * submap classes.
	     */

	    Iterator<K> keyIterator() {
	        return new KeyIterator(getFirstEntry());
	    }

	    Iterator<K> descendingKeyIterator() {
	        return new DescendingKeyIterator(getLastEntry());
	    }

	    static final class KeySet<E> extends AbstractSet<E> implements NavigableSet<E> {
	        private final NavigableMap<E, Object> m;
	        KeySet(NavigableMap<E,Object> map) { m = map; }

	        public Iterator<E> iterator() {
	            if (m instanceof TreeMap)
	                return ((TreeMap<E,Object>)m).keyIterator();
	            else
	                return (Iterator<E>)(((TreeMap.NavigableSubMap)m).keyIterator());
	        }

	        public Iterator<E> descendingIterator() {
	            if (m instanceof TreeMap)
	                return ((TreeMap<E,Object>)m).descendingKeyIterator();
	            else
	                return (Iterator<E>)(((TreeMap.NavigableSubMap)m).descendingKeyIterator());
	        }

	        public int size() { return m.size(); }
	        public boolean isEmpty() { return m.isEmpty(); }
	        public boolean contains(Object o) { return m.containsKey(o); }
	        public void clear() { m.clear(); }
	        public E lower(E e) { return m.lowerKey(e); }
	        public E floor(E e) { return m.floorKey(e); }
	        public E ceiling(E e) { return m.ceilingKey(e); }
	        public E higher(E e) { return m.higherKey(e); }
	        public E first() { return m.firstKey(); }
	        public E last() { return m.lastKey(); }
	        public Comparator<? super E> comparator() { return m.comparator(); }
	        public E pollFirst() {
	            Map.Entry<E,Object> e = m.pollFirstEntry();
	            return (e == null) ? null : e.getKey();
	        }
	        public E pollLast() {
	            Map.Entry<E,Object> e = m.pollLastEntry();
	            return (e == null) ? null : e.getKey();
	        }
	        public boolean remove(Object o) {
	            int oldSize = size();
	            m.remove(o);
	            return size() != oldSize;
	        }
	        public NavigableSet<E> subSet(E fromElement, boolean fromInclusive,
	                                      E toElement,   boolean toInclusive) {
	            return new KeySet<>(m.subMap(fromElement, fromInclusive,
	                                          toElement,   toInclusive));
	        }
	        public NavigableSet<E> headSet(E toElement, boolean inclusive) {
	            return new KeySet<>(m.headMap(toElement, inclusive));
	        }
	        public NavigableSet<E> tailSet(E fromElement, boolean inclusive) {
	            return new KeySet<>(m.tailMap(fromElement, inclusive));
	        }
	        public SortedSet<E> subSet(E fromElement, E toElement) {
	            return subSet(fromElement, true, toElement, false);
	        }
	        public SortedSet<E> headSet(E toElement) {
	            return headSet(toElement, false);
	        }
	        public SortedSet<E> tailSet(E fromElement) {
	            return tailSet(fromElement, true);
	        }
	        public NavigableSet<E> descendingSet() {
	            return new KeySet(m.descendingMap());
	        }
	    }

	    /**
	     * Base class for TreeMap Iterators
	     */
	    abstract class PrivateEntryIterator<T> implements Iterator<T> {
	        Entry<K,V> next;
	        Entry<K,V> lastReturned;
	        int expectedModCount;

	        PrivateEntryIterator(Entry<K,V> first) {
	            expectedModCount = modCount;
	            lastReturned = null;
	            next = first;
	        }

	        public final boolean hasNext() {
	            return next != null;
	        }

	        final Entry<K,V> nextEntry() {
	            Entry<K,V> e = next;
	            if (e == null)
	                throw new NoSuchElementException();
	            if (modCount != expectedModCount)
	                throw new ConcurrentModificationException();
	            next = successor(e);
	            lastReturned = e;
	            return e;
	        }

	        final Entry<K,V> prevEntry() {
	            Entry<K,V> e = next;
	            if (e == null)
	                throw new NoSuchElementException();
	            if (modCount != expectedModCount)
	                throw new ConcurrentModificationException();
	            next = predecessor(e);
	            lastReturned = e;
	            return e;
	        }

	        public void remove() {
	            if (lastReturned == null)
	                throw new IllegalStateException();
	            if (modCount != expectedModCount)
	                throw new ConcurrentModificationException();
	            // deleted entries are replaced by their successors
	            if (lastReturned.left != null && lastReturned.right != null)
	                next = lastReturned;
	            deleteEntry(lastReturned);
	            expectedModCount = modCount;
	            lastReturned = null;
	        }
	    }

	    final class EntryIterator extends PrivateEntryIterator<Map.Entry<K,V>> {
	        EntryIterator(Entry<K,V> first) {
	            super(first);
	        }
	        public Map.Entry<K,V> next() {
	            return nextEntry();
	        }
	    }

	    final class ValueIterator extends PrivateEntryIterator<V> {
	        ValueIterator(Entry<K,V> first) {
	            super(first);
	        }
	        public V next() {
	            return nextEntry().value;
	        }
	    }

	    final class KeyIterator extends PrivateEntryIterator<K> {
	        KeyIterator(Entry<K,V> first) {
	            super(first);
	        }
	        public K next() {
	            return nextEntry().key;
	        }
	    }

	    final class DescendingKeyIterator extends PrivateEntryIterator<K> {
	        DescendingKeyIterator(Entry<K,V> first) {
	            super(first);
	        }
	        public K next() {
	            return prevEntry().key;
	        }
	    }

	    //比较方法
	    /**
	     * Compares two keys using the correct comparison method for this TreeMap.
	     */
	    final int compare(Object k1, Object k2) {
	        return comparator==null ? ((Comparable<? super K>)k1).compareTo((K)k2)
	            : comparator.compare((K)k1, (K)k2);
	    }

	    /**
	     * Test two values for equality.  Differs from o1.equals(o2) only in
	     * that it copes with {@code null} o1 properly.
	     */
	    static final boolean valEquals(Object o1, Object o2) {
	        return (o1==null ? o2==null : o1.equals(o2));
	    }

	    /**
	     * Return SimpleImmutableEntry for entry, or null if null
	     */
	    static <K,V> Map.Entry<K,V> exportEntry(TreeMap.Entry<K,V> e) {
	        return (e == null) ? null :
	            new AbstractMap.SimpleImmutableEntry<>(e);
	    }

	    /**
	     * Return key for entry, or null if null
	     */
	    static <K,V> K keyOrNull(TreeMap.Entry<K,V> e) {
	        return (e == null) ? null : e.key;
	    }

	    /**
	     * Returns the key corresponding to the specified Entry.
	     * @throws NoSuchElementException if the Entry is null
	     */
	    static <K> K key(Entry<K,?> e) {
	        if (e==null)
	            throw new NoSuchElementException();
	        return e.key;
	    }


	    // SubMaps

	    /**
	     * Dummy value serving as unmatchable fence key for unbounded
	     * SubMapIterators
	     */
	    private static final Object UNBOUNDED = new Object();

	    /**
	     * @serial include
	     */
	    abstract static class NavigableSubMap<K,V> extends AbstractMap<K,V>
	        implements NavigableMap<K,V>, java.io.Serializable {
	        /**
	         * The backing map.
	         */
	        final TreeMap<K,V> m;

	        /**
	         * Endpoints are represented as triples (fromStart, lo,
	         * loInclusive) and (toEnd, hi, hiInclusive). If fromStart is
	         * true, then the low (absolute) bound is the start of the
	         * backing map, and the other values are ignored. Otherwise,
	         * if loInclusive is true, lo is the inclusive bound, else lo
	         * is the exclusive bound. Similarly for the upper bound.
	         */
	        final K lo, hi;
	        final boolean fromStart, toEnd;
	        final boolean loInclusive, hiInclusive;

	        NavigableSubMap(TreeMap<K,V> m,
	                        boolean fromStart, K lo, boolean loInclusive,
	                        boolean toEnd,     K hi, boolean hiInclusive) {
	            if (!fromStart && !toEnd) {
	                if (m.compare(lo, hi) > 0)
	                    throw new IllegalArgumentException("fromKey > toKey");
	            } else {
	                if (!fromStart) // type check
	                    m.compare(lo, lo);
	                if (!toEnd)
	                    m.compare(hi, hi);
	            }

	            this.m = m;
	            this.fromStart = fromStart;
	            this.lo = lo;
	            this.loInclusive = loInclusive;
	            this.toEnd = toEnd;
	            this.hi = hi;
	            this.hiInclusive = hiInclusive;
	        }

	        // internal utilities

	        final boolean tooLow(Object key) {
	            if (!fromStart) {
	                int c = m.compare(key, lo);
	                if (c < 0 || (c == 0 && !loInclusive))
	                    return true;
	            }
	            return false;
	        }

	        final boolean tooHigh(Object key) {
	            if (!toEnd) {
	                int c = m.compare(key, hi);
	                if (c > 0 || (c == 0 && !hiInclusive))
	                    return true;
	            }
	            return false;
	        }

	        final boolean inRange(Object key) {
	            return !tooLow(key) && !tooHigh(key);
	        }

	        final boolean inClosedRange(Object key) {
	            return (fromStart || m.compare(key, lo) >= 0)
	                && (toEnd || m.compare(hi, key) >= 0);
	        }

	        final boolean inRange(Object key, boolean inclusive) {
	            return inclusive ? inRange(key) : inClosedRange(key);
	        }

	        /*
	         * Absolute versions of relation operations.
	         * Subclasses map to these using like-named "sub"
	         * versions that invert senses for descending maps
	         */

	        final TreeMap.Entry<K,V> absLowest() {
	            TreeMap.Entry<K,V> e =
	                (fromStart ?  m.getFirstEntry() :
	                 (loInclusive ? m.getCeilingEntry(lo) :
	                                m.getHigherEntry(lo)));
	            return (e == null || tooHigh(e.key)) ? null : e;
	        }

	        final TreeMap.Entry<K,V> absHighest() {
	            TreeMap.Entry<K,V> e =
	                (toEnd ?  m.getLastEntry() :
	                 (hiInclusive ?  m.getFloorEntry(hi) :
	                                 m.getLowerEntry(hi)));
	            return (e == null || tooLow(e.key)) ? null : e;
	        }

	        final TreeMap.Entry<K,V> absCeiling(K key) {
	            if (tooLow(key))
	                return absLowest();
	            TreeMap.Entry<K,V> e = m.getCeilingEntry(key);
	            return (e == null || tooHigh(e.key)) ? null : e;
	        }

	        final TreeMap.Entry<K,V> absHigher(K key) {
	            if (tooLow(key))
	                return absLowest();
	            TreeMap.Entry<K,V> e = m.getHigherEntry(key);
	            return (e == null || tooHigh(e.key)) ? null : e;
	        }

	        final TreeMap.Entry<K,V> absFloor(K key) {
	            if (tooHigh(key))
	                return absHighest();
	            TreeMap.Entry<K,V> e = m.getFloorEntry(key);
	            return (e == null || tooLow(e.key)) ? null : e;
	        }

	        final TreeMap.Entry<K,V> absLower(K key) {
	            if (tooHigh(key))
	                return absHighest();
	            TreeMap.Entry<K,V> e = m.getLowerEntry(key);
	            return (e == null || tooLow(e.key)) ? null : e;
	        }

	        /** Returns the absolute high fence for ascending traversal */
	        final TreeMap.Entry<K,V> absHighFence() {
	            return (toEnd ? null : (hiInclusive ?
	                                    m.getHigherEntry(hi) :
	                                    m.getCeilingEntry(hi)));
	        }

	        /** Return the absolute low fence for descending traversal  */
	        final TreeMap.Entry<K,V> absLowFence() {
	            return (fromStart ? null : (loInclusive ?
	                                        m.getLowerEntry(lo) :
	                                        m.getFloorEntry(lo)));
	        }

	        // Abstract methods defined in ascending vs descending classes
	        // These relay to the appropriate absolute versions

	        abstract TreeMap.Entry<K,V> subLowest();
	        abstract TreeMap.Entry<K,V> subHighest();
	        abstract TreeMap.Entry<K,V> subCeiling(K key);
	        abstract TreeMap.Entry<K,V> subHigher(K key);
	        abstract TreeMap.Entry<K,V> subFloor(K key);
	        abstract TreeMap.Entry<K,V> subLower(K key);

	        /** Returns ascending iterator from the perspective of this submap */
	        abstract Iterator<K> keyIterator();

	        /** Returns descending iterator from the perspective of this submap */
	        abstract Iterator<K> descendingKeyIterator();

	        // public methods

	        public boolean isEmpty() {
	            return (fromStart && toEnd) ? m.isEmpty() : entrySet().isEmpty();
	        }

	        public int size() {
	            return (fromStart && toEnd) ? m.size() : entrySet().size();
	        }

	        public final boolean containsKey(Object key) {
	            return inRange(key) && m.containsKey(key);
	        }

	        public final V put(K key, V value) {
	            if (!inRange(key))
	                throw new IllegalArgumentException("key out of range");
	            return m.put(key, value);
	        }

	        public final V get(Object key) {
	            return !inRange(key) ? null :  m.get(key);
	        }

	        public final V remove(Object key) {
	            return !inRange(key) ? null : m.remove(key);
	        }

	        public final Map.Entry<K,V> ceilingEntry(K key) {
	            return exportEntry(subCeiling(key));
	        }

	        public final K ceilingKey(K key) {
	            return keyOrNull(subCeiling(key));
	        }

	        public final Map.Entry<K,V> higherEntry(K key) {
	            return exportEntry(subHigher(key));
	        }

	        public final K higherKey(K key) {
	            return keyOrNull(subHigher(key));
	        }

	        public final Map.Entry<K,V> floorEntry(K key) {
	            return exportEntry(subFloor(key));
	        }

	        public final K floorKey(K key) {
	            return keyOrNull(subFloor(key));
	        }

	        public final Map.Entry<K,V> lowerEntry(K key) {
	            return exportEntry(subLower(key));
	        }

	        public final K lowerKey(K key) {
	            return keyOrNull(subLower(key));
	        }

	        public final K firstKey() {
	            return key(subLowest());
	        }

	        public final K lastKey() {
	            return key(subHighest());
	        }

	        public final Map.Entry<K,V> firstEntry() {
	            return exportEntry(subLowest());
	        }

	        public final Map.Entry<K,V> lastEntry() {
	            return exportEntry(subHighest());
	        }

	        public final Map.Entry<K,V> pollFirstEntry() {
	            TreeMap.Entry<K,V> e = subLowest();
	            Map.Entry<K,V> result = exportEntry(e);
	            if (e != null)
	                m.deleteEntry(e);
	            return result;
	        }

	        public final Map.Entry<K,V> pollLastEntry() {
	            TreeMap.Entry<K,V> e = subHighest();
	            Map.Entry<K,V> result = exportEntry(e);
	            if (e != null)
	                m.deleteEntry(e);
	            return result;
	        }

	        // Views
	        transient NavigableMap<K,V> descendingMapView = null;
	        transient EntrySetView entrySetView = null;
	        transient KeySet<K> navigableKeySetView = null;

	        public final NavigableSet<K> navigableKeySet() {
	            KeySet<K> nksv = navigableKeySetView;
	            return (nksv != null) ? nksv :
	                (navigableKeySetView = new TreeMap.KeySet(this));
	        }

	        public final Set<K> keySet() {
	            return navigableKeySet();
	        }

	        public NavigableSet<K> descendingKeySet() {
	            return descendingMap().navigableKeySet();
	        }

	        public final SortedMap<K,V> subMap(K fromKey, K toKey) {
	            return subMap(fromKey, true, toKey, false);
	        }

	        public final SortedMap<K,V> headMap(K toKey) {
	            return headMap(toKey, false);
	        }

	        public final SortedMap<K,V> tailMap(K fromKey) {
	            return tailMap(fromKey, true);
	        }

	        // View classes

	        abstract class EntrySetView extends AbstractSet<Map.Entry<K,V>> {
	            private transient int size = -1, sizeModCount;

	            public int size() {
	                if (fromStart && toEnd)
	                    return m.size();
	                if (size == -1 || sizeModCount != m.modCount) {
	                    sizeModCount = m.modCount;
	                    size = 0;
	                    Iterator i = iterator();
	                    while (i.hasNext()) {
	                        size++;
	                        i.next();
	                    }
	                }
	                return size;
	            }

	            public boolean isEmpty() {
	                TreeMap.Entry<K,V> n = absLowest();
	                return n == null || tooHigh(n.key);
	            }

	            public boolean contains(Object o) {
	                if (!(o instanceof Map.Entry))
	                    return false;
	                Map.Entry<K,V> entry = (Map.Entry<K,V>) o;
	                K key = entry.getKey();
	                if (!inRange(key))
	                    return false;
	                TreeMap.Entry node = m.getEntry(key);
	                return node != null &&
	                    valEquals(node.getValue(), entry.getValue());
	            }

	            public boolean remove(Object o) {
	                if (!(o instanceof Map.Entry))
	                    return false;
	                Map.Entry<K,V> entry = (Map.Entry<K,V>) o;
	                K key = entry.getKey();
	                if (!inRange(key))
	                    return false;
	                TreeMap.Entry<K,V> node = m.getEntry(key);
	                if (node!=null && valEquals(node.getValue(),
	                                            entry.getValue())) {
	                    m.deleteEntry(node);
	                    return true;
	                }
	                return false;
	            }
	        }

	        /**
	         * Iterators for SubMaps
	         */
	        abstract class SubMapIterator<T> implements Iterator<T> {
	            TreeMap.Entry<K,V> lastReturned;
	            TreeMap.Entry<K,V> next;
	            final Object fenceKey;
	            int expectedModCount;

	            SubMapIterator(TreeMap.Entry<K,V> first,
	                           TreeMap.Entry<K,V> fence) {
	                expectedModCount = m.modCount;
	                lastReturned = null;
	                next = first;
	                fenceKey = fence == null ? UNBOUNDED : fence.key;
	            }

	            public final boolean hasNext() {
	                return next != null && next.key != fenceKey;
	            }

	            final TreeMap.Entry<K,V> nextEntry() {
	                TreeMap.Entry<K,V> e = next;
	                if (e == null || e.key == fenceKey)
	                    throw new NoSuchElementException();
	                if (m.modCount != expectedModCount)
	                    throw new ConcurrentModificationException();
	                next = successor(e);
	                lastReturned = e;
	                return e;
	            }

	            final TreeMap.Entry<K,V> prevEntry() {
	                TreeMap.Entry<K,V> e = next;
	                if (e == null || e.key == fenceKey)
	                    throw new NoSuchElementException();
	                if (m.modCount != expectedModCount)
	                    throw new ConcurrentModificationException();
	                next = predecessor(e);
	                lastReturned = e;
	                return e;
	            }

	            final void removeAscending() {
	                if (lastReturned == null)
	                    throw new IllegalStateException();
	                if (m.modCount != expectedModCount)
	                    throw new ConcurrentModificationException();
	                // deleted entries are replaced by their successors
	                if (lastReturned.left != null && lastReturned.right != null)
	                    next = lastReturned;
	                m.deleteEntry(lastReturned);
	                lastReturned = null;
	                expectedModCount = m.modCount;
	            }

	            final void removeDescending() {
	                if (lastReturned == null)
	                    throw new IllegalStateException();
	                if (m.modCount != expectedModCount)
	                    throw new ConcurrentModificationException();
	                m.deleteEntry(lastReturned);
	                lastReturned = null;
	                expectedModCount = m.modCount;
	            }

	        }

	        final class SubMapEntryIterator extends SubMapIterator<Map.Entry<K,V>> {
	            SubMapEntryIterator(TreeMap.Entry<K,V> first,
	                                TreeMap.Entry<K,V> fence) {
	                super(first, fence);
	            }
	            public Map.Entry<K,V> next() {
	                return nextEntry();
	            }
	            public void remove() {
	                removeAscending();
	            }
	        }

	        final class SubMapKeyIterator extends SubMapIterator<K> {
	            SubMapKeyIterator(TreeMap.Entry<K,V> first,
	                              TreeMap.Entry<K,V> fence) {
	                super(first, fence);
	            }
	            public K next() {
	                return nextEntry().key;
	            }
	            public void remove() {
	                removeAscending();
	            }
	        }

	        final class DescendingSubMapEntryIterator extends SubMapIterator<Map.Entry<K,V>> {
	            DescendingSubMapEntryIterator(TreeMap.Entry<K,V> last,
	                                          TreeMap.Entry<K,V> fence) {
	                super(last, fence);
	            }

	            public Map.Entry<K,V> next() {
	                return prevEntry();
	            }
	            public void remove() {
	                removeDescending();
	            }
	        }

	        final class DescendingSubMapKeyIterator extends SubMapIterator<K> {
	            DescendingSubMapKeyIterator(TreeMap.Entry<K,V> last,
	                                        TreeMap.Entry<K,V> fence) {
	                super(last, fence);
	            }
	            public K next() {
	                return prevEntry().key;
	            }
	            public void remove() {
	                removeDescending();
	            }
	        }
	    }

	    /**
	     * @serial include
	     */
	    static final class AscendingSubMap<K,V> extends NavigableSubMap<K,V> {
	        private static final long serialVersionUID = 912986545866124060L;

	        AscendingSubMap(TreeMap<K,V> m,
	                        boolean fromStart, K lo, boolean loInclusive,
	                        boolean toEnd,     K hi, boolean hiInclusive) {
	            super(m, fromStart, lo, loInclusive, toEnd, hi, hiInclusive);
	        }

	        public Comparator<? super K> comparator() {
	            return m.comparator();
	        }

	        public NavigableMap<K,V> subMap(K fromKey, boolean fromInclusive,
	                                        K toKey,   boolean toInclusive) {
	            if (!inRange(fromKey, fromInclusive))
	                throw new IllegalArgumentException("fromKey out of range");
	            if (!inRange(toKey, toInclusive))
	                throw new IllegalArgumentException("toKey out of range");
	            return new AscendingSubMap(m,
	                                       false, fromKey, fromInclusive,
	                                       false, toKey,   toInclusive);
	        }

	        public NavigableMap<K,V> headMap(K toKey, boolean inclusive) {
	            if (!inRange(toKey, inclusive))
	                throw new IllegalArgumentException("toKey out of range");
	            return new AscendingSubMap(m,
	                                       fromStart, lo,    loInclusive,
	                                       false,     toKey, inclusive);
	        }

	        public NavigableMap<K,V> tailMap(K fromKey, boolean inclusive) {
	            if (!inRange(fromKey, inclusive))
	                throw new IllegalArgumentException("fromKey out of range");
	            return new AscendingSubMap(m,
	                                       false, fromKey, inclusive,
	                                       toEnd, hi,      hiInclusive);
	        }

	        public NavigableMap<K,V> descendingMap() {
	            NavigableMap<K,V> mv = descendingMapView;
	            return (mv != null) ? mv :
	                (descendingMapView =
	                 new DescendingSubMap(m,
	                                      fromStart, lo, loInclusive,
	                                      toEnd,     hi, hiInclusive));
	        }

	        Iterator<K> keyIterator() {
	            return new SubMapKeyIterator(absLowest(), absHighFence());
	        }

	        Iterator<K> descendingKeyIterator() {
	            return new DescendingSubMapKeyIterator(absHighest(), absLowFence());
	        }

	        final class AscendingEntrySetView extends EntrySetView {
	            public Iterator<Map.Entry<K,V>> iterator() {
	                return new SubMapEntryIterator(absLowest(), absHighFence());
	            }
	        }

	        public Set<Map.Entry<K,V>> entrySet() {
	            EntrySetView es = entrySetView;
	            return (es != null) ? es : new AscendingEntrySetView();
	        }

	        TreeMap.Entry<K,V> subLowest()       { return absLowest(); }
	        TreeMap.Entry<K,V> subHighest()      { return absHighest(); }
	        TreeMap.Entry<K,V> subCeiling(K key) { return absCeiling(key); }
	        TreeMap.Entry<K,V> subHigher(K key)  { return absHigher(key); }
	        TreeMap.Entry<K,V> subFloor(K key)   { return absFloor(key); }
	        TreeMap.Entry<K,V> subLower(K key)   { return absLower(key); }
	    }

	    /**
	     * @serial include
	     */
	    static final class DescendingSubMap<K,V>  extends NavigableSubMap<K,V> {
	        private static final long serialVersionUID = 912986545866120460L;
	        DescendingSubMap(TreeMap<K,V> m,
	                        boolean fromStart, K lo, boolean loInclusive,
	                        boolean toEnd,     K hi, boolean hiInclusive) {
	            super(m, fromStart, lo, loInclusive, toEnd, hi, hiInclusive);
	        }

	        private final Comparator<? super K> reverseComparator =
	            Collections.reverseOrder(m.comparator);

	        public Comparator<? super K> comparator() {
	            return reverseComparator;
	        }

	        public NavigableMap<K,V> subMap(K fromKey, boolean fromInclusive,
	                                        K toKey,   boolean toInclusive) {
	            if (!inRange(fromKey, fromInclusive))
	                throw new IllegalArgumentException("fromKey out of range");
	            if (!inRange(toKey, toInclusive))
	                throw new IllegalArgumentException("toKey out of range");
	            return new DescendingSubMap(m,
	                                        false, toKey,   toInclusive,
	                                        false, fromKey, fromInclusive);
	        }

	        public NavigableMap<K,V> headMap(K toKey, boolean inclusive) {
	            if (!inRange(toKey, inclusive))
	                throw new IllegalArgumentException("toKey out of range");
	            return new DescendingSubMap(m,
	                                        false, toKey, inclusive,
	                                        toEnd, hi,    hiInclusive);
	        }

	        public NavigableMap<K,V> tailMap(K fromKey, boolean inclusive) {
	            if (!inRange(fromKey, inclusive))
	                throw new IllegalArgumentException("fromKey out of range");
	            return new DescendingSubMap(m,
	                                        fromStart, lo, loInclusive,
	                                        false, fromKey, inclusive);
	        }

	        public NavigableMap<K,V> descendingMap() {
	            NavigableMap<K,V> mv = descendingMapView;
	            return (mv != null) ? mv :
	                (descendingMapView =
	                 new AscendingSubMap(m,
	                                     fromStart, lo, loInclusive,
	                                     toEnd,     hi, hiInclusive));
	        }

	        Iterator<K> keyIterator() {
	            return new DescendingSubMapKeyIterator(absHighest(), absLowFence());
	        }

	        Iterator<K> descendingKeyIterator() {
	            return new SubMapKeyIterator(absLowest(), absHighFence());
	        }

	        final class DescendingEntrySetView extends EntrySetView {
	            public Iterator<Map.Entry<K,V>> iterator() {
	                return new DescendingSubMapEntryIterator(absHighest(), absLowFence());
	            }
	        }

	        public Set<Map.Entry<K,V>> entrySet() {
	            EntrySetView es = entrySetView;
	            return (es != null) ? es : new DescendingEntrySetView();
	        }

	        TreeMap.Entry<K,V> subLowest()       { return absHighest(); }
	        TreeMap.Entry<K,V> subHighest()      { return absLowest(); }
	        TreeMap.Entry<K,V> subCeiling(K key) { return absFloor(key); }
	        TreeMap.Entry<K,V> subHigher(K key)  { return absLower(key); }
	        TreeMap.Entry<K,V> subFloor(K key)   { return absCeiling(key); }
	        TreeMap.Entry<K,V> subLower(K key)   { return absHigher(key); }
	    }

	    /**
	     * This class exists solely for the sake of serialization
	     * compatibility with previous releases of TreeMap that did not
	     * support NavigableMap.  It translates an old-version SubMap into
	     * a new-version AscendingSubMap. This class is never otherwise
	     * used.
	     *
	     * @serial include
	     */
	    private class SubMap extends AbstractMap<K,V>
	        implements SortedMap<K,V>, java.io.Serializable {
	        private static final long serialVersionUID = -6520786458950516097L;
	        private boolean fromStart = false, toEnd = false;
	        private K fromKey, toKey;
	        private Object readResolve() {
	            return new AscendingSubMap(TreeMap.this,
	                                       fromStart, fromKey, true,
	                                       toEnd, toKey, false);
	        }
	        public Set<Map.Entry<K,V>> entrySet() { throw new InternalError(); }
	        public K lastKey() { throw new InternalError(); }
	        public K firstKey() { throw new InternalError(); }
	        public SortedMap<K,V> subMap(K fromKey, K toKey) { throw new InternalError(); }
	        public SortedMap<K,V> headMap(K toKey) { throw new InternalError(); }
	        public SortedMap<K,V> tailMap(K fromKey) { throw new InternalError(); }
	        public Comparator<? super K> comparator() { throw new InternalError(); }
	    }

	    /*********************************************重点***********************************************************************************/
	    /**
	     * 红黑树的操作在此 是重点
	     * 
	     */
	    private static final boolean RED   = false;
	    private static final boolean BLACK = true;

	    //树中结点的内部结构.Entry内部结构就是树
	    static final class Entry<K,V> implements Map.Entry<K,V> {
	        K key;
	        V value;
	        Entry<K,V> left = null;//左结点
	        Entry<K,V> right = null;//右结点
	        Entry<K,V> parent;//父节点
	        boolean color = BLACK;// 默认是黑色  BLACK = true 

	        //构造器
	        Entry(K key, V value, Entry<K,V> parent) {
	            this.key = key;
	            this.value = value;
	            this.parent = parent;
	        }
	        //获取键
	        public K getKey() {
	            return key;
	        }
	        //获取键对应的值
	        public V getValue() {
	            return value;
	        }
	        //设置值，有旧值就覆盖，返回旧值
	        public V setValue(V value) {
	            V oldValue = this.value;
	            this.value = value;
	            return oldValue;
	        }
	        public boolean equals(Object o) {
	            if (!(o instanceof Map.Entry))
	                return false;
	            Map.Entry<?,?> e = (Map.Entry<?,?>)o;

	            return valEquals(key,e.getKey()) && valEquals(value,e.getValue());
	        }

	        public int hashCode() {
	            int keyHash = (key==null ? 0 : key.hashCode());
	            int valueHash = (value==null ? 0 : value.hashCode());
	            return keyHash ^ valueHash;
	        }

	        public String toString() {
	            return key + "=" + value;
	        }
	    }

	    //排序的第一个结点(最左的那个结点)
	    final Entry<K,V> getFirstEntry() {
	        Entry<K,V> p = root;
	        if (p != null)
	            while (p.left != null)
	                p = p.left;
	        return p;
	    }

	    //排序的最后一个结点(最右的那个结点)
	    final Entry<K,V> getLastEntry() {
	        Entry<K,V> p = root;
	        if (p != null)
	            while (p.right != null)
	                p = p.right;
	        return p;
	    }

	    /**
	     * t 结点的继承者 
	     * ???
	     */
	    static <K,V> TreeMap.Entry<K,V> successor(Entry<K,V> t) {
	        if (t == null)
	            return null;
	        else if (t.right != null) {
	            Entry<K,V> p = t.right;
	            while (p.left != null)
	                p = p.left;
	            return p;
	        } else {
	            Entry<K,V> p = t.parent;
	            Entry<K,V> ch = t;
	            while (p != null && ch == p.right) {
	                ch = p;
	                p = p.parent;
	            }
	            return p;
	        }
	    }

	    /**
	     * t 结点的前驱
	     */
	    static <K,V> Entry<K,V> predecessor(Entry<K,V> t) {
	        if (t == null)
	            return null;
	        else if (t.left != null) {
	            Entry<K,V> p = t.left;
	            while (p.right != null)
	                p = p.right;
	            return p;
	        } else {
	            Entry<K,V> p = t.parent;
	            Entry<K,V> ch = t;
	            while (p != null && ch == p.left) {
	                ch = p;
	                p = p.parent;
	            }
	            return p;
	        }
	    }

	    //查看p结点的颜色，null 是BLACk
	    private static <K,V> boolean colorOf(Entry<K,V> p) {
	        return (p == null ? BLACK : p.color);
	    }
	    //查看p结点的父结点
	    private static <K,V> Entry<K,V> parentOf(Entry<K,V> p) {
	        return (p == null ? null: p.parent);
	    }
	    /**
	     * 设置结点的颜色，在红黑树中，它是依靠节点的颜色来维持平衡的。
	     */
	    private static <K,V> void setColor(Entry<K,V> p, boolean c) {
	        if (p != null)
	            p.color = c;
	    }
	    //查看p结点的left结点
	    private static <K,V> Entry<K,V> leftOf(Entry<K,V> p) {
	        return (p == null) ? null: p.left;
	    }
	    // 查看p结点的right结点
	    private static <K,V> Entry<K,V> rightOf(Entry<K,V> p) {
	        return (p == null) ? null: p.right;
	    }

	    /** From CLR */
	    /**
	     * 所谓左旋转，就是将新增节点（N）当做其父节点（P），
	     * 将其父节点P当做新增节点（N）的左子节点。即：G.left ---> N ,N.left ---> P。
	     * @param p
	     */
	    private void rotateLeft(Entry<K,V> p) {  
	        if (p != null) {  
	            //获取P的右子节点，其实这里就相当于新增节点N（情况四而言）  
	            Entry<K,V> r = p.right;  
	            //将R的左子树设置为P的右子树  
	            p.right = r.left;  
	            //若R的左子树不为空，则将P设置为R左子树的父亲  
	            if (r.left != null)  
	                r.left.parent = p;  
	            //将P的父亲设置R的父亲  
	            r.parent = p.parent;  
	            //如果P的父亲为空，则将R设置为跟节点  
	            if (p.parent == null)  
	                root = r;  
	            //如果P为其父节点（G）的左子树，则将R设置为P父节点(G)左子树  
	            else if (p.parent.left == p)  
	                p.parent.left = r;  
	            //否则R设置为P的父节点（G）的右子树  
	            else  
	                p.parent.right = r;  
	            //将P设置为R的左子树  
	            r.left = p;  
	            //将R设置为P的父节点  
	            p.parent = r;  
	        }  
	    } 

	    /** From CLR */
	    /**
	     * 所谓右旋转即，P.right ---> G、G.parent ---> P。
	     * @param p
	     */
	    private void rotateRight(Entry<K,V> p) {  
	        if (p != null) {  
	            //将L设置为P的左子树  
	            Entry<K,V> l = p.left;  
	            //将L的右子树设置为P的左子树  
	            p.left = l.right;  
	            //若L的右子树不为空，则将P设置L的右子树的父节点  
	            if (l.right != null)   
	                l.right.parent = p;  
	            //将P的父节点设置为L的父节点  
	            l.parent = p.parent;  
	            //如果P的父节点为空，则将L设置根节点  
	            if (p.parent == null)  
	                root = l;  
	            //若P为其父节点的右子树，则将L设置为P的父节点的右子树  
	            else if (p.parent.right == p)  
	                p.parent.right = l;  
	            //否则将L设置为P的父节点的左子树  
	            else   
	                p.parent.left = l;  
	            //将P设置为L的右子树  
	            l.right = p;  
	            //将L设置为P的父节点  
	            p.parent = l;  
	        }  
	    }  

	    /** From CLR */
	    /**
	     * public V put(K key, V value) {...}  345行
	     * 				代码中do{}代码块是实现排序二叉树的核心算法，通过该算法我们可以确认新增节点在该树的正确位置。
	     * 找到正确位置后将插入即可，这样做了其实还没有完成，
	     * 因为TreeMap的底层实现是红黑树，红黑树是一棵平衡排序二叉树，普通的排序二叉树可能会出现失衡的情况，
	     * 所以下一步就是要进行调整。
	     * fixAfterInsertion(e); 调整的过程务必会涉及到红黑树的左旋、右旋、着色三个基本操作
	     * @param x
	     */
	    private void fixAfterInsertion(Entry<K,V> x) {
	        x.color = RED;//新增节点的颜色为红色  
	        //循环 直到 x不是根节点，且x的父节点不为红色  
	        while (x != null && x != root && x.parent.color == RED) {
	        	 //如果X的父节点（P）是其父节点的父节点（G）的左节点  
	        	if (parentOf(x) == leftOf(parentOf(parentOf(x)))) {
	        		 //获取X的叔节点(U)  
	        		Entry<K,V> y = rightOf(parentOf(parentOf(x)));
	        		 //如果X的叔节点（U） 为红色（情况三）  
	        		if (colorOf(y) == RED) {
	        			//将X的父节点（P）设置为黑色  
	        			setColor(parentOf(x), BLACK);
	        			//将X的叔节点（U）设置为黑色  
	                    setColor(y, BLACK);
	                  //将X的父节点的父节点（G）设置红色  
	                    setColor(parentOf(parentOf(x)), RED);
	                    x = parentOf(parentOf(x));
	                } else {
	                	 //如果X的叔节点（U为黑色）；这里会存在两种情况（情况四、情况五）  
	                    if (x == rightOf(parentOf(x))) {
	                    	//将X的父节点作为X  
	                    	x = parentOf(x);
	                    	//右旋转  
	                        rotateLeft(x);
	                    }
	                    //（情况五）  
                        //将X的父节点（P）设置为黑色  
	                    setColor(parentOf(x), BLACK);
	                  //将X的父节点的父节点（G）设置红色  
	                    setColor(parentOf(parentOf(x)), RED);
	                    //以X的父节点的父节点（G）为中心右旋转  
	                    rotateRight(parentOf(parentOf(x)));
	                }
	            } 
	        	//如果X的父节点（P）是其父节点的父节点（G）的右节点  
	        	else {
	        		 //获取X的叔节点（U）  
	                Entry<K,V> y = leftOf(parentOf(parentOf(x)));
	                //如果X的叔节点（U） 为红色（情况三）  
	                if (colorOf(y) == RED) {  
                        //将X的父节点（P）设置为黑色  
                        setColor(parentOf(x), BLACK);  
                        //将X的叔节点（U）设置为黑色  
                        setColor(y, BLACK);  
                        //将X的父节点的父节点（G）设置红色  
                        setColor(parentOf(parentOf(x)), RED);  
                        x = parentOf(parentOf(x));  
                    }    
	                //如果X的叔节点（U为黑色）；这里会存在两种情况（情况四、情况五）  
                    else {  
                        //如果X节点为其父节点（P）的右子树，则进行左旋转（情况四）  
                        if (x == leftOf(parentOf(x))) {  
                            //将X的父节点作为X  
                            x = parentOf(x);  
                           //右旋转  
                            rotateRight(x);  
                        }  
                        //（情况五）  
                        //将X的父节点（P）设置为黑色  
                        setColor(parentOf(x), BLACK);  
                        //将X的父节点的父节点（G）设置红色  
                        setColor(parentOf(parentOf(x)), RED);  
                        //以X的父节点的父节点（G）为中心右旋转  
                        rotateLeft(parentOf(parentOf(x)));  
	                 }
	              }
	        }
	        //将根节点G强制设置为黑色  
	        root.color = BLACK;
	    }

	    /**
	     * 删除结点 p ，删除结点p的原理：将p所在子树的叶子结点替代该结点值，删除 该叶子结点，
	     */
	    rivate void deleteEntry(Entry<K,V> p) {  
	        modCount++;      //修改次数 +1  
	        size--;          //元素个数 -1  
	  
	        /* 
	         * 被删除节点的左子树和右子树都不为空，那么就用 p节点的中序后继节点代替 p 节点 
	         * successor(P)方法为寻找P的替代节点。规则是右分支最左边，或者 左分支最右边的节点 
	         * ---------------------（1） 
	         */  
	        if (p.left != null && p.right != null) {    
	            Entry<K,V> s = successor(p);  
	            p.key = s.key;  
	            p.value = s.value;  
	            p = s;  
	        }  
	  
	        //replacement为替代节点，如果P的左子树存在那么就用左子树替代，否则用右子树替代  
	        Entry<K,V> replacement = (p.left != null ? p.left : p.right);  
	  
	        /* 
	         * 删除节点，分为上面提到的三种情况 
	         * -----------------------（2） 
	         */  
	        //如果替代节点不为空  
	        if (replacement != null) {  
	            replacement.parent = p.parent;  
	            /* 
	             *replacement来替代P节点 
	             */  
	            //若P没有父节点，则跟节点直接变成replacement  
	            if (p.parent == null)  
	                root = replacement;  
	            //如果P为左节点，则用replacement来替代为左节点  
	            else if (p == p.parent.left)  
	                p.parent.left  = replacement;  
	          //如果P为右节点，则用replacement来替代为右节点  
	            else  
	                p.parent.right = replacement;  
	  
	            //同时将P节点从这棵树中剔除掉  
	            p.left = p.right = p.parent = null;  
	  
	            /* 
	             * 若P为红色直接删除，红黑树保持平衡 
	             * 但是若P为黑色，则需要调整红黑树使其保持平衡 
	             */  
	            if (p.color == BLACK)  
	                fixAfterDeletion(replacement);  
	        } else if (p.parent == null) {     //p没有父节点，表示为P根节点，直接删除即可  
	            root = null;  
	        } else {      //P节点不存在子节点，直接删除即可  
	            if (p.color == BLACK)         //如果P节点的颜色为黑色，对红黑树进行调整  
	                fixAfterDeletion(p);  
	  
	            //删除P节点  
	            if (p.parent != null) {  
	                if (p == p.parent.left)  
	                    p.parent.left = null;  
	                else if (p == p.parent.right)  
	                    p.parent.right = null;  
	                p.parent = null;  
	            }  
	        }  
	    } 

	    /** From CLR */
	    /**  
	     * 删除结点后，调整为红黑树
	     * */
	    private void fixAfterDeletion(Entry<K,V> x) {  
	        // 删除节点需要一直迭代，知道 直到 x 不是根节点，且 x 的颜色是黑色  
	        while (x != root && colorOf(x) == BLACK) {  
	            if (x == leftOf(parentOf(x))) {      //若X节点为左节点  
	                //获取其兄弟节点  
	                Entry<K,V> sib = rightOf(parentOf(x));  
	  
	                /* 
	                 * 如果兄弟节点为红色----（情况3.1） 
	                 * 策略：改变W、P的颜色，然后进行一次左旋转 
	                 */  
	                if (colorOf(sib) == RED) {       
	                    setColor(sib, BLACK);       
	                    setColor(parentOf(x), RED);    
	                    rotateLeft(parentOf(x));  
	                    sib = rightOf(parentOf(x));  
	                }  
	  
	                /* 
	                 * 若兄弟节点的两个子节点都为黑色----（情况3.2） 
	                 * 策略：将兄弟节点编程红色 
	                 */  
	                if (colorOf(leftOf(sib))  == BLACK &&  
	                    colorOf(rightOf(sib)) == BLACK) {  
	                    setColor(sib, RED);  
	                    x = parentOf(x);  
	                }   
	                else {  
	                    /* 
	                     * 如果兄弟节点只有右子树为黑色----（情况3.3） 
	                     * 策略：将兄弟节点与其左子树进行颜色互换然后进行右转 
	                     * 这时情况会转变为3.4 
	                     */  
	                    if (colorOf(rightOf(sib)) == BLACK) {  
	                        setColor(leftOf(sib), BLACK);  
	                        setColor(sib, RED);  
	                        rotateRight(sib);  
	                        sib = rightOf(parentOf(x));  
	                    }  
	                    /* 
	                     *----情况3.4 
	                     *策略：交换兄弟节点和父节点的颜色， 
	                     *同时将兄弟节点右子树设置为黑色，最后左旋转 
	                     */  
	                    setColor(sib, colorOf(parentOf(x)));  
	                    setColor(parentOf(x), BLACK);  
	                    setColor(rightOf(sib), BLACK);  
	                    rotateLeft(parentOf(x));  
	                    x = root;  
	                }  
	            }   
	              
	            /** 
	             * X节点为右节点与其为做节点处理过程差不多，这里就不在累述了 
	             */  
	            else {  
	                Entry<K,V> sib = leftOf(parentOf(x));  
	  
	                if (colorOf(sib) == RED) {  
	                    setColor(sib, BLACK);  
	                    setColor(parentOf(x), RED);  
	                    rotateRight(parentOf(x));  
	                    sib = leftOf(parentOf(x));  
	                }  
	  
	                if (colorOf(rightOf(sib)) == BLACK &&  
	                    colorOf(leftOf(sib)) == BLACK) {  
	                    setColor(sib, RED);  
	                    x = parentOf(x);  
	                } else {  
	                    if (colorOf(leftOf(sib)) == BLACK) {  
	                        setColor(rightOf(sib), BLACK);  
	                        setColor(sib, RED);  
	                        rotateLeft(sib);  
	                        sib = leftOf(parentOf(x));  
	                    }  
	                    setColor(sib, colorOf(parentOf(x)));  
	                    setColor(parentOf(x), BLACK);  
	                    setColor(leftOf(sib), BLACK);  
	                    rotateRight(parentOf(x));  
	                    x = root;  
	                }  
	            }  
	        }  
	  
	        setColor(x, BLACK);  
	    }  
	    private static final long serialVersionUID = 919286545866124006L;

	    /**
	     * Save the state of the {@code TreeMap} instance to a stream (i.e.,
	     * serialize it).
	     *
	     * @serialData The <em>size</em> of the TreeMap (the number of key-value
	     *             mappings) is emitted (int), followed by the key (Object)
	     *             and value (Object) for each key-value mapping represented
	     *             by the TreeMap. The key-value mappings are emitted in
	     *             key-order (as determined by the TreeMap's Comparator,
	     *             or by the keys' natural ordering if the TreeMap has no
	     *             Comparator).
	     */
	    private void writeObject(java.io.ObjectOutputStream s)
	        throws java.io.IOException {
	        // Write out the Comparator and any hidden stuff
	        s.defaultWriteObject();

	        // Write out size (number of Mappings)
	        s.writeInt(size);

	        // Write out keys and values (alternating)
	        for (Iterator<Map.Entry<K,V>> i = entrySet().iterator(); i.hasNext(); ) {
	            Map.Entry<K,V> e = i.next();
	            s.writeObject(e.getKey());
	            s.writeObject(e.getValue());
	        }
	    }

	    /**
	     * Reconstitute the {@code TreeMap} instance from a stream (i.e.,
	     * deserialize it).
	     */
	    private void readObject(final java.io.ObjectInputStream s)
	        throws java.io.IOException, ClassNotFoundException {
	        // Read in the Comparator and any hidden stuff
	        s.defaultReadObject();

	        // Read in size
	        int size = s.readInt();

	        buildFromSorted(size, null, s, null);
	    }

	    /** Intended to be called only from TreeSet.readObject */
	    void readTreeSet(int size, java.io.ObjectInputStream s, V defaultVal)
	        throws java.io.IOException, ClassNotFoundException {
	        buildFromSorted(size, null, s, defaultVal);
	    }

	    /** Intended to be called only from TreeSet.addAll */
	    void addAllForTreeSet(SortedSet<? extends K> set, V defaultVal) {
	        try {
	            buildFromSorted(set.size(), set.iterator(), null, defaultVal);
	        } catch (java.io.IOException cannotHappen) {
	        } catch (ClassNotFoundException cannotHappen) {
	        }
	    }


	    /**
	     * Linear time tree building algorithm from sorted data.  Can accept keys
	     * and/or values from iterator or stream. This leads to too many
	     * parameters, but seems better than alternatives.  The four formats
	     * that this method accepts are:
	     *
	     *    1) An iterator of Map.Entries.  (it != null, defaultVal == null).
	     *    2) An iterator of keys.         (it != null, defaultVal != null).
	     *    3) A stream of alternating serialized keys and values.
	     *                                   (it == null, defaultVal == null).
	     *    4) A stream of serialized keys. (it == null, defaultVal != null).
	     *
	     * It is assumed that the comparator of the TreeMap is already set prior
	     * to calling this method.
	     *
	     * @param size the number of keys (or key-value pairs) to be read from
	     *        the iterator or stream
	     * @param it If non-null, new entries are created from entries
	     *        or keys read from this iterator.
	     * @param str If non-null, new entries are created from keys and
	     *        possibly values read from this stream in serialized form.
	     *        Exactly one of it and str should be non-null.
	     * @param defaultVal if non-null, this default value is used for
	     *        each value in the map.  If null, each value is read from
	     *        iterator or stream, as described above.
	     * @throws IOException propagated from stream reads. This cannot
	     *         occur if str is null.
	     * @throws ClassNotFoundException propagated from readObject.
	     *         This cannot occur if str is null.
	     */
	    private void buildFromSorted(int size, Iterator it,
	                                 java.io.ObjectInputStream str,
	                                 V defaultVal)
	        throws  java.io.IOException, ClassNotFoundException {
	        this.size = size;
	        root = buildFromSorted(0, 0, size-1, computeRedLevel(size),
	                               it, str, defaultVal);
	    }

	    /**
	     * Recursive "helper method" that does the real work of the
	     * previous method.  Identically named parameters have
	     * identical definitions.  Additional parameters are documented below.
	     * It is assumed that the comparator and size fields of the TreeMap are
	     * already set prior to calling this method.  (It ignores both fields.)
	     *
	     * @param level the current level of tree. Initial call should be 0.
	     * @param lo the first element index of this subtree. Initial should be 0.
	     * @param hi the last element index of this subtree.  Initial should be
	     *        size-1.
	     * @param redLevel the level at which nodes should be red.
	     *        Must be equal to computeRedLevel for tree of this size.
	     */
	    private final Entry<K,V> buildFromSorted(int level, int lo, int hi,
	                                             int redLevel,
	                                             Iterator it,
	                                             java.io.ObjectInputStream str,
	                                             V defaultVal)
	        throws  java.io.IOException, ClassNotFoundException {
	        /*
	         * Strategy: The root is the middlemost element. To get to it, we
	         * have to first recursively construct the entire left subtree,
	         * so as to grab all of its elements. We can then proceed with right
	         * subtree.
	         *
	         * The lo and hi arguments are the minimum and maximum
	         * indices to pull out of the iterator or stream for current subtree.
	         * They are not actually indexed, we just proceed sequentially,
	         * ensuring that items are extracted in corresponding order.
	         */

	        if (hi < lo) return null;

	        int mid = (lo + hi) >>> 1;

	        Entry<K,V> left  = null;
	        if (lo < mid)
	            left = buildFromSorted(level+1, lo, mid - 1, redLevel,
	                                   it, str, defaultVal);

	        // extract key and/or value from iterator or stream
	        K key;
	        V value;
	        if (it != null) {
	            if (defaultVal==null) {
	                Map.Entry<K,V> entry = (Map.Entry<K,V>)it.next();
	                key = entry.getKey();
	                value = entry.getValue();
	            } else {
	                key = (K)it.next();
	                value = defaultVal;
	            }
	        } else { // use stream
	            key = (K) str.readObject();
	            value = (defaultVal != null ? defaultVal : (V) str.readObject());
	        }

	        Entry<K,V> middle =  new Entry<>(key, value, null);

	        // color nodes in non-full bottommost level red
	        if (level == redLevel)
	            middle.color = RED;

	        if (left != null) {
	            middle.left = left;
	            left.parent = middle;
	        }

	        if (mid < hi) {
	            Entry<K,V> right = buildFromSorted(level+1, mid+1, hi, redLevel,
	                                               it, str, defaultVal);
	            middle.right = right;
	            right.parent = middle;
	        }

	        return middle;
	    }

	    /**
	     * Find the level down to which to assign all nodes BLACK.  This is the
	     * last `full' level of the complete binary tree produced by
	     * buildTree. The remaining nodes are colored RED. (This makes a `nice'
	     * set of color assignments wrt future insertions.) This level number is
	     * computed by finding the number of splits needed to reach the zeroeth
	     * node.  (The answer is ~lg(N), but in any case must be computed by same
	     * quick O(lg(N)) loop.)
	     */
	    private static int computeRedLevel(int sz) {
	        int level = 0;
	        for (int m = sz - 1; m >= 0; m = m / 2 - 1)
	            level++;
	        return level;
	    }
	}
```