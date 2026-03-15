---
title: "Mybatis学习中遇到的错误java.sql.SQLException: Illegal mix of collations (latin1_swedish_ci,IMPLICIT) and (ut"
date: 2016-09-27
category: 后端开发
tags: []
---

在Mybatis学习存储过程调用的时候，老是出现【java.sql.SQLException: Illegal mix of collations (latin1\_swedish\_ci,IMPLICIT) and (utf8\_general\_ci,COERCIBLE) for operation '='】这个错，百度了下意思是返回的结果有两种字符集。一般这种情况在排除编程语言中单独设置的字符集错误后，首先想到的就是数据库中的数据表设置的字符集类型和编程语言中所要得到的结果类型不一致导致的。下面介绍具体的解决办法：

1   输入sql语句：首先看看表结构的类型(一般设置为UTF-8)，支持中文类型的：

```
<span style="font-size:18px;">SHOW VARIABLES LIKE 'character_set_%';</span>
```

![](https://img-blog.csdn.net/20160927213555952?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)  

再查看下字段类型：

```
<span style="font-size:18px;">SHOW VARIABLES LIKE 'collation_%';</span>
```

![](https://img-blog.csdn.net/20160927213839062?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)  

看到这两处的类型有不是UTF-8的地方了吗？全部都要改成UTF-8类型的：

```
set character_set_database =utf8;
set character_set_results =utf8;
set character_set_server =utf8;
set character_set_system =utf8;
```

  

```
SET collation_server = utf8_general_ci
SET collation_database = utf8_general_ci
```

  
按道理这样就能成功了，但是有几个地方也要注意一下：

 2  数据库中数据表：

![](https://img-blog.csdn.net/20160927220336932?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

3 数据库：

![](https://img-blog.csdn.net/20160927220756762?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

4 这些设置就应该差不多了，而我在设置这些的时候还是报错，原因就是在创建存储过程的时候加入中文字符了。

参考博客：【http://blog.csdn.net/wujingwen1111/article/details/12652819】