---
title: "Java SPI机制介绍与ServiceLoader应用"
date: 2019-10-13
category: 后端开发
tags: [SPI, ServiceLoader]
---

#### 1、SPI是什么

SPI全称Service Provider Interface（服务提供接口），是专门被第三方实现或者扩展的API，可以用来启用框架扩展和替换组件，提供了为某个接口寻找对应服务类的机制。

整体机制如下：  
![](./images/93c3d1bd58e790c7.png)  
(图片来源：https://www.jianshu.com/p/46b42f7f593c)

Java SPI 实际上是“基于接口的编程＋策略模式＋配置文件”组合实现的动态加载机制。

**Java SPI的实现要素：**

- 首先定义服务和接口名；
- 不同服务提供者实现了接口的实现类后，需要在jar包的META-INF/services目录下创建一个"接口全限定名"为命名的文件，内容对应即为该实现类的全限定名；
- 接口实现类所在jar包放在主程序classpath下；
- 服务调用方通过该接口时，引入提供者jar包 ，通过`java.util.ServiceLoder`动态装载提供者的实现模块，扫描提供者的META-INF/services目录下的配置文件找到实现类的全限定名，之后再将该类加载到JVM；
- SPI实现类必须携带一个不带参数的构造方法；

#### 2、Java SPI demo

举个例子看看SPI的应用。

在应用Java SPI之前，假设有个mq消息处理服务：

```
public interface KafkaProcessService {
    void processOrderMsg(Object msg);

}
```

我们提供服务实现后，打包，假设版本号为version=1.0；团队1使用了引入该jar并且直接调用服务方法`processOrderMsg()`。

之后团队2想调用一个支付消息处理的方法，那么我们就需要提供一个对应实现，并且将版本号升到version=2.0;；团队2使用了引入该jar并且直接调用服务方法`processPayMsg()`。

```
public interface KafkaProcessService {
    void processPayMsg(Object msg);
}
```

试想如果每增加一个实现，我们就要升一个版本，这会带来很大麻烦。

如何应用用Java SPI是如何处理这种麻烦？  
（1）首先定义接口：

```
public interface KafkaProcessService {
    void processMsg(Object msg);
}

具体实现类
public class KafkaOrderProcessServiceImpl implements KafkaProcessService {
    @Override
    public void processMsg(Object msg) {
        System.out.println("Order kafka msg process");
    }
}

public class KafkaPayProcessServiceImpl implements KafkaProcessService {
    @Override
    public void processMsg(Object msg) {
        System.out.println("Pay kafka msg process");
    }
}
```

（2）resources目录下新建/META\_INF/services目录，并创建一个与接口全限定名相同的文件，在文件中输入接口对应两个实现类的全限定名：  
![](./images/f1a1f9ca5eda6bb7.png)

（3）执行程序：

```
public class Invoker {

    public static void main(String[] args) {
            ServiceLoader<KafkaProcessService> processServices = ServiceLoader.load(KafkaProcessService.class);
            for (KafkaProcessService s : processServices) {
                s.processMsg(new Object());
            }

        }
}
```

运行项目后可以看到能够两个实现类均执行了。

#### 3、Java SPI 在框架中的应用

有人会说上面的例子看起来和本地应用策略模式实现的没有什么不同。实际上，SPI更多的应用场景：团队1定义接口且可以提供默认实现，团队2、3…引用接口，并且可以自行拓展接口的实现。

下面通过具体实例来体会SPI的应用。

##### 3.1 JDBC加载不同类型数据库驱动

JDBC数据库驱动的设计就是应用Java SPI机制。首先定义统一的规范：`java.sql.Driver`， 各大厂商（MySQL、Oracle）都会根据这个规范去实现各自的驱动逻辑。我们在使用JDBC客户端时候不需要改变代码，直接引入对应jar包，实际调用即使用对应的驱动实现。

分析下源码：

我们引入MySQL驱动后，JDBC连接数据库`java.sql.DriverManager`中就会使用SPI机制来加载具体的驱动实现：

```
public class DriverManager {
    // 省略部分代码
    static {
        loadInitialDrivers();
        println("JDBC DriverManager initialized");
    }
   
   // 使用SPI机制初始化驱动
   private static void loadInitialDrivers() {
        // 省略部分代码
		    
        // 使用ServiceLoader找到实现Driver的接口，进行实例化
        AccessController.doPrivileged(new PrivilegedAction<Void>() {
            public Void run() {

                ServiceLoader<Driver> loadedDrivers = ServiceLoader.load(Driver.class);
                Iterator<Driver> driversIterator = loadedDrivers.iterator();

                try{
                    while(driversIterator.hasNext()) {
                        driversIterator.next();
                    }
                } catch(Throwable t) {
                    // Do nothing
                }
                return null;
            }
        });

        println("DriverManager.initialize: jdbc.drivers = " + drivers);

        if (drivers == null || drivers.equals("")) {
            return;
        }
        String[] driversList = drivers.split(":");
        println("number of Drivers:" + driversList.length);
     
        // 遍历引用的驱动，通过Class.forName连接数据库
        for (String aDriver : driversList) {
            try {
                println("DriverManager.Initialize: loading " + aDriver);
                Class.forName(aDriver, true,
                        ClassLoader.getSystemClassLoader());
            } catch (Exception ex) {
                println("DriverManager.Initialize: load failed: " + ex);
            }
        }
    }
  
  
}
```

查看MySQL jar包中关于驱动具体实现：在META\_INF/services下声明了自己实现Driver接口的实现类，这样JDBCDriverManager在加载的时候就可以通过SPI找到MySQL的实现。  
![](./images/9feaa7ade7203c00.png)

##### 3.2 日志门面接口实现类加载

同理，SLF4J加载不同提供商的日志实现类也是类似的道理，我们在打印日志时使用的接口由Slf4j统一提供，但是具体实现可由log4j或者logback去实现，想用log4j或者logback的服务只要引入对应jar包即可。

##### 3.3 Dubbo 框架中SPI机制分析

Java SPI机制会加载所有接口实现类并且全部实例化，有些可能是用不到的，所以这造成了资源的浪费。

当有较多扩展时，SPI加载起来会有一定的耗时，且某个扩展加载失败会导致剩下的均无法加载。

因此，Dubbo优化了Java SPI机制，实现了自己的SPI机制。

Dubbo没有使用原生的ServiceLoader，而是自己实现了ExtensionLoader来加载扩展实现。

且Dubbo的配置目录是\*\*/META-INF/dubbo/internal\*\*，而不是**META-INF/services**.

比如序列化接口：`org.apache.dubbo.remoting.Codec2`，Dubbo提供了默认的实现类：`org.apache.dubbo.rpc.protocol.dubbo.DubboCountCodec`，并且在/META-INF/dubbo/internal去声明：  
![](./images/346a10872b7a4683.png)

使用的时候通过ExtensionLoader来加载所有实现类：

`Codec2 codec = ExtensionLoader.getExtensionLoader(Codec2.class).getExtension("dubbo");`

##### 3.4 Sentinel框架中SPI机制分析

Sentinel在应用初始化构建插槽链的时候，用到了Java SPI机制。

Sentinel定义了插槽链构建的接口：`com.alibaba.csp.sentinel.slotchain.SlotChainBuilder`，在resources/META-INF/services目录下声明了该接口，并且提供了默认的实现类：`com.alibaba.csp.sentinel.slots.DefaultSlotChainBuilder`。  
![](./images/4b57245a3b366f7d.png)

客户端引入Sentinel的jar包后，可以自己去实现SlotChainBuilder接口。

可以看下源码：

```
public final class SlotChainProvider {
      // 通过Java SPI 中的ServiceLoader加载实现SlotChainBuilder接口的实现类
      private static final ServiceLoader<SlotChainBuilder> LOADER =   ServiceLoader.load(SlotChainBuilder.class);
      
     private static void resolveSlotChainBuilder() {
        List<SlotChainBuilder> list = new ArrayList<SlotChainBuilder>();
        boolean hasOther = false;
        // 遍历SlotChainBuilder接口的实现类（包括Sentinel提供的默认实现类和客户端自己扩展的实现类）
        for (SlotChainBuilder builder : LOADER) {
            if (builder.getClass() != DefaultSlotChainBuilder.class) {
                hasOther = true;
                list.add(builder);
            }
        }
        if (hasOther) {
            builder = list.get(0);
        } else {
            // No custom builder, using default.
            builder = new DefaultSlotChainBuilder();
        }

    }  
}
```

(4) 应用ServiceLoader加载实现类

通过上面的分析，可以感受到ServiceLoader在Java SPI中的应用。实际上ServiceLoader在日常开发中也有很多应用，比如应用ServiceLoader加载实现类。

```
// (1)定义接口
public interface OrderRefundService {

    /**
     * 退款
     *
     * @param orderId
     */
    void refund(long orderId);
}

// (2)实现类：商家退款、客服退款、用户退款
@Service
@RefundTypeAnno(refundType = "customer")
public class CustomerOrderRefundService implements OrderRefundService {

    @Override
    public void refund(long orderId) {
        System.out.println("客服退款操作, orderId: " + orderId);
    }
}

@Service
@RefundTypeAnno(refundType = "merchant")
public class MerchantOrderRefundService implements OrderRefundService {


    @Override
    public void refund(long orderId) {
        System.out.println("商家退款操作, orderId: " + orderId);
    }
}

@Service
@RefundTypeAnno(refundType = "user")
public class UserOrderRefundService implements OrderRefundService {

    @Override
    public void refund(long orderId) {
        System.out.println("用户退款操作, orderId: " + orderId);
    }
}

//(3)注解代表退款类型
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
@Documented
public @interface RefundTypeAnno {

    String refundType();
}

//(4)退款manager类
@Component
public class OrderRefundServiceManager {

    private static AtomicBoolean initialized = new AtomicBoolean(false);

    private static Map<String, OrderRefundService> orderRefundMap = new HashMap<>();


    static {
        doInit();
    }

    private static void doInit() {
        if (!initialized.compareAndSet(false, true)) {
            return;
        }
        try {
            // 加载OrderRefundHandler接口的实现类
            ServiceLoader<OrderRefundService> orderRefundServiceLoader = ServiceLoader.load(OrderRefundService.class);
            if (orderRefundServiceLoader != null) {
                for (OrderRefundService orderRefundService : orderRefundServiceLoader) {
                    String refundType = parseRefundType(orderRefundService);
                    if (!StringUtils.isEmpty(refundType)) {
                        orderRefundMap.put(refundType, orderRefundService);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String parseRefundType(OrderRefundService orderRefundService) {
        // 获取注解中的退款类型
        RefundTypeAnno refundTypeAnno = orderRefundService.getClass().getAnnotation(RefundTypeAnno.class);
        if (refundTypeAnno != null) {
            return refundTypeAnno.refundType();
        } else {
            return null;
        }
    }


    public OrderRefundService getRefundProcessor(String refundType) {
        if (orderRefundMap != null && orderRefundMap.size() > 0) {
            return orderRefundMap.get(refundType);
        }
        return null;
    }


}


(5)测试类
@Controller
public class ServiceLoaderTest {

    @Autowired
    private OrderRefundServiceManager orderRefundServiceManager;

    @RequestMapping("/orderRefund")
    @ResponseBody
    public void refund(@RequestParam("refundType") String refundType,
                       @RequestParam("orderId") long orderId) {
        OrderRefundService orderRefundService = orderRefundServiceManager.getRefundProcessor(refundType);
        orderRefundService.refund(orderId);
    }
}
```

最后还需要在META-INF/services下声明类：![](./images/ab0898e77351152d.png)

#### 4、Java SPI原理分析

接着来看下ServiceLoader源码：

**ServiceLoader属性**

```
public final class ServiceLoader<S> implements Iterable<S> {
    // 扫描的目录
    private static final String PREFIX = "META-INF/services/";
    // 需要加载的类或接口
    private final Class<S> service;
    // 用于定位、加载、实例化实现的类的类加载器
    private final ClassLoader loader;
    // 创建ServiceLoader时采用的访问控制上下文
    private final AccessControlContext acc;
    // 缓存提供的实现类，按实例化的顺序
    private LinkedHashMap<String,S> providers = new LinkedHashMap<>();
    // 懒查找迭代器
    private LazyIterator lookupIterator;

}
```

从入口ServiceLoader.load() 方法看下ServiceLoader的具体实现：

```
1、入口
public static <S> ServiceLoader<S> load(Class<S> service) {
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        return ServiceLoader.load(service, cl);
}

private ServiceLoader(Class<S> svc, ClassLoader cl) {
        service = Objects.requireNonNull(svc, "Service interface cannot be null");
        loader = (cl == null) ? ClassLoader.getSystemClassLoader() : cl;
        acc = (System.getSecurityManager() != null) ? AccessController.getContext() : null;
        // 实现在这里
        reload();
}

public void reload() {
        providers.clear();
        lookupIterator = new LazyIterator(service, loader);
 }

2、看下LazyIterator中的实现：
// 获取所有jar包中META-INF/services下的声明的实现类路径
String fullName = PREFIX + service.getName();
if (loader == null)
    configs = ClassLoader.getSystemResources(fullName);
else
    // 获取所有实现类
    configs = loader.getResources(fullName);

3、加载类、实例化类、缓存类
// 通过Class.forName加载类
c = Class.forName(cn, false, loader);
// 实例化类
S p = service.cast(c.newInstance());
// 缓存类 （LinkedHashMap）
providers.put(cn, p);
```

总结下：

- 获取META-INF/services下的声明的实现类的路径；
- 通过路径获取所有实现类；
- 通过Class.forName加载类；
- 实例化类；
- 将实例化的类缓存起来 （LinkedHashMap）；

**Java SPI总结**

优点：解耦。使服务模块和调用者业务代码分离，而不是耦合在一起。应用程序可以根据实际业务情况启用框架或者替换框架中组件。

缺点：

- ServiceLoader用的是延迟加载，会遍历所有接口的实现类并且全部加载实例化。如果某些类不想使用也会被加载实例化，造成了浪费。可以参考Dubbo SPI机制进行优化。
- 多个并发多线程使用ServiceLoader类的实例是不安全的；

---

参考：https://www.jianshu.com/p/46b42f7f593c

https://www.itcodemonkey.com/article/14716.html