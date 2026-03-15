---
title: "【Socket编程二】利用Socket实现聊天通信的编程实例"
date: 2017-02-17
category: 后端开发
tags: [java, socket, 通信, 聊天]
---

### 利用Socket实现聊天通信的编程实例

在上文中，介绍了Socket相关的内容以及Socket编程的入门实例，本篇文章将写一个利用Socket实现客户端服务器聊天的小程序。

话不多说，眼见为实，先上图：

**服务器：**

![](https://img-blog.csdn.net/20170217160718235?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

**客户端：**

![](https://img-blog.csdn.net/20170217160904976?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

其中绿色字为对应客户端/服务器输入内容，黑色字是对方回应内容。

#### DataInputStream/DataOutputStream

在code实例中，用到了DataInputStream/DataOutputStream，而并没有直接使用InputStream 和 OutputStream 来读写数据，主要是DataOutputStream中有个很方便的方法：

readUTF()，可以直接读取String 类型的数据，而不用按字节读取，很方便。

以下是其和nputStream/OutputStream 的区别：

- DataInputStream类继承了InputStream，也就是说DataInputStream是InputStream的子类，但它们同是实现了DataInput接口；
- DataInputStream比普通的InputStream多一些方法，自行查看；
- 在从文件中读出数据时，不用费心地自行判断读入字符串时或读入int类型时何时该停止，使用对应的readUTF()或readInt()方法就可以正确地读入完整类型数据。同样地，DataInputStream、DataOutputStream并没有改变InputStream或OutputStream的行为，读入或写出时的动作还是InputStream、OutputStream负责。

下面是code:

**客户端：**

```
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.net.UnknownHostException;
import java.util.Scanner;

public class ChatClient {

	public void ClientService(){
		Socket socket = null;
		DataOutputStream out = null;
		DataInputStream in = null;
		try {
			socket = new Socket("localhost", 9090);
			System.out.println("客户端开启成功");
			//OutputStream流用来发送信息到服务器
			out = new DataOutputStream(socket.getOutputStream());
			//InputStream用来获取来自服务器反馈的消息
			in = new DataInputStream(socket.getInputStream());
			
			Scanner sc =  new Scanner(System.in);
			while(true){
				//控制面板中输入信息并发送给服务器
				String inputMsg = sc.nextLine();
			//	System.out.println("【客户端输入信息：】" + inputMsg);
				out.writeUTF(inputMsg);
				
				//读取服务器信息
				String recvMsgFromServer = in.readUTF(); 
				System.out.println("【From服务器】" + recvMsgFromServer);		
			}
		} catch (UnknownHostException e) {
			e.printStackTrace();
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
			if(out != null){
				try {
					out.close();
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
		System.out.println("客户端正在启动。。。");
		new ChatClient().ClientService();

	}

}
```

  
**服务器：**

```
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.UnknownHostException;
import java.util.Scanner;

public class ChatServer {
	
	public void ServerService(){
		ServerSocket ss = null;
		Socket socket = null;
		DataOutputStream out = null;
		DataInputStream in = null;
		try {
			ss = new ServerSocket(9090);
			System.out.println("服务器开启监听");
			socket = ss.accept();
			
			//InputStream用来接收客户端的消息
			in = new DataInputStream(socket.getInputStream());
			//OutputStream流用来发送反馈信息到客户端
			out = new DataOutputStream(socket.getOutputStream());			
			
			Scanner sc =  new Scanner(System.in);
			while(true){
				
				//读取来自客户端信息
				String recvMsgFromServer = in.readUTF();
				System.out.println("【From客户端】" + recvMsgFromServer);		
				
				//控制面板中输入信息并发送给客户端
				String inputMsg = sc.nextLine();
				//System.out.println("【服务器端输入信息：】" + inputMsg);
				out.writeUTF(inputMsg);
				
			}
		} catch (UnknownHostException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}finally{
			if(ss != null){
				try {
					ss.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
			if(in != null){
				try {
					in.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
			if(out != null){
				try {
					out.close();
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
		System.out.println("服务器正在启动。。。");
		new ChatServer().ServerService();
	}

}
```

参考资料：【http://blog.csdn.net/yy\_love\_my/article/details/26609613】

  
  