---
title: "Hibernate中在数据库中不能自动建表的原因"
date: 2016-08-15
category: 后端开发
tags: []
---

       在学习Hibernate的时候，按照书上的程序写好配置文件，创建了持久化类后并创建了对象-关系的映射文件。目的是运行程序的时候能够在数据库中自动创建一张表，同时对数据库进行操作。结果程序运行正常却无法自动创建表NEWS3。<class name="com.hibernate.entities.News3"
table="NEWS3">

下面是我的配置文件hibernate.cfg.xml:

```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-configuration PUBLIC
		"-//Hibernate/Hibernate Configuration DTD 3.0//EN"
		"http://hibernate.sourceforge.net/hibernate-configuration-3.0.dtd">
<hibernate-configuration>
	<session-factory>
    
		<!-- 配置连接数据库的基本信息 -->
		<property name="connection.username">root</property>
		<property name="connection.password">920614</property>
		<property name="connection.driver_class">com.mysql.jdbc.Driver</property>
		<property name="connection.url">jdbc:mysql:///hibernate3</property>
		
		<!-- 配置 hibernate 的基本信息 -->
		<!-- hibernate 所使用的数据库方言 -->
		<property name="dialect">org.hibernate.dialect.MySQLInnoDBDialect</span></property>		
		
		<!-- 执行操作时是否在控制台打印 SQL -->
		<property name="show_sql">true</property>
	
		<!-- 是否对 SQL 进行格式化 -->
		<property name="format_sql">true</property>
	
		<!-- 指定自动生成数据表的策略 -->
		<property name="hbm2ddl.auto">update</property>
		
		<!-- 指定关联的 .hbm.xml 文件 -->
		<mapping resource="com/hibernate/entities/News3.hbm.xml"/>
	
	</session-factory>

</hibernate-configuration>
```

      苦苦冥思2000000....个小时后未果（浪费时间在检查代码上了，貌似每次学习新知识的时候总会有一堆配置上的问题，恼人），网上查找资料后终于知道结果。

      我的数据库默认引擎是InnoDB(自己修改的默认引擎，在前面的日志中已经有记录)，需要在数据库中创建一张新表。而我的配置文件中指定数据库方言是MySQLInnoDBDialect 。

当MySql默认存储引擎为InnoDB，并且在数据库中要创建一张新表的时候（即表名不存在），此时数据库方言只能选择MySQLDialect；  
当MySql默认存储引擎为InnoDB，并且需更改表结构（表名存在），数据库方言三者皆可选（建议选择MySQLInnoDBDialect）。

      虽然这个小问题耽误不少时间，但是在出现问题顺利 解决问题后很有成就感！关于数据库的事务操作需要多了解。