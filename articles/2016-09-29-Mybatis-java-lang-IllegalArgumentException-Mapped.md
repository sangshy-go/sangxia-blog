---
title: "【Mybatis】java.lang.IllegalArgumentException: Mapped Statements collection does not contain value for"
date: 2016-09-29
category: 后端开发
tags: []
---

【java.lang.IllegalArgumentException: Mapped Statements collection does not contain value for com.myba】错误一般是有以下四个原因造成：

1、mapper.xml中没有加入namespace   
2、mapper.xml中的方法和接口mapper的方法不对应   
3、mapper.xml没有加入到mybatis-config.xml中(即总的配置文件)，例外：配置了mapper文件的包路径的除外   
4、mapper.xml文件名和所写的mapper名称不相同。 

我所犯的错就是第2条：

如我写的接口中定义了几个方法：

```
public interface SUserMapper {

	void save(SUser user);
	void update(SUser user);
	void delete(int id);
	SUser findById(int id);
	List<SUser> findAll();
}
```

在定义的xxxMapper.xml映射文件中的方法要与接口中的方法相同：

```
<pre name="code" class="html"><?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE  mapper  PUBLIC  "-//mybatis.org//DTD  Mapper  3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 
	9  spring集成mybatis
	namespace:必须与SUserMapper.java接口的报名一致；
	id:       必须与接口中定义的方法一致；
 -->
<!--定义操作 SUser 表的sql 映射文件：suserMapper.xml   -->
<mapper namespace="com.mybatis.test9.SUserMapper">

	<select id="save" parameterType="SUser">
		INSERT INTO s_user(user_id,user_name,user_birthday,user_salary) 
		VALUES(#{name},#{birthday},#{salary})
	</select>
	
	<select id="update" parameterType="SUser">
		update s_user set user_name=#{name},user_birthday =#{birthday} ,user_salary = #{salary}
		where id=#{id}
	</select>
	
	<select id="delete" parameterType="int">
		DELETE FROM s_user WHERE id = #{id}
	</select>
	
	<select id="findById" parameterType="int" resultMap="SUser">
		SELECT user_id id,user_name name,user_birthday birthday,user_salary salary
		FROM s_user WHERE id = #{id}
	</select> 
	
	<select id="findAll" resultMap="SUser">
		SELECT * FROM s_user
	</select>
	
</mapper>
```

  
  
  
  