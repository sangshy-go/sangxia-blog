---
title: "利用Intellij+MAVEN搭建Spring+Mybatis+MySql+SpringMVC项目详解"
date: 2016-12-27
category: 后端开发
tags: []
---

### 利用Intellij+MAVEN搭建Spring+Mybatis+MySql+SpringMVC项目详解

### 这两天在公司实习，师父让我先熟悉Intellij软件的使用和SpringMVC框架。话不多说，先利用这些搭建一个小环境吧。

1 创建MAVEN项目：File-NEW-MAVEN-create from..前打勾--选下面的org.apache..archetypes:maven-archetype-webapp,点击next

                 后面的项目名称：

GroupId:项目的名称，

ArtiFactId:项目的模块名称（建议用项目名称-模块名称来表示），

Version:项目版本的名称

如：groupID：SpringMVC；ArtiFactId：SpringMVC-Demo，version:默认完成后，IDEA就自动给我们构建了一个空的maven项目.

![](https://img-blog.csdn.net/20161227112650203?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

2  配置pom.xml文件，这里利用<dependency></dependency>标签导入需要的库。这里需要导入的有junit , spring , springmvc , mysql , mybatis , jstl等等，详见下面的配置文件：

```
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>MybatisTest</groupId>
  <artifactId>MybatisTest-Demo1</artifactId>
  <packaging>war</packaging>
  <version>1.0-SNAPSHOT</version>
  <name>MybatisTest-Demo1 Maven Webapp</name>
  <url>http://maven.apache.org</url>
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>3.8.1</version>
      <scope>test</scope>
    </dependency>

    <!--mysql driver-->
    <dependency>
      <groupId>mysql</groupId>
      <artifactId>mysql-connector-java</artifactId>
      <version>5.1.6</version>
    </dependency>

    <!--spring-->
    <!-- spring-aop -->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-aop</artifactId>
      <version>4.3.5.RELEASE</version>
    </dependency>

    <!--spring-tx -->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-tx</artifactId>
      <version>4.3.5.RELEASE</version>
    </dependency>


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

    <!--jdbc-->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-jdbc</artifactId>
      <version>3.0.5.RELEASE</version>
    </dependency>

    <!--mybatis-->
    <dependency>
      <groupId>org.mybatis</groupId>
      <artifactId>mybatis</artifactId>
      <version>3.4.1</version>
    </dependency>
    <!--mybatis spring整合-->
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

  <!--spring-test-->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-test</artifactId>
      <version>3.2.3.RELEASE</version>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-test</artifactId>
      <version>RELEASE</version>
    </dependency>

  </dependencies>
  <build>
    <finalName>MybatisTest-Demo1</finalName>

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

  
3 src下面新建java包，将其设置为source root(在java包上点击右键，选择Mark Directory As Source Root),依次建如图类结构：

![](https://img-blog.csdn.net/20161227113243311?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

1）创建接口EmployeeMapper.java,这里是采用Mybatis的注解的方式，要在后面的spring-mybatis文件中去注册接口

```
package com.mybatis.dao;

import com.mybatis.model.Employee;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * Created by wanggenshen_sx on 2016/12/26.
 */

public interface EmployeeMapper {
	@Select("select id,lastName,email from employee where id=#{id}")
	Employee getEmployeeById(int id);

	@Select("select * from employee")
	List<Employee> getAllEmployees();
}
```

  

2）实体类：Employee.java

```
package com.mybatis.model;

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
	public Employee(){}
}
```

 3) Service层：

创建EmployeeService接口

```
package com.mybatis.service;

import com.mybatis.model.Employee;

import java.util.List;

/**
 * Created by wanggenshen_sx on 2016/12/26.
 */
public interface EmployeeService {
	Employee getEmployee(int id);

	List<Employee> getEmployees();
}
```

  

创建EmployeeServiceImpl实现类：注意添加@Service注解

```
package com.mybatis.service;

import com.mybatis.dao.EmployeeMapper;
import com.mybatis.model.Employee;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Created by wanggenshen_sx on 2016/12/26.
 */
@Service
public class EmployeeServiceImpl implements EmployeeService {

   public EmployeeServiceImpl() {
      System.out.printf("init EmployeeServiceImpl");
   }

   @Autowired
   private EmployeeMapper employeeMapper;

   @Override
   public Employee getEmployee(int id){
      return employeeMapper.getEmployeeById(id);
   }

   public List<Employee> getEmployees(){
      return employeeMapper.getAllEmployees();
   }

}
```

4）在spring配置文件中整合mybatis:spring-mybatis.xml

```
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:tx="http://www.springframework.org/schema/tx" xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-3.2.xsd http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop.xsd">

    <!--自动扫描含有@Service的类，将其注入为bean -->
    <context:component-scan base-package="com.mybatis.service" />
    <context:component-scan base-package="com.mybatis.dao" />

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
        <property name="typeAliasesPackage" value="com.mybatis.model"/>
    </bean>

    <!--
        3. mybatis自动扫描加载Sql映射文件 : MapperScannerConfigurer
            sqlSessionFactory / basePackage
    -->
    <bean id="config" class="org.mybatis.spring.mapper.MapperScannerConfigurer">
       <property name="basePackage" value="com.mybatis.dao"/>
        <property name="sqlSessionFactoryBeanName" value="sqlSessionFactory" />
    </bean>


    <!-- 4. 事务管理 : DataSourceTransactionManager -->
    <bean id="manager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
        <property name="dataSource" ref="datasource"/>
    </bean>

    <!-- 5. 使用声明式事务 -->
    <tx:annotation-driven transaction-manager="manager" />

</beans>
```

建测试类：EmployeeTest.java

```
package com.mybatis.test;

import com.mybatis.model.Employee;
import com.mybatis.service.EmployeeService;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.List;

/**
 * Created by wanggenshen_sx on 2016/12/27.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = { "classpath:spring-mybatis.xml" })
public class EmployeeTest {

   @Autowired
   private EmployeeService employeeService;

   @Test
   public void testGetEmployeeById(){
      Employee employee = employeeService.getEmployee(1);
      System.out.print(employee);
   }

   @Test
   public void testGetAll(){
      List<Employee> employees=employeeService.getEmployees();
      System.out.print(employees);
   }
}
```

能输出并显示数据库表的内容，即表示Spring整合Mybatis成功，接下来加入SpringMVC内容，将读取的内容显示在页面上。

4 创建springmvc-servlet.xml,配置视图信息。

```
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:mvc="http://www.springframework.org/schema/mvc"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
      http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-4.0.xsd
      http://www.springframework.org/schema/mvc http://www.springframework.org/schema/mvc/spring-mvc-4.0.xsd">

    <!--注解-->
    <mvc:annotation-driven/>
    <!--处理静态资源-->
    <mvc:default-servlet-handler/>

    <!-- 自动扫描controller包下的有@Controller注解的，注入为bean -->
    <context:component-scan base-package="com.mybatis.controller" />

    <!--配置视图解析器-->
    <bean id="viewResolverCommon" class="org.springframework.web.servlet.view.InternalResourceViewResolver">
        <property name="prefix" value="/WEB-INF/views/"/>
        <property name="suffix" value=".jsp"/>
        <property name="viewClass"  value="org.springframework.web.servlet.view.JstlView" />
    </bean>


</beans>
```

5 建控制类：  
EmployeeController.java

```
package com.mybatis.controller;

import com.mybatis.model.Employee;
import com.mybatis.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;
import java.util.Map;

/**
 * Created by wanggenshen_sx on 2016/12/26.
 */
@Controller
public class EmployeeController {

   @Autowired
   private EmployeeService employeeService;

   @RequestMapping(value="/listAll",method= RequestMethod.GET)
   public String list(Map<String,Object> map){
      List<Employee> employees = employeeService.getEmployees();
       /*测试用
      if(employees==null)
         System.out.println("null");
      else
         System.out.println(employees);*/

      map.put("employees",employees);
      return "list";
   }


}
```

  

6 建立显示页面: Web-app的WEB-INF下建views包下建list.jsp：

注意此处一定要加上

```
	<%@ page isELIgnored="false" %>
```

否则无法使用jstl标签。

```
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%--
  Created by IntelliJ IDEA.
  User: wanggenshen_sx
  Date: 2016/12/26
  Time: 17:25
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page isELIgnored="false" %>
<html>
<head>
    <title>Show Page22</title>
</head>
<body>
                <table border="1" cellspacing="0" cellpadding="10">
                    <tr>
                        <th>ID</th>
                        <th>LastName</th>
                        <th>Email</th>
                    </tr>

                    <c:forEach items="${requestScope.employees}" var="emp">
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

7 配置web.xml ,分别指定spring,springmvc配置文件的位置。注意这里一定要有四个部分，即<context-param>,<servlet>,<servlet-mapping>,<listener>.

我在这里没有添加<listener>标签，spring无法初始化，出现了【Caused by: org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'employeeController': Unsatisfied dependency expressed through field 'employeeService':
No qualifying bean of type [com.mybatis.service.EmployeeService] found for dependency [com.mybatis.service.EmployeeService]: expected at least 1 bean which qualifies as autowire candidate for this dependency. Dependency annotations: 】错误。

```
<!DOCTYPE web-app PUBLIC
 "-//Sun Microsystems, Inc.//DTD Web Application 2.3//EN"
 "http://java.sun.com/dtd/web-app_2_3.dtd" >

<web-app>
  <context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>classpath:spring-mybatis.xml</param-value>
  </context-param>
  <listener>
    <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
  </listener>

  <!-- 防止spring内存溢出监听器 -->
  <listener>
    <listener-class>org.springframework.web.util.IntrospectorCleanupListener</listener-class>
  </listener>


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
</web-app>
```

8 项目整体结构：

![](https://img-blog.csdn.net/20161227114709559?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)