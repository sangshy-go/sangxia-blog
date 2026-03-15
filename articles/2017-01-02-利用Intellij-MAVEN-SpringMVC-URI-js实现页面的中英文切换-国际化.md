---
title: "利用Intellij+MAVEN+SpringMVC+URI.js实现页面的中英文切换（国际化)"
date: 2017-01-02
category: 后端开发
tags: []
---

### 利用Intellij+MAVEN+SpringMVC+URI.js实现页面的中英文切换（国际化）

一个页面经常会有中英文切换的功能，今天就使用SpringMVC实现一个通过链接实现页面中英文切换的小DEMO。

### 一  配置文件

#### 1 MAVEN的配置文件pom.xml(后面使用到了jstl标签，所以也需要导入这个包):

```
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>TestSpringMVC2</groupId>
  <artifactId>TestSpringMVC2</artifactId>
  <packaging>war</packaging>
  <version>1.0-SNAPSHOT</version>
  <name>TestSpringMVC2 Maven Webapp</name>
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
        <artifactId>spring-jdbc</artifactId>
        <version>3.0.5.RELEASE</version>
      </dependency>

    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-test</artifactId>
      <version>4.3.1.RELEASE</version>
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


    <!-- https://mvnrepository.com/artifact/javax.servlet.jsp/jsp-api -->
    <dependency>
      <groupId>javax.servlet.jsp</groupId>
      <artifactId>jsp-api</artifactId>
      <version>2.2</version>
    </dependency>


  </dependencies>

  <build>
    <finalName>TestSpringMVC2</finalName>

    <resources>
      <!--表示把java目录下的有关xml文件,properties文件编译/打包的时候放在resource目录下-->
      <resource>
        <directory>${basedir}/src/main/java</directory>
        <includes>
          <include>**/*.properties</include>
          <include>**/*.xml</include>
        </includes>
      </resource>
      <resource>
        <directory>${basedir}/src/main/resources</directory>
      </resource>
    </resources>
    <plugins>
      <!--servlet容器 jetty插件-->
      <plugin>
        <groupId>org.eclipse.jetty</groupId>
        <artifactId>jetty-maven-plugin</artifactId>
        <version>9.3.10.v20160621</version>
      </plugin>
    </plugins>
  </build>
</project>
```

#### 2  web.xml中配置SpringMVC的一些信息：

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
          <servlet-name>springMVC-servlet</servlet-name>
          <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
          <init-param>
               <param-name>contextConfigLocation</param-name>
              <param-value>classpath:springMVC-servlet.xml</param-value>
           </init-param>

         <load-on-startup>1</load-on-startup>
    </servlet>

    <servlet-mapping>
        <servlet-name>springMVC-servlet</servlet-name>
        <url-pattern>/</url-pattern>
    </servlet-mapping>

    <!-- 配置HiddenHttpMethodFilter:把POST 请求转为DELETE/PUT 请求-->
    <filter>
        <filter-name>HiddenHttpMethodFilter</filter-name>
        <filter-class>org.springframework.web.filter.HiddenHttpMethodFilter</filter-class>
    </filter>
    <filter-mapping>
        <filter-name>HiddenHttpMethodFilter</filter-name>
        <url-pattern>/*</url-pattern>
    </filter-mapping>

    <context-param>
      <param-name>contextConfigLocation</param-name>
      <param-value>classpath:applicationContext.xml</param-value>
    </context-param>

      <listener>
        <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
      </listener>

</web-app>
```

#### 3 配置SpringMVC 的配置文件，这里关于国际化的配置有

1）配置国际化资源文件

2）配置SessionLocaleResolver

3) 配置LocaleInterceptor

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
    <context:component-scan base-package="com.springmvc.crud" />

    <!-- 对模型视图名称的解析，在请求时模型视图名称添加前后缀 -->
    <bean id="viewResolverCommon" class="org.springframework.web.servlet.view.InternalResourceViewResolver">
        <property name="prefix" value="/WEB-INF/views/"/>
        <property name="suffix" value=".jsp"/>
        <property name="viewClass"  value="org.springframework.web.servlet.view.JstlView" />
    </bean>

    <!--配置国际化资源文件-->
    <bean id="messageSource" class="org.springframework.context.support.ResourceBundleMessageSource">
        <property name="basename" value="i18n"></property>
    </bean>

    <!--配置SessionLocaleResolver-->
    <bean id="localeResolver" class="org.springframework.web.servlet.i18n.SessionLocaleResolver">
    </bean>

    <!--配置LocaleInterceptor-->
    <mvc:interceptors>
        <bean class="org.springframework.web.servlet.i18n.LocaleChangeInterceptor"></bean>
    </mvc:interceptors>

    <!-- 处理静态资源 -->
    <mvc:default-servlet-handler/>
    <mvc:annotation-driven></mvc:annotation-driven>
    <!--  conversion-service="conversionService"加在 mvc:annotation-driven后，在格式化时应去除 -->

</beans>
```

注意！

![](https://img-blog.csdn.net/20170103104431686?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

#### 4  配置国际化文件：

i18n\_en\_US.properties

```
i18n.username=Username_en
i18n.password=Password_en
```

i18n\_zh\_CN.properties

```
i18n.username=姓名
i18n.password=密码
```

### 二、显示页面i18n.jsp

```
<%--
  Created by IntelliJ IDEA.
  User: WGS
  Date: 2017/1/1
  Time: 23:21
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<html>
<head>
    <title>I18N  PAGE</title>
</head>
<body>

    <h2>I18N  PAGE</h2>
    <br>
    <a href="i18n?locale=zh_CN">中文</a>
    <a href="i18n?locale=en_US">英文</a>
    <br><br>
    show:
    <br>
    <fmt:message key="i18n.username"></fmt:message>
    <br>
    <fmt:message key="i18n.password"></fmt:message>
    <br>

</body>
</html>
```

三、成功显示，如下图片所示：

![]()

![]()

![]()

![](https://img-blog.csdn.net/20170102220808744?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

--------------------------------------------Updated on 2017-1-11---------------------------------------------------

上面是通过点击两个链接来切换页面的中英文设置，这次将这两个链接的切换功能集成到一个按钮中，通过点击按钮自动实现页面的中英文切换。

##### 什么是URI?

实现这个小功能可用URI.js这个javascript库用于处理URLs地址。它提供了类似于jQuery风格的API（便利的接口和方法链）。

关于URI.js，可参看文档：【http://medialize.github.io/URI.js/docs.html#search-set】

##### 如何实现？

首先要引入这个包：

```
 <script src="//cdn.bootcss.com/URI.js/1.18.3/URI.min.js"></script>
```

  
然后通过与jQuery结合即可实现：

```
<%--
  Created by IntelliJ IDEA.
  User: WGS
  Date: 2017/1/1
  Time: 23:21
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@taglib prefix="spring" uri="http://www.springframework.org/tags" %>

<html>
<head>

    <!-- 新 Bootstrap 核心 CSS 文件 -->
    <link rel="stylesheet" href="//cdn.bootcss.com/bootstrap/3.3.5/css/bootstrap.min.css">

    <script type="text/javascript" src="scripts/jquery-1.7.2.js"></script>
    <script src="//cdn.bootcss.com/URI.js/1.18.3/URI.min.js"></script>
</head>
<script>
    $(document).ready(function(){
        $(".i18n-choose").click(function () {
            var uri = new URI();
            uri.setSearch("locale",$(this).attr("data-language"));
            location.href = uri.toString();
        });
    });

</script>

<style type="text/css">
    .i18n-choose {
        cursor: pointer;
    }
    .i18n-choose hover{
        text-decoration: underline;
    }
</style>

<body>

    <h2>I18N  PAGE</h2>
    <br>
    <a>
        <span class="i18n-choose" data-language="zh_CN">中文</span>     |  
        <span class="i18n-choose" data-language="en_US">English</span>
    </a>
    <br><br>
    show:
    <br>
    <table class="table table-striped" border="1" cellspacing="0" cellpadding="10">
        <tr >
            <td><fmt:message key="i18n.username"></fmt:message></td>
        </tr>
        <tr>
            <td><fmt:message key="i18n.password"></fmt:message></td>
        </tr>
    </table>

</body>
</html>
```

上述代码引入了bootstrap和CSS样式，使显示页面美观点。

##### 显示页面如下：

![](https://img-blog.csdn.net/20170111171718503?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

```
然后通过与jQuery结合即可实现：
```