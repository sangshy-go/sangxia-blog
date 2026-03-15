---
title: "Intellij IDEA中使用MyBatis-generator 自动生成MyBatis代码"
date: 2017-01-13
category: 后端开发
tags: []
---

### Intellij IDEA中使用MyBatis-generator 自动生成MyBatis代码

MyBatis Generator是一个非常方便的代码生成工具，可以根据数据库中表结构自动生成CRUD代码，可以满足大部分需求。

MyBatis Generator (MBG) 是一个Mybatis的代码生成器 ，可以根据数据库中表结构自动生成简单的CRUD（插入，查询，更新，删除）操作。 但联合查询和存储过程，需手动手写SQL和对象。

详见：【http://generator.sturgeon.mopaas.com/】。

本篇主要介绍Intellij IDEA中使用MyBatis-generator 自动生成MyBatis代码的一些步骤。

#### 1 pom.xml

因为IntelliJ中没有mybatis-generato对应的插件，所以需要在MAVEN中使用 mybatis-generator-maven-plugin插件来完成功能。

```
 <plugin>
        <groupId>org.mybatis.generator</groupId>
        <artifactId>mybatis-generator-maven-plugin</artifactId>
        <version>1.3.2</version>
        <dependencies>
          <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.34</version>
          </dependency>
        </dependencies>
        <configuration>
          <overwrite>true</overwrite>
        </configuration>
      </plugin>
```

#### 2  配置generatorConfig.xml

#### resources下建generatorConfig.xml,作为mybatis-generator-maven-plugin插件的执行目标。

```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE generatorConfiguration
        PUBLIC "-//mybatis.org//DTD MyBatis Generator Configuration 1.0//EN"
        "http://mybatis.org/dtd/mybatis-generator-config_1_0.dtd">

<generatorConfiguration>

    <context id="mysqlgenerator" targetRuntime="MyBatis3">

        <jdbcConnection driverClass="com.mysql.jdbc.Driver"
                        connectionURL="jdbc:mysql://localhost:3306/testmybatis?useUnicode=true&characterEncoding=UTF-8"
                        userId="root"
                        password="920614" />

        <javaModelGenerator targetPackage="com.nomico271.model" targetProject="src/main/java" />

        <sqlMapGenerator targetPackage="com.nomico271.mapper" targetProject="src/main/resources" />

        <javaClientGenerator type="XMLMAPPER" targetPackage="com.nomico271.mapper" targetProject="src/main/java" />

        <table tableName="blog"/>
        <table tableName="user"/>

    </context>

</generatorConfiguration>
```

上面为generatorConfig.xml简单配置，涉及到包位置的地方自行调整。其中jdbcConnection,javaModelGenerator,table三个节点必须有，否则会报错。

详细配置可看官网：【<http://www.mybatis.org/generator/configreference/xmlconfig.html> 】

配置过程中，我因为没有配置table,出现了下图中的错误：

![](https://img-blog.csdn.net/20170113172124613?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

解释一下错误中出现的  \*，？，+  等符号含义。

property\* :                    \*表示property这个节点可有（0-多个），即此节点可没有；

commentGenerator? :  ?表示此节点可有（0-1个），即此节点可没有；

jdbcConnection         :  无符号表示此节点必须有且只能有1个；

table+                        :  + 表示此节点必须有（1-多个），即必须有此节点；

#### 3 Intellij配置

MyBatis Generator生成代码的运行方式：命令行、使用Ant、使用Maven、[Java](http://lib.csdn.net/base/javase "Java SE知识库")编码。本文采用Maven插件mybatis-generator-maven-plugin来运行MyBatis Generator，用的是命令行的方式。

在Intellij中如下配置命令行运行：

![](https://img-blog.csdn.net/20170113173055305?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

启动后，不报错即可产生相应的Model类和Mapper文件：

![](https://img-blog.csdn.net/20170113173329505?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

如上图所示，完成。

-------------------------------------------------------

2017/06/07补充：

使用generator一些完善的地方，包括遇到错误：

```
Caused by: java.lang.ClassNotFoundException: com.mysql.jdbc.Driver
```

  
 下面是完善的xml

```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE generatorConfiguration
        PUBLIC "-//mybatis.org//DTD MyBatis Generator Configuration 1.0//EN"
        "http://mybatis.org/dtd/mybatis-generator-config_1_0.dtd">

<generatorConfiguration>

    <!--
        出现错误：Caused by: java.lang.ClassNotFoundException: com.mysql.jdbc.Driver
        解决办法：将本地的MAVEN仓库中的mysql驱动引入进来
    -->
    <classPathEntry location="C:\Users\Administrator\.m2\repository\mysql\mysql-connector-java\5.1.6\mysql-connector-java-5.1.6.jar"/>

    <context id="mysqlgenerator" targetRuntime="MyBatis3">
        <!--不生成注释-->
        <commentGenerator>
            <property name="suppressAllComments" value="true" />
        </commentGenerator>
        <!-- 配置数据库连接 -->
        <jdbcConnection driverClass="com.mysql.jdbc.Driver"
                        connectionURL="jdbc:mysql://localhost:3306/ssm_demo"
                        userId="root"
                        password="920614" />

        <!-- 指定javaBean生成的位置 -->
        <javaModelGenerator targetPackage="com.wgs.domain" targetProject="src/main/java" >
            <!-- 在targetPackage的基础上，根据数据库的schema再生成一层package，最终生成的类放在这个package下，默认为false -->
            <property name="enableSubPackages" value="true" />
            <!-- 设置是否在getter方法中，对String类型字段调用trim()方法 -->
            <property name="trimStrings" value="true" />
        </javaModelGenerator>

        <!--指定sql映射文件生成的位置 -->
        <sqlMapGenerator targetPackage="com.wgs.dao" targetProject="src/main/resources" >
            <property name="enableSubPackages" value="true" />
        </sqlMapGenerator>
        <!-- 指定dao接口生成的位置，mapper接口 -->
        <javaClientGenerator type="XMLMAPPER" targetPackage="com.wgs.dao" targetProject="src/main/java" >
            <property name="enableSubPackages" value="true" />
        </javaClientGenerator>

        <!-- table表生成对应的DoaminObject -->
        <table tableName="tbl_emp" domainObjectName="Employee"></table>
        <table tableName="tbl_dept" domainObjectName="Department"></table>

    </context>

</generatorConfiguration>
```

--------------------------------------------------

关于配置文件的详细介绍网址如下：

1 MAVEN中的配置：【
<http://www.mybatis.org/generator/running/runningWithMaven.html>
 】

【http://generator.sturgeon.mopaas.com/running/runningWithMaven.html】

2 generatorConfig.xml的配置:【
<http://www.mybatis.org/generator/configreference/xmlconfig.html>
 】

3 generatorConfig.xml的详细介绍：【http://www.jianshu.com/p/e09d2370b796】