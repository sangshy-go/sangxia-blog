---
title: "【Mybatis学习总结六】动态SQL与模糊查询"
date: 2016-09-27
category: 后端开发
tags: []
---

## 六、动态SQL与模糊查询

学数据库的时候有学过模糊查询。如：根据姓名模糊匹配和指定年龄区间 来查询用户信息：

SQL语句可以这样来写：

```
SELECT * FROM d_user WHERE name like '%m%' AND age between 12 AND 18
```

现在在Mbatis中进行实现：

### 1 准备表和数据：

```
create table d_user(
id int primary key auto_increment,
name varchar(10),
age int(3)
);
insert into d_user(name,age) values('Tom',12);
insert into d_user(name,age) values('Bob',13);
```

  

### 2 查询条件实体类：ConditionUser.java

```
package com.mybatis.entities;

public class ConditionUser {

	private String name;
	private int minAge;
	private int maxAge;
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public int getMinAge() {
		return minAge;
	}
	public void setMinAge(int minAge) {
		this.minAge = minAge;
	}
	public int getMaxAge() {
		return maxAge;
	}
	public void setMaxAge(int maxAge) {
		this.maxAge = maxAge;
	}
	public ConditionUser(String name, int minAge, int maxAge) {
		super();
		this.name = name;
		this.minAge = minAge;
		this.maxAge = maxAge;
	}
	public ConditionUser() {
		super();
	}
	
	
}
```

### 3 表实体类：User.java

```
package com.mybatis.entities;

public class User {

	private int id;
	private String name;
	private int age;
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public int getAge() {
		return age;
	}
	public void setAge(int age) {
		this.age = age;
	}
	public User(int id, String name, int age) {
		super();
		this.id = id;
		this.name = name;
		this.age = age;
	}
	public User() {
		super();
	}
	@Override
	public String toString() {
		return "User [id=" + id + ", name=" + name + ", age=" + age + "]";
	}
	
}
```

  

### 4 userMapper2.xml映射文件：

```
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE  mapper  PUBLIC  "-//mybatis.org//DTD  Mapper  3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 
	5 模糊查询：根据条件查询用户（姓名模糊匹配，年龄在指定的最小值和最大值之间）
	SQL:select * from d_user where name like '%o%' and age>=13 and age<=18
 -->
<!--定义操作 classes 表的sql 映射文件：userMapper2.xml   -->
<mapper namespace="com.mybatis.test6.userMapper2">

	<select id="getUser" parameterType="User" 
			resultType="User">
			
		 select * from d_user where age between #{minAge} and  #{maxAge}
			
		<!--当输入的name!=null 时就执行下面的语句 -->
		<if test=' name != "%null%" '>
			and name like #{name}
		</if> 
		
	</select>	
	
</mapper>
```

  

### 5 测试：

```
package com.mybatis.test6;

import java.util.List;

import org.apache.ibatis.session.SqlSession;
import org.junit.Test;

import com.mybatis.entities.ConditionUser;
import com.mybatis.entities.User;

public class Test6 {

	@Test
	public void test() {

		SqlSession session= MybatisUtils.getSqlSessionFactory().openSession();
		
		
		String statement = "com.mybatis.test6.userMapper2.getUser";
		
		//模拟从网页输入的三个参数，将其封装到ConditionUser中
		String name = "o";
		int minAge = 13;
		int maxAge = 18;
		ConditionUser parameter=new ConditionUser("%"+name+"%", minAge, maxAge);
		
		List<User> users= session.selectList(statement, parameter);
		System.out.println(users);
		session.close();
	}

}
```

  
  