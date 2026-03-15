---
title: "使用Spring  SmartApplicationListener实现业务解耦"
date: 2019-10-30
category: 后端开发
tags: [SmartApplicationListener, Spring事件, 异步]
---

#### 一、SmartApplicationListener介绍

Spring ApplicationEvent以及对应的Listener提供了一个事件监听、发布订阅的实现，内部实现方式是观察者模式，可以解耦业务系统之间的业务，提供系统的可拓展性、复用性以及可维护性。

Spring 提供的ApplicationEvent & Listener有3种实现方式：

- @EventListener 注解的方式；
- 实现ApplicationListener接口；
- 实现SmartApplicationListener接口；

本文将要介绍SmartApplicationListener的使用方式。  
SmartApplicationListener接口继承了ApplicationListener 和 Ordered接口，实现了事件监听和排序的功能。

![](./images/2f23bd0f82c0d826.png)  
SmartApplicationListener提供了两个方法：

```
/**
 *  指定支持哪些类型的事件
 */
boolean supportsEventType(Class<? extends ApplicationEvent> var1);

/**
 *  指定支持发生事件所在的类型
 */
boolean supportsSourceType(Class<?> var1);
```

#### 二、 SmartApplicationListener代码实现

SmartApplicationListener是高级监听器，是ApplicationListener的子类，能够实现有序监听。

本文代码：https://github.com/nomico271/inspire-demo/tree/master/Ch2\_SmartApplicationListener

##### 1、SmartApplicationListener使用示例

假设订单在创建之后需要将订单创建的消息发送通知到Kafka集群做进一步处理，之前的伪代码可能为：

```
public void createOrder(long spuId) {
        
        // 创建订单
        long orderId = processCreateOrder(spuId);
        
        // 订单创建成功
        if (orderId > 0) {
            
            // 发送kafka消息
            sendKafkaMsg(orderId);
        }
        
    }
```

所有的流程都耦合在一起（当然本文只是举个例子，有些步骤是必须要耦合在一起的）。

那么使用SmartApplicationListener如何解耦这些步骤呢？

（1）首先定义事件源对象，对象中包含需要发送的基本信息。

```
public class OrderDTO {
    
    private long orderId;
    private String spuId;
    private int orderStatus;
    private Date createTime;
    private Date updateTime;
}
```

（2）定义发生的事件：

```
@Getter
public class OrderStatusMsgEvent extends ApplicationEvent {
    
    private OrderDTO orderDTO;

    /**
     * 重写构造函数
     *
     * @param source   发生事件的对象
     * @param orderDTO 注册用户对象
     */
    public OrderStatusMsgEvent(Object source, OrderDTO orderDTO) {
        super(source);
        this.orderDTO = orderDTO;
    }
}
```

（3）事件发布

```
// 抽象事件发布
public interface EventPublishService<T> {

    void publishEvent(T event);
}

// Spring 实现的事件发布组件
@Component("springEventPublishService")
public class SpringEventPublishService implements EventPublishService<ApplicationEvent>, ApplicationContextAware {

    private ApplicationContext applicationContext;
    
    @Override
    public void publishEvent(ApplicationEvent event) {
        applicationContext.publishEvent(event);
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }
}
```

（4）事件监听：当有事件发生时，监听到事件的变更通知做进一步处理

```
@Component
public class OrderEventListener implements SmartApplicationListener {

    /**
     * 支持的事件类型
     *
     * @param eventType
     * @return
     */
    @Override
    public boolean supportsEventType(Class<? extends ApplicationEvent> eventType) {
        return eventType == OrderStatusMsgEvent.class;
    }

    /**
     * 事件发生的目标类
     *
     * @param sourceType 事件发生的目标类类型
     * @return
     */
    @Override
    public boolean supportsSourceType(@Nullable Class<?> sourceType) {
        return true;
    }

    @Override
    public int getOrder() {
        return 0;
    }

    @Override
    public void onApplicationEvent(ApplicationEvent applicationEvent) {
        // 获取注册用户信息
        OrderStatusMsgEvent orderStatusMsgEvent = (OrderStatusMsgEvent) applicationEvent;
        OrderDTO orderInfo = orderStatusMsgEvent.getOrderDTO();

        // 模拟kafka发送
        // kafkaProducer.sendMsg(orderInfo);
        System.out.println("======kafka发送成功====");

    }
}
```

（5）改造：如何使用Spring事件发布机制实现业务解耦

在原伪代码中，使用上述方式进行改造，代码如下：

```
@Autowired
    @Qualifier("springEventPublishService")
    private EventPublishService publishService;

    public void createOrder(long spuId) {

        // 创建订单
        long orderId = processCreateOrder(spuId);

        // 订单创建成功
        if (orderId > 0) {
            // 利用事件发布机制实现创建订单与发送Kafka消息业务的解耦
            OrderDTO orderDTO = buildOrderInfo(orderId);
            publishService.publishEvent(new OrderStatusMsgEvent(this, orderDTO));
        }

    }
```

上面使用Spring SmartApplicationListener实现的事件驱动模型，使kafka消息发送从订单主流程业务中解耦出来。当然，上述只是个例子，光从例子上看并不能体现应用Spring的事件发布机制的简洁性。这个demo只是为了介绍Spring SmartApplicationListener的使用，在实际应用中可能有更适合用此方法实现业务解耦的场景，如订单状态变更时发送消息就可以使用本文介绍的方法。

##### 2、SmartApplicationListener支持异步使用示例

应用SmartApplicationListener实现的Spring 事件驱动模型可以配合使用Spring提供的`@Async`注解实现异步调用。`@Async`的实现是利用配置好的线程池任务ThreadPoolTaskExecutor执行注解所在的方法。

（1）Spring配置方式(参数自行配置)：

```
  <!-- 开启@AspectJ AOP代理 -->
    <aop:aspectj-autoproxy proxy-target-class="true"/>
    <!-- 任务执行器 -->
    <task:executor id="asyncExecutor" pool-size="10" queue-capacity="1024"/>
    <!--开启注解调度支持 @Async @Scheduled-->
    <task:annotation-driven executor="asyncExecutor" proxy-target-class="true"/>
```

（2）SpringBoot配置方式

```
@Configuration
@EnableAsync
public class ListenerAsyncConfiguration implements AsyncConfigurer {

    /**
     * 获取异步线程池执行对象
     * @return
     */
    @Override
    public Executor getAsyncExecutor() {
        //使用Spring内置线程池任务对象
        ThreadPoolTaskExecutor taskExecutor = new ThreadPoolTaskExecutor();
        //设置线程池参数
        taskExecutor.setCorePoolSize(5);
        taskExecutor.setMaxPoolSize(10);
        taskExecutor.setQueueCapacity(25);
        taskExecutor.initialize();
        return taskExecutor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return null;
    }
}
```

使用的时候，只要加上`@Async`注解即可：

```
@Component
public class OrderEventListener implements SmartApplicationListener {

    /**
     * 支持的事件类型
     *
     * @param eventType
     * @return
     */
    @Override
    public boolean supportsEventType(Class<? extends ApplicationEvent> eventType) {
        return eventType == OrderStatusMsgEvent.class;
    }

    /**
     * 事件发生的目标类
     *
     * @param sourceType 事件发生的目标类类型
     * @return
     */
    @Override
    public boolean supportsSourceType(@Nullable Class<?> sourceType) {
        return true;
    }

    @Override
    public int getOrder() {
        return 0;
    }

    @Override
    @Async
    public void onApplicationEvent(ApplicationEvent applicationEvent) {
        // 获取注册用户信息
        OrderStatusMsgEvent orderStatusMsgEvent = (OrderStatusMsgEvent) applicationEvent;
        OrderDTO orderInfo = orderStatusMsgEvent.getOrderDTO();

        // 模拟kafka发送
        // kafkaProducer.sendMsg(orderInfo);
        System.out.println("======kafka发送成功====");

    }
}
```

---

代码：https://github.com/nomico271/inspire-demo/tree/master/Ch2\_SmartApplicationListener  
参考：https://segmentfault.com/a/1190000011433514