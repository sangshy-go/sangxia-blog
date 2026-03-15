---
title: "【Mybatis学习总结九】Spring中集成Mybatis"
date: 2016-09-29
category: 后端开发
tags: []
---

学习了Mybatis的基本内容后，现在最重要的内容莫过于是在Spring中集成Mybatis了。好处之一就是不用再单独配置Mybatis-config.xml文件了(含有数据库连接池和配置类名以及注册映射文件等信息)。下面看具体操作步骤：

### 1 填加jar包：

【mybatis 】  
mybatis-3.2.0.jar  
mybatis-spring-1.1.1.jar  
log4j-1.2.17.jar  
【spring 】  
spring-aop-3.2.0.RELEASE.jar  
spring-beans-3.2.0.RELEASE.jar  
spring-context-3.2.0.RELEASE.jar  
spring-core-3.2.0.RELEASE.jar  
spring-expression-3.2.0.RELEASE.jar  
spring-jdbc-3.2.0.RELEASE.jar  
spring-test-3.2.4.RELEASE.jar  
spring-tx-3.2.0.RELEASE.jar  
aopalliance-1.0.jar  
cglib-nodep-2.2.3.jar  
commons-logging-1.1.1.jar  
【MYSQL 驱动包】  
mysql-connector-java-5.0.4-bin.jar

### 2 创建数据表：

```
CREATE TABLE s_user(
user_id INT AUTO_INCREMENT PRIMARY KEY,
user_name VARCHAR(30),
user_birthday DATE,
user_salary DOUBLE
)
```

  

### 3 创建实体类：SUser.java

```
package com.spring_mybatis.domain;

import java.util.Date;

public class SUser {

	private int id;
	private String name;
	private Date birthday;
	private double salary;
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
	public Date getBirthday() {
		return birthday;
	}
	public void setBirthday(Date birthday) {
		this.birthday = birthday;
	}
	public double getSalary() {
		return salary;
	}
	public void setSalary(double salary) {
		this.salary = salary;
	}
	public SUser(int id, String name, Date birthday, double salary) {
		super();
		this.id = id;
		this.name = name;
		this.birthday = birthday;
		this.salary = salary;
	}
	public SUser() {
		super();
	}
	@Override
	public String toString() {
		return "SUser [id=" + id + ", name=" + name + ", salary=" + salary
				+ "]";
	}
	
}
```

  

### 4 创建接口SUserMapper

```
package com.mybatis.Mapper;

import java.util.List;
import com.spring_mybatis.domain.SUser;

public interface SUserMapper {

	void save(SUser user);
	void update(SUser user);
	void delete(int id);
	SUser findById(int id);
	List<SUser> findAll();
}
```

  

### 5 对应的SQL映射文件suserMapper.xml

```
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE  mapper  PUBLIC  "-//mybatis.org//DTD  Mapper  3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 
	9  spring集成mybatis
	namespace:必须与SUserMapper.java接口的报名一致；
	id:       必须与接口中定义的方法一致；
 -->
<!--定义操作 SUser 表的sql 映射文件：suserMapper.xml   -->
<mapper namespace="com.mybatis.Mapper.SUserMapper">

	<!-- 解决别名与实体类属性名冲突问题 -->
	<resultMap type="SUser" id="userResult">
		<result column="user_id" property="id"/>
		<result column="user_name" property="name"/>
		<result column="user_birthday" property="birthday"/>
		<result column="user_salary" property="salary"/>
	</resultMap>

	<!-- 取得插入数据后的id -->
	<insert id="save" keyColumn="user_id" keyProperty="id" useGeneratedKeys="true">
		insert into s_user(user_name,user_birthday,user_salary)
		values(#{name},#{birthday},#{salary})
	</insert>

	<update id="update">
		update s_user
		set user_name = #{name},
			user_birthday = #{birthday},
			user_salary = #{salary}
		where user_id = #{id}
	</update>
	
	<delete id="delete">
		delete from s_user
		where user_id = #{id}
	</delete>

	<select id="findById" resultMap="userResult">
		select *
		from s_user
		where user_id = #{id}
	</select>
	
	<select id="findAll" resultMap="userResult">
		select * 
		from s_user
	</select>
	
</mapper>
```

  

【注】此处id内的方法要与SUserMapper.jaav接口内的方法名一致；

### 6 spring的配置文件：beans.xml

```
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:tx="http://www.springframework.org/schema/tx"
	xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-3.2.xsd">

	<!-- 1. 数据源 : DriverManagerDataSource -->
	<bean id="datasource" class="org.springframework.jdbc.datasource.DriverManagerDataSource">
		<property name="driverClassName" value="com.mysql.jdbc.Driver"/>
		<property name="url" value="jdbc:mysql://localhost:3306/mybatis"/>
		<property name="username" value="root"/>
		<property name="password" value="920614"/>
	</bean>
	
	<!-- 
		2. mybatis的SqlSession的工厂: SqlSessionFactoryBean 
			dataSource / typeAliasesPackage
	-->
	<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
		<property name="dataSource" ref="datasource"/>
		<property name="typeAliasesPackage" value="com.spring_mybatis.domain"/>
	</bean>

	<!-- 
		3. mybatis自动扫描加载Sql映射文件 : MapperScannerConfigurer 
			sqlSessionFactory / basePackage
	-->
	<bean id="config" class="org.mybatis.spring.mapper.MapperScannerConfigurer">
		<property name="basePackage" value="com.mybatis.Mapper"/>
		<property name="sqlSessionFactory" ref="sqlSessionFactory"/>
	</bean>
	
	<!-- 4. 事务管理 : DataSourceTransactionManager -->
	<bean id="manager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
		<property name="dataSource" ref="datasource"/>
	</bean>

	<!-- 5. 使用声明式事务 -->
	<tx:annotation-driven transaction-manager="manager" />

</beans>
```

  

### 7 测试类：

【注】测试的时候@RunWith(SpringJUnit4ClassRunner.class)//使用Springtest框架

@ContextConfiguration("/beans.xml")//加载配置

@Autowired  //注入  
private SUserMapper sUserMapper;接口

```
package com.mybatis.test;

import java.util.Date;
import java.util.List;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.mybatis.Mapper.SUserMapper;
import com.spring_mybatis.domain.SUser;

@RunWith(SpringJUnit4ClassRunner.class)//使用Springtest框架

@ContextConfiguration("/beans.xml")//加载配置
public class Test9 {

	/**
	 * 测试Spring集成Mybatis
	 */
	
	@Autowired  //注入
	private SUserMapper sUserMapper;
	
	@Test
	public void save(){
		SUser user = new SUser(-1,"tom",new Date(),12345);
		sUserMapper.save(user);
	}
	
	@Test
	public void delete(){
		sUserMapper.delete(4);
	}
	
	@Test
	public void update(){
		SUser user = new SUser(2,"tom33",new Date(),99999);
		sUserMapper.update(user);
	}
	
	@Test
	public void getUser(){
		SUser user = sUserMapper.findById(1);
		System.out.println(user);
	}
	
	@Test
	public void findAll(){
		List<SUser> users = sUserMapper.findAll();
		System.out.println(users);
	}
	
	
	
}
```

  
结构

![](https://img-blog.csdn.net/20160929180045547?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)