---
title: "AMQP简介与RabbitMQ代码实战"
date: 2017-11-04
category: 后端开发
tags: [AMQP, RabbitMQ, spring整合mq]
---

### 一、AMQP简介

AMQP（Advanced Message Queuing Protocol），高级消息队列协议。一个提供统一消息服务的应用层标准高级消息队列协议，面向消息的中间件设计。   
 AMQP的主要特征是面向消息、队列、路由（包括点对点和发布/订阅）、可靠性、安全。

相比较于JMS规范，AMQP有以下优势：   
 1. JMS定义的是API规范，而AMQP定义了线路层的协议。即JMS实现所发送的消息不能保证被另外不同的JMS实现使用；   
 而AMQP的线路层协议规范了消息的格式，这样不仅能跨AMQP实现，还能跨语言和跨平台。   
 2. AMQP具有更加灵活和透明的消息模型。   
 JMS中只有点对点和发布-订阅两种模式；而AMQP通过将消息生产者与消息队列解耦实现多种方式来发送消息。

下面介绍下AMQP时如何实现解耦的。   
 在JMS规范当中，有3个重要元素：

- 消息生产者
- 消息消费者
- 消息通道（主题或队列）   
   ![Alt text](https://img-blog.csdn.net/20171104143645654?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
   （JMS）

消息生产者将消息发送到通道中，消费者从通道中取出数据消费。这里通道具有双重责任：   
 1）解耦消息的生产者与消费者；   
 2）传递数据以及确定消息发送地方。

而在AMQP当中，在消息的生产者与通道之间引入了一种机制：Exchange（交换器），解耦了消息的生产者与队列。   
 ![Alt text](https://img-blog.csdn.net/20171104143827707?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 （AMQP）

可以看到，消息生产者将消息（带有一个routing key参数）发送到Exchange上，Exchange会绑定一个或多个队列上，然后Exchange根据不同的路由模式，对比队列携带的routing key参数，负责将信息发送到不同队列上。

### 二、RabbitMQ简介

RabbitMQ是一个开源的AMQP实现，服务器端用Erlang语言编写，支持多种客户端，如：Python、Ruby、.NET、Java、JMS、C、PHP、ActionScript、XMPP、STOMP等，支持AJAX。用于在分布式系统中存储转发消息，在易用性、扩展性、高可用性等方面表现不俗。

##### 1. **RabbitMQ系统架构**

![Alt text](https://img-blog.csdn.net/20171104144039388?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 （图片来源：<http://blog.csdn.net/u013256816/article/details/59117354>）   
 如上图，红色线包围的有Exchange和Queue，在服务端，称作Broker，是由RabbitMQ实现的。剩下的则是客户端，有Prodcer和Consumer两种类型。

##### 2. **RabbitMQ核心概念**

RabbitMQ两大核心组件是Exchange和Queue。

**Queue**   
 Queue是一个不重复，唯一，名字随机的的缓冲区，应用程序在其权限之内可以自由地创建、共享使用和消费消息队列。   
 （在RabbitMQ中，队列的名字是系统随机创建的，且当Consumer与Queue断开连接的时候，Queue会被自动删除，在下一次连接时又会自动创建。）   
 ![Alt text](https://img-blog.csdn.net/20171104144653301?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 上图，两个队列的名字分别是“amqp.gen-RQ6…” 和 “amqp.gen-AsB..”，是随机产生的。

**Exchange**   
 Exchange称作交换器，它接收消息和路由消息，然后将消息发送给消息队列。每个交换器都有独一无二的名字。

**Routing Key**   
 生产者在将消息发送给Exchange的时候，一般会指定一个routing key，来指定这个消息的路由规则。   
 而这个routing key需要与Exchange Type及binding key联合使用才能最终生效。   
 在Exchange Type与binding key固定的情况下，生产者就可以在发送消息给Exchange时，通过指定routing key来决定消息流向哪里。   
 RabbitMQ为routing key设定的长度限制为255 bytes。

**Binding 和 Binding Key**   
 ![Alt text](https://img-blog.csdn.net/20171104144836145?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

每个Exchange都和一个特定的Queue绑定（可以是多对多的关系）。绑定的同时会指定一个binding key。   
 每个发送给Exchange的消息一般都有一个routing key参数；当队列与Exchange绑定的binding key与该消息的routing key参数相同的时候，该消息才会被Exchange发给特定的队列。   
 （这就好比我们上火车，我们就是消息，而手中的火车票就是routing key 。进站的时候，我们需要找到火车列次（binding key）与我们手中火车票信息匹配的车次才可以进站，即routing key = binding key才可以。）

**Exchange Type**   
 AMQP定义了4种不同类型的Exchange，每一种都有不同的路由算法。当消息发送到Exchange时，Exchange 会对比消息的routing key /参数 和 与其绑定的队列的binding key。如果对比结果满足相应的算法，那么消息将会路由到队列上；否则，将不会被路由到队列上。

4种标准的AMQP Exchange 如下所示：   
 **（1）Direct（直接式交换器）：**

> 如果消息的routing key 与 binding key 直接匹配，消息会被路由到该队列上（可以用此构建点对点传输模型）。   
>  如图：   
>  ![Alt text](https://img-blog.csdn.net/20171104144954851?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
>  生产者P发送消息到交换器X。   
>  如果消息的routing key 是 “orange”，则会被路由到队列Q1；   
>  如果消息的routing key 是 “black” 或 “green”，则会被路由到队列Q2。

当然，也可以实现多路绑定，即一个Exchange 和多个Queue绑定时可以有同样的 binding key。   
 ![Alt text](https://img-blog.csdn.net/20171104145024447?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 上图中，当一个消息的routing key 是 “black”，则会被同时路由到队列Q1和队列Q2。

**（2）Topic（主题式交换器）：**

> 如果消息的routing key 与 binding key 符合通配符匹配的话，消息会路由到该队列上。

匹配规则：

- binding key与routing key都是用句点号“. ”分隔的字符串：   
   如“stock.usd.nyse”、“nyse.vmw”、“quick.orange.rabbit”；
- 支持通配符：其中“\*”用于匹配一个单词，“#”用于匹配多个单词（可以是零个） 。

![Alt text](https://img-blog.csdn.net/20171104145152927?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 上图中：

- routingKey=”quick.orange.rabbit”的消息会同时路由到Q1与Q2；
- routingKey=”lazy.orange.fox”的消息会路由到Q1和Q2；
- routingKey=”lazy.brown.fox”的消息会路由到Q2;
- routingKey=”lazy.pink.rabbit”的消息会路由到Q2（只会投递给Q2一次，虽然这个routingKey与Q2的两个bindingKey都匹配）；
- routingKey=”quick.brown.fox”、routingKey=”orange”、routingKey=”quick.orange.male.rabbit”的消息将会被丢弃，因为它们没有匹配任何bindingKey。

**（3）Fanout（广播式交换器）：**

> 不管消息的routing key是什么，消息都会被路由到所有与该交换器绑定的队列中。   
>  ![Alt text](https://img-blog.csdn.net/20171104145233646?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
>  上图中，生产者（P）发送到Exchange（X）的所有消息都会路由到图中的两个Queue，并最终被两个消费者（C1与C2）消费。

**（4）Headers**

> headers类型的Exchange不依赖于routing key与binding key的匹配规则来路由消息，而是根据发送的消息内容中的headers属性进行匹配。

在绑定Queue与Exchange时指定一组键值对；当消息发送到Exchange时，RabbitMQ会取到该消息的headers（也是一个键值对的形式），对比其中的键值对是否完全匹配Queue与Exchange绑定时指定的键值对；如果完全匹配则消息会路由到该Queue，否则不会路由到该Queue。

### 三、RabbitMQ实战

（通过代码可以发现，RabbitMQ与ActiveMQ最大区别：ActiveMQ更像个救济站，只负责将粮食（消息）发送出去，只要有人来取即可；而RabbitMQ更像是邮局的Postman，负责将邮件（消息）投递到指定人的手中）。   
 下面用Java实现RabbitMQ的几个模式。   
 所有代码参考RabbitMQ官网：<https://www.rabbitmq.com/getstarted.html>（官网给了很详细的介绍，是学习RabbitMQ不二之选）。

##### **1 预备工作：**

首先在MAVEN官网导入RabbitMQ Java Client的依赖包；

```
<dependency>
  <groupId>com.rabbitmq</groupId>
  <artifactId>amqp-client</artifactId>
  <version>4.2.0</version>
</dependency>
```

##### **2 RabbitMQ的HelloWorld：**

不使用Exchange，使用RabbitMQ实现消息的发送与接收：   
 **Producer:**

```
package com.wgs.rabbitmq.helloworld;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

/**
 * Producer，发送消息到Queue中
 * Created by GenshenWang.nomico on 2017/11/2.
 */
public class RabbitMQProducer {

    private static final String QUEUE_NAME = "RABBITMQ_HELLO";

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        //在本地机器创建socket连接
        connectionFactory.setHost("localhost");
        //建立socket连接
        Connection connection = connectionFactory.newConnection();

        //创建Channel，含有处理信息的大部分API
        Channel channel = connection.createChannel();
        //声明一个Queue，用来存放消息
        channel.queueDeclare(QUEUE_NAME, false, false, false, null);
        //消息内容
        String message = "hello, little qute rabbitmq!";
        //发布消息
        channel.basicPublish("", QUEUE_NAME, null, message.getBytes());
        //发布消息成功提示信息
        System.out.println("RABBITMQ客户端成功发送信息：" +  message);

        //关闭连接
        channel.close();
        connection.close();


    }
}
```

**Consumer：**

```
package com.wgs.rabbitmq.helloworld;

import com.rabbitmq.client.*;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

/**
 * Consumer端，从Queue中获取消息，需要一直是监听状态。
 * Created by GenshenWang.nomico on 2017/11/2.
 */
public class RabbitMQConsumer {
    private static final String QUEUE_NAME = "RABBITMQ_HELLO";

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        //在本地机器创建socket连接
        connectionFactory.setHost("localhost");
        //建立socket连接
        Connection connection = connectionFactory.newConnection();

        /* 创建Channel，含有处理信息的大部分API */
        Channel channel = connection.createChannel();
        //声明一个Queue，用来获取消息。QUEUE_NAME需要与Producer端相同
        channel.queueDeclare(QUEUE_NAME, false, false, false, null);

        //从队列中异步获取消息，DefaultConsumer会设置一个回调来缓存消息。
        Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope,
                                       AMQP.BasicProperties properties, byte[] body)
                    throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println("Consumer获取消息：" + message );
            }
        };
        channel.basicConsume(QUEUE_NAME, true, consumer);

    }
}
```

##### **3 几种常见的使用场景：**

下面来看看RabbitMQ几种常见的使用场景的代码实现：   
 **（1）Direct（直接式交换器）：**   
 **Producer：**

```
package com.wgs.rabbitmq.direct;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

/**
 * Producer，发送消息到Queue中
 * Type:Direct
 * Created by GenshenWang.nomico on 2017/11/2.
 */
public class RabbitMQProducer_Direct {

    private static final String EXCHANGE_NAME = "RABBITMQ_Direct";

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("localhost");
        Connection connection = connectionFactory.newConnection();
        Channel channel = connection.createChannel();

        //指定Exchange的Type = "direct"
        channel.exchangeDeclare(EXCHANGE_NAME, "direct");

        String routingKey1 = "error";
        String message1 = "error infomations....";
        String routingKey2 = "warning";
        String message2 = "warning infomations....";
        String routingKey3 = "info";
        String message3 = "info infomations....";

        //指定消息的路由参数：routingKey，并发送消息
        channel.basicPublish(EXCHANGE_NAME, routingKey1, null, message1.getBytes());
        channel.basicPublish(EXCHANGE_NAME, routingKey2, null, message2.getBytes());
        channel.basicPublish(EXCHANGE_NAME, routingKey3, null, message3.getBytes());

        //发布消息成功提示信息
        System.out.println("RABBITMQ客户端成功发送信息：" +  message1);
        System.out.println("RABBITMQ客户端成功发送信息：" +  message2);
        System.out.println("RABBITMQ客户端成功发送信息：" +  message3);

        //关闭连接
        channel.close();
        connection.close();
    }
}
```

**Consumer：**   
 模拟了两个Consumer，   
 一个 bindingKey 是”error“;、，只能收到routing key 是 “error”的消息；   
 另一个是{“error”, “info”, “warning”}，可以收到routing key 是 {“error”, “info”, “warning”}的消息。   
 Consumer1:

```
package com.wgs.rabbitmq.direct;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.QueueingConsumer;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

/**
 * Consumer，从Queue获取消息
 * Type:Direct
 * Created by GenshenWang.nomico on 2017/11/2.
 */
public class RabbitMQConsumer_Direct {

    private static final String EXCHANGE_NAME = "RABBITMQ_Direct";

    private static String bindingKey = "error";

    public static void main(String[] args) throws Exception {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("localhost");
        Connection connection = connectionFactory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "direct");
        String queueName = channel.queueDeclare().getQueue();
        channel.queueBind(queueName, EXCHANGE_NAME, bindingKey);

        System.out.println(" ---【开始接收消息，退出请按CTRL+C】---");
        //RabbitMQConsumer_Topic consumer = new RabbitMQConsumer_Topic();
        QueueingConsumer consumer = new QueueingConsumer(channel);
        channel.basicConsume(queueName, true, consumer);

        while (true){
            QueueingConsumer.Delivery delivery = consumer.nextDelivery();
            String message = new String(delivery.getBody());
            String routingKey =  delivery.getEnvelope().getRoutingKey();
            System.out.println(" Consumer1接收消息： '" + routingKey + "':'" + message + "'");
        }

    }
}
```

Consumer2:

```
package com.wgs.rabbitmq.direct;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.QueueingConsumer;

/**
 * Consumer，从Queue获取消息
 * Type:Direct
 * Created by GenshenWang.nomico on 2017/11/2.
 */
public class RabbitMQConsumer2_Direct {

    private static final String EXCHANGE_NAME = "RABBITMQ_Direct";

    private static String[] bindingKeys = new String[]{"error", "info", "warning"};

    public static void main(String[] args) throws Exception {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("localhost");
        Connection connection = connectionFactory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "direct");
        String queueName = channel.queueDeclare().getQueue();
        System.out.println(">>>>" + queueName);

        //绑定：Exchange与Queue绑定
        for(String bindingKey : bindingKeys){
            channel.queueBind(queueName, EXCHANGE_NAME, bindingKey);
        }

        System.out.println(" ---【开始接收消息，退出请按CTRL+C】---");
        //RabbitMQConsumer_Topic consumer = new RabbitMQConsumer_Topic();
        QueueingConsumer consumer = new QueueingConsumer(channel);
        channel.basicConsume(queueName, true, consumer);

        while (true){
            QueueingConsumer.Delivery delivery = consumer.nextDelivery();
            String message = new String(delivery.getBody());
            String routingKey =  delivery.getEnvelope().getRoutingKey();
            System.out.println(" Consumer2接收消息： '" + routingKey + "':'" + message + "'");
        }

    }
}
```

**（2）Topic（主题式交换器）：**   
 **Producer：**

```
package com.wgs.rabbitmq.topic;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

/**
 * Producer，发送消息到Queue中
 * Type:Direct
 * Created by GenshenWang.nomico on 2017/11/2.
 */
public class RabbitMQProducer_Topic {

    private static final String EXCHANGE_NAME = "RABBITMQ_Topic";

    public static void main(String[] args) throws IOException, TimeoutException {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("localhost");
        Connection connection = connectionFactory.newConnection();
        Channel channel = connection.createChannel();

        //指定Exchange的Type = "Topic"
        channel.exchangeDeclare(EXCHANGE_NAME, "topic");

        String routingKey1 = "AAA.orange.BBB";
        String message1 = "Q1 infomations....";
        String routingKey2 = "lazy.orange.fox";
        String message2 = "Q1,Q2 infomations....";
        String routingKey3 = "lazy.brown.fox";
        String message3 = "Q2 infomations....";

        //指定消息的路由参数：routingKey，并发送消息
        channel.basicPublish(EXCHANGE_NAME, routingKey1, null, message1.getBytes());
        channel.basicPublish(EXCHANGE_NAME, routingKey2, null, message2.getBytes());
        channel.basicPublish(EXCHANGE_NAME, routingKey3, null, message3.getBytes());

        //发布消息成功提示信息
        System.out.println("RABBITMQ客户端成功发送信息：" +  message1);
        System.out.println("RABBITMQ客户端成功发送信息：" +  message2);
        System.out.println("RABBITMQ客户端成功发送信息：" +  message3);

        //关闭连接
        channel.close();
        connection.close();


    }
}
```

**Consumer：**   
 Topic模式下模拟了两个Consumer，   
 一个 bindingKey 是”*.orange.*“，只能收到routing key 匹配“\*.orange.”的消息；   
 另一个是{“*.*.rabbit”, “lazy.#”}，可以收到routing key 是匹配{“*.*.rabbit”, “lazy.#”}的消息。

Consumer1:

```
package com.wgs.rabbitmq.topic;

import com.rabbitmq.client.*;

import java.io.IOException;

/**
 * Consumer，从Queue获取消息
 * Type:Topic
 * Created by GenshenWang.nomico on 2017/11/2.
 */
public class RabbitMQConsumer_Topic {

    private static final String EXCHANGE_NAME = "RABBITMQ_Topic";

    private static String bindingKey = "*.orange.*";

    public static void main(String[] args) throws Exception {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("localhost");
        Connection connection = connectionFactory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "topic");
        //queueName是随机产生的
        String queueName = channel.queueDeclare().getQueue();
        channel.queueBind(queueName, EXCHANGE_NAME, bindingKey);

        System.out.println(" ---【开始接收消息，退出请按CTRL+C】---");

        Consumer consumer = new DefaultConsumer(channel){
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope,
                                       AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" Consumer1 Received '" + envelope.getRoutingKey() + "':'" + message + "'");
            }
        };
        channel.basicConsume(queueName, true, consumer);

    }
}
```

Consumer2:

```
package com.wgs.rabbitmq.topic;

import com.rabbitmq.client.*;

import java.io.IOException;

/**
 * Consumer，从Queue获取消息
 * Type:Topic
 * Created by GenshenWang.nomico on 2017/11/2.
 */
public class RabbitMQConsumer2_Topic {

    private static final String EXCHANGE_NAME = "RABBITMQ_Topic";

    private static String[] bindingKeys = new String[]{"*.*.rabbit", "lazy.#"};

    public static void main(String[] args) throws Exception {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("localhost");
        Connection connection = connectionFactory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "topic");
        String queueName = channel.queueDeclare().getQueue();
        //打印出来的queueName：>>>>amq.gen-QjLNUuPTzIHuaBq-TBL6fQ，是随机产生的
        System.out.println(">>>>" + queueName);

        //绑定：Exchange与Queue绑定
        for(String bindingKey : bindingKeys){
            channel.queueBind(queueName, EXCHANGE_NAME, bindingKey);
        }

        System.out.println(" ---【开始接收消息，退出请按CTRL+C】---");
        Consumer consumer = new DefaultConsumer(channel){
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope,
                                       AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" Consumer1 Received '" + envelope.getRoutingKey() + "':'" + message + "'");
            }
        };
        channel.basicConsume(queueName, true, consumer);

    }
}
```

**（3）Fanout（广播式交换器）：**   
 **Producer：**

```
package com.wgs.rabbitmq.fanout;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

/**
 * Producer
 * Type：Fanout
 * Created by GenshenWang.nomico on 2017/11/2.
 */
public class RabbitMQProducer_Fanout {

    public static final String EXCHANGE_NAME = "RABBITMQ_Fanout";

    public static void main(String[] args) throws Exception{

        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("localhost");
        Connection connection = connectionFactory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "fanout");
        String message = "This message is from Fanout mode.特点是Consumer均可获取到消息";
        channel.basicPublish(EXCHANGE_NAME, "", null, message.getBytes());

        System.out.println("---【Producer发送消息】" + message + "---" );

        channel.close();;
        connection.close();
    }
}
```

**Consumer：**   
 两个Consumer均能接收到消息：   
 consumer1：

```
package com.wgs.rabbitmq.fanout;

import com.rabbitmq.client.*;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

/**
 * Consumer2
 * Type：Fanout
 * Created by GenshenWang.nomico on 2017/11/2.
 */
public class RabbitMQConsumer_Fanout {

    public static final String EXCHANGE_NAME = "RABBITMQ_Fanout";
    public static void main(String[] args) throws Exception {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("localhost");
        Connection connection = connectionFactory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "fanout");
        //获取Queue随机名
        String queueName = channel.queueDeclare().getQueue();
        //Binding:绑定Queue与Exchange，此处没有binding key。
        channel.queueBind(queueName, EXCHANGE_NAME, "");

        System.out.println("---Consumer1 准备接收消息--");
        Consumer consumer = new DefaultConsumer(channel){
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope,
                                       AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" 【Consumer1 接收消息 】'" + message + "'");
            }
        };

        channel.basicConsume(queueName, true, consumer);
    }
}
```

consumer2：

```
package com.wgs.rabbitmq.fanout;

import com.rabbitmq.client.*;

import java.io.IOException;

/**
 * Consumer2
 * Type：Fanout
 * Created by GenshenWang.nomico on 2017/11/2.
 */
public class RabbitMQConsumer2_Fanout {

    public static final String EXCHANGE_NAME = "RABBITMQ_Fanout";
    public static void main(String[] args) throws Exception {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("localhost");
        Connection connection = connectionFactory.newConnection();
        Channel channel = connection.createChannel();

        channel.exchangeDeclare(EXCHANGE_NAME, "fanout");
        //获取Queue随机名
        String queueName = channel.queueDeclare().getQueue();
        //Binding:绑定Queue与Exchange，此处没有binding key。
        channel.queueBind(queueName, EXCHANGE_NAME, "");

        System.out.println("---Consumer2 准备接收消息--");
        Consumer consumer = new DefaultConsumer(channel){
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope,
                                       AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println(" 【Consumer2 接收消息 】'" + message + "'");
            }
        };

        channel.basicConsume(queueName, true, consumer);
    }
}
```

### 四、Spring整合RabbitMQ—使用RabbitTemplate

上述过程可以发现RabbitMQ发送接收消息的代码相当繁琐；类似于JMS，Spring AMQP提供RabbitTemplate来消除RabbitMQ发送和接收消息相关模板代码。

下面来看如何实现。

**1 首先MAVEN导入相关依赖包：**

```
<dependency>
     <groupId>com.rabbitmq</groupId>
     <artifactId>amqp-client</artifactId>
     <version>4.2.0</version>
</dependency>
<dependency>
     <groupId>org.springframework.amqp</groupId>
     <artifactId>spring-rabbit</artifactId>
     <version>1.4.3.RELEASE</version>
</dependency>
```

**2 配置文件：spring\_rabbitmq.xml**   
 （这里为了排版方便，我将Producer，Consumer的配置内容均放在一个文件当中。）

```
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:rabbit="http://www.springframework.org/schema/rabbit"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/rabbit
        http://www.springframework.org/schema/rabbit/spring-rabbit-1.4.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context.xsd">

    <!-- 自动装载bean使能-->
    <context:component-scan base-package="com.wgs.rabbitmq"/>
    <context:annotation-config/>

    <!--                           公共 配置                         -->
    <!--1 配置连接工厂-->
    <bean id="rabbitConnectionFactory" class="org.springframework.amqp.rabbit.connection.CachingConnectionFactory">
        <property name="host" value="127.0.0.1"></property>
        <property name="port" value="5672"></property>
        <property name="username" value="guest"></property>
        <property name="password" value="guest"></property>
    </bean>
    <!--  <rabbit:connection-factory id="rabbitConnectionFactory"
                                 host="localhost"
                                 port="5672"
                                 username="guest"
                                 password="guest"/>-->
    <!-- 2 Admin元素会创建一个RabbitMQ管理组件,producer中的exchange,queue会自动的利用该admin自动在spring中生成 -->
    <rabbit:admin  id="connAdmin" connection-factory="rabbitConnectionFactory"></rabbit:admin>

    <!--3 配置RabbitTemplate -->
    <rabbit:template id="amqpTemplate"  connection-factory="rabbitConnectionFactory" exchange="RABBITMQ_EXCHANGE_Direct"   />

    <!--                           Producer端 配置                         -->
    <!-- 1 声明队列 ： autoDelete:是否自动删除 durable:持久化  -->
    <rabbit:queue name="RABBITMQ_Q1" durable="true" declared-by="connAdmin" auto-delete="false" exclusive="false" />
    <rabbit:queue name="RABBITMQ_Q2" durable="true" declared-by="connAdmin" auto-delete="false" exclusive="false" />

    <!-- 2 声明Exchange、Binding -->
    <rabbit:direct-exchange name="RABBITMQ_EXCHANGE_Direct" declared-by="connAdmin"  durable="true" auto-delete="false">
        <rabbit:bindings>
            <rabbit:binding queue="RABBITMQ_Q1" key="error"></rabbit:binding>
            <rabbit:binding queue="RABBITMQ_Q2" key="warning"></rabbit:binding>
        </rabbit:bindings>
    </rabbit:direct-exchange>

    <bean id="rabbitMQProducerServiceImpl" class="com.wgs.rabbitmq.producer.RabbitMQProducerServiceImpl"></bean>

    <!--                          Consumer端 配置                         -->
   <bean id="rabbitMQConsumer1" class="com.wgs.rabbitmq.consumer.RabbitMQConsumer1"></bean>
   <bean id="rabbitMQConsumer2" class="com.wgs.rabbitmq.consumer.RabbitMQConsumer2"></bean>

    <rabbit:listener-container connection-factory="rabbitConnectionFactory" >
        <rabbit:listener queues="RABBITMQ_Q1"  ref="rabbitMQConsumer1"></rabbit:listener>
        <rabbit:listener queues="RABBITMQ_Q2"  ref="rabbitMQConsumer2"></rabbit:listener>
    </rabbit:listener-container>


</beans>
```

**3 代码实现**   
 **Producer：**   
 （1）先写一个接口：RabbitMQProducerService

```
package com.wgs.rabbitmq.producer;

import org.springframework.stereotype.Service;

/**
 * Producer
 * Type:Direct
 * Created by GenshenWang.nomico on 2017/11/3.
 */
public interface RabbitMQProducerService {
    /**
     * 发送消息
     * @param routingKey
     * @param msg 发送的消息内容
     */
    void sendMessage(String routingKey, Object msg);
}
```

（2）接口的实现：RabbitMQProducerServiceImpl

```
package com.wgs.rabbitmq.producer;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Producer
 * Type:Direct
 * Created by GenshenWang.nomico on 2017/11/3.
 */
public class RabbitMQProducerServiceImpl implements  RabbitMQProducerService{

    @Autowired
    RabbitTemplate rabbitTemplate;

    public void sendMessage( String routingKey, Object msg) {
        rabbitTemplate.convertAndSend(routingKey, msg);
    }
}
```

（3）测试：RabbitMQProducerMain

```
package com.wgs.rabbitmq.producer;

import org.springframework.context.support.ClassPathXmlApplicationContext;

/**
 * Producer Test
 * Type:Direct
 * Created by GenshenWang.nomico on 2017/11/3.
 */
public class RabbitMQProducerMain {

    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("spring_rabbitmq.xml");
        RabbitMQProducerService service = context.getBean(RabbitMQProducerService.class);

        System.out.println("Producer开始发送消息。。。");

        service.sendMessage("error", "111 hello mq");
        service.sendMessage("warning", "222 hello mq");
        System.out.println("Producer消息发送成功。。。");

        context.close();

    }
}
```

**Consumer：**   
 Consumer实现监听器类即可。这样在监听到有消息到达的时候即可显示消息。   
 Consumer1:

```
package com.wgs.rabbitmq.consumer;

import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageListener;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.stereotype.Component;

/**
 * Consumer
 * Type:Direct
 * Created by GenshenWang.nomico on 2017/11/3.
 */
public class RabbitMQConsumer1 implements MessageListener{

    public void onMessage(Message message) {
        System.out.println("RabbitMQConsumer1接收到消息>>>" + message);
        System.out.println("RabbitMQConsumer1接收到消息 " + new String(message.getBody()));
    }

}
```

Consumer2:

```
package com.wgs.rabbitmq.consumer;

import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.stereotype.Component;

/**
 * Consumer
 * Type:Direct
 * Created by GenshenWang.nomico on 2017/11/3.
 */
public class RabbitMQConsumer2 implements MessageListener{

    public void onMessage(Message message) {
        System.out.println("RabbitMQConsumer2接收到消息 " + new String(message.getBody()));
    }
}
```

**4 测试：**   
 启动RabbitMQProducerMain，发送消息，在Consumer端即可接收到消息：   
 接收到 的消息Message内容：

> (Body:’111 hello mq’MessageProperties [headers={}, timestamp=null, messageId=null, userId=null, appId=null, clusterId=null, type=null, correlationId=null, replyTo=null, contentType=text/plain, contentEncoding=UTF-8, contentLength=0, deliveryMode=PERSISTENT, expiration=null, priority=0, redelivered=false, receivedExchange=RABBITMQ\_EXCHANGE\_Direct, receivedRoutingKey=error, deliveryTag=1, messageCount=0])

直接显示消息的body即可，可以看到   
 ![这里写图片描述](https://img-blog.csdn.net/20171104145443619?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 在Type = Direct模式下，   
 routingKey = “error”的消息发送到Q1；routingKey = “warning”的消息发送到Q2。

---

2017/11/4 in NJ.   
 参考：   
 <http://blog.csdn.net/u013256816/article/details/59117354>   
 <http://blog.csdn.net/u013256816/article/details/59117354>