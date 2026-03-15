---
title: "【Mybatis学习总结四】实现关联表查询----一对一关联(association)"
date: 2016-09-25
category: 后端开发
tags: []
---

## 一、一对一关联

建立的数据表class(班级)含有班级信息和teacher（教师）信息，而教师信息在零一张表Teacher中；即class表与Teacher相互关联的；现在需要根据class表的id查询class信息和Teacher信息，这就涉及到一对一关联查询。

有两种方式：

方式一：嵌套结果  
使用嵌套结果映射来处理重复的联合结果的子集来封装联表查询的数据（去除重复的数据）

```
select * from class c,teacher t where c.teacher_id = t.t_id and c.c_id = 1
```

 方式二：嵌套查询  
通过执行另外一个SQL映射语句来返回预期的复杂类型：  
SELECT \* FROM class WHERE c\_id =1;  
SELECT \* FROM teacher WHERE t\_id =1;//1 是上一个查询得到的teacher\_id的值

下面是具体步骤：

1  创建表(class、teacher)和数据

```
CREATE TABLE teacher(
t_id INT PRIMARY KEY AUTO_INCREMENT,
t_name VARCHAR(20)
);
CREATE TABLE class(
c_id INT PRIMARY KEY AUTO_INCREMENT,
c_name VARCHAR(20),
teacher_id INT
);
ALTER TABLE class ADD CONSTRAINT fk_teacher_id FOREIGN KEY (teacher_id) REFERENCES
teacher(t_id);
INSERT INTO teacher(t_name) VALUES('teacher1');
INSERT INTO teacher(t_name) VALUES('teacher2');
INSERT INTO class(c_name, teacher_id) VALUES('class_a', 1);
INSERT INTO class(c_name, teacher_id) VALUES('class_b', 2);
```

  

2 定义实体类：Classes.java、Teacher.java

```
package com.mybatis.entities;

public class Classes {

	private int id;
	private String name;
	private Teacher teacher;
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
	public Teacher getTeacher() {
		return teacher;
	}
	public void setTeacher(Teacher teacher) {
		this.teacher = teacher;
	}
	public Classes(int id, String name, Teacher teacher) {
		super();
		this.id = id;
		this.name = name;
		this.teacher = teacher;
	}
	public Classes() {
		super();
	}
	@Override
	public String toString() {
		return "Class [id=" + id + ", name=" + name + ", teacher=" + teacher
				+ "]";
	}
	
}
```

```
package com.mybatis.entities;

public class Teacher {

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
	public Teacher(int id, String name) {
		super();
		this.id = id;
		this.name = name;
	}
	public Teacher() {
		super();
	}
	@Override
	public String toString() {
		return "Teacher [id=" + id + ", name=" + name + "]";
	}
	
	
}
```

### 3 定义sql映射文件：classesMapper.xml

association:用于一对一的关联查询

property:对象属性的名称

javaType:对象属性的类型

column:所对应的外键字段名称

select:使用另一个查询封装的结果

```
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE  mapper  PUBLIC  "-//mybatis.org//DTD  Mapper  3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 
	4、关联表查询：一对一关联
	如何根据id查询班级信息（包括老师信息）
	Class封装了Teacher属性，即是相互关联的
 -->
<!--定义操作 users 表的sql 映射文件：orderMapper.xml   -->
<mapper namespace="com.mybatis.test4.classesMapper">
	<!--
		方式一：嵌套结果
		使用嵌套结果映射来处理重复的联合结果的子集来封装联表查询的数据（去除重复的数据）
	-->
			<select id="getClassInfo" parameterType="int" resultMap="ClassResultMap">
				select * from class c,teacher t where c.teacher_id = t.t_id and c.c_id = #{id}
			</select>
			<!-- 解决字段名属性名不一致问题 -->
			<resultMap type="Classes" id="ClassResultMap">
				<id property="id" column="c_id"/>
				<result property="name" column="c_name"/>
				<!-- 一对一关联查询 -->
				<association property="teacher" column="teacher_id" javaType="Teacher">
					<id property="id" column="t_id"/>
					<result property="name" column="t_name"/>
				</association>
			</resultMap>
	
	<!--
		方式二：嵌套查询
		通过执行另外一个SQL映射语句来返回预期的复杂类型：
		SELECT * FROM class WHERE c_id =1;
		SELECT * FROM teacher WHERE t_id =1;//1 是上一个查询得到的teacher_id的值
	-->
	<select id="getClassInfo2" parameterType="int" resultMap="ClassResultMap2" >
		select * from class where c_id = #{id}
	</select>
	
	<!-- 解决字段名属性名不一致问题 -->
	<resultMap type="Classes" id="ClassResultMap2">
		<id property="id" column="c_id"/>
		<result property="name" column="c_name"/>
		<association property="teacher" column="teacher_id" 
					javaType="Teacher" select="getTeacher">
		</association>
	</resultMap>
	
	<select id="getTeacher" parameterType="int" resultType="Teacher">
		select t_id id,t_name name from teacher where t_id=#{id}
	</select>
	
</mapper>
```

  
4 注册conf.xml： 

```
<mappers>
      <mapper resource="com/mybatis/test4/classesMapper.xml"/>
</mappers>
```

  

5.测试类：Test4.java

```
package com.mybatis.test4;

import org.apache.ibatis.session.SqlSession;
import org.junit.Test;

import com.mybatis.entities.Classes;

public class Test4 {

	@Test
	public void test() {

		SqlSession session= MybatisUtils.getSqlSessionFactory().openSession();
		//方式一测试
		String statement = "com.mybatis.test4.classesMapper.getClassInfo";
		Classes clazz=session.selectOne(statement , 2);
		
		//方式二测试
		statement = "com.mybatis.test4.classesMapper.getClassInfo2";
		clazz=session.selectOne(statement , 1);
		System.out.println(clazz);
	}

}
```

  
结果：Class [id=1, name=class\_a, teacher=Teacher [id=1, name=teacher1]]

结构图：

![](https://img-blog.csdn.net/20160925190206543?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

------------------------------------------------------------------补充于2017/06/08----------------------------------------------------------------------------------------------

## 1 Mybatis中javaType和jdbcType对应关系

```
JDBC Type           Java Type  
CHAR                String  
VARCHAR             String  
LONGVARCHAR         String  
NUMERIC             java.math.BigDecimal  
DECIMAL             java.math.BigDecimal  
BIT             boolean  
BOOLEAN             boolean  
TINYINT             byte  
SMALLINT            short  
INTEGER             int  
BIGINT              long  
REAL                float  
FLOAT               double  
DOUBLE              double  
BINARY              byte[]  
VARBINARY           byte[]  
LONGVARBINARY               byte[]  
DATE                java.sql.Date  
TIME                java.sql.Time  
TIMESTAMP           java.sql.Timestamp  
CLOB                Clob  
BLOB                Blob  
ARRAY               Array  
DISTINCT            mapping of underlying type  
STRUCT              Struct  
REF                         Ref  
DATALINK            java.net.URL[color=red][/color]
```

  
  

## 2 Mybatis中javaType和jdbcType对应和CRUD例子

```
<resultMap type="java.util.Map" id="resultjcm">  
  <result property="FLD_NUMBER" column="FLD_NUMBER"  javaType="double" jdbcType="NUMERIC"/>  
  <result property="FLD_VARCHAR" column="FLD_VARCHAR" javaType="string" jdbcType="VARCHAR"/>  
  <result property="FLD_DATE" column="FLD_DATE" javaType="java.sql.Date" jdbcType="DATE"/>  
  <result property="FLD_INTEGER" column="FLD_INTEGER"  javaType="int" jdbcType="INTEGER"/>  
  <result property="FLD_DOUBLE" column="FLD_DOUBLE"  javaType="double" jdbcType="DOUBLE"/>  
  <result property="FLD_LONG" column="FLD_LONG"  javaType="long" jdbcType="INTEGER"/>  
  <result property="FLD_CHAR" column="FLD_CHAR"  javaType="string" jdbcType="CHAR"/>  
  <result property="FLD_BLOB" column="FLD_BLOB"  javaType="[B" jdbcType="BLOB" />  
  <result property="FLD_CLOB" column="FLD_CLOB"  javaType="string" jdbcType="CLOB"/>  
  <result property="FLD_FLOAT" column="FLD_FLOAT"  javaType="float" jdbcType="FLOAT"/>  
  <result property="FLD_TIMESTAMP" column="FLD_TIMESTAMP"  javaType="java.sql.Timestamp" jdbcType="TIMESTAMP"/>  
 </resultMap>
```

  