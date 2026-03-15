---
title: "MySql中出现 Illegal mix of collations (latin1_swedish_ci,COERCIBLE) and (gbk_chinese_ci,COERCIBLE) for"
date: 2016-07-30
category: 后端开发
tags: []
---

今天在MySql中插入数据的时候，出现了 

## [Illegal mix of collations (latin1\_swedish\_ci,COERCIBLE) and (gbk\_chinese\_ci,COERCIBLE) for operation '='](http://blog.csdn.net/elifefly/article/details/3112904) 的错误，异常的意思是：字段字符集编码不同，不合法的连接。百度以后找到原因，这里有详细说明：【http://blog.csdn.net/elifefly/article/details/3112904】

SHOW VARIABLES LIKE 'character\_set\_%'; 查看一下 显示：

![](https://img-blog.csdn.net/20160730104027499?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

## SHOW VARIABLES LIKE 'collation\_%'; 查看一下：

##

## 我直接采用修改MySql安装目录下的配置文件my.ini，找到default-character-set行，将其编码方式改为default-character-set=utf8，重启MySql后即可。

也可使用以下操作:

```
set character_set_database =utf8;
set character_set_results =utf8;
set character_set_server =utf8;
set character_set_system =utf8;
```

   然后：

```
SET collation_server = utf8_general_ci
SET collation_database = utf8_general_ci
```