---
title: "【Mybatis学习总结八】Mybatis缓存"
date: 2016-09-28
category: 后端开发
tags: []
---

这节内容了解下即可。

如多数持久层框架一样，Mybatis同样提供了一级缓存和二级缓存。

（\*）一级缓存：

(1)一级缓存也就是Session级的缓存，默认是开启的，查询操作是使用缓存的；

(2)必须是同一个session,session.close()后就不能使用了；

(3)查询条件不一致时不会使用缓存；

(4)清理缓存完了后session.clearCache()，不会使用；

(5)实际上执行增删改CUD操作，会自动刷新缓存，也就是不会使用缓存；

(\*)二级缓存：

(1)要在.xml文件中加入<cache/>；

(2)实体类必须实现implements Serializable

### 1 准备数据表和数据

```
CREATE TABLE c_user(
id INT PRIMARY KEY AUTO_INCREMENT,
NAME VARCHAR(20),
age INT
);
INSERT INTO c_user(NAME, age) VALUES('Tom', 12);
INSERT INTO c_user(NAME, age) VALUES('Jack', 11);
```

  

### 2 创建表实体 CUser

```
public class User implements Serializable{
     private int id;
     private String name;
     private int age;
}
```

  

### 3 userMapper.xml

```
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE  mapper  PUBLIC  "-//mybatis.org//DTD  Mapper  3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.atguigu.mybatis.test8.userMapper">
<select id="getUser" parameterType="int" resultType="_CUser">
select * from c_user where id=#{id}
</select>
<update id="updateUser" parameterType="_CUser">
update c_user set
name=#{name}, age=#{age} where id=#{id}
</update>
</mapper>
```

  

### 4 注册 5 测试

```
package com.mybatis.test8;

import org.apache.ibatis.session.SqlSession;
import org.junit.Test;

import com.mybatis.entities.CUser;

public class Test8 {

	/**
	 * 测试一级缓存
	 */
	@Test
	public void test() {

		SqlSession session= MybatisUtils.getSqlSessionFactory().openSession();
		String statement = "com.mybatis.test8.cuserMapper4.getUser";
		
		CUser user  =session.selectOne(statement, 2);
		System.out.println("***"+user);
		
		//1 查询条件相同，参数相同，直接使用缓存
		user  =session.selectOne(statement, 1);
		System.out.println(user);

		//2 查询条件相同，参数不同，不会使用缓存
		user  =session.selectOne(statement, 2);
		System.out.println(user);
		
		//3执行session关闭
		//session.close();
		SqlSession session3= MybatisUtils.getSqlSessionFactory().openSession();
		user  =session3.selectOne(statement, 2);
		System.out.println("3:"+user);
		//4清理缓存后
		session3.clearCache();
		user  =session.selectOne(statement, 2);
		System.out.println("4:"+user);
		
		//5 session不同,不使用缓存
		SqlSession session5= MybatisUtils.getSqlSessionFactory().openSession();
		user  =session5.selectOne(statement, 1);
		System.out.println("6:"+user);
		
		session.close();
		
	
	}
	
	@Test
	public void update(){
		//执行更新
		SqlSession session6= MybatisUtils.getSqlSessionFactory().openSession();
		String statement = "com.mybatis.test8.cuserMapper4.updateUser";
		session6.update(statement, new CUser(2,"user",23));
		
		statement = "com.mybatis.test8.cuserMapper4.getUser";
		
		CUser user  =session6.selectOne(statement, 2);
		System.out.println("***"+user);
	}
}
```

  

```
package com.mybatis.test8;

import static org.junit.Assert.*;

import org.apache.ibatis.session.SqlSession;
import org.junit.Test;

import com.mybatis.entities.CUser;

public class Test8_2 {

	/**
	 * 测试二级缓存
	 */
	@Test
	public void test2() {
		SqlSession session= MybatisUtils.getSqlSessionFactory().openSession();
		SqlSession session2= MybatisUtils.getSqlSessionFactory().openSession();
		
		String statement = "com.mybatis.test8.cuserMapper4.getUser";
		CUser user  =session.selectOne(statement,1);
		session.commit();
		System.out.println("1:"+user);
		
		user  =session2.selectOne(statement, 1);
		session2.commit();
		System.out.println("2:"+user);
	}

}
```

  
  