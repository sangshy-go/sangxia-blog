---
title: "【Mybatis学习总结二】Mybatis操作数据表的CRUD实现"
date: 2016-09-24
category: 后端开发
tags: []
---

本节内容学习了如何通过Mybatis实现对数据库的增删改查操作。一共有两种实现方式，一是基于XML的实现；第二种是基于注解的实现。

下面来具体介绍两种方法的具体实现：

### 一、基于XML的实现

 1    还是基于第一节中建立的User.java实体类；

 2    新建一个工具类MybatisUtils.java(因为在后面的测试类中要得到sqlsessionFactory,代码都是一样的，所以给提取出来放在同一个类中当做工具类)；

```
package com.mybatis.test2;

import java.io.InputStream;

import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;

import com.mybatis.test1.Test1;

/**
 * 获得SqlSessionFactory的工具类
 * @author WGS
 *
 */
public class MybatisUtils {

	public static SqlSessionFactory getSqlSessionFactory(){
		String resource = "conf.xml";
		//1 加载mybatis的配置文件，也加载关联的映射文件
		InputStream is=Test1.class.getClassLoader().getResourceAsStream(resource);
		
		//2 构建SqlSession工厂
		SqlSessionFactory  sessionFactory = new SqlSessionFactoryBuilder().build(is);
		
		return sessionFactory;
	}
}
```

 3   建立sql的映射XML文件：userMapper.xml

【注】此处的\_User见下面的三.优化2

```
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE  mapper  PUBLIC  "-//mybatis.org//DTD  Mapper  3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<!-- 
	通过XML文件的方式实现对数据库数据表的CRUD操作
 -->

<!--定义操作 users 表的sql 映射文件：userMapper.xml   -->
<mapper namespace="com.mybatis.test2.userMapper">

	<select id="insertUser" parameterType="_User">
		INSERT INTO users(name,age) values(#{name},#{age})
	</select>
	
	<select id="deleteUser" parameterType="int">
		DELETE FROM users WHERE id=#{id}
	</select>
	
	<select id="updateUser" parameterType="_User">
		UPDATE users SET name=#{name},age=#{age} WHERE id=#{id}
	</select>
	
	<select id="selectUser" parameterType="int" resultType="_User">
		SELECT * FROM users WHERE id=#{id}
	</select>
	
	<select id="selectAllUser" resultType="_User">
		SELECT * FROM users
	</select>
	
</mapper>
```

4  在第一节中建立的config.xml文件中注册上述的映射文件：

```
<mappers>		
	<mapper resource="com/mybatis/test2/userMapper.xml"/>	
</mappers>
```

  

5 建立测试类：Test2.java

```
package com.mybatis.test2;

import java.util.List;

import org.apache.ibatis.session.SqlSession;
import org.junit.Test;

import com.mybatis.test1.User;

/**
 * 测试类： 通过注解的方法操作数据表的CRUD
 * @version 2.1 2016/9/24
 * @author WGS
 */
public class Test2 {

	/**
	 * 插入用户user
	 */
	@Test
	public void testInsertUser() {
		SqlSession session =MybatisUtils.getSqlSessionFactory().openSession(true);
		String statement = "com.mybatis.test2.userMapper.insertUser";
		int insert = session.insert(statement, new User(-1,"Uzi",12));
		
		//session.commit();
		System.out.println(insert); 
		session.close();
	}
	
	/**
	 * 根据指定id删除用户
	 */
	@Test
	public void testDeleteUserById(){
		SqlSession session =MybatisUtils.getSqlSessionFactory().openSession();
		String statement = "com.mybatis.test2.userMapper.deleteUser";
		int delete = session.delete(statement, 4);
		session.commit();//手动提交
		System.out.println(delete);
		session.close();
	}
	
	/**
	 * 更新用户信息
	 */
	@Test
	public void testUpdateUserById(){
		SqlSession session =MybatisUtils.getSqlSessionFactory().openSession(true);//设置为自动提交
		String statement = "com.mybatis.test2.userMapper.updateUser";
		session.update(statement, new User(5,"Tank",27));
		session.close();
	}
	
	/**
	 * 根据一个id得到一条用户信息
	 */
	@Test
	public void testSelectUserById(){
		SqlSession session =MybatisUtils.getSqlSessionFactory().openSession();
		String statement = "com.mybatis.test2.userMapper.selectUser";
		User user=session.selectOne(statement, 5);
		System.out.println("***"+user);
		session.close();
	}
	
	/**
	 * 得到所有用户信息
	 */
	@Test
	public void testSelectAllUser(){
		SqlSession session =MybatisUtils.getSqlSessionFactory().openSession();
		String statement = "com.mybatis.test2.userMapper.selectAllUser";
		List<User> users = session.selectList(statement);
		System.out.println(users);
		session.close();
	}
}
```

结构：

![](https://img-blog.csdn.net/20160924172125463?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

### 二、基于注解的方式实现

1 还是同User.java;

2 同MybatisUtils.java；

3建立一个sql映射的接口**interface:** UserMapper.java

```
package com.mybatis.test2_2;

import java.util.List;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.mybatis.test1.User;

/**
 * 接口： 通过注解的方法操作数据表的CRUD
 * @version 2.2 2016/9/24
 * @author WGS
 *
 */
public interface UserMapper {

	@Insert("insert into users(name,age) values(#{name},#{age})")
	public int insertUser(User user);
	
	@Delete("delete from users where id=#{id} ")
	public int deleteUser(int id);
	
	@Update("update users set name=#{name},age=#{age} where id=#{id}")
	public int updateUser(User user);
	
	@Select("select * from users where id=#{id}")
	public User getUserById(int id);
	
	@Select("select * from users")
	public List<User> getAllUsers();
}
```

4 在config中注册这个映射接口：

```
<mappers>
	<mapper <span style="color:#ff0000;">class</span>="com.mybatis.test2_2.UserMapper"/>
</mappers>
```

5 建立测试类：Test2\_2.java

```
package com.mybatis.test2_2;

import java.util.List;

import org.apache.ibatis.session.SqlSession;
import org.junit.Test;

import com.mybatis.test1.User;

/**
 * 测试类： 通过注解的方法操作数据表的CRUD
 * @version 2.2 2016/9/24
 * @author WGS
 *
 */
public class Test2_2 {

	/**
	 * 插入用户user
	 */
	@Test
	public void testInsertUser() {
		SqlSession session = MybatisUtils.getSqlSessionFactory().openSession(true);
		UserMapper mapper = session.getMapper(UserMapper.class);
		
		int insert = mapper.insertUser(new User(-1,"Garanete",38));
		System.out.println(insert);
		session.close();
	}
	
	/**
	 * 根据指定id删除用户
	 */
	@Test
	public void testDeleteUser(){
		SqlSession session = MybatisUtils.getSqlSessionFactory().openSession(true);
		UserMapper mapper = session.getMapper(UserMapper.class);
		
		int delete = mapper.deleteUser(4);
		System.out.println(delete);
		session.close();
	}
	
	/**
	 * 更新用户信息
	 */
	@Test
	public void testUpdateUser(){
		SqlSession session = MybatisUtils.getSqlSessionFactory().openSession(true);
		UserMapper mapper = session.getMapper(UserMapper.class);
		
		mapper.updateUser(new User(5,"MaYun",53));
		session.close();
	}
	
	/**
	 * 根据一个id得到一条用户信息
	 */
	@Test
	public void testGetUser(){
		SqlSession session = MybatisUtils.getSqlSessionFactory().openSession();
		UserMapper mapper = session.getMapper(UserMapper.class);
		
		User user = mapper.getUserById(5);
		System.out.println("*"+user);
		session.close();
	}
	
	/**
	 * 得到所有用户信息
	 */
	@Test
	public void testGetAllUsers(){
		SqlSession session = MybatisUtils.getSqlSessionFactory().openSession();
		UserMapper mapper = session.getMapper(UserMapper.class);
		
		List<User> users = mapper.getAllUsers();
		System.out.println("**"+users);
		session.close();
	}

}
```

  

结构图：

![](https://img-blog.csdn.net/20160924172852770?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

### 三、几个可以优化的地方

1  将连接数据库的配置单独放在一个db.properties文件中：

```
jdbcDriver=com.mysql.jdbc.Driver
jdbcUrl=jdbc:mysql://localhost:3306/mybatis
username=root
password=920614
#...
```

   在conf.xml文件中导入db.properties文件： 

```
       <!-- 
		优化1：将连接数据库的配置单独放在一个properties文件中
		   导入db.properties文件 
	-->
	<properties resource="db.properties">
	</properties>
```

  
  
2  为实体类定义一个别名：

```
        <!-- 
		优化2 ：为实体类定义别名，即简化sql映射文件xml 文件中的引用 parameterType="com.mybatis.test2.User"
	-->
	<typeAliases>
		<typeAlias type="com.mybatis.test1.User" alias="_User"/>
		<!-- 或者直接命名实体类所在的包：
			<package name="com.mybatis.test1"/>
		 -->
	</typeAliases>
```

3添加配置文件打印日志信息：

 (1)添加log4j-1.2.16.jar包；

  (2)src下建立log4j.xml文件(或者.properties)

```
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE log4j:configuration SYSTEM "log4j.dtd">
<log4j:configuration xmlns:log4j="http://jakarta.apache.org/log4j/">
	<appender name="STDOUT" class="org.apache.log4j.ConsoleAppender">
		<layout class="org.apache.log4j.PatternLayout">
			<param name="ConversionPattern"
				value="%-5p %d{MM-dd HH:mm:ss,SSS} %m (%F:%L) \n" />
		</layout>
	</appender>
	<logger name="java.sql">
		<level value="debug" />
	</logger>
	<logger name="org.apache.ibatis">
		<level value="debug" />
	</logger>
	<root>
		<level value="debug" />
		<appender-ref ref="STDOUT" />
	</root>
</log4j:configuration>
```

  

结构图：

![](https://img-blog.csdn.net/20160924173651889?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

conf.xml

```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-config.dtd">

<configuration>

	<!-- 
		优化1：将连接数据库的配置单独放在一个properties文件中
		   导入db.properties文件 
	-->
	<properties resource="db.properties">
	</properties>
	
	<!-- 
		优化2 ：为实体类定义别名，即简化sql映射文件xml 文件中的引用 parameterType="com.mybatis.test2.User"
	-->
	<typeAliases>
		<typeAlias type="com.mybatis.test1.User" alias="_User"/>
		<!-- 或者直接命名实体类所在的包：
			<package name="com.mybatis.test1"/>
		 -->
	</typeAliases>
	
	<environments default="development">
		<environment id="development">
			<transactionManager type="JDBC" />
			<dataSource type="POOLED">
				<property name="driver" value="${jdbcDriver}" />
				<property name="url" value="${jdbcUrl}" />
				<property name="username" value="${username}" />
				<property name="password" value="${password}" />
			</dataSource>
		</environment>
	</environments>
	
	<!-- 注册userMapper.xml文件 -->
	<mappers>
		<mapper resource="com/mybatis/test1/userMapper.xml"/>
		
		<mapper resource="com/mybatis/test2/userMapper.xml"/>
		<mapper class="com.mybatis.test2_2.UserMapper"/>
	</mappers>
	
	
</configuration>
```

  