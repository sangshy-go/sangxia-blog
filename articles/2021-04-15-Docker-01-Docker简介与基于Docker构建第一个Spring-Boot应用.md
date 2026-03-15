---
title: "【Docker 01】Docker简介与基于Docker构建第一个Spring Boot应用"
date: 2021-04-15
category: 后端开发
tags: [Docker]
---

本文内容首先简单介绍Docker是什么、能够做什么、架构是什么样的；  
 然后体验了下如何拉取和运行第一个Docker镜像；  
 最后应用到实战，基于Docker构建第一个Spring Boot应用，并制作属于自己的镜像推送至远程Docker Hub上。

#### 一、Docker简介

##### 1、Docker是什么，为什么使用Docker

Docker是轻量级的容器方案，用于开发、交付、运行应用程序的开放平台，缩短代码从开发、测试到部署、上线运行的周期，让应用程序具备可移植性。

Docker提供了具备隔离的环境(容器)来打包和运行应用程序，隔离性可以使用户在给定主机上运行多个容器。

应用Docker，我们可以做什么：

（1）快速高效地交付应用：Docker容器非常适合进行持续集成和持续交付(CI/CD)工作流，简化开发周期；

（2）Docker基于容器的平台具备高度可移植的工作负载，可根据业务需要进行实时扩容应用程序和服务；

（3）Docker适合高密度环境和中小型部署，用更少的资源做更多的事情。

Docker借鉴了集装箱的概念：集装箱运输货物，Docker运输软件，比如Web服务器、数据库、应用程序等。Docker中每个容器都包含一个软件的镜像，镜像可以被创建、启动、关闭、重启和销毁。使用Docker，用户可以很方便地构建容器、快速构建应用、构建持续集成的完整的开发测试环境

Docker的目标：“Build,Ship and Run any App,Angwhere” ：

- **构建：** 构建一个 docker 镜像
- **运输：** docker pull 拉取镜像
- **运行：** 启动一个容器

##### 2、Docker架构和组件

Docker使用客户端-服务器架构，客户端与Docker守护进程Docker daemon进行交互，Docker daemon完成构建、运行、分发Docker容器的工作。

Docker客户端和Docker daemon可以在同一系统上运行，也可以通过网络连接到远程Docker守护程序。  
 ![](./images/44afd5feff3b5ab9.png)

Docker组件：

- Docker client客户端：提供用户与Docker执行命令与Docker守护程序进行通信
- Docker daemon守护程序：负责监听Docker API请求，并管理Docker对象，如：images, containers, networks, and volumes。Docker dameon可以与其他守护线程通信用于管理Docker服务
- Docker registries注册表：用于存储Docker镜像，Docker Hub是公共注册表，我们所需要的镜像默认在Docker Hub上查找。一般使用`docker pull`或`docker run`从远程或本地的注册表中获取所需镜像；`docker push`命令可以将镜像推送到已配置的注册表。
- Docker objects对象：包含镜像、容器、网络、卷、插件以及其他对象。

  - 镜像：镜像是创建容器的只读模板，定义了容器所需要的文件系统定义、配置、脚本、二进制文件、环境变量和其他元数据。
  - 容器：容器是镜像的运行实例，是计算机上的另一个进程，通过Linux的`namespace`和`cgroups`技术实现与主机上的所有其他进程隔离。默认情况下，容器与其他容器和主机之间隔离，容器享有独自的网络、存储或其他子系统；

    比如运行一个ubuntu容器时，执行命令：`$ docker run -i -t ubuntu /bin/bash`的过程如下：

    - 查看本地有没有ubuntu镜像，没有则会注册表中拉取 == `docker pull ubuntu`
    - Docker创建一个新容器 === `docker container create`
    - Docker分配一个读写文件系统分配给ubuntu容器，允许容器在本地文件系统中创建或修改文件和目录
    - Docker创建一个网络端口，为容器分配IP地址，这样容器可以使用主机网络连接外部网络；
    - Docker启动容器并执行`/bin/bash`

镜像和容器的区别：

- 容器是基于镜像启动的，容器可以运行一个或多个进程

#### 二、运行第一个容器

比如我们想要运行getting-started镜像(getting-started保存在Docker Hub仓库上，由Docker上传用于测试的示例镜像)，可以先查看下该镜像是否存在，执行命令：`docker search getting-started`  
 ![](./images/4595a5c17db1c48f.png)

执行命令`docker run -d -p 80:80 docker/getting-started`运行该容器

- `-d` -以分离模式运行容器（在后台）
- `-p 80:80` -将主机的端口80映射到容器中的端口80
- `docker/getting-started` -要使用的图像

如果本地没有getting-started，会尝试从注册表中拉取保存到本地机器。然后利用该镜像创建一个容器并启动;  
 ![](./images/0292140b180935f4.png)

#### 三、Docker + SpringBoot 制作自己的镜像

本节演示如何制作一个基于Spring Boot应用程序的镜像，并在Docker中运行该容器。

本节代码地址：https://github.com/GenshenWang/docker-starlite/tree/master/docker-springboot-demo

1、新建Spring Boot演示程序，代码见[链接](https://github.com/GenshenWang/docker-starlite/tree/master/docker-springboot-demo)。

主要内容在：HelloController.class、pom.xml。

在项目目录下执行`maven package`进行打包：  
 ![](./images/ea30274d71dbb045.png)

2、Docker配置

Dockfile文件是一个用于创建镜像的组合命令，Docker通过读取Dockfile文件中的命令自动生成镜像。

```
# 依赖的基础镜像jdk8
FROM java:8

# 需要暴露出去项目的端口
EXPOSE 8888

# 维护者信息
MAINTAINER wgs

#将主机环境的jar包，以文件名demo.jar添加到docker镜像中。就是因为这条命令，mavnen运行报错
ADD /target/docker-springboot-demo-0.0.1-SNAPSHOT.jar docker-springboot-demo.jar

#启动容器之后，默认的运行命令
ENTRYPOINT ["java","-jar","docker-springboot-demo.jar"]
```

> Dockfile语法：
>
> Dockerfile 一般分为四部分：基础镜像信息、维护者信息、镜像操作指令和容器启动时执行指令，’#’ 为 Dockerfile 中的注释。
>
> - FROM：指定基础镜像，注意，必须为第一个命令
> - MAINTAINER：维护者信息
> - RUN：在镜像容器中执行命令
> - EXPOSE：指定于外界交互的端口，
> - VOLUME：用于指定持久化目录
> - ADD：将本地文件添加到容器中，格式：`ADD <src>... <dest>`
> - CMD：容器启动后执行的命令

![](./images/2ee923b7cbdfae4b.png)

《图片来源：https://www.cnblogs.com/panwenbin-logs/p/8007348.html》

3、制作docker镜像

执行命令：`docker build -t docker-springboot-demo .`

![](./images/0b7a31b8fc2585a0.png)

4、查看镜像

![](./images/a394aa49d9f428ca.png)

5、运行镜像实例

执行命令`docker run -p 8080:8080 -t docker-springboot-demo`，运行程序之后，访问链接`http://localhost:8080/docker/hello`验证输出结果。

#### 四、SpringBoot 应用程序更新

如果SpringBoot 应用需要更新代码，那么应用代码更新之后，如何发布并且更新Docker 镜像呢呢？

1、更新Spring Boot源程序代码、打包，并重新构建镜像，分别执行以下命令：

```
# 打包
maven package

# 重新构建镜像
docker build -t docker-springboot-demo .
```

2、Docker删除原来的镜像（不删除无法启动新的容器）

```
### 1. 获取老的容器id ： <the-container-id>
docker ps

### 2. 停止老的容器
docker stop <the-container-id>

### 3. 强制删除容器
docker rm -f <the-container-id>
```

执行结果如下：

![](./images/7c6cc02da308fe56.png)

3、启动新的容器

`docker run -dp 8080:8080 docker-springboot-demo`，验证运行的程序是否为更新代码之后的源程序。

#### 五、推送镜像到Docker Hub

上述步骤制作的镜像只能在本地使用，如何共享这个镜像呢？可以通过Docker注册表（默认是Docker Hub）来创建。  
 (镜像是从仓库下载下来的，镜像保存在仓库中，仓库保存在注册表Registry中，默认的Registry是由Docker公司运营的公共Registry服务，即Docker Hub)

1、首先在Docker Hub注册ID，链接：https://hub.docker.com/signup

2、创建镜像仓库

![](./images/5d558ac741c9b4b0.png)

3、设置镜像名称和可见性，点击创建

![](./images/4bbef6fa4ea62ec8.png)

4、本地镜像推送至远程服务器

```
# 1. 登录Docker  Hub
docker login -u YOUR-USER-NAME

# 2. 为镜像重新命名
docker tag docker-springboot-demo wanggenshen/docker-springboot-demo:0.1.0

# 3. 推送至远程
docker push wanggenshen/docker-springboot-demo:0.1.0
```

执行结果如下：

![](./images/fce708b34ee2d13f.png)

5、Docker Hub查看推送的镜像：  
 ![](./images/a6c4a20460e901dc.png)

PS：制作了镜像并且上次到Docker Hub之后，在Docker Hub上可以搜寻到，但是在本地命令行中却搜寻不到，查找结果未果。后来发现过了一天之后就能搜到了，推测Docker命令的搜寻结果与Docker Hub中的数据集不一致导致，可能存在延时，正常一天之后docker search就能搜寻到。  
 ![](./images/1a97013b5d9b1d3c.png)