---
title: "利用Intellij+MAVEN完成Spring整合Mybatis项目详解"
date: 2016-12-27
category: 后端开发
tags: []
---

### 利用Intellij+MAVEN完成Spring整合Mybatis项目详解

1 创建MAVEN项目，配置pom.xml

```
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>SpringMybatisTest</groupId>
  <artifactId>SpringMybatisTest</artifactId>
  <packaging>war</packaging>
  <version>1.0-SNAPSHOT</version>
  <name>SpringMybatisTest Maven Webapp</name>
  <url>http://maven.apache.org</url>

  <dependencies>

    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>3.8.1</version>
      <scope>test</scope>
    </dependency>

    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-test</artifactId>
      <version>4.0.6.RELEASE</version>
      <scope>test</scope>
    </dependency>

    <!--spring-->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-beans</artifactId>
      <version>4.3.1.RELEASE</version>
    </dependency>

    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-core</artifactId>
      <version>4.3.1.RELEASE</version>
    </dependency>

    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-context</artifactId>
      <version>4.3.1.RELEASE</version>
    </dependency>


    <!--Spring Web + Spring MVC-->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-web</artifactId>
      <version>4.3.1.RELEASE</version>
    </dependency>
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-webmvc</artifactId>
      <version>4.3.1.RELEASE</version>
    </dependency>

    <!--NoClassDefFoundError: javax/servlet/jsp/jstl/core/Config-->
    <!-- https://mvnrepository.com/artifact/javax.servlet/jstl -->
    <dependency>
      <groupId>javax.servlet</groupId>
      <artifactId>jstl</artifactId>
      <version>1.2</version>
    </dependency>

    <dependency>
      <groupId>taglibs</groupId>
      <artifactId>standard</artifactId>
      <version>1.1.2</version>
    </dependency>

    <!--servlet/jsp api start-->
    <dependency>
      <groupId>javax.servlet</groupId>
      <artifactId>servlet-api</artifactId>
      <version>2.5</version>
    </dependency>

    <!-- https://mvnrepository.com/artifact/javax.servlet.jsp/jsp-api -->
    <dependency>
      <groupId>javax.servlet.jsp</groupId>
      <artifactId>jsp-api</artifactId>
      <version>2.2</version>
    </dependency>

    <!--mysql driver-->
    <dependency>
      <groupId>mysql</groupId>
      <artifactId>mysql-connector-java</artifactId>
      <version>5.1.6</version>
    </dependency>

    <!--jdbc-->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-jdbc</artifactId>
      <version>3.0.5.RELEASE</version>
    </dependency>

    <!--c3p0-->
    <dependency>
      <groupId>com.mchange</groupId>
      <artifactId>c3p0</artifactId>
      <version>0.9.5.1</version>
    </dependency>

    <!--aspectj-->
    <dependency>
      <groupId>org.aspectj</groupId>
      <artifactId>aspectjweaver</artifactId>
      <version>1.8.6</version>
    </dependency>

    <dependency>
      <groupId>org.aspectj</groupId>
      <artifactId>aspectjrt</artifactId>
      <version>1.8.6</version>
    </dependency>

    <!--mybatis-->
    <dependency>
      <groupId>org.mybatis</groupId>
      <artifactId>mybatis</artifactId>
      <version>3.4.1</version>
    </dependency>

    <!--mybatis spring整合-->
    <!-- https://mvnrepository.com/artifact/org.mybatis/mybatis-spring -->
    <dependency>
      <groupId>org.mybatis</groupId>
      <artifactId>mybatis-spring</artifactId>
      <version>1.3.0</version>
    </dependency>


    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>RELEASE</version>
    </dependency>
    <dependency>
      <groupId>SpringMybatisTest</groupId>
      <artifactId>SpringMybatisTest</artifactId>
      <version>1.0-SNAPSHOT</version>
    </dependency>
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-test</artifactId>
      <version>RELEASE</version>
    </dependency>
  </dependencies>

  <build>
    <finalName>SpringMybatisTest</finalName>

    <plugins>
      <!--servlet容器 jetty插件-->
      <plugin>
        <groupId>org.eclipse.jetty</groupId>
        <artifactId>jetty-maven-plugin</artifactId>
        <version>9.3.10.v20160621</version>
      </plugin>

      <!--mybatis 逆向工程插件-->
      <plugin>
        <groupId>org.mybatis.generator</groupId>
        <artifactId>mybatis-generator-maven-plugin</artifactId>
        <version>1.3.2</version>
        <configuration>
          <verbose>true</verbose>
          <overwrite>true</overwrite>
        </configuration>
      </plugin>

      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <configuration>
          <source>1.7</source>
          <target>1.7</target>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
```

  
2 建java包后建实体类：

![]()

实体类Employee.java

```
package com.springmybatis.model;

/**
 * Created by wanggenshen_sx on 2016/12/23.
 */
public class Employee {

	private int id;
	private String lastName;
	private String email;

	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public String getLastName() {
		return lastName;
	}
	public void setLastName(String lastName) {
		this.lastName = lastName;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	@Override
	public String toString() {
		return "Employee [id=" + id + ", lastName=" + lastName + ", email="
				+ email+" ]" ;
	}
}
```

EmployeeMapper.java，采用的注解的方式,即@Select

```
package com.springmybatis.service;

import com.springmybatis.model.Employee;
import org.apache.ibatis.annotations.Select;

import java.util.List;


/**
 * Created by wanggenshen_sx on 2016/12/26.
 */
public interface EmployeeMapper {

	@Select("select id,lastName,email from employee where id=#{id}")
	Employee findById(int id);

	@Select("select id,lastName,email from employee")
	List<Employee> findAll();
}
```

  
   测试类：SpringMybatisTest1.java

```
package com.springmybatis.test;

import com.springmybatis.model.Employee;
import com.springmybatis.service.EmployeeMapper;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import javax.sql.DataSource;
import java.util.List;

/**
 * Created by wanggenshen_sx on 2016/12/26.
 */
@RunWith(SpringJUnit4ClassRunner.class)//使用Springtest框架
@ContextConfiguration(locations={"classpath:spring.xml"})//加载配置
public class SpringMybatisTest1 {
	@Autowired
	private EmployeeMapper employeeMapper;

	@Test
	public void getUser(){
		Employee user = employeeMapper.findById(1);
		System.out.println(user);
	}

	@Test
	public void findAll(){
		List<Employee> users = employeeMapper.findAll();
		System.out.println(users);
	}
	@Test
	public void test(){
		System.out.println(12);
	}


}
```

3 编写spring配置文件，整合mybatis.注意这里使用的事EmployeeMapper接口，采用的是注解的方式，所以要在配置文件中去注册这个接口。（如果用配置文件的方式就是要注册对应接口的xml文件）

```
<!--
    3. mybatis自动扫描加载Sql映射文件 : MapperScannerConfigurer
        sqlSessionFactory / basePackage
-->
<bean id="config" class="org.mybatis.spring.mapper.MapperScannerConfigurer">
    <property name="basePackage" value="com.springmybatis.service"/>
    <property name="sqlSessionFactoryBeanName" value="sqlSessionFactory"/>
</bean>
```

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
        <property name="url" value="jdbc:mysql://localhost:3306/mytest"/>
        <property name="username" value="root"/>
        <property name="password" value="920614"/>
    </bean>

    <!--
        2. mybatis的SqlSession的工厂: SqlSessionFactoryBean
            dataSource / typeAliasesPackage
    -->
    <bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
        <property name="dataSource" ref="datasource"/>
        <property name="typeAliasesPackage" value="com.springmybatis.model"/>
    </bean>

    <!--
        3. mybatis自动扫描加载Sql映射文件 : MapperScannerConfigurer
            sqlSessionFactory / basePackage
    -->
    <bean id="config" class="org.mybatis.spring.mapper.MapperScannerConfigurer">
        <property name="basePackage" value="com.springmybatis.service"/>
        <property name="sqlSessionFactoryBeanName" value="sqlSessionFactory"/>
    </bean>

    <!-- 4. 事务管理 : DataSourceTransactionManager -->
    <bean id="manager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
        <property name="dataSource" ref="datasource"/>
    </bean>

    <!-- 5. 使用声明式事务 -->
    <tx:annotation-driven transaction-manager="manager" />

</beans>
```

项目结构：

![]()

![](https://img-blog.csdn.net/20161227150137642?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)