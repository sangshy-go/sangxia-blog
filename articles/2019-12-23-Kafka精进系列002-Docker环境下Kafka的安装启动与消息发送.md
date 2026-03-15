---
title: "【Kafka精进系列002】Docker环境下Kafka的安装启动与消息发送"
date: 2019-12-23
category: 后端开发
tags: [Kafka, docker]
---

#### 前言

上一节[【Kafka精进系列001】Kafka单机安装与启动（Mac）](https://blog.csdn.net/noaman_wgs/article/details/103658814)中，我们演示了如何在本地安装、启动Kafka以及Kafka消息的生产和发送过程，本节将演示如何在Docker中安装启动Kafka容器、以及如何在Kafka容器中进行消息的生产和发送测试。

注：Docker 是一个开源的应用容器引擎，可以让开发者打包他们的应用以及依赖包到一个轻量级、可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化。官网见：https://www.docker.com/

学习Docker容器技术可以方便灵活地安装应用、搭建环境、部署应用，如果有能力的同学建议早点上手Docker，当然暂时觉得有难度的同学也可以忽略本节的学习，不影响Kafka的后续学习。

#### 一、安装Docker、ZK、Kafka

##### 1、Docker安装

首先确认本地安装Docker以及Docker客户端，此步骤本文不再详述。

Docker客户端可以通过阿里镜像提供的下载地址进行下载（Mac）：http://mirrors.aliyun.com/docker-toolbox/mac/docker-for-mac/stable/

其余操作系统对应的下载地址见阿里云中提供的：https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors

Mac中可以使用`brew cask install docker`一键安装。

##### 2、ZK、Kafka安装

在Docker可以使用命令来搜索ZK、Kafka的镜像：

`docker search kafka`和`docker search zookeeper`

![](./images/f61f63ffffbcae81.png)

我们选择下载排名靠前的镜像"wurstmeister/zookeeper "，命令如下：

```
docker pull wurstmeister/zookeeper  

docker pull wurstmeister/kafka
```

下载完成后使用`docker images`来验证ZK和Kafka镜像是否下载成功：  
 ![](./images/1871ebae10e4df34.png)

#### 二、使用Docker启动Kafka

##### 1、启动ZK

`docker run -d --name zookeeper -p 2181:2181 -t wurstmeister/zookeeper`

##### 2、启动Kafka

```
docker run -d --name kafka -p 9092:9092 -e KAFKA_BROKER_ID=0 -e KAFKA_ZOOKEEPER_CONNECT=192.168.0.100:2181 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.0.100:9092 -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092 -t wurstmeister/kafka
```

注意：其中参数`KAFKA_ZOOKEEPER_CONNECT`和`KAFKA_ADVERTISED_LISTENERS`后的IP地址需要更换成宿主机的IP地址，否则就会监听不到。宿主机的IP地址可通过`ifconfig en0`来查看（en0代表无线网局域网IP）：  
 ![](./images/ba26b9cd6976b934.png)

##### 3、验证ZK和Kafka是否启动成功

通过命令`docker ps -a`查看ZK和Kafka是否启动成功，主要查看STATUS这一列。  
 ![](./images/7f548c51c5a7de54.png)  
 'UP 40 minutes’表示已启动了40分钟，如果是’EXITED(1)'就表示异常退出，未启动成功，可以通过命令`docker logs [CONTAINED ID]`查看报错原因。

CONTAINER ID表示启动的容器ID，后续会用到，如本次启动的Kafka容器ID为：629c0f149e27。

#### 三、Docker中Kafka消息生产和发送

**1、进入Kafka容器（629c0f149e27是Kafka容器 ID，每次不一样）：**

`docker exec -it 629c0f149e27 /bin/bash`

**2、进入Kafka bin目录：**

`cd /opt/kafka_2.12-2.4.0/bin`

**3、创建生产者，副本为1，分区为1，topic为TestTopicForDocker ：**

```
kafka-topics.sh --create --zookeeper 192.168.0.100:2181 --replication-factor 1 --partitions 1 --topic TestTopicForDocker
```

注：`192.168.0.100`IP需要换成对应主机IP，下面同。

**4、查看新生成的topic：**

`kafka-topics.sh --zookeeper 192.168.0.100:2181 --list`；  
 ![](./images/58f492f973e0c62f.png)

**5、bin目录下，运行一个生产者**

```
kafka-console-producer.sh --broker-list 192.168.0.100:9092 --topic TestTopicForDocker
```

**6、bin目录下，运行一个消费者：**

新开一个窗口，重新进入Kafka容器bin目录下：

```
docker exec -it 629c0f149e27 /bin/bash

cd /opt/kafka_2.12-2.4.0/bin
```

创建消费者：

```
kafka-console-consumer.sh --bootstrap-server 192.168.0.100:9092 --topic TestTopicForDocker --from-beginning
```

如果没有报错，就代表基本上没有问题，就可以测试了。

**7、测试**

（1）开启单个生产者和单个消费者

生产者窗口内发送任意内容，消费者窗口可以接收到消息，表示Kafka接收成功。  
 ![](./images/2f01b21d37935fcb.png)

（2）开启单个生产者 + 多个消费者

重新开启一个命令行窗口，运行消费者2。生产者发送消息后，消费者1，2都可以接收到  
 ![](./images/2bf2c3667a738b3e.png)  
 （3）创建topic 02，分别再运行一个生产者和消费者进行测试：  
 ![](./images/0907914d8b41f6fa.png)

注：

（1）测试过程中，出现过多次当通过docker命令kafka容器之后，对应STATUS立马进入`Exited(1)`状态。上面提到过该状态是由于容器启动遇到异常而非正常退出，经排查是由于在启动Kafka的时候宿主IP地址未即使修改导致连接不上ZK，一定要通过`ifconfig en0`来确认；  
 ![](./images/6c44644dff3f4e90.png)

大部分问题都是由于在启动Kafka的时候IP地址参数导致的：

```
docker run -d --name kafka -p 9092:9092 -e KAFKA_BROKER_ID=0 -e KAFKA_ZOOKEEPER_CONNECT=192.168.1.199:2181 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.1.199:9092 -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092 -t wurstmeister/kafka
```

`KAFKA_ZOOKEEPER_CONNECT=192.168.1.199:2181`和`KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.1.199:9092`这两个参数一定需要将IP换成自己的局域网IP。

（2）测试过程中出现`Error while fetching metadata with correlation id 2 : {MyTestTopicForDocker=LEADER_NOT_AVAILABLE} (org.apache.kafka.clients.NetworkClient)`异常，经检查是由于Kafka配置参数不对导致，需要确认Kafka的server.properties文件缺少两个参数`listeners=xx`和`advertised.listeners=`导致，需要确认该参数正常配置。

server.properties文件所在位置：`/opt/kafka_2.12-2.4.0/config/`  
 ![](./images/a9c46780f7258641.png)  
 ![](./images/2fd8e5b8968f6e85.png)