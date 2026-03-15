---
title: "java 集合框架的接口之一：RandomAccess"
date: 2016-12-13
category: 后端开发
tags: []
---

## RandomAccess

今天面试的时候，面试官问到ArrayList实现了哪个接口，这个接口中没有定义任何方法？

--RandomAccess。(类似的诸如Serializable)

### RandomAccess作用：

RaomdomAccess接口里面的文档说明大致意思：给可以提供随机访问的List实现去标识一下，这样使用这个List的程序在遍历这种类型的List的时候可以有更高效率。仅此而已。

java.util.Collections这个工具类中的fill方法：

```
  public static <T> void fill(List<? super T> list, T obj) {
        int size = list.size();

        if (size < FILL_THRESHOLD || list instanceof RandomAccess) { // 这一行
            for (int i=0; i<size; i++)
                list.set(i, obj);
        } else {
            ListIterator<? super T> itr = list.listIterator();
            for (int i=0; i<size; i++) {
                itr.next();
                itr.set(obj);
            }
        }
    }
```

上面代码中标识的一行， FILL\_THRESHOLD 是25，就是说，如果要填充的目标List范围不是很大，那么就直接用上面的方式效率比较高，所以，我们在遍历List之前，可以用
 if( list instanceof RamdomAccess ) 来标识一下，选择用哪种遍历方式。就这点小技巧。

同时注意到   list instanceof RamdomAccess 这个代码，顺便翻到里面去瞅了一眼，RamdomAccess 接口是一个空接口，空接口的作用一般起到一个标识作用，比如：Serializable 接口。

参考：【https://my.oschina.net/u/1466553/blog/496024】