---
title: "Map与Set的使用little tips"
date: 2016-09-22
category: 随笔杂谈
tags: []
---

1 当需要排序，或者判断是否含有这个数的时候，可以考虑到Map;

还有有键，值对的时候首先可以考虑到使用Map:

如下例子：map可以判断是否含有键key:map.containsKey(key);

添加使用map.put(key,value);
  

```
<span style="white-space:pre">	</span>public static void addMap(Map<Integer, Integer> map,String[] nums){ 
        <span style="white-space:pre">	</span>int key=Integer.parseInt(nums[0]);  
<span style="white-space:pre">	</span>        int value=Integer.parseInt(nums[1]);       
       <span style="white-space:pre">	</span>      //如果将要添加的值已经存在，就添加其value值  
        <span style="white-space:pre">	</span>if(map.containsKey(key)){  
            <span style="white-space:pre">	</span>    map.put(key, map.get(key)+value);  
<span style="white-space:pre">	</span>        }else{  
        <span style="white-space:pre">	</span>    //没有就直接加入  
<span style="white-space:pre">	</span>            map.put(key, value);  
        <span style="white-space:pre">	</span>}  
<span style="white-space:pre">	</span>    }  <span style="font-family: Arial, Helvetica, sans-serif; background-color: rgb(255, 255, 255);">	</span>
```

2 Set有两个特性，第一个是TreeSet可以进行定制排序；

第二个是Set集合添加某个Object时，可以用来判断集合中是否含有此Object;

 含有的话返回false;否则为true