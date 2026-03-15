---
title: "java.lang.NoSuchMethodException"
date: 2016-08-01
category: 后端开发
tags: []
---

在学习JavaWeb的过程中，编写一个小项目运行后出现java.lang.NoSuchMethodException错误，意思是在servlet中未找到对应的方法。

出现这种错误的时候应当首先定位到这个方法所在的位置，看看方法名与发送请求的方法名是否一致。

我犯的错误是在方法前所加的权限修饰符权限过大我所写的方法权限修饰符为protected(我所写的方法权限修饰符为protected)，所以无法访问这个方法。要么将权限修饰符改为public。或者在doPost方法中编写相应的代码来获取protected方法（反射知识）。

```
<span style="font-size:18px;">protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String methodName=request.getParameter("method");
		try {
			Method method = getClass().<span style="color:#ff0000;">getDeclaredMethod</span>(methodName, HttpServletRequest.class,HttpServletResponse.class);
			<span style="color:#ff0000;">method.setAccessible(true);</span>
			method.invoke(this, request,response);
		} catch (Exception e) {
			e.printStackTrace();
		}
		
	}</span>
```

  
  