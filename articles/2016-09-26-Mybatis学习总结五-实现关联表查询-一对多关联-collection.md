---
title: "【Mybatis学习总结五】实现关联表查询----一对多关联(collection)"
date: 2016-09-26
category: 后端开发
tags: []
---

## 实现关联表查询----一对多关联(collection)

一对多需求：即一张表class中又含有多张表(teacher,student)内容。现根据class\_id 来获取对应的班级信息(包括学生和老师信息)。

1 、创建表和数据：

```
CREATE TABLE student(
s_id INT PRIMARY KEY AUTO_INCREMENT,
s_name VARCHAR(20),
class_id INT
);
INSERT INTO student(s_name, class_id) VALUES('xs_A', 1);
INSERT INTO student(s_name, class_id) VALUES('xs_B', 1);
INSERT INTO student(s_name, class_id) VALUES('xs_C', 1);
INSERT INTO student(s_name, class_id) VALUES('xs_D', 2);
INSERT INTO student(s_name, class_id) VALUES('xs_E', 2);
INSERT INTO student(s_name, class_id) VALUES('xs_F', 2);
```

2、创建实体类：Student.java

```
package com.mybatis.entities;

public class Student {

	private int id;
	private String name;
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
	public Student(int id, String name) {
		super();
		this.id = id;
		this.name = name;
	}
	public Student() {
		super();
	}
	@Override
	public String toString() {
		return "Student [id=" + id + ", name=" + name + "]";
	}
	
}
```

Classes.java中添加属性：

```
private List<Student> students;
```

  

3、定义sql映射文件：classesMapper2.xml

方式一：嵌套结果  
使用嵌套结果映射来处理重复的联合结果的子集

```
SELECT * FROM class c, teacher t,student s 
WHERE c.teacher_id=t.t_id AND c.C_id=s.class_id AND c.c_id=1
```

![](https://img-blog.csdn.net/20160926163019242?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

方式二：嵌套查询  
通过执行另外一个SQL映射语句来返回预期的复杂类型

```
SELECT * FROM class WHERE c_id =1 //查询后获取到teacher_id,c_id值，传入下两条语句
SELECT * FROM teacher WHERE t_id =1   //t_id=1 是上条查询得到的teacher_id值
SELECT * FROM student WHERE class_id =1   //c_id = 1 是上条查询得到的c_id值
```

 即通过三条语句分别来查询。

```
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE  mapper  PUBLIC  "-//mybatis.org//DTD  Mapper  3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 
	4、关联表查询：一对多关联
	如何根据class_id查询班级信息（包括老师和学生信息）,学生信息为集合List
	Class封装了Teacher和学生属性，即一张class表中包含teacher表和student表
 -->
<!--定义操作 classes 表的sql 映射文件：classesMapper.xml   -->
<mapper namespace="com.mybatis.test5.classesMapper2">
	<!-- 
		方式一：嵌套结果
		使用嵌套结果映射来处理重复的联合结果的子集
		SELECT * FROM class c, teacher t,student s 
		WHERE c.teacher_id=t.t_id AND c.C_id=s.class_id AND c.c_id=1
	-->
	<select id="getClassInfo3" parameterType="int"
			resultMap="getClassMap">
			SELECT * FROM class c, teacher t,student s 
			WHERE c.teacher_id=t.t_id AND c.C_id=s.class_id AND  c.c_id=#{id}
	</select>
	<!-- 解决字段名和属性不一致冲突 -->
	<resultMap type="Classes" id="getClassMap">
		<id property="id" column="c_id"/>
		<result property="name" column="c_name"/>
		
			<!-- 关联的教师信息 -->
		<association property="teacher" column="teacher_id" 
					 javaType="Teacher">
			<id property="id" column="t_id"/>
			<result property="name" column="t_name"/>
		</association>
			<!-- 关联的学生信息，是集合 -->
		<collection property="students" 
					ofType="Student">
			<id property="id" column="s_id"/>
			<result property="name" column="s_name"/>	
		</collection>
	</resultMap>
	
	<!-- 
		方式二：嵌套查询
		通过执行另外一个SQL映射语句来返回预期的复杂类型
		SELECT * FROM class WHERE c_id =1 //查询后获取到teacher_id,c_id值，传入下两条语句
		SELECT * FROM teacher WHERE t_id =1   //t_id=1 是上条查询得到的teacher_id值
		SELECT * FROM student WHERE class_id =1   //c_id = 1 是上条查询得到的c_id值
	-->
	<select id="getClassInfo4" parameterType="int"  resultMap="getClassMap2">
			SELECT * FROM class WHERE c_id =#{id}	
	</select>
		
		<resultMap type="Classes" id="getClassMap2">
			<id property="id" column="c_id"/>
			<result property="name" column="c_name"/>
			<association property="teacher" column="teacher_id" javaType="Teacher"
						select="getTeacher"></association>
			<collection property="students" column="c_id" ofType="Student"
						select="getStudent"></collection>
		</resultMap>
	
	<select id="getTeacher"  resultType="Teacher">
			SELECT t_id id,t_name name FROM teacher WHERE t_id =#{id}
	</select>
	
	<select id="getStudent"  resultType="Student">
			SELECT s_id id,s_name name FROM student WHERE class_id =#{id}                                                                                   
	</select>
</mapper>
```

4 注册：conf.xml

```
<mappers>
      <mapper resource="com/mybatis/test5/classesMapper2.xml"/>
</mappers>
```

  

5   测试类Test5.java

```
package com.mybatis.test5;

import org.apache.ibatis.session.SqlSession;
import org.junit.Test;

import com.mybatis.entities.Classes;

public class Test5 {

	@Test
	public void test() {

		SqlSession session= MybatisUtils.getSqlSessionFactory().openSession();
		//方式一测试
		String statement = "com.mybatis.test5.classesMapper2.getClassInfo3";
		Classes clazz=session.selectOne(statement , 1);
		
		//方式二测试
		statement = "com.mybatis.test5.classesMapper2.getClassInfo4";
		clazz=session.selectOne(statement , 1);
		System.out.println("*"+clazz);
		session.close();
	}

}
```

  
  