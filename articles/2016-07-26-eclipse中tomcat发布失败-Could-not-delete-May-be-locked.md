---
title: "eclipse中tomcat发布失败（Could not delete May be locked by another process）原因及解决办法"
date: 2016-07-26
category: 后端开发
tags: []
---

在eclipse中tomcat发布项目时，偶尔出现了以下情况：

 ***publishing to tomcat v7.0 services at localhost has encountered a problem ...could not delete...May be locked by another process***

重启eclipse也没有用。百度后发现原因及解决办法：

原因：默认的设置是文件修改后立即发布，这样的设置是在你每个保存文件时都会触发，如果tomcat已经在运行，这样频繁的操作也会造成文件锁死（硬件速度慢的更容易发生）。

解决办法：右键点tomcat v7.0，再点clean就可以了。（此方法不一定一直有效）

![](https://img-blog.csdn.net/20160726110948441?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

![](https://img-blog.csdn.net/20160726111027668?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

![]()

![]()