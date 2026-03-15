---
title: "JMS简介与ActiveMQ实战"
date: 2017-10-30
category: 后端开发
tags: [activemq, jms, 消息队列-java]
---

## JMS简介与ActiveMQ实战

### 一、异步通信

之前接触到的RMI，Hessian等技术都是同步通信机制。当客户端调用远程方法时，客户端必须等到远程方法完成后，才能继续执行。这段时间客户端一直会被阻塞（这样造成的用户体验很不好）。   
![Alt text](https://img-blog.csdn.net/20171030141242044?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
（同步通信）

同步通信有并不是程序之间交互的唯一方式，异步通信机制中，客户端不需要等待服务处理消息，可以继续执行，并且最终能够收到并处理消息。   
![Alt text](https://img-blog.csdn.net/20171030141340822?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
（异步通信）

**异步通信的优势**

- 无需等待。客户端只需要将消息发送给消息代理，不需要等待就可以继续执行别的任务，且确信消息会被投递给相应的目的地。
- 面向消息和解耦。 客户端不需要担心远程服务的接口规范，只需要把消息放入消息队列然后获取结果即可。

### 二、JMS

#### 1. 简介

在JMS出现之前，每个消息代理都是有不同的实现，这就使得不同代理之间的消息代码很难通用。JMS（Java Message Service，Java消息服务）是一个标准，定义了使用消息代理的通用API。即所有遵从规范的实现都使用通用的接口，类似于JDBC为数据库操作提供通用接口。

JMS几个重要的要素：

- Destination：消息从发送端发出后要走的通道。
- ConnectionFactory：连接工厂，用于创建连接的对象。
- Connection：连接接口，用于创建session。
- Session：会话接口，用于创建消息的发送者，接受者以及消息对象本身。
- MessageConsumer：消息的消费者。
- MessageProducer：消息的生产者。
- XXXMessage：各种类型的消息对象，包括ByteMessage、MapMessage、ObjectMessage、StreamMessage和TextMessage 5种。

#### 2. JMS消息模型

不同的消息系统有不同的消息模型。JMS提供了两种模型：Queue（点对点）和Topic（发布/订阅）。

**JMS Queue（点对点）模型**   
在点对点模型中，消息生产者生产消息发送到queue中，然后消息消费者从queue中取出并且消费消息，但不可重复消费。   
如图：   
![Alt text](https://img-blog.csdn.net/20171030141750004?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

> 发送者1，发送者2，发送者3各发送一条消息到服务器；   
> 消息1，2，3就会按照顺序形成一个队列，队列中的消息不知道自己会被哪个接收者消费；   
> 接收者1，2，3分别从队列中取出一条消息进行消费，每取出一条消息，队列就会将该消息删除，这样即保证了消息不会被重复消费。

JMS Queue模型也成为P2P(Point to Point)模型。

**JMS Topic（发布/订阅）模型**   
JMS Topic模型与JMS Queue模型的最大差别在于消息接收的部分。Topic模型类似于微信公众号，订阅了该公众号的接收者都可以接收到公众号推送的消息。   
如图：

![Alt text](https://img-blog.csdn.net/20171030142349344?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

> 发布者1，2，3分别发布3个主题1，2，3；   
> 这样订阅了主题1的用户群：订阅者1，2，3即能接收到主题1消息；同理订阅者4，5，6即能接收到主题2消息，订阅者7，8，9即能接收到主题3消息。

JMS Topic模型也成为Pus/Sub模型。

**两种模式下各要素的对比：**   
![这里写图片描述](https://img-blog.csdn.net/20171030142515260?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

#### 3. 传统JMS编程模型

**Producer：**

> （1）创建连接工厂ConnectionFactory；   
> （2） 使用连接工厂创建连接；   
> （3）启动连接；   
> （4）创建会话；   
> （5） 创建消息发送的目的地；   
> （6）创建生产者；   
> （7）创建消息类型和消息内容；   
> （8）发送消息；

**Consumer：**

> （1）创建连接工厂ConnectionFactory；   
> （2） 使用连接工厂创建连接；   
> （3）启动连接；   
> （4）创建会话；   
> （5） 创建消息发送的目的地；   
> （6）创建消费者   
> （7）创建消息类型；   
> （8）接收消息；

### 三、 ActiveMQ简介

ActiveMQ 是Apache出品，最流行的，能力强劲的开源消息总线。ActiveMQ 是一个完全支持JMS1.1和J2EE 1.4规范的 JMS Provider实现，尽管JMS规范出台已经是很久的事情了，但是JMS在当今的J2EE应用中间仍然扮演着特殊的地位。

ActiveMQ 主要特性：

1. 多种语言和协议编写客户端。语言: Java,C,C++,C#,Ruby,Perl,Python,PHP。应用协议：   
   OpenWire,Stomp REST,WS Notification,XMPP,AMQP
2. 完全支持JMS1.1和J2EE 1.4规范 （持久化，XA消息，事务)
3. 对spring的支持，ActiveMQ可以很容易内嵌到使用Spring的系统里面去，而且也支持Spring2.0的特性
4. 通过了常见J2EE服务器（如 Geronimo,JBoss 4,GlassFish,WebLogic)的测试，其中通过JCA 1.5 resource adaptors的配置，可以让ActiveMQ可以自动的部署到任何兼容J2EE 1.4 商业服务器上
5. 支持多种传送协议：in-VM,TCP,SSL,NIO,UDP,JGroups,JXTA
6. 支持通过JDBC和journal提供高速的消息持久化
7. 从设计上保证了高性能的集群，客户端-服务器，点对点
8. 支持Ajax
9. 支持与Axis的整合
10. 可以很容易得调用内嵌JMS provider，进行测试

### 四、 ActiveMQ实战

下面看看如何ActiveMQ实现一个简单的消息队列。

#### 传统的JMS编程模型

##### 1. **JMS Queue模型代码实现：**

**Producer：**

```
package com.wgs.mq.queue;

import org.apache.activemq.ActiveMQConnectionFactory;

import javax.jms.*;

/**
 * Created by GenshenWang.nomico on 2017/10/19.
 */
public class ActiveMQProducer {
    private static final String URL = "tcp://localhost:61616";
    private static final String QUEUE_NAME = "queue-name";

    public static void main(String[] args) throws JMSException {
        //1 创建连接工厂ConnectionFactory
        ConnectionFactory connectionFactory = new ActiveMQConnectionFactory(URL);
        //2 使用连接工厂创建连接
        Connection connection = connectionFactory.createConnection();
        //3 启动连接
        connection.start();
        //4 创建会话
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        //5 创建消息发送的目的地
        Destination destination = session.createQueue(QUEUE_NAME);
        //6 创建生产者
        MessageProducer messageProducer = session.createProducer(destination);
        //7 创建消息
        TextMessage textMessage = session.createTextMessage();

        for (int i = 1; i <= 100; i++) {
            //8 创建消息内容
            textMessage.setText("发送者- 1 -发送消息：" + i);
            //9 发送消息
            messageProducer.send(textMessage);
        }
        System.out.println("消息发送成功");

        session.close();
        connection.close();
    }

}
```

**Conusmer：**

```
package com.wgs.mq.queue;

import org.apache.activemq.ActiveMQConnectionFactory;

import javax.jms.*;

/**
 * Created by GenshenWang.nomico on 2017/10/19.
 */
public class ActiveMQConsumer {
    private static final String URL = "tcp://localhost:61616";
    private static final String QUEUE_NAME = "queue-name";

    public static void main(String[] args) throws JMSException {
        //1 创建连接工厂ConnectionFactory
        ConnectionFactory connectionFactory = new ActiveMQConnectionFactory(URL);
        //2 使用连接工厂创建连接
        Connection connection = connectionFactory.createConnection();
        //3 启动连接
        connection.start();
        //4 创建会话
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        //5 创建消息发送的目的地
        Destination destination = session.createQueue(QUEUE_NAME);
        //6 创建消费者
        MessageConsumer messageConsumer = session.createConsumer(destination);

        messageConsumer.setMessageListener(new MessageListener() {
            public void onMessage(Message message) {
                //7 创建消息
                TextMessage textMessage = (TextMessage)message;
                try {
                    //7 接收消息
                    System.out.println("消费者- 1 -接收消息：【" + textMessage.getText() + "】");
                } catch (JMSException e) {
                    e.printStackTrace();
                }
            }
        });
    }
}
```

##### 2. **JMS Topic模型代码实现：**

**Producer：**

```
package com.wgs.mq.topic;

import org.apache.activemq.ActiveMQConnectionFactory;

import javax.jms.*;

/**
 * 发布订阅模式
 * Created by GenshenWang.nomico on 2017/10/19.
 */
public class ActiveMQProducer {
    private static final String URL = "tcp://localhost:61616";
    private static final String TOPIC_NAME = "topic-name";

    public static void main(String[] args) throws JMSException {
        //1 创建连接工厂ConnectionFactory
        ConnectionFactory connectionFactory = new ActiveMQConnectionFactory(URL);
        //2 使用连接工厂创建连接
        Connection connection = connectionFactory.createConnection();
        //3 启动连接
        connection.start();
        //4 创建会话
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        //5 创建带有主题的消息发送的目的地
        Destination destination = session.createTopic(TOPIC_NAME);
        //6 创建生产者
        MessageProducer messageProducer = session.createProducer(destination);
        //7 创建消息
        TextMessage textMessage = session.createTextMessage();

        for (int i = 1; i <= 100; i++) {
            //8 创建消息内容
            textMessage.setText("发送者- 1 -发送消息：" + i);
            //9 发送消息
            messageProducer.send(textMessage);
        }
        System.out.println("消息发送成功");

        session.close();
        connection.close();
    }

}
```

**Consumer：**

```
package com.wgs.mq.topic;

import org.apache.activemq.ActiveMQConnectionFactory;

import javax.jms.*;

/**
 * 发布订阅模式
 * Created by GenshenWang.nomico on 2017/10/19.
 */
public class ActiveMQConsumer {
    private static final String URL = "tcp://localhost:61616";
    private static final String TOPIC_NAME = "topic-name";

    public static void main(String[] args) throws JMSException {
        //1 创建连接工厂ConnectionFactory
        ConnectionFactory connectionFactory = new ActiveMQConnectionFactory(URL);
        //2 使用连接工厂创建连接
        Connection connection = connectionFactory.createConnection();
        //3 启动连接
        connection.start();
        //4 创建会话
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        //5 创建消息发送的目的地
        Destination destination = session.createTopic(TOPIC_NAME);
        //6 创建消费者
        MessageConsumer messageConsumer = session.createConsumer(destination);

        messageConsumer.setMessageListener(new MessageListener() {
            public void onMessage(Message message) {
                //7 创建消息
                TextMessage textMessage = (TextMessage)message;
                try {
                    //7 接收消息
                    System.out.println("消费者- 1 -接收消息：【" + textMessage.getText() + "】");
                } catch (JMSException e) {
                    e.printStackTrace();
                }
            }
        });
    }
}
```

#### 使用Spring的JMS模板

虽然JMS为所有的消息代理提供了统一的接口，但如同JDBC一样，在处理连接，语句，结果集和异常时会显得很繁杂。不过，Spring为我们提供了JmsTemplate来消除冗余和重复的JMS代码。   
下面看看如何使用JmsTemplate来实现消息队列。

##### 1. **JMS Queue模型代码实现：**

**配置文件：**   
producer.xml:

```
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd">

    <context:annotation-config/>

    <!-- ActiveMQ提供的ConnectionFactory-->
    <bean id="targetConnectionFactory" class="org.apache.activemq.ActiveMQConnectionFactory">
        <property name="brokerURL" value="tcp://localhost:61616"/>
    </bean>

    <!-- 在Spring 中配置JMS连接工厂，连接到ActiveMQ提供的ConnectionFactory-->
    <bean id="connectionFactory" class="org.springframework.jms.connection.SingleConnectionFactory">
        <property name="targetConnectionFactory" ref = "targetConnectionFactory"/>
    </bean>

    <!-- 配置JmsTemplate，用于发送消息 -->
    <bean id="jmsTemplate" class="org.springframework.jms.core.JmsTemplate">
        <property name="connectionFactory" ref="connectionFactory"/>
    </bean>

    <!-- 配置队列目的地的名称-->
    <bean id="queueDestination" class="org.apache.activemq.command.ActiveMQQueue">
        <constructor-arg value="queue-spring-name"/>
    </bean>
    <!-- 配置队列目的地的名称-->
    <bean id="topicDestination" class="org.apache.activemq.command.ActiveMQTopic">
        <constructor-arg value="topic-spring-name"/>
    </bean>

    <bean id="producerServiceImpl" class="com.wgs.jms.producer.ActiveMQProducerServiceImpl"/>


</beans>
```

consumer.xml:

```
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd">

    <context:annotation-config/>

    <!-- ActiveMQ提供的ConnectionFactory-->
    <bean id="targetConnectionFactory" class="org.apache.activemq.ActiveMQConnectionFactory">
        <property name="brokerURL" value="tcp://localhost:61616"/>
    </bean>

    <!-- 在Spring 中配置JMS连接工厂，连接到ActiveMQ提供的ConnectionFactory-->
    <bean id="connectionFactory" class="org.springframework.jms.connection.SingleConnectionFactory">
        <property name="targetConnectionFactory" ref = "targetConnectionFactory"/>
    </bean>

    <!-- 配置队列目的地的名称-->
    <bean id="queueDestination" class="org.apache.activemq.command.ActiveMQQueue">
        <constructor-arg value="queue-spring-name"/>
    </bean>
    <!-- 配置消息监听器-->
    <bean id="consumerMessageListener" class="com.wgs.jms.consumer.ConsumerMessageListener"/>
    <!-- 配置队列目的地的名称-->
    <bean id="jmsContainer" class="org.springframework.jms.listener.DefaultMessageListenerContainer">
        <property name="destination" ref="queueDestination"/>
        <property name="connectionFactory" ref="connectionFactory"/>
        <property name="messageListener" ref="consumerMessageListener"/>
    </bean>
    <!-- 配置队列目的地的名称-->
    <bean id="topicDestination" class="org.apache.activemq.command.ActiveMQTopic">
        <constructor-arg value="topic-spring-name"/>
    </bean>
</beans>
```

**生产者Producer：**   
（1）先写一个接口：

```
package com.wgs.jms.producer;

/**
 * Created by GenshenWang.nomico on 2017/10/20.
 */
public interface ActiveMQProducerService {
    void sendMessage(final String message);
}
```

（2）接口的实现：

```
package com.wgs.jms.producer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.core.MessageCreator;

import javax.annotation.Resource;
import javax.jms.*;

/**
 * Created by GenshenWang.nomico on 2017/10/20.
 */
public class ActiveMQProducerServiceImpl implements ActiveMQProducerService {

    @Autowired
    JmsTemplate jmsTemplate;
    @Resource(name = "queueDestination")
    Destination destination;

    public void sendMessage(final String message) {

        jmsTemplate.send(destination, new MessageCreator() {
            public Message createMessage(Session session) throws JMSException {
                TextMessage textMessage = session.createTextMessage(message);
                return textMessage;
            }
        });
        System.out.println("生产者- 1 -发送消息成功：" + message);
    }
}
```

（3）测试：

```
package com.wgs.jms.producer;

import org.springframework.context.support.ClassPathXmlApplicationContext;

/**
 * Created by GenshenWang.nomico on 2017/10/20.
 */
public class ActiveMQProducerMain {
    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("producer.xml");
        ActiveMQProducerService service = context.getBean(ActiveMQProducerService.class);
        for (int i = 0; i < 100; i++) {
            service.sendMessage("test" + i);
        }
        context.close();
    }
}
```

消费者：   
（1）创建消息监听器：

```
package com.wgs.jms.consumer;

import javax.jms.JMSException;
import javax.jms.Message;
import javax.jms.MessageListener;
import javax.jms.TextMessage;

/**
 * Created by GenshenWang.nomico on 2017/10/20.
 */
public class ConsumerMessageListener implements MessageListener {
    public void onMessage(Message message) {
        try {
            TextMessage textMessage = (TextMessage) message;
            System.out.println("消费者- 1 -接收消息：" + textMessage.getText());
        } catch (JMSException e) {
            e.printStackTrace();
        }
    }
}
```

（2）测试：

```
package com.wgs.jms.consumer;

import org.springframework.context.support.ClassPathXmlApplicationContext;

/**
 * Created by GenshenWang.nomico on 2017/10/20.
 */
public class ActiveMQConsumerMain {
    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("consumer.xml");
    }
}
```

##### 2. **JMS Topic模型代码实现：**

将上述代码中出现的queueDestination改为topicDestination即可。