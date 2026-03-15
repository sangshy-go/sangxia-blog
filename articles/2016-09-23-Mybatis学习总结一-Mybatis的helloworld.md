---
title: "【Mybatis学习总结一】Mybatis的helloworld"
date: 2016-09-23
category: 后端开发
tags: []
---

近日跟随某网站某PDF开始学习MyBatis框架。

### 一 MyBatis介绍

MyBatis 是支持 普通 SQL 查询 ， 存储过程 和 高级映射 的优秀持久层框架。MyBatis 消除了几乎所有的 JDBC 代码和参数的手工设置以及对结果集的检索封装。

MyBatis 可以使用简单的 XML 或注解用于配置和原始映射，将接口和 Java 的 POJO（Plain Old Java Objects，普通的 Java 对象）映射成数据库中的记录.

JDBC- dbutils- MyBatis- Hibernate

### 二  第一个小例子

1 添加mybatis的jar包 和 mysql 驱动包：

![](https://img-blog.csdn.net/20160923214641604?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

2 在SQLyog中建立数据库和表：

![](https://img-blog.csdn.net/20160923214839038?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

3    src下建立包com.mybatis.test1，在建立一个表所对应的实体类：User.java；

```
package com.mybatis.test1;

public class User {

	private int id;
	private String name;
	private int age;
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public int getAge() {
		return age;
	}
	public void setAge(int age) {
		this.age = age;
	}
	public User(int id, String name, int age) {
		super();
		this.id = id;
		this.name = name;
		this.age = age;
	}
	public User() {
		super();
	}
	@Override
	public String toString() {
		return "User [id=" + id + ", name=" + name + ", age=" + age + "]";
	}
	
}
```

  

4  src下：添加mbatis的配置文件：conf.xml，此处文件内<mappers>的内容此步骤不许添加；

【注】此处刚开始输入<mappers>时eclipse可能不能自动弹出，需要关联dtd文件：prefrence-XMLCatalog-Add-

FileSystem-...见图

![](https://img-blog.csdn.net/20160923220553756?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

-//mybatis.org//DTD Config 3.0//EN   对应的public ID

或http://mybatis.org/dtd/mybatis-3-config.dtd  对应的URI

```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
	<environments default="development">
		<environment id="development">
			<transactionManager type="JDBC" />
			<dataSource type="POOLED">
				<property name="driver" value="com.mysql.jdbc.Driver" />
				<property name="url" value="jdbc:mysql://localhost:3306/mybatis" />
				<property name="username" value="root" />
				<property name="password" value="920614" />
			</dataSource>
		</environment>
	</environments>
	
	<!-- 注册userMapper.xml文件 -->
	<mappers>
		<mapper resource="com/mybatis/test1/userMapper.xml"/>
	</mappers>
	
	
</configuration>
```

  

5 在包com.mybatis.test1  下新建一个操作user表的sql映射文件：userMapper.xml；

```
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE  mapper  PUBLIC  "-//mybatis.org//DTD  Mapper  3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<!--定义操作 users 表的sql 映射文件：userMapper.xml   -->
<mapper namespace="com.mybatis.test1.userMapper">
	<select id="getUser" parameterType="int"
			resultType="com.mybatis.test1.User">
		select * from users where id=#{id}
	</select>
</mapper>
```

  

6 在conf.xml 文件中注册 userMapper.xml 文件，见步骤4中<mappers>内容；

7 编写测试代码：执行定义的select语句：

```
package com.mybatis.test1;

import java.io.InputStream;

import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;

public class Test1 {

	public static void main(String[] args) {
		String resource = "conf.xml";
		//1 加载mybatis的配置文件，也加载关联的映射文件
		InputStream is=Test1.class.getClassLoader().getResourceAsStream(resource);
		
		//2 构建SqlSession工厂
		SqlSessionFactory  sessionFactory = new SqlSessionFactoryBuilder().build(is);
		//3 创建能执行映射文件中的sql 的sqlSession
		SqlSession session = sessionFactory.openSession();
		
		//4 映射sql 的标识字符串
		String statement = "com.mybatis.test1.userMapper.getUser";
		//5 执行查询返回一个唯一的user对象的
		User user = session.selectOne(statement , 2);
		System.out.println(user);
		
	}

}
```

执行结果：User [id=2, name=Jack, age=11]

整体结构：

![](https://img-blog.csdn.net/20160923215727181?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)