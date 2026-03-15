---
title: "有关Spring+Java实现国际化的若干小问题"
date: 2017-01-04
category: 后端开发
tags: [国际化, Spring实现国际化]
---

### 有关国际化的若干小问题

在公司实习时师父布置一个小任务：实现页面的中英文切换。这个就涉及到了国际化的知识，由于项目使用的SpringMVC框架，所以可以使用SpringMVC中关于国际化的知识，具体实现参看我的上篇文章：【http://blog.csdn.net/noaman\_wgs/article/details/53982308】。

然而在实现功能后，会发现几个小问题：

### 1 切换后的状态不能保存

如当切换到英文状态时，关闭浏览器后，再打开页面，页面又变为中文状态了，即不能保留上次的状态。

涉及到状态保存时，我们首先想到session和cookie。

先让我们看看之前在SpringMVC是如何保存状态的：

```
    <!--配置SessionLocaleResolver-->  
    <bean id="localeResolver" class="org.springframework.web.servlet.i18n.SessionLocaleResolver">  
    </bean>
```

使用的是SessionLocaleResolver。这就解释了为什么页面关闭后状态不能保持的原因，所以我们要改为Cookie相关的：

【解决办法】

```
      <!--配置CookieLocaleResolver-->
	<bean id="localeResolver" class="org.springframework.web.servlet.i18n.CookieLocaleResolver">
		<property name="cookieMaxAge" value="100000"></property>
	</bean>
```

如上，同时配置一个最大时长cookieMaxAge，时间自定，可设置长一点。

### 2   页面乱码问题

国际化中文配置文件中输入中文字符，如下：

![](https://img-blog.csdn.net/20170104182753072?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

启动项目后页面上显示乱码。

【解决办法】

首先查看文件确保文件是UTF-8的格式，这个时候涉及到文件编码问题，所以要在原配置文件中找到该配置文件所在位置，设置其编码格式，操作如下;

![](https://img-blog.csdn.net/20170104183123077?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

这样启动后即不会出现乱码问题。

#### 3 在SpringMVC中获取页面的locale值

```
 Cookie[] cookie = request.getCookies();
        String locale = "";
        for(int i = 0; i < cookie.length; i++){
            if(cookie[i].getName().equalsIgnoreCase("org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE")){
                locale = cookie[i].getValue().toString();
            }
        }
```

  
或：

```
Locale locale = LocaleContextHolder.getLocale();
```

```
if("zh_CN".equals(locale.getLanguage())){
```

#### 4 在JSP页面中获取locale值

```
 <td>
                                    <c:if test="${pageContext.response.locale=='zh_CN'}">
                                        <c:out value="${item.name}" />
                                    </c:if>
                                    <c:if test="${pageContext.response.locale=='en_US'}">
                                        <c:out value="${item.ename}" />
                                    </c:if>
                                </td>
```

问题未完待补充。。。。