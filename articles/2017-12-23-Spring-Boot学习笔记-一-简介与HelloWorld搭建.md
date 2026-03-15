---
title: "Spring Boot学习笔记：（一）简介与HelloWorld搭建"
date: 2017-12-23
category: 后端开发
tags: [springboot]
---

#### 一、什么是Spring Boot

在使用Spring开发的时候，有很多缺点：

- 配置繁多
- 开发效率低下
- 部署流程复杂
- 第三方技术集成难度大

而Spring Boot使用“习惯优于配置”的理念，可以快速搭建项目，简化Spring配置。本质上来说，Spring Boot就是Spring，使用Spring Boot可以很快创建一个独立运行（运行jar，内嵌Servlet容器）、准生产级别的基于Spring框架的项目，而又不需要或者很少的Spring配置。

**Spring Boot优点：**

- 快速构建项目；
- 对主流框架的无配置集成；
- 项目可独立运行，无须外部依赖Servlet容器；
- 提供运行时的应用监控；
- 极大提高开发、部署效率；
- 与云计算天然集成。

#### 二、Spring Boot的HelloWorld搭建

##### 方式一：通过<http://start.spring.io/>

（1）浏览器中输入<http://start.spring.io/>，然后再填写项目信息，以及选择所需要的依赖（本Demo只选择了Web所需要的依赖）。如图：   
 ![Alt text](https://img-blog.csdn.net/20171223222117887?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

（2）点击Generate Project，即可下载代码。下载下来的代码是一个简单基于MAVEN的项目，可将代码导入到开发工具中。

![Alt text](https://img-blog.csdn.net/20171223222147964?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

可以看到Web所需要的依赖自动下载下来。

##### 方式二：通过Intellij IDEA新建Spring Initializr项目

可通过Intellij IDEA新建Spring Initializr项目。   
 （1）填写项目信息。

![Alt text](https://img-blog.csdn.net/20171223222217632?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

（2）选择MAVEN构建项目，打包使用Jar：

![Alt text](https://img-blog.csdn.net/20171223222247353?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

（3）选择使用的技术：

![Alt text](https://img-blog.csdn.net/20171223222331434?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

（4）项目结构及依赖树：

![Alt text](https://img-blog.csdn.net/20171223222430171?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

上图中：

- pom.xml：Maven构建说明文件；
- SpringbootdemoApplication.java：很关键的启动类，程序入口在此，这个类是自动生成的，以artifactId+Application规则命名；
- SpringbootdemoApplication.java：一个空的Junit测试类，它加载了一个使用Spring Boot字典配置功能的Spring应用程序上下文；
- application.properties：全局配置文件，可以对一些默认配置的配置值进行修改，如可以修改Tomcat的默认端口号。   
   （注：Java JDK最后是1.8版本的）

##### pom.xml

进入pom.xml看看Spring Boot的MAVEN配置有什么特殊的地方：   
 **（1）Spring Boot父级依赖**

```
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>1.5.9.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
```

这块配置就是Spring Boot父级依赖，有了这个，当前的项目就是Spring Boot项目了.spring-boot-starter-parent是一个特殊的starter，它用来提供相关的Maven默认依赖，使用它之后，常用的包依赖可以省去version标签。关于Spring Boot提供了哪些jar包的依赖，可查看C:\Users\用户.m2\repository\org\springframework\boot\spring-boot-dependencies\1.5.1.RELEASE\spring-boot-dependencies-1.5.1.RELEASE.pom：

![Alt text](https://img-blog.csdn.net/20171223222500688?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 提供的依赖远远不止图中显示的这些，有兴趣可以自己查看。

**（2）Starter POMs： spring-boot-starter-xx**   
 starter依赖中封装了想要实现功能的依赖，可以轻松将jars添加到classpath下，同时相关的技术配置将会消除，可以得到Spring Boot提供的自动配置的Bean。   
 如web:

```
<dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
```

Spring Boot官方提供的starter pom：

![这里写图片描述](https://img-blog.csdn.net/20171223223224813?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

![这里写图片描述](https://img-blog.csdn.net/20171223222642602?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 以及第三方所写的starter pom：   
 ![Alt text](https://img-blog.csdn.net/20171223222734539?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

**（3）Spring Boot编译插件**：可以将项目打包成一个可执行jar。

```
<build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
```

#### 三、运行Hello World

下面演示怎样运行基于Spring Boot的Hello World。   
 直接在启动类编写代码，返回任意一句话：

```
package com.wgs.springbootdemo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@SpringBootApplication
public class SpringbootdemoApplication {

    @RequestMapping(value = "/")
    public String index(){
        return "Hello Spring Boot!";
    }

    public static void main(String[] args) {
        SpringApplication.run(SpringbootdemoApplication.class, args);
    }
}
```

然后直接右键Run，启动项目   
 ![Alt text](https://img-blog.csdn.net/20171223222820252?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

打开网页输入<http://localhost:8080/>即可以看见输出的结果：

```
Hello Spring Boot!
```

代码解释：

- **@SpringBootApplication：** Spring Boot项目的核心注解，主要目的是开启自动注解；
- **main方法：**标准的Java应用的main方法，主要作用是作为项目启动的入口；
- **@RestController：**等价于@Controller+@ResponseBody的结合，使用这个注解的类里面的方法都以json格式输出。

##### ^-^修改Banner：

在每次启动项目的 时候，都会有一个默认的启动图案：   
 ![Alt text](https://img-blog.csdn.net/20171223222934113?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 可以定制一个属于自己的启动图案。   
 （1）在src/main/resources下新建一个banner.txt；   
 （2）在网站<http://patorjk.com/software/taag>中输入自己想要的字符：   
 ![Alt text](https://img-blog.csdn.net/20171223223004958?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 点select& copy，将生成的字符复制到banner.txt文件中；   
 （3）重新启动项目，即可看到属于自己的启动图案：   
 ![Alt text](https://img-blog.csdn.net/20171223223023748?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)