---
title: "Redis应用1---Spring Session + Redis 实现Session的分布式存储"
date: 2017-05-04
category: 后端开发
tags: [redis, session, spring, 缓存]
---

### Spring Session + Redis 实现Session的分布式存储

本章所述内容详情参考大神Blog:   
 <http://blog.csdn.net/xiao__gui/article/details/52706243> ，   
 该博客详细记录操作过程，且博客有很多实用知识。   
 本篇文章不做详述也只是记录个人操作过程，以备后续所用。

---

### 为什么需要Spring Session?

在单台Tomcat应用中，通常使用session保存用户的会话数据。

在负载均衡的集群环境下，负载均衡可能将请求分发到不同的服务器上去，在这种情况，需要将有状态的session统一管理起来。

实现Session共享的方案很多，其中一种常用的就是使用Tomcat、Jetty等服务器提供的Session共享功能，将Session的内容统一存储在一个数据库（如MySQL）或缓存（如Redis）中.

本文主要介绍另一种实现Session共享的方案，不依赖于Servlet容器，而是Web应用代码层面的实现，直接在已有项目基础上加入spring Session框架,利用Redis集群做主从复制，利用redis数据库的最终一致性，将session信息存入redis中。

当应用服务器发现session不在本机内存的时候，就去redis数据库中查找，因为redis数据库是独立于应用服务器的数据库，所以可以做到session的共享和高可用。来实现Session统一存储在Redis中。   
 结构：   
 ![这里写图片描述](https://img-blog.csdn.net/20170504141806057?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 图片来源：(<http://blog.csdn.net/a60782885/article/details/70244305>)

---

### 配置详解

#### 1. 启动Redis服务

首先安装好Redis，并启动。有关这方面内容参考上篇博文：<http://blog.csdn.net/noaman_wgs/article/details/59501400>

#### 2. Maven配置

在MAVEN中加入所需要的依赖的包：

```
<!-- Jedis -->
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>2.9.0</version>
</dependency>
<!-- Spring Data Redis -->
<dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-redis</artifactId>
    <version>1.7.3.RELEASE</version>
</dependency>
<!-- Spring Session -->
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session</artifactId>
    <version>1.2.2.RELEASE</version>
</dependency>
<!-- Apache Commons Pool -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-pool2</artifactId>
    <version>2.4.2</version>
</dependency>
```

#### 3. 配置Filter: 过滤器使HttpSession不再发挥作用，而是通过过滤器使用redis直接操作Session。

在web.xml中加上如下代码，一般放在最首：

```
<filter>
    <filter-name>springSessionRepositoryFilter</filter-name>
    <filter-class>org.springframework.web.filter.DelegatingFilterProxy</filter-class>
</filter>
<filter-mapping>
    <filter-name>springSessionRepositoryFilter</filter-name>
    <url-pattern>/*</url-pattern>
        <dispatcher>REQUEST</dispatcher>
        <dispatcher>ERROR</dispatcher>
</filter-mapping>
```

#### 4. Redis配置文件：

redis.properties：   
 配置的端口号为本机：

```
#redis config
redis.pool.maxTotal=105
redis.pool.maxIdle=10
redis.pool.maxWaitMillis=5000
redis.pool.testOnBorrow=true

#redis 单节点配置
redis.ip=127.0.0.1
redis.port=6379
```

spring-redis.xml

```
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd">

    <!-- 引入redis配置 -->
    <context:property-placeholder location="classpath:redis.properties" ignore-unresolvable="true"/>

    <!-- Redis 配置 -->
    <bean id="jedisPoolConfig" class="redis.clients.jedis.JedisPoolConfig">
        <property name="maxTotal" value="${redis.pool.maxTotal}" />
        <property name="maxIdle" value="${redis.pool.maxIdle}" />
        <property name="maxWaitMillis" value="${redis.pool.maxWaitMillis}" />
        <property name="testOnBorrow" value="${redis.pool.testOnBorrow}" />
    </bean>

    <bean class="org.springframework.session.data.redis.config.annotation.web.http.RedisHttpSessionConfiguration"/>

    <!-- redis单节点数据库连接配置 -->
    <bean class="org.springframework.data.redis.connection.jedis.JedisConnectionFactory">
        <property name="hostName" value="${redis.ip}" />
        <property name="port" value="${redis.port}" />
        <property name="poolConfig" ref="jedisPoolConfig" />
    </bean>

</beans>
```

#### 5 Spring引入上述Redis配置文件：

applicationContext.xml:   
 `<!--导入需要的文件资源-->   
 <import resource="spring-redis.xml" />`

完成上述步骤即可大功告成。

### 测试

下面写个简单Demo测试下Spring Session的应用：

##### 1. 模拟一个具有Shiro功能的登陆控制模块：

LoginController:

```
package com.wgs.redissession.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.UUID;

/**
 * Created by wanggenshen_sx on 2017/5/3.
 */
@Controller
public class LoginController {

    private static final Logger logger = LoggerFactory.getLogger(LoginController.class);


    @RequestMapping(path = {"/main"}, method = {RequestMethod.GET})
    public String loginShiro(HttpServletRequest request){

        HttpSession session = request.getSession();
        //从服务器获取seesion username
        String username = (String) session.getAttribute("username");
        //若sessionId 存在，即用户登陆过，就直接登录主页
        if (username != null){
            return "main";
        }else {
            //否则，跳到登录页重新登录
            return "login";
        }

    }

    @RequestMapping(value = {"/dologin"}, method = {RequestMethod.POST})
    public String dologinP(HttpServletRequest request){

        HttpSession session = request.getSession();
        String username = request.getParameter("userInput");
        //将登陆的username存储到session中
        session.setAttribute("username", username);
        return "redirect:/main";

    }
    @RequestMapping(path = {"/login"}, method = {RequestMethod.GET})
    public String login(){

        return "login";
    }
}
```

即若登陆者姓名信息存在session中就直接可以通过”/main”登陆，否则返回登陆页面。

##### 2.JSP

login.jsp

```
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- 上述3个meta标签*必须*放在最前面，任何其他内容都*必须*跟随其后！ -->
    <meta name="description" content="">
    <meta name="author" content="">
    <link rel="icon" href="../../favicon.ico">
    <title>登录</title>

    <script src="http://how2j.cn/study/js/jquery/2.0.0/jquery.min.js"></script>
    <link href="http://how2j.cn/study/css/bootstrap/3.3.6/bootstrap.min.css" rel="stylesheet">
    <script src="http://how2j.cn/study/js/bootstrap/3.3.6/bootstrap.min.js"></script>


</head>
<body>

    <div class="container">
        <div class="row">
            <form method="POST" id="loginForm" action="/dologin" ROLE="form">
                <div class="form-group">
                    <label for="userInput">User:</label>
                    <input type="text" class="form-control" id="userInput" name="userInput" placeholder="请输入姓名">
                </div>

                <div class="form-group">
                    <div class="text-center col-sm-9">
                        <button type="submit" class="btn btn-success" id="login-btn">登录</button>
                    </div>
                </div>

            </form>
        </div>
    </div>

</body>
</html>
```

main.jsp:

```
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Title</title>
</head>
<body>

    <h2>欢迎回来: ${sessionScope.username} !</h2>
</body>
</html>
```

#### 3 测试

启动项目前，打开Redis的可视化窗口，执行以下指令   
 `flushDB`(清楚数据库，方便后续查看对比)；   
 `keys *`: 可以看到此时Redis数据库为空：   
 ![这里写图片描述](https://img-blog.csdn.net/20170504142654336?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

启动项目，输入”localhost:8080/login”, 成功登陆后，再次打开Redis窗口，`keys *` 查看：   
 ![这里写图片描述](https://img-blog.csdn.net/20170504143045357?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 可以看到session信息已近被存储到数据库中。

> 第一条数据   
>  key=`spring:session:sessions:expires:144a9e76-e14a-46b9-b020-0678b6c1e98e`
>
> 第二条数据   
>  key=`spring:session:expirations:149387856000`   
>  对应的value值记录了所有session数据应该被删除的时间（即最新的一个session数据过期的时间）。   
>  输入   
>  `type spring:session:expirations:149387856000`   
>  可以看到输出结果为set，即表示这个数据在Redis中是以Set结构保存的。
>
> 第三条数据   
>  key=`spring:session:sessions:144a9e76-e14a-46b9-b020-0678b6c1e98e`   
>  输出 hash，可以看到：Http Session数据在Redis是以Hash结构存储的。

![这里写图片描述](https://img-blog.csdn.net/20170504143109373?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

查看session中保存的username，输入   
 `hget spring:session:sessions:144a9e76-e14a-46b9-b020-0678b6c1e98e sessionAttr:username`   
 ![这里写图片描述](https://img-blog.csdn.net/20170504143126467?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 可以看到session中已经保存了上述登录信息的username。

重新启动一个端口，直接输入”localhost:8090/main”,可以看到能够直接登录：   
 原因是因为刚刚在session中缓存的”username”依然存在，这样就验证了Redis+ Spring Session 可以实现实现Session的分布式存储。

---

原理：

<http://blog.csdn.net/xlgen157387/article/details/60321984>

---

参考: <http://blog.csdn.net/xiao__gui/article/details/52706243>   
 参考：<http://blog.csdn.net/a60782885/article/details/70244305>