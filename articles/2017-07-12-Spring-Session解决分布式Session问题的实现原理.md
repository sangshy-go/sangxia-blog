---
title: "Spring Session解决分布式Session问题的实现原理"
date: 2017-07-12
category: 后端开发
tags: []
---

**转载：http://blog.csdn.net/xlgen157387/article/details/60321984**

上一篇：

[使用Spring Session和Redis解决分布式Session跨域共享问题](http://blog.csdn.net/xlgen157387/article/details/57406162) :   
 <http://blog.csdn.net/xlgen157387/article/details/57406162>

上一篇介绍了如何使用[spring](http://lib.csdn.net/base/javaee "Java EE知识库") Session和[Redis](http://lib.csdn.net/base/redis "Redis知识库")解决分布式Session跨域共享问题，介绍了一个简单的案例，下边就学习一下Spring Session的实现原理。

注：以下步骤是基于XML的方式实现 Spring Session的代码讲解！

### 先从web.xml文件说起

我们知道Tomcat再启动的时候首先会去加载`web.xml` 文件，Tomcat启动的时候`web.xml`被加载的顺序：`context-param -> listener -> filter -> servlet`。

我们在使用Spring Session的时候，我们配置了一个filter，配置代码如下：

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


- 1
- 2
- 3
- 4
- 5
- 6
- 7
- 8
- 9
- 10
- 11


- 1
- 2
- 3
- 4
- 5
- 6
- 7
- 8
- 9
- 10
- 11
```

![这里写图片描述](https://img-blog.csdn.net/20170304103747170?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

介绍一下`DelegatingFilterProxy` 这个类：

`DelegatingFilterProxy` 类将通过`springSessionRepositoryFilter` 这个名称去查找Spring容器中配置的Bean并将其转换为过滤器，对于调用`DelegatingFilterProxy`的每个请求，将调用springSessionRepositoryFilter这个过滤器。

如果未指定`init-param`参数的话，`DelegatingFilterProxy`就会把`filter-name`作为要查找的Bean对象，这也是`DelegatingFilterProxy`类的作用。可以看出每一个请求都会经过该filter，经过该filter的请求也会相应的经过`springSessionRepositoryFilter`这个过滤器，那么我们就接着看一下`springSessionRepositoryFilter`这个过滤器。

### springSessionRepositoryFilter过滤器的创建

上一过程的DelegatingFilterProxy是从Spring容器中去查找springSessionRepositoryFilter的，那么我们是在哪个地方进行注入springSessionRepositoryFilter的哪？答案是在这里：

```
<bean class="org.springframework.session.data.redis.config.annotation.web.http.RedisHttpSessionConfiguration"/>

- 1


- 1
```

![这里写图片描述](https://img-blog.csdn.net/20170304104736497?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

我们在Spring的配置文件中手动注入了RedisHttpSessionConfiguration，这是因为我们默认的使用[redis](http://lib.csdn.net/base/redis "Redis知识库")进行存储Session的。

RedisHttpSessionConfiguration 这个类加了Configuration注解，作为配置文件注入。

RedisHttpSessionConfiguration的作用是创建名为springSessionRepositoryFilter 的Spring Bean，继承自Filter。springSessionRepositoryFilter替换容器默认的HttpSession支持为Spring Session，将Session实例存放在Redis中。

（1）RedisHttpSessionConfiguration 继承关系如下：

```
@Configuration
@EnableScheduling
public class RedisHttpSessionConfiguration extends SpringHttpSessionConfiguration
        implements EmbeddedValueResolverAware, ImportAware {
}

- 1
- 2
- 3
- 4
- 5


- 1
- 2
- 3
- 4
- 5
```

![这里写图片描述](https://img-blog.csdn.net/20170304105204768?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

（2）RedisHttpSessionConfiguration主要方法和属性如下：

![这里写图片描述](https://img-blog.csdn.net/20170304105410615?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

（3）RedisHttpSessionConfiguration通过@Bean的方式将`RedisMessageListenerContainer、RedisTemplate、RedisOperationsSessionRepository` 等注入到Spring容器中。

（4）RedisHttpSessionConfiguration继承了SpringHttpSessionConfiguration这个类，这个类很重要，SpringHttpSessionConfiguration通过@Bean的方式将springSessionRepositoryFilter注入到容器中：

![这里写图片描述](https://img-blog.csdn.net/20170304110001930?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

springSessionRepositoryFilter这个过滤器就是前边DelegatingFilterProxy查找的过滤器！

（6）可以看出他是SessionRepositoryFilter类型的，SessionRepositoryFilter的作用就是替换容器默认的javax.servlet.http.HttpSession支持为org.springframework.session.Session。

SessionRepositoryFilter的主要方法和属性如下：

![这里写图片描述](https://img-blog.csdn.net/20170304111553546?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

（7）其中SessionRepositoryResponseWrapper、SessionRepositoryRequestWrapper、HttpSessionWrapper为内部类，这个也是很关键的。例如SessionRepositoryRequestWrapper类：

![这里写图片描述](https://img-blog.csdn.net/20170304111919797?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

可以看出SessionRepositoryRequestWrapper继承了javax.servlet.http.HttpServletRequestWrapper这个类，我们知道HttpServletRequest接口的默认实现是有HttpServletRequestWrapper的，如下：

![这里写图片描述](https://img-blog.csdn.net/20170304112309564?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

（8）因为SessionRepositoryRequestWrapper继承了HttpServletRequestWrapper，而HttpServletRequestWrapper实现了HttpServletRequest接口，在SessionRepositoryRequestWrapper又重写了HttpServletRequest接口中的一些方法，所以才会有：getSession、changeSessionId等这些方法。

到此，我们应该大致明白了，原有的request请求和response都被重新进行了包装。我们也就明白了原有的HttpSeesion是如何被Spring Session替换掉的。

需要注意的是：

```
The SessionRepositoryFilter must be placed before any Filter that access the HttpSession or that might commit the response to ensure the session is overridden and persisted properly.

- 1


- 1
```

### 案例分析

（1）Controller代码如下：

![这里写图片描述](https://img-blog.csdn.net/20170304113027615?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

（2）查看效果：

![这里写图片描述](https://img-blog.csdn.net/20170304113114541?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

我们通过快捷键查看`request.getSession()` 的具体实现，就可以看出已经有了`SessionRepositoryRequestWrapper` 重写的方法。

上述有两个默认的实现，一个是原始的，一个是Spring Session实现的，具体选用哪一种作为实现，这就是我们上边说的`DelegatingFilterProxy` 代理的作用了，他会将每一个请求过滤，经过DelegatingFilterProxy的每一个请求也会经过springSessionRepositoryFilter过滤器，springSessionRepositoryFilter过滤器就实现了将原有request到SessionRepositoryRequestWrapper的转换，这就是实现了具体的流程！

（3）request.getSession().setAttribute(name, value)的实现：

追踪代码，可以到达下边内容

![这里写图片描述](https://img-blog.csdn.net/20170304113910912?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

this.session.setAttribute(name, value) 中session是Session接口的定义，具体实现有：

![这里写图片描述](https://img-blog.csdn.net/20170304114112617?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQveGxnZW4xNTczODc=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

可以看到有Redis相关的操作！

至此，我们应该清楚了，Spring Session的工作原理了！虽然下边的过程没有再去介绍，但是已经很清楚的理解了。

### 总结

上述讲述了整个Spring Session的执行流程，关于其他细节并没有过多的学习，后期学习会不断补充文章！