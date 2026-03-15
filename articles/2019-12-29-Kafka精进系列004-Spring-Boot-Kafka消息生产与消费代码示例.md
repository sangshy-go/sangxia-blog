---
title: "【Kafka精进系列004】Spring Boot  + Kafka消息生产与消费代码示例"
date: 2019-12-29
category: 后端开发
tags: [SpringBoot, Kafka, kafka生产者代码实现, Kafka消费者代码实现]
---

在上两节中，我们分别在本地和Docker中安装启动了Kafka，并演示了Kafka消息的发送和接收过程。本节我们将我们基于Spring Boot和Kafka API来实现Kafka消息的生产与消费代码示例。

通过本文，你可以学到：

- Kafka生产者异步发送API介绍；
- Kafka生产者消息发送的代码实现；
- Kafka生产者发送的消息不丢失的配置参数；
- Kafka消费者常见的两种消费方案设计（单实例与多实例以及多线程消费）；
- Spring Boot整合Kafka实现Kafka生产与消费的完整过程

本文完整代码见[My Github Link](https://github.com/GenshenWang/inspire-demo/tree/master/Ch5_KafkaDemoLearning) .

#### 一、Kafka消息发送

首先需要说明的是，本文采用的是Kafka提供的消息发送和消费原生API。如果使用Spring-kafka提供的kafkaTemplate，使用方法也是一样的。

##### 1、创建测试Topic、运行消费者

在Kafka消息发送消息之前，需要在本地先启动ZK、Kafka，并启动一个消费者用于测试。以本人为例，我在Docker端启动一个Kafka容器后，分别启动kafka server和一个消费者，如下：

（1）启动Kafka  
 ![](./images/43b50aa04bfb2f76.png)  
 （2）创建新的Topic用于测试  
 ![](./images/cc56b19724336bc0.png)  
 (3)运行一个消费者，用于测试消息的消费  
 ![](./images/df09e9255f1fc5e3.png)  
 没有报错表示环境搭建正常。

##### 2、消息发送代码实现

Kafka消息发送的过程很简单，指定发送的Broker IP以及producer的一些参数后，就可以发送消息了。消息发送有同步和异步两种实现，下面我们来看下两种如何实现。

**（1）Produce参数配置**

application.yml

```
### Kafka
spring:
  kafka:
    bootstrap-servers: 192.168.1.199:9092

    #生产者的配置，大部分我们可以使用默认的，这里列出几个比较重要的属性
    producer:
      batch-size: 128
      retries: 3
      buffer-memory: 40960
      acks: all
      properties:
        linger.ms: 10
```

关于以上参数含义，将在下述进行讲解。

**注意：spring.kafka.bootstrap-servers后面的值需要换成自己本机启动的server IP.**

**（2）Producer初始化**

```
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Properties;


@Slf4j(topic = "kafka")
@Component
public class KafkaSender implements InitializingBean {

    /**
     * Kafka server服务器地址
     */
    @Value("${kafka.producer.servers}")
    private String kafkaServers;

    /**
     * Producer发送消息失败的时候重试次数
     */
    @Value("${kafka.producer.retries}")
    private int retries;

    /**
     * batch.size是producer批量发送的基本单位，
     * 默认是16384Bytes，即16kB
     */
    @Value("${kafka.producer.batch.size}")
    private int batchSize;

    /**
     * lingger.ms是sender线程在检查batch是否ready时候，
     * 判断有没有过期的参数，默认大小是0ms
     */
    @Value("${kafka.producer.linger}")
    private int linger;

    /**
     * producer可以用来缓存数据的内存大小
     */
    @Value("${kafka.producer.buffer.memory}")
    private int bufferMemory;

    /**
     * 多少ISR副本写入成功才算消息发送成功, all代表全部
     */
    @Value("${kafka.producer.acks}")
    private String acks;

    private KafkaProducer<String, String> producer;

		/**
		 * 初始化
		 */
    @Override
    public void afterPropertiesSet() throws Exception {
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaServers);
        props.put(ProducerConfig.RETRIES_CONFIG, retries);
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, batchSize);
        props.put(ProducerConfig.LINGER_MS_CONFIG, linger);
        props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, bufferMemory);
        props.put(ProducerConfig.ACKS_CONFIG, acks);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

        producer = new KafkaProducer<>(props);
    }
}
```

**（3）消息发送**

生产者在启动的时候，首先与我们指定的Broker建立一个TCP连接，之后向Kafka Broker发送消息。

目前，新版本的Kafka Producer的消息发送都是异步的，这代表你调用Kafka Producer的消息发送API会立即返回，但是不表示消息一定发送成功。

Kafka Producer消息发送API一般有两种：

```
// 无回调
producer.send(msg);
// 有回调  
producer.send(msg, callback)
```

这两个有啥区别呢？

> `producer.send(msg)`是无回调的，即调用者调用该API后会立即返回，无论是否发送成功。假如发送过后因为网络抖动导致消息没有发送至Kafka Broker端，调用者是无法感知该消息是否发送成功的，所以可能导致消息丢失；
>
> `producer.send(msg, callback)`：带回调的消息发送，即调用者调用该API后，消息如果成功发送至Broker端会在回调中告知消息成功发送。所以我们可以在回调里做一些处理，如果回调内容为空或者返回异常，那么就代表此条消息没有发送成功，我们可以通过重试来重新发送。该API可以避免Producer端消息丢失（当然，还需要Broker端的一些参数配置）。不过，由于带有回调，所以性能要比不带回调的API性能低一点。

下面想敲个黑板，简单说下生产环境如何正确实现Kafka producer消息发送。

（1）在生产环境中，我们优先推荐使用带有回调的API：`producer.send(msg, callback)`。

（2）设置 acks = all，acks 是 Producer 的一个参数，如果设置为all代表所有副本Broker接收并写入消息，这条消息才算是发送成功。如果不设置为all，假设第一台接收到消息并返回Producer消息成功后立马宕机，那么这条消息可能就算是丢失。

（3）batchSize和linger设置的值要适量。我在测试过程中，由于batchSize设置的值很小，导致消息未发送完主程序退出导致消息丢失。

下面看看两种API的实现：

**消息发送（无回调）**

```
/**
     * 消息同步发送
     *
     * @param topic
     * @param key
     * @param message
     */
    public void sendMsg(String topic, String key, String message) {
        ProducerRecord producerRecord = new ProducerRecord(topic, key, message);
        producer.send(producerRecord);
    }
```

**消息发送（带回调）**

```
/**
 * 异步发送kafka消息
 *
 * @param topic
 * @param key
 * @param message
 */
public void asyncSendMsg(String topic, String key, String message) {
    ProducerRecord producerRecord = new ProducerRecord(topic, key, message);
    producer.send(producerRecord, (recordMetadata, e) -> {
        if (e != null) {
            System.out.println("!!!+++error!!!!");
            log.error("kafka msg send error, topic={}, key={}, message={}, e={}", topic, key, message, e);
            return;
        }

        // send success
        if (recordMetadata != null) {
            System.out.println(">>>>>>>message:" + message);
            log.info("kafka msg send success, topic={}, key={}, partition:{}, offset:{}, timestamp:{}", topic, key, message, recordMetadata.partition(),
                    recordMetadata.offset(), recordMetadata.timestamp());
        } else {
            log.info("kafka msg send success result is null, topic={}, key={}, timestamp:{}", topic, key, message, recordMetadata.timestamp());
        }

    });
}
```

##### 3、测试

测试可以直接通过单测来测试，其中topic换成自己创建的topic名。

```
public class KafkaSenderTest extends BaseTest {


    @Autowired
    private KafkaSender kafkaSender;

    private static final String topic = "TestTtTopic003";

    @Test
    public void test() {
        for (int i = 0; i < 10; i++) {
            String msg = "kafka msg from code test, current num : " + i;
            //kafkaSender.asyncSendMsg(topic, null, msg);
            kafkaSender.sendMsg(topic, null, msg);
        }

       // 防止主程序过早结束导致消息未发送成功
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

    }

}
```

执行程序后，可以看到消费者成功接收到10条消息：  
 ![](./images/926bef26a736fabb.png)

#### 二、Kafka消息消费

Kafka Consumer并不是线程安全的，所以在使用的时候需要注意线程安全的问题，多个线程不能共享同一个Kafka Consumer实例。所以在使用的时候，常见的有两种设计方案：

- 消息接收（单个Consumer） + 消息处理（同个Consumer）
- 消息接收（Consumer组） + 消息处理（线程池异步处理）

下面看看两种方案具体介绍。

##### 1、消费模型模型设计

**（1）消息接收（单个Consumer） + 消息处理（同个Consumer）**

此种模式下，我们可以为每一个topic创建一个Kafka Consumer实例，该Kafka Consumer实例用于获取对应topic的消息，并且消息的处理逻辑也由该Consumer实例去处理，这样就将消息的获取与处理放在同一个线程当中，每个线程完整地执行消息的获取与处理。

注：当消息量很大的时候，此模型可以用多线程去优化。  
 ![](./images/319f848084323878.png)

**这种模型的好处是：**

- 每个线程使用自己专属的Kakfa Consumer实例，由于一个分区只能被一个Consumer消费，这样就能保证分区内消息的消费顺序；

当然，劣势也很明显：

- 每个线程维护自己的Kafka Consumer实例，这样会占用较多的系统资源；
- 由于每个线程完整地执行消息的获取与处理里欧及，一旦消息处理逻辑较重可能导致消费速度变慢导致Rebalance。

此种模型就像是不同的水果装在不同的货车上，每个货车由专门的人来负责水果的下货与打包。这样的缺点自然是浪费货车资源，同时如果水果打包耗时，必然会造成工作的停滞。

**（2）消息接收（单个Consumer） + 消息处理（线程池异步处理）**

此种模式下，配置一个Kafka Consumer实例用于接收所有topic对应的Kafka message，然后不同topic的消息处理交由线程池异步处理。  
 ![](./images/933891b0be3fd821.png)

**这种模型的好处是：**

正常情况下，单个消费者可以实现每秒几十万、上百万的吞吐量（当然跟机器配置、消息大小、分区等多种因素有关）。所以在消息量不是很巨大的时候，单个Consumer实例就可以实现消息的接收。由于具体的消息处理逻辑可能比较费时，所以可将消息丢给线程池去处理，这样就可以做到**消息接收与消息处理逻辑分离**。当消息量较大的时候，也可以增加消息处理的线程数，实现架构的可伸缩性。

当然，劣势也很明显：

当然，这种模式下，由于消息的获取与处理在分散在两个线程组中，导致消息的消费顺序不能得到保证；同时由于消费链路的增长，有可能出现消息的重复消费现象。

此种模型就像是 一辆货车上装有各种各样的水果，由一个人去下水果，剩下的多个人按水果的类型分别去包装不同品种的水果。

##### 2、消费模型代码实现

由于代码较多，具体实现已上传到github上。

**（1）消息接收（单个Consumer） + 消息处理（同个Consumer）**

首先构建一个工厂类用于生成不同topic对应的消费者：MyKafkaConsumerFactory.java

之后写一个抽象的消费者类：AbstractKafkaConsumer.java，该类继承了Thread.

之后不同topic可以写一个类去继承AbstractKafkaConsumer.java，用于消息的获取、处理，如：OrderPayConsumer、OrderRefundConsumer。

AbstractKafkaConsumer.java

```
@Slf4j
public abstract class AbstractKafkaConsumer extends Thread implements InitializingBean{

    protected KafkaConsumer consumer;
    private final AtomicBoolean closed = new AtomicBoolean(false);

    @Override
    public void run() {
        try {
            while (!closed.get()) {

                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(10000));
                for (ConsumerRecord<String, String> record : records) {
                    process(record);
                }
            }
        } catch (Exception e) {
            log.error("Kafka consumer poll records occur terrible error!, error msg:", e);
            if (!closed.get()) {
                throw e;
            }
        } finally {
            consumer.close();
        }

    }

    protected abstract void process(ConsumerRecord<String, String> record);

    private void shutdown() {
        if (closed.compareAndSet(false, true)) {
            this.interrupt();
            consumer.wakeup();
        }
    }
}
```

不同topic对应的consumer实现

```
@Component
@Slf4j
public class OrderPayConsumer extends AbstractKafkaConsumer {

    private static final String TOPIC = KafkaTopicConstant.ORDER_PAY_TOPIC;

    @Resource
    private KafkaMsgProcessorManager msgProcessorManager;

    @Override
    protected void process(ConsumerRecord<String, String> record) {
        log.info("OrderPayConsumer receive kafka msg.");
        msgProcessorManager.process(record);
    }


    @Override
    public void afterPropertiesSet() throws Exception {
        consumer = MyKafkaConsumerFactory.getInstance().createConsumer(Arrays.asList(TOPIC));
        this.start();
    }
}
```

完整的代码见项目中 v1目录下：  
 ![](./images/15af7ddf0d1d2085.png)

**（2）消息接收（单个Consumer） + 消息处理（线程池异步处理）**

**代码实现**

对于Kafka数据消费，我们可以通过消息监听的方式来实现消息的获取，当然你也可以使用原生的KafkaConsumer API通过`consumer.poll`的方法去实现。

Spring提供的Kafka的消费有多种：

- MessageListener：单数据消费
- BatchMessageListener：批量消费
- AcknowledgingMessageListener：具备ACK机制的单数据消费
- BatchAcknowledgingMessageListener：具备ACK机制的批量消费

本文直接用到了spring-kafka提供的AcknowledgingMessageListener(带有ACK机制的MessageListener)，消息的接收在类KafkaMessageConsumer.java中，代码中是通过非注解的方式实现的（也可以使用@KafkaListener注解去实现消息的消费）。

在这里，有必要提一下KafkaListenerContainerFactory类，KafkaListenerContainerFactory是用来创建Kafka Consumer实例的。

```
@Bean
public KafkaListenerContainerFactory<ConcurrentMessageListenerContainer<String, String>> kafkaListenerContainerFactory() {
        // 使用ConcurrentKafkaListenerContainerFactory, 指定线程数量(concurrency), 并发消费
        ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(concurrency);
        factory.getContainerProperties().setPollTimeout(pollTimeout);
        return factory;
    }
```

其中，concurrency的取值很重要，一般设置的值为 partitions >= 机器 \* concurrency.

即：假如有5个topic，每个topic4个分区，则partitions=20. 如果Consumer应用部署了两台机器，则机器数=2，所以concurrency = 20 / 2 = 10. 程序启动的时候KafkaListenerContainerFactory会创建10个consumer实例进行消费。如果>10，则可能导致部分消费者无消息可消费，一直处空闲状态。关于KafkaListenerContainerFactory的介绍，见下文。

**KafkaMessageListenerContainer**

Spring-kafka提供了KafkaListenerContainerFactory工厂类来生成KafkaMessageListenerContainer和ConcurrentMessageListenerContainer这两个类。

那么这两个类有什么区别呢？

> The `KafkaMessageListenerContainer` receives all message from all topics or partitions on a single thread. （KafkaMessageListenerContainer启动单个线程来接收所有topic或分区的Kafka消息）；
>
> `ConcurrentMessageListenerContainer` delegates to one or more `KafkaMessageListenerContainer` instances to provide multi-threaded consumption. （ConcurrentMessageListenerContainer创建多个KafkaMessageListenerContainer用于Consumer消费）

详情可参考StackOverflow[这篇介绍](https://stackoverflow.com/questions/54727660/spring-kafka-messagelistenercontainer/54734685#54734685).

`@KafkaListener`注解采用的就是ConcurrentMessageListenerContainer。

不同topic消息的处理逻辑在KafkaMsgProcessor下对应的processor类中（本文实现了订单退款与支付两种不同topic对应的processor处理），Consumer的配置见KafkaConsumerConfig.java.

```
@Slf4j(topic = "kafka")
@Component
public class KafkaMessageConsumer implements AcknowledgingMessageListener<String, String> {

    @Resource
    private KafkaMsgProcessorManager processorManager;

    private final ExecutorService kafkaPool = new ThreadPoolExecutor(5, 10,
            10, TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(1024),
            new NamedThreadFactory("Kafka-Listener"),
            new ThreadPoolExecutor.DiscardOldestPolicy());

    @Override
    public void onMessage(ConsumerRecord<String, String> consumerRecord, Acknowledgment acknowledgment) {

        kafkaPool.execute(() -> {
            boolean commit = false;
            try {
                log.info("Receive kafka message, topic={}, key={}, value={}, offset={}, timestamp={}",
                        consumerRecord.topic(), consumerRecord.key(), consumerRecord.value(), consumerRecord.offset(), consumerRecord.timestamp());

                // 消息处理
                processorManager.process(consumerRecord);

                commit = true;
            } catch (Exception e) {
                // 消费异常的时候, 不提交 (可以业务重试)
                log.error("Consume message error, topic={}, e:", consumerRecord.topic(), e);
                commit = false;
            } finally {
                // 消费成功, 手动提交位移
                if (commit) {
                    acknowledgment.acknowledge();
                }

            }

        });
    }


    public Set<String> listTopics() {
        return processorManager.getTopics();
    }
}
```

Consumer配置

```
@Configuration
@EnableKafka
public class KafkaConsumerConfig {


   @Value("${spring.kafka.bootstrap-servers}")
    private String servers;

    @Value("${spring.kafka.consumer.group-id}")
    private String groupId;

    /**
     * 是否自动提交
     */
    @Value("${spring.kafka.consumer.enable-auto-commit}")
    private boolean enableAutoCommit;

    /**
     * 执行超时时间
     */
    @Value("${spring.kafka.consumer.properties.session.timeout}")
    private String sessionTimeout;

    /**
     * 向zookeeper提交offset的频率，默认：5000
     */
    @Value("${spring.kafka.consumer.properties.auto.commit.interval}")
    private String autoCommitInterval;

    /**
     * 表示自动将偏移重置为最新的偏移量
     */
    @Value("${spring.kafka.consumer.properties.auto.offset.reset}")
    private String autoOffsetReset;

    /**
     * KafkaMessageListenerContainer监听器容器中启动的consumer个数
     */
    @Value("${spring.kafka.consumer.properties.concurrency}")
    private int concurrency;

    /**
     *  consumer连接超时时间
     *  在该时间段内consumer未发送心跳消息认为宕机
     */
    @Value("${spring.kafka.consumer.properties.pollTimeout}")
    private int pollTimeout;


    @Resource
    private KafkaMessageConsumer kafkaMessageConsumer;


    /*
     * The KafkaMessageListenerContainer receives all message from all topics or partitions on a single thread.
     * The ConcurrentMessageListenerContainer delegates to one or more KafkaMessageListenerContainer instances
     *     to provide multi-threaded consumption.
     *
     * @return
     */
    @Bean
    public KafkaListenerContainerFactory<ConcurrentMessageListenerContainer<String, String>> kafkaListenerContainerFactory() {
        // 使用ConcurrentKafkaListenerContainerFactory, 指定线程数量(concurrency), 并发消费
        ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        // 创建多个KafkaListenerContainer实例
        factory.setConcurrency(concurrency);
        factory.getContainerProperties().setPollTimeout(pollTimeout);
        return factory;
    }


    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        return new DefaultKafkaConsumerFactory<>(consumerConfigs());
    }

    @Bean
    public Map<String, Object>  consumerConfigs() {
        Map<String, Object> propsMap = new HashMap<>();
        propsMap.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, servers);
        propsMap.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        propsMap.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, autoCommitInterval);
        propsMap.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, sessionTimeout);
        propsMap.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        propsMap.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        propsMap.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        propsMap.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, autoOffsetReset);

        return propsMap;
    }


    /**
     * Start a listener
     *
     * Each KafkaMessageListenerContainer gets one Consumer (and one thread).
     * The thread continually poll()s the consumer, with the specified pollTimeout.
     *
     * @return
     */
    @Bean(initMethod = "doStart")
    public KafkaMessageListenerContainer kafkaMessageListenerContainer() {
        return new KafkaMessageListenerContainer(consumerFactory(), containerProperties());
    }

    @Bean
    public ContainerProperties containerProperties() {
        String[] topics = new String[kafkaMessageConsumer.listTopics().size()];
        kafkaMessageConsumer.listTopics().toArray(topics);
        ContainerProperties containerProperties = new ContainerProperties(topics);
        containerProperties.setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        containerProperties.setMessageListener(kafkaMessageConsumer);
        return containerProperties;
    }


}
```

完整的代码见 v2目录下：  
 ![](./images/1d5e6e173e3b9ee0.png)

##### 3. 测试

v1和v2两种测试基本类似。

注意：如果测试v1实现的消费者，需要注释掉v2版本中consumer的启动部分，防止对该版本产生影响；

同理，测试v2的时候，也需要注释掉v2部分的代码。

下面就以v2版本的代码测试为例：

（1）首先启动Docker容器创建两个topic（见代码中KafkaTopicConstant.java）,运行两个生产者（无Docker的可以在本地启动，注意IP要确认一致）。  
 ![](./images/0bdd53c86aab2cac.png)  
 （2）启动项目，生产者1、2分别发送订单号(随便数字)，通过日志输出可以看到程序正常接收到消息并且不同的processor进行了处理。  
 ![](./images/b22649ab168cff2e.png)