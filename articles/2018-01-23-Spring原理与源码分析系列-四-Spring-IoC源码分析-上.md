---
title: "Spring原理与源码分析系列（四）- Spring IoC源码分析（上）"
date: 2018-01-23
category: 后端开发
tags: [Spring IoC启动]
---

### 0 前言

在上节 [Spring原理与源码分析系列（三）- Spring IoC容器启动过程分析（下）](http://blog.csdn.net/noaman_wgs/article/details/79138522) 我们已经介绍过，IoC容器主要分为两个阶段：IoC容器启动和依赖注入。   
 本节内容我们重点将从源码的角度来分析这两个过程，本篇（上）主要分析IoC容器启动过程，而依赖注入部分将放在（下）去分析。

### 一、IoC容器启动过程

IoC容器启动是由refresh()方法来启动的，这个过程主要分为3个部分：   
 **1. BeanDefinition的Resource定位**   
 **2. IoC容器载入和解析BeanDefinition**   
 **3. IoC容器注册BeanDefinition**   
 下面将详细讲述IoC容器启动的这3个过程。

#### **1. BeanDefinition的Resource定位**

第一个过程是定位以Resource定义的BeanDefinition信息，即寻找以文件形式存在的BeanDefinition信息，由ResourceLoader通过统一的Resource接口来完成对BeanDefinition信息的抽象。   
 如：在文件系统中Bean定义的信息可用FileSystemResource来进行抽象；   
 在类路径中Bean定义的信息可以使用ClassPathResource来抽象。

**BeanFactory**   
 这个过程对于BeanFactory容器来说，DefaultListableBeanFactory是其实现类。首先需要定义一个Resource来定位容器使用的BeanDefinition。   
 如在类路径使用的是ClassPathResource：

```
ClassPathResource res = new ClassPathResource("beans.xml");
```

当然这个信息并不能被DefaultListableBeanFactory容器直接使用，还需要通过BeanDefinitionReader来对信息进行处理。

```
DefaultListableBeanFactory container = new DefaultListableBeanFactory();
XmlBeanDefinitionReader reader = new XmlBeanDefinitionReader (container);
reader.loadBeanDefinitions(res);
```

**ApplicationContext**   
 相比较BeanFactory容器，DefaultListableBeanFactory只是纯粹的一个IoC容器，需要通过BeanDefinitionReader读取器才能将BeanDefinition信息读入容器；而ApplicationContext已经为我们实现了BeanDefinitionReader读入功能。   
 如：   
 **FileSystemXmlApplicationContext**：从文件系统载入Resource；   
 **ClassPathXmlApplicationContext**：从类路径下载入Resource；   
 **XmlWebApplicationContext**：在Web 容器下载入Resource。

下面以FileSystemXmlApplicationContext为例看看Resource定位的具体过程。   
 首先看下FileSystemXmlApplicationContext与Resource的联系。   
 ![Alt text](https://img-blog.csdn.net/20180123133543631?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

可以看到FileSystemXmlApplicationContext通过继承AbstractApplicationContext具备了ResourceLoader读入以Resource定义的BeanDefinition的能力。

下面是FileSystemXmlApplicationContext源码：   
 **FileSystemXmlApplicationContext.java:**

```
public class FileSystemXmlApplicationContext extends AbstractXmlApplicationContext {
    public FileSystemXmlApplicationContext() {
    }

    public FileSystemXmlApplicationContext(ApplicationContext parent) {
        super(parent);
    }

    public FileSystemXmlApplicationContext(String configLocation) throws BeansException {
        this(new String[]{configLocation}, true, (ApplicationContext)null);
    }

    public FileSystemXmlApplicationContext(String... configLocations) throws BeansException {
        this(configLocations, true, (ApplicationContext)null);
    }

    public FileSystemXmlApplicationContext(String[] configLocations, ApplicationContext parent) throws BeansException {
        this(configLocations, true, parent);
    }

    public FileSystemXmlApplicationContext(String[] configLocations, boolean refresh) throws BeansException {
        this(configLocations, refresh, (ApplicationContext)null);
    }

//refresh()函数触发了BeanDefinition资源定位的过程。
    public FileSystemXmlApplicationContext(String[] configLocations, boolean refresh, @Nullable ApplicationContext parent) throws BeansException {
        super(parent);
        this.setConfigLocations(configLocations);
        if(refresh) {
            this.refresh();
        }

    }

    protected Resource getResourceByPath(String path) {
        if(path.startsWith("/")) {
            path = path.substring(1);
        }

        return new FileSystemResource(path);
    }
}
```

可以看到：FileSystemXmlApplicationContext的构造函数中refresh()函数触发了BeanDefinition资源定位的过程。   
 在refresh()函数中调用了AbstractRefreshableApplicationContext的refreshBeanFactory()，完成了IoC容器的初始化：包括IoC容器的创建和启动loadBeanDefinitions来载入BeanDefinition。

下面进入AbstractRefreshableApplicationContext中查看其对容器的初始化：

- （1） 创建IoC容器：createBeanFactory()创建DefaultListableBeanFactory容器;
- （2）启动loadBeanDefinitions来载入BeanDefinition。

**AbstractRefreshableApplicationContext.java：**

```
Override
protected final void refreshBeanFactory() throws BeansException {
        //判断，如果已经建立了BeanFactory，则销毁并关闭该BeanFactory。
        if (hasBeanFactory()) {
            destroyBeans();
            closeBeanFactory();
        }
        try {
            //1 创建IoC容器：DefaultListableBeanFactory容器
            DefaultListableBeanFactory beanFactory = createBeanFactory();
            beanFactory.setSerializationId(getId());
            customizeBeanFactory(beanFactory);
            //2 启动loadBeanDefinitions来载入BeanDefinition
            loadBeanDefinitions(beanFactory);
            synchronized (this.beanFactoryMonitor) {
                this.beanFactory = beanFactory;
            }
        }
        catch (IOException ex) {
            throw new ApplicationContextException("I/O error parsing bean definition source for " + getDisplayName(), ex);
        }
    }
```

createBeanFactory：

```
protected DefaultListableBeanFactory createBeanFactory() {
        return new DefaultListableBeanFactory(getInternalParentBeanFactory());
    }
```

可以看出FileSystemXmlApplicationContext初始化过程中refresh()启动整个调用，使用的IoC容器是DefaultListableBeanFactory。

接下来再看`loadBeanDefinitions(beanFactory);`是如何载入BeanDefinition：   
 当执行`loadBeanDefinitions(beanFactory);`时，最后是AbstractBeanDefinitionReader去执行这个loadBeanDefinitions方法：

**AbstractBeanDefinitionReader.java：**

```
public int loadBeanDefinitions(String location, @Nullable Set<Resource> actualResources) throws BeanDefinitionStoreException {
        ResourceLoader resourceLoader = getResourceLoader();
        if (resourceLoader == null) {
            throw new BeanDefinitionStoreException(
                    "Cannot import bean definitions from location [" + location + "]: no ResourceLoader available");
        }

        if (resourceLoader instanceof ResourcePatternResolver) {
            // Resource pattern matching available.
            try {
                //DefaultResourceLoader的getResource完成具体的Resource定位，此处可能是多个文件
                Resource[] resources = ((ResourcePatternResolver) resourceLoader).getResources(location);
                int loadCount = loadBeanDefinitions(resources);
                if (actualResources != null) {
                    for (Resource resource : resources) {
                        actualResources.add(resource);
                    }
                }
                if (logger.isDebugEnabled()) {
                    logger.debug("Loaded " + loadCount + " bean definitions from location pattern [" + location + "]");
                }
                return loadCount;
            }
            catch (IOException ex) {
                throw new BeanDefinitionStoreException(
                        "Could not resolve bean definition resource pattern [" + location + "]", ex);
            }
        }
        else {
            //DefaultResourceLoader的getResource完成具体的Resource定位
            Resource resource = resourceLoader.getResource(location);
            int loadCount = loadBeanDefinitions(resource);
            if (actualResources != null) {
                actualResources.add(resource);
            }
            if (logger.isDebugEnabled()) {
                logger.debug("Loaded " + loadCount + " bean definitions from location [" + location + "]");
            }
            return loadCount;
        }
    }
```

上面代码中，可以看到：

```
Resource[] resources = ((ResourcePatternResolver) resourceLoader).getResources(location);
```

和

```
Resource resource = resourceLoader.getResource(location);
```

这两行代码已经进入了第一步的核心：Resource的BeanDefinition资源定位。

让我们看看这个DefaultResourceLoader中getResource()是如何实现Resource的BeanDefinition资源定位过程。

```
    @Override
    public Resource getResource(String location) {
        Assert.notNull(location, "Location must not be null");

        for (ProtocolResolver protocolResolver : this.protocolResolvers) {
            Resource resource = protocolResolver.resolve(location, this);
            if (resource != null) {
                return resource;
            }
        }

        if (location.startsWith("/")) {
            return getResourceByPath(location);
        }
        else if (location.startsWith(CLASSPATH_URL_PREFIX)) {
            return new ClassPathResource(location.substring(CLASSPATH_URL_PREFIX.length()), getClassLoader());
        }
        else {
            try {
                // 处理URL标识的Resource定位
                URL url = new URL(location);
                return (ResourceUtils.isFileURL(url) ? new FileUrlResource(url) : new UrlResource(url));
            }
            catch (MalformedURLException ex) {
                return getResourceByPath(location);
            }
        }
    }
```

getResourceByPath（）会被子类FileSystemXmlApplicationContext实现，返回一个FileSystemResource对象，到此就完成了Resource定义的BeanDefinition资源定位过程。

```
    protected Resource getResourceByPath(String path) {
        if(path.startsWith("/")) {
            path = path.substring(1);
        }
        return new FileSystemResource(path);
    }
```

之后就可以通过返回的Resource对象来进行BeanDefinition资源的载入了。

**Resource定义的BeanDefinition资源定位过程总结：**

- （1）FileSystemXmlApplicationContext构造函数中refresh()启动IoC容器初始化过程—>
- （2）AbstractRefreshableApplicationContext中createBeanFactory()创建DefaultListableBeanFactory容器—>
- （3）AbstractBeanDefinitionReader中loadBeanDefinitions（）载入BeanDefinition资源，在载入的时候调用DefaultResourceLoader的getResource的资源定位过程—>
- （4）DefaultResourceLoader中getResource()实现Resource的BeanDefinition资源定位过程。

#### **2. IoC容器载入和解析BeanDefinition**

在 IoC容器获取到Resource抽象的BeanDefinition资源位置后（这里的Resource对象封装了对XML文件的I/O操作），就需要将BeanDefinition载入到 IoC容器中，并转化成容器内部数据结构。   
 这个过程的核心操作是：

- **（1）BeanDefinition载入**：通过XmlBeanDefinitionReader读取器中loadBeanDefinitions（），打开I/O流操作后就可以获取到XML文件对象，将XML文件中内容（即BeanDefinition）读入到容器当中（简单可理解为读取XML文件中的内容）；
- **（2）BeanDefinition解析**：通过BeanDefinitionParserDelegate，按照Spring的Bean语义对BeanDefinition解析并转为容器 内部数据结构（简单可理解为根据读取的内容转化为BeanDefinition数据结构）。

下面看看具体的实现过程。

##### （1）BeanDefinition载入

首先是FileSystemXmlApplicationContext类中的构造方法调用了refresh()，启动IoC容器的初始化过程。

**FileSystemXmlApplicationContext.java**

```
public FileSystemXmlApplicationContext(String[] configLocations, boolean refresh, @Nullable ApplicationContext parent) throws BeansException {
        super(parent);
        this.setConfigLocations(configLocations);
        if(refresh) {
            this.refresh();
        }
    }
```

再进入AbstractApplicationContext中看看refresh()方法的实现：

**AbstractApplicationContext.java.java**

```
    @Override
    public void refresh() throws BeansException, IllegalStateException {
        synchronized (this.startupShutdownMonitor) {
            prepareRefresh();

            // 在子类中AbstractRefreshableApplicationContext启动refreshBeanFactory
            ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();
            // Prepare the bean factory for use in this context.
            prepareBeanFactory(beanFactory);
            try {
                // 设置Bean的后置处理器
                postProcessBeanFactory(beanFactory);
                // 调用Bean的后置处理
                invokeBeanFactoryPostProcessors(beanFactory);
                // 注册Bean的后置处理
                registerBeanPostProcessors(beanFactory);
                // 初始化上下文中的消息源进行初始化
                initMessageSource();
                // 初始化上下文中的事件机制
                initApplicationEventMulticaster();
                // 初始化其他特殊的Bean
                onRefresh();
                // 创建监听器监听Bean，并且向IoC容器注册
                registerListeners();
                // 实例化所有(none-lazy-init)单件
                finishBeanFactoryInitialization(beanFactory);
                // 发布人容器事件，结束Refresh过程
                finishRefresh();
            }
            catch (BeansException ex) {
                if (logger.isWarnEnabled()) {
                    logger.warn("Exception encountered during context initialization - " +
                            "cancelling refresh attempt: " + ex);
                }
                // 销毁Bean
                destroyBeans();
                // Reset 'active' flag.
                cancelRefresh(ex);
                // Propagate exception to caller.
                throw ex;
            }
            finally {
                resetCommonCaches();
            }
        }
    }
```

这个refresh（）方法定义了上下文初始化内容的模板。   
 在这个方法中，调用obtainFreshBeanFactory（）方法：

**AbstractApplicationContext.java.java**

```
    protected ConfigurableListableBeanFactory obtainFreshBeanFactory() {
        // 这个方法会让子类AbstractRefreshableApplicationContext启动refreshBeanFactory
        refreshBeanFactory();
        ConfigurableListableBeanFactory beanFactory = getBeanFactory();
        if (logger.isDebugEnabled()) {
            logger.debug("Bean factory for " + getDisplayName() + ": " + beanFactory);
        }
        return beanFactory;
    }
```

进入AbstractRefreshableApplicationContext，看看refreshBeanFactory的实现：

**AbstractRefreshableApplicationContext.java**

```
    @Override
    protected final void refreshBeanFactory() throws BeansException {
        //判断，如果已经建立了BeanFactory，则销毁并关闭该BeanFactory。
        if (hasBeanFactory()) {
            destroyBeans();
            closeBeanFactory();
        }
        try {
            //1 创建IoC容器：DefaultListableBeanFactory容器
            DefaultListableBeanFactory beanFactory = createBeanFactory();
            beanFactory.setSerializationId(getId());
            customizeBeanFactory(beanFactory);
            //2 启动loadBeanDefinitions来载入BeanDefinition
            loadBeanDefinitions(beanFactory);
            synchronized (this.beanFactoryMonitor) {
                this.beanFactory = beanFactory;
            }
        }
        catch (IOException ex) {
            throw new ApplicationContextException("I/O error parsing bean definition source for " + getDisplayName(), ex);
        }
    }
```

可以看到，在AbstractRefreshableApplicationContext中，首先创建一个Ioc容器：DefaultListableBeanFactory；然后再调用loadBeanDefinitions（）方法来完成BeanDefinition的载入；这个loadBeanDefinitions（）方法是一个抽象方法，实际实现是由其子类AbstractXmlApplicationContext实现的。

让我们进入AbstractXmlApplicationContext，看看loadBeanDefinitions（）的具体实现。

**AbstractXmlApplicationContext.java**

```
Override
protected void loadBeanDefinitions(DefaultListableBeanFactory beanFactory) throws BeansException, IOException {
        // 创建XmlBeanDefinitionReader，并通过回调设置到BeanFactory中去
        XmlBeanDefinitionReader beanDefinitionReader = new XmlBeanDefinitionReader(beanFactory);

        beanDefinitionReader.setEnvironment(this.getEnvironment());
        beanDefinitionReader.setResourceLoader(this);
        beanDefinitionReader.setEntityResolver(new ResourceEntityResolver(this));

        // 可允许自定义读取器BeanDefinitionReader
        initBeanDefinitionReader(beanDefinitionReader);
        // 真正实现loadBeanDefinitions的地方
        loadBeanDefinitions(beanDefinitionReader);
    }


protected void loadBeanDefinitions(XmlBeanDefinitionReader reader) throws BeansException, IOException {
        //以Resource形式获取配置文件的资源文件位置
        Resource[] configResources = getConfigResources();
        if (configResources != null) {
            reader.loadBeanDefinitions(configResources);
        }
        //以String形式获取配置文件的资源文件位置
        String[] configLocations = getConfigLocations();
        if (configLocations != null) {
            reader.loadBeanDefinitions(configLocations);
        }
    }

@Nullable
protected Resource[] getConfigResources() {
        return null;
    }
```

可以看到，在AbstractXmlApplicationContext loadBeanDefinitions（）中，首先创建XmlBeanDefinitionReader读取器（因为配置文件是XML类型）来读取BeanDefinition，然后将XmlBeanDefinitionReader设置到容器当中，通过XmlBeanDefinitionReader来读取：

```
reader.loadBeanDefinitions(configResources);
```

而`reader.loadBeanDefinitions(configResources);`显然应该是在BeanDefinitionReader相关类中实现的，所以点击这行代码会跳到AbstractBeanDefinitionReader类中：

**AbstractBeanDefinitionReader.java:**

```
    @Override
    public int loadBeanDefinitions(Resource... resources) throws BeanDefinitionStoreException {
        Assert.notNull(resources, "Resource array must not be null");
        int counter = 0;
        for (Resource resource : resources) {
            //实际的loadBeanDefinitions是由XmlBeanDefinitionReader去实现的
            counter += loadBeanDefinitions(resource);
        }
        return counter;
    }

    @Override
    public int loadBeanDefinitions(String... locations) throws BeanDefinitionStoreException {
        Assert.notNull(locations, "Location array must not be null");
        int counter = 0;
        for (String location : locations) {
            //实际的loadBeanDefinitions是由XmlBeanDefinitionReader去实现的
            counter += loadBeanDefinitions(location);
        }
        return counter;
    }

    public int loadBeanDefinitions(String location, @Nullable Set<Resource> actualResources) throws BeanDefinitionStoreException {
        ResourceLoader resourceLoader = getResourceLoader();
        if (resourceLoader == null) {
            throw new BeanDefinitionStoreException(
                    "Cannot import bean definitions from location [" + location + "]: no ResourceLoader available");
        }

        if (resourceLoader instanceof ResourcePatternResolver) {
            // Resource pattern matching available.
            try {
                Resource[] resources = ((ResourcePatternResolver) resourceLoader).getResources(location);
                int loadCount = loadBeanDefinitions(resources);
                if (actualResources != null) {
                    for (Resource resource : resources) {
                        actualResources.add(resource);
                    }
                }
                if (logger.isDebugEnabled()) {
                    logger.debug("Loaded " + loadCount + " bean definitions from location pattern [" + location + "]");
                }
                return loadCount;
            }
            catch (IOException ex) {
                throw new BeanDefinitionStoreException(
                        "Could not resolve bean definition resource pattern [" + location + "]", ex);
            }
        }
        else {
            // Can only load single resources by absolute URL.
            Resource resource = resourceLoader.getResource(location);
            int loadCount = loadBeanDefinitions(resource);
            if (actualResources != null) {
                actualResources.add(resource);
            }
            if (logger.isDebugEnabled()) {
                logger.debug("Loaded " + loadCount + " bean definitions from location [" + location + "]");
            }
            return loadCount;
        }
    }
```

最后一个重载方法   
 `loadBeanDefinitions（String location, @Nullable Set<Resource> actualResources）`   
 是不是很熟悉呢？没错，在第一节BeanDefinition的Resource资源定位过程中我们就分析过这块代码，即在loadBeanDefinitions（）方法调用过程中，首先需要Resource资源定位:`getResources(location)`。

```
Resource[] resources = ((ResourcePatternResolver) resourceLoader).getResources(location);
```

和

```
Resource resource = resourceLoader.getResource(location);
```

实际的loadBeanDefinitions（）是由XmlBeanDefinitionReader去实现的。

让我们再进入XmlBeanDefinitionReader，看看loadBeanDefinitions（）的庐山真面目，这也到了BeanDefinition载入的核心了。以下分析均是BeanDefinition载入的核心。

**XmlBeanDefinitionReader.java**   
 调用的入口：

```
    @Override
    public int loadBeanDefinitions(Resource resource) throws BeanDefinitionStoreException {
        //此处传入的Resource即封装了I/O操作的BeanDefinition
        return loadBeanDefinitions(new EncodedResource(resource));
    }
```

载入XML形式的BeanDefinition的地方，即获取Resource中的内容InputSource：

**XmlBeanDefinitionReader.java**

```
public int loadBeanDefinitions(EncodedResource encodedResource) throws BeanDefinitionStoreException {
        Assert.notNull(encodedResource, "EncodedResource must not be null");
        if (logger.isInfoEnabled()) {
            logger.info("Loading XML bean definitions from " + encodedResource.getResource());
        }

        Set<EncodedResource> currentResources = this.resourcesCurrentlyBeingLoaded.get();
        if (currentResources == null) {
            currentResources = new HashSet<>(4);
            this.resourcesCurrentlyBeingLoaded.set(currentResources);
        }
        if (!currentResources.add(encodedResource)) {
            throw new BeanDefinitionStoreException(
                    "Detected cyclic loading of " + encodedResource + " - check your import definitions!");
        }
        try {
            //得到Resource中的InputStream进行读取
            InputStream inputStream = encodedResource.getResource().getInputStream();
            try {
                InputSource inputSource = new InputSource(inputStream);
                if (encodedResource.getEncoding() != null) {
                    inputSource.setEncoding(encodedResource.getEncoding());
                }
                //真正读取的地方在doLoadBeanDefinitions()
                return doLoadBeanDefinitions(inputSource, encodedResource.getResource());
            }
            finally {
                inputStream.close();
            }
        }
        catch (IOException ex) {
            throw new BeanDefinitionStoreException(
                    "IOException parsing XML document from " + encodedResource.getResource(), ex);
        }
        finally {
            currentResources.remove(encodedResource);
            if (currentResources.isEmpty()) {
                this.resourcesCurrentlyBeingLoaded.remove();
            }
        }
    }
```

而真正执行loadBeanDefinitions()方法的地方：

**XmlBeanDefinitionReader.java**

```
protected int doLoadBeanDefinitions(InputSource inputSource, Resource resource)
            throws BeanDefinitionStoreException {
        try {
            //取得XML文件的Document对象，具体实现由DefaultDoucmentLoader去实现的
            Document doc = doLoadDocument(inputSource, resource);
            return registerBeanDefinitions(doc, resource);
        }
        catch (BeanDefinitionStoreException ex) {
            throw ex;
        }
        catch (SAXParseException ex) {
            throw new XmlBeanDefinitionStoreException(resource.getDescription(),
                    "Line " + ex.getLineNumber() + " in XML document from " + resource + " is invalid", ex);
        }
        catch (SAXException ex) {
            throw new XmlBeanDefinitionStoreException(resource.getDescription(),
                    "XML document from " + resource + " is invalid", ex);
        }
        catch (ParserConfigurationException ex) {
            throw new BeanDefinitionStoreException(resource.getDescription(),
                    "Parser configuration exception parsing XML from " + resource, ex);
        }
        catch (IOException ex) {
            throw new BeanDefinitionStoreException(resource.getDescription(),
                    "IOException parsing XML document from " + resource, ex);
        }
        catch (Throwable ex) {
            throw new BeanDefinitionStoreException(resource.getDescription(),
                    "Unexpected exception parsing XML document from " + resource, ex);
        }
    }
```

可以看到，在doLoadBeanDefinitions（）方法中，在取得XML文件的Resource后，通过`doLoadDocument(inputSource, resource);`封装成Document对象。至此，BeanDefinition资源已经被载入到容器当中。   
 但此时的document对象并没有安装Spring的Bean规则解析，所以还需要对载入的BeanDefinition资源进行解析。

**BeanDefinition载入过程小结：**

- （1）FileSystemXmlApplicationContext 的构造器中调用 refresh()启动IoC容器的初始化过程 ；——-》
- （2）AbstractApplicationContext中refresh()触发子类AbstractRefreshableApplicationContext的refreshBeanFactory（）执行；——-》
- （3）AbstractRefreshableApplicationContext中refreshBeanFactory()创建默认IoC容器DefaultListableBeanFactory，   
   再调用loadBeanDefinitions（）执行载入过程，交由子类AbstractXmlApplicationContext去实现；——-》
- （4）AbstractXmlApplicationContext中创建XmlBeanDefinitionReader读取器来读取BeanDefinition：`reader.loadBeanDefinitions(configResources);`这个方法会先进入AbstractBeanDefinitionReader中；——-》
- （5）AbstractBeanDefinitionReader中的loadBeanDefinitions（）方法会首先调用getResources（），获取Resource资源，即BeanDefinition的Resource资源定位过程，   
   再触发子类XmlBeanDefinitionReader去实现loadBeanDefinitions（）载入Resource资源；——-》
- （6）XmlBeanDefinitionReader中定位到Resource资源后，将其`EncodedResource(resource))`，再获取Resource中的内容InputSource；   
   然后再通过doLoadDocument（）方法取得XML文件的Document对象。

至此，BeanDefinition载入过程结束。

##### （2）BeanDefinition解析

上一步骤载入BeanDefinition后，通过调用XML解析器得到的document对象并没有按Spring的Bean规则进行解析，所以还需要有对document对象按Spring的Bean规则进行解析的过程。下面就详细地看看这个过程的实现。

在XmlBeanDefinitionReader中，获取到BeanDefinition的Resource资源并封装成Document 对象后，就执行`registerBeanDefinitions（）`过程，在这个过程中实现了BeanDefinition的解析。

**XmlBeanDefinitionReader.java**

```
Document doc = doLoadDocument(inputSource, resource);
return registerBeanDefinitions(doc, resource);
```

在registerBeanDefinitions（）中我们可以看到，首先需要创建XML解析器，这里默认创建的是DefaultBeanDefinitionDocumentReader。   
 然后通过   
 `documentReader.registerBeanDefinitions(doc, createReaderContext(resource));`   
 进入DefaultBeanDefinitionDocumentReader的registerBeanDefinitions（）。

**XmlBeanDefinitionReader.java**

```
public int registerBeanDefinitions(Document doc, Resource resource) throws BeanDefinitionStoreException {
    //1 创建XML解析器：BeanDefinitionDocumentReader是接口，默认创建的是DefaultBeanDefinitionDocumentReader
    BeanDefinitionDocumentReader documentReader = createBeanDefinitionDocumentReader();
    int countBefore = getRegistry().getBeanDefinitionCount();
    //2 进入DefaultBeanDefinitionDocumentReader的registerBeanDefinitions（）
    documentReader.registerBeanDefinitions(doc, createReaderContext(resource));
    return getRegistry().getBeanDefinitionCount() - countBefore;
}


    protected BeanDefinitionDocumentReader createBeanDefinitionDocumentReader() {
        //创建的是BeanDefinitionDocumentReader子类：DefaultBeanDefinitionDocumentReader
        return BeanDefinitionDocumentReader.class.cast(BeanUtils.instantiateClass(this.documentReaderClass));
    }
```

下面再看看DefaultBeanDefinitionDocumentReader中的registerBeanDefinitions（）具体实现：   
 首先获取Document对象中的元素，然后再执行具体的注册过程：

**DefaultBeanDefinitionDocumentReader.java**

```
    @Override
    public void registerBeanDefinitions(Document doc, XmlReaderContext readerContext) {
        this.readerContext = readerContext;
        logger.debug("Loading bean definitions");
        //获取封装的Document对象中的元素
        Element root = doc.getDocumentElement();
        //执行注册过程
        doRegisterBeanDefinitions(root);
    }
```

而真正的解析过程实际都是交由BeanDefinitionParserDelegate去真正实现的，所以需要先创建BeanDefinition解析的代理类。

**DefaultBeanDefinitionDocumentReader.java**

```
    protected void doRegisterBeanDefinitions(Element root) {
        // 从这一步可以看出实际的解析过程都是交由BeanDefinitionParserDelegate去真正实现的
        BeanDefinitionParserDelegate parent = this.delegate;
        //创建BeanDefinition解析的代理类
        this.delegate = createDelegate(getReaderContext(), root, parent);

        if (this.delegate.isDefaultNamespace(root)) {
            String profileSpec = root.getAttribute(PROFILE_ATTRIBUTE);
            if (StringUtils.hasText(profileSpec)) {
                String[] specifiedProfiles = StringUtils.tokenizeToStringArray(
                        profileSpec, BeanDefinitionParserDelegate.MULTI_VALUE_ATTRIBUTE_DELIMITERS);
                if (!getReaderContext().getEnvironment().acceptsProfiles(specifiedProfiles)) {
                    if (logger.isInfoEnabled()) {
                        logger.info("Skipped XML bean definition file due to specified profiles [" + profileSpec +
                                "] not matching: " + getReaderContext().getResource());
                    }
                    return;
                }
            }
        }

        preProcessXml(root);
        parseBeanDefinitions(root, this.delegate);
        postProcessXml(root);

        this.delegate = parent;
    }
```

创建BeanDefinition解析的代理类BeanDefinitionParserDelegate ：

**DefaultBeanDefinitionDocumentReader.java**

```
    protected BeanDefinitionParserDelegate createDelegate(
            XmlReaderContext readerContext, Element root, @Nullable BeanDefinitionParserDelegate parentDelegate) {

        BeanDefinitionParserDelegate delegate = new BeanDefinitionParserDelegate(readerContext);
        delegate.initDefaults(root, parentDelegate);
        return delegate;
    }
```

即实际的解析过程都是委托给BeanDefinitionParserDelegate 执行的。

让我们进入BeanDefinitionParserDelegate 中去看看这个解析过程是如何执行的，而这一步已经到了BeanDefinition解析的核心了。

可以看到首先获取`<bean>`元素中定义的id,name,aliases等属性，然后调用   
 `parseBeanDefinitionElement(ele, beanName, containingBean);`   
 触发对Bean元素的解析：

**BeanDefinitionParserDelegate .java**

```
public BeanDefinitionHolder parseBeanDefinitionElement(Element ele, @Nullable BeanDefinition containingBean) {
        //这里获取<bean>元素中定义的id,name,aliases等属性
        String id = ele.getAttribute(ID_ATTRIBUTE);
        String nameAttr = ele.getAttribute(NAME_ATTRIBUTE);

        List<String> aliases = new ArrayList<>();
        if (StringUtils.hasLength(nameAttr)) {
            String[] nameArr = StringUtils.tokenizeToStringArray(nameAttr, MULTI_VALUE_ATTRIBUTE_DELIMITERS);
            aliases.addAll(Arrays.asList(nameArr));
        }

        String beanName = id;
        if (!StringUtils.hasText(beanName) && !aliases.isEmpty()) {
            beanName = aliases.remove(0);
            if (logger.isDebugEnabled()) {
                logger.debug("No XML 'id' specified - using '" + beanName +
                        "' as bean name and " + aliases + " as aliases");
            }
        }

        if (containingBean == null) {
            checkNameUniqueness(beanName, aliases, ele);
        }
        //在这里会触发对Bean元素的解析
        AbstractBeanDefinition beanDefinition = parseBeanDefinitionElement(ele, beanName, containingBean);
        if (beanDefinition != null) {
            if (!StringUtils.hasText(beanName)) {
                try {
                    if (containingBean != null) {
                        beanName = BeanDefinitionReaderUtils.generateBeanName(
                                beanDefinition, this.readerContext.getRegistry(), true);
                    }
                    else {
                        beanName = this.readerContext.generateBeanName(beanDefinition);
                        // Register an alias for the plain bean class name, if still possible,
                        // if the generator returned the class name plus a suffix.
                        // This is expected for Spring 1.2/2.0 backwards compatibility.
                        String beanClassName = beanDefinition.getBeanClassName();
                        if (beanClassName != null &&
                                beanName.startsWith(beanClassName) && beanName.length() > beanClassName.length() &&
                                !this.readerContext.getRegistry().isBeanNameInUse(beanClassName)) {
                            aliases.add(beanClassName);
                        }
                    }
                    if (logger.isDebugEnabled()) {
                        logger.debug("Neither XML 'id' nor 'name' specified - " +
                                "using generated bean name [" + beanName + "]");
                    }
                }
                catch (Exception ex) {
                    error(ex.getMessage(), ele);
                    return null;
                }
            }
            String[] aliasesArray = StringUtils.toStringArray(aliases);
            return new BeanDefinitionHolder(beanDefinition, beanName, aliasesArray);
        }

        return null;
    }
```

再看看具体的解析过程：

**BeanDefinitionParserDelegate .java**

```
    public AbstractBeanDefinition parseBeanDefinitionElement(
            Element ele, String beanName, @Nullable BeanDefinition containingBean) {

        this.parseState.push(new BeanEntry(beanName));
        //获取<bean>中设置的class名字，载入到BeanDefinition中去
        String className = null;
        if (ele.hasAttribute(CLASS_ATTRIBUTE)) {
            className = ele.getAttribute(CLASS_ATTRIBUTE).trim();
        }
        String parent = null;
        if (ele.hasAttribute(PARENT_ATTRIBUTE)) {
            parent = ele.getAttribute(PARENT_ATTRIBUTE);
        }

        try {
            //生成BeanDefinition对象，为Bean定义的信息的载入做准备
            AbstractBeanDefinition bd = createBeanDefinition(className, parent);
            //下面都是对Bean中元素做详细的解析
            //对Bean元素的属性做解析，并设置description信息
            parseBeanDefinitionAttributes(ele, beanName, containingBean, bd);
            bd.setDescription(DomUtils.getChildElementValueByTagName(ele, DESCRIPTION_ELEMENT));
            //解析<bean>元素
            parseMetaElements(ele, bd);
            parseLookupOverrideSubElements(ele, bd.getMethodOverrides());
            parseReplacedMethodSubElements(ele, bd.getMethodOverrides());
            //解析<bean>构造函数
            parseConstructorArgElements(ele, bd);
            //解析<bean>的property
            parsePropertyElements(ele, bd);
            parseQualifierElements(ele, bd);

            bd.setResource(this.readerContext.getResource());
            bd.setSource(extractSource(ele));
            // 根据解析的结果转化为BeanDefinition数据结构，并返回，解析过程结束
            return bd;
        }
        catch (ClassNotFoundException ex) {
            error("Bean class [" + className + "] not found", ele, ex);
        }
        catch (NoClassDefFoundError err) {
            error("Class that bean class [" + className + "] depends on not found", ele, err);
        }
        catch (Throwable ex) {
            error("Unexpected failure during bean definition parsing", ele, ex);
        }
        finally {
            this.parseState.pop();
        }

        return null;
    }
```

可以看到，parseBeanDefinitionElement（）中对`<bean>`元素进行解析的地方：解析`<bean>`元素，构造函数，property等，最后根据解析结果转化为BeanDefinition数据结构，并返回，解析过程结束。

如果再想深究，可以看看解析`<bean>`元素，构造函数，property等具体的实现过程。   
 举个栗子，在XML配置文件中有这样一段配置：

```
<bean id="user" class="com.wgs.Demo.User" >
    <property name="name" value="wgs"/>
    <property name="school" ref="school"/>
</bean>
```

看看BeanDefinitionParserDelegate是如何解析XML文件中的property 元素生成BeanDefinition的。

首先获取`<bean>`元素下的子元素，如果该子元素是property属性，就调用`parsePropertyElement（）`对property元素解析过程：

**BeanDefinitionParserDelegate.java**

```
    public void parsePropertyElements(Element beanEle, BeanDefinition bd) {
        //获取<bean>元素下的子元素
        NodeList nl = beanEle.getChildNodes();
        for (int i = 0; i < nl.getLength(); i++) {
            Node node = nl.item(i);
            //如果该子元素是property属性，就触发对property元素解析过程
            if (isCandidateElement(node) && nodeNameEquals(node, PROPERTY_ELEMENT)) {
                parsePropertyElement((Element) node, bd);
            }
        }
    }
```

在`parsePropertyElement()`方法中，首先获取property的名字，然后调用`parsePropertyValue（）`进行具体解析，最后将解析结果封装为PropertyValue，然后保存到BeanDefinitionHolder中。

**BeanDefinitionParserDelegate.java**

```
    public void parsePropertyElement(Element ele, BeanDefinition bd) {
        //取得property的名字
        String propertyName = ele.getAttribute(NAME_ATTRIBUTE);
        if (!StringUtils.hasLength(propertyName)) {
            error("Tag 'property' must have a 'name' attribute", ele);
            return;
        }
        this.parseState.push(new PropertyEntry(propertyName));
        try {
            //如果该property已经被解析过，就不再被解析或有同名property，起作用的是第一个
            if (bd.getPropertyValues().contains(propertyName)) {
                error("Multiple 'property' definitions for property '" + propertyName + "'", ele);
                return;
            }
            //这里是具体解析property的地方，解析的结果会封装到PropertyValue当中，然后保存到BeanDefinitionHolder中
            Object val = parsePropertyValue(ele, bd, propertyName);
            PropertyValue pv = new PropertyValue(propertyName, val);
            parseMetaElements(ele, pv);
            pv.setSource(extractSource(ele));
            bd.getPropertyValues().addPropertyValue(pv);
        }
        finally {
            this.parseState.pop();
        }
    }
```

让我们看看取得property元素的值后，是如何进行解析的：

**BeanDefinitionParserDelegate.java**

```
    @Nullable
    public Object parsePropertyValue(Element ele, BeanDefinition bd, @Nullable String propertyName) {
        String elementName = (propertyName != null) ?
                        "<property> element for property '" + propertyName + "'" :
                        "<constructor-arg> element";

        // Should only have one child element: ref, value, list, etc.
        NodeList nl = ele.getChildNodes();
        Element subElement = null;
        for (int i = 0; i < nl.getLength(); i++) {
            Node node = nl.item(i);
            if (node instanceof Element && !nodeNameEquals(node, DESCRIPTION_ELEMENT) &&
                    !nodeNameEquals(node, META_ELEMENT)) {
                // Child element is what we're looking for.
                if (subElement != null) {
                    error(elementName + " must not contain more than one sub-element", ele);
                }
                else {
                    subElement = (Element) node;
                }
            }
        }
        //判断property的属性是ref还是value，不允许同时存在
        boolean hasRefAttribute = ele.hasAttribute(REF_ATTRIBUTE);
        boolean hasValueAttribute = ele.hasAttribute(VALUE_ATTRIBUTE);
        if ((hasRefAttribute && hasValueAttribute) ||
                ((hasRefAttribute || hasValueAttribute) && subElement != null)) {
            error(elementName +
                    " is only allowed to contain either 'ref' attribute OR 'value' attribute OR sub-element", ele);
        }

        //如果是ref，就创建一个ref数据对象RuntimeBeanReference，这个对象封装了ref的信息
        if (hasRefAttribute) {
            String refName = ele.getAttribute(REF_ATTRIBUTE);
            if (!StringUtils.hasText(refName)) {
                error(elementName + " contains empty 'ref' attribute", ele);
            }
            RuntimeBeanReference ref = new RuntimeBeanReference(refName);
            ref.setSource(extractSource(ele));
            return ref;
        }
        //如果是value，就创建一个value数据对象TypedStringValue，这个对象封装了value的信息
        else if (hasValueAttribute) {
            TypedStringValue valueHolder = new TypedStringValue(ele.getAttribute(VALUE_ATTRIBUTE));
            valueHolder.setSource(extractSource(ele));
            return valueHolder;
        }
        //如果property下还有诸如Array,List，Set，Map等元素，就继续对这些子元素进行解析
        else if (subElement != null) {
            return parsePropertySubElement(subElement, bd);
        }
        else {
            // Neither child element nor "ref" or "value" attribute found.
            error(elementName + " must specify a ref or value", ele);
            return null;
        }
    }
```

我们在XML文件中定义的BeanDefinition就被整个载入到了IoC容器当中，并生成了对应的BeanDefinition数据结构，这个BeanDefinition可以看成是POJO对象在IoC容器中的抽象。

这些数据结构可以以AbstractBeanDefinition为入口，让IoC容器执行索引、查询和操作。

至此，BeanDefinition的解析过程结束。

**BeanDefinition解析过程小结：**

- (1)XmlBeanDefinitionReader的registerBeanDefinitions（）：创建XML解析器：DefaultBeanDefinitionDocumentReader。—-》
- (2) DefaultBeanDefinitionDocumentReader的registerBeanDefinitions（）：获取Document对象中的元素，创建BeanDefinition解析的代理类BeanDefinitionParserDelegate，然后再交由BeanDefinitionParserDelegate具体的解析过程；—-》
- (3)BeanDefinitionParserDelegate的 parseBeanDefinitionElement（）开启对`<bean>`元素如property，构造函数等具体的解析。

至此，BeanDefinition的载入和解析过程就结束了。

#### **3. IoC容器注册BeanDefinition**

在上述步骤中，载入和解析的BeanDefinition并不能被IoC容器直接使用，还需要向IoC容器中注册。   
 这个过程的核心就是：   
 获取到beanName对应的BeanDefinition，   
 然后用HashMap直接保存：   
 `map.put(beanName, BeanDefinition);`

在上一步BeanDefinition的载入和解析过程分析中，其实就已经接触到了注册过程。下面看看注册的调用过程：   
 ![这里写图片描述](https://img-blog.csdn.net/20180123134626364?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

下面进入IoC容器DefaultListableBeanFactory，看看这个过程的具体实现。   
 在DefaultListableBeanFactory中，定义了一个Map来保存BeanDefinition：

```
/** Map of bean definition objects, keyed by bean name */
private final Map<String, BeanDefinition> beanDefinitionMap = new ConcurrentHashMap<>(256);
```

然后将解析得到的BeanDefinition设置到HashMap当中，需要注意的是如果遇到同名BeanName需要有对应的处理：

**DefaultListableBeanFactory.java**

```
    @Override
    public void registerBeanDefinition(String beanName, BeanDefinition beanDefinition)
            throws BeanDefinitionStoreException {

        Assert.hasText(beanName, "Bean name must not be empty");
        Assert.notNull(beanDefinition, "BeanDefinition must not be null");

        if (beanDefinition instanceof AbstractBeanDefinition) {
            try {
                ((AbstractBeanDefinition) beanDefinition).validate();
            }
            catch (BeanDefinitionValidationException ex) {
                throw new BeanDefinitionStoreException(beanDefinition.getResourceDescription(), beanName,
                        "Validation of bean definition failed", ex);
            }
        }

        BeanDefinition oldBeanDefinition;

        //这里需要判断BeanDefinition是否已经在IoC容器中注册过了
        oldBeanDefinition = this.beanDefinitionMap.get(beanName);
        //oldBeanDefinition != null说明注册过了。如果注册过且不允许覆盖，则抛异常
        if (oldBeanDefinition != null) {
            if (!isAllowBeanDefinitionOverriding()) {
                throw new BeanDefinitionStoreException(beanDefinition.getResourceDescription(), beanName,
                        "Cannot register bean definition [" + beanDefinition + "] for bean '" + beanName +
                        "': There is already [" + oldBeanDefinition + "] bound.");
            }
            else if (oldBeanDefinition.getRole() < beanDefinition.getRole()) {
                // e.g. was ROLE_APPLICATION, now overriding with ROLE_SUPPORT or ROLE_INFRASTRUCTURE
                if (this.logger.isWarnEnabled()) {
                    this.logger.warn("Overriding user-defined bean definition for bean '" + beanName +
                            "' with a framework-generated bean definition: replacing [" +
                            oldBeanDefinition + "] with [" + beanDefinition + "]");
                }
            }
            else if (!beanDefinition.equals(oldBeanDefinition)) {
                if (this.logger.isInfoEnabled()) {
                    this.logger.info("Overriding bean definition for bean '" + beanName +
                            "' with a different definition: replacing [" + oldBeanDefinition +
                            "] with [" + beanDefinition + "]");
                }
            }
            else {
                if (this.logger.isDebugEnabled()) {
                    this.logger.debug("Overriding bean definition for bean '" + beanName +
                            "' with an equivalent definition: replacing [" + oldBeanDefinition +
                            "] with [" + beanDefinition + "]");
                }
            }
            //直接注册
            this.beanDefinitionMap.put(beanName, beanDefinition);
        }
        else {
            if (hasBeanCreationStarted()) {
                // Cannot modify startup-time collection elements anymore (for stable iteration)
                synchronized (this.beanDefinitionMap) {
                    this.beanDefinitionMap.put(beanName, beanDefinition);
                    List<String> updatedDefinitions = new ArrayList<>(this.beanDefinitionNames.size() + 1);
                    updatedDefinitions.addAll(this.beanDefinitionNames);
                    updatedDefinitions.add(beanName);
                    this.beanDefinitionNames = updatedDefinitions;
                    if (this.manualSingletonNames.contains(beanName)) {
                        Set<String> updatedSingletons = new LinkedHashSet<>(this.manualSingletonNames);
                        updatedSingletons.remove(beanName);
                        this.manualSingletonNames = updatedSingletons;
                    }
                }
            }
            else {
                // Still in startup registration phase
                this.beanDefinitionMap.put(beanName, beanDefinition);
                this.beanDefinitionNames.add(beanName);
                this.manualSingletonNames.remove(beanName);
            }
            this.frozenBeanDefinitionNames = null;
        }

        if (oldBeanDefinition != null || containsSingleton(beanName)) {
            resetBeanDefinition(beanName);
        }
    }
```

可以看到，正常注册BeanDefinition的过程就是：

```
else {
this.beanDefinitionMap.put(beanName, beanDefinition);
this.beanDefinitionNames.add(beanName);             this.manualSingletonNames.remove(beanName);
}
```

把Bean的名字存入到同时，   
 把beanName作为Key，beanDefinition作为value，   
 存入到容器的beanDefinitionMap中去。

到此，就完成了BeanDefinition的注册过程。

**IoC容器的初始化过程总结**   
 经历了BeanDefinition的Resource资源定位，载入和解析，注册三个过程，IoC容器的初始化过程就完成了。此时IoC容器的BeanDefinition已经可以被容器使用了。   
 每一个Bean对应的BeanDefinition都是基础数据，但是并没有建立依赖关系，有了这些基础数据结构，接下来就可以进行依赖注入的过程了。   
 下篇文章将重点分析依赖注入的过程。