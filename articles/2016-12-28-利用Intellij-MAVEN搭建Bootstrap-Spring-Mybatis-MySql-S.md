---
title: "利用Intellij+MAVEN搭建Bootstrap+Spring+Mybatis+MySql+SpringMVC项目详解"
date: 2016-12-28
category: 前端开发
tags: []
---

### 利用Intellij+MAVEN搭建Bootstrap+Spring+Mybatis+MySql+SpringMVC项目详解

在前篇文章中【http://blog.csdn.net/noaman\_wgs/article/details/53893948】，已经利用Intelli+MAVEN搭建成功了Spring+Mybatis+SpringMVC+Mysql的小项目，本篇文章继续完善，加入Bootstrap前端框架，使显示页面更加美观。

关于Bootstrap就不多做介绍了，我也是第一次使用，可以参看这个【http://v3.bootcss.com/css/#tables】。

#### 1 导入Bootstrap包

Bootstrap包不需要在MAVEN的pom.xml中导入，只需下载一个Bootstrap的jar包，然后直接放入项目中即可。在IntelliJ中，我是直接粘贴到webapp下（注意，不是WEN-INF下）。

![]()

![](https://img-blog.csdn.net/20161228125221282?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

#### 2  jsp页面内调用Bootstrap样式

在显示页面中，引入这个包，这里要注意获取Bootstrap路径的问题，即：

```
<link rel="stylesheet" href="bootstrap/css/bootstrap.min.css">
```

我这里比较简单，可参看这篇blog【http://blog.csdn.net/u010890358/article/details/53463543】。

然后就可以直接调用Bootstrap定义的样式了，如修饰table,就可直接使用,class后内容即为样式。

可参考【http://v3.bootcss.com/css/#tables】内容。

```
<table class="table table-striped">
```

code:

```
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%--
  Created by IntelliJ IDEA.
  User: wanggenshen_sx
  Date: 2016/12/26
  Time: 17:25
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page isELIgnored="false" %>
<html>
<head>
    <title>Show Page22</title>
    <link rel="stylesheet" href="bootstrap/css/bootstrap.min.css">
</head>
<body>23
            <h2>Employee List</h2>
                <table class="table table-striped" border="1" cellspacing="0" cellpadding="10">
                    <tr class="success">
                        <th>ID</th>
                        <th>LastName</th>
                        <th>Email</th>
                    </tr>

                    <c:forEach items="${requestScope.employees}" var="emp">
                        <tr class="danger">
                            <td>${emp.id}</td>
                            <td>${emp.lastName}</td>
                            <td>${emp.email}</td>
                        </tr>
                    </c:forEach>
                </table>

</body>
</html>
```

3 成功：

![]()

![](https://img-blog.csdn.net/20161228125237498?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

## 源码地址：【https://github.com/nomico271/SpringMVCBootstrap】