---
title: "Spring原理与源码分析系列（七）- Spring AOP实现过程与实战"
date: 2018-03-20
category: 后端开发
tags: [Spring AOP]
---

### 二、Spring AOP

#### 1、什么是Spring AOP

Spring AOP是Spring核心框架的重要组成部分，采用Java作为AOP的实现语言。与AspectJ实现AOP方式不同之处在于，Spring AOP仅支持方法级别的拦截。

#### 2、Spring AOP的组成

Spring AOP中主要包括：Joinpoint、Pointcut、Advice、Aspect，下面一一介绍。

**（1）Joinpoint**

> 当我们将横切逻辑织入到OOP模块当中，需要知道在哪些执行点进行织入操作。这些执行点就被称为Joinpoint。

（通俗点理解：Joinpoint是一个点，规定了在哪个位置插入横切逻辑）

Spring AOP只支持方法级别的Joinpoint织入，所以如果超出这个范围，就需要通过AspectJ等进行操作。

**（2）Pointcut**

> Pointcut通常使用正则表达式来描述多组符合条件的某个方法。

我们来看下Spring AOP中提供的Pointcut接口的定义：

```
public interface Pointcut {
    Pointcut TRUE = TruePointcut.INSTANCE;
    ClassFilter getClassFilter();
    MethodMatcher getMethodMatcher();
}
```

可以看到，Pointcut 通过ClassFilter 和MethodMatcher 两个过滤来匹配要织入的方法。首先ClassFilter来匹配需要操作的类，然后使用MethodMatcher 匹配类中具体的方法。只有两种类型均匹配后才会执行织入操作。   
当然，`Pointcut TRUE = TruePointcut.INSTANCE;`表示与class类型无关。

1）ClassFilter   
ClassFilter接口作用是对Joinpoint所处对象进行Class级别的类型匹配。   
下面进入看下ClassFilter的定义：

```
public interface ClassFilter {
    ClassFilter TRUE = TrueClassFilter.INSTANCE;
    boolean matches(Class<?> var1);
}
```

可以看到ClassFilter通过matches(Class

```
public interface MethodMatcher {
    MethodMatcher TRUE = TrueMethodMatcher.INSTANCE;
    boolean matches(Method var1, Class<?> var2);
    boolean isRuntime();
    boolean matches(Method var1, Class<?> var2, Object[] var3);
}
```

MethodMatcher中定义了两个重载的matches()方法，一个不带参数，一个带参数Object[] var3，中间用isRuntime()隔离。   
如果不需要检查参数，就调用第一个matches()方法，此时isRuntime()返回false，第二个matches()方法就不会去执行，此时的MethodMatcher被称之为StaticMethodMatcher；   
如果需要对方法中的参数进行匹配，就需要调用第二个matches()方法，此时isRuntime()返回true。此时的MethodMatcher被称之为DynamicMethodMatcher。

因此，在MethodMatcher基础上，Pointcut又分为两类：

- StaticMethodMatcher
- DynamicMethodMatcher

两者关系图如下：   
![这里写图片描述](//img-blog.csdn.net/20180320234705778?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

Pointcut常见的实现类有如下几种：

- NameMatchMethodPointcut
- JdkRegexpMethodPointcut
- Perl5RegexpMethodPointcut
- AnnotationMatchingPointcut
- ComposablePointcut
- ControlFlowPointcut

1）NameMatchMethodPointcut   
最简单的Pointcut实现，是StaticMethodMatcher的子类，可以指定Joinpoint处的方法名称进行匹配。   
如：

```
new NameMatchMethodPointcut().setMappedName("login");
```

2）JdkRegexpMethodPointcut、Perl5RegexpMethodPointcut   
StaticMethodMatcher下可以使用正则表达式对拦截方法进行匹配，   
如：

```
new JdkRegexpMethodPointcut().setPattern(".*doSth().*");
```

3）AnnotationMatchingPointcut   
AnnotationMatchingPointcut根据目标对象中是的存在指定类型的注解来匹配Joinpoint。   
如：

```
new AnnotationMatchingPointcut(ClassLevelAnnotation.class, MethodLevelAnnotation.class);
```

以上代码会对使用类注解ClassLevelAnnotation、方法注解MethodLevelAnnotation所匹配到的方法进行拦截。

4）ComposablePointcut   
ComposablePointcut可以进行Pointcut逻辑运算的Pointcut实现。不常用，不赘述。

5）ControlFlowPointcut   
假设要织入的Joinpoint处所在的方法为login(),   
ControlFlowPointcut可以指定具体的目标对象调用login()才进行拦截，别的目标对象调用login()方法时不会进行拦截。   
不常用，不赘述。

**（3）Advice**

> Advice是单一横切关注点逻辑的载体，实现类将被织入到Pointcut规定的Joinpoint位置的横切逻辑。

（通俗点理解就是：Advice就是我们实现的如日志、安全、事务等逻辑操作，这些Advice需要被织入到业务代码中。）

Spring AOP中提供了如下Advice：   
![这里写图片描述](//img-blog.csdn.net/20180320234718694?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)   
主要分为两大类：

- per-class类型的Advice：该类型的Advice可以在目标对象类的所有实例之间共享，只是提供方法拦截的功能，不会为目标对象类添加新的特性；   
  主要有：BeforeAdvice，ThrowsAdvice，AfterReturningAdvice，AroundAdvice;
- per-instance类型的Advice：不可以在目标对象类的所有实例之间共享，可以为不同的实例对象保存各自的状态以及相关逻辑，在不改变目标类定义的情况下，为目标类添加新的属性以及行为;   
  Introduction是唯一一种per-instance类型的Advice。

1）Before Advice

> BeforeAdvice所实现的横切逻辑将在相应的Joinpoint之前执行，BeforeAdvice执行完之后将会从Joinpoint继续执行。

2）ThrowsAdvice

> ThrowsAdvice对应AOP中的AfterThrowingAdvice，通常用于对系统中特定的异常情况进行监控，以统一的方式对所发生的异常进行处理。

3）AfterReturningAdvice

> 在Joinpoint处所在的方法正常执行完成之后执行AfterReturningAdvice。

4）Around Advice

> Spring中没有直接定义Around Advice的实现接口，而是用MethodInterceptor来控制对相应Joinpoint的拦截行为。

5）Introduction

> Introduction可以在不改变目标类定义的情况下，为目标类添加新的属性以及行为。

**（4）Aspect**

> Aspect是对系统的横切关注点逻辑进行模块化封装的AOP实体。Aspect于AOP对应Class与OOP。   
> 一个Aspect包含多个Pointcut以及相关Advice。

Spring中提供了Advisor代表Aspect，Advisor一般只有一个Pointcut和Advice，可以看作是特殊的Aspect。   
Spring中提供的Advisor关系图如下：   
![这里写图片描述](//img-blog.csdn.net/20180320234732803?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)   
主要分为两大类：

- PointcutAdvisor：主要有DefaultPointcutAdvisor，NameMatchMethodPointcutAdvisor，RegexpMethodPointcutAdvisor；
- IntroductionAdvisor：DefaultIntroductionAdvisor。

> IntroductionAdvisor与PointcutAdvisor区别：IntroductionAdvisor只能用于类级别的拦截和Introduction类型的Advice；而PointcutAdvisor可以使用任意类型的Pointcut和除Introduction类型以外的Advice。

1）PointcutAdvisor的具体实现如下：   
![这里写图片描述](//img-blog.csdn.net/20180320234745918?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

**DefaultPointcutAdvisor：**最通用的PointcutAdvisor，可以使用任何类型的Pointcut和Advice（除Introduction类型的Advice）。   
如：

```
DefaultPointcutAdvisor advisor = new DefaultPointcutAdvisor();
advisor.setPointcut(pointcut);//任何Pointcut类型
advisor.setAdvice();//除Introduction类型的Advice
```

**NameMatchMethodPointcutAdvisor：**限定了Pointcut的使用类型，即只能使用NameMatchMethodPointcut类型的Pointcut，其他除Introduction类型外的任何Advice都可以使用。   
如：

```
NameMatchMethodPointcutAdvisor advisor = new NameMatchMethodPointcutAdvisor(advice);
advisor.setMappedName("login");
```

**RegexpMethodPointcutAdvisor：**限定了Pointcut的使用类型，即只能使用RegexpMethodPointcut类型的Pointcut，其他除Introduction类型外的任何Advice都可以使用。   
如：

2）IntroductionAdvisor的具体实现如下：   
![这里写图片描述](//img-blog.csdn.net/20180320234802920?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

IntroductionAdvisor只有一个默认实现类：DefaultIntroductionAdvisor（另外一个通过AspectJ拓展），只能指定Introduction类型的Advice。

3）Ordered接口   
可以看到，PointcutAdvisor、IntroductionAdvisor的实现类都实现了Ordered接口。   
当多个Advisor接口中的Pointcut匹配了同一个Joinpoint时，就会在这同一个Joinpoint处执行Advice横切逻辑的织入。   
但是哪个Advisor中的Advice先执行呢？   
Ordered接口就负责规定同一Joinpoint处Advice执行的先后顺序。

Spring在处理同一Joinpoint处的多个Advisor的时候，会按照Ordered接口规定的顺序号来执行，顺序号越小，优先级越高。   
如：   
假设有两个Advisor，一个进行权限检查的PermissionAuthAdvisor;一个进行异常检测的ExceptionAdvisor。

```
<bean id="permissionAuthAdvisor" class="....PermissionAuthAdvisor">
    <property name="order" value="1"
</bean>
<bean id="exceptionAdvisor" class="....ExceptionAdvisor">
    <property name="order" value="0"
</bean>
```

可以看到通过为order属性赋值，可以规定ExceptionAdvisor首先执行。

#### 3、Spring AOP的实现原理

同上节AOP中介绍的AOP实现原理一样，Spring AOP在实现AOP的过程中使用了代理模式，并提供了以下两种机制分别对实现了接口的目标类和没有实现任何接口的目标类进行代理：

- JDK动态代理；
- CGLIB

Spring AOP框架内使用AopProxy对不同的代理机制进行了抽象并提供了相应的子类实现，相关结构图如下：   
![这里写图片描述](//img-blog.csdn.net/20180320234817434?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)   
AopProxy有CglibAopProxy和JdkDynamicAopProxy两种实现。   
Spring AOP会通过策略模式—即根据目标对象是类还是接口来使用CglibAopProxy或JdkDynamicAopProxy完成对目标类进行代理。   
不同的AopProxy实现的实例化过程采用工厂模式—即通过AopProxyFactory进行封装（在下一小节织入过程详细介绍AopProxyFactory是如何进行封装的过程）。

Spring AOP采用ProxyFactory来完成织入操作（下小节会详细介绍），下面来看下在Spring AOP中两种机制的代码实现。   
**（1）基于接口的代理—JDK动态代理**   
代码实现：

```
//公共接口
public interface ILogin {
    void login();
}
//真正实现类
public class RealLogin implements ILogin {
    @Override
    public void login() {
        System.out.println("登录。。。");
    }
}
//Around Advice：横切逻辑
public class LoginInterceptor implements MethodInterceptor {
    @Override
    public Object invoke(MethodInvocation methodInvocation) throws Throwable {
        try{
            System.out.println("拦截下，再执行");
            return methodInvocation.proceed();
        }finally {
            System.out.println("拦截结束");
        }
    }
}
//添加拦截器，完成织入操作，测试
public static void main(String[] args) {
        RealLogin login = new RealLogin();
        //ProxyFactory会自动检测MockTask实现的接口
        ProxyFactory weaver = new ProxyFactory(login);
        //设置Advisor(Aspect，包括设置Pointcut和Advice)
        NameMatchMethodPointcutAdvisor advisor = new NameMatchMethodPointcutAdvisor();
        advisor.setMappedNames("login");//设置拦截的方法
        advisor.setAdvice(new LoginInterceptor());//设置Advice

        //添加拦截器，完成织入操作
        weaver.addAdvisor(advisor);
        ILogin loginProxy = (ILogin) weaver.getProxy();//获取代理对象
        loginProxy.login();

    }
```

最后输出：

> 拦截下，再执行   
> 登录。。。   
> 拦截结束   
> class com.sun.proxy.$Proxy0

可以看出获取的代理对象是Proxy类型。

**（2）基于类的代理—CGLIB**   
代码实现：

```
//没有实现任何接口的目标类
public class LoginWithoutInterface {
    public void login(){
        System.out.println("没有接口的登录--基于类的代理");
    }
}
//Around Advice(同上)
public class LoginInterceptor implements MethodInterceptor {
    @Override
    public Object invoke(MethodInvocation methodInvocation) throws Throwable {
        try{
            System.out.println("拦截下，再执行");
            return methodInvocation.proceed();
        }finally {
            System.out.println("拦截结束");
        }
    }
}
//织入操作
public static void main(String[] args) {
   LoginWithoutInterface login = new LoginWithoutInterface();
   ProxyFactory weaver = new ProxyFactory(login);
   NameMatchMethodPointcutAdvisor advisor = new NameMatchMethodPointcutAdvisor();
   advisor.setMappedNames("login");
   advisor.setAdvice(new LoginInterceptor());
   weaver.addAdvisor(advisor);

    //返回代理对象
   LoginWithoutInterface loginProxy = (LoginWithoutInterface) weaver.getProxy();
   loginProxy.login();
   System.out.println(loginProxy.getClass());
}
```

输出：

> 拦截下，再执行   
> 没有接口的登录–基于类的代理   
> 拦截结束   
> `class com.wgs.spring.aop2.LoginWithoutInterface$$EnhancerBySpringCGLIB$$d1551df8`

可以看出最后返回的代理对象是属于SpringCGLIB的，表明基于CGLIB的代理模式完成了AOP流程。

### 三、Spring AOP的织入操作过程

第二节我们介绍了Advisor(Aspect)，一个Advisor中有拦截的横切逻辑Advice以及定义了织入位置的Pointcut。下面如何将这个Advisor织入到具体位置处Joinpoint处呢？

Spring AOP采用ProxyFactory等织入器来完成整个织入过程。   
![这里写图片描述](//img-blog.csdn.net/20180320234833192?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

其中，

- ProxyFactory：Spring AOP提供的最基本的织入器；
- ProxyFactoryBean：可以结合Spring IoC容器，在容器中对Pointcut和Advice等进行管理；
- AspectJProxyFactory：基于 AspectJ的ProxyFactory。

下面来详细介绍ProxyFactory和ProxyFactoryBean这两个织入器。

#### 1、ProxyFactory

**==（1）ProxyFactory代码实现==**

> ProxyFactory是Spring AOP提供的最基本的织入器。在完成织入过程后，ProxyFactory会返回织入横切逻辑的目标对象的代理对象。

ProxyFactory完成整个织入过程需要两个要素：

- 要进行织入操作的目标对象：可以通过ProxyFactory的setTarget(Obj)方法或者构造器设置目标对象；
- 应用到目标对象的Advisor(Aspect)：通过ProxyFactory的addAdvisor(advisor)添加Advisor，完成横切逻辑的织入。

具体实现的代码我们在第3节**Spring AOP的实现原理**完成动态代理 和CGLIB代理中已经完成，大致流程如下：

```
//设置目标对象
ProxyFactory weaver = new ProxyFactory(obj);
//(weaver.setTarget(obj);)
//设置Advisor(Aspect，包括设置Pointcut和Advice),添加拦截器，完成织入操作
weaver.addAdvisor(advisor);
//返回代理对象
Object objProxy = (Object ) weaver.getProxy();
```

可以看到，ProxyFactory返回的是具有织入功能的代理对象，而不是已经添加横切逻辑的目标对象，这点需要注意。

我们在第3节已经看到，Spring AOP的代理过程分为JDK动态代理和CGLIB两种机制，那么时候会使用基于类的代理呢？

- 如果目标类没有实现任何接口，就必须使用基于类的代理；
- 如果目标类实现了接口，可以通过ProxyFactory设置proxyTargetClass或者optimize的属性为true，这样就会使用基于类的代理机制，即：   
  `waver.setProxyTargetClass(true);`或`weaver.setOptimize(true);`

**==（2）ProxyFactory实现原理==**   
下面来看一看ProxyFactory是如何实现织入过程并返回代理对象的。首先ProxyFactory类层次图如下：   
![这里写图片描述](//img-blog.csdn.net/20180320234846693?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)   
可以看到ProxyFactory继承了ProxyCreatorSupport类，而ProxyCreatorSupport又继承了AdvisedSupport类，AdvisedSupport继承了ProxyConfig类同时实现了Advised接口，下面我们从AdvisedSupport开始看起，看看AdvisedSupport代表了什么。

**Ⅰ)AdvisedSupport类**   
由图可以看出，AdvisedSupport继承了ProxyConfig类同时实现了Advised接口，因此AdvisedSupport承载的信息分为两类：

- ProxyConfig：记载生成代理对象的控制信息；
- Advised：记载生成代理对象的必要信息，如目标类、Advisor、Advice等。

ProxyConfig：普通的JavaBean，记载生成的代理对象的控制信息，包含5个属性：   
`org.springframework.aop.framework.ProxyConfig`

> proxyTargetClass：属性设置为true时，使用基于类的代理方式，即使用CGLIB对目标对象进行代理，默认为false；   
> optimize：为true时，使用CGLIB对目标对象进行代理，默认为false；   
> opaque：控制生成的代理对象是否可以强制换为Advised类型，默认false；   
> exposeProxy：可以将生成的代理对象绑定到ThreadLocal当中，默认false；   
> frozen：设置为true时，对生成的代理对象信息就不允许修改。

Advised：提供生成的代理对象的具体信息，如针对哪些目标类生成代理对象，加入什么样的横切逻辑等。   
返回的代理对象可以转换为Advised类型，这样就可以查询到代理对象中的相关的目标类、Advice等信息，也可以进行添加、移除Advisor等操作。   
`org.springframework.aop.framework.Advised`

**Ⅱ)ProxyCreatorSupport**   
ProxyCreatorSupport只是将一些公用的逻辑抽取到了ProxyCreatorSupport类当中，其继承了AdvisedSupport类，因此也具有ProxyConfig和Advised等功能。   
ProxyCreatorSupport内部持有一个AopProxyFactory的实例。

**Ⅲ)ProxyFactory**   
ProxyFactory继承自ProxyCreatorSupport，由于ProxyCreatorSupport内部持有一个AopProxyFactory的实例，ProxyFactory当然可以获取到AopProxyFactory生成的代理对象。   
![这里写图片描述](//img-blog.csdn.net/20180320234900605?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

```
public interface AopProxyFactory {
    AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException;
}
```

AopProxyFactory 持有AdvisedSupport ，根据AdvisedSupport 实例提供的相关信息，来决定生成CglibAopProxy或者JdkDynamicAopProxy。

走到这里，我们已经理清了大致思路，即：   
ProxyFactory根据AdvisedSupport承载的ProxyConfig和Advised中提供的代理对象的控制信息和具体信息(ProxyConfig提供的proxyTargetClass或optimize的属性)，选择AopProxy中的CglibAopProxy或者JdkDynamicAopProxy去实现代理对象的生成，而不同的AopProxy是由AopProxyFactory的实现类DefaultAopProxyFactory通过工厂模式生成的。

#### 2、ProxyFactoryBean

ProxyFactory是Spring AOP提供的最基本的织入器，可以独立与IoC容器之外来使用Spring的AOP支持。当然如果想要结合IoC容器，在容器中对Pointcut和Advic进行管理，就需要使用到ProxyFactoryBean织入器。

ProxyFactoryBean的本质就是生成Proxy的FactoryBean，类似FactoryBean的作用一样。   
ProxyFactoryBean的getObject()方法返回的是目标对象的代理对象。   
由于ProxyFactoryBean同ProxyFactory一样，都继承自ProxyCreatorSupport，而ProxyCreatorSupport中已经设置好了目标对象、Advice等信息，ProxyFactoryBean可以调用父类ProxyFactoryBean中的createAopProxy()直接返回创建的代理对象即可，只是在返回的时候需要根据返回的代理对象是Singleton还是prototype类型，稍微进行修改。

**ProxyFactoryBean的getObject()方法：**

```
    public Object getObject() throws BeansException {
        initializeAdvisorChain();
        if (isSingleton()) {
            return getSingletonInstance();
        }
        else {
            if (this.targetName == null) {
                logger.warn("Using non-singleton proxies with singleton targets is often undesirable. " +
                        "Enable prototype proxies by setting the 'targetName' property.");
            }
            return newPrototypeInstance();
        }
    }
```

可以看到，如果返回的代理对象类型是Singleton类型，就将生成的代理对象放入缓存；否则每次都生成新的代理对象。

下面看看在IoC容器如何使用ProxyFactoryBean生成代理对象。   
（1）基于接口代理的实现代码

```
//公共接口
public interface ILogin {
    void login();
}
//具体实现类
public class RealLogin implements ILogin {
    @Override
    public void login() {
        System.out.println("登录。。。");
    }
}

//动态代理类
public class DynamicProxy implements InvocationHandler {
    //要代理的对象
    private Object obj;

    //实际注入的对象
    public DynamicProxy(Object realObj){
        this.obj = realObj;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("拦截下，再执行");
        method.invoke(obj, args);
        System.out.println("拦截结束");

        return null;
    }
}

proxyfactorybean.xml：在classpath下配置ProxyFactoryBean
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

    <!--设置pointcut：拦截方法-->
    <bean id="login-pointcut" class="org.springframework.aop.support.NameMatchMethodPointcut">
        <property name="mappedName" value="login"></property>
    </bean>
    <!--设置advice：横切逻辑-->
    <bean id="login-advice" class="com.wgs.spring.aop2.DynamicProxy"></bean>
    <!--设置advisor：添加pointcut和pointcut-->
    <bean id="login-advisor" class="org.springframework.aop.support.DefaultPointcutAdvisor">
        <property name="pointcut" ref="login-pointcut"></property>
        <property name="advice" ref="login-advice"></property>
    </bean>

    <!--设置ProxyFactoryBean，添加拦截器，最后返回代理对象loginProxy-->
    <bean id="loginProxy" class="org.springframework.aop.framework.ProxyFactoryBean">
    <!--设置目标对象-->
        <property name="target">
            <bean id="realTask" class="com.wgs.spring.aop2.RealLogin"></bean>
        </property>
        <!--设置公共接口-->
        <property name="proxyInterfaces">
            <value>com.wgs.spring.aop2.ILogin</value>
        </property>
        <!--添加拦截器-->
        <property name="interceptorNames">
            <list>
                <value>login-advisor</value>
            </list>
        </property>
    </bean>
</beans>


//测试
public static void main(String[] args) {
    ApplicationContext ctx = new ClassPathXmlApplicationContext("proxyfactorybean.xml");
    //返回IoC容器中获取的代理对象
    ILogin loginProxy = (ILogin) ctx.getBean("loginProxy");
    loginProxy.login();
}
```

输出：

> 拦截下，再执行   
> 登录。。。   
> 拦截结束   
> class com.sun.proxy.$Proxy2

可以看到，是基于动态代理的方式。

（2）基于类代理的实现代码   
基于类的代理实现与上大致类似，只不过需要将proxyTargetClass属性设置为true，即采用类代理的方式。   
具体实现代码如下：

```
//目标类，没有实现任何接口
public class LoginWithoutInterface {
    public void login(){
        System.out.println("没有接口的登录--基于类的代理");
    }
}

//Around Advice
public class LoginInterceptor implements MethodInterceptor {
    @Override
    public Object invoke(MethodInvocation methodInvocation) throws Throwable {
        try{
            System.out.println("拦截下，再执行");
            return methodInvocation.proceed();
        }finally {
            System.out.println("拦截结束");
        }
    }
}

proxyfactorybean2.xml：配置ProxyFactoryBean，设置proxyTargetClass采用类代理方式，返回代理对象
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

    <!--设置pointcut：拦截方法-->
    <bean id="login-pointcut" class="org.springframework.aop.support.NameMatchMethodPointcut">
        <property name="mappedName" value="login"></property>
    </bean>
    <!--设置advice：横切逻辑-->
    <bean id="login-advice" class="com.wgs.spring.aop2.LoginInterceptor"></bean>
    <!--设置advisor：添加pointcut和pointcut-->
    <bean id="login-advisor" class="org.springframework.aop.support.DefaultPointcutAdvisor">
        <property name="pointcut" ref="login-pointcut"></property>
        <property name="advice" ref="login-advice"></property>
    </bean>

    <!--设置ProxyFactoryBean，添加拦截器，最后返回代理对象loginProxy-->
    <bean id="loginProxy" class="org.springframework.aop.framework.ProxyFactoryBean">
        <!--设置目标对象-->
        <property name="target">
            <bean id="realTask" class="com.wgs.spring.aop2.LoginWithoutInterface"></bean>
        </property>
        <!--设置proxyTargetClass属性，true：表示采用类代理的方式-->
        <property name="proxyTargetClass">
            <value>true</value>
        </property>
        <!--添加拦截器-->
        <property name="interceptorNames">
            <list>
                <value>login-advisor</value>
            </list>
        </property>
    </bean>
</beans>

//测试
public static void main(String[] args) {
    ApplicationContext ctx = new ClassPathXmlApplicationContext("proxyfactorybean2.xml");
    LoginWithoutInterface loginProxy = (LoginWithoutInterface) ctx.getBean("loginProxy");
    loginProxy.login();
}
```

最后输出：

> `class com.wgs.spring.aop2.LoginWithoutInterface$$EnhancerBySpringCGLIB$$2ca0f625`   
> 拦截下，再执行   
> 没有接口的登录–基于类的代理   
> 拦截结束

可以看到是基于CGLIB的代理方式获取代理对象，完成织入过程的：`EnhancerBySpringCGLIB`。

### 四、@AspectJ形式的Spring AOP

Spring2.0之后，就支持AspectJ形式的AOP实现。

> `@AspectJ`代表一种定义Aspect的风格，让我们能够以POJO的形式定义Aspect，没有其他接口定义的限制。   
> `@Aspect`J形式的AOP需要使用相应的注解标注Aspect定义的POJO类，之后，Spring会根据标注的注解搜索这些Aspect定义类，将其织入系统。

Spring AOP使用AspectJ的类库进行Pointcut的解析和匹配，最终的实现机制还是Spring AOP使用代理模式处理横切逻辑的织入。

下面，通过一个简单的例子，来看下@AspectJ形式的Spring AOP是如何完成横切逻辑的织入过程的。

```
//1 定义目标类，通过@EnableAspectJAutoProxy注解表示基于类代理
Component
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class Target {
    public void method1(){
        System.out.println("============method2正常方法开始执行了============");
    }

}


//定义切面类，设置pointcut和Advice
@Component
@Aspect
public class LogAspect {

    @Pointcut("execution(void method1())")
    private void pointcutName() {

    }

    @Before("pointcutName()")
    public void beforeMethod(){
        System.out.println("before。。。");
    }

    @After("pointcutName()")
    public void afterMethod(){
        System.out.println("after：类似finally方法...");
    }

    @AfterReturning("pointcutName()")
    public void doAfterReturning(){
        System.out.println("AfterReturning：在pointcutName所在方法正常执行结束后执行after advice");
    }

    @AfterThrowing(value = "pointcutName()",throwing = "e")
    public void doAfterThrowing(RuntimeException e){
        System.out.println("异常："+e);
        System.out.println("AfterThrowing：在pointcutName所在方法执行异常时执行");
    }

    @Around("pointcutName()")
    public Object  doAround(ProceedingJoinPoint joinPoint) throws Throwable {
        System.out.println("进入Around advice...");
        Object o = joinPoint.proceed();
        System.out.println("离开Around advice...");
        return o;
    }

}

//3 测试
public static void main(String[] args) {
    ApplicationContext ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
     Target target = (Target) ctx.getBean("target");
     target.method1();
}
```

最后的输出结果：

> 进入Around advice…   
> before。。。   
> ====method2正常方法开始执行了====   
> 离开Around advice…   
> after：类似finally方法…   
> AfterReturning：在pointcutName所在方法正常执行结束后执行after advice

用一张图表示上图的织入位置和横切逻辑的织入过程：   
![这里写图片描述](//img-blog.csdn.net/20180320234933921?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

由于程序没有发生异常，因此`@AfterThrowing`Advice没有执行织入操作。

从上面例子我们可以总结基于`@AspectJ`形式的Spring AOP完成过程：   
首先编写目标类 ，在 目标类中加入注解   
`@EnableAspectJAutoProxy(proxyTargetClass = true)`设置使用基于类的代理方式；然后写一个Aspect切面，并通过注解`@Aspect`注明，在切面类设置Pointcut和各种Advice；   
最后启动目标类即可看到Aspect中具有横切逻辑的各种Advice已经生效。

#### 1、@AspectJ形式的Pointcut—@Pointcut

`@Pointcut`需要在`@Aspect`定义内，常用execution匹配指定方法签名的Joinpoint。

`@Aspect`形式声明的所有Pointcut表达式，在Spring AOP内部都会解析转化为具体的Pointcut对象（Spring AOP有自己的Pointcut接口），即`@Aspect`形式声明的Pointcut都会转化为一个专门面向AspectJ的Pointcut实现。

#### 2、@AspectJ形式的Advice

`@AspectJ`形式的Advice注解包括：

- @Before：前置Advice，在Pointcut执行之前执行；
- @After：后置Advice；类似finally方法，无论Pointcut定义的方法是否抛出异常最后都会执行after advice
- @AfterReturning：声明返回Advice，在pointcut定义的方法正常执行结束执行AfterReturning Advice；
- @AfterThrowing：异常Advice，在pointcut定义的方法抛出异常时执行；
- @Around：环绕Advice，可以pointcut定义的方法前后执行；

具体的使用方法见上面的例子，在此不一一赘述。

#### 3、@AspectJ形式的Aspect—@Aspect

AspectJ形式的Aspect需要注意的地方就是切面Aspect中Advice的执行顺序：

- 当Advice声明在同一Aspect内的时候，先声明的拥有高优先级。   
  对于Before Advice，先声明优先级越高，越快执行；   
  对于AfterReturning Advice来说，先声明优先级越高，但是执行越靠后；
- 当Advice声明在不同的Aspect内的时候，需要每个Aspect去实现Ordered接口，然后设置order属性，order越小，优先级越高。

举个栗子：

```
//1 目标类不变：
@Component
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class Target {
    public void method1(){
        System.out.println("============method1正常方法开始执行了============");
    }
}

//2 切面类1
@Aspect
@Component
public class SecurityAspect implements Ordered{

    @Pointcut("execution(void method1())")
    public void pointcutName(){
    }

    @Before("pointcutName()")
    public void beforeMethod(){
        System.out.println("SecurityAspect1 beforeMethod");
    }

    @AfterReturning("pointcutName()")
    public void aftetReturningMethod(){
        System.out.println("SecurityAspect1 aftetReturningMethod");
    }

    @Override
    public int getOrder() {
        return 100;
    }

}

//3 切面类2
@Aspect
@Component
public class SecurityAspect2 implements Ordered{

    @Pointcut("execution(void method1())")
    public void pointcutName(){
    }

    @Before("pointcutName()")
    public void beforeMethod(){
        System.out.println("SecurityAspect2 beforeMethod");
    }

    @AfterReturning("pointcutName()")
    public void aftetReturningMethod(){
        System.out.println("SecurityAspect2 aftetReturningMethod");
    }
    @Override
    public int getOrder() {
        return 200;
    }

}

//4 测试
public static void main(String[] args) {
   ApplicationContext ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
   Target target = (Target) ctx.getBean("target");
    target.method1();
}
```

输出结果：

> SecurityAspect1 beforeMethod   
> SecurityAspect2 beforeMethod   
> ============method1正常方法开始执行了============   
> SecurityAspect2 aftetReturningMethod   
> SecurityAspect1 aftetReturningMethod

上面，切面类1-SecurityAspect的order是100，切面类2-SecurityAspect2的order是200，因此SecurityAspect优先级更高。因此SecurityAspect的beforeMethod应该先执行，而其afterReturningMethod后在执行。

#### 4、基于`@AspectJ`形式的Spring AOP实现方式

基于`@AspectJ`形式的Spring AOP实现方式有两种：

- （1）通过编程方式织入；
- （2）通过自动代理的方式织入

**（1）通过编程方式织入**   
在讲解织入器的时候，继承自ProxyCreatorSupprot有3个基本类：   
ProxyFactory、ProxyFactoryBean、AspectJProxyFactory。   
我们已经介绍过前两个织入器，在此将介绍AspectJProxyFactory织入器。   
AspectJProxyFactory可以将Aspect织入到目标类中，   
如下：

```
//目标类
public class Target2 {
    public void target(){      System.out.println("============target============");
    }
 }  

//切面
@Aspect
@Component
public class SecurityAspect {

    @Pointcut("execution(void target())")
    public void pointcutName(){
    }

    @Before("pointcutName()")
    public void beforeMethod(){
        System.out.println("SecurityAspect1 beforeMethod");
    }

    @AfterReturning("pointcutName()")
    public void aftetReturningMethod(){
        System.out.println("SecurityAspect1 aftetReturningMethod");
    }

}
//织入 
public static void main(String[] args) {
  AspectJProxyFactory weaver = new AspectJProxyFactory();
  //设置基于类代理的方式
   weaver.setProxyTargetClass(true);
   //设置目标类
   weaver.setTarget(new Target2());
   //添加切面
   weaver.addAspect(SecurityAspect.class);
   //获取代理对象
   Object proxy  = weaver.getProxy();
   ((Target2)proxy).target();
    }
```

> AspectJProxyFactory通过反射获取到Aspect中的@Pointcut定义的AspectJ形式的Pointcut定义之后，在Spring AOP内部会构造一个对应的AspectJExpressionPointcut对象实例，AspectJExpressionPointcut内部持有通过反射获取到的Pointcut表达式。   
> 然后Spring AOP框架内部处理Pointcut匹配的逻辑，即通过ClassFilter和MethodMatcher进行具体Pointcut匹配。   
> 不过这个过程会委托AspectJ类库中的相关类来做具体的解析工作。

**（2）通过自动代理的方式织入**   
实际上，我们在开始举得例子中使用的就是自动代理的方式进行织入操作的，也推荐此种方法。

Spring AOP提供了AutoProxyCreator类类完成自动代理的过程。   
可以在目标类上加上   
`@EnableAspectJAutoProxy(proxyTargetClass = true)`   
注解   
或者在配置文件中加上   
`<aop:aspectj-autoproxy proxy-target-class="true"/>`   
即可完成整个织入过程。

### 五、基于Schema形式的Spring AOP

基于Schema的AOP是新增加的一种AOP的使用方式，基于Schema的XML配置，提供了独有的命名空间。

要使用基于Schema形式的Spring AOP，IoC容器的配置文件需要使用基于Schema的XML，同时在文件头中针对AOP的命名空间声明，如下所示：

```
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:aop="http://www.springframework.org/schema/aop"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop.xsd">

</beans>
```

基于Schema形式的Spring AOP使用方法也较为简单，大致如下，在此不再详细介绍，详情请看官方文档。

```
//1 目标类
public class Target {
    public void target(){
        System.out.println("============target正常方法开始执行了============");
    }
}

//2 切面类
public class SecurityAspect {

    public void beforeMethod(){
        System.out.println("SecurityAspect1 beforeMethod....");
    }

    public void aftetReturningMethod(){
        System.out.println("SecurityAspect1 aftetReturningMethod....");
    }

}
// 3 基于Schema的Spring AOP的实现
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:aop="http://www.springframework.org/schema/aop"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop.xsd">


    <bean id="target" class="com.wgs.aop.Target"></bean>
    <bean id="securityAspect" class="com.wgs.aop.SecurityAspect"></bean>
    <aop:config proxy-target-class="true">
        <aop:pointcut id="pointcutName" expression="execution(* com.wgs.aop.Target.target())"></aop:pointcut>
        <aop:aspect ref="securityAspect" order="1">
            <aop:before method="beforeMethod" pointcut-ref="pointcutName"/>
            <aop:after-returning method="aftetReturningMethod" pointcut-ref="pointcutName"/>
        </aop:aspect>
    </aop:config>
</beans>


//4 测试
public static void main(String[] args) {
   ApplicationContext ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
   Target target = (Target) ctx.getBean("target");
   target.target();
}
```

输出：

> SecurityAspect1 beforeMethod….   
> ============target正常方法开始执行了============   
> SecurityAspect1 aftetReturningMethod….

基于Schema的Spring AOP底层依然使用自动代理机制实现的，即会根据`<aop:config>`、`<aop:pointcut>`、`<aspect>`等标签获取到必要的织入信息，然后为容器内注册的bean进行自动代理。

关于Schema形式的Spring AOP的使用方法在此不再介绍，感兴趣的自行查看。

有关Spring AOP的基本知识就介绍到此，下面将会介绍Spring AOP机制的源码分析。

---

2018/03/20 in NJ.