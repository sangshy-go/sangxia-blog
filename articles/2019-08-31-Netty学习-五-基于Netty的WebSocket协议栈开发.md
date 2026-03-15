---
title: "Netty学习（五）- 基于Netty的WebSocket协议栈开发"
date: 2019-08-31
category: 前端开发
tags: [Netty, Netty Websocket]
---

#### 0、前言

HTTP协议作为客户端-服务端之间的通信方式，得到了很多的应用。但是HTTP协议有很多的弊端：

- 半双工：HTTP协议为半双工协议，这意味着客户端、服务端之间同一时刻只能有一端发送数据；
- 消息结构复杂：HTTP协议包含消息头、消息体等内容，消息结构比较复杂和繁琐；
- 长连接机制耗费服务器资源：为了实现实时通信，很多网站都采用长连接的方式，由客户端每隔固定时间（如1s）发送HTTP请求到服务端看服务端是否有响应。而服务端有时候可能没有响应，发送的HTTP请求就显得鸡肋，且会占用很多带宽或服务器资源。

为了解决HTTP协议效率低下的问题，HTML5定义了WebSocket协议来节省服务器资源和实时通信。

#### 一、WebSocket协议简介

##### 1、WebSocket协议简介

WebSocket协议是基于TCP的双向全双工网络通信技术,是一种较新的技术，伴随HTML5规范而生，大多浏览器都支持。  
WebSocket协议和HTTP协议一样，都是OSI模型中应用层协议。  
![](./images/a3984ba6b49c2a74.png)  
（注：图片来源：imooc.com/article/290121）

WebSocket首先借助HTTP协议进行握手，握手成功后就变成全双工的TCP通道进行通信。浏览器和服务器建立TCP连接后，就建立一条快速通道，可以通过快速通道互相传送数据。  
![](./images/1bfd33a7bf06b30e.png)  
（注：图片来源：imooc.com/article/290121）

WebSocket协议的特点：

- 基于TCP连接，采用全双工模式通信；
- 通过"ping/pong"帧保持链路激活；
- 服务器可以主动传递消息给客户端，不需要客户端轮询；
- 无头部信息、Cookie和身份验证；
- 对代理、防火墙和路由器透明；
- 无安全开销；

##### 2、WebSocket连接过程

为了建立WebSocket连接，首先由客户端发送一个带有附加头信息："Upgrade:WebSocket"的HTTP请求，表明不是普通的HTTP请求，是申请协议升级的HTTP请求；  
![](./images/5a492512fa0a9243.png)

服务端接收到请求进行解析生成应答信息返回给客户端，这样就建立了WebSocket连接。双方就可以通过这个连接自由传递消息，直到某一方主动关闭连接。  
![](./images/c49556cb54790105.png)  
WebSocket的关闭需要通过一个安全的方法关闭底层的TCP连接。正常情况下应答由服务器主动去关闭；异常情况下客户端也可以主动发起关闭。

#### 二、Netty WebSocket协议实战

下面基于Netty实现一个Websocket协议的简易聊天室。

##### 1、服务端

（1）首先创建Netty Server。Netty Server添加了消息编解码、Http消息整合、WebSocket处理等Handler.  
代码如下：

```
package com.wgs.netty.demo5_netty4websocket;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.stream.ChunkedWriteHandler;

/**
 * Created by wanggenshen
 * Date: on 2019/8/15 00:15.
 * Description: 基于Netty的WebSocket协议服务端
 */
public class NettyWebSocketServer {

    public static void connect(int port) throws InterruptedException {
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 1024)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ch.pipeline()
                                    .addLast("codec", new HttpServerCodec())
                                    .addLast("aggregator", new HttpObjectAggregator(1024 * 1024))
                                    .addLast("chunkHandler", new ChunkedWriteHandler())
                                    .addLast("nettyWebSocketHandler", new NettyWebSocketHandler());

                        }
                    });

            ChannelFuture channelFuture = bootstrap.bind(port).sync();
            channelFuture.channel().closeFuture().sync();
        } finally {
            workGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
        }
    }


    public static void main(String[] args) throws InterruptedException {
        System.out.println("Netty的WebSocket协议服务端启动");
        NettyWebSocketServer.connect(8080);
    }

}
```

(2) WebSocket处理器  
NettyWebSocketHandler主要负责建立浏览器和服务器通道、以及处理浏览器发送的请求。

```
package com.wgs.netty.demo5_netty4websocket;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.*;
import io.netty.handler.codec.http.websocketx.*;
import io.netty.util.CharsetUtil;

import java.util.Date;

import static io.netty.handler.codec.http.HttpUtil.isKeepAlive;
import static io.netty.handler.codec.http.HttpUtil.setContentLength;

/**
 * Created by wanggenshen
 * Date: on 2019/8/15 00:16.
 * Description: XXX
 */
public class NettyWebSocketHandler extends SimpleChannelInboundHandler {


    private WebSocketServerHandshaker webSocketServerHandshaker;

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {

        // 第一次以传统HTTP方式接入, 带有Upgrade: websocket信息
        if (msg instanceof FullHttpRequest) {
            handleHttpRequest(ctx, (FullHttpRequest)msg);
        }
        // WebSocket接入
        else if (msg instanceof WebSocketFrame) {
            handleWebSocketFrame(ctx, (WebSocketFrame)msg);
        }

    }

    private void handleWebSocketFrame(ChannelHandlerContext ctx, WebSocketFrame webSocketFrame) {
        // 判断是否是关闭链路的指令
        if (webSocketFrame instanceof CloseWebSocketFrame) {
            webSocketServerHandshaker.close(ctx.channel(), (CloseWebSocketFrame) webSocketFrame.retain());
            return;
        }

        // 判断是否是Ping消息
        if (webSocketFrame instanceof PingWebSocketFrame) {
            ctx.channel().write(new PongWebSocketFrame(webSocketFrame.content().retain()));
            return;
        }

        // 只支持文本消息
        if (!(webSocketFrame instanceof TextWebSocketFrame)) {
            throw new UnsupportedClassVersionError(String.format("%s frame type is not supported",
                    webSocketFrame.getClass().getName()));
        }

        // 返回应答消息
        String request = ((TextWebSocketFrame)webSocketFrame).text();
        String response = "\r\n【Server】: ";
        if ("你好".equals(request)) {
            response = response + "你好, 我是Netty Server";
        } else if (request.contains("几点")) {
            response = response + ", 现在时间是" + new Date().toString();
        }
        response = response + "\r\n";
        ctx.channel().write(new TextWebSocketFrame(response));
    }

    private void handleHttpRequest(ChannelHandlerContext ctx, FullHttpRequest fullHttpRequest) {

        // HTTP解码失败, 返回HTTP异常
        if (!fullHttpRequest.getDecoderResult().isSuccess()
                || !("websocket").equals(fullHttpRequest.headers().get("Upgrade"))) {
            sendHttpResponse(ctx, fullHttpRequest, new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.BAD_REQUEST));
            return;
        }

        // 构建握手工厂, 创建握手处理类, 建立浏览器与服务器的通道, 进行消息处理
        WebSocketServerHandshakerFactory webSocketServerFactory =
                new WebSocketServerHandshakerFactory("ws://localhost:8080/websockt", null, false);
        webSocketServerHandshaker = webSocketServerFactory.newHandshaker(fullHttpRequest);
        if (webSocketServerHandshaker == null) {
            // 异常
            WebSocketServerHandshakerFactory.sendUnsupportedVersionResponse(ctx.channel());
        } else {
            //  处理WebSocket消息
            webSocketServerHandshaker.handshake(ctx.channel(), fullHttpRequest);
        }
    }


    private static void sendHttpResponse(ChannelHandlerContext ctx, FullHttpRequest request, FullHttpResponse response) {

        // 返回响应给客户端
        if (response.getStatus().code() != 200) {
            ByteBuf byteBuf = Unpooled.copiedBuffer(response.getStatus().toString(), CharsetUtil.UTF_8);
            response.content().writeBytes(byteBuf);
            byteBuf.release();
            setContentLength(response, response.content().readableBytes());
        }

        // 非Keep-Alive, 关闭连接
        ChannelFuture future = ctx.channel().writeAndFlush(response);
        if (isKeepAlive(response) || response.getStatus().code() != 200) {
            future.addListener(ChannelFutureListener.CLOSE);
        }


    }

    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ctx.flush();
    }


    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

(3) 客户端代码  
客户端发送请求到服务器。

```
<!DOCTYPE html>
<html>
<head>
	<title> Netty WebSocket时间客户端</title>
</head>
<body>

	<script type="text/javascript">
		
		var socket;
		if (!window.WebSocket) {
			window.WebSocket = window.MozWebSocket;
		}

		if (window.WebSocket) {
			// 通信
			socket = new WebSocket("ws://localhost:8080/websocket");

			socket.onmessage = function(event) {
				var responseText = document.getElementById("responseText");
				responseText.value = responseText.value + event.data;
			};

			// 建立连接
			socket.onopen = function(event) {
				document.getElementById("text1").innerHTML = "WebSocket服务器正常， 浏览器支持Websocket";
			};

			// 关闭连接
			socket.onclose = function(event) {
				document.getElementById("text1").innerHTML = "WebSocket关闭";
			};

		} else {
			alert("抱歉，浏览器不支持WebSocket协议");
		}

		function send(message) {
			if (!window.WebSocket) {
				return;
			}
			if (socket.readyState == WebSocket.OPEN) {
				socket.send(message);
			} else {
				alert("WebSocket连接没有建立成功");
			}
		}

	</script>
	<form onsubmit="return false;">
		<input type="text" name="message" value="Netty聊天室" 
				style="width: 300px;height: 40px; color: blue; background-color: yellow;"/><br><br>
		
		<hr color="blue"/>

		<h3>服务端返回的应答消息</h3>

		<span id="text1" style="color: red">aa</span><br>

		<text id="userId">Tom</text><br>

		<textarea id="responseText" name="responseText" style="width: 300px;height: 250px"></textarea>
		
		<br>
		<input type="button" value="发送消息" style = "background-color: blue;" 
				οnclick="send(this.form.responseText.value)"/>
	</form>

</body>
</html>
```

(4)测试  
测试如下：  
![](./images/5267c821737ab5b3.png)

---

参考  
《Netty权威指南》  
WebSocket协议 8 问: imooc.com/article/290121