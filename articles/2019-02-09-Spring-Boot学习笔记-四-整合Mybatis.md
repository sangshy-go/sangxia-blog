---
title: "Spring Boot学习笔记：（四）整合Mybatis"
date: 2019-02-09
category: 后端开发
tags: [springboot, mybatis]
---

Mybatis是国内使用较为广泛的ORM框架，本文将简要介绍Spring Boot中整合Mybatis的步骤。

#### 一、准备

##### 1.1 导入依赖

首先需要导入Mybatis和MySQL相关依赖:

```
<dependency>
	<groupId>org.mybatis.spring.boot</groupId>
	<artifactId>mybatis-spring-boot-starter</artifactId>
	<version>1.1.1</version>
</dependency>

<dependency>
	<groupId>mysql</groupId>
	<artifactId>mysql-connector-java</artifactId>
	<version>5.1.21</version>
</dependency>
```

（Spring Boot启动相关依赖此处省略）

注：

> MyBatis-Spring-Boot-Starter依赖将会提供如下

- 自动检测现有的DataSource
- 将创建并注册SqlSessionFactory的实例，该实例使用SqlSessionFactoryBean将该DataSource作为输入进行传递
- 将创建并注册从SqlSessionFactory中获取的SqlSessionTemplate的实例。  
   自动扫描您的mappers，将它们链接到SqlSessionTemplate并将其注册到Spring上下文，以便将它们注入到您的bean中。  
   就是说，使用了该Starter之后，只需要定义一个DataSource即可（application.properties中可配置），它会自动创建使用该DataSource的SqlSessionFactoryBean以及SqlSessionTemplate。会自动扫描你的Mappers，连接到SqlSessionTemplate，并注册到Spring上下文中。

##### 1.2、创建数据库

```
CREATE TABLE `tbl_user` (
  `id` int(8) NOT NULL AUTO_INCREMENT COMMENT '主键自增',
  `name` varchar(50) NOT NULL COMMENT '用户名',
  `age` int(50) NOT NULL COMMENT '年龄',
   `age` varchar(50) NOT NULL COMMENT '手机号',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户表';
```

#### 1.3、数据源配置

在resources/application.properties下进、数据源配置：

```
# mysql数据源配置
spring.datasource.url=jdbc:mysql://localhost:3306/springboot_database
spring.datasource.username=root
spring.datasource.password=920614
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
```

接下来看看如何进行代码实操。

#### 二、整合Mybatis

##### 2.1 实体类

首先创建一个与表`tbl_user`对应的实体类：

```
package com.wgs.springboot.mybatis.bean;

import lombok.Data;

/**
 * Created by wanggenshen
 * Date: on 2018/7/14 15:48.
 * Description: XXX
 */
Data
public class User {

    private int id;
    private String name;
    private int age;
    private String phone;

    public User(){}

    public User(String name, int age, String phone) {
        this.name = name;
        this.age = age;
        this.phone = phone;
    }
}
```

##### 2.2 持久层

同样，MyBatis提供了注解与XML两种方式。首先看下注解配置的方式：

**1、 注解方式**  
 主要提供了`@Insert`、`@Select`、 `@Update`、 `@Delete`四种注解来实现我们常用的CRUD操作。

```
package com.wgs.springboot.mybatis.dao;

import com.wgs.springboot.mybatis.bean.User;
import org.apache.ibatis.annotations.*;

/**
 * Created by wanggenshen
 * Date: on 2018/7/14 15:48.
 * Description: XXX
 */
Mapper
public interface UserMapper {

    String TABLE_NAME = "tbl_user";
    String INSERT_FIELDS = "name,age,phone";
    String ALL_FIELDS = "id" + INSERT_FIELDS;

    @Insert({"INSERT INTO", TABLE_NAME, "(", INSERT_FIELDS, ")", "VALUES(#{name}, #{age}, #{phone})"})
    int  insertUser(User user);

    @Select({"SELECT * FROM", TABLE_NAME, "WHERE name = #{name}" })
    User getUserByName(@Param("name") String name);

    @Update({"UPDATE", TABLE_NAME, "SET name = #{name} WHERE id = #{id}"})
    int updateUser(User user);

    @Delete("DELETE FROM tbl_user where name=#{name}")
    int deleteUserByName(String name);

}
```

测试：

```
package com.wgs.springboot;

import com.wgs.springboot.mybatis.bean.User;
import com.wgs.springboot.mybatis.dao.UserMapper;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import javax.annotation.Resource;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest
public class SpringbootMybatisDemoTest {


    @Autowired
    private UserMapper userMapper;

    @Test
    public void testInsert1() {
        User user = new User();
        user.setName("dd");
        user.setAge(22);
        user.setPhone("18912340987");
        int result = userMapper.insertUser(user);
        System.out.println(result);
    }


    @Test
    public void testGet1() {
        User user = userMapper.getUserByName("aa");
        System.out.println(user);
    }

    @Test
    public void testUpdate1() {
        User user = userMapper.getUserByName("bb");
        user.setName("bbUupdate");
        int res = userMapper.updateUser(user);
        System.out.println(res);
        user = userMapper.getUserByName("bbUupdate");
        System.out.println(user);
    }


    @Test
    public void testDelete1() {
        int res = userMapper.deleteUserByName("dd");
        System.out.println(res);
    }

}
```

**2、 XML配置**  
 我们在原有Mapper中增加一个使用XML配置的方法。  
 首先需要在application.properties添加mapper扫描的配置：

```
# xxxMapper.xml所在的位置 （注：要与dao所在的包对应）
mybatis.mapper-locations=classpath*:com/wgs/springboot/mybatis/dao/*Mapper.xml
mybatis.type-aliases-package=com.wgs.springboot.mybatis.bean

# 驼峰命名规范 如：数据库字段是  order_id 那么 实体字段就要写成 orderId(如果不配置此项，可以在xml中进行配置即可)
# mybatis.configuration.map-underscore-to-camel-case=true
```

由于\*Mapper.xml中的内容在打包的时候是不会复制到class输出目录对应Mapper类所在的包中，所以需要在pom.xml中添加Mybatis加载配置文件的配置：  
 （或者放在resources下即可）

```
	<build>
		<resources>
			<resource>
				<directory>src/main/resources</directory>
			</resource>
			<resource>
				<directory>src/main/java</directory>
				<includes>
					<include>**/*.xml</include>
				</includes>
				<filtering>true</filtering>
			</resource>
		</resources>
	</build>
```

之后在UserMapper.java中新增一个方法：

```
User getInvalidUser(@Param("name") String name, @Param("age") int age);
```

在UserMapper.xml中进行实现：

```
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
<mapper namespace="com.wgs.springboot.mybatis.dao.UserMapper">

    <select id="getInvalidUser"  parameterType="Map" resultType="com.wgs.springboot.mybatis.bean.User">
        SELECT FROM `tbl_user` where age = #{age} and name = #{name}
    </select>

</mapper>
```

测试同上。

---

注：  
 （1）如果启动过程中出现`org.apache.ibatis.binding.BindingException: Invalid bound statement (not found):`的错误，是由于Mapper类与xml文件定义对不上，需要检查包名、配置等；  
 （2）Mac下MySQL忘记root账户忘记密码的操作：

- （1）关闭mysql服务： 苹果->系统偏好设置->最下边点mysql 在弹出页面中 关闭mysql服务（点击stop mysql server）；
- （2）进入终端输入：cd /usr/local/mysql/bin/
- （3）回车后 登录管理员权限 sudo su
- （4）回车后输入以下命令来禁止mysql验证功能`./mysqld_safe --skip-grant-tables &`，  
   回车后mysql会自动重启（偏好设置中mysql的状态会变成running）；
- （5）输入命令`./mysql`;
- （6）回车后，输入命令`FLUSH PRIVILEGES`;
- （7）回车后，输入命令`SET PASSWORD FOR 'root'@'localhost' = PASSWORD('你的新密码')`;  
   如：

```
 SET PASSWORD FOR 'root'@'localhost' = PASSWORD('123456');
```

链接：  
 <https://blog.csdn.net/ydxzmhy/article/details/53454499>