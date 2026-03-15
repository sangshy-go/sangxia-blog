---
title: "【Kafka精进系列003】Docker环境下搭建Kafka集群"
date: 2019-12-29
category: 后端开发
tags: []
---

在上一节[【Kafka精进系列002】Docker环境下Kafka的安装启动与消息发送](https://blog.csdn.net/noaman_wgs/article/details/103672808)中我们已经演示了如何在Docker中进行Kafka的安装与启动，以及成功地测试了Kafka消息的发送与接收过程。

在实际生产环境中，Kafka都是集群部署的，常见的架构如下：  
 ![](./images/821bdb4ed6904fa9.png)

Kafka集群由多个Broker组成，每个Broker对应一个Kafka实例。Zookeeper负责管理Kafka集群的Leader选举以及Consumer Group发生变化的时候进行reblance操作。

本文将演示如何在Docker环境中搭建Zookeeper + Kafka集群。

通过本文，你将了解到：

- 如何使用Docker进行Kafka集群搭建；
- 如何使用Docker-compose一键构建Kakfa单节点和集群服务；
- 使用`docker-compose down -v`解决docker-compose初始化创建topic时无法创建多分区问题记录；

#### 一、Kafka集群搭建

##### 1、首先运行Zookeeper（本文并未搭建ZK集群）：

```
docker run -d --name zookeeper -p 2181:2181 -t wurstmeister/zookeeper
```

##### 2、分别创建3个Kafka节点，并注册到ZK上：

不同Kafka节点只需要更改端口号即可。

Kafka0：

```
docker run -d --name kafka0 -p 9092:9092 -e KAFKA_BROKER_ID=0 -e KAFKA_ZOOKEEPER_CONNECT=192.168.0.104:2181 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.0.104:9092 -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092 -t wurstmeister/kafka
```

Kafka1：

```
docker run -d --name kafka1 -p 9093:9093 -e KAFKA_BROKER_ID=1 -e KAFKA_ZOOKEEPER_CONNECT=192.168.0.104:2181 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.0.104:9093 -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9093 -t wurstmeister/kafka
```

Kafka2：

```
docker run -d --name kafka2 -p 9094:9094 -e KAFKA_BROKER_ID=2 -e KAFKA_ZOOKEEPER_CONNECT=192.168.0.104:2181 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.0.104:9094 -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9094 -t wurstmeister/kafka
```

注意：以上节点均需换成自己的IP。

启动3个Kafka节点之后，查看是否启动成功：  
 ![](./images/f22b49f6a06d4c2f.png)  
 这样Kafka集群就算搭建完毕。

##### 3、在Broker 0节点上创建一个用于测试的topic：

在Broker 0上创建一个副本为3、分区为5的topic用于测试。

（Kafka的topic所有分区会分散在不同Broker上，所以该topic的5个分区会被分散到3个Broker上，其中有两个Broker得到两个分区，另一个Broker只有1个分区。该结论在下面将会得到验证。）

```
cd /opt/kafka_2.12-2.4.0/bin


kafka-topics.sh --create --zookeeper 192.168.0.104:2181 --replication-factor 3 --partitions 5 --topic TestTopic
```

![](./images/e68fef8b59f62ae7.png)  
 查看新创建的topic信息：

```
kafka-topics.sh --describe --zookeeper 192.168.0.104:2181 --topic TestTopic
```

![](./images/37f4f82d164fed03.png)  
 上面的topic信息是什么意思呢？  
 上面提到过，“**该topic的5个分区会被分散到3个Broker上，其中有两个Broker得到两个分区，另一个Broker只有1个分区**”。看了这句话应该就能理解上图中的topic信息的含义。  
 首先，`Topic: TestTopic PartitionCount: 5 ReplicationFactor: 3`代表TestTopic有5个分区，3个副本节点；  
 `Topic: TestTopic Partition: 0 Leader: 2 Replicas: 2,0,1 Isr: 2,0,1`  
 `Leader:2`代表TestTopic下的分区0的Leader Replica在Broker.id = 2节点上，  
 `Replicas`代表他的副本节点有Broker.id = 2、0、1（包括Leader Replica和Follower Replica，且不管是否存活），  
 `Isr`表示存活并且同步Leader节点的副本有Broker.id = 2、0、1  
 关于副本机制，并不是本节的重点，因此不在本文详述，不了解的同学可以再另外去学习一下。

##### 4、Kafka集群验证

上一步在Broker0上创建了一个topic：TestTopic，接着另开两个窗口，分别进入Kafka1和Kafka2容器内，查看在该两容器内是否已同步两topic：  
 ![](./images/3ff1bb1fed59925c.png)  
 可以看到，Kafka1和Kafka2上已同步新创建的topic.

接下来，分别在Broker0上运行一个生产者，Broker1、2上分别运行一个消费者：

```
kafka-console-producer.sh --broker-list 192.168.0.104:9092 --topic TestTopic

kafka-console-consumer.sh --bootstrap-server 192.168.0.104:9093 --topic TestTopic --from-beginning

kafka-console-consumer.sh --bootstrap-server 192.168.0.104:9094 --topic TestTopic --from-beginning
```

如下图所示：  
 ![](./images/e2750e223c854331.png)  
 在Broker 0 上发送消息，看Broker 1和2上是否能够正常接收消息：![](./images/9284c8c3a0b571bb.png)

#### 二、使用Docker-Compose 搭建Kafka集群

##### 1、什么是Docker-Compose?

> Docker-Compose是Docker提供的工具，用于同时管理同一个应用程序下多个容器。

举个例子，上面在Docker中搭建Kafka集群的步骤很繁杂，比如首先建一个ZK容器，然后再分别通过命令创建多个Kafka容器，并分别启动。而通过Docker-Compose可以使用单条命令就可以启动所有服务。

Docker和Docker-Compose之间的区别如下：  
 ![](./images/68a36d78aff0579e.png)

##### 2、如何使用Docker-Compose

如何使用Docker-compose创建Kafka相关可以见link：https://github.com/wurstmeister/kafka-docker .  
 **（1）创建目录**

首先，在本地路径下创建一个用于存放docker-compose.yml文件的目录，并新建一个文件：docker-compose.yml （我创建的是docker-compose-kafka-single-broker.yml）

注意：遇到权限问题自行解决  
 ![](./images/8b7c3c25868ce854.png)

**（2）单个Broker节点**  
 下面看如何创建单Broker节点，在docker-compose-kafka-single-broker.yml文件中进行如下配置：

```
version: '3'
services:
  zookeeper:
    image: wurstmeister/zookeeper
    container_name: zookeeper
    ports:
      - "2181:2181"
  kafka:
    image: wurstmeister/kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_ADVERTISED_HOST_NAME: 192.168.1.202
      KAFKA_CREATE_TOPICS: TestComposeTopic:2:1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_BROKER_ID: 1
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://192.168.1.202:9092
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
    container_name: kafka01
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

文件中的参数含义：

- version: "3"表示第3代compose语法；
- services：表示要启用的实例服务；
- zookeeper、kafka：启动的服务名称；
- image：docker使用的镜像；
- container\_name：启动后容器名称;
- ports：导出的端口号；

关于Kafka的参数信息单独讲下：

- KAFKA\_ADVERTISED\_HOST\_NAME：Docker宿主机IP，可以设置多个；
- KAFKA\_CREATE\_TOPICS：启动时默认创建的topic；`TestComposeTopic:2:1`表示创建topic为TestComposeTopic、2个分区、1个副本；
- KAFKA\_ZOOKEEPER\_CONNECT：连接ZK；
- KAFKA\_BROKER\_ID：Broker ID；
- KAFKA\_ADVERTISED\_LISTENERS 和 KAFKA\_LISTENERS必须要有，否则可能无法正常使用。

配置好后，使用命令 `docker-compose -f docker-compose-kafka-single-broker.yml up` 启动单节点Kafka。

查看启动的单Broker信息和topic信息：  
 ![](./images/381582cb92faf029.png)  
 ![](./images/9ed63d9c5b78cb17.png)

消息发送和接收验证：  
 ![](./images/f55b54f871b534a3.png)

**（3）Broker集群**

上面使用了docker-compose成功地搭建了kafka单节点Broker，现在看如何构建Kafka集群：

首先在目录下创建一个新文件:docker-compose-kafka-single-broker.yml，配置内容如下：

```
version: '3'
services:
  zookeeper:
    image: wurstmeister/zookeeper
    container_name: zookeeper
    ports:
      - "2181:2181"

  kafka1:
    image: wurstmeister/kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_ADVERTISED_HOST_NAME: 192.168.1.202
      KAFKA_CREATE_TOPICS: TestComposeTopic:4:3
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_BROKER_ID: 1
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://192.168.1.202:9092
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
    container_name: kafka01
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  kafka2:
    image: wurstmeister/kafka
    ports:
      - "9093:9093"
    environment:
      KAFKA_ADVERTISED_HOST_NAME: 192.168.1.202
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_BROKER_ID: 2
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://192.168.1.202:9093
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9093
    container_name: kafka02
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  kafka3:
    image: wurstmeister/kafka
    ports:
      - "9094:9094"
    environment:
      KAFKA_ADVERTISED_HOST_NAME: 192.168.1.202
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_BROKER_ID: 3
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://192.168.1.202:9094
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9094
    container_name: kafka03
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

执行脚本：`docker-compose -f docker-compose-kafka-cluster.yml up` ，

可以看到启动成功：  
 ![](./images/c01fcb31e637225c.png)

分别进入3个容器中查看topic信息

![](./images/b02f7590883909b3.png)

消息发送验证：

Broker 0上启动一个生产者，Broker 1、2上分别启动一个消费者，进行消息发送和接收验证：  
 ![](./images/e5004bcf11d4be57.png)

##### 3 、疑难杂症问题记录

**1、使用KAFKA\_CREATE\_TOPICS参数不能创建topic多个分区**

配置文件中参数`KAFKA_CREATE_TOPICS: TestComposeTopic:2:1`本意为创建topic：TestComposeTopic，2个分区、1个副本，但是实际执行后，topic能成功执行，但是分区仍然为1：  
 ![](./images/fd6acdc208327390.png)

百度上翻了几页类似问题，都没有找到解决办法（这里吐槽下百度在实际解决问题的时候真的是太烂了），之后用谷歌搜索在第一页就找了解决问题的办法：[Can’t create a topic with multiple partitions using KAFKA\_CREATE\_TOPICS #490](https://github.com/wurstmeister/kafka-docker/issues/490)，貌似还真有人遇到过，下面有人贴了解决办法，使用`docker-compose down -v`即可解决。

于是，赶紧试了下：

进入docker-compose.yml所在的目录，由于我不是使用默认的docker-compose.yml文件，所以需要加上参数-f指定自己写的文件：

```
cd  /docker/config/kafka

### 执行该命令， 解决只能创建一个分区的问题
docker-compose -f docker-compose-kafka-single-broker.yml down -v

### 重新启动
docker-compose -f docker-compose-kafka-single-broker.yml up
```

在重新执行docker-compose.yml后再次查看该topic信息，发现2个分区已经成功创建：

![](./images/07bada072327c94d.png)

关于 `docker-compose down -v`命令的含义是：

> Stops containers and removes containers, networks, volumes, and images  
>  created by `up`.
>
> By default, the only things removed are:
>
> - Containers for services defined in the Compose file
> - Networks defined in the `networks` section of the Compose file
> - The default network, if one is used
>
> Networks and volumes defined as `external` are never removed.

为什么使用该命令？可能是因为使用`docker-compose`在创建分区之前会默认创建1个分区1个副本的topic。我也在该issue下进行了提问，希望能够得到回答。如果有懂的同学也可以在文章下面评论告诉我，感激不尽。  
 ![](./images/78ebc83c62b633c0.png)

(Link: https://github.com/wurstmeister/kafka-docker/issues/490)