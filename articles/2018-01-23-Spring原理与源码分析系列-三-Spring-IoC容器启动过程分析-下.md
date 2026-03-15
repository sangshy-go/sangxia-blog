---
title: "Spring原理与源码分析系列（三）- Spring IoC容器启动过程分析（下）"
date: 2018-01-23
category: 后端开发
tags: []
---

### 0 前言

关于Spring容器启动过程的分析，本章节文章分为两篇文章进行叙述，第一篇主要介绍Spring中Bean的相关概念以及IoC容器类型；第二篇开始详细介绍IoC容器的启动过程。   
 上篇[Spring原理与源码分析系列（二）- Spring IoC容器启动过程分析（上）](http://blog.csdn.net/noaman_wgs/article/details/79138307)已经介绍了介绍Spring中Bean的相关概念以及IoC容器类型。本篇主要详述IoC容器的启动过程。

### 四、Spring IoC容器实现过程

Spring IoC容器实现过程可分为两个阶段：

- 容器启动阶段
- Bean实例化阶段

下面来详细解释这两个过程。

#### 1 容器启动阶段

容器启动阶段，主要是对象管理信息的收集。   
 除了直接代码的方式，一般是先读取和加载配置信息内容，   
 并将分析后的信息编组为BeanDefinition，   
 然后将保存了bean定义必要信息的BeanDefinition注册到BeanDefinitionRegistry中，这样启动工作就完成了。   
 ![这里写图片描述](https://img-blog.csdn.net/20180123130815301?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 （第一阶段：容器启动阶段）

**BeanFactoryPostProcessor**   
 在容器启动阶段，BeanFactoryPostProcessor接口允许我们在容器实例化相应对象之前，对注册到容器的BeanDefinition所保存的信息做相应的修改，比如修改其中bean定义的某些属性，把bean的scope从singleton改为prototype，也可以把property的值给修改掉，为bean定义增加其他信息等。   
 **BeanFactoryPostProcessor是在Spring容器加载了bean的定义文件之后，在bean实例化之前执行的。**

BeanFactoryPostProcessor接口定义如下：

```
public interface BeanFactoryPostProcessor {

void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException;

}
```

接口方法的入参是ConfigurrableListableBeanFactory，使用该参数，可以获取到相关bean的定义信息.

使用的时候，我们可以自己实现BeanFactoryPostProcessor接口，然后修改Bean属性。   
 举个栗子：   
 （1）Bean：

```
package com.wgs.spring.beanfactorypostprocessor;

/**
 * @author GenshenWang.nomico
 * @date 2017/11/21.
 */
public class Staff {
    private String name;
    private int age;

    public void setName(String name) {
        this.name = name;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }
}
```

并为其注入属性值：

```
<bean id="staff" class="com.wgs.spring.beanfactorypostprocessor.Staff">
        <property name="age" value="25"></property>
        <property name="name" value="wgs"></property>
    </bean>
```

（2）自己实现一个BeanFactoryPostProcessor，将Bean属性中的name原始值“wgs”改为“Jack Ma”。

```
package com.wgs.spring.beanfactorypostprocessor;

import org.springframework.beans.BeansException;
import org.springframework.beans.MutablePropertyValues;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;

/**
 * @author GenshenWang.nomico
 * @date 2017/11/21.
 */
public class MyBeanFactoryPostProcessor implements BeanFactoryPostProcessor{


    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        //BeanFactoryPostProcessor发生在读取Bean的BeanDefinition后，Bean实例化之前，所以获取的是BeanDefinition
        BeanDefinition staffBeanDefinition = beanFactory.getBeanDefinition("staff");
        //获取bean属性
        MutablePropertyValues propertyValues = staffBeanDefinition.getPropertyValues();
        if(propertyValues.contains("name")){
            propertyValues.addPropertyValue("name", "Jack Ma");
        }
    }
}
```

（3）测试：   
 注释掉spirng.xml中的配置：   
 `<bean id="myBeanFactoryPostProcessor" class="com.wgs.spring.beanfactorypostprocessor.MyBeanFactoryPostProcessor"></bean>`，输出的结果为”wgs”；

在spirng.xml加上`<bean id="myBeanFactoryPostProcessor" class="com.wgs.spring.beanfactorypostprocessor.MyBeanFactoryPostProcessor"></bean>`，这样BeanFactoryPostProcessor就能起作用，使name的值“wgs”被修改为“Jack Ma”，所以输出的结果也为“Jack Ma”。

如果一个容器有多个实现BeanFactoryPostProcessor的接口，这时候就需要实现类实现`org.springframework.core.Ordered`接口，设置order属性来保证自定义的BeanFactoryPostProcessor的实现类的执行顺序。

BeanFactoryPostProcessor接口有三个常用的实现类：   
 ![这里写图片描述](https://img-blog.csdn.net/20180123130845059?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

- org.springframework.beans.factory.config.PropertyPlaceholderConfigurer：允许我们在XML配置文件中使用占位符，并将这些占位符所代表的资源单独配置到简单的properties文件中来加载；
- org.springframework.beans.factory.config.PropertyOverrideConfigurer：可以通过占位符，来明确表明bean定义中的property与properties文件中的各项配置项之间的关系。
- org.springframework.beans.factory.config.CustomEditorConfigurer：用来注册自定义的属性编辑器

BeanFactoryPostProcessor类图：   
 ![这里写图片描述](https://img-blog.csdn.net/20180123131551363?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 （图片来源：<http://blog.csdn.net/caihaijiang/article/details/35552859>）

#### 2 Bean实例化阶段

在第一阶段容器启动阶段中，所有的bean定义的信息都被注册到BeanDefinitionRegistry中，该阶段容器仅仅拥有所有对象的BeanDefinition来保存所有必要的实例化信息。   
 当某个请求显示或隐式调用getBean()方法的时候，就会触发第二阶段：Bean实例化阶段。

> **隐式调用有两种情况：**   
>  **（1）BeanFactory：**   
>  BeanFactory的对象实例化默认采用的是延迟初始化，即只有对某个Bean使用getBean()方法时，才会对该Bean进行实例化以及依赖注入过程，这是一个显示调用过程。
>
> 如果对象A被请求而需要第一次实例化的时候，如果A依赖的对象B没有被实例化，那么容器内部会隐士调用getBean()方法对对象B进行实例化后，再进行显示调用getBean()实例化对象A过程。
>
> **（2）ApplicationContext：** ApplicationContext在容器启动之后就会加载所有的bean定义。   
>  不过在这个过程中，是通过调用AbstractApplicationContext的refresh()方法，在这个方法中会调用注册到容器当中所有的bean定义的实例化方法getBean()，完成Bean的实例化。

无论是显示还是隐士getBean（），Bean定义的getBean()方法第一次被调用时才会触发Bean实例化阶段，若getBean()内部发现该Bean没有被实例化，则会通过createBean()方法进行具体的实例化。第二次以及之后调用getBean()，都会直接返回容器内缓存的Bean的实例（prototype类型的bean除外）。

下图是Bean的实例化过程：   
 ![这里写图片描述](https://img-blog.csdn.net/20180123131029025?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 （Bean的生命周期）

Bean实例化阶段容器会首先检查所有请求的对象之前是否已经初始化，如果没有，则会根据注册的BeanDefinition所提供的信息实例化被请求对象，并未其注入依赖。如果该对象实现了某个某些回调接口，也会根据回调接口来装配。当对象装配完成以后，容器就会返回该bean。

下面是Bean实例化阶段中几个过程。

###### **（1）Bean的实例化与BeanWrapper**

Spring提供了两种方式来实例化Bean：

- 反射
- CGLIB动态字节码生成

Spring采用策略模式选择上述方式来实例化Bean。   
 `org.springframework.beans.factory.support.InstantiationStrategy`是实例化策略的接口，其直接子类`SimpleInstantiationStrategy`实现了简单的对象实例化功能。   
 而`CglibSubclassingInstantiationStrategy`继承了`SimpleInstantiationStrategy`，可通过CGLIB的动态字节码生成功能。   
 容器内部默认采用的是CglibSubclassingInstantiationStrategy。

在Bean实例化完成后，返回的不是Bean实例，而是以BeanWrapper对构造完成的Bean进行包装，返回BeanWrapper实例。

为什么使用BeanWrapper对Bean进行包装呢？   
 因为BeanWrapper对Bean实例操作很方便，可以免去直接使用Java反射API操作对象实例的繁琐。

举个栗子：   
 使用反射来操作Bean：

```
    @Test
    public void testReflect() throws ClassNotFoundException, IllegalAccessException, InstantiationException, NoSuchFieldException {
        //1 获取对象实例
        Object commentService = Class.forName("com.wgs.spring.beanwrapperdemo.CommentService").newInstance();
        Object commentDao = Class.forName("com.wgs.spring.beanwrapperdemo.CommentDao").newInstance();
        //2 获取属性
        Class commentServiceClazz = commentService.getClass();
        Field commentDaoField = commentServiceClazz.getField("commentDao");
        //3 设置属性
        commentDaoField.set(commentService, commentDao);

        System.out.println(((CommentService)commentService).getCount());
    }
```

可以看到，不仅代码很繁琐，需要获取属性再设值，还需要处理一堆的异常；   
 而使用BeanWrapper：

```
 @Test
    public void testBeanWapper() throws ClassNotFoundException, IllegalAccessException, InstantiationException {
        //1 获取对象实例
        Object commentService = Class.forName("com.wgs.spring.beanwrapperdemo.CommentService").newInstance();
        Object commentDao = Class.forName("com.wgs.spring.beanwrapperdemo.CommentDao").newInstance();

        BeanWrapper commentServiceWrapper = new BeanWrapperImpl(commentService);
        commentServiceWrapper.setPropertyValue("commentDao", commentDao);

        System.out.println(((CommentService)commentService).getCount());
    }
```

获取到BeanWrapper包装的Bean后，只需一行代码就可以完成设置注入过程，是不是很简单呢。

###### **（2）Aware接口**

当对象实例化完成且相关属性即依赖值注入完成后，IoC容器会检查当前对象实例是否实现了XXXAware接口。如果是，则将这些XXXAware接口定义中规定的依赖注入给当前对象实例。

BeanFactory有如下XXXAware接口：

- org.springframework.beans.factory.BeanNameAware接口：如果当前对象实例实现了该接口，会将该对象实例的bean对应的beanName设置到当前对象实例；
- org.springframework.beans.factory.BeanClassLoaderAware接口：如果当前对象实例实现了该接口，会将该对象实例的bean对应的ClassLoader注入到当前对象实例；
- org.springframework.beans.factory.BeanFactoryAware接口：如果当前对象实例实现了该接口，BeanFactory容器会将自身设置到当前对象实例；这样当前对象实例就拥有了一个BeanFactory容器的引用。

ApplicationContext有如下XXXAware接口：

- org.springframework.context.ResourceLoaderAware接口：ApplicationContext实现了ResourceLoader接口；若当前对象实例实现了ResourceLoaderAware接口，会将ApplicationContext设置到对象实例，这样当前对象实例就获取了ApplicationContext容器的引用；
- org.springframework.context.ApplicationEventPublisherAware接口：ApplicationContext实现了ApplicationEventPublisher接口；若当前对象实例实现了ApplicationEventPublisherAware接口，会将ApplicationContext自身注入到当前对象实例；
- org.springframework.context.MessageSourceAware接口：ApplicationContext实现了MessageSource接口；若当前对象实例实现了MessageSourceAware接口，会将ApplicationContext自身注入到当前对象实例；
- org.springframework.context.ApplicationContextAware接口：若当前对象实例实现了ApplicationContextAware接口，会将ApplicationContext自身注入到当前对象实例（换句话说就是获得ApplicationContext中的所有bean，即加载Spring上下文环境）。

下面举个栗子，通过ApplicationContextAware Demo来理解下XXXAware接口的作用：   
 （1）首先注册一个Bean：

```
package com.wgs.spring.xxxawaredemo;

/**
 * @author GenshenWang.nomico
 * @date 2017/11/22.
 */
public class User {
    private String name;
    private String password;

    public void setPassword(String password) {
        this.password = password;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public String getPassword() {
        return password;
    }
}


<bean id="user" class="com.wgs.spring.xxxawaredemo.User">
  <property name="password" value="12345"></property>
  <property name="name" value="wgs"></property>
</bean>
```

（2）自己实现一个ApplicationContextAware接口的实现类，通过setApplicationContext方法将ApplicationContext上下文注入到当前对象实例，之后就可以在该对象中获取ApplicationContext容器的bean的信息：

```
package com.wgs.spring.xxxawaredemo;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

/**
 * @author GenshenWang.nomico
 * @date 2017/11/22.
 */
public class MyApplicationContextAware implements ApplicationContextAware{


    private ApplicationContext context;

    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.context = applicationContext;
    }

    public void doGetInfo(){
    //获取到ApplicationContext容器当中的Bean的信息
        User userBean = (User) context.getBean("user");
        System.out.println("登录用户姓名：" + userBean.getName());
        System.out.println("登录密码：" + userBean.getPassword());
    }
}

XML中配置：
 <bean id="myApplicationContextAware" class="com.wgs.spring.xxxawaredemo.MyApplicationContextAware"></bean>
```

（3）测试，获取结果

```
package com.wgs.spring.xxxawaredemo;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

/**
 * @author GenshenWang.nomico
 * @date 2017/11/22.
 */
RunWith(SpringJUnit4ClassRunner.class)
ContextConfiguration({"classpath:spring.xml"})
public class TestMyApplicationContextAware {

    @Autowired
    MyApplicationContextAware myApplicationContextAware;

    @Test
    public void testApplicationContextAware(){
        myApplicationContextAware.doGetInfo();
    }
}
```

测试后，即可获取Bean的相关信息。

###### **（3）BeanPostProcessor**

上节容器启动阶段说过BeanFactoryPostProcessor这个后置处理器，本节将会了解下处理器BeanPostProcessor。两者有所相似，区别在于发生的阶段不同，

> BeanFactoryPostProcessor：存在于容器启动阶段，可以修改Bean属性；   
>  BeanPostProcessor：存在于Bean实例化阶段，在Bean实例化完成后增加一些自己的逻辑。

BeanPostProcessor会处理容器内符合条件的实例化后的对象实例。该对象声明了两个方法：

```
public interface BeanPostProcessor {
Object postProcessBeforeInitialization(Object var1, String var2) throws BeansException;

Object postProcessAfterInitialization(Object var1, String var2) throws BeansException;
}
```

postProcessBeforeInitialization()是BeanPostProcessor前置处理执行方法，   
 postProcessAfterInitialization()是BeanPostProcessor后 置处理执行方法。   
 BeanPostProcessor的两个方法中都传入了原来对象的实例的引用，这样就可以对传入的对象进行操作。

下面举个栗子简单感受下BeanPostProcessor的用法:   
 （1）注册一个Bean：

```
package com.wgs.spring.beanpostprocessordemo;

import org.springframework.beans.factory.InitializingBean;

/**
 * @author GenshenWang.nomico
 * @date 2017/11/22.
 */
public class User{
    private String name;
    private String password;

    public void setPassword(String password) {
        this.password = password;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public String getPassword() {
        return password;
    }

}

<bean id="user" class="com.wgs.spring.beanpostprocessordemo.User">
 </bean>
```

（2）自己写一个BeanPostProcessor接口的实现类，在Bean实例化前后加入自己的逻辑:

```
package com.wgs.spring.beanpostprocessordemo;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;

/**
 * @author GenshenWang.nomico
 * @date 2017/11/22.
 */
public class MyBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        System.out.println(beanName + "开始实例化了");
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        System.out.println(beanName + "实例化完成");
        return bean;
    }
}
```

（3）测试：

```
package com.wgs.spring.beanpostprocessordemo;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.beans.factory.xml.XmlBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.FileSystemXmlApplicationContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

/**
 * @author GenshenWang.nomico
 * @date 2017/11/22.
 */
RunWith(SpringJUnit4ClassRunner.class)
ContextConfiguration({"classpath:spring.xml"})
public class TestMyBeanPostProcessor {

    @Test
    public void testMyBeanPostProcessor(){
        //BeanFactory测试
       ConfigurableListableBeanFactory beanFactory = new XmlBeanFactory(new ClassPathResource("spring.xml"));
        beanFactory.addBeanPostProcessor(new MyBeanPostProcessor());
        User user = (User) beanFactory.getBean("user");
        //ApplicationContext测试
        //ApplicationContext ctx = new FileSystemXmlApplicationContext("classpath:spring.xml");
    }
}

注意，如果是ApplicationContext容器，则只需要在XML配置下MyBeanPostProcessor即可：
<bean id="myBeanPostProcessor" class="com.wgs.spring.beanpostprocessordemo.MyBeanPostProcessor"/>
```

测试结果：   
 user开始实例化了   
 user实例化完成

###### **（4）InitializingBean 和 init-method**

`org.springframework.beans.factory.InitializingBean`是容器内部广泛使用的一个对象生命周期标识接口，其作用在于在对象实例化过程中调用BeanPostProcessor的前置处理器`postProcessBeforeInitialization`后，会接着检测当前对象是否实现了InitializingBean接口。如果实现了该接口，则会调用afterPropertiesSet()方法，对对象做进一步处理。

该接口定义如下：

```
public interface InitializingBean {

void afterPropertiesSet() throws Exception;

}
```

当我们在对象中实现该接口，就可以通过afterPropertiesSet方法来完成初始化操作。但该方法对于容器比较具有侵入性，所以Spring提供了另外一种方法：在XML中使用 < bean>的`init-method`属性。

举个栗子来看下InitializingBean 和 init-method的使用方法：   
 （1）当Login类中的name和password为Null时，通过实现InitializingBean 接口，在afterPropertiesSet方法中为其附上初始值：

```
package com.wgs.spring.beanpostprocessordemo;

import org.springframework.beans.factory.InitializingBean;

/**
 * @author GenshenWang.nomico
 * @date 2017/11/23.
 */
public class Login implements InitializingBean {
    private String name;
    private String password;

    public void setName(String name) {
        this.name = name;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public String getPassword() {
        return password;
    }

    public void doGetInfo(){
        System.out.println(name);
        System.out.println(password);
    }
    @Override
    public void afterPropertiesSet() throws Exception {
        if(null == name || "".equals(name)){
            name = "Admin";
        }
        if(null == password ||  "".equals(password)){
            password = "12345";
        }
    }
}
```

XML中配置，不赋值：

```
<bean id="login" class="com.wgs.spring.beanpostprocessordemo.Login"></bean>
```

（2）测试：

```
package com.wgs.spring.beanpostprocessordemo;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

/**
 * @author GenshenWang.nomico
 * @date 2017/11/23.
 */
RunWith(SpringJUnit4ClassRunner.class)
ContextConfiguration({"classpath:spring.xml"})
public class TestInitializingBean {

    @Test
    public void testInitializingBean(){
        ApplicationContext ctx = new ClassPathXmlApplicationContext("classpath:spring.xml");
        Login login = (Login) ctx.getBean("login");
        login.doGetInfo();
    }
}
```

输出结果：   
 Admin   
 12345

使用init-method：   
 Login 类不变，只是将afterPropertiesSet方法改为initMethod()方法：

```
package com.wgs.spring.beanpostprocessordemo;

import org.springframework.beans.factory.InitializingBean;

/**
 * @author GenshenWang.nomico
 * @date 2017/11/23.
 */
public class Login {
    private String name;
    private String password;

    public void setName(String name) {
        this.name = name;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public String getPassword() {
        return password;
    }

    public void doGetInfo(){
        System.out.println(name);
        System.out.println(password);
    }
    public void initMethod() {
        if(null == name || "".equals(name)){
            name = "Admin";
        }
        if(null == password ||  "".equals(password)){
            password = "12345";
        }
    }
}
```

XML中配置：

```
 <bean id="login" class="com.wgs.spring.beanpostprocessordemo.Login" init-method="initMethod"></bean>
```

**总结：**   
 1 Spring为bean提供了两种初始化bean的方式：

- 实现现InitializingBean接口，重写afterPropertiesSet方法，
- 在XML配置文件中通过init-method指定初始化方法；

2 实现InitializingBean接口是直接调用afterPropertiesSet方法，比通过反射调用init-method指定的方法效率相对来说要高点。但是init-method方式消除了对spring的依赖

3 如果调用afterPropertiesSet方法时出错，则不调用init-method指定的方法。

###### **（5）DisposableBean 和 destroy-method**

与InitializingBean接口类似，当Bean实现了DisposableBean 接口或者在XML中声明了destroy-method的指定方法，就会为该实例注册一个用于对象销毁的回调方法。在Spring容器关闭的时候，需要我们告知容器来执行对象的销毁方法。

**BeanFactory容器**   
 我们需要在合适的时机，调用ConfigurableListableBeanFactory的destroySingletons()方法来销毁容器中管理的所有singleton类型的对象实例；

```
 BeanFactory container = new XmlBeanFactory(new ClassPathResource("classpath:spring.xml"));
        ((ConfigurableListableBeanFactory)container).destroySingletons();
//应用程序退出，容器关闭
```

**ApplicationContext容器**   
 类似BeanFactory，但是AbstractApplicationContext为我们提供了registerShutdownhook()方法，该方法底层使用标准的Runtime类的addShutdownHook()方式来调用相应bean对象的销毁逻辑，从而保证在JVM退出之前，这些singleton类型的bean对象实例自定义销毁逻辑会被执行。

```
 BeanFactory container = new  ClassPathXmlApplicationContext("classpath:spring.xml");
        ((AbstractApplicationContext)container).registerShutdownHook();
//应用程序退出，容器关闭
```

至此，Bean的生命就结束了，Spring Ioc容器启动过程分析也到此结束，接下来我会从源码的角度来深入分析这个过程。