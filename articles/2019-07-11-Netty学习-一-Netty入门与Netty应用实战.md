---
title: "Netty学习（一）- Netty入门与Netty应用实战"
date: 2019-07-11
category: 后端开发
tags: [Netty, Netty入门, Netty实战]
---

#### 一、什么是Netty

Netty官网上是这样定义Netty的：

> Netty is an asynchronous event-driven network application framework  
>  for rapid development of maintainable high performance protocol servers & clients.

用人话（Google翻译）的话来说就是：

> Netty是一个异步事件驱动的网络应用程序框架，用于快速开发可维护的高性能协议服务端和客户端。

简单来说，Netty有以下特点：

- 设计：适用于不同的协议（阻塞和非阻塞）；可定制的线程模型；
- 性能：更好的吞吐量、低延迟；省资源；减少不必要的内存拷贝；提供的Reactor线程模型能够做到高效的并发处理；
- 安全：完整的SSL/TLS和STARTTLS支持；
- 易用：封装了JDK的NIO，大大简化NIO编程；并且自带粘包拆包。异常检测等机制；
- 应用：在消息中间件、分布式通信框架中有很好的应用和验证（Dubbo默认使用Netty作为基础通信框架）；

#### 二、Netty入门demo

本节将通过搭建一个语音机器人的demo来了解Netty的用法，实现的主要功能为：客户端发送查询指令，服务端根据通过Netty框架接收到指令后做出响应，并在客户端显示。

首先导入Netty需要的依赖，本次使用的是4.x版本：

```
<dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-all</artifactId>
      <version>4.1.6.Final</version>
 </dependency>
```

**服务端**  
 首先是服务端的搭建。服务端的作用是接收客户端命令并处理命令，做出响应。整个流程如下：

- 创建两个NioEventLoopGroup实例，一个用来接受客户端的连接；另一个用来进行SocketChannel读写；
- 创建ServerBootstrap，用于启动NIO服务端的辅助启动类；
- 调用创建ServerBootstrap的group方法，将两个NioEventLoopGrou作为参数传入；
- 创建NioServerSocketChannel，并设置TCP参数，将backlog设置为1024（服务端在接收客户端的TCP连接的时候，同一时间只能处理一个，多了会将请求放在队列里，backlog指定了队列大小）；
- 绑定ChildChanelHandler，创建pipeline， 处理网络I/O事件、消息编解码等；
- 线程组阻塞、关闭；

```
/**
 * Created by wanggenshen
 * Date: on 2019/5/16 00:49.
 * Description: 机器人服务端, 用于接收指令, 并对指令作出新响应
 */
public class RobotServer {

    public static void bind(int port) throws InterruptedException {
        // 用于服务端接受客户端连接
        EventLoopGroup parentGroup = new NioEventLoopGroup();
        // 用于进行SocketChannel的网络读写
        EventLoopGroup workGroup = new NioEventLoopGroup();
        try {
            // 启动NIO服务端辅助启动类
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(parentGroup, workGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 1024)
                    // 用于处理网络I/O事件,如记录日志、对消息进行编解码等
                    .childHandler(new ChildChanelHandler());

            // 绑定端口, 同步等待成功
            ChannelFuture future = bootstrap.bind(port).sync();
            // 等待服务端端口关闭
            future.channel().closeFuture().sync();
        } finally {
            // 优雅关闭线程池资源
            parentGroup.shutdownGracefully();
            workGroup.shutdownGracefully();
        }


    }

/**
 * ChildChanelHandler可完成消息编解码、心跳、流量控制等功能
 */
    private static class ChildChanelHandler extends ChannelInitializer<SocketChannel> {

        @Override
        protected void initChannel(SocketChannel channel) throws Exception {
            channel.pipeline().addLast(new SimpleChannelInboundHandler() {
                @Override
                protected void channelRead0(ChannelHandlerContext channelHandlerContext, Object command) throws Exception {
                    // 读取指令
                    ByteBuf byteBuf = (ByteBuf) command;
                    byte[] req = new byte[byteBuf.readableBytes()];
                    byteBuf.readBytes(req);
                    // 打印读取的内容
                    System.out.println("Robot Server receive a command: " + new String(req, "UTF-8"));

                    // 处理指令
                    String result = "hello,你好!我叫Robot。";
                    if ("hello".equals(command)) {
                        result = new Date(result).toString();
                    }
                    // 将消息先放到缓冲数组中, 再全部发送到SocketChannel中
                    ByteBuf resp = Unpooled.copiedBuffer(result.getBytes());
                    channelHandlerContext.writeAndFlush(resp);
                }
            });
        }
    }

    public static void main(String[] args) throws InterruptedException {
        RobotServer.bind(8080);
    }
}
```

**客户端**  
 客户端的作用是发送指令给服务端，并将服务端发送的处理结果打印在console上，整个流程如下：

- 创建客户端处理I/O读写的EventLoopGroup；
- 创建客户端启动辅助类Bootstrap，并将NioEventLoopGroup参数绑定；
- 设置channel，与服务端不同的是，客户端的channel是NioSocketChannel；
- 设置TCP参数ChannelOption.TCP\_NODELAY；
- 添加handler类，监听channel，处理事件；
- 调用connect发起异步连接，等待连接成功；
- 连接关闭后，客户端主函数退出，释放线程组。

```
/**
 * Created by wanggenshen
 * Date: on 2019/5/16 01:10.
 * Description: 机器人客户端, 发送指令, 并接收指令响应
 */
public class RobotClient {

    public void connect(int port, String host) throws InterruptedException {
        // 配置客户端NIO线程组, 用于客户端I/O读写
        EventLoopGroup group = new NioEventLoopGroup();

        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(group).channel(NioSocketChannel.class)
                    .option(ChannelOption.TCP_NODELAY, true)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            socketChannel.pipeline()
                                    .addLast(new SimpleChannelInboundHandler() {

                                        @Override
                                        protected void channelRead0(ChannelHandlerContext channelHandlerContext, Object msg) throws Exception {
                                            ByteBuf byteBuf = (ByteBuf) msg;
                                            byte[] response = new byte[byteBuf.readableBytes()];
                                            byteBuf.readBytes(response);

                                            System.out.println("Client: " + new String(response, "UTF-8"));
                                        }

                                        @Override
                                        public void channelActive(ChannelHandlerContext ctx) throws Exception {
                                            final ByteBuf firstMsg;
                                            byte[] req = "hello".getBytes();
                                            firstMsg = Unpooled.buffer(req.length);
                                            firstMsg.writeBytes(req);
                                            ctx.channel().writeAndFlush(firstMsg);
                                            super.channelActive(ctx);
                                        }

                                    });
                        }
                    });

            // 发起异步连接
            ChannelFuture future = bootstrap.connect(host, port);
            // 等待客户端关闭
            future.channel().closeFuture().sync();
        } finally {
            group.shutdownGracefully();
        }

    }

    public static void main(String[] args) throws InterruptedException {
        new RobotClient().connect(8080, "127.0.0.1");
    }
}
```

**运行与测试**  
 先运行服务端，再运行客户端；  
 运行服务端后，服务端接收到一条 `hello`的命令：  
 ![](./images/7690679a2eaae78a.png)

接着服务端对此命令做出响应，回应内容为`hello,你好！我叫Robot.`，并将回应内容发送至buffer。

客户端收到服务端发送的内容，并显示在console中：  
 ![](./images/a889e47e07772808.png)  
 这样就基于Netty实现了一个简单的服务端 - 客户端 通信的小程序。

**服务端、客户端运行时序图**  
 服务端运行时序图：  
 ![](./images/deb038afc33cf9a6.png)

客户端运行时序图：  
 ![](./images/0e472d77c94e0f54.png)

---

参考:  
 《Netty权威指南》  
 Netty官网：<https://netty.io/>