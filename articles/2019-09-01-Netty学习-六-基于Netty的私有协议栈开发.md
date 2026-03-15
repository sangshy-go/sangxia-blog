---
title: "Netty学习（六）- 基于Netty的私有协议栈开发"
date: 2019-09-01
category: 后端开发
tags: [Netty, Netty 私有协议]
---

#### 0、前言

大多公司都会有自己的一套私有协议，可能只在自己公司内部使用的协议。  
使用Netty实现的私有协议可以用于内部各模块之间的通信，基于TCP/IP协议栈，异步NIO框架，提供高性能、异步化的通信能力。

#### 一、Netty私有协议栈

##### 1、功能概述

使用Netty实现的私有协议栈主要功能有：

- 握手请求：双方发送握手请求和握手应答信息；
- 接入认证机制：设置提供IP地址的白名单接入认证机制，不在白名单内拒绝接入；
- 消息合法性校验：对接收到的消息进行合法性校验：是否充分登录、IP地址是否合法；
- 消息编解码：提供消息编解码框架，实现对象序列化和凡序列化；
- 可靠性设计：提供心跳机制、重连机制等；

##### 2、通信模型

（1）客户端发送握手请求消息，携带节点id信息；  
（2）服务端对接收到的握手请求消息进行验证，包括节点id有效性、重复性登录、IP地址合法性校验等，验证通过后返回登录成功握手应答消息；  
（3）链路建立后，客户端发送业务消息；  
（4）服务端发送心跳消息；  
（5）客户端发送心跳消息；  
（6）服务端发送业务消息；  
（7）服务端退出关闭连接，发送关闭连接消息给客户端，客户端关闭。  
![](./images/c6739e50ffd7f81f.png)  
注：  
Netty协议栈服务端和客户端通信链路建立后，  
（1）全双工通信：服务端和客户端之间的通信方式为全双工通信，客户端可以发送消息给服务端，服务端也可以主动发送消息给客户端；  
（2）心跳机制Ping-Pong：当链路处于空闲状态时，即客户端隔了一段时间未发送消息，则客户端每隔固定时间（一般为一分钟）发送Ping消息给服务端，服务端接收到Ping消息后立马返回Pong响应给客户端；  
（3）重连机制：如果客户端在N个周期内未收到Pong消息，则主动关闭。间隔周期T后发起重连操作，直至连上服务器。

##### 3、消息定义

Netty协议栈消息分为消息头和消息体两部分。  
（1）消息头字段定义-Header

- validateCode: int，长度32，Netty消息验证码，由固定值(0xABEF，表明是Netty协议消息，2字节)+主版本号(1255,1个字节)+次版本号(1255，1个字节)三部分组成；
- length：int，长度32，代表整个消息长度，包括消息头和消息体；
- sessionId：long，长度64，节点id，全局唯一；
- type: Byte,长度8，代表业务类型。0-业务请求消息；1-业务响应消息；2-业务ONE WAY消息，既是请求也是响应；3-握手请求；4-握手应答；5-心跳请求；6-心跳应答；
- priority：Byte, 长度8，消息优先级；0~255；
- attachmentInfo：Map<String,Object>，可选字段，可以用来在消息头中存放扩展信息。

（2）消息体：Object  
存放消息实际内容。

##### 4、消息编解码

**Netty协议栈编码**  
（1）Header编码：对于可选字段，使用ByteBuffer.putXXX方法进行编码，写入入ByteBuffer缓冲区；对于 attachment，首先获取key，对key进行编码；再对value序列化成二进制数组后放入入ByteBuffer缓冲区。  
（2）body编码：将body内容序列化成byte数组后，写入ByteBuffer缓冲区。  
（3）全部字段编码完成之后，需要更新消息头中的length字段对于的长度（只有所有字段都编码完成之后才知道整个消息长度），并重新写入ByteBuffer缓冲区。

**Netty协议栈解码**  
（1）Header解码：对于可选字段，使用ByteBuffer.getXXX方法获取所需字段；  
对于attachment字段，首先创建一个attachment对象，调用用ByteBuffer.getXXX获取扩展信息长度，如果为0无需解码；否则遍历循环进行解码。  
（2）body解码：通过第三方框架进行解码；

##### 5、消息链路建立

使用Netty协议栈的应用程序无需区分客户端或服务 端，任意一个节点，既可以是客户端，也可以是服务端提供服务。

链路建立由客户端主动发握手请求请求，需要通过一些认证机制，比如IP地址的验证、号段的黑白名单安全认证机制等。  
握手请求消息定义：

- 消息头type字段值为3，代表握手请求消息；
- 扩展信息attachment为空；
- 消息体body为空；
- 握手消息长度为22个字节；

服务端接收到客户端发送的握手请求消息后，进行接入验证，验证通过后发送握手应答消息。  
握手应答消息定义：

- 消息头type字段值为4，代表握手应答消息；
- 扩展信息attachment为空；
- 消息体body返回握手请求的结果，0-认证成功，1-认证失败。

##### 6、消息链路关闭

客户端和服务端采用长链接进行通信，通过心跳机制和业务消息维持链路的通信，正常情况下无需关闭。  
在以下情况下，客户端和服务端需要关闭链接：

- 服务发生宕机或者重启，主动关闭链路；
- 业务消息、心跳消息读写过程发生I/O异常，主动关闭链路；
- 心跳超时，主动关闭链路；
- 编码异常，主动关闭链路。

##### 7、可靠性设计

在实际场景下，由于网络超时、闪断、对方进程僵死、处理缓慢等原因，需要Netty协议栈提供可靠性设计来保证程序的正常运行。

**（1）心跳机制**  
正常情况下，客户端服务端通过发送业务消息保持链路建立，一旦服务端有异常也能立即发现问题；但是在网络空闲状态下（如凌晨或者业务低峰时期，可能几个小时内都没有业务请求），如果在这段时间内服务端宕机，在白天业务高峰期到来时，大量请求发送到服务端，服务端由于宕机无法处理消息，会发生大量的请求超时，严重会使客户端也进程资源耗尽。  
为了在空闲状态下检测链路的互通性，可以使用心跳机制来检测，一旦发现网络故障，立即关闭链路，周期T后再主动重连。

设计思路如下：

- 客户端在空闲状态下，持续几个周期T内未未发送业务消息或者接收到服务端消息，就发送一条Ping消息给服务端；
- 在下一个周期T到来时未收到服务端发送的Pong消息获取业务消息，心跳失败次数计数器+1；
- 如果任意时刻接收到了服务端发送的Pong消息或者业务消息，就将心跳失败计数器清0；当心跳失败计数器次数达到阈值后，主动关闭链路;
- 服务端在周期T内未接收到任何消息，心跳失败计数器次数+1；任意时刻接收到客户端消息，则将心跳失败计数器次数清零；
- 服务端心跳失败计数器次数达到阈值后，关闭链路，释放资源，等待客户端重连。

通过Ping-Pong双向心跳机制，可以保证无论通信哪一方出现网络故障，都能被及时发现。注意，必须在心跳失败计数器次数达到阈值才关闭链路，防止因为对方时间内繁忙没有及时返回应答造成的误判。

**（2）重连机制**  
如果链路中断，需要等待INTERVAL时间后，客户端再发起重连操作，如果重连失败，间隔周期INTERVAL后再发起重连，保证服务端有充足时间释放句柄资源。  
重连失败后，需要打印异常堆栈信息，方便后续问题定位。

**（3）重复登录保护**  
当客户端握手成功后，在链路处于正常状态下，不允许客户端重复登录，防止客户端异常状态下反复重连导致句柄资源被耗尽。

（1）服务端接收到客户端的握手请求消息后，首先检验IP地址合法性，然后在缓存的地址表中查看客户端是否已经登录，如果已经登录则拒绝重复登录，返回错误码-1，同时关闭TCP链路，并在服务端的日志中打印握手失败的原因。

（2）客户端接收到握手失败的应答消息之后，关闭客户端的TCP链接，等待INTERVAL时间之后再发起TCP连接，直到认证成功。

（3）当服务端由于N次心跳超时主动关闭链路后，清空客户端的地址缓存信息，保证后续客户端可以重连成功，防止被重复登录保护机制拒绝掉。

**（4）消息缓存重发**  
在客户端或者服务端发生链路中断后，在链路恢复之前，消息需要缓存在消息队列中，且不能丢失；等待链路恢复之后，重新发送这些消息，保证链路中断期间消息不丢失。

#### 二、Netty私有协议栈实战

与《Netty权威指南》书上有区别的地方：  
（1）需要引入>jboss-marshalling和jboss-marshalling-serial两个jar包；  
（2）MarshallingDecoder、MarshallingEncoder中的方法变成protected，所以需要我们用两个子类NettyMarshallingDecoder和NettyMarshallingEncoder去继承并实现decode和encode方法，该子类通过工厂类MarshallingCodeCFactory生成。  
（3）自定义解码器继承基于长度的消息帧解码器LengthFieldBasedFrameDecoder, 支持粘包、拆包处理。  
之前定义的消息结构由消息头（4字节validateCode + 4字节 length + …） + 消息体(body)组成，所以在解码时：  
lengthFieldLength(消息长度length字段)的值为4；  
lengthFieldOffset的值为4，表示需要跳过前4字节validateCode后读取的值即为length长度；

`ch.pipeline().addLast("decoder", new NettyMessageDecoder(1024 * 1024, 4, 4))`

实际运行时报错：

> An exceptionCaught() event was fired, and it reached at the tail of the pipeline. It usually means the last handler in the pipeline did not handle the exception.  
> io.netty.handler.codec.DecoderException: java.lang.IndexOutOfBoundsException: readerIndex(4) + length(8) exceeds writerIndex(8): PooledSlicedByteBuf(ridx: 4, widx: 8, cap: 8/8, unwrapped: PooledUnsafeDirectByteBuf(ridx: 8, widx: 22, cap: 1024))  
> at io.netty.handler.codec.ByteToMessageDecoder.callDecode(ByteToMessageDecoder.java:442)

从`.IndexOutOfBoundsException: readerIndex(4) + length(8) exceeds writerIndex(8):`这行报错信息可以看出读取时会将lengthFieldOffset和lengthFieldLength之后相加，  
![](./images/4250fc6a13317c85.png)

而lengthFieldEndOffset = 4 + 4 = 8，所以要将lengthAdjustment设置为 -lengthFieldEndOffset。  
`lengthFieldEndOffset = lengthFieldOffset + lengthFieldLength;`

所以解码器初始化参数需要设置为：

```
ch.pipeline().addLast("decoder", new NettyMessageDecoder(1024 * 1024, 4, 4, -8, 0))
```

**0、jar包**

```
    <dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-all</artifactId>
      <version>4.1.6.Final</version>
    </dependency>
    
    <dependency>
      <groupId>org.jboss.marshalling</groupId>
      <artifactId>jboss-marshalling</artifactId>
      <version>2.0.3.Final</version>
    </dependency>

      <dependency>
          <groupId>org.jboss.marshalling</groupId>
          <artifactId>jboss-marshalling-serial</artifactId>
          <version>2.0.3.Final</version>
      </dependency>
```

**1、数据结构定义：消息体**

```
package com.wgs.netty.demo6_netty4private.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 10:49.
 * Description: Netty协议栈消息数据结构定义
 */
Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public final class NettyMessage {

    /**
     * 消息头
     */
    private NettyMessageHeader header;

    /**
     * 消息体
     */
    private Object body;

}


package com.wgs.netty.demo6_netty4private.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 11:39.
 * Description: 消息头
 */
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public final class NettyMessageHeader {

    /**
     * 验证码, 由固定值0xABEF + 主版本号 + 次版本号组成
     */
    private Integer validateCode = 0xabef0101;

    /**
     * 节点id, 全局唯一
     */
    private Long sessionId;

    /**
     * 消息类型
     *
     * @see com.wgs.netty.demo6_netty4private.enums.NettyMessageTypeEnum
     */
    private Byte type;

    /**
     * 消息优先级
     */
    private Byte priority;

    /**
     * 消息长度, 包括消息头和消息体
     */
    private Integer length;

    /**
     * 扩展信息
     */
    private Map<String, Object> attachmentInfo = new HashMap<>();


}
```

**2、编解码**  
编码类

```
package com.wgs.netty.demo6_netty4private.coder;

import com.wgs.netty.demo6_netty4private.entity.NettyMessage;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToMessageEncoder;

import java.util.List;
import java.util.Map;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 13:56.
 * Description: Netty消息编码类
 */
public final class NettyMessageEncoder extends MessageToMessageEncoder<NettyMessage> {

    /**
     * jBoss提供的编码类
     */
    private NettyMarshallingEncoder nettyMarshallingEncoder;

    /**
     * 初始化marshallingEncoder
     */
    public NettyMessageEncoder() {
        this.nettyMarshallingEncoder = MarshallingCodeCFactory.buildMarshallingEncoder();
        System.out.println("NettyMessageEncoder init success");
    }

    @Override
    protected void encode(ChannelHandlerContext ctx, NettyMessage msg, List<Object> out) throws Exception {
        if (msg == null || msg.getHeader() == null) {
            throw new Exception("The encode message is nul");
        }

        // 分配缓冲区
        ByteBuf outBuf = Unpooled.buffer();
        // 读取消息头字段, 写入缓冲区
        outBuf.writeInt((int) getBufDefaultVal(msg.getHeader().getValidateCode(), 0));
        outBuf.writeInt((int) getBufDefaultVal(msg.getHeader().getLength(), 0));
        outBuf.writeLong(msg.getHeader().getSessionId() == null ? 0L : msg.getHeader().getSessionId());
        outBuf.writeByte((byte)getBufDefaultVal(msg.getHeader().getType(), -1));
        outBuf.writeByte(msg.getHeader().getPriority() == null ? (byte)-1 : msg.getHeader().getPriority());

        // 扩展信息, 依次写入大小和内容
        int size = msg.getHeader().getAttachmentInfo() == null ? 0 : msg.getHeader().getAttachmentInfo().size();
        outBuf.writeInt(size);

        String key;
        byte[] keyArray;
        Object value;
        if (size > 0) {
            for (Map.Entry<String, Object> entry : msg.getHeader().getAttachmentInfo().entrySet()) {
                // key serialize
                key = entry.getKey();
                keyArray = key.getBytes("UTF-8");

                outBuf.writeInt(keyArray.length);
                outBuf.writeBytes(keyArray);

                // value encode
                value = entry.getValue();
                nettyMarshallingEncoder.encode(ctx, value, outBuf);
            }
        }



        // body使用MarshallingEncoder进行编码
        if (msg.getBody() != null) {
            nettyMarshallingEncoder.encode(ctx, msg.getBody(), outBuf);
        } else {
            outBuf.writeInt(0);
        }

        outBuf.setInt(4, outBuf.readableBytes());
        out.add(outBuf);

    }

    private Object getBufDefaultVal(Object content, Object defaultVal) {
        if (content == null) {
            return defaultVal;
        }
        return content;
    }

}
```

解码类

```
package com.wgs.netty.demo6_netty4private.coder;

import com.wgs.netty.demo6_netty4private.entity.NettyMessage;
import com.wgs.netty.demo6_netty4private.entity.NettyMessageHeader;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.LengthFieldBasedFrameDecoder;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 14:35.
 * Description: Netty协议栈解码类
 *              基于长度的消息帧解码器LengthFieldBasedFrameDecoder, 支持粘包、拆包处理
 */
public final class NettyMessageDecoder extends LengthFieldBasedFrameDecoder {

    /**
     * 使用MarshallingDecoder
     */
    NettyMarshallingDecoder nettyMarshallingDecoder;

    public NettyMessageDecoder(int maxFrameLength, int lengthFieldOffset, int lengthFieldLength) {
        super(maxFrameLength, lengthFieldOffset, lengthFieldLength);
        nettyMarshallingDecoder = MarshallingCodeCFactory.buildMarshallingDecoder();
        System.out.println("NettyMessageDecoder init constructor success");
    }

    /**
     * 构造器, 初始化解码器: NettyMarshallingDecoder
     *
     * @param maxFrameLength     消息帧最大长度
     * @param lengthFieldOffset  消息偏移量
     * @param lengthFieldLength  消息帧实际长度
     */
    public NettyMessageDecoder(int maxFrameLength, int lengthFieldOffset, int lengthFieldLength, int lengthAdjustment, int initialBytesToStrip) {
        super(maxFrameLength, lengthFieldOffset, lengthFieldLength, lengthAdjustment, initialBytesToStrip);
        nettyMarshallingDecoder = MarshallingCodeCFactory.buildMarshallingDecoder();
        System.out.println("NettyMessageDecoder init constructor success");
    }


    @Override
    protected Object decode(ChannelHandlerContext ctx, ByteBuf in) throws Exception {
        ByteBuf frame = (ByteBuf) super.decode(ctx, in);
        if (frame == null) {
            return null;
        }

        NettyMessage message = new NettyMessage();

        // read header
        int validateCode = frame.readInt();
        int length = frame.readInt();
        long sessionId = frame.readLong();
        Byte type = frame.readByte();
        Byte priority = frame.readByte();

        NettyMessageHeader header = NettyMessageHeader.builder()
                .validateCode(validateCode)
                .sessionId(sessionId)
                .length(length)
                .type(type)
                .priority(priority)
                .build();

        int attachmentSize = frame.readInt();
        if (attachmentSize > 0) {
            Map<String, Object> attachmentInfo = new HashMap<>();
            int keySize = 0;
            byte[] keyArray = null;
            String key = null;

            for (int i = 0; i < attachmentSize; i++) {
                keySize = in.readInt();
                keyArray = new byte[keySize];
                in.readBytes(keyArray);
                key = new String(keyArray, "UTF-8");

                attachmentInfo.put(key, nettyMarshallingDecoder.decode(ctx, in));
                header.setAttachmentInfo(attachmentInfo);
            }
        }
        message.setHeader(header);

        // read body
        if (frame.readableBytes() > 4) {
            message.setBody(nettyMarshallingDecoder.decode(ctx, frame));
        }

        return message;
    }
}
```

使用jBoss Marshalling进行编解码

```
package com.wgs.netty.demo6_netty4private.coder;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.marshalling.MarshallingDecoder;
import io.netty.handler.codec.marshalling.UnmarshallerProvider;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 14:19.
 * Description: MarshallingDecoder中decode方法变成protected, 需要拓展才能使用
 */
public class NettyMarshallingDecoder extends MarshallingDecoder {


    public NettyMarshallingDecoder(UnmarshallerProvider provider) {
        super(provider);
    }

    public NettyMarshallingDecoder(UnmarshallerProvider provider, int maxObjectSize) {
        super(provider, maxObjectSize);
    }

    @Override
    protected Object decode(ChannelHandlerContext ctx, ByteBuf in) throws Exception {
        return super.decode(ctx, in);
    }
}
```

```
package com.wgs.netty.demo6_netty4private.coder;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.marshalling.MarshallerProvider;
import io.netty.handler.codec.marshalling.MarshallingEncoder;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 14:21.
 * Description: XXX
 */
public class NettyMarshallingEncoder extends MarshallingEncoder {

    /**
     * Creates a new encoder.
     *
     * @param provider the {@link MarshallerProvider} to use
     */
    public NettyMarshallingEncoder(MarshallerProvider provider) {
        super(provider);
    }

    @Override
    protected void encode(ChannelHandlerContext ctx, Object msg, ByteBuf out) throws Exception {
        super.encode(ctx, msg, out);
    }
}
```

工厂类

```
package com.wgs.netty.demo6_netty4private.coder;

import io.netty.handler.codec.marshalling.*;
import org.jboss.marshalling.MarshallerFactory;
import org.jboss.marshalling.Marshalling;
import org.jboss.marshalling.MarshallingConfiguration;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 13:54.
 * Description: Marshalling 编码和解码的工厂类
 */
public class MarshallingCodeCFactory {

    /**
     * 创建Jboss Marshalling解码器MarshallingDecoder
     */
    public static NettyMarshallingDecoder buildMarshallingDecoder() {
        // 首先通过Marshalling工具类的getProvidedMarshallerFactory静态方法获取MarshallerFactory实例
        // 参数“serial”表示创建的是Java序列化工厂对象，它由jboss-marshalling-serial-1.3.0.CR9.jar提供。
        final MarshallerFactory marshallerFactory = Marshalling.getProvidedMarshallerFactory("serial");

        // 创建了MarshallingConfiguration对象
        final MarshallingConfiguration configuration = new MarshallingConfiguration();
        // 将它的版本号设置为5
        configuration.setVersion(5);

        // 然后根据MarshallerFactory和MarshallingConfiguration创建UnmarshallerProvider实例
        UnmarshallerProvider provider = new DefaultUnmarshallerProvider(marshallerFactory, configuration);

        // 最后通过构造函数创建Netty的MarshallingDecoder对象
        // 它有两个参数，分别是UnmarshallerProvider和单个消息序列化后的最大长度。
        NettyMarshallingDecoder decoder = new NettyMarshallingDecoder(provider, 1024);
        return decoder;
    }

    /**
     * 创建Jboss Marshalling编码器MarshallingEncoder
     */
    public static NettyMarshallingEncoder buildMarshallingEncoder() {
        final MarshallerFactory marshallerFactory = Marshalling.getProvidedMarshallerFactory("serial");
        final MarshallingConfiguration configuration = new MarshallingConfiguration();
        configuration.setVersion(5);

        // 创建MarshallerProvider对象，它用于创建Netty提供的MarshallingEncoder实例
        MarshallerProvider provider = new DefaultMarshallerProvider(marshallerFactory, configuration);

        // MarshallingEncoder用于将实现序列化接口的POJO对象序列化为二进制数组。
        NettyMarshallingEncoder encoder = new NettyMarshallingEncoder(provider);
        return encoder;
    }
}
```

**3、握手请求和登录**  
握手请求

```
package com.wgs.netty.demo6_netty4private.handler.auth;

import com.wgs.netty.demo6_netty4private.constant.NettyConstant;
import com.wgs.netty.demo6_netty4private.entity.NettyMessage;
import com.wgs.netty.demo6_netty4private.entity.NettyMessageHeader;
import com.wgs.netty.demo6_netty4private.enums.NettyMessageTypeEnum;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 21:24.
 * Description: 握手认证客户端
 *
 * (1)channelActive: 首先TCP连接成功, 客户端构建握手请求消息, 发送至服务端
 * (2)channelRead0: 读取来自服务端的握手响应消息, 判断是否连接成功
 */
public class LoginAuthReqHandler extends SimpleChannelInboundHandler{


    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {
        NettyMessage nettyMessage = (NettyMessage) msg;

        // 如果是来自服务端握手应答消息, 判断是否认证成功
        if (nettyMessage.getHeader() != null
                && NettyMessageTypeEnum.HandShakeResp.getType().equals(nettyMessage.getHeader().getType())) {
            doLoginAuthReqMessage(nettyMessage, ctx);
        } else {
            // 传给后面的ChannelHandler处理
            ctx.fireChannelRead(msg);
        }
    }

    private void doLoginAuthReqMessage(NettyMessage nettyMessage, ChannelHandlerContext ctx) {
        int loginResult = (int) nettyMessage.getBody();
        // 认证成功
        if (loginResult == NettyConstant.LOGIN_SUCCESS) {
            System.out.println("Login is ok: " + nettyMessage);
            ctx.fireChannelRead(nettyMessage);
        } else {
            // 认证失败, 关闭连接
            System.out.println("Login is failed : " + nettyMessage);
            ctx.close();
        }
    }

    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        NettyMessage nettyMessage = buildNettyMessage();
        ctx.writeAndFlush(buildNettyMessage());
        System.out.println("客户端首次登陆连接, Client send heart beat message: " + nettyMessage);
    }

    /**
     * 构建握手请求消息
     *
     * @return
     */
    private NettyMessage buildNettyMessage() {
        NettyMessage nettyMessage = new NettyMessage();
        NettyMessageHeader header = NettyMessageHeader.builder()
                .type(NettyMessageTypeEnum.HandShakeReq.getType())
                .build();
        nettyMessage.setHeader(header);
        return nettyMessage;
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        super.exceptionCaught(ctx, cause);
    }
}
```

握手登录验证和响应

```
package com.wgs.netty.demo6_netty4private.handler.auth;

import com.wgs.netty.demo6_netty4private.constant.NettyConstant;
import com.wgs.netty.demo6_netty4private.entity.NettyMessage;
import com.wgs.netty.demo6_netty4private.entity.NettyMessageHeader;
import com.wgs.netty.demo6_netty4private.enums.NettyMessageTypeEnum;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;

import java.net.InetSocketAddress;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 21:41.
 * Description: 握手认证服务端, 包括握手接入和安全认证
 *
 * (1)握手接入: 判断是否在注册表中, 在则为-重复登录
 * (2)安全认证: 是否在白名单中, 不在则拒绝登录;
 * (3)发生异常, 需要清除缓存的客户端IP信息
 */
public class LoginAuthRespHandler extends SimpleChannelInboundHandler {

    /**
     * 客户端登录注册表
     */
    private Map<String, Boolean> nettyNodeCheckMap = new ConcurrentHashMap<>();

    /**
     * 客户端白名单, 不在白名单中的IP拒绝接入
     */
    private List<String> whiteList = Arrays.asList("127.0.0.1", "192.168.1.104");

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {

        NettyMessage nettyMessage = (NettyMessage) msg;

        // 如果是握手请求消息, 重复登录、安全认证
        if (nettyMessage.getHeader() != null
                && NettyMessageTypeEnum.HandShakeReq.getType().equals(nettyMessage.getHeader().getType())) {
            System.out.println("===收到客户端握手请求消息, 开始处理===");
            // 处理握手请求消息
            NettyMessage loginResp = doLoginAuthRespMessage(ctx);
            ctx.writeAndFlush(loginResp);
        } else {
            // 传给下个handler处理
            ctx.fireChannelRead(msg);
        }
    }

    private NettyMessage doLoginAuthRespMessage(ChannelHandlerContext ctx) {
        NettyMessage loginResp = null;
        // 节点
        String nodeIndex = ctx.channel().remoteAddress().toString();
        System.out.println("current nodeIndex is : " + nodeIndex);
        // 重复登录
        if (nettyNodeCheckMap.containsKey(nodeIndex) && nettyNodeCheckMap.get(nodeIndex)) {
            loginResp = buildResponse((byte) NettyConstant.LOGIN_AGAIN);
            System.out.println("客户端登录验证失败, 重新登录");
        } else {
            InetSocketAddress address = (InetSocketAddress) ctx.channel().remoteAddress();
            String ip = address.getAddress().getHostAddress();
            if (whiteList.contains(ip)) {
                loginResp = buildResponse(NettyConstant.LOGIN_SUCCESS);
                nettyNodeCheckMap.put(nodeIndex, true);
                System.out.println("客户端登录验证通过");
            }
        }

        return loginResp;
    }


    /**
     * 构建握手应答响应
     *
     * @return
     */
    private NettyMessage buildResponse(int result) {
        NettyMessage nettyMessage = new NettyMessage();
        NettyMessageHeader header = NettyMessageHeader.builder()
                .type(NettyMessageTypeEnum.HandShakeResp.getType())
                .build();
        nettyMessage.setHeader(header);
        nettyMessage.setBody(result);
        return nettyMessage;
    }


    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        // 发生异常, 将客户端信息从登录注册表去除
        nettyNodeCheckMap.remove(ctx.channel().remoteAddress().toString());
        ctx.close();
        super.exceptionCaught(ctx, cause);
    }
}
```

**4、心跳机制**  
心跳请求

```
package com.wgs.netty.demo6_netty4private.handler.heartbeat;

import com.wgs.netty.demo6_netty4private.entity.NettyMessage;
import com.wgs.netty.demo6_netty4private.entity.NettyMessageHeader;
import com.wgs.netty.demo6_netty4private.enums.NettyMessageTypeEnum;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.timeout.ReadTimeoutException;
import io.netty.util.concurrent.ScheduledFuture;
import org.apache.commons.lang3.time.DateFormatUtils;

import java.util.Date;
import java.util.concurrent.TimeUnit;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 22:49.
 * Description: 心跳客户端
 */
public class HeartBeatReqHandler extends SimpleChannelInboundHandler {


    private volatile ScheduledFuture<?> heartBeatScheduleFuture;

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {

        NettyMessage nettyMessage = (NettyMessage) msg;

        Byte type = nettyMessage.getHeader() != null ? nettyMessage.getHeader().getType() : null;
        // 心跳响应
        if (type != null && NettyMessageTypeEnum.HeartBeatResp.getType().equals(type)) {
            System.out.println(formatTime(new Date()) + "【Client receive Server】 heart beat message: ----> " + nettyMessage);
        } else if (type != null && NettyMessageTypeEnum.HandShakeResp.getType().equals(type)) {
            // 如果登录上后, 开启线程, 定时发送心跳
            heartBeatScheduleFuture = ctx.executor()
                    .scheduleAtFixedRate(new HeartBeatReqHandler.HeartBeatTask(ctx), 0, 10, TimeUnit.SECONDS);
        } else {
            ctx.fireChannelRead(msg);
        }
    }

    /**
     * 定时发送心跳消息
     */
    private class HeartBeatTask implements Runnable {

        private final ChannelHandlerContext ctx;

        public HeartBeatTask(ChannelHandlerContext ctx) {
            this.ctx = ctx;
        }

        @Override
        public void run() {
            NettyMessage heartBeatReq = buildHeartBeatReq();
            System.out.println(formatTime(new Date()) + "【Client -—-->  Server】send heart beat message: " + heartBeatReq);
            ctx.writeAndFlush(heartBeatReq);
        }
    }

    private String formatTime(Date date) {
        String formatTime = DateFormatUtils.format(date, "yyyy-MM-dd HH:mm:ss");
        return "【" + formatTime + "】";
    }

    private NettyMessage buildHeartBeatReq() {
        NettyMessage nettyMessage = new NettyMessage();
        NettyMessageHeader header = NettyMessageHeader.builder()
                .type(NettyMessageTypeEnum.HeartBeatReq.getType())
                .build();
        nettyMessage.setHeader(header);
        return nettyMessage;
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        if (cause instanceof ReadTimeoutException) {
            System.out.println("error cause" + cause);
            cause.printStackTrace();
        } else {
            super.exceptionCaught(ctx, cause);
        }
        // 取消任务并清空
        if (heartBeatScheduleFuture != null) {
            heartBeatScheduleFuture.cancel(true);
            heartBeatScheduleFuture = null;
        }
        ctx.fireExceptionCaught(cause);
    }
}
```

心跳响应

```
package com.wgs.netty.demo6_netty4private.handler.heartbeat;

import com.wgs.netty.demo6_netty4private.entity.NettyMessage;
import com.wgs.netty.demo6_netty4private.entity.NettyMessageHeader;
import com.wgs.netty.demo6_netty4private.enums.NettyMessageTypeEnum;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.timeout.ReadTimeoutException;
import org.apache.commons.lang3.time.DateFormatUtils;
import org.apache.commons.lang3.time.DateUtils;

import java.util.Date;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 22:50.
 * Description: 心跳机制服务端, 接收到客户端的心跳请求消息后, 不做处理直接返回响应
 */
public class HeartBeatRespHandler extends SimpleChannelInboundHandler {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {
        NettyMessage nettyMessage = (NettyMessage) msg;
        if (nettyMessage.getHeader() != null
                && NettyMessageTypeEnum.HeartBeatReq.getType().equals(nettyMessage.getHeader().getType())) {
            System.out.println(formatTime(new Date()) + "【Server receive Client】 heart beat request message : " + nettyMessage);
            NettyMessage heartBeatResp = buildHeartBeatResponse();
            ctx.writeAndFlush(heartBeatResp);
            System.out.println(formatTime(new Date()) + "【Server ----->  Client】Send heart beat response to client : " + heartBeatResp);
        } else {
            // 传递给下一个handler处理
            ctx.fireChannelRead(msg);
        }

    }

    private String formatTime(Date date) {
        String formatTime = DateFormatUtils.format(date, "yyyy-MM-dd HH:mm:ss");
        return "【" + formatTime + "】";
    }

    private NettyMessage buildHeartBeatResponse() {
        NettyMessage nettyMessage = new NettyMessage();
        NettyMessageHeader header = NettyMessageHeader.builder()
                .type(NettyMessageTypeEnum.HeartBeatResp.getType())
                .build();
        nettyMessage.setHeader(header);
        return nettyMessage;
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        if (cause instanceof ReadTimeoutException) {
            System.out.println("error cause " + cause);
            cause.printStackTrace();
        } else {
            super.exceptionCaught(ctx, cause);
        }

    }
}
```

**5、服务端和客户端**  
服务端

```
package com.wgs.netty.demo6_netty4private;

import com.wgs.netty.demo6_netty4private.coder.NettyMessageDecoder;
import com.wgs.netty.demo6_netty4private.coder.NettyMessageEncoder;
import com.wgs.netty.demo6_netty4private.constant.NettyConstant;
import com.wgs.netty.demo6_netty4private.handler.auth.LoginAuthRespHandler;
import com.wgs.netty.demo6_netty4private.handler.heartbeat.HeartBeatRespHandler;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;
import io.netty.handler.timeout.ReadTimeoutHandler;

/**
 * Created by wanggenshen
 * Date: on 2019/8/19 00:24.
 * Description: Netty协议栈服务端
 */
public class NettyServer {

    public static void bind() throws InterruptedException {
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workGroup = new NioEventLoopGroup();

        ServerBootstrap bootstrap = new ServerBootstrap();
        bootstrap.group(bossGroup, workGroup)
                .channel(NioServerSocketChannel.class)
                .option(ChannelOption.SO_BACKLOG, 100)
                .handler(new LoggingHandler(LogLevel.INFO))
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel channel) throws Exception {
                        channel.pipeline()
                                .addLast(new NettyMessageDecoder(1024 * 1024, 4, 4, -8, 0))
                                .addLast(new NettyMessageEncoder())
                                .addLast("readTimeoutHandler", new ReadTimeoutHandler(50))
                                .addLast("loginAuthRespHandler", new LoginAuthRespHandler())
                                .addLast("heartBeatRespHandler", new HeartBeatRespHandler());
                    }
                });

        bootstrap.bind(NettyConstant.REMOTE_IP, NettyConstant.PORT).sync();
        System.out.println("netty server start ok:" + (NettyConstant.REMOTE_IP + NettyConstant.PORT));
    }

    public static void main(String[] args) throws InterruptedException {
        NettyServer.bind();
    }
}
```

客户端

```
package com.wgs.netty.demo6_netty4private;

import com.wgs.netty.demo6_netty4private.coder.NettyMessageDecoder;
import com.wgs.netty.demo6_netty4private.coder.NettyMessageEncoder;
import com.wgs.netty.demo6_netty4private.constant.NettyConstant;
import com.wgs.netty.demo6_netty4private.handler.auth.LoginAuthReqHandler;
import com.wgs.netty.demo6_netty4private.handler.heartbeat.HeartBeatReqHandler;
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.timeout.ReadTimeoutHandler;
import org.omg.CORBA.TIMEOUT;

import java.net.InetSocketAddress;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Created by wanggenshen
 * Date: on 2019/8/19 00:34.
 * Description: Netty协议栈客户端
 */
public class NettyClient {

    // 创建线程池
    private static ScheduledExecutorService executorService = Executors.newScheduledThreadPool(1);

    public static void connect(int port, String host) throws InterruptedException {

        EventLoopGroup group = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(group)
                    .channel(NioSocketChannel.class)
                    .option(ChannelOption.TCP_NODELAY, true)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ch.pipeline()
                                    .addLast("decoder", new NettyMessageDecoder(1024 * 1024, 4, 4, -8, 0))
                                    .addLast("encoder", new NettyMessageEncoder())
                                    .addLast("readTimeoutHandler", new ReadTimeoutHandler(50))
                                    .addLast("loginAuthReqHandler", new LoginAuthReqHandler())
                                    .addLast("heartBeatReqHandler", new HeartBeatReqHandler());
                        }
                    });
            // L:/127.0.0.1:8080 - R:/127.0.0.1:12088
            ChannelFuture future = bootstrap.connect(new InetSocketAddress(host, port),
                    new InetSocketAddress(NettyConstant.LOCAL_IP, NettyConstant.LOCAL_PORT)).sync();
            future.channel().closeFuture().sync();

        } finally {

            executorService.execute(() -> {
                try {
                    TimeUnit.SECONDS.sleep(5);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                try {
                    System.out.println("finally|客户端重新发起连接, port: " + NettyConstant.PORT + ", ip: " + NettyConstant.REMOTE_IP);
                    connect(NettyConstant.PORT, NettyConstant.REMOTE_IP);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
    }

    public static void main(String[] args) throws InterruptedException {
        NettyClient.connect(NettyConstant.PORT, NettyConstant.REMOTE_IP);
    }
}
```

**6、常量类和枚举类**

```
package com.wgs.netty.demo6_netty4private.constant;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 22:34.
 * Description: 常量类
 */
public class NettyConstant {


    /**
     * 客户端登录成功
     */
    public static final int LOGIN_SUCCESS = 1001;

    /**
     * 重复登录
     */
    public static final int LOGIN_AGAIN = 4001;

    public static final String REMOTE_IP = "127.0.0.1";
    public static final String LOCAL_IP = "127.0.0.1";
    public static final int PORT = 8080;

    //public static final int LOCAL_PORT = 8889;
    public static final int LOCAL_PORT = 12088;
}
```

```
package com.wgs.netty.demo6_netty4private.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Created by wanggenshen
 * Date: on 2019/8/18 11:43.
 * Description: Netty协议栈消息类型
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public enum NettyMessageTypeEnum {

    BusinessReq((byte)0, "业务请求"),
    BusinessResp((byte)1, "业务响应"),
    BusinessOnwWay((byte)2, "业务ONE WAY"),
    HandShakeReq((byte)3, "握手请求"),
    HandShakeResp((byte)4, "握手响应"),
    HeartBeatReq((byte)5, "心跳请求"),
    HeartBeatResp((byte)6, "心跳响应")
    ;

    private Byte type;
    private String desc;


}
```

**7、测试**  
（1）正常情况 - 分别运行服务端和客户端，运行结果如下：  
![](./images/f312202af4814a3e.png)  
![](./images/6476d97bb9165a96.png)

（2）异常场景 - 服务端宕机  
服务端宕机后再重启，期间客户端需要做到：

- 客户端是否正常发起重连；
- 重连成功后不再重连；
- 重连期间心跳不再发生；
- 服务端重启后客户端能够正常接入并且发生连接和发生心跳；

关闭服务端后，可以看到客户端发起重连：  
![](./images/f100ba2c5a7ec5bc.png)

重启服务端后，可以看到客户端能够正常连到服务端：  
![](./images/5cc239c54a2ce798.png)  
（3））异常场景 - 客户端宕机  
客户端宕机重启后，服务端需要清除缓存信息并且运行客户端重新登录。  
![](./images/d6bbe015904553ba.png)