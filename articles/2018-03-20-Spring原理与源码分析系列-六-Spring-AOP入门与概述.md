---
title: "Spring原理与源码分析系列（六）- Spring AOP入门与概述"
date: 2018-03-20
category: 后端开发
tags: [AOP, Spring AOP]
---

### 一、AOP

#### 1、什么是AOP

**AOP ：Aspect-Oriented Programming，面向切面编程的简称。**

> 在我们的项目代码中，有大量与日志、事务、权限（AOP称之为横切关注点）相关的代码镶嵌在业务代码当中，造成大量代码的重复与代码的冗余。   
>  虽然可以将这些重复的代码封装起来再进行调用，但是这样的调用方式比较单一，不够灵活，无法更好地以模块化的方式，对这些横切关注点进行组织和实现。

![这里写图片描述](//img-blog.csdn.net/20180320233329615?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

> AOP提出切面（Aspect）的概念，以模块化的方式对横切关注点进行封装，再通过织入的方式将切面织入到业务逻辑代码当中。这样横切关注点与业务逻辑代码分离，业务逻辑代码中就不再含有日志、事务、权限等代码的调用，可以很好的进行管理。

![这里写图片描述](//img-blog.csdn.net/20180320233351799?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

#### 2、AOP基本概念

AOP中的相关术语有：Joinpoint，Pointcut，Advice，Aspect，Introduction，Weaving。   
 这些概念将在Spring AOP中详细描述，此处略去。

**（1）点(Joinpoint)**   
 连接点是在应用执行过程中能够插入切面的一个点。这个点可以是调用方法时、抛出异常时、甚至修改一个字段时。切面代码可以利用这些点插入到应用的正常流程之中，并添加行为。

**（2）切点（Pointcut）**   
 如果说通知定义了切面“是什么”和“何时”的话，那么切点就定义了“何处”。比如我想把日志引入到某个具体的方法中，这个方法就是所谓的切点。

**（3）通知（Advice）**   
 在AOP中，切面的工作被称为通知。通知定义了切面“是什么”以及“何时”使用。除了描述切面要完成的工作，通知还解决了何时执行这个工作的问题。

Spring切面可以应用5种类型的通知：

- 前置通知（Before）：在目标方法被调用之前调用通知功能；
- 后置通知（After）：在目标方法完成之后调用通知，此时不会关心方法的输出是什么；
- 返回通知（After-returning）：在目标方法成功执行之后调用通知；
- 异常通知（After-throwing）：在目标方法抛出异常后调用通知；
- 环绕通知（Around）：通知包裹了被通知的方法，在被通知的方法调用之前和调用之后执行自定义的行为；

**（4）切面（Aspect）**   
 切面是通知和切点的结合。通知和切点共同定义了切面的全部内容———他是什么，在何时和何处完成其功能。

**（5）引入（Introduction）**   
 引入允许我们向现有的类添加新的方法和属性(Spring提供了一个方法注入的功能）。

**（6）织入(Weaving)**   
 把切面应用到目标对象来创建新的代理对象的过程，织入一般发生在如下几个时机:

- 编译时：当一个类文件被编译时进行织入，这需要特殊的编译器才可以做的到，例如AspectJ的织入编译器
- 类加载时：使用特殊的ClassLoader在目标类被加载到程序之前增强类的字节代码
- 运行时：切面在运行的某个时刻被织入,SpringAOP就是以这种方式织入切面的，原理应该是使用了JDK的动态代理技术。

（此处术语解释来源：   
 <https://www.jianshu.com/p/5155aabaec3f>）

#### 3、AOP的分类

AOP主要分为静态AOP和动态AOP。   
 **（1）静态AOP**

> 静态AOP，也称为第一代AOP，是指将相应横切关注点以Aspect形式实现之后，**在编译阶段，**通过特定编译器将Aspect织入到目标类当中。

优点：Aspect直接以Java字节码的形式编译到Java Class类中，Java虚拟机可以正常加载类，没有性能损失。   
 缺点：不够灵活，如果要修改织入的位置时，就需要修改Aspect和重新编译。

静态AOP需要有3个重要因素：

> 1）共同的接口：定义方法不提供实现，供外部调用；   
>  2）实现类：上述接口具体实现；   
>  3）代理类：注入的是实现类，调用接口的方法实际是调用实现类的方法的实现。

下面通过代码来看看静态AOP是如何实现的。

```
//共同接口
public interface CommonService {
    public void sayHello();
}
//接口的具体实现
public class CommonServiceImpl implements CommonService {
    @Override
    public void sayHello() {
        System.out.println("hello, 静态代理！");
    }
}
//代理类
public class StaticProxy implements CommonService {
    private CommonService realService;

    public StaticProxy(CommonService realService){
        this.realService = realService;
    }

    @Override
    public void sayHello() {
        //织入横切逻辑
        System.out.println("日志输出1.。。");
        realService.sayHello();
        //织入横切逻辑
        System.out.println("日志输出2.。。");
    }
}
//测试
public static void main(String[] args) {
     CommonService realService = new CommonServiceImpl();
     StaticProxy proxy = new StaticProxy(realService);
     proxy.sayHello();
}
```

输出结果：

> 日志输出1.。。   
>  hello, 静态代理！   
>  日志输出2.。。

可以看到，在运行前，即将横切逻辑织入到所需要织入的位置。   
 ![这里写图片描述](//img-blog.csdn.net/20180320233415113?watermark/2/text/Ly9ibG9nLmNzZG4ubmV0L25vYW1hbl93Z3M=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

我们为RealService类产生了一个代理对象StaticProxy，假如还有RealService2，RealService3….，就要继续生成代理对象StaticProxy2，StaticProxy3,,,,，这样比较麻烦，因此就需要动态AOP来实现。

**（2）动态AOP**

> 动态AOP，也称为第二代AOP，是指在类加载或者系统运行阶段，将Aspect代码动态织入到目标类当中。   
>  与静态AOP最大的不同之处在于织入过程发生在系统运行后，而不是预编译阶段。

优点：比较灵活，可以动态更改织入逻辑。   
 缺点：由于发生阶段是在类加载或者系统运行阶段，因此会造成运行时性能损失。

动态AOP可以通过JDK动态代理或者Cglib来实现，下面通过JDK动态代理的方式来实现动态AOP。

```
//同样需要公共接口
public interface CommonService {
    public void sayHello();
}
//具体实现类
public class CommonServiceImpl implements CommonService {
    @Override
    public void sayHello() {
        System.out.println("hello, 动态代理！");
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
        System.out.println("日志输出1.....");
        method.invoke(obj, args);
        System.out.println("日志输出1.....");

        return null;
    }
}
//测试：通过公共接口的ClassLoader和代理类生成一个代理类对象
public static void main(String[] args) {
    //产生一个代理类
    InvocationHandler handler = new DynamicProxy(new CommonServiceImpl());
     //产生代理类对象
     CommonService proxyService
         = (CommonService) Proxy.newProxyInstance(CommonService.class.getClassLoader(),
          new Class<?>[]{CommonService.class},
          handler);
     proxyService.sayHello();
}
```

输出：

> 日志输出1…..   
>  hello, 动态代理！   
>  日志输出2…..

这里有几个需要注意的地方：

- InvocationHandler ：InvocationHandler 用来生成动态代理类，它的构造方法注入了具体的实现类，表示被代理的对象；
- invoke()方法的几个参数

  > proxy：表示代理类对象本身，作用不大   
  >  method：正在被调用的方法；   
  >  args：方法的参数；
- Proxy.newProxyInstance   
   该方法是java.lang.reflect包下Proxy类的静态方法，方法定义如下：   
   `public static Object newProxyInstance(   
   ClassLoader loader,   
   Class<?>[] interfaces,   
   InvocationHandler h)`   
   其中：

  > loader：表示被代理对象的类加载器；   
  >  interfaces：代理类要实现的接口列表，只能是接口类型；   
  >  h：h的类型为InvocationHandler，它是一个接口，也定义在java.lang.reflect包中，它只定义了一个方法invoke，对代理接口所有方法的调用都会转给该方法

#### 4、AOP实现机制

Java平台主要提供了如下两种方式实现AOP：

- 动态代理（Dynamic Proxy）—需要有接口
- 动态字节码增强（Cglib）—不需要接口

**（1）动态代理（Dynamic Proxy）**   
 JDK1.3之后，引入了动态代理（Dynamic Proxy）机制。

> 在运行期间为相应接口动态生成对应的代理对象，再将横切关注点逻辑封装到动态代理的InvocationHandler中。在系统运行期间，将横切逻辑织入到代理类指定位置中。

缺点：动态代理只针对接口有效。

在上节动态AOP中我们已经看到了如何使用JDK动态代理的方式去实现AOP，本节不再赘述。

**（2）动态字节码增强（Cglib）**   
 有的时候我们无法生成接口，自然就无法使用动态代理的方式，这个时候我们就可以使用ASM(字节码增强框架)或者Cglib技术来动态生成字节码的Class文件，而只要符合JVM规范的.class文件都可以被JVM所加载。

> Cglib就是在系统运行期间，通过动态字节码增强技术，为需要织入横切逻辑的目标类生成对应子类，代理类重写了父类所有public非final的方法（即横切逻辑加到方法当中）。   
>  当程序调用目标类时，通过拦截方法实际最后执行的是具有横切逻辑的子类。

缺点：如果目标类或目标类中的方法是final的话，就无法进行织入（final类不能被继承，final方法不能被重写）。

下面通过代码来看看动态字节码增强（Cglib）是如何实现AOP的。

```
//需要织入横切逻辑的目标类
public class Login {
    public void login(String username){
        if ("admin".equals(username)){
            System.out.println("登录成功！");
        }else {
            System.out.println("登录失败！");
        }
    }
}

public class MyMethodInterceptor implements MethodInterceptor {
    @Override
    public Object intercept(Object o, Method method, Object[] objects, MethodProxy methodProxy) throws Throwable {
        //织入横切逻辑
        System.out.println("权限检查1,,,");
         //调用目标类方法
        Object result = methodProxy.invokeSuper(o, objects);
        //织入横切逻辑
        System.out.println("权限检查2,,,");

        return result;
    }
}

public class CglibTest {

    // 生成代理对象
    private static<T> T getProxy(Class<T> clazz){
        Enhancer enhancer = new Enhancer();
        //将目标类设置为父类
        enhancer.setSuperclass(clazz);
        //设置回调
        enhancer.setCallback(new MyMethodInterceptor());
        return (T) enhancer.create();
    }
    public static void main(String[] args) {
        Login loginProxy = getProxy(Login.class);
        loginProxy.login("admin");
    }
}
```

输出结果：

> 权限检查1,,,   
>  登录成功！   
>  权限检查2,,,

可以看到，首先重写MethodInterceptor接口中的intercept方法，在该方法中完成横切逻辑的织入以及目标类的方法的调用，   
 然后通过Enhancer类生成代理对象，将目标类设置为代理类，并完成回调

AOP的内容就介绍到此，下面将介绍Spring AOP的相关理论和实战。

---

2018/03/20 in NJ.