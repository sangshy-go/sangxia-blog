---
title: "Spring原理与源码分析系列（一）- Spring IoC入门"
date: 2018-01-22
category: 后端开发
tags: [Spring, IOC]
---

### 一、Spring简介

**什么是Spring**

- 轻量：Spring是轻量级的，基本的版本大小为2MB
- 控制反转：Spring通过控制反转实现了松散耦合，对象们给出它们的依赖，而不是创建或查找依赖的对象们。
- 面向切面的编程AOP：Spring支持面向切面的编程，并且把应用业务逻辑和系统服务分开。
- 容器：Spring包含并管理应用中对象的生命周期和配置
- MVC框架： Spring-MVC
- 事务管理：Spring提供一个持续的事务管理接口，可以扩展到上至本地事务下至全局事务JTA
- 异常处理：Spring提供方便的API把具体技术相关的异常

**Spring框架概述**   
Spring Framework由约20个模块组成的特征组成。这些模块分为核心容器，数据访问/集成，Web，AOP，Instrumentation，Messaging和Test，如下图所示。   
![这里写图片描述](https://img-blog.csdn.net/20180122222239505?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

- （1）Core Container   
  Spring的核心组件有3个：Core，Context和Bean。其中Bean是Spring的主角。在该模块当中，Spring提供了一个IoC容器的实现，用于我们以依赖注入的方式管理对象之间的依赖关系。
- （2）AOP   
  Spring-AOP：基于代理的AOP支持。
- （3）数据访问   
  Spring-JDBC：提供以JDBC访问数据库的支持；   
  Spring-TX：提供编程式和声明式的事务支持；   
  Spring-ORM：提供对对象/关系映射技术的支持；   
  Spring-OXM：提供对对象/xml映射技术的支持；   
  Spring-JMS：提供对JMS的支持。
- （4）Web   
  Spring-Web：提供基础的Web集成的功能，在Web项目中提供Spring的容器；   
  Spring-Webmvc：提供基于Servlet的Spring MVC;

**Spring应用场景**   
Spring发展到现在已经提供了大量的基于Spring的项目，主要有如下项目：

- Spring Boot ：使用默认开发配置来实现快速开发；
- Spring Cloud：为分布式系统开发提供工具集；
- Spring Data：对主流的关系型和NoSQL数据库的支持；
- Spring Batch：简化及优化大量数据的批处理操作；
- Spring Security：通过认证和授权保护应用；
- Spring AMQP：对基于AMQP的消息的支持；
- Spring Web Flow：基于Spring MVC提供基于向导流程式的Web应用开发。

本系列博客主要总结Spring的IoC、AOP、事务管理、Spring MVC几个方面的使用以及相关的源码分析。

### 二 、Spring-IoC入门

#### 1 什么是IoC（依赖注入）

> IoC（Inversion of Control），通常被称为控制反转，也叫做依赖注入（DI）（当然这种说法是有争议的，在此不去探究）。

Spring官网也给出了IoC容器的解释：   
![这里写图片描述](https://img-blog.csdn.net/20180122222249783?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

何为控制反转？举个简单的例子来说，   
在面向对象的系统中，假如在论坛网站中有个评论的接口CommentService，在这个接口中要获取评论数量，需要通过调用CommentDao 中的getCommentCount()方法来获取。   
我们的正常做法是在CommentService中先new CommentDao()，然后再调用CommentDao 中相关方法。   
代码如下:

```
public class CommentDao {

    public int getCommentCount(){
        return 100;
    }
}

public class CommentService {

    private CommentDao commentDao;

    public int getCount(){
        commentDao = new CommentDao();
        return commentDao.getCommentCount();
    }
    public void setCommentDao(CommentDao commentDao) {
        this.commentDao = commentDao;
    }
}
```

而IoC的思想即是，在你需要依赖对象的时候，IoC容器即可提供一个已经实例化好的对象给你，这样你就不需要自己去新建相应的依赖类。   
下面将写一个伪代码感受下IoC的过程（不是很严谨，感受下过程即可）：

- （1）首先将CommentDao，声明为一个Bean（声明为Bean后，IoC容器即会为其创建一个实例对象）；   
  `<bean id = "commenDao" class="com.wgs.spring.demo1.CommentDao"/>`

  - （2）再通过setter依赖注入的方式将CommentDao注入到CommentService当中

```
<bean id="commentService" class="com.wgs.spring.demo1.CommentService">
        <property name="commentDao">
            <ref bean="commentDao"></ref>
        </property>
    </bean>
```

- （3）当我们在CommentService需要用到CommentDao的时候，直接找IoC容器要到CommentDao的Bean即可。

```
IoContainer container = new ...;
CommentService service = (CommentService)container.getbean("commentService");
int result = service.getCount();
```

所以，从上述例子可以看出：

> **通过使用IoC容器，对象依赖关系的管理被反转了。**   
> **即对象之间的相关依赖关系由IoC容器进行管理，并且由IoC完成对象的注入。**

在面向对象系统中，对象封装了数据和对数据的处理，对象的依赖关系常常体现在对数据和方法的依赖上，   
而IoC模式是将这些依赖关系通过对象的依赖注入交给框架或IoC容器。

#### 2 依赖注入的3种方式

**（1）setter方法注入**   
上述过程即为setter注入的过程。当前对象只要为其依赖对象所对应的属性添加setter方法，就可以通过setter方法将相应额依赖对象设置到当前对象中：

```
public class CommentService {

    private CommentDao commentDao;

    public int getCount(){
        commentDao = new CommentDao();
        return commentDao.getCommentCount();
    }

    public void setCommentDao(CommentDao commentDao) {
        this.commentDao = commentDao;
    }
}
```

**（2）构造方法注入**   
即被注入对象可以通过在其构造方法中声明依赖对象的参数列表，让IoC容器知道其需要依赖那些对象。   
IoC容器会检查被注入对象的构造方法，取得其需要的依赖对象的参数列表，进而为其注入对应的对象。对象构造完成后就能使用。

```
public class CommentService {

    private CommentDao commentDao;

    public int getCount(){
        commentDao = new CommentDao();
        return commentDao.getCommentCount();
    }

    public CommentService(CommentDao commentDao){
        this.commentDao = commentDao;
    }
}
```

**（3）接口注入**   
不太常用，在此不介绍。

**构造方法注入与setter方法注入对比：**   
（1）构造方法注入优点是对象在构造完成后即进入就绪状态，可马上使用；缺点是当依赖对象较多的时候，构造方法的参数列表会比较长；   
（2）setter方法注入允许设置默认值，可以被继承；   
缺点是对象无法在构造完成后就马上进入就绪状态。