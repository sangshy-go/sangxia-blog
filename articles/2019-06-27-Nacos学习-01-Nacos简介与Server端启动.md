---
title: "【Nacos学习】01-Nacos简介与Server端启动"
date: 2019-06-27
category: 后端开发
tags: [Nacos]
---

#### 前言

Nacos可以用于服务发现、配置中心、DNS服务等功能，使用 Nacos 简化服务发现、配置管理、服务治理及管理的解决方案，让微服务的发现、管理、共享、组合更加容易。

详细文档见官方文档：  
 [https://nacos.io/zh-cn/docs/what-is-nacos.html，本系列文章只做一些Nacos特性的学习与应用。](https://nacos.io/zh-cn/docs/what-is-nacos.html%EF%BC%8C%E6%9C%AC%E7%B3%BB%E5%88%97%E6%96%87%E7%AB%A0%E5%8F%AA%E5%81%9A%E4%B8%80%E4%BA%9BNacos%E7%89%B9%E6%80%A7%E7%9A%84%E5%AD%A6%E4%B9%A0%E4%B8%8E%E5%BA%94%E7%94%A8%E3%80%82)

##### 一、Nacos介绍

什么是Nacos？  
 引用官方文档的话，Nacos可用于：

> - **服务发现和服务健康监测:** Nacos 支持基于 DNS 和基于 RPC 的服务发现。服务提供者使用 原生SDK、OpenAPI、或一个独立的Agent TODO注册 Service 后，服务消费者可以使用DNS TODO 或HTTP&API查找和发现服务。
> - **动态配置服务：** 动态配置服务可以让您以中心化、外部化和动态化的方式管理所有环境的应用配置和服务配置。同时提供简介易用的控制台进行操作，可以使用此特性搭建配置中心。
> - **动态 DNS 服务 ：** 动态 DNS 服务支持权重路由，让您更容易地实现中间层负载均衡、更灵活的路由策略、流量控制以及数据中心内网的简单DNS解析服务。

##### 二、Nacos快速开始

操作步骤见：<https://nacos.io/zh-cn/docs/quick-start.html>  
 1、 下载源码或者安装包

```
git clone https://github.com/alibaba/nacos.git
cd nacos/
mvn -Prelease-nacos clean install -U  
ls -al distribution/target/


// 进入nacos对应bin目录下
cd 前面你自己的路径/distribution/target/nacos-server-$version/nacos/bin
```

2、启动服务器

```
// mac
sh startup.sh -m standalone
// windows下
cmd startup.cmd
```

3、进入服务配置页面(默认端口 8848)  
 <http://localhost:8848/nacos/index.html#/login>  
 输入用户名和密码(nacos/nacos)  
 ![](./images/a352806264831e16.png)

即可进入到Nacos控制台，左边栏是Nacos提供的配置与服务管理的一些功能。  
 注：下面的配置项是我之前配置的内容，首次进入页面内容应该为空。

下面简单示范下Nacos配置中心的使用：  
 （1）首先点击添加，添加配置项：  
 ![](./images/8210afd0a4b63e32.png)

(2)配置内容，点击发布：  
 ![](./images/83c7f6d4bcaab0b4.png)  
 (也可以通过命令进行发布，格式如：`curl -X POST "http://127.0.0.1:8848/nacos/v1/cs/configs?dataId=nacos.cfg.dataId&group=test&content=HelloWorld"`)

终端输入查看配置项命令：  
 `curl -X GET "http://127.0.0.1:8848/nacos/v1/cs/configs?dataId=test_nacos&group=DEFAULT_GROUP"`  
 ![](./images/de03fb4b22b45cf4.png)

测试过程中出现了`config data not exist`的问题，解决办法：重启Nacos。  
 ![](./images/cf19356e7a2037d9.png)

4、关闭

```
// Linux/Unix/Mac
sh shutdown.sh

// Windows
cmd shutdown.cmd
```