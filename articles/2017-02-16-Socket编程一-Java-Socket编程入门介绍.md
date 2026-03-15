---
title: "【Socket编程一】Java Socket编程入门介绍"
date: 2017-02-16
category: 后端开发
tags: [socket, java, TCP]
---

## 【Socket编程一】Java Socket编程入门介绍

本文将对Socket做一个入门级的介绍，以及编写一个利用Socket实现客户端服务器通信的实例。

### 1 计算机之间通信条件

在介绍Socket之前先简单介绍下计算机之间通讯所需要的条件：IP地址，协议，端口号。

**IP地址**：为实现网络中不同计算机之间的通信，每台计算机都必须有一个唯一的标识---IP地址。

                  举个例子在电话通讯中，电话用户是靠电话号码来识别的。同样，在[网络](http://baike.baidu.com/view/3487.htm)中为了区别不同的计算机，也需要给计算机指定一个连网专用号码，这个号码就是“[IP地址](http://baike.baidu.com/view/3930.htm)”。

**协议**：TCP/IP协议。这个不懂的地方可以自行百度，本文在Socket编程时采用的是TCP/IP协议。

**端口**：区分一台主机的多个不同应用程序，端口号范围为0-65535，其中0-1023位为系统保留，因此在使用端口时要选择端口在1023以后的端口。

### 

### 2 Socket

Socket,又称为套接字，Socket是计算机网络通信的基本的技术之一。如今大多数基于网络的软件，如浏览器，即时通讯工具甚至是P2P下载都是基于Socket实现的。

Socket是网络上运行的程序之间双向通信链路的终结点，是TCP和UDP的基础。

下面两张图解释了客户端与服务端通信的过程：

![](https://img-blog.csdn.net/20170216141934395?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

![](https://img-blog.csdn.net/20170216141953179?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

如上图，服务器端和客户端之间通信的前提是双方都需要建立Socket才能进行通信。

而Socket通过IP地址+端口号建立，即Socket = IP地址 + 端口号。

需要注意的是服务并不是直接创建Socket。而是先创建ServerSocket对象，绑定监听端口，ServerSocket将在服务端监听某个端口，当发现客户端有Socket来试图连接它时，它会accept该Socket的连接请求，同时在服务端建立一个对应的Socket与之进行通信。这样就有两个Socket了，客户端和服务端各一个。

因此可以看出网络通信其实就是Socket间的通信，数据在两个Socket间通过IO传输 。

### 3 Socket编程

**客户端**

客户端一般是用户发送信息的，所以建立了一个socket后，即可将信息写入字节流。如下是一段客户端编程最简单的code:

```
Socket socket = new Socket("localhost", port);
OutputStream os = socket.getOutputStream();
String msg = "【客户端】你好，我是客户端";
os.write(msg.getBytes());
```

注：这里的socket,os流都需要在finally模块中关闭。

**服务器**

服务器一般是用来接收来自客户端的消息，因此需要建立一个ServerSocket用来监听客户端是否有Socket连接；如果有，就accept并建立一个Socket，这样双方即可通信。如下是一段客户端编程最简单的code:

```
ServerSocket serverSocket = new ServerSocket(port);
Socket socket = serverSocket.accept();
			
InputStream in = socket.getInputStream();
//每次读多少个字节
byte[] b = new byte[20];
int len = 0;
while((len = in.read(b)) != -1){
	String str = new String(b, 0 ,len);
	System.out.println("收到来自客户端的信息>>>>>>>" + str);
}
```

下面写一个简单的socket编程实例，即客户端发送信息，服务器获取来自客户端的信息并且将信息打印在控制台。

**客户端：**

① 创建Socket对象，指明需要连接的服务器的地址和端口号  
 ② 连接建立后，通过输出流想服务器端发送请求信息  
 ③ 通过输入流获取服务器响应的信息  
 ④ 关闭响应资源 

```
package com.nomico271.socket3;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;
import java.net.UnknownHostException;

/**
 * 客户端
 * @author wanggenshen_sx
 *
 */
public class ClientTest {
	
	private static final int port = 9090;

	public static void ClientService(){
		Socket socket = null;
		OutputStream os = null;
		String msg = null;
		try {
			socket = new Socket("localhost", port);
			os = socket.getOutputStream();
			System.out.println("客户端开启成功");
			msg = "【客户端】你好，我是客户端";
			os.write(msg.getBytes());
		} catch (UnknownHostException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}finally{
			if(os != null){
				try {
					os.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
			if(socket != null){
				try {
					socket.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
	}
	public static void main(String[] args) {
		System.out.println("客户端正在开启中。。。");
		ClientService();
	}
}
```

 **服务器：**

① 创建ServerSocket对象，绑定监听端口  
 ServerSocket将在服务端监听某个端口，当发现客户端有Socket来试图连接它时，  
 它会accept该Socket的连接请求，同时在服务端建立一个对应的Socket与之进行通信。  
 这样就有两个Socket了，客户端和服务端各一个。  
 ② 通过accept()方法监听客户端请求  
 ③ 连接建立后，通过输入流读取客户端发送的请求信息  
 ④ 通过输出流向客户端发送乡音信息  
 ⑤ 关闭相关资源

```
package com.nomico271.socket3;

import java.io.IOException;
import java.io.InputStream;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * 服务器
 * @author wanggenshen_sx
 *
 */
public class ServerTest {

	private static final int port = 9090;
	
	public static void ServerService(){
		ServerSocket serverSocket = null;
		Socket socket = null;
		InputStream in =null;
		try {
			serverSocket = new ServerSocket(port);
			System.out.println("服务器开启成功，开始监听》》》");
			socket = serverSocket.accept();
			in = socket.getInputStream();
			//每次读多少个字节
			byte[] b = new byte[20];
			int len = 0;
			while((len = in.read(b)) != -1){
				String str = new String(b, 0 ,len);
				System.out.println("收到来自客户端的信息>>>>>>>" + str);
			}
			
		} catch (IOException e) {
			e.printStackTrace();
		}finally{
			if(in != null){
				try {
					in.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
			if(socket != null){
				try {
					in.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
			if(serverSocket != null){
				try {
					in.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
	}
	
	
	public static void main(String[] args) {
		System.out.println("服务器正在开启中。。。");
		ServerService();
	}

}
```

  

测试：

1 先运行服务器，如图：

![](https://img-blog.csdn.net/20170216140409469?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

  

2 再运行客户端，发送信息，这样服务器就能接收到信息并打印在显示台：

![](https://img-blog.csdn.net/20170216140515122?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

**【思考】**

当创建Socket对象时，双方的Socket实例都有一个Inputstream 和 Outputstream，操作系统会为Inputstream 和 Outputstream分配一定大小的缓存区，数据的读取与写入将在这个缓存区中进行；

写入端数据写入到Outputstream的SendQ队列当中，当队列信息满了的时候，数据又会转移到另一端Inputstream 的RecvQ队列中，如果RecvQ也满，那么Outputstream  的 write方法将会阻塞，直到RecvQ中有足够空间容纳SendQ发送的数据。

由于会发送阻塞，因此双方发送数据的时候容易产生死锁。

如何避免呢？大家可以查看NIO来解决这个问题。