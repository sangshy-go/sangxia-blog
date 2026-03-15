---
title: "Spring AOP-1 Spring AOP入门"
date: 2017-07-08
category: 后端开发
tags: [spring, aop]
---

### 什么是AOP

AOP（Aspect-OrientedProgramming，面向方面编程）。   
 在我们的代码中，像日志，事务，安全等模块会散步在很多的业务代码中，这些模块称为“横切关注点”。   
 横切关注点的一个特点是，他们经常发生在核心关注点的多处，而各处都基本相似。比如权限认证、日志、事务处理。   
 这些横切关注点与业务代码的核心功能无关，但是却大量存在，导致了大量代码的重复。   
 AOP的作用在于分离系统中的各种关注点，将核心关注点和横切关注点分离开来。

### AOP相关概念

- 切面（Aspect）：通知与切点的结合。用Spring的Advisor实现。
- 连接点（Joinpoint）: 程序执行过程中明确的点，如方法的调用或特定的异常被抛出。
- 通知（Advice）: 即在调用方法时需要执行的动作，Spring定义了5种通知：前置通知，后置通知，返回通知，异常通知和环绕通知。
- 切入点（Pointcut）: 指定一个通知将被引发的一系列连接点的集合。

### 如何使用Spring AOP

Spring提供了4种方式实现AOP：   
 1. 配置ProxyFactoryBean，显式地设置advisors, advice, target等   
 2. 配置AutoProxyCreator，这种方式下，还是如以前一样使用定义的bean，但是从容器中获得的其实已经是代理对象   
 3. 通过来配置   
 4. 通过来配置，使用AspectJ的注解来标识通知及切入点

AOP现有两个主要的流行框架，即Spring AOP和Spring+AspectJ   
 ![这里写图片描述](https://img-blog.csdn.net/20170708113023195?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

下面来看具体的代码实现。

#### 方式一 在XML中声明切面

**1. 首先定义一个切面类：**

```
package com.wgs.aspect;

/**
 * Created by GenshenWang.nomico on 2017/7/8.
 */
public class TrsactionAspect {

    public void beforeMethod(){
        System.out.println("before：事务开始了===========");
    }
    public void afterMethod(){
        System.out.println("after：事务结束了===========");
    }
}
```

**2. 需要在springmvc的配置文件中去显示的声明这个切面：**

```
<bean id="transactionAspect" class="com.wgs.aspect.TrsactionAspect"/>
    <aop:config>
        <aop:pointcut id="pointcut" expression="execution(* com.wgs.controller.IndexController2.*(..))"/>
        <aop:aspect ref="transactionAspect" order="1">
            <aop:before method="beforeMethod" pointcut-ref="pointcut"/>
            <aop:after method="afterMethod" pointcut-ref="pointcut"/>
        </aop:aspect>
    </aop:config>
```

注：必须在springmvc的配置文件中去声明，否则会报异常。   
 原因在于：

> 若将其配置在了spring.xml 核心配置文件中，该配置文件会被ContextLoaderListenerclass加载，Spring会创建一个WebApplicationContext上下文，称为父上下文（父容器） ，保存在 ServletContext中，keyWebApplicationContext.ROOT\_WEB\_APPLICATION\_CONTEXT\_ATTRIBUTE的值。
>
> 而spring-mvc.xml是DispatcherServlet,可以同时配置多个，每个 DispatcherServlet有一个自己的上下文对象（WebApplicationContext），称为子上下文（子容器），子上下文可以访问父上下文中的内容，但父上下文不能访问子上下文中的内容。 它也保存在 ServletContext中，key是”org.springframework.web.servlet.FrameworkServlet.CONTEXT”+Servlet名称
>
> 当spring加载父容器的时候就会去找切入点，但是这个时候切入的controller是在子容器中的，父容器是无法访问子容器，所以就拦截不到。   
>  如果将上述的配置文件放到spring-mvc.xml中，那么问题就解决了。

**3. 测试：**

```
@Controller
public class IndexController {

    @ResponseBody
    @RequestMapping(value="/index", method = {RequestMethod.GET})
    public void index(){
        System.out.println("我要工作啦。。。");
    }
}
```

输出：

> before：事务开始了===========   
>  我要工作啦。。。   
>  after：事务结束了===========

#### 方式二 使用AspectJ注解的方式

**1. 通过注解声明一个切面类：**

```
package com.wgs.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

/**
 * Created by GenshenWang.nomico on 2017/7/8.
 */
@Aspect
@Component
public class LogAspect {

    //定义切点
    @Pointcut("execution(* com.wgs.controller.IndexController.*(..))\"")
    private void pointCut(){}

    //前置通知
    @Before("pointCut()")
    public void beforeMethod(){
        System.out.println("before：日志开始记录了===========");
    }

    //后置通知
    @After("pointCut()")
    public void afterMethod(){
        System.out.println("after：日志记录结束了===========");
    }

    //声明返回通知
    @AfterReturning(pointcut = "pointCut()", returning = "result")
    public void doAfterReturning(String result) {
        System.out.println("后置通知");
        System.out.println("---" + result + "---");
    }

    // 声明异常通知
    @AfterThrowing(pointcut = "pointCut()", throwing = "e")
    public void doAfterThrowing(Exception e) {
        System.out.println("异常通知");
        System.out.println(e.getMessage());
    }

    //声明环绕通知
    @Around("pointCut()")
    public Object doAround(ProceedingJoinPoint pjp) throws Throwable {
        System.out.println("进入方法---环绕通知");
        Object o = pjp.proceed();
        System.out.println("退出方法---环绕通知");
        return o;
    }
}
```

**2. 要想使用AspectJ**，需要在切面类上加上@EnableAspectJAutoProxy 或者在SpringMVCd的配置文件中加上   
 `<aop:aspectj-autoproxy proxy-target-class="true"/>`   
 来启用AspectJ的自动代理。

**3. 测试**

```
 @ResponseBody
    @RequestMapping(value="/index2", method = {RequestMethod.GET})
    public void index(){
        System.out.println("我要工作啦。。。");
    }
```

输出：

> 进入方法—环绕通知   
>  before：日志开始记录了===========   
>  我要工作啦。。。   
>  退出方法—环绕通知   
>  after：日志记录结束了===========   
>  进入方法—环绕通知   
>  before：日志开始记录了===========   
>  我要工作啦。。。   
>  退出方法—环绕通知   
>  after：日志记录结束了===========

#### 两种方法比较

**1、织入的时期不同**

**Spring Aop采用的动态织入，而Aspectj是静态织入。**   
 静态织入：指在编译时期就织入，即：编译出来的class文件，字节码就已经被织入了。   
 动态织入又分静动两种，静则指织入过程只在第一次调用时执行；动则指根据代码动态运行的中间状态来决定如何操作，每次调用Target的时候都执行。

**2、从使用对象不同**

Spring AOP的通知是基于该对象是SpringBean对象才可以，而AspectJ可以在任何Java对象上应用通知。

Spring AOP：如果你想要在通过this对象调用的方法上应用通知，那么你必须使用currentProxy对象，并调用其上的相应方法;于此相似，如果你想要在某对象的方法上应用通知，那么你必须使用与该对象相应的Spring bean   
 AspectJ：使用AspectJ的一个间接局限是，因为AspectJ通知可以应用于POJO之上，它有可能将通知应用于一个已配置的通知之上。对于一个你没有注意到这方面问题的大范围应用的通知，这有可能导致一个无限循环。

---

参考：<http://blog.csdn.net/a128953ad/article/details/50509437>