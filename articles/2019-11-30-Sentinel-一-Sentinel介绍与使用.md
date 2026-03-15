---
title: "【Sentinel（一）】Sentinel介绍与使用"
date: 2019-11-30
category: 后端开发
tags: [MetricFetcher   : Failed to fetch m, Sentinel, Sentinel控制台]
---

### 

#### 一、什么是Sentinel

> Sentinel是阿里开源的项目，提供了流量控制、熔断降级、系统负载保护等多个维度来保障服务之间的稳定性。

官网：https://github.com/alibaba/Sentinel/wiki

Sentinel主要特性：  
 ![](./images/4305a41cdc7ba48d.png)

Sentinel与Hystrix的区别

关于Sentinel与Hystrix的区别见：https://yq.aliyun.com/articles/633786/

总体来说：

Hystrix常用的线程池隔离会造成线程上下切换的overhead比较大；Hystrix使用的信号量隔离对某个资源调用的并发数进行控制，效果不错，但是无法对慢调用进行自动降级；Sentinel通过并发线程数的流量控制提供信号量隔离的功能；

此外，Sentinel支持的熔断降级维度更多，可对多种指标进行流控、熔断，且提供了实时监控和控制面板，功能更为强大。

#### 二、代码示例

下面跟随官网中提供的Quick Start Demo，去看看如何使用Sentinel实现限流和降级。  
 本文代码见：[github代码](https://github.com/nomico271/sentinel-demo/tree/master/Ch1_SentinelDemo)

注意：

- JDK >= 1.7;
- Sentinel版本为1.7.0；

引入Sentinel jar包：

```
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-core</artifactId>
    <version>1.7.0</version>
</dependency>
```

##### 1、限流

关于限流的使用和介绍见：Sentinel流量控制

流量控制(Flow Control)，原理是监控应用流量的QPS或并发线程数等指标，当达到指定阈值时对流量进行控制，避免系统被瞬时的流量高峰冲垮，保障应用高可用性。

下面写个简单的示例，看看如何使用Sentinel实现限流。

首先写个简单的订单查询接口，用于后续接口限流示例：

```
@Component
public class OrderQueryService {

    public String queryOrderInfo(String orderId) {
        System.out.println("获取订单信息:" + orderId);
        return "return OrderInfo :" + orderId;
    }
}

@Controller
@RequestMapping("order")
public class OrderController {
    @Autowired
    private OrderQueryService orderQueryService;

    @RequestMapping("/getOrder")
    @ResponseBody
    public String queryOrder1(@RequestParam("orderId") String orderId) {

        return orderQueryService.queryOrderInfo(orderId);
    }
}
```

正常情况下，调用OrderController中订单查询接口，会返回订单信息，如何控制接口访问的QPS在2以下呢？Sentienl限流提供了以下实现方式：

Sentienl如何使用 。

首先需要定义限流规则，比如对哪个接口进行限流，限制的QPS为多少，限制调用方app是什么等：

```
public void initFlowQpsRule() {
        List<FlowRule> rules = new ArrayList<FlowRule>();
        FlowRule rule1 = new FlowRule();
        rule1.setResource(KEY);
        // QPS控制在2以内
        rule1.setCount(2);
        // QPS限流
        rule1.setGrade(RuleConstant.FLOW_GRADE_QPS);
        rule1.setLimitApp("default");
        rules.add(rule1);
        FlowRuleManager.loadRules(rules);
    }
```

限流实现方式有多种，本文只列出常见两种：

**（1）限流实现方式一: 抛出异常的方式定义资源**

此方式对代码侵入性较高，需要在接口调用的地方通过`try-catch`风格的API对代码进行包装：

```
		/**
     * 限流实现方式一: 抛出异常的方式定义资源
     *
     * @param orderId
     * @return
     */
		@RequestMapping("/getOrder1")
    @ResponseBody
    public String queryOrder2(@RequestParam("orderId") String orderId) {

        Entry entry = null;
        // 资源名
        String resourceName = KEY;
        try {
            // entry可以理解成入口登记
            entry = SphU.entry(resourceName);
            // 被保护的逻辑, 这里为订单查询接口
            return orderQueryService.queryOrderInfo(orderId);
        } catch (BlockException blockException) {
            // 接口被限流的时候, 会进入到这里
            log.warn("---getOrder1接口被限流了---, exception: ", blockException);
            return "接口限流, 返回空";
        } finally {
            // SphU.entry(xxx) 需要与 entry.exit() 成对出现,否则会导致调用链记录异常
            if (entry != null) {
                entry.exit();
            }
        }

    }
```

测试，当QPS > 2时，接口返回：

![](./images/35b1e148008fdff4.png)

查看日志输出：

![](./images/2cafcea286dc29db.png)

这里注意到，Sentinel默认的日志输出文件位置为：`/{userhome}/logs/csp/`

![](./images/4cdd0ee2d7b80f63.png)

当接口发生限流的时候，我们看下Sentinel输出了什么日志：

日志格式为：时间戳 | 该秒发生的第一个资源 | 资源名称，拦截的原因，接口调用来源，|被拦截资源的调用者，被拦截的数量

![](./images/43c25381014cc658.png)

关于日志的描述，见 Sentienl 日志。

**（2）限流实现方式二: 注解方式定义资源**

上述通过`try-catch`风格的API可以实现限流，但是对代码侵入性太高，推荐使用注解的方式来实现。下文若不做注明，默认都会采用注解的方式实现。

关于注解的使用见：Sentinel注解使用

首先需要引入支持注解的jar包：

```
<dependency>
     <groupId>com.alibaba.csp</groupId>
     <artifactId>sentinel-annotation-aspectj</artifactId>
     <version>${sentinel.version}</version>
</dependency>
```

Sentinel切面类配置：

```
@Configuration
public class SentinelAspectConfiguration {

    @Bean
    public SentinelResourceAspect sentinelResourceAspect() {
        return new SentinelResourceAspect();
    }
}
```

在接口OrderQueryService中，使用注解实现订单查询接口的限流：

```
    /**
     * 订单查询接口, 使用Sentinel注解实现限流
     *
     * @param orderId
     * @return
     */
    @SentinelResource(value = "getOrderInfo", blockHandler = "handleFlowQpsException",
            fallback = "queryOrderInfo2Fallback")
    public String queryOrderInfo2(String orderId) {

        // 模拟接口运行时抛出代码异常
        if ("000".equals(orderId)) {
            throw new RuntimeException();
        }

        System.out.println("获取订单信息:" + orderId);
        return "return OrderInfo :" + orderId;
    }

    /**
     * 订单查询接口抛出限流或降级时的处理逻辑
     *
     * 注意: 方法参数、返回值要与原函数保持一致
     * @return
     */
    public String handleFlowQpsException(String orderId, BlockException e) {
        e.printStackTrace();
        return "handleFlowQpsException for queryOrderInfo2: " + orderId;
    }

    /**
     * 订单查询接口运行时抛出的异常提供fallback处理
     *
     * 注意: 方法参数、返回值要与原函数保持一致
     * @return
     */
    public String queryOrderInfo2Fallback(String orderId, Throwable e) {
        return "fallback queryOrderInfo2: " + orderId;
    }
```

- `blockHandler = "handleFlowQpsException"`用来处理Sentinel 限流/熔断等错误；
- `fallback = "queryOrderInfo2Fallback"`用来处理接口中业务代码所有异常(如业务代码异常、sentinel限流熔断异常等)；

注：以上两种处理方法中方法名、参数都需与受保护的函数保持一致。

测试：

```
		/**
     * 限流实现方式二: 注解定义资源
     *
     * @param orderId
     * @return
     */
    @RequestMapping("/getOrder2")
    @ResponseBody
    public String queryOrder3(@RequestParam("orderId") String orderId) {
        return orderQueryService.queryOrderInfo2(orderId);
    }
```

测试结果在这里就不贴出来了，结果类似。

##### 2、熔断降级

除了流量控制以外，对调用链路中不稳定的资源进行熔断降级也是保障高可用的重要措施之一。

由于调用关系的复杂性，如果调用链路中的某个资源不稳定，最终会导致请求发生堆积。Sentinel **熔断降级**会在调用链路中某个资源出现不稳定状态时（例如调用超时或异常比例升高），对这个资源的调用进行限制，让请求快速失败，避免影响到其它的资源而导致级联错误。当资源被降级后，在接下来的降级时间窗口之内，对该资源的调用都自动熔断（默认行为是抛出 `DegradeException`）。

关于熔断降级的介绍见：Sentinel熔断降级。

下面就使用基于注解的方式实现Sentinel的熔断降级的demo。

```
@Component
@Slf4j
public class GoodsQueryService {

    private static final String KEY = "queryGoodsInfo2";

    /**
     * 模拟商品查询接口
     *
     * @param spuId
     * @return
     */
    @SentinelResource(value = KEY, blockHandler = "blockHandlerMethod", fallback = "queryGoodsInfoFallback")
    public String queryGoodsInfo(String spuId) {

        // 模拟调用服务出现异常
        if ("0".equals(spuId)) {
            throw new RuntimeException();
        }

        return "query goodsinfo success, " + spuId;
    }

    public String blockHandlerMethod(String spuId, BlockException e) {
        log.warn("queryGoodsInfo222 blockHandler", e.toString());
        return "queryGoodsInfo error, blockHandlerMethod res: " + spuId;

    }

    public String queryGoodsInfoFallback(String spuId, Throwable e) {
        log.warn("queryGoodsInfo222 fallback", e.toString());
        return "queryGoodsInfo error, return fallback res: " + spuId;
    }

    @PostConstruct
    public void initDegradeRule() {
        List<DegradeRule> rules = new ArrayList<>();
        DegradeRule rule = new DegradeRule();
        rule.setResource(KEY);
        // 80s内调用接口出现异常次数超过5的时候, 进行熔断
        rule.setCount(5);
        rule.setGrade(RuleConstant.DEGRADE_GRADE_EXCEPTION_COUNT);
        rule.setTimeWindow(80);
        rules.add(rule);
        DegradeRuleManager.loadRules(rules);
    }
}


// 测试类
@Controller
@RequestMapping("goods")
public class GoodsController {

    @Autowired
    private GoodsQueryService goodsQueryService;

    @RequestMapping("/queryGoodsInfo")
    @ResponseBody
    public String queryGoodsInfo(@RequestParam("spuId") String spuId) {
        String res = goodsQueryService.queryGoodsInfo(spuId);
        return res;
    }
}
```

#### 三、控制台的使用

Sentinel 提供一个轻量级的开源控制台，它提供机器发现以及健康情况管理、监控（单机和集群），规则管理和推送的功能。

主要功能有：

- 查看机器列表以及健康情况；
- 监控；
- 规则管理和推送；
- 鉴权；

##### 1、启动Sentinel控制台

如何启动控制台见：启动控制台

启动方式：

（1）下载jar包，通过命令方式

在https://github.com/alibaba/Sentinel/releases下载对应版本的dashboard jar包，进入到该jar所在的目录，然后通过java命令运行该jar包即可：

```
java -Dserver.port=8080 \
-Dcsp.sentinel.dashboard.server=localhost:8080 \
-jar target/sentinel-dashboard.jar
```

![](./images/9c9f5d7c69fe6ce9.png)

（2）git clone 整个sentinel源码，进入sentinel-dashboard模块，执行打包命令：`mvn clean package`，生成一个可执行的 fat jar包，然后启动控制台，输入url：`localhost:8080`后即可进入主页面。

##### 2、客户端接入（Spring Boot项目接入控制台）

启动了控制台模块后，控制台页面都是空的，需要接入客户端。

（1）首先导入与控制台通信的jar包：

```
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-transport-simple-http</artifactId>
    <version>${sentinel.version}</version>
</dependency>
```

（2）配置 JVM 启动参数：

`-Dproject.name=sentinel-demo -Dcsp.sentinel.dashboard.server=127.0.0.1:8080 -Dcsp.sentinel.api.port=8719`

![](./images/b19ab5ea8fdea787.png)

启动应用。

注：在应用中需要有触发限流、降级的初始化代码。

本demo中`http://localhost:8083/order/getOrder1?orderId=123`接口执行多次，会触发限流操作，这时候再去看控制台：

![](./images/7ffa890ba13b45d8.png)

可以看到，getOrderInfo接口被限流的次数。

##### 4、控制台的使用

如果我们想使用Sentinel的限流和熔断功能，除了在代码中可以硬编码外，也可直接通过控制台进行粗略的对接口进行限流和熔断。

```
/**
     * 代码不加任何限流 熔断
     * @return
     */
    @RequestMapping("/test")
    @ResponseBody
    @SentinelResource("test")
    public String test() {
        return "test";
    }
```

执行`http://localhost:8083/goods/test`接口动作后，在页面上簇点链路中即可看到该接口已经被统计到：

![](./images/0c71586f41d1c18c.png)

点击流控，对该接口新增一条流控规则，配置如下：

![](./images/49958a9d12312565.png)

点击新增后，

![](./images/913e27f26f16ab36.png)

再去执行接口`http://localhost:8083/goods/test`，当QPS超过2时，即可看到接口返回异常，达到流控效果。

当然，控制台流控规则、降级规则的使用还有很多，可以参考官方文档看看具体如何使用。

---

PS

在接入控制台过程中，发现控制台一直会报error:

```
2019-11-30 20:42:23.338 ERROR 5317 --- [pool-2-thread-1] c.a.c.s.dashboard.metric.MetricFetcher   : Failed to fetch metric from <http://10.200.183.30:8721/metric?startTime=1575117735000&endTime=1575117741000&refetch=false> (ConnectionException: Connection refused)
```

错误原因是控制台在收集客户端数据时，从IP地址`http://10.200.183.30:8721`连接不上；

后发现原来开启了代理，关闭代理后就正常。

---

参考：

官方文档：https://github.com/alibaba/Sentinel/wiki

参考博客：https://www.jianshu.com/p/c47dfd25eeee  
 本文代码：https://github.com/nomico271/sentinel-demo/tree/master/Ch1\_SentinelDemo