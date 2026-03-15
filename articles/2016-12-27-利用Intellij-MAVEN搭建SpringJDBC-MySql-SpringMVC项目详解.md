---
title: "利用Intellij+MAVEN搭建SpringJDBC+MySql+SpringMVC项目详解"
date: 2016-12-27
category: 后端开发
tags: []
---

### 利用Intellij+MAVEN搭建SpringJDBC+MySql+SpringMVC项目详解

1 配置MAVEN的配置文件pom.xml

```
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>SpringJDBCTest1</groupId>
  <artifactId>SpringJDBCTest1</artifactId>
  <packaging>war</packaging>
  <version>1.0-SNAPSHOT</version>
  <name>SpringJDBCTest1 Maven Webapp</name>
  <url>http://maven.apache.org</url>

  <dependencies>

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
      <version>3.3.0</version>
    </dependency>

    <!--mybatis spring整合-->
    <dependency>
      <groupId>org.mybatis</groupId>
      <artifactId>mybatis-spring</artifactId>
      <version>1.2.3</version>
    </dependency>

  </dependencies>

  <build>
    <finalName>SpringJDBCTest1</finalName>

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

2 src下建java包和类：

![]()

实体类：Employee.java

```
package com.springjdbc.entities;

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

持久层类：EmployeeDao.java

这里注入JdbcTemplate,使用SpringJDBC框架。

```
package com.springjdbc.dao;

import com.springjdbc.entities.Employee;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 * Created by wanggenshen_sx on 2016/12/23.
 */
@Repository
public class EmployeeDao {
   @Autowired
   private JdbcTemplate jdbcTemplate;

   public Employee get(int id){
      String sql="SELECT id, lastName,email FROM employee WHERE id=?";
      RowMapper<Employee> rowMapper=new BeanPropertyRowMapper<>(Employee.class);
      Employee employee=jdbcTemplate.queryForObject(sql, rowMapper,id);

      return employee;
   }
}
```

控制器：EmployeeController.java

```
package com.springjdbc.controller;

import com.springjdbc.dao.EmployeeDao;
import com.springjdbc.entities.Employee;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;
import java.util.Map;

/**
 * Created by wanggenshen_sx on 2016/12/23.
 */
@Controller
public class EmployeeController {

   private ApplicationContext ctx=null;
   private JdbcTemplate jdbcTemplate=null;
   private EmployeeDao employeeDao ;
   private NamedParameterJdbcTemplate namedParameterJdbcTemplate=null;
   {
      ctx=new ClassPathXmlApplicationContext("applicationContext.xml");
      jdbcTemplate =(JdbcTemplate) ctx.getBean("jdbcTemplate");
      employeeDao = ctx.getBean(EmployeeDao.class);
      namedParameterJdbcTemplate=(NamedParameterJdbcTemplate) ctx.getBean("namedParameterJdbcTemplate");

   }

   @RequestMapping(value = "/listAllEmployee",method = RequestMethod.GET)
   public String list(Map<String,Object> map){
      String sql="SELECT id, lastName,email FROM employee";
      RowMapper<Employee> rowMapper=new BeanPropertyRowMapper<>(Employee.class);
      List<Employee> employees=jdbcTemplate.query(sql, rowMapper);
      map.put("employees",employees);
      return "list";
   }
}
```

3  配置sping和spingmvc的配置文件：

applicationContext.xml

```
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:tx="http://www.springframework.org/schema/tx"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-4.0.xsd
        http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-4.0.xsd">


    <context:component-scan base-package="com.springjdbc.dao"></context:component-scan>

    <!-- 导入资源文件 -->
    <context:property-placeholder location="classpath:db.properties"/>
    <!-- 配置C3P0数据源 -->
    <bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource">
        <property name="user" value="${jdbc.user}"></property>
        <property name="password" value="${jdbc.password}"></property>
        <property name="driverClass" value="${jdbc.driverClass}"></property>
        <property name="jdbcUrl" value="${jdbc.jdbcUrl}"></property>

        <property name="initialPoolSize" value="${jdbc.initPoolSize}"></property>
        <property name="maxPoolSize" value="${jdbc.maxPoolSize}"></property>

    </bean>

    <!-- 配置spring-jdbcTemplate模板 -->
    <bean id="jdbcTemplate" class="org.springframework.jdbc.core.JdbcTemplate">
        <property name="dataSource" ref="dataSource"></property>
    </bean>

    <!-- 配置 NamedParameterJdbcTemplate,
         该对象可以使用具名参数, 其没有无参数的构造器, 所以必须为其构造器指定参数 -->
    <bean id="namedParameterJdbcTemplate" class="org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate">
        <constructor-arg ref="dataSource"></constructor-arg>
    </bean>

    <!-- 配置事务管理器 -->
    <bean id="transactionManager"
          class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
        <property name="dataSource" ref="dataSource"></property>
    </bean>

    <!-- 启用事务注解 -->
    <tx:annotation-driven transaction-manager="transactionManager"/>

    <!-- spring注解模式配置 -->
    <context:annotation-config/>

</beans>
```

springmvc-servlet.xml

```
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:mvc="http://www.springframework.org/schema/mvc"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
http://www.springframework.org/schema/beans/spring-beans-3.1.xsd
http://www.springframework.org/schema/context
http://www.springframework.org/schema/context/spring-context-3.1.xsd
http://www.springframework.org/schema/mvc
http://www.springframework.org/schema/mvc/spring-mvc-3.1.xsd">
    <mvc:annotation-driven />
    <mvc:default-servlet-handler/>

    <!-- 启动包扫描功能 -->
    <context:component-scan base-package="com.springjdbc.controller" />

    <!-- 对模型视图名称的解析，在请求时模型视图名称添加前后缀 -->
    <bean id="viewResolverCommon" class="org.springframework.web.servlet.view.InternalResourceViewResolver">
        <property name="prefix" value="/WEB-INF/views/"/>
        <property name="suffix" value=".jsp"/>
        <property name="viewClass"  value="org.springframework.web.servlet.view.JstlView" />
    </bean>

</beans>
```

4 配置web.xml

```
<!DOCTYPE web-app PUBLIC
        "-//Sun Microsystems, Inc.//DTD Web Application 2.3//EN"
        "http://java.sun.com/dtd/web-app_2_3.dtd" >
<web-app xmlns="http://java.sun.com/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://java.sun.com/xml/ns/javaee
          http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd"
         version="3.0">

  <!--配置springmvc DispatcherServlet-->
  <servlet>
    <servlet-name>springmvc-servlet</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    <init-param>
      <param-name>contextConfigLocation</param-name>
      <param-value>classpath:springmvc-servlet.xml</param-value>
    </init-param>

    <load-on-startup>1</load-on-startup>
  </servlet>

  <servlet-mapping>
    <servlet-name>springmvc-servlet</servlet-name>
    <url-pattern>/</url-pattern>
  </servlet-mapping>

  <context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>classpath:applicationContext.xml</param-value>
  </context-param>

  <listener>
    <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
  </listener>

</web-app>
```

5 建显示页面list.jsp

```
<%--
  Created by IntelliJ IDEA.
  User: wanggenshen_sx
  Date: 2016/12/23
  Time: 16:56
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<html>
<head>
    <title>Show Page</title>
</head>
<body>
    <table border="1" cellspacing="0" cellpadding="10">
        <tr>
            <th>ID</th>
            <th>LastName</th>
            <th>Email</th>
        </tr>

        <c:forEach items="${employees}" var="emp">
            <tr>
                <th>${emp.id}</th>
                <th>${emp.lastName}</th>
                <th>${emp.email}</th>
            </tr>
        </c:forEach>
    </table>
</body>
</html>
```

项目结构：

![]()![](https://img-blog.csdn.net/20161227134243906?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

![]()

end.

![]()