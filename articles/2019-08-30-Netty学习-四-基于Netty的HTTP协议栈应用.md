---
title: "Netty学习（四）- 基于Netty的HTTP协议栈应用"
date: 2019-08-30
category: 后端开发
tags: [Netty, Http, Netty Http]
---

#### 前言

HTTP服务器在我们日常开发中，常见的实现方式就是实现一个Java Web项目，基于Nginx+Tomcat的方式就可以提供HTTP服务。但是很多场景是非Web容器的场景，这个时候再使用Tomcat就大材小用了。这个时候就可以使用基于Netty的HTTP协议。那么基于Netty开发的HTTP服务器有什么优势呢？

- Netty的多线程模型和异步非阻塞特性能够支持高并发；
- 相比于Tomcat HTTP，Netty HTTP更加轻量、小巧、可靠，占用资源更少。

#### 一、HTTP协议简介

**1、HTTP协议介绍**  
HTTP协议：HyperText Transfer Protocol，超文本传输协议；标准的Client/Server模型，是应用层的协议，由请求和响应组成，客户端指定URL并且携带必要参数后就可以请求服务器。

HTTP URL（特殊的URI）格式：  
`http://host[:port][abs_path]`

- http表示通过HTTP协议定位网络资源；
- host表示合法的Internet主机域或者IP地址；
- port指定端口号，默认使用80；
- abs\_path表示指定资源的URI；

**2、HTTP请求消息**  
HTTP协议一般包含三个部分：

- 请求行
- 消息头
- 空格行（一般在POST请求中）
- 请求正文（一般在POST请求中）

（1）GET请求  
GET请求一般由请求行和消息头组成，请求参数放在url后面，用？连接。

请求行格式为： method /request uri/HTTP version  
消息头由键值对组成。  
输入百度，通过抓包可以看到如下GET请求组成：  
![](./images/e9277183546b155a.png)

（2）POST请求  
POST请求参数一般放在请求正文（message body）中。  
![](./images/700554e2037a1bf5.png)  
图片来源：https://blog.csdn.net/xiao\_\_gui/article/details/16981245

#### 二、Netty 中HTTP编解码器介绍

##### 1、Netty中HTTP编解码器介绍

**（1）HttpRequestDecoder**  
`Decodes ByteBuf into HttpRequest and HttpContent.`  
Http请求消息解码器，即将ByteBuf解码到HttpRequest和HttpContent中。

**（2）HttpResponseEncoder**  
`Encodes an HttpResponse or an HttpContent into a ByteBuf.`  
响应编码器，即将HttpResponse 或 HttpContent 编码到 ByteBuf。

**（3）HttpServerCodec**  
`A combination of HttpRequestDecoder and HttpResponseEncoder which enables easier server side HTTP implementation.`  
即同时实现了HttpRequestDecoder和HttpResponseEncoder的功能，所以基于Netty实现HTTP服务端时，在ChannelPipeline中加上HttpServerCodec，或者HttpResponseEncoder和HttpServerCodec即可。

```
ch.pipeline().addLast("httpServerCodec", new HttpServerCodec());

或者
ch.pipeline().addLast("httpRequestDecoder", new HttpRequestDecoder())
            .addLast("httpResponseEncoder",new  HttpResponseEncoder());
```

**（4）HttpObjectAggregator**  
`A ChannelHandler that aggregates an HttpMessage and its following HttpContent into a single FullHttpRequest or FullHttpResponse (depending on if it used to handle requests or responses) with no following HttpContent. It is useful when you don't want to take care of HTTP messages whose transfer encoding is 'chunked'.`

HttpObjectAggregator 可以把HttpMessage和HttpContent聚合成一个FullHttpRequest或FullHttpResponse（处理请求或响应）。  
在解析POST请求时，由于参数放在message body中，上述3种解码器无法解析，所以必须用HttpObjectAggregator。

##### 2、HTTP GET解析

**(1) 获取GET请求uri**  
HTTP请求参数是放在uri中，所以拿到uri再进行解析即可，需要注意，浏览器发请求时会同时去请求favicon.ico(url左侧的图标)，需要过滤该请求。  
![](./images/b5c8aa772aee1a68.png)

```
// 获取uri
HttpRequest request = (HttpRequest)msg;
String uri = request.uri();

// 过滤favicon.ico请求
if(uri.equals("favicon.ico")) {
    return;
}
```

**(2) 解析uri**  
QueryStringDecoder用来解析uri，它的作用是将请求中的参数分割成path和k-v键值对的形式，也可以用来解码 Content-Type = “application/x-www-form-urlencoded” 的 HTTP POST请求，但是只能用一次。

如uri为"/hello?recipient=world&x=1;y=2"，使用QueryStringDecoder解析后：  
path：/hello  
key1：recipient, value1：world  
key2：x, value2: 1  
key3: y, value3: 2

解析代码：

```
String uri = request.uri();
HttpMethod method = request.method();
if (HttpMethod.GET.equals(method)) {
    QueryStringDecoder queryStringDecoder = new QueryStringDecoder(uri, Charsets.toCharset(CharEncoding.UTF_8));
    Map<String, List<String>> uriAttrMap = queryStringDecoder.parameters();
     if (uriAttrMap != null && uriAttrMap.size() > 0) {   
       uriAttrMap.entrySet().stream().forEach(entry -> {                        entry.getValue().stream().forEach(attrVal -> {
               System.out.println("key : " + entry.getKey() + ", value : " + attrVal);
          });
        });
     }
 }
```

##### 3、 HTTP POST 解析实践

HTTP POST请求参数在message body中，需要使用HttpObjectAggregator进行解码。  
POST请求中常见的content-type有application/json、application/x-www-form-urlencoded、 multipart/form-data，下面针对不同content-type进行解析。

**（1）解析 application/json**  
JSON格式解析较为简单，将msg转换为FullHttpRequest后，获取content反序列化成JSONObject对象即可拿到参数值。

```
FullHttpRequest fullHttpRequest = (FullHttpRequest) msg;
String jsonStr = fullHttpRequest.content().toString(Charsets.toCharset(CharEncoding.UTF_8));
JSONObject json = JSONObject.parseObject(jsonStr);
json.entrySet().stream().forEach(entry -> {
     System.out.println(entry.getKey() + " = " + entry.getValue().toString());
});
```

**（2）解析 application/x-www-form-urlencoded**  
以POST提交请求的时候，不设置`enctype`属性，默认值即为`application/x-www-form-urlencoded`。  
①可以使用上节说到的QueryStringDecoder进行解析，解析代码如前所述；  
②使用HttpPostRequestDecoder进行解析。  
HttpPostRequestDecoder既可以解析application/x-www-form-urlencoded，又可以解析multipart/form-data。  
解析代码如下：

```
HttpRequest request = (HttpRequest) msg;
HttpPostRequestDecoder decoder = new HttpPostRequestDecoder(factory, request, Charsets.toCharset(CharEncoding.UTF_8));
List<InterfaceHttpData> httpDatas = decoder.getBodyHttpDatas();
httpDatas.forEach(data -> {
    if (InterfaceHttpData.HttpDataType.Attribute.equals(data.getHttpDataType())) {
       Attribute attribute = (Attribute) data;                 System.out.println(attribute.getName() + "=" + attribute.getValue());
    }
});
```

**（3）解析 multipart/form-data （文件上传）**  
POST请求中需要上传文件，置`enctype`属性设置为`multipart/form-data`。解析该类请求使用HttpPostRequestDecoder即可。

```
DiskFileUpload.baseDirectory = "/data/fileupload/";
HttpRequest request = (HttpRequest) msg;
HttpPostRequestDecoder decoder = new HttpPostRequestDecoder(factory, request, Charsets.toCharset(CharEncoding.UTF_8));
List<InterfaceHttpData> datas = decoder.getBodyHttpDatas();
for (InterfaceHttpData data : datas) {
　　if(data.getHttpDataType() == HttpDataType.FileUpload) {
　　　　FileUpload fileUpload = (FileUpload) data;
　　　　String fileName = fileUpload.getFilename();
　　　　if(fileUpload.isCompleted()) {
　　　　　　//保存到磁盘
　　　　　　StringBuffer fileNameBuf = new StringBuffer();
　　　　　　fileNameBuf.append(DiskFileUpload.baseDirectory).append(fileName);
　　　　　　fileUpload.renameTo(new File(fileNameBuf.toString()));
　　　　}
　　}
}
```

#### 三、Netty HTTP服务器实现

结构设计：  
![](./images/a53df206f66da607.png)

代码实现：  
**1、Netty HTTP handler：**  
NettyHttpServerHandler.java

```
package com.wgs.netty.demo4_netty4http;

import com.alibaba.fastjson.JSONObject;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.*;
import io.netty.handler.codec.http.*;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpRequest;
import io.netty.handler.codec.http.HttpVersion;
import io.netty.handler.codec.http.multipart.*;
import io.netty.util.ReferenceCountUtil;
import org.apache.commons.codec.CharEncoding;
import org.apache.commons.codec.Charsets;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Created by wanggenshen
 * Date: on 2019/8/11 00:55.
 * Description: Netty HTTP 业务处理handler
 */
public class NettyHttpServerHandler extends SimpleChannelInboundHandler{

    private HttpHeaders headers;
    private HttpRequest httpRequest;
    private FullHttpResponse response;
    private FullHttpRequest fullHttpRequest;
    private HttpPostRequestDecoder decoder;

    private static final HttpDataFactory httpDataFactory = new DefaultHttpDataFactory(DefaultHttpDataFactory.MAXSIZE);

    private static final String FAVICON_ICO = "/favicon.ico";
    private static final String SUCCESS = "success";
    private static final String ERROR = "error";
    private static final String CONNECTION_KEEP_ALIVE = "keep-alive";
    private static final String CONNECTION_CLOSE = "close";


    static {
        DiskFileUpload.baseDirectory = "/Users/wanggenshen/MyProjects/upload/";
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {

        if (!(msg instanceof HttpRequest)) {
            // Discard request: 丢掉任何收到的数据, 不响应
            ReferenceCountUtil.release(msg);
        }

        try {
            // 获取uri
            httpRequest = (HttpRequest) msg;
            headers = httpRequest.headers();
            String uri = httpRequest.uri();
            System.out.println("receive a http request, uri is : " + uri);

            // 去除 浏览器"/favicon.ico"干扰
            if (FAVICON_ICO.equals(uri)) {
                return;
            }

            // 针对不同method进行解析
            HttpMethod method = httpRequest.method();
            if (HttpMethod.GET.equals(method)) {
                QueryStringDecoder queryStringDecoder = new QueryStringDecoder(uri, Charsets.toCharset(CharEncoding.UTF_8));
                Map<String, List<String>> uriAttrMap = queryStringDecoder.parameters();
                if (uriAttrMap != null && uriAttrMap.size() > 0) {
                    uriAttrMap.entrySet().stream().forEach(entry -> {
                        entry.getValue().stream().forEach(attrVal -> {
                            System.out.println("key : " + entry.getKey() + ", value : " + attrVal);
                        });
                    });
                }
            }
            // POST方法
            else if (HttpMethod.POST.equals(method)) {
                // POST请求数据放在message body中,需要将msg转为FullHttpRequest
                fullHttpRequest = (FullHttpRequest) msg;
                // 根据不同类型的content-type进行处理
                processWithContentType();

            }
            // 未知类型, 其余method可自行拓展
            else {
                System.out.println("Unknown method for: " + method.toString() + ", no need to process");
                return;
            }

            writeResponse(ctx.channel(), HttpResponseStatus.OK, SUCCESS, false);
        } catch (Exception e) {
            // 关闭连接
            writeResponse(ctx.channel(), HttpResponseStatus.INTERNAL_SERVER_ERROR, ERROR, true);
        }

    }

    private void writeResponse(Channel channel, HttpResponseStatus status, String msg, boolean forceClose) {
        ByteBuf byteBuf = Unpooled.wrappedBuffer(msg.getBytes());
        response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, status, byteBuf);
        if (!isClose() && !forceClose) {
            response.headers().add(org.apache.http.HttpHeaders.CONTENT_LENGTH, String.valueOf(byteBuf.readableBytes()));
        }

        if (isClose() || forceClose) {
            ChannelFuture future = channel.write(response);
            future.addListener(ChannelFutureListener.CLOSE);
        }

    }

    private boolean isClose() {
        if(httpRequest.headers().contains(org.apache.http.HttpHeaders.CONNECTION, CONNECTION_CLOSE, true)
                || (httpRequest.protocolVersion().equals(HttpVersion.HTTP_1_0) &&
                        !httpRequest.headers().contains(org.apache.http.HttpHeaders.CONNECTION, CONNECTION_KEEP_ALIVE, true))) {
            return true;
        }
        return false;
    }

    private void processWithContentType() {
        String contentType = getContentType();
        if ("application/json".equals(contentType)) {
            String jsonStr = fullHttpRequest.content().toString(Charsets.toCharset(CharEncoding.UTF_8));
            JSONObject json = JSONObject.parseObject(jsonStr);
            json.entrySet().stream().forEach(entry -> {
                System.out.println(entry.getKey() + " = " + entry.getValue().toString());
            });
        } else if ("application/x-www-form-urlencoded".equals(contentType)) {
            // 方法一: 使用QueryStringDecoder
            String jsonStr = fullHttpRequest.content().toString(Charsets.toCharset(CharEncoding.UTF_8));
            // post请求不带"?"后的路径, 所以设置为false
            QueryStringDecoder queryStringDecoder = new QueryStringDecoder(jsonStr, false);
            Map<String, List<String>> attrMap = queryStringDecoder.parameters();
            attrMap.entrySet().stream().forEach(entry -> {
                List<String> attrValues = entry.getValue();
                attrValues.stream().forEach(attrVal -> {
                    System.out.println(entry.getKey() + " = " + attrVal);
                });

            });

            // 方法二: 使用HttpPostRequestDecoder
            initHttpPostRequestDecoder();
            // 获取POST请求中body部分的数据
            List<InterfaceHttpData> httpDatas = decoder.getBodyHttpDatas();
            httpDatas.forEach(data -> {
                if (InterfaceHttpData.HttpDataType.Attribute.equals(data.getHttpDataType())) {
                    try {
                        Attribute attribute = (Attribute) data;
                        System.out.println(attribute.getName() + "=" + attribute.getValue());
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            });
        } else if ("multipart/form-data".equals(contentType)) {
            initHttpPostRequestDecoder();
            List<InterfaceHttpData> httpDatas = decoder.getBodyHttpDatas();
            httpDatas.stream().forEach(data -> {
                // 处理待上传的数据
                try {
                    processUploadData(data);
                } catch (IOException e) {
                    e.printStackTrace();
                    throw new RuntimeException(e);
                }
            });
        } else {
            return;
        }

    }

    private void processUploadData(InterfaceHttpData data) throws IOException {
        if (InterfaceHttpData.HttpDataType.FileUpload.equals(data.getHttpDataType())) {
            FileUpload fileUpload = (FileUpload) data;
            String fileName = fileUpload.getFilename();
            if (fileUpload.isCompleted()) {
                // 保存到磁盘
                String filePath = DiskFileUpload.baseDirectory + fileName;
                fileUpload.renameTo(new File(filePath));

            }
        }
    }

    /**
     * 初始化HttpPostRequestDecoder
     */
    private void initHttpPostRequestDecoder() {
        if (decoder != null) {
            decoder.cleanFiles();
            decoder = null;
        }
        decoder = new HttpPostRequestDecoder(httpDataFactory, httpRequest, Charsets.toCharset(CharEncoding.UTF_8));
    }
    
    private String getContentType () {
        String contentTypeStr = headers.get("Content-Type").toString();
        return contentTypeStr.split(";")[0];
    }
    
    

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }

    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ctx.flush();
    }
}
```

**2、NettyHttpServer服务端**

```
package com.wgs.netty.demo4_netty4http;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;

/**
 * Created by wanggenshen
 * Date: on 2019/8/11 16:27.
 * Description: 基于Netty的HTTP服务器
 */
public class NettyHttpServer {

    public static void bind(int port) throws InterruptedException {
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
                                    // HttpServerCodec == HttpRequestDecoder & & HttpResponseEncoder
                                    .addLast("codec", new HttpServerCodec())
                                    // 处理POST请求需要
                                    .addLast("aggregator", new HttpObjectAggregator(1024 * 1024))
                                    // 处理具体业务的业务handler
                                    .addLast("handler", new NettyHttpServerHandler());
                        }
                    });

            ChannelFuture channelFuture = bootstrap.bind(port).sync();
            channelFuture.channel().closeFuture().sync();

        } finally {
            bossGroup.shutdownGracefully();
            workGroup.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        NettyHttpServer.bind(8080);
    }
}
```

#### 四、测试

启动Netty HTTP服务端，使用curl命令分别模拟GET、POST请求进行测试。

##### 1、GET测试

curl -s “localhost:8080/api/get?a=1&b=2&c=3” -v  
![](./images/3442b3e8e9a0f00a.png)

##### 2、POST请求测试

用curl命令模拟请求，分别测试POST请求3种不同content-type：

- application/x-www-form-urlencoded：curl localhost:8080/info -X POST -d ‘title=netty&lesson=ch4’ -v
- application/json：curl localhost:8080/info -X POST -d ‘{“name”: “netty”}’ -H “Content-Type:application/json” -v
- multipart/form-data：curl localhost:8080/upload -F “file=@/Users/wanggenshen/Downloads/aodi.jpg” -H “token:222” -v

如图所示：  
![](./images/b21477e9c9d2a389.png)

#### 五、问题

1、在运行的时候，出现报错：  
`io.netty.util.IllegalReferenceCountException: refCnt: 0, decrement: 1`  
![](./images/9bc6f3d90d396661.png)

在NettyHttpServerHandler#channelRead0方法中，之前加上了finally块，释放ByteBuf 对象。  
![](./images/bded85de45ab0fcf.png)

原因：  
（1）Server在接收到请求后，首先进入SimpleChannelInboundHandler # channelRead(ChannelHandlerContext ctx, Object msg) 方法中，然后再调用`channelRead0(ctx, imsg);`方法，该方法即为我们在NettyHttpServerHandler类中实现的`channelRead0`方法。  
![](./images/e9126b8182d8293e.png)

（2）进入到我们自己继承自SimpleChannelInboundHandler的NettyHttpServerHandler类中，该类实现了父类的`channelRead0`方法。  
执行完try中的代码块后，进入到finally代码块，调用`ReferenceCountUtil.release(msg);`释放msg的`ByteBuf`, 断点debug发现此时对应的引用计数器为0.  
![](./images/e31166cac402afe1.png)

（根据官网介绍，Netty4中，对象生命周期由引用计数器控制。每个对象调用一次计数器+1，调用release释放一次计数器减1，计数器为0再去引用时就会抛出IllegalReferenceCountException。）  
![](./images/e4558acda8c38225.png)  
官网：https://netty.io/wiki/reference-counted-objects.html

（3）执行完子类NettyHttpServerHandler代码后，再回到父类SimpleChannelInboundHandler中，执行finally块的代码。  
![](./images/3223bb718947048b.png)  
在执行`ReferenceCountUtil.release(msg);`代码时，发现(msg).content).refCnt（在第2步释放后计数器减1变为0）了，此时再减1 就会报`IllegalReferenceCountException`错。

解决办法：  
在子类中不用手动去释放，SimpleChannelInboundHandler会帮助我们去释放对象。