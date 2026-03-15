---
title: "SpringMVC中出现”HTTP Status 405 - Request method 'PUT' not supported”"
date: 2016-10-28
category: 后端开发
tags: []
---

        今天在SpringMVC学习过程中，练习使用REST风格的进行简单的CRUD的DEMO的时候，在执行update操作后出现了HTTP Status 405 - Request
method 'PUT' not supported的错误。这类错括 method（PUT,DELETE,POST）not supported，原因很有可能就是后台中的uri(即handler类中)与前端 的uri不一致导致的。那么怎样找到这种错误并且修改呢？

       很简单，输入链接，打开chrome的开发者工具。当我点击edit并且进行修改操作后提交页面，这个时候报错。可以利用开发者工具查看此时的连接地址：

![](https://img-blog.csdn.net/20161028141823702?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

可以看到，**Request URL:**http://localhost:8080/springmvc\_2/addNewEmp。即提交后跳入到addNewEmp页面中。而在后端代码中；

```
<span style="font-size:18px;">@RequestMapping(value="/edit",method=RequestMethod.PUT)
	public String update(Employee employee){
		employeeDao.save(employee);
		return "redirect:/empInfo_show";
	}</span>
```

  
即提交后容器找到method为PUT，同时value="addNewEmp"的url，而我这里写的是"/edit”，路径不对当然就找不到页面了，所以报错了。所以改为：

@RequestMapping(value="/addNewEmp",method=RequestMethod.PUT)即可。

总而言之，解决这类的办法就是看@RequestMapping(value="/url1",method=RequestMethod.method\*)中的url与前端页面中地址是否一致的问题。根本原因还是对SpringMVC机制的原理理解不够透彻，多加练习吧。