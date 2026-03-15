---
title: "SpringMVC的@RequestMapping出现404的问题"
date: 2016-10-23
category: 后端开发
tags: []
---

初学SpringMVC，在学习@RequestMapping时，放在类处注解后，运行程序发现出现了

## HTTP Status 404 - /springmvc\_1/springmvc/WEB-INF/views/success.jsp

问题。这有个很难注意到的细节问题：就是在配置的时候：少了一个"/"

![](https://img-blog.csdn.net/20161023202746317?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

---

  

## SpringMV问题C的@RequestMapping开发问题，404