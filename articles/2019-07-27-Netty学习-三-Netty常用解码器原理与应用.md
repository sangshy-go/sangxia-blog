---
title: "Netty学习（三）- Netty常用解码器原理与应用"
date: 2019-07-27
category: 后端开发
tags: [Netty, 解码器, DelimiterBasedFrameDecoder, FixedLengthFrameDecoder, LengthFieldBasedFrameDecoder]
---

#### 一、Netty常用解码器

TCP以流的形式传输数据，上层协议为了对消息进行区分，常采用以下4种方式：

- 回车换行符：将回车换行符作为消息结束标志，如FTP协议，这种方式在文本协议中应用较为广泛；
- 特殊分隔符：将特殊分隔符作为消息结束标志，上述的回车换行符就是一种特殊的特殊分隔符；
- 固定消息长度：设置一个定值LEN，当累计读取到长度为LEN的报文后就认为读取了一个完整的消息；将计数器置位重新读取下一个数据报文；
- 消息头定长：在消息头中定义长度标识消息总长度。

Netty提供了4种常用解码器：

- LineBasedFrameDecoder - 换行解码器
- DelimiterBasedFrameDecoder - 分隔符解码器
- FixedLengthFrameDecoder - 定长解码器
- LengthFieldBasedFrameDecoder - 消息头定长解码器

下面将逐一通过demo演示4种解码器对粘包问题的支持。

#### 二、Netty常用解码器代码演示

##### 2.1 LineBasedFrameDecoder

LineBasedFrameDecoder是基于行分割的解码器，使用的分隔符为windows下的`\r\n`或linux的`\n`属于特殊的分隔符解码器。

LineBasedFrameDecode中成员变量:

```
     /**最大解码帧长度，超过此长度还未找到分隔符将会抛出TooLongFrameException异常 */
    private final int maxLength;
    /** 是否快速失败；true-超过maxLength快速抛出异常;         false-超过maxLength读完整帧再抛出异常 */
    private final boolean failFast;
    // 返回的解析结果中是否包含分隔符
    private final boolean stripDelimiter;

    /**超过最大帧长度是否丢弃字节 */
    private boolean discarding;
    /**丢弃的帧长度 */
    private int discardedBytes;
```

LineBasedFrameDecode的代码示例在上节已经演示过，本文就不在演示。

##### 2.2 DelimiterBasedFrameDecoder

###### 1、定义

DelimiterBasedFrameDecoder是基于分隔符的解码器。  
DelimiterBasedFrameDecoder解码器在接收到ByteBufs后，根据自定义的分隔符进行分割。

###### 2、分隔符

DelimiterBasedFrameDecoder支持自定义一个或多个分隔符。如果在消息中发现多个分隔符，会选择能产生最短帧的分隔符。  
如：  
以下字符串中包含`\n`和`\r\n`两个分隔符。

```
 ABC\nDEF\r\n
```

（1） DelimiterBasedFrameDecoder采用`\n`作为分隔符后的结果为：

```
 ABC | DEF
```

（2） DelimiterBasedFrameDecoder采用`\r\n`作为分隔符后的结果为：

```
 ABC\nDEF
```

采用`\n`产生的帧长度比采用`\r\n`产生的帧长度短，  
所以 DelimiterBasedFrameDecode采用`\n`分隔符。

###### 3、默认分隔符

DelimiterBasedFrameDecode有两种默认分隔符：NUL分隔符和行分隔符.

```
public static ByteBuf[] nulDelimiter() {
     return new ByteBuf[] {
         Unpooled.wrappedBuffer(new byte[] { 0 }) };
 }
    
public static ByteBuf[] lineDelimiter() {
   return new ByteBuf[] {
         Unpooled.wrappedBuffer(new byte[] { '\r', '\n' }),
          Unpooled.wrappedBuffer(new byte[] { '\n' }),
     };
}
```

###### 4、代码演示

**服务端：**

```
package com.wgs.netty.demo3_decoder;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.DelimiterBasedFrameDecoder;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;

/**
 * Created by wanggenshen
 * Date: on 2019/7/13 17:34.
 * Description: DelimiterBasedFrameDecoder解码器demo服务端
 */
public class EchoServer {

    private static final String DELIMITER_STR = "$_";

    public static void bind(int port) throws InterruptedException {
        EventLoopGroup parentGroup = new NioEventLoopGroup();
        EventLoopGroup workGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(parentGroup, workGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 100)
                    .handler(new LoggingHandler(LogLevel.INFO))
                    .childHandler(new ChannelInitializer<SocketChannel>() {

                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            // $_ 分隔符
                            ByteBuf delimiter = Unpooled.copiedBuffer("$_".getBytes());
                            socketChannel.pipeline()
                                    // 分隔符解码器
                                    .addLast(new DelimiterBasedFrameDecoder(1024, delimiter))
                                    // Bytebuf解码成字符串对象
                                    .addLast(new StringDecoder())
                                    .addLast(new SimpleChannelInboundHandler() {
                                        // 计数器
                                        int counter = 0;

                                        @Override
                                        protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {
                                            // 读取客户端发送的消息
                                            String bodyFromClient = (String) msg;
                                            System.out.println("This msg is from client , content is : 【" + bodyFromClient + "】"
                                                                + ", the counter is : " + ++counter);

                                            // 将读取到的内容再发送给客户端
                                            String bodyToClient = "FROM服务端的消息【" + bodyFromClient + "】" + DELIMITER_STR;
                                            ByteBuf resp = Unpooled.copiedBuffer(bodyToClient.getBytes());
                                            ctx.writeAndFlush(resp);
                                        }
                                    });
                        }
                    });
            ChannelFuture future = bootstrap.bind(port).sync();
            future.channel().closeFuture().sync();

        } finally {
            parentGroup.shutdownGracefully();
            workGroup.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        EchoServer.bind(8080);
    }


}
```

**客户端**

```
package com.wgs.netty.demo3_decoder;

import io.netty.bootstrap.Bootstrap;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.codec.DelimiterBasedFrameDecoder;
import io.netty.handler.codec.string.StringDecoder;

/**
 * Created by wanggenshen
 * Date: on 2019/7/13 18:18.
 * Description: DelimiterBasedFrameDecoder客户端demo
 */
public class EchoClient {

    private static final String DELIMITER_STR = "$_";

    public static void connect(int port, String host) throws InterruptedException {
        EventLoopGroup workGroup = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(workGroup)
                    .channel(NioSocketChannel.class)
                    .option(ChannelOption.TCP_NODELAY, true)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            // 定义$_ 分隔符
                            ByteBuf delimiter = Unpooled.copiedBuffer(DELIMITER_STR.getBytes());
                            socketChannel.pipeline()
                                    // 分隔符解码器
                                    .addLast(new DelimiterBasedFrameDecoder(1024, delimiter))
                                    // ByteBuf解码成字符串对象
                                    .addLast(new StringDecoder())
                                    .addLast(new SimpleChannelInboundHandler() {
                                        // 计数器
                                        private int counter;
                                        static final String ECHO_STR = "this is delimiter demo$_";

                                        /**
                                         * 读取服务端响应
                                         *
                                         * @param ctx
                                         * @param msg
                                         * @throws Exception
                                         */
                                        @Override
                                        protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {
                                            String bodyFromServer = (String) msg;
                                            System.out.println("The msg is from server, content: " + bodyFromServer
                                                    + ", the times is : " + ++counter);
                                        }

                                        /**
                                         * 发送消息给客户端
                                         *
                                         * @param ctx
                                         * @throws Exception
                                         */
                                        @Override
                                        public void channelActive(ChannelHandlerContext ctx) throws Exception {
                                            for (int i = 0; i < 10; i++) {
                                                ctx.writeAndFlush(Unpooled.copiedBuffer(ECHO_STR.getBytes()));
                                            }
                                        }
                                    });
                        }
                    });

            // 发起异步连接
            ChannelFuture future = bootstrap.connect(host, port).sync();
            // 等待客户端链路关闭
            future.channel().closeFuture().sync();
        } finally {
            workGroup.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        EchoClient.connect(8080, "127.0.0.1");
    }
}
```

客户端发送消息，并且以分隔符"$\_"结尾；

服务端接收到消息后，以"$\_"进行分割。  
运行结果如下：  
![](./images/ee675b2f19e1214f.png)  
![](./images/ec2168f084f18c31.png)

##### 2.3 FixedLengthFrameDecoder

###### 1、定义

FixedLengthFrameDecoder是固定长度解码器，能够根据指定的长度对消息进行自动解码。  
比如说：  
左边的字符串按照固定长度为3进行解码后得到的消息帧为右：

```
 +---+----+------+----+   3    +-----+-----+-----+ 
 | A | BC | DEFG | HI |  ==>   | ABC | DEF | GHI |
 +---+----+------+----+        +-----+-----+-----+
```

###### 2、代码演示

**服务端：**

```
package com.wgs.netty.demo3_decoder;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.FixedLengthFrameDecoder;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;

/**
 * Created by wanggenshen
 * Date: on 2019/7/15 22:54.
 * Description: FixedLengthFrameDecoder解码器服务端Demo
 */
public class EchoServer2 {


    public static void bind(int port) throws InterruptedException {
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 100)
                    .handler(new LoggingHandler(LogLevel.INFO))
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            // 每次截取3个字节的解码器
                            socketChannel.pipeline().addLast(new FixedLengthFrameDecoder(3))
                                    .addLast(new StringDecoder())
                                    .addLast(new SimpleChannelInboundHandler() {
                                        @Override
                                        protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {
                                            System.out.println("Received msg from client, content is : 【" + msg + "】");
                                        }
                                    });
                        }
                    });

            ChannelFuture future = bootstrap.bind(port).sync();
            future.channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workGroup.shutdownGracefully();
        }

    }


    public static void main(String[] args) throws InterruptedException {
        EchoServer2.bind(8080);
    }
}
```

**客户端**

```
package com.wgs.netty.demo3_decoder;

import io.netty.bootstrap.Bootstrap;
import io.netty.buffer.Unpooled;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by wanggenshen
 * Date: on 2019/7/15 23:31.
 * Description: FixedLengthFrameDecoder解码器客户端Demo
 */
public class EchoClient2 {

    public static void connect(int port, String host) throws InterruptedException {
        EventLoopGroup workGroup = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(workGroup)
                    .channel(NioSocketChannel.class)
                    .option(ChannelOption.TCP_NODELAY, true)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            socketChannel.pipeline()
                                    .addLast(new SimpleChannelInboundHandler() {
                                        @Override
                                        protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {

                                        }

                                        @Override
                                        public void channelActive(ChannelHandlerContext ctx) throws Exception {
                                            List<String> list = new ArrayList<String>();
                                            list.add("A");
                                            list.add("BC");
                                            list.add("DEFG");
                                            list.add("HI");
                                            for (String str : list) {
                                                ctx.writeAndFlush(Unpooled.copiedBuffer(str.getBytes()));
                                            }

                                        }
                                    });
                        }
                    });



            ChannelFuture future = bootstrap.connect(host, port).sync();
            future.channel().closeFuture().sync();


        } finally {
            workGroup.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        EchoClient2.connect(8080, "127.0.0.1");
    }
}
```

**运行与测试：**  
分别运行服务端与客户端后，可以看到客户端分别发送的"A"、“BC”、“DEFG”、"HI"字符串按照3个字节长度对请求消息进行截取，输出结果为: ABC、DEF、GHI，符合预期。  
![](./images/5161ffd7c5646844.png)

##### 2.4、LengthFieldBasedFrameDecoder

###### 1、定义

LengthFieldBasedFrameDecoder基于长度的消息帧解码器，可以根据接收的消息中长度字段值，动态分割消息，可用来自定义协议。

###### 2、成员变量

```
    // 长度字段的字节序：大端或小端，默认为大端
    private final ByteOrder byteOrder;
    // 最大帧长度，超过该值快速失败
    private final int maxFrameLength;
    // 为true，当frame长度超过maxFrameLength时立即报TooLongFrameException异常，为false，读取完整个帧再报异常
     private final boolean failFast;
    // 长度字段的偏移量，当长度字段不在首位的时候，可用该字段解决
    private final int lengthFieldOffset;
    // 标识消息体的长度，
    private final int lengthFieldLength;
    // 长度字段的值
    private final int lengthFieldEndOffset;
    // 长度调节量，可代表数据包的总长度
    private final int lengthAdjustment;
    //解析时候跳过多少个长度
    private final int initialBytesToStrip;
   // 丢弃过长帧数据
    private boolean discardingTooLongFrame;
    // 丢弃的帧数据长度阈值
    private long tooLongFrameLength;
    //  丢弃的帧数据长度
    private long bytesToDiscard;
```

###### 3、构造参数

```
public LengthFieldBasedFrameDecoder(
        int maxFrameLength,
        int lengthFieldOffset, 
        int lengthFieldLength,
        int lengthAdjustment, 
        int initialBytesToStrip
    )
```

4、常见的自定义协议有如下case:  
（1）协议1：消息头（长度字段，标记消息体长度） + 消息体（读取信息不跳过消息头）  
该定义方式第一个字段Length表示长度字段，对应的值Ox000C（16进制为12）代表后面消息体 Actual Content的长度为12.  
读取的时候，不丢弃长度字段。

解码示意图如下，解码前接收到包含2字节长度字段的消息头+12字节的消息体，总共为14字节；解码后，首先读取长度字段再读取消息体，仍然为14字节。  
![](./images/49b980b06deed5c5.png)

构造器参数为：

```
lengthFieldOffset = 0
lengthFieldLength = 2
lengthAdjustment  = 0
initialBytesToStrip = 0
```

（2）协议2：消息头（长度字段，标记消息体长度） + 消息体（读取信息跳过消息头）  
该情形与上面类似，不同在于解码后近包含消息体，需要舍弃消息头中的长度字段。读取的时候希望从接收到的字节流中直接读取消息体，所以需要设置initialBytesToStrip=2，表示读取的时候跳过2字节后读取的内容即为消息体内容。

解码示意图如下。解码前，2字节长度字段+12字节消息体，解码后直接跳过2字节长度字段读取仅仅包含12字节的消息体。  
![](./images/62e55f4d83d79a61.png)

构造器参数为：

```
lengthFieldOffset = 0
lengthFieldLength = 2
lengthAdjustment  = 0
initialBytesToStrip = 2
```

（3）协议3：消息头（长度字段，包含消息头+消息体长度） + 消息体  
（1）、（2）中，消息头的长度字段都只是标识后面消息体的长度。协议3中的长度字段代表整个消息的长度，包含了消息头和消息体的长度。  
在读取的时候，需要用lengthAdjustment字段进行修正（由于消息长度>消息体长度，所以lengthAdjustment一般为负数），代表长度字段表达的长度-lengthAdjustment的绝对值，剩下的即为消息体的长度。

解码示意图如下。解码前，长度字段Length表达的值为14(Ox000E)，Length=消息头(2字节长度字段)+12字节消息体；  
解码后，由于lengthFieldLength仅表示消息体的长度，所以用lengthAdjustment=-2进行调整，表示前2个字节不代表消息体长度(为消息头长度)。  
![](./images/a6b6551c51043b0a.png)

构造器参数为：

```
lengthFieldOffset = 0
lengthFieldLength = 2
lengthAdjustment  = -2
initialBytesToStrip = 0
```

（4）协议4：消息头+长度字段+消息体  
上面3种协议长度字段都是在消息头中，有些协议消息头并不包含长度字段，标识消息的长度字段可能在消息头前，也有可能在消息头后，如下1、2图。

![](./images/9cb0224e48663e91.png)  
1图：消息头 + 长度字段 + 消息体

![](./images/1767facca696cfd3.png)  
2图：长度字段 + 消息头 + 消息体

1图中，客户端接收到消息进行解码的时候，首先读到的2字节(0xCAFE)是消息头1（Header 1），然后3个字节(0x00000C)才是标识长度字段（Length）。那么如何知道那3个字节表示的是长度字段呢？  
用lengthFieldOffset + lengthFieldLength 字段表示需要跳过lengthFieldOffset个字节后，再读取的lengthFieldLength个字节即为长度字段的值。  
解码示意图如下：  
![](./images/f12d46380b862153.png)

消息头1长度为2，所以长度字段偏移量为2，lengthFieldOffset=2；长度字段Length未3， lengthFieldLength=3；  
lengthAdjustment和initialBytesToStrip 均为0.  
所以构造器参数为：

```
lengthFieldOffset = 2
lengthFieldLength = 3
lengthAdjustment  = 0
initialBytesToStrip = 0
```

2图中，首先读取的是3字节的长度字段，所以lengthFieldOffset = 0，lengthFieldLength = 3；然后读取2字节的消息头1，最后读取的才是消息体，所以用lengthAdjustment = 2，表示消息头1的长度，读取完长度字段后需要再额外读取3字节，剩下的才是消息体的内容。  
解码示意图如下：  
![](./images/280aad7db8819a82.png)  
构造器参数为:

```
lengthFieldOffset = 0
lengthFieldLength = 3
lengthAdjustment  = 2
initialBytesToStrip = 0
```

（5）协议5：消息头+长度字段+消息头+消息体  
该协议长度字段在两个消息头之间，如下图1、2所示。  
唯一不同的地方在于图1中的长度字段表示消息体的长度，图2长度字段表示整个消息的长度。  
![](./images/5c3db5cc33ab8b34.png)  
图1

![](./images/457d75721b783fdf.png)  
图2

对于图1，  
消息头1(HDR1)长度为1，所以lengthFieldOffset=1，表示第一个字节之后才是长度字段；  
长度字段(Length)长度为2，所以lengthFieldLength = 2；  
由于解码后忽略HDR1+Length，只剩HDR2和消息体，所以initialBytesToStrip=3，表示解码时忽略前3个字节；  
由于lengthFieldLength对于的值只表示消息体的长度，所以需要用lengthAdjustment=1，表示HDR2的长度。  
解码示意图如下：  
![](./images/1d40f62f4fc35d94.png)

构造器参数为：

```
lengthFieldOffset = 1
lengthFieldLength = 2
lengthAdjustment = 1
initialBytesToStrip = 3
```

对于图2：  
由于lengthFieldLength代表整个消息的长度，所以用lengthAdjustment=-3，代表HDR1 + Length的字节长度；

解码示意图如下：  
![](./images/1966180b5a1bf3c8.png)

构造器参数为：

```
lengthFieldOffset = 1
lengthFieldLength = 2
lengthAdjustment  = -3
initialBytesToStrip = 3
```

###### 4、代码demo

下面用代码实现一个基于LengthFieldBasedFrameDecoder的自定义长度解码器，看看LengthFieldBasedFrameDecoder的工作原理。  
**服务端**  
（1）首先是服务端：  
消息结构：MyProtocolBean

```
package com.wgs.netty.demo3_decoder.lengthFieldDecoder;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Created by wanggenshen
 * Date: on 2019/7/21 22:32.
 * Description: 自定义协议, 服务端与客户端按该协议进行编解码
 */
Data
@NoArgsConstructor
public class MyProtocolBean {

    /**
     * 头部信息-发送端的系统类型: 系统编号 0xA 表示A系统，0xB 表示B系统
     */
    private byte type;

    /**
     * 头部信息- 信息标志, 0xC:表示心跳包, 0xD:表示超时包 ,0xE: 业务信息包
     */
    private byte flag;

    /**
     * 长度字段
     */
    private int length;

    /**
     * 消息体
     */
    private String msgBody;

    public MyProtocolBean(byte type, byte flag, int length, String msgBody) {
        this.type = type;
        this.flag = flag;
        this.length = length;
        this.msgBody = msgBody;
    }
}
```

(2)自定义消息解码器:MyProtocolDecoder  
对接收的消息按照 消息头 + 长度 + 消息体的顺序进行读取解码。

```
package com.wgs.netty.demo3_decoder.lengthFieldDecoder;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.LengthFieldBasedFrameDecoder;

import java.nio.ByteOrder;

/**
 * Created by wanggenshen
 * Date: on 2019/7/21 22:22.
 * Description: LengthFieldBasedFrameDecoder 自定义解码
 */
public class MyProtocolDecoder extends LengthFieldBasedFrameDecoder {

    // 判断传送客户端传送过来的数据是否按照协议传输，头部信息的大小应该是 header + length( byte + byte + int = 1 + 1 + 4 = 6字节)
    private static final int HEADER_SIZE = 6;

    private byte type;
    private byte flag;
    private int length;
    private String body;

    /**
     *
     * @param maxFrameLength 最大帧长度
     * @param lengthFieldOffset 长度字段偏移量
     * @param lengthFieldLength 长度字段字节长度
     * @param lengthAdjustment 长度字段修正
     * @param initialBytesToStrip 解码时跳过的字节数
     * @param failFast 超过最大帧长度时是否报异常
     */
    public MyProtocolDecoder(int maxFrameLength, int lengthFieldOffset, int lengthFieldLength, int lengthAdjustment, int initialBytesToStrip, boolean failFast) {
        super(maxFrameLength, lengthFieldOffset, lengthFieldLength, lengthAdjustment, initialBytesToStrip, failFast);
    }

    /**
     * 对接收的数据按type、flag、length、body的顺序进行解码,按顺序读取
     *
     * @param ctx
     * @param in
     * @return
     * @throws Exception
     */
    @Override
    protected Object decode(ChannelHandlerContext ctx, ByteBuf in) throws Exception {
        in = (ByteBuf) super.decode(ctx, in);
        if (in == null) {
            return null;
        }

        if (in.readableBytes() < HEADER_SIZE) {
            throw new Exception("头部信息格式不正确");
        }

        // 按type、flag、length、body的顺序进行读取; 读的过程中,readIndex的指针也在移动
        // 读取type字段: 消息从哪个系统发送的
        type = in.readByte();

        // 读取flag字段: 消息类型
        flag = in.readByte();

        //读取length字段: 长度字段
        length = in.readInt();

        //读取body: 消息体
        byte[] bytes = new byte[in.readableBytes()];
        in.readBytes(bytes);
        body = new String(bytes, "UTF-8");

        return new MyProtocolBean(type, flag, length, body);

    }
}
```

（3）服务端  
服务端使用LengthFieldBasedFrameDecoder解码器对接收到的消息进行解码，并展示：

```
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;

/**
 * Created by wanggenshen
 * Date: on 2019/7/22 00:20.
 * Description: LengthFieldBasedFrameDecoder demo 服务端
 */
public class DecoderServer {

    private static final int maxFrameLength = 1024 * 1024;
    private static final int lengthFieldOffset = 2;
    private static final int lengthFieldLength = 4;
    private static final int lengthAdjustment = 0;
    private static final int initialBytesToStrip = 6;
    private static final boolean failFast = true;


    public static void bind(int port) throws InterruptedException {
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            socketChannel.pipeline()
                                    .addLast(new MyProtocolDecoder(maxFrameLength, lengthFieldOffset, lengthFieldLength,
                                            lengthAdjustment, initialBytesToStrip, failFast))
                                    .addLast(new SimpleChannelInboundHandler() {
                                        @Override
                                        protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {
                                            if (msg instanceof MyProtocolBean) {
                                                MyProtocolBean myMsg = (MyProtocolBean) msg;
                                                System.out.println("receive from client msg, content is : " + myMsg.getMsgBody());
                                            }
                                        }
                                    });
                        }
                    });
            ChannelFuture future = bootstrap.bind(port).sync();
            future.channel().closeFuture().sync();

        } finally {
            bossGroup.shutdownGracefully();
            workGroup.shutdownGracefully();
        }

    }

    public static void main(String[] args) throws InterruptedException {
        DecoderServer.bind(8080);
    }
}
```

**客户端**  
（1）自定义编码器：MyProtocolEncoder  
MessageToByteEncoder负责将对象编码为byte数组，写入到ByteBuf中。自定义的MyProtocolEncoder继承MessageToByteEncoder，作用是按照指定的顺序：消息头 + 长度字段 + 消息体的格式，将对象数据编码后写入。

```
package com.wgs.netty.demo3_decoder.lengthFieldDecoder;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToByteEncoder;

import java.nio.charset.Charset;

/**
 * Created by wanggenshen
 * Date: on 2019/7/22 00:35.
 * Description: 自定义的编码器
 */
public class MyProtocolEncoder extends MessageToByteEncoder<MyProtocolBean> {

    /**
     * 对数据按type、flag、length、body 顺序进行编码
     *
     * @param ctx
     * @param msg
     * @param out
     * @throws Exception
     */
    @Override
    protected void encode(ChannelHandlerContext ctx, MyProtocolBean msg, ByteBuf out) throws Exception {
        if(null == msg){
            throw new Exception("msg is null");
        }

        String body = msg.getMsgBody();
        byte[] bodyBytes = body.getBytes(Charset.forName("utf-8"));
        out.writeByte(msg.getType());
        out.writeByte(msg.getFlag());
        out.writeInt(bodyBytes.length);
        out.writeBytes(bodyBytes);

    }
}
```

(2)客户端  
客户端发送 一个消息头 由（0xA + 0xD），长度字段为length，消息体为"Hello, Netty, system is timeout"的消息。

```
package com.wgs.netty.demo3_decoder.lengthFieldDecoder;

import io.netty.bootstrap.Bootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;


/**
 * Created by wanggenshen
 * Date: on 2019/7/22 00:28.
 * Description: LengthFieldBasedFrameDecoder demo客户端
 */
public class DecoderClient {

    public static void connect(int port, String host) throws InterruptedException {
        EventLoopGroup workGroup = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(workGroup)
                    .channel(NioSocketChannel.class)
                    .option(ChannelOption.TCP_NODELAY, true)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel socketChannel) throws Exception {
                            socketChannel.pipeline()
                                    // 自定义数据编码器
                                    .addLast(new MyProtocolEncoder())
                                    .addLast(new SimpleChannelInboundHandler() {
                                        @Override
                                        protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {
                                        }

                                        /**
                                         * 客户端发送消息
                                         *
                                         * @param ctx
                                         * @throws Exception
                                         */
                                        @Override
                                        public void channelActive(ChannelHandlerContext ctx) throws Exception {
                                            String msgBody = "Hello, Netty, system is timeout";
                                            MyProtocolBean customMsg =
                                                    new MyProtocolBean((byte)0xA, (byte)0xD, msgBody.length(), msgBody);
                                            ctx.writeAndFlush(customMsg);

                                        }
                                    });
                        }
                    });

            ChannelFuture channelFuture = bootstrap.connect(host, port).sync();
            channelFuture.channel().closeFuture().sync();

        } finally {
            workGroup.shutdownGracefully();
        }

    }

    public static void main(String[] args) throws InterruptedException {
        DecoderClient.connect(8080, "127.0.0.1");
    }
}
```

**测试：**  
分别运行服务端和客户端后，可以看到运行结果：  
![](./images/b22e65405d9427d2.png)

若更改服务端的解码器构造参数，将 initialBytesToStrip 的值 由 0改为6，表示跳过消息头 + 长度字段，读取的时候可以直接读取消息体内容。  
相应的解码器做适当修改，去掉读取 消息头 + 长度字段的部分：

```
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.LengthFieldBasedFrameDecoder;

import java.nio.ByteOrder;

/**
 * Created by wanggenshen
 * Date: on 2019/7/21 22:22.
 * Description: LengthFieldBasedFrameDecoder 自定义解码
 */
public class MyProtocolDecoder extends LengthFieldBasedFrameDecoder {

    // 判断传送客户端传送过来的数据是否按照协议传输，头部信息的大小应该是 header + length( byte + byte + int = 1 + 1 + 4 = 6字节)
    private static final int HEADER_SIZE = 6;

    private byte type;
    private byte flag;
    private int length;
    private String body;

    /**
     *
     * @param maxFrameLength 最大帧长度
     * @param lengthFieldOffset 长度字段偏移量
     * @param lengthFieldLength 长度字段字节长度
     * @param lengthAdjustment 长度字段修正
     * @param initialBytesToStrip 解码时跳过的字节数
     * @param failFast 超过最大帧长度时是否报异常
     */
    public MyProtocolDecoder(int maxFrameLength, int lengthFieldOffset, int lengthFieldLength, int lengthAdjustment, int initialBytesToStrip, boolean failFast) {
        super(maxFrameLength, lengthFieldOffset, lengthFieldLength, lengthAdjustment, initialBytesToStrip, failFast);
    }

    /**
     * 对接收的数据按type、flag、length、body的顺序进行解码,按顺序读取
     *
     * @param ctx
     * @param in
     * @return
     * @throws Exception
     */
    @Override
    protected Object decode(ChannelHandlerContext ctx, ByteBuf in) throws Exception {
        in = (ByteBuf) super.decode(ctx, in);
        if (in == null) {
            return null;
        }

        if (in.readableBytes() < HEADER_SIZE) {
            throw new Exception("头部信息格式不正确");
        }

        //读取body: 消息体
        byte[] bytes = new byte[in.readableBytes()];
        in.readBytes(bytes);
        body = new String(bytes, "UTF-8");

        return new MyProtocolBean(type, flag, body.length(), body);

    }
}
```

运行结果与之前类似。

---

参考  
《Netty权威指南》  
https://blog.csdn.net/z69183787/article/details/52980699