---
title: "错误：javax.servlet.jsp.PageContext can not be to a type"
date: 2016-07-22
category: 后端开发
tags: []
---

在写Jsp文件时，引入script源文件（<script type="text/javascript" src="${pageContext.request.contextPath }/scripts/jquery-1.7.2.js"></script>）时出现了这样的错误：

javax.servlet.jsp.PageContext can not be to a type

原因是项目中没有添加jar包；

解决办法：在eclipse中，src-鼠标右键-Build Path-Configure Build Path;添加jsp-api.jar包即可。