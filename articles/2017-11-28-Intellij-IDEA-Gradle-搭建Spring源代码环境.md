---
title: "Intellij IDEA + Gradle 搭建Spring源代码环境"
date: 2017-11-28
category: 后端开发
tags: [intellij idea, Gradle, Spring源码]
---

### 目的

如何在Intellij IDEA中利用Gradle 搭建Spring源代码环境。

### 步骤

#### 1 下载Spring源码

首先需要在电脑上安装git客户端，然后任意一个地方新建文件夹，使用git下载Spring源码。

```
git clone git://github.com/SpringSource/Spring-framework.git
```

下载完成后，就可以看到有如下代码结构：   
 ![Alt text](https://img-blog.csdn.net/20171128214558132?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

#### 2 下载Gradle

到Gradle官网下载：<https://gradle.org/install/>   
 ![Alt text](https://img-blog.csdn.net/20171128215630794?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 下载完成后，解压（我的解压地址是H:\Soft\gradle-4.3.1），并配置好环境变量：   
 `GRADLE_HOME --> H:\Soft\gradle-4.3.1`   
 Path最后加上：`%GRADLE_HOME%\bin;`

完成后打开CMD窗口，输入：   
 `gradle -version`   
 如输出如下信息则表示安装成功。   
 ![这里写图片描述](https://img-blog.csdn.net/20171128215017711?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

#### 3 编译

打开cmd窗口，输入如下指令进行编译：

```
gradlew.bat cleanIdea :spring-oxm:compileTestJava
```

网速良好的前提下，等待10多分钟后，才会编译成功，界面如下：   
 ![Alt text](https://img-blog.csdn.net/20171128214933668?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

#### 4 将Spring项目源码导入IDEA

打开IDEA，File->New->Project From Existing Source…，选中Spring-framework文件夹，OK->Import project from external model，选中Gradle，点击Next，然后点击Finish，等待IDEA导入即可。

#### 5 IDEA阅读源码小tips

##### **查看类的继承关系**

在该类源码中右键-Diagrams-Show Diagrams…   
 ![Alt text](https://img-blog.csdn.net/20171128215102304?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

之后就会显示该类的继承关系：   
 ![Alt text](https://img-blog.csdn.net/20171128215131641?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

##### **查看类的结构**

IDEA中View-Tool buttons-点击，就可以看到Structure，然后弹出对应类中的方法和属性。   
 ![Alt text](https://img-blog.csdn.net/20171128215230668?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

也可以使用快捷键(alt + 7)，每个配置可能有所误差，默认是这个。   
 下面就是该类的结构图：   
 ![Alt text](https://img-blog.csdn.net/20171128215344031?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)