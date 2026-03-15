---
title: "【Mybatis学习总结三】Mybatis种解决字段名与实体类属性名不相同的冲突"
date: 2016-09-25
category: 后端开发
tags: []
---

### Mybatis种解决字段名与实体类属性名不相同的冲突

     在开发中，先创建一个数据表，数据表中包含字段名如(order\_id,order\_no)..而在创建实体类的时候，对象的属性名可能为(id,no)...

这样在Mybatis测试代码中要想根据某个id获取信息时：select \* from orders where order\_id=#{id}...会因为数据库中字段名和实体类属性名不相同而冲突，从而得不到想要的结果。下面看下如何解决这个冲突：

### 一、创建数据表和数据

```
CREATE TABLE orders(
order_id INT PRIMARY KEY AUTO_INCREMENT,
order_no VARCHAR(20),
order_price FLOAT
);
INSERT INTO orders(order_no, order_price) VALUES('aaaa', 23);
INSERT INTO orders(order_no, order_price) VALUES('bbbb', 33);
INSERT INTO orders(order_no, order_price) VALUES('cccc', 22);
```

  

### 二、定义实体类：Order.java

【注】此实体类要在conf.xml定义别名：

```
<typeAliases>
    <package name="com.mybatis.entities"/>
</typeAliases>
```

创建包com.mybatis.entities，创建实体类：Order.java  

```
package com.mybatis.entities;

public class Order {

	private int id;
	private String orderNo;
	private float price;
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public String getOrderNo() {
		return orderNo;
	}
	public void setOrderNo(String orderNo) {
		this.orderNo = orderNo;
	}
	public float getPrice() {
		return price;
	}
	public void setPrice(float price) {
		this.price = price;
	}
	public Order(int id, String orderNo, float price) {
		super();
		this.id = id;
		this.orderNo = orderNo;
		this.price = price;
	}
	public Order() {
		super();
	}
	@Override
	public String toString() {
		return "Order [id=" + id + ", orderNo=" + orderNo + ", price=" + price
				+ "]";
	}
	
	
}
```

### 三、定义映射文件，在映射文件中解决冲突：orderMapper.xml

```
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE  mapper  PUBLIC  "-//mybatis.org//DTD  Mapper  3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 
	解决字段名和实体类属性名不相同的冲突
 -->
<!--定义操作 users 表的sql 映射文件：orderMapper.xml   -->
<mapper namespace="com.mybatis.test3.orderMapper">
	<!-- 方式一：通过在sql语句中定义别名 -->
	<!-- <select id="selectOrder" parameterType="int" resultType="Order">
		select order_id id,order_no orderNo,order_price price from orders where order_id=#{id}
	</select> -->
	
	<!-- 方式二： 通过resultMap -->
	<select id="selectOrderResultMap" parameterType="int" resultMap="orderResultMap">
		select * from orders where order_id = #{id}
	</select>
	
	<resultMap type="Order" id="orderResultMap">
		<id property="id" column="order_id"/>
		<result property="orderNo" column="order_no"/>
		<result property="price" column="order_price"/>
	</resultMap>
	
	
	
	
	
	
</mapper>
```

有两种方式，第一种通过定义别名的方法；

第二种通过<resultMap>标签的方式：

resultMap:封装一些具有映射关系的对；

id:  专门针对主键

result:      针对一般属性

### 四、conf.xml中注册

```
<mappers>		
	<mapper resource="com/mybatis/test3/orderMapper.xml"/>
</mappers>
```

### 五、测试类：

```
package com.mybatis.test3;

import org.apache.ibatis.session.SqlSession;
import org.junit.Test;

import com.mybatis.entities.Order;
import com.mybatis.test2.MybatisUtils;

public class Test3 {

	@Test
	public void testGetOrder() {
		SqlSession session =MybatisUtils.getSqlSessionFactory().openSession();
		//String statement="com.mybatis.test3.orderMapper.selectOrder";
		String statement="com.mybatis.test3.orderMapper.selectOrderResultMap";
		Order order = session.selectOne(statement, 2);
		System.out.println(order);//Order [id=2, orderNo=bbbb, price=33.0]
	}

}
```

  

结构：

![](https://img-blog.csdn.net/20160925163113627?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)