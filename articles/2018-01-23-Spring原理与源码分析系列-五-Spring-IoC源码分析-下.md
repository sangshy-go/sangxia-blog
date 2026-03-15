---
title: "Spring原理与源码分析系列（五）- Spring IoC源码分析（下）"
date: 2018-01-23
category: 后端开发
tags: []
---

### 0 前言

IoC容器主要分为两个阶段：IoC容器启动和依赖注入。   
 在上节   
  [Spring原理与源码分析系列（四）- Spring IoC源码分析（上）](http://blog.csdn.net/noaman_wgs/article/details/79138715) 我们已经从源码的角度分析了IoC容器的启动过程，本篇将要讲述依赖注入过程的源码分析。

### 二、IoC容器的依赖注入

在IoC容器的初始化完成后，就已经在容器内建立了BeanDefinition数据映射。   
 接下来就需要开始依赖注入了。

首先通过getBean()触发依赖注入这个过程，这个过程主要分为两个步骤：

- 1 Bean的对象实例化（Instantiate the Bean）：createBeanInstance（）；
- 2 对象关系的依赖注入：populate（）。

下面来看看具体的实现过程。   
 首先是用户调用getBean()方法，这个方法是依赖注入的入口，会触发依赖注入的过程。

**AbstractBeanFactory.java**

```
Override
    public Object getBean(String name) throws BeansException {
        return doGetBean(name, null, null, false);
    }

    @Override
    public <T> T getBean(String name, @Nullable Class<T> requiredType) throws BeansException {
        return doGetBean(name, requiredType, null, false);
    }

    @Override
    public Object getBean(String name, Object... args) throws BeansException {
        return doGetBean(name, null, args, false);
    }

    public <T> T getBean(String name, @Nullable Class<T> requiredType, @Nullable Object... args)
            throws BeansException {

        return doGetBean(name, requiredType, args, false);
    }
```

实际取得Bean的地方，也是依赖注入发生的地方：

**AbstractBeanFactory.java**

```
    //实际取得Bean的地方，触发依赖注入发生的地方
    protected <T> T doGetBean(final String name, @Nullable final Class<T> requiredType,
            @Nullable final Object[] args, boolean typeCheckOnly) throws BeansException {

        final String beanName = transformedBeanName(name);
        Object bean;

        // 先从缓存中取得Bean。如果是单例，就不需要再创建
        Object sharedInstance = getSingleton(beanName);
        if (sharedInstance != null && args == null) {
            if (logger.isDebugEnabled()) {
                if (isSingletonCurrentlyInCreation(beanName)) {
                    logger.debug("Returning eagerly cached instance of singleton bean '" + beanName +
                            "' that is not fully initialized yet - a consequence of a circular reference");
                }
                else {
                    logger.debug("Returning cached instance of singleton bean '" + beanName + "'");
                }
            }
            //完成FactoryBean的相关处理
            bean = getObjectForBeanInstance(sharedInstance, name, beanName, null);
        }

        else {
            // Fail if we're already creating this bean instance:
            // We're assumably within a circular reference.
            if (isPrototypeCurrentlyInCreation(beanName)) {
                throw new BeanCurrentlyInCreationException(beanName);
            }

            //检查IoC容器中beanName对应的BeanDefinition是否存在，如果当前容器不存在，
            // 则到双亲BeanFactory（parentBeanFactory）去寻找；
            //如果当前双亲BeanFactory不存在，就顺着双亲BeanFactory链一直向上查找
            // Check if bean definition exists in this factory.
            BeanFactory parentBeanFactory = getParentBeanFactory();
            if (parentBeanFactory != null && !containsBeanDefinition(beanName)) {
                // Not found -> check parent.
                String nameToLookup = originalBeanName(name);
                if (parentBeanFactory instanceof AbstractBeanFactory) {
                    return ((AbstractBeanFactory) parentBeanFactory).doGetBean(
                            nameToLookup, requiredType, args, typeCheckOnly);
                }
                else if (args != null) {
                    // 在双亲BeanFactory中查找
                    return (T) parentBeanFactory.getBean(nameToLookup, args);
                }
                else {
                    // No args -> delegate to standard getBean method.
                    return parentBeanFactory.getBean(nameToLookup, requiredType);
                }
            }

            if (!typeCheckOnly) {
                markBeanAsCreated(beanName);
            }

            try {
                //根据beanName取得BeanDefinition
                final RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
                checkMergedBeanDefinition(mbd, beanName, args);

                // 获得当前Bean的所有依赖Bean。触发getBean的递归调用
                String[] dependsOn = mbd.getDependsOn();
                if (dependsOn != null) {
                    for (String dep : dependsOn) {
                        if (isDependent(beanName, dep)) {
                            throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                                    "Circular depends-on relationship between '" + beanName + "' and '" + dep + "'");
                        }
                        registerDependentBean(dep, beanName);
                        getBean(dep);
                    }
                }

                // 在getSingleton调用ObjectFactory中的createBean（），创建Singleton Bean的实例
                if (mbd.isSingleton()) {
                    sharedInstance = getSingleton(beanName, () -> {
                        try {
                            //触发Bean的创建
                            return createBean(beanName, mbd, args);
                        }
                        catch (BeansException ex) {
                            // Explicitly remove instance from singleton cache: It might have been put there
                            // eagerly by the creation process, to allow for circular reference resolution.
                            // Also remove any beans that received a temporary reference to the bean.
                            destroySingleton(beanName);
                            throw ex;
                        }
                    });
                    bean = getObjectForBeanInstance(sharedInstance, name, beanName, mbd);
                }
                //创建Prototype Bean的实例
                else if (mbd.isPrototype()) {
                    // It's a prototype -> create a new instance.
                    Object prototypeInstance = null;
                    try {
                        beforePrototypeCreation(beanName);
                        //触发Bean的创建
                        prototypeInstance = createBean(beanName, mbd, args);
                    }
                    finally {
                        afterPrototypeCreation(beanName);
                    }
                    bean = getObjectForBeanInstance(prototypeInstance, name, beanName, mbd);
                }
                //获取指定Scope类型的Bean
                else {
                    String scopeName = mbd.getScope();
                    final Scope scope = this.scopes.get(scopeName);
                    if (scope == null) {
                        throw new IllegalStateException("No Scope registered for scope name '" + scopeName + "'");
                    }
                    try {
                        Object scopedInstance = scope.get(beanName, () -> {
                            beforePrototypeCreation(beanName);
                            try {
                                //触发Bean的创建
                                return createBean(beanName, mbd, args);
                            }
                            finally {
                                afterPrototypeCreation(beanName);
                            }
                        });
                        bean = getObjectForBeanInstance(scopedInstance, name, beanName, mbd);
                    }
                    catch (IllegalStateException ex) {
                        throw new BeanCreationException(beanName,
                                "Scope '" + scopeName + "' is not active for the current thread; consider " +
                                "defining a scoped proxy for this bean if you intend to refer to it from a singleton",
                                ex);
                    }
                }
            }
            catch (BeansException ex) {
                cleanupAfterBeanCreationFailure(beanName);
                throw ex;
            }
        }

        // 对创建的Bean进行类型检查。如果没有问题，则返回新创建的Bean。这个Bean已经包含了依赖关系
        if (requiredType != null && !requiredType.isInstance(bean)) {
            try {
                T convertedBean = getTypeConverter().convertIfNecessary(bean, requiredType);
                if (convertedBean == null) {
                    throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
                }
                return convertedBean;
            }
            catch (TypeMismatchException ex) {
                if (logger.isDebugEnabled()) {
                    logger.debug("Failed to convert bean '" + name + "' to required type '" +
                            ClassUtils.getQualifiedName(requiredType) + "'", ex);
                }
                throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
            }
        }
        return (T) bean;
    }
```

可以看到，在用户调用getBean()方法后，会调用doGetBean()方法，然后再调用createBean()方法进行Bean的创建以及依赖注入过程。   
 接下来我们就来看 看Bean是如何被创建以及对象关系的依赖注入的。

#### 1 Bean的对象实例化（Instantiate the Bean）

当调用createBean()方法时，会进入   
 AbstractAutowireCapableBeanFactory中。

**AbstractAutowireCapableBeanFactory.java**

```
    @Override
    protected Object createBean(String beanName, RootBeanDefinition mbd, @Nullable Object[] args)
            throws BeanCreationException {

        if (logger.isDebugEnabled()) {
            logger.debug("Creating instance of bean '" + beanName + "'");
        }
        RootBeanDefinition mbdToUse = mbd;

        // 判断需要创建的Bean是否可以实例化（接口不能被实例化）以及该类能否被类加载器加载
        Class<?> resolvedClass = resolveBeanClass(mbd, beanName);
        if (resolvedClass != null && !mbd.hasBeanClass() && mbd.getBeanClassName() != null) {
            mbdToUse = new RootBeanDefinition(mbd);
            mbdToUse.setBeanClass(resolvedClass);
        }

        // Prepare method overrides.
        try {
            mbdToUse.prepareMethodOverrides();
        }
        catch (BeanDefinitionValidationException ex) {
            throw new BeanDefinitionStoreException(mbdToUse.getResourceDescription(),
                    beanName, "Validation of method overrides failed", ex);
        }

        try {
            // 如果Bean配置了BeanPostProcessors，则返回一个proxy
            Object bean = resolveBeforeInstantiation(beanName, mbdToUse);
            if (bean != null) {
                return bean;
            }
        }
        catch (Throwable ex) {
            throw new BeanCreationException(mbdToUse.getResourceDescription(), beanName,
                    "BeanPostProcessor before instantiation of bean failed", ex);
        }

        try {
            //这里是调用真正创建Bean的地方
            Object beanInstance = doCreateBean(beanName, mbdToUse, args);
            if (logger.isDebugEnabled()) {
                logger.debug("Finished creating instance of bean '" + beanName + "'");
            }
            return beanInstance;
        }
        catch (BeanCreationException ex) {
            // A previously detected exception with proper bean creation context already...
            throw ex;
        }
        catch (ImplicitlyAppearedSingletonException ex) {
            // An IllegalStateException to be communicated up to DefaultSingletonBeanRegistry...
            throw ex;
        }
        catch (Throwable ex) {
            throw new BeanCreationException(
                    mbdToUse.getResourceDescription(), beanName, "Unexpected exception during bean creation", ex);
        }
    }
```

在createBean（）中，调用doCreateBean（）来具体创建Bean。

进入doCreateBean（），来看看真正创建Bean的地方：   
 **AbstractAutowireCapableBeanFactory.java**

```
    protected Object doCreateBean(final String beanName, final RootBeanDefinition mbd, final @Nullable Object[] args)
            throws BeanCreationException {

        // Bean的实例化（Instantiate）
        //BeanWrapper是用来持有创建出来的Bean对象的
        BeanWrapper instanceWrapper = null;
        if (mbd.isSingleton()) {
            //如果是Singleton，先把缓存中的同名Bean清除
            instanceWrapper = this.factoryBeanInstanceCache.remove(beanName);
        }
        if (instanceWrapper == null) {
            //这里是创建Bean的地方：createBeanInstance（）
            instanceWrapper = createBeanInstance(beanName, mbd, args);
        }
        final Object bean = instanceWrapper.getWrappedInstance();
        Class<?> beanType = instanceWrapper.getWrappedClass();
        if (beanType != NullBean.class) {
            mbd.resolvedTargetType = beanType;
        }

        // Allow post-processors to modify the merged bean definition.
        synchronized (mbd.postProcessingLock) {
            if (!mbd.postProcessed) {
                try {
                    applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName);
                }
                catch (Throwable ex) {
                    throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                            "Post-processing of merged bean definition failed", ex);
                }
                mbd.postProcessed = true;
            }
        }

        // Eagerly cache singletons to be able to resolve circular references
        // even when triggered by lifecycle interfaces like BeanFactoryAware.
        boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
                isSingletonCurrentlyInCreation(beanName));
        if (earlySingletonExposure) {
            if (logger.isDebugEnabled()) {
                logger.debug("Eagerly caching bean '" + beanName +
                        "' to allow for resolving potential circular references");
            }
            addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
        }

        // 对Bean的初始化，依赖注入一般发生在这里。
        Object exposedObject = bean;
        try {
            //populateBean：对象间依赖关系的处理
            populateBean(beanName, mbd, instanceWrapper);
            //initializeBean：Bean的初始化
            exposedObject = initializeBean(beanName, exposedObject, mbd);
        }
        catch (Throwable ex) {
            if (ex instanceof BeanCreationException && beanName.equals(((BeanCreationException) ex).getBeanName())) {
                throw (BeanCreationException) ex;
            }
            else {
                throw new BeanCreationException(
                        mbd.getResourceDescription(), beanName, "Initialization of bean failed", ex);
            }
        }

        if (earlySingletonExposure) {
            Object earlySingletonReference = getSingleton(beanName, false);
            if (earlySingletonReference != null) {
                if (exposedObject == bean) {
                    exposedObject = earlySingletonReference;
                }
                else if (!this.allowRawInjectionDespiteWrapping && hasDependentBean(beanName)) {
                    String[] dependentBeans = getDependentBeans(beanName);
                    Set<String> actualDependentBeans = new LinkedHashSet<>(dependentBeans.length);
                    for (String dependentBean : dependentBeans) {
                        if (!removeSingletonIfCreatedForTypeCheckOnly(dependentBean)) {
                            actualDependentBeans.add(dependentBean);
                        }
                    }
                    if (!actualDependentBeans.isEmpty()) {
                        throw new BeanCurrentlyInCreationException(beanName,
                                "Bean with name '" + beanName + "' has been injected into other beans [" +
                                StringUtils.collectionToCommaDelimitedString(actualDependentBeans) +
                                "] in its raw version as part of a circular reference, but has eventually been " +
                                "wrapped. This means that said other beans do not use the final version of the " +
                                "bean. This is often the result of over-eager type matching - consider using " +
                                "'getBeanNamesOfType' with the 'allowEagerInit' flag turned off, for example.");
                    }
                }
            }
        }

        // Register bean as disposable.
        try {
            registerDisposableBeanIfNecessary(beanName, bean, mbd);
        }
        catch (BeanDefinitionValidationException ex) {
            throw new BeanCreationException(
                    mbd.getResourceDescription(), beanName, "Invalid destruction signature", ex);
        }

        return exposedObject;
    }
```

在这个方法中，有两个重要方法调用需要关注：

- **createBeanInstance（）**：对Bean包含的对象进行实例化的地方，返回的是一个BeanWrapper（为什么返回的BeanWrapper而不是Bean，是因为BeanWrapper方便后续对Bean的设值操作）；
- **populateBean（）**：Bean创建后，需要进行对象间的依赖关系的处理。

**AbstractAutowireCapableBeanFactory.java**

```
//  Bean包含的Java对象的生成，有3种方法：工厂方法，构造器函数实例化，默认构造函数实例化（SimpleInstantiationStrategy提供了反射和CGLIB两种方式）
    protected BeanWrapper createBeanInstance(String beanName, RootBeanDefinition mbd, @Nullable Object[] args) {
        // 看Bean能否实例化（接口不能被实例化）
        Class<?> beanClass = resolveBeanClass(mbd, beanName);

        if (beanClass != null && !Modifier.isPublic(beanClass.getModifiers()) && !mbd.isNonPublicAccessAllowed()) {
            throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                    "Bean class isn't public, and non-public access not allowed: " + beanClass.getName());
        }

        Supplier<?> instanceSupplier = mbd.getInstanceSupplier();
        if (instanceSupplier != null) {
            return obtainFromSupplier(instanceSupplier, beanName);
        }

        if (mbd.getFactoryMethodName() != null)  {
            //使用工厂方法实例化
            return instantiateUsingFactoryMethod(beanName, mbd, args);
        }

        // Shortcut when re-creating the same bean...
        boolean resolved = false;
        boolean autowireNecessary = false;
        if (args == null) {
            synchronized (mbd.constructorArgumentLock) {
                if (mbd.resolvedConstructorOrFactoryMethod != null) {
                    resolved = true;
                    autowireNecessary = mbd.constructorArgumentsResolved;
                }
            }
        }
        if (resolved) {
            if (autowireNecessary) {
                return autowireConstructor(beanName, mbd, null, null);
            }
            else {
                return instantiateBean(beanName, mbd);
            }
        }

        //使用构造函数进行实例化
        Constructor<?>[] ctors = determineConstructorsFromBeanPostProcessors(beanClass, beanName);
        if (ctors != null ||
                mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_CONSTRUCTOR ||
                mbd.hasConstructorArgumentValues() || !ObjectUtils.isEmpty(args))  {
            return autowireConstructor(beanName, mbd, ctors, args);
        }

        //使用默认构造函数对Bean实例化(using default constructor)
        return instantiateBean(beanName, mbd);
    }
```

这个过程主要是Bean包含对象的实例化的生成，主要有3种方法：

- 工厂方法
- 构造器函数实例化
- 默认构造函数实例化（提供了反射和CGLIB两种方法）

其中，instantiateBean（）是最常见的Bean实例化的方法。

**AbstractAutowireCapableBeanFactory.java**

```
    /**
     * Instantiate the given bean using its default constructor.
     * @param beanName the name of the bean
     * @param mbd the bean definition for the bean
     * @return a BeanWrapper for the new instance
     */
    protected BeanWrapper instantiateBean(final String beanName, final RootBeanDefinition mbd) {
        try {
            Object beanInstance;
            final BeanFactory parent = this;
            if (System.getSecurityManager() != null) {
                beanInstance = AccessController.doPrivileged((PrivilegedAction<Object>) () ->
                        getInstantiationStrategy().instantiate(mbd, beanName, parent),
                        getAccessControlContext());
            }
            else {
                //使用默认的实例化策略，默认采用的是CglibSubclassingInstantiationStrategy，即CGLIB对Bean进行实例化
                beanInstance = getInstantiationStrategy().instantiate(mbd, beanName, parent);
            }
            //实例化后，返回对应的BeanWrapper类
            BeanWrapper bw = new BeanWrapperImpl(beanInstance);
            initBeanWrapper(bw);
            return bw;
        }
        catch (Throwable ex) {
            throw new BeanCreationException(
                    mbd.getResourceDescription(), beanName, "Instantiation of bean failed", ex);
        }
    }
```

上面采用的是默认构造函数的实例化。在这个过程中：

```
beanInstance = getInstantiationStrategy().instantiate(mbd, beanName, parent);
```

getInstantiationStrategy()默认返回的 是CglibSubclassingInstantiationStrategy，即默认使用CGLIB对Bean进行实例化。

**AbstractAutowireCapableBeanFactory.java**

```
//返回的instantiationStrategy默认是CglibSubclassingInstantiationStrategy
protected InstantiationStrategy getInstantiationStrategy() {
        return this.instantiationStrategy;
    }

private InstantiationStrategy instantiationStrategy = new CglibSubclassingInstantiationStrategy();
```

CglibSubclassingInstantiationStrategy继承了SimpleInstantiationStrategy类，所以在了解CGLIB是如何实例化Bean对象的时候，我们首先进入SimpleInstantiationStrategy类中看看这个实例化策略提供了哪些策略。

**SimpleInstantiationStrategy.java**

```
    @Override
    public Object instantiate(RootBeanDefinition bd, @Nullable String beanName, BeanFactory owner) {
        // Don't override the class with CGLIB if no overrides.
        if (!bd.hasMethodOverrides()) {
            Constructor<?> constructorToUse;
            synchronized (bd.constructorArgumentLock) {
                //这里取得指定的构造器或者对象的工厂方法来对Bean进行实例化
                constructorToUse = (Constructor<?>) bd.resolvedConstructorOrFactoryMethod;
                if (constructorToUse == null) {
                    final Class<?> clazz = bd.getBeanClass();
                    if (clazz.isInterface()) {
                        throw new BeanInstantiationException(clazz, "Specified class is an interface");
                    }
                    try {
                        if (System.getSecurityManager() != null) {
                            constructorToUse = AccessController.doPrivileged(
                                    (PrivilegedExceptionAction<Constructor<?>>) () -> clazz.getDeclaredConstructor());
                        }
                        else {
                            constructorToUse =  clazz.getDeclaredConstructor();
                        }
                        bd.resolvedConstructorOrFactoryMethod = constructorToUse;
                    }
                    catch (Throwable ex) {
                        throw new BeanInstantiationException(clazz, "No default constructor found", ex);
                    }
                }
            }
            //使用BeanUtils（反射）进行Bean的实例化，具体调用时通过构造器来实例化Bean的
            return BeanUtils.instantiateClass(constructorToUse);
        }
        else {
            // 使用Cglib进行Bean的实例化
            return instantiateWithMethodInjection(bd, beanName, owner);
        }
    }
```

SimpleInstantiationStrategy是Spring生成Bean对象的默认类。类中提供了两种实例化Bean对象的方法：

- BeanUtils（使用了JVM的反射）
- CGLIB

下面看看这两个实例化Bean对象方法是如何实现的：

**BeanUtils**   
 通过   
 `return BeanUtils.instantiateClass(constructorToUse);`   
 进入BeanUtils类中的instantiateClass（）方法。

**BeanUtils.java**

```
    /**
     * Convenience method to instantiate a class using the given constructor.
     * <p>Note that this method tries to set the constructor accessible if given a
     * non-accessible (that is, non-public) constructor, and supports Kotlin classes
     * with optional parameters and default values.
     * @param ctor the constructor to instantiate
     * @param args the constructor arguments to apply (use {@code null} for an unspecified
     * parameter if needed for Kotlin classes with optional parameters and default values)
     * @return the new instance
     * @throws BeanInstantiationException if the bean cannot be instantiated
     * @see Constructor#newInstance
     */
    public static <T> T instantiateClass(Constructor<T> ctor, Object... args) throws BeanInstantiationException {
        Assert.notNull(ctor, "Constructor must not be null");
        try {
            //ReflectionUtils：使用反射，调用构造函数创建运行时对象
            ReflectionUtils.makeAccessible(ctor);
            //（Kotlin？WTF，此处是比较新的源码了。。。）调用的ctor.newInstance(args)，即使用构造函数
            return (KotlinDetector.isKotlinType(ctor.getDeclaringClass()) ?
                    KotlinDelegate.instantiateClass(ctor, args) : ctor.newInstance(args));
        }
        catch (InstantiationException ex) {
            throw new BeanInstantiationException(ctor, "Is it an abstract class?", ex);
        }
        catch (IllegalAccessException ex) {
            throw new BeanInstantiationException(ctor, "Is the constructor accessible?", ex);
        }
        catch (IllegalArgumentException ex) {
            throw new BeanInstantiationException(ctor, "Illegal arguments for constructor", ex);
        }
        catch (InvocationTargetException ex) {
            throw new BeanInstantiationException(ctor, "Constructor threw exception", ex.getTargetException());
        }
    }
```

可以看到，BeanUtils采用的是反射调用构造函数来创建Bean对象。

**CGLIB**   
 再进入CglibSubclassingInstantiationStrategy类，看看CGLIB是如何进行Bean实例化的。

**CglibSubclassingInstantiationStrategy.java**

```
        public Object instantiate(@Nullable Constructor<?> ctor, @Nullable Object... args) {
            //使用Enhancer生成字节码
            Class<?> subclass = createEnhancedSubclass(this.beanDefinition);
            Object instance;
            // 没传构造方法，直接实例化
            if (ctor == null) {
                instance = BeanUtils.instantiateClass(subclass);
            }
            else {
                try {
                    // 实例化对象
                    Constructor<?> enhancedSubclassConstructor = subclass.getConstructor(ctor.getParameterTypes());
                    instance = enhancedSubclassConstructor.newInstance(args);
                }
                catch (Exception ex) {
                    throw new BeanInstantiationException(this.beanDefinition.getBeanClass(),
                            "Failed to invoke constructor for CGLIB enhanced subclass [" + subclass.getName() + "]", ex);
                }
            }
            // SPR-10785: set callbacks directly on the instance instead of in the
            // enhanced class (via the Enhancer) in order to avoid memory leaks.
            Factory factory = (Factory) instance;
            factory.setCallbacks(new Callback[] {NoOp.INSTANCE,
                    new LookupOverrideMethodInterceptor(this.beanDefinition, this.owner),
                    new ReplaceOverrideMethodInterceptor(this.beanDefinition, this.owner)});
            return instance;
        }

        //生成Enhancer对象，并为Enhancer对象设置上生成Java对象的参数，如基类，回调方法等
        private Class<?> createEnhancedSubclass(RootBeanDefinition beanDefinition) {
            Enhancer enhancer = new Enhancer();
            enhancer.setSuperclass(beanDefinition.getBeanClass());
            enhancer.setNamingPolicy(SpringNamingPolicy.INSTANCE);
            if (this.owner instanceof ConfigurableBeanFactory) {
                ClassLoader cl = ((ConfigurableBeanFactory) this.owner).getBeanClassLoader();
                enhancer.setStrategy(new ClassLoaderAwareGeneratorStrategy(cl));
            }
            enhancer.setCallbackFilter(new MethodOverrideCallbackFilter(beanDefinition));
            enhancer.setCallbackTypes(CALLBACK_TYPES);
            return enhancer.createClass();
        }
    }
```

走到这一步，Bean创建及实例化的过程就已经结束。Bean对象生成后，需要把这些Bean对象的依赖关系设置好，完成整个依赖注入的过程。这就需要用的populate（）方法。

#### 2 对象关系的依赖注入

在类AbstractAutowireCapableBeanFactory的doCreateBean（）方法中，我们接触过populateBean（）方法：

**AbstractAutowireCapableBeanFactory.java**

```
//对Bean的初始化，依赖注入一般发生在这里。
Object exposedObject = bean;
try {
    //populateBean：对象间依赖关系的处理
    populateBean(beanName, mbd, instanceWrapper);
    //initializeBean：Bean的初始化
    exposedObject = initializeBean(beanName, exposedObject, mbd);
}
```

现在进入populateBean方法中看下具体的实现：

populateBean():   
 **AbstractAutowireCapableBeanFactory.java**

```
    protected void populateBean(String beanName, RootBeanDefinition mbd, @Nullable BeanWrapper bw) {
        if (bw == null) {
            if (mbd.hasPropertyValues()) {
                throw new BeanCreationException(
                        mbd.getResourceDescription(), beanName, "Cannot apply property values to null instance");
            }
            else {
                // //若实例对象为null 且属性值为空，跳过。Skip property population phase for null instance.
                return;
            }
        }

        boolean continueWithPropertyPopulation = true;
        //调用Bean的后置处理器:BeanPostProcessor
        if (!mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {
            for (BeanPostProcessor bp : getBeanPostProcessors()) {
                if (bp instanceof InstantiationAwareBeanPostProcessor) {
                    InstantiationAwareBeanPostProcessor ibp = (InstantiationAwareBeanPostProcessor) bp;
                    if (!ibp.postProcessAfterInstantiation(bw.getWrappedInstance(), beanName)) {
                        continueWithPropertyPopulation = false;
                        break;
                    }
                }
            }
        }

        if (!continueWithPropertyPopulation) {
            return;
        }

        //获取容器在解析Bean定义的时候的属性值
        PropertyValues pvs = (mbd.hasPropertyValues() ? mbd.getPropertyValues() : null);

        //根据XML设置的autowire来进行依赖注入。注这里的autowire与注解@Autowire是不同的
        if (mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_NAME ||
                mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_TYPE) {
            MutablePropertyValues newPvs = new MutablePropertyValues(pvs);

            // AUTOWIRE_BY_NAME：根据Bean name 和 setter自动装配
            if (mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_NAME) {
                autowireByName(beanName, mbd, bw, newPvs);
            }

            // AUTOWIRE_BY_TYPE：根据Bean type自动装配
            if (mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_TYPE) {
                autowireByType(beanName, mbd, bw, newPvs);
            }

            pvs = newPvs;
        }

        boolean hasInstAwareBpps = hasInstantiationAwareBeanPostProcessors();
        boolean needsDepCheck = (mbd.getDependencyCheck() != RootBeanDefinition.DEPENDENCY_CHECK_NONE);

        if (hasInstAwareBpps || needsDepCheck) {
            if (pvs == null) {
                pvs = mbd.getPropertyValues();
            }
            PropertyDescriptor[] filteredPds = filterPropertyDescriptorsForDependencyCheck(bw, mbd.allowCaching);
            if (hasInstAwareBpps) {
                for (BeanPostProcessor bp : getBeanPostProcessors()) {
                    if (bp instanceof InstantiationAwareBeanPostProcessor) {
                        InstantiationAwareBeanPostProcessor ibp = (InstantiationAwareBeanPostProcessor) bp;
                        pvs = ibp.postProcessPropertyValues(pvs, filteredPds, bw.getWrappedInstance(), beanName);
                        if (pvs == null) {
                            return;
                        }
                    }
                }
            }
            if (needsDepCheck) {
                checkDependencies(beanName, mbd, filteredPds, pvs);
            }
        }

        if (pvs != null) {
            //这里是对属性进行注入的地方
            applyPropertyValues(beanName, mbd, bw, pvs);
        }
    }
```

根据上面代码可以看到，在populateBean（）方法中，首先要用ean的后置处理器:BeanPostProcessor对Bean进行处理，然后获取Bean的所有属性值，如果在XML配置文件中配置有`autowire="byName/byType"`项，就调用   
 `autowireByName(beanName, mbd, bw, newPvs);`   
 和   
 `autowireByType(beanName, mbd, bw, newPvs);`    
 对其依赖注入。注意，这里的`AUTOWIRE`是配置文件中的，与注解@Autowire是不同的。由于不推荐在配置文件中使用`autowire="byName/byType"`， 所以也不分析这两个方法`autowireByType`和`autowireByName`。

接着就调用applyPropertyValues()方法对属性进行注入：

**AbstractAutowireCapableBeanFactory.java**

```
    protected void applyPropertyValues(String beanName, BeanDefinition mbd, BeanWrapper bw, PropertyValues pvs) {
        //pvs就是获取的属性值
        if (pvs.isEmpty()) {
            return;
        }
        //用MutablePropertyValues封装属性值
        MutablePropertyValues mpvs = null;
        List<PropertyValue> original;

        if (System.getSecurityManager() != null) {
            if (bw instanceof BeanWrapperImpl) {
                ((BeanWrapperImpl) bw).setSecurityContext(getAccessControlContext());
            }
        }

        if (pvs instanceof MutablePropertyValues) {
            mpvs = (MutablePropertyValues) pvs;
            //如果mpvs已经转换过，就直接进行属性注入
            if (mpvs.isConverted()) {
                // Shortcut: use the pre-converted values as-is.
                try {
                    //属性注入,稍后分析这个过程
                    bw.setPropertyValues(mpvs);
                    return;
                }
                catch (BeansException ex) {
                    throw new BeanCreationException(
                            mbd.getResourceDescription(), beanName, "Error setting property values", ex);
                }
            }
            original = mpvs.getPropertyValueList();
        }
        else {
            original = Arrays.asList(pvs.getPropertyValues());
        }

        //需要转换属性，获取自定义转换
        TypeConverter converter = getCustomTypeConverter();
        if (converter == null) {
            converter = bw;
        }
        //创建属性解析器，对属性进行解析
        BeanDefinitionValueResolver valueResolver = new BeanDefinitionValueResolver(this, beanName, mbd, converter);

        // 为属性的解析值创建一个拷贝，将拷贝的数据注入到实例对象中
        List<PropertyValue> deepCopy = new ArrayList<>(original.size());
        boolean resolveNecessary = false;
        for (PropertyValue pv : original) {
            //不需要转换
            if (pv.isConverted()) {
                deepCopy.add(pv);
            }
            else {
                String propertyName = pv.getName();
                //原始值
                Object originalValue = pv.getValue();
                //转换后的值：resolveValueIfNecessary这个就是解析
                Object resolvedValue = valueResolver.resolveValueIfNecessary(pv, originalValue);
                Object convertedValue = resolvedValue;
                boolean convertible = bw.isWritableProperty(propertyName) &&
                        !PropertyAccessorUtils.isNestedOrIndexedProperty(propertyName);
                if (convertible) {
                    convertedValue = convertForProperty(resolvedValue, propertyName, bw, converter);
                }
                // Possibly store converted value in merged bean definition,
                // in order to avoid re-conversion for every created bean instance.
                if (resolvedValue == originalValue) {
                    if (convertible) {
                        pv.setConvertedValue(convertedValue);
                    }
                    deepCopy.add(pv);
                }
                else if (convertible && originalValue instanceof TypedStringValue &&
                        !((TypedStringValue) originalValue).isDynamic() &&
                        !(convertedValue instanceof Collection || ObjectUtils.isArray(convertedValue))) {
                    pv.setConvertedValue(convertedValue);
                    deepCopy.add(pv);
                }
                else {
                    resolveNecessary = true;
                    deepCopy.add(new PropertyValue(pv, convertedValue));
                }
            }
        }
        if (mpvs != null && !resolveNecessary) {
            mpvs.setConverted();
        }

        // Set our (possibly massaged) deep copy.
        try {
            //将转换后的拷贝的数据注入到对象当中
            bw.setPropertyValues(new MutablePropertyValues(deepCopy));
        }
        catch (BeansException ex) {
            throw new BeanCreationException(
                    mbd.getResourceDescription(), beanName, "Error setting property values", ex);
        }
    }
```

在applyPropertyValues()方法中，首先看属性是否已经是符合注入标准的类型MutablePropertyValues，如果是就直接开始注入。否则，需要调用resolveValueIfNecessary（）方法对属性进行解析。   
 什么时候需要解析？

```
<bean id="" class="">
    <property name="" ref=""/>
    <property name="">
        <props></..>
    </property >
    <property name="">
        <list></..>
    </property >
</bean>
```

当配置文件的Bean的属性中有ref，props，list，map等属性时需要调用resolveValueIfNecessary（）对各种属性进行解析。之前在BeanDefinition载入和解析过程中分析这个过程，如果Bean有ref，list,map等属性的时候，需要解析成对应的RuntimeBeanReference，MangedList，MangedMap等数据结构。现在需要再解析回去。

让我们看看resolveValueIfNecessary（）是如何将RuntimeBeanReference，MangedList，MangedMap等数据结构解析成Spring能够认识的内部结构的。

**BeanDefinitionValueResolver.java**

```
    @Nullable
    public Object resolveValueIfNecessary(Object argName, @Nullable Object value) {
        //对引用的类型的属性进行解析，对应ref属性
        if (value instanceof RuntimeBeanReference) {
            RuntimeBeanReference ref = (RuntimeBeanReference) value;
            return resolveReference(argName, ref);
        }
        //对引用另一个Bean的解析
        else if (value instanceof RuntimeBeanNameReference) {
            String refName = ((RuntimeBeanNameReference) value).getBeanName();
            refName = String.valueOf(doEvaluate(refName));
            if (!this.beanFactory.containsBean(refName)) {
                throw new BeanDefinitionStoreException(
                        "Invalid bean name '" + refName + "' in bean reference for " + argName);
            }
            return refName;
        }
        //对Bean类型属性的解析，主要是Bean中的内部类
        else if (value instanceof BeanDefinitionHolder) {
            // Resolve BeanDefinitionHolder: contains BeanDefinition with name and aliases.
            BeanDefinitionHolder bdHolder = (BeanDefinitionHolder) value;
            return resolveInnerBean(argName, bdHolder.getBeanName(), bdHolder.getBeanDefinition());
        }
        else if (value instanceof BeanDefinition) {
            // Resolve plain BeanDefinition, without contained name: use dummy name.
            BeanDefinition bd = (BeanDefinition) value;
            String innerBeanName = "(inner bean)" + BeanFactoryUtils.GENERATED_BEAN_NAME_SEPARATOR +
                    ObjectUtils.getIdentityHexString(bd);
            return resolveInnerBean(argName, innerBeanName, bd);
        }
        //对集合数组类型（Array）的属性解析
        else if (value instanceof ManagedArray) {
            // May need to resolve contained runtime references.
            ManagedArray array = (ManagedArray) value;
            Class<?> elementType = array.resolvedElementType;
            if (elementType == null) {
                String elementTypeName = array.getElementTypeName();
                if (StringUtils.hasText(elementTypeName)) {
                    try {
                        elementType = ClassUtils.forName(elementTypeName, this.beanFactory.getBeanClassLoader());
                        array.resolvedElementType = elementType;
                    }
                    catch (Throwable ex) {
                        // Improve the message by showing the context.
                        throw new BeanCreationException(
                                this.beanDefinition.getResourceDescription(), this.beanName,
                                "Error resolving array type for " + argName, ex);
                    }
                }
                else {
                    elementType = Object.class;
                }
            }
            return resolveManagedArray(argName, (List<?>) value, elementType);
        }
        //对List类型的属性解析
        else if (value instanceof ManagedList) {
            // May need to resolve contained runtime references.
            return resolveManagedList(argName, (List<?>) value);
        }
        //对Set类型的属性解析
        else if (value instanceof ManagedSet) {
            // May need to resolve contained runtime references.
            return resolveManagedSet(argName, (Set<?>) value);
        }
        //对Map类型的属性解析
        else if (value instanceof ManagedMap) {
            // May need to resolve contained runtime references.
            return resolveManagedMap(argName, (Map<?, ?>) value);
        }
        //对Properties类型的属性解析
        else if (value instanceof ManagedProperties) {
            Properties original = (Properties) value;
            Properties copy = new Properties();
            original.forEach((propKey, propValue) -> {
                if (propKey instanceof TypedStringValue) {
                    propKey = evaluate((TypedStringValue) propKey);
                }
                if (propValue instanceof TypedStringValue) {
                    propValue = evaluate((TypedStringValue) propValue);
                }
                if (propKey == null || propValue == null) {
                    throw new BeanCreationException(
                            this.beanDefinition.getResourceDescription(), this.beanName,
                            "Error converting Properties key/value pair for " + argName + ": resolved to null");
                }
                copy.put(propKey, propValue);
            });
            return copy;
        }
        //对String类型的属性解析
        else if (value instanceof TypedStringValue) {
            // Convert value to target type here.
            TypedStringValue typedStringValue = (TypedStringValue) value;
            Object valueObject = evaluate(typedStringValue);
            try {
                Class<?> resolvedTargetType = resolveTargetType(typedStringValue);
                if (resolvedTargetType != null) {
                    return this.typeConverter.convertIfNecessary(valueObject, resolvedTargetType);
                }
                else {
                    return valueObject;
                }
            }
            catch (Throwable ex) {
                // Improve the message by showing the context.
                throw new BeanCreationException(
                        this.beanDefinition.getResourceDescription(), this.beanName,
                        "Error converting typed String value for " + argName, ex);
            }
        }
        else if (value instanceof NullBean) {
            return null;
        }
        else {
            return evaluate(value);
        }
    }
```

其中，我们可以看看对引用类型和List类型是如何解析的：

**BeanDefinitionValueResolver.java**

```
    @Nullable
    private Object resolveReference(Object argName, RuntimeBeanReference ref) {
        try {
            //从RuntimeBeanReference获取refrence名字，RuntimeBeanReference是在BeanDefinition根据配置生成的
            Object bean;
            String refName = ref.getBeanName();
            refName = String.valueOf(doEvaluate(refName));
            //如果ref是在双亲IoC容器中，就在双亲IoC容器中查找
            if (ref.isToParent()) {
                if (this.beanFactory.getParentBeanFactory() == null) {
                    throw new BeanCreationException(
                            this.beanDefinition.getResourceDescription(), this.beanName,
                            "Can't resolve reference to bean '" + refName +
                            "' in parent factory: no parent factory available");
                }
                //在当前容器查找
                bean = this.beanFactory.getParentBeanFactory().getBean(refName);
            }
            else {
                //触发依赖注入的发生
                bean = this.beanFactory.getBean(refName);
                this.beanFactory.registerDependentBean(refName, this.beanName);
            }
            if (bean instanceof NullBean) {
                bean = null;
            }
            return bean;
        }
        catch (BeansException ex) {
            throw new BeanCreationException(
                    this.beanDefinition.getResourceDescription(), this.beanName,
                    "Cannot resolve reference to bean '" + ref.getBeanName() + "' while setting " + argName, ex);
        }
    }
```

**BeanDefinitionValueResolver.java**

```
    private List<?> resolveManagedList(Object argName, List<?> ml) {
        List<Object> resolved = new ArrayList<>(ml.size());
        for (int i = 0; i < ml.size(); i++) {
            //递归，对List元素进行解析
            resolved.add(
                    resolveValueIfNecessary(new KeyedArgName(argName, i), ml.get(i)));
        }
        return resolved;
    }
```

其余的解析过程与上类似，在此不一一解释。

在完成上述步骤后，就已经解析完了Bean中property元素的值，然后就进行依赖注入的过程。

setPropertyValues():属性注入到对象中

**AbstractPropertyAccessor.java**

```
    @Override
    public void setPropertyValues(PropertyValues pvs, boolean ignoreUnknown, boolean ignoreInvalid)
            throws BeansException {

        List<PropertyAccessException> propertyAccessExceptions = null;
        //得到属性列表
        List<PropertyValue> propertyValues = (pvs instanceof MutablePropertyValues ?
                ((MutablePropertyValues) pvs).getPropertyValueList() : Arrays.asList(pvs.getPropertyValues()));
        for (PropertyValue pv : propertyValues) {
            try {
                // 这里是属性注入的地方
                setPropertyValue(pv);
            }
            catch (NotWritablePropertyException ex) {
                if (!ignoreUnknown) {
                    throw ex;
                }
                // Otherwise, just ignore it and continue...
            }
            catch (NullValueInNestedPathException ex) {
                if (!ignoreInvalid) {
                    throw ex;
                }
                // Otherwise, just ignore it and continue...
            }
            catch (PropertyAccessException ex) {
                if (propertyAccessExceptions == null) {
                    propertyAccessExceptions = new LinkedList<>();
                }
                propertyAccessExceptions.add(ex);
            }
        }
        // If we encountered individual exceptions, throw the composite exception.
        if (propertyAccessExceptions != null) {
            PropertyAccessException[] paeArray =
                    propertyAccessExceptions.toArray(new PropertyAccessException[propertyAccessExceptions.size()]);
            throw new PropertyBatchUpdateException(paeArray);
        }
    }
```

上面代码中可以看到，先得到Bean相关的所有属性列表：   
 `List<PropertyValue> propertyValues = (pvs instanceof MutablePropertyValues ?   
 ((MutablePropertyValues) pvs).getPropertyValueList() : Arrays.asList(pvs.getPropertyValues()));`

再对每个属性进行注入：   
 `setPropertyValue(pv);`

这里setPropertyValue（）的最终实现在BeanWrapper 的子类BeanWrapperImpl类中（我们之前提过BeanWrapper，这个类就是对Bean的封装，方便set，get操作）：

**BeanWrapperImpl.java**

```
        @Override
        public void setValue(final @Nullable Object value) throws Exception {
            final Method writeMethod = (this.pd instanceof GenericTypeAwarePropertyDescriptor ?
                    ((GenericTypeAwarePropertyDescriptor) this.pd).getWriteMethodForActualAccess() :
                    this.pd.getWriteMethod());
            if (System.getSecurityManager() != null) {
                AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
                    ReflectionUtils.makeAccessible(writeMethod);
                    return null;
                });
                try {
                    AccessController.doPrivileged((PrivilegedExceptionAction<Object>) () ->
                            writeMethod.invoke(getWrappedInstance(), value), acc);
                }
                catch (PrivilegedActionException ex) {
                    throw ex.getException();
                }
            }
            else {
                ReflectionUtils.makeAccessible(writeMethod);
                //使用反射 将value值通过set方法注入
                writeMethod.invoke(getWrappedInstance(), value);
            }
        }
    }
```

可以看到，在获取属性值value后就通过反射`method.invoke()`将其注入。这样就完成了IoC容器依赖注入的所有过程。