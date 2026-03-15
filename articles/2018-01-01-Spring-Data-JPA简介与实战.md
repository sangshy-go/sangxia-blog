---
title: "Spring Data JPA简介与实战"
date: 2018-01-01
category: 后端开发
tags: [spring-data-jpa, JPA, spring-data]
---

#### 一、 Spring Data简介

**1 Spring Data :**   
 Spring 的一个子项目。用于简化数据库访问，支持NoSQL 和 关系数据存储。其主要目标是使数据库的访问变得方便快捷。

**SpringData 项目所支持 NoSQL 存储：**

- MongoDB （文档数据库）
- Neo4j（图形数据库）
- Redis（键/值存储）
- Hbase（列族数据库）

**SpringData 项目所支持的关系数据存储技术：**

- JDBC
- JPA

**2 Spring Data JPA 概述**   
 **Spring Data JPA :**   
 可以极大的简化JPA的写法，可以在几乎不用写实现的情况下，实现对数据的访问和操作。除了CRUD外，还包括如分页、排序等一些常用的功能。   
 开发者唯一要做的，就只是声明持久层的接口，其他都交给 Spring Data JPA 来帮你完成！

如：当开发者需要在DAO层写一个根据用户id查找用户信息的方法的时候，以前都是要自己去实现这样一个方法`findUserById(Integer id)`；   
 有了Spring Data JPA 以后，你只需要在实现了Repository接口的类中定义这样一个方法`findUserById(Integer id)`，Spring Data JPA会自动为你去实现这个方法，大大减少DAO层代码量。

**3 Spring Data JPA 的核心接口**

- （1）Repository：最顶层的接口，是一个空的接口，目的是为了统一所有Repository的类型，且能让组件扫描的时候自动识别；
- （2）CrudRepository ：是Repository的子接口，提供CRUD的功能；
- （3）PagingAndSortingRepository：是CrudRepository的子接口，添加分页和排序的功能；
- （4）JpaRepository：是PagingAndSortingRepository的子接口，增加了一些实用的功能，比如：批量操作等；
- （5）JpaSpecificationExecutor：用来做负责查询的接口；
- （6）Specification：是Spring Data JPA提供的一个查询规范，要做复杂的查询，只需围绕这个规范来设置查询条件即可。

接下来会一一介绍这些接口的用法以及对应的实战code。

#### 二、 Spring Data+JPA+MAVEN项目搭建

在上一节（传送门：[JPA简介与实战](http://blog.csdn.net/noaman_wgs/article/details/78937452)）中已经大概介绍了JPA的用法，当然知道其基本用法后还需要将其整合至Spring项目中。下面看看Spring Data JPA + MAVEN项目的具体搭建。

**（1）导入Spring Data JPA依赖：**

```
<dependency>                    
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-jpa</artifactId>
    <version>1.7.1.RELEASE</version>
</dependency>
```

**（2）Spring整合JPA：**

```
<!-- 2. 配置 JPA 的 EntityManagerFactory -->
<bean id="entityManagerFactory"     class="org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean">
    <property name="dataSource" ref="dataSource"></property>
    <property name="jpaVendorAdapter">
        <bean class="org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter"></bean>
        </property>
        <property name="packagesToScan" value="com.wgs.springdata"></property>
        <property name="jpaProperties">
            <props>
                <!-- 二级缓存相关 -->
                <!--
                <prop key="hibernate.cache.region.factory_class">org.hibernate.cache.ehcache.EhCacheRegionFactory</prop>
                <prop key="net.sf.ehcache.configurationResourceName">ehcache-hibernate.xml</prop>
                -->
                <!-- 生成的数据表的列的映射策略 -->
                <prop key="hibernate.ejb.naming_strategy">org.hibernate.cfg.ImprovedNamingStrategy</prop>
                <!-- hibernate 基本属性 -->
                <prop key="hibernate.dialect">org.hibernate.dialect.MySQL5InnoDBDialect</prop>
                <prop key="hibernate.show_sql">true</prop>
                <prop key="hibernate.format_sql">true</prop>
                <prop key="hibernate.hbm2ddl.auto">update</prop>
            </props>
        </property>
    </bean>
```

**（3）Spring配置Spring Data**

```
 <jpa:repositories base-package="com.wgs.springdata"
                      entity-manager-factory-ref="entityManagerFactory"/>
```

详细Spring 配置如下（包括事务管理器，Spring Data的配置）：

```
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context" xmlns:tx="http://www.springframework.org/schema/tx"
       xmlns:jpa="http://www.springframework.org/schema/data/jpa"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx.xsd http://www.springframework.org/schema/data/jpa http://www.springframework.org/schema/data/jpa/spring-jpa.xsd">

    <!-- 配置自动扫描的包 -->
    <context:component-scan base-package="com.wgs.springdata"></context:component-scan>

    <!-- 1. 配置数据源 -->
    <bean id="dataSource"
          class="com.mchange.v2.c3p0.ComboPooledDataSource">
        <property name="user" value="root"></property>
        <property name="password" value="920614"></property>
        <property name="driverClass"  value="com.mysql.jdbc.Driver"></property>
        <property name="jdbcUrl" value="jdbc:mysql:///jpa"></property>
    </bean>

    <!-- 2. 配置 JPA 的 EntityManagerFactory -->
    <bean id="entityManagerFactory"
          class="org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean">
        <property name="dataSource" ref="dataSource"></property>
        <property name="jpaVendorAdapter">
            <bean class="org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter"></bean>
        </property>
        <property name="packagesToScan" value="com.wgs.springdata"></property>
        <property name="jpaProperties">
            <props>
                <!-- 二级缓存相关 -->
                <!--
                <prop key="hibernate.cache.region.factory_class">org.hibernate.cache.ehcache.EhCacheRegionFactory</prop>
                <prop key="net.sf.ehcache.configurationResourceName">ehcache-hibernate.xml</prop>
                -->
                <!-- 生成的数据表的列的映射策略 -->
                <prop key="hibernate.ejb.naming_strategy">org.hibernate.cfg.ImprovedNamingStrategy</prop>
                <!-- hibernate 基本属性 -->
                <prop key="hibernate.dialect">org.hibernate.dialect.MySQL5InnoDBDialect</prop>
                <prop key="hibernate.show_sql">true</prop>
                <prop key="hibernate.format_sql">true</prop>
                <prop key="hibernate.hbm2ddl.auto">update</prop>
            </props>
        </property>
    </bean>


    <!-- 3. 配置事务管理器 -->
    <bean id="transactionManager"
          class="org.springframework.orm.jpa.JpaTransactionManager">
        <property name="entityManagerFactory" ref="entityManagerFactory"></property>
    </bean>

    <!-- 4. 配置支持注解的事务 -->
    <tx:annotation-driven transaction-manager="transactionManager"/>

    <!-- 5. 配置 SpringData -->
    <!-- 加入  jpa 的命名空间 -->
    <!-- base-package: 扫描 Repository Bean 所在的 package -->
    <jpa:repositories base-package="com.wgs.springdata"
                      entity-manager-factory-ref="entityManagerFactory"></jpa:repositories>

</beans>
```

**（4）实体类Person.java映射数据库中的数据表：JPA\_PERSONS:**

```
package com.wgs.springdata.model;

import javax.persistence.*;

/**
 * @author GenshenWang.nomico
 * @date 2017/12/30.
 */
@Table(name="JPA_PERSONS")
@Entity
public class Person {

    private Integer id;
    @Column(name = "last_name")
    private String lastName;

    private String email;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Override
    public String toString() {
        return "Person[id=" + id +", lastName = " + lastName + ", email = " + email+ "]";
    }
}
```

**（5）声明持久层的接口，该接口继承 Repository：**   
 Repository 是一个标记型接口，它不包含任何方法。   
 在接口中声明需要的方法。Spring Data 将根据给定的策略自动为其生成实现代码。   
 如下面定义的`getByLastName(String lastName)`方法，Spring Data会为其自动提供底层实现。

```
package com.wgs.springdata.dao;

import com.wgs.springdata.model.Person;
import org.springframework.data.repository.Repository;
/**
 * @author GenshenWang.nomico
 * @date 2017/12/31.
 */
public interface PersonRepository extends Repository<Person, Integer>{
    Person getByLastName(String lastName);
    Person getById(int id);
}
```

**（6）测试：**

```
import com.wgs.springdata.dao.PersonRepository;
import com.wgs.springdata.model.Person;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import javax.sql.DataSource;
import java.sql.SQLException;

/**
 * @author GenshenWang.nomico
 * @date 2017/12/30.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration({"classpath:applicationContext.xml"})
public class TestSpringDataJPA {

    private ApplicationContext ctx = null;
    private PersonRepository personRepository = null;

    {
        ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
        personRepository = ctx.getBean(PersonRepository.class);
    }

    @Test
    public void testSpringDataHelloWorld(){
        Person person = personRepository.getByLastName("aa");
        System.out.println(person.getLastName());
    }

}
```

#### 三、Repository简介

**1 Repository接口**   
 Repository 接口是 Spring Data 的一个核心接口，它不提供任何方法，开发者需要在自己定义的接口中声明需要的方法 ，如：

```
public interface PersonRepository extends Repository<Person, Integer>{
    Person getByLastName(String lastName);
    Person getById(int id);
}
```

Spring Data可以让我们只定义接口，只要遵循 Spring Data的规范，就无需写实现类。

除了用上述方式，也可以用@RepositoryDefinition 注解，但是需要指定当前domainClass 和主键的idClass 属性，如：

```
@RepositoryDefinition(domainClass = Person.class, idClass = Integer.class)
public interface PersonRepository{
    Person getByLastName(String lastName);
    Person getById(int id);
}
```

**2 Repository 的子接口：**

- CrudRepository： 继承 Repository，实现了一组 CRUD 相关的方法 ；
- PagingAndSortingRepository： 继承 CrudRepository，实现了一组分页排序相关的方法 ；
- JpaRepository： 继承 PagingAndSortingRepository，实现一组 JPA 规范相关的方法 ；
- 自定义的 XxxxRepository ：需要继承 JpaRepository，这样的 XxxxRepository 接口就具备了通用的数据访问控制层的能力；
- JpaSpecificationExecutor： 不属于Repository体系，实现一组 JPA Criteria 查询相关的方法 。

**3 Spring Data方法定义规范（很重要，需要注意！！！）**   
 Spring Data 的方法定义规范：

**（1）命名查询**   
 **查询方法以 find | read | get 开头，**涉及条件查询时，条件的属性用条件关键字连接，要注意的是：条件属性以首字母大写。   
 如定义的实体类中：

```
 public class Person {

    private Integer id;
    private String firstName;
    private String lastName;
    private String email;
 }
```

如果要想使用And条件连接查询，需要这样写：   
 `findByLastNameAndFirstName(String lastName,String firstName);`。

常用的接口查询方法如下：   
 ![这里写图片描述](https://img-blog.csdn.net/20180101012517597?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)   
 ![这里写图片描述](https://img-blog.csdn.net/20180101012535517?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

**（2）@Query注解查询**   
 如果我们想要的条件超过上述限制的时候（比如我们需要按照firstName和lastName查询，同时又要按照id升序又要按照email模糊查询等条件的时候。。），就不能用上述方法去定义方法，此时需要`@Query`注解来帮助我们去实现：   
 如：

```
//查询 id 值最大的那个 Person
//使用 @Query 注解可以自定义 JPQL 语句以实现更灵活的查询
@Query("SELECT p FROM Person p WHERE p.id = (SELECT max(p2.id) FROM Person p2)")
Person getMaxIdPerson();
```

**（3）@Query + @Modifying 执行更新/删除操作**   
 @Query 与 @Modifying 这两个 annotation一起声明，可定义个性化更新操作，例如只涉及某些字段更新时最为常用。   
 注：

- 方法返回值是int，表示更新语句影响的行数；
- 调用的地方必须加事务，没有事务无法执行。

**注意！！！**   
 使用@Query + @Modifying 执行更新/删除操作时，必须在Service 层实现对多个 Repository 的调用，并在相应的方法上声明事务。   
 如：   
 PersonRepository.java添加更新操作:

```
@Modifying
@Query("UPDATE Person p SET p.email = :email WHERE id = :id")
int updatePersonEmail(@Param("id") Integer id, @Param("email") String email);
```

需要写一个在Service层写一个对应的Service方法：

```
package com.wgs.springdata.service;

import com.wgs.springdata.dao.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author GenshenWang.nomico
 * @date 2018/1/1.
 */
@Service
public class PersonService {

    @Autowired
    private PersonRepository personRepository;

    @Transactional
    public void updatePersonEmailById(Integer id, String email){
        personRepository.updatePersonEmail(id, email);
    }
}
```

测试：

```
//测试@Query + @Modifying 执行更新/删除操作
@Test
public void testModifying(){
    personService.updatePersonEmailById(4, "updata@qq.com");
}
```

#### 四 CrudRepository接口实现CRUD

CrudRepository 接口提供了最基本的对实体类的添删改查操作 ：

- T save(T entity);//保存单个实体
- Iterable save(Iterable

```
//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//

package org.springframework.data.repository;

import java.io.Serializable;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.Repository;

@NoRepositoryBean
public interface CrudRepository<T, ID extends Serializable> extends Repository<T, ID> {
    <S extends T> S save(S var1);

    <S extends T> Iterable<S> save(Iterable<S> var1);

    T findOne(ID var1);

    boolean exists(ID var1);

    Iterable<T> findAll();

    Iterable<T> findAll(Iterable<ID> var1);

    long count();

    void delete(ID var1);

    void delete(T var1);

    void delete(Iterable<? extends T> var1);

    void deleteAll();
}
```

具体操作如下：   
 （1）实现CrudRepository接口，不用实现方法。

```
package com.wgs.springdata.dao;

import com.wgs.springdata.model.Person;
import org.springframework.data.repository.CrudRepository;

/**
 * @author GenshenWang.nomico
 * @date 2018/1/1.
 */
public interface PersonRepository2 extends CrudRepository<Person,  Integer> {

}
```

（2）在Service层执行具体操作：

```
package com.wgs.springdata.service;

import com.wgs.springdata.dao.PersonRepository2;
import com.wgs.springdata.model.Person;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author GenshenWang.nomico
 * @date 2018/1/1.
 */
@Service
public class PersonService2 {

    @Autowired
    PersonRepository2 personRepository2;

    public void save(List<Person> personlist){
        personRepository2.save(personlist);
    }
}
```

（3）测试：

```
    //测试CrudRepository接口
    @Test
    public void testCrudRepository(){
        List<Person> personList = new ArrayList<Person>();
        for(int i = 'a'; i <= 'z'; i++){
            Person person = new Person();
            person.setEmail((char)i + "" + (char)i + "@qq.com");
            person.setLastName((char)i + "" + (char)i);
            personList.add(person);
        }
        personService2.save(personList);
    }
```

#### 五 PagingAndSortingRepository接口实现分页和排序功能

PagingAndSortingRepository接口提供了分页与排序功能 ，这两个功能在项目中用到还是比较多的：

- Iterable findAll(Sort sort); //排序
- Page findAll(Pageable pageable); //分页查询（含排序功能）

可以看下PagingAndSortingRepository接口的源码：

```
package org.springframework.data.repository;

import java.io.Serializable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public interface PagingAndSortingRepository<T, ID extends Serializable> extends CrudRepository<T, ID> {
    Iterable<T> findAll(Sort var1);

    Page<T> findAll(Pageable var1);
}
```

下面来看看具体实现：   
 （1）首先实现PagingAndSortingRepository接口：

```
package com.wgs.springdata.dao;

import com.wgs.springdata.model.Person;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;

/**
 * @author GenshenWang.nomico
 * @date 2018/1/1.
 */
public interface PersonRepository3 extends PagingAndSortingRepository<Person,  Integer> {

}
```

（2）测试分页：

```
//测试分页
@Test
public void testPagingAndSortingRespository_Paging(){
//获取第几页数据，从0开始
int pageNo = 1;
//每页记录数
int pageSize = 5;
//PageRequest是Pageable实现类
PageRequest pageRequest = new PageRequest(pageNo, pageSize);
//查询符合条件的信息
Page<Person> personPage = personRepository3.findAll(pageRequest);
System.out.println("总记录数: " + personPage.getTotalElements());
System.out.println("当前第几页: " + (personPage.getNumber() + 1));
System.out.println("总页数: " + personPage.getTotalPages());
System.out.println("当前页面的 List: " + personPage.getContent());
System.out.println("当前页面的记录数: " + personPage.getNumberOfElements());
}
```

（3）测试排序

```
    //测试排序
    @Test
    public void testPagingAndSortingRespository_Sorting(){
        //获取第几页数据，从0开始
        int pageNo = 1;
        //每页记录数
        int pageSize = 5;
        //排序相关的. Sort 封装了排序的信息
        //Order 是具体针对于某一个属性进行升序还是降序.
        Order order1 = new Order(Direction.DESC, "id");
       // Order order2 = new Order(Direction.ASC, "email");
        Sort sort = new Sort(order1);

        //带有排序的查询条件，按id降序
        PageRequest pageRequest = new PageRequest(pageNo, pageSize, sort);
        //查询符合条件的分页信息
        Page<Person> personPage = personRepository3.findAll(pageRequest);
        System.out.println("总记录数: " + personPage.getTotalElements());
        System.out.println("当前第几页: " + (personPage.getNumber() + 1));
        System.out.println("总页数: " + personPage.getTotalPages());

        //当前结果：当前页面的 List: [Person[id=25, lastName = uu, email = uu@qq.com], Person[id=24, lastName = tt, email = tt@qq.com], Person[id=23, lastName = ss, email = ss@qq.com],
        // Person[id=22, lastName = rr, email = rr@qq.com], Person[id=21, lastName = qq, email = qq@qq.com]]
        System.out.println("当前页面的 List: " + personPage.getContent());
        System.out.println("当前页面的记录数: " + personPage.getNumberOfElements());
    }
```

本文主要介绍了 Spring Data JPA 的使用，以及它与 Spring 框架的无缝集成。Spring Data JPA 其实并不依赖于 Spring 框架，有兴趣的读者可以进一步查看。

项目结构：   
 ![这里写图片描述](https://img-blog.csdn.net/20180101013142810?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

部分代码：   
 （1）poom.xml:

```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>SpringDataJpaDemo</groupId>
    <artifactId>springdatajpademo</artifactId>
    <version>1.0-SNAPSHOT</version>

    <dependencies>
        <!--mysql driver-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.6</version>
        </dependency>
        <!--spring-->
        <!-- spring-aop -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-aop</artifactId>
            <version>4.3.5.RELEASE</version>
        </dependency>
        <!--spring-tx -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-tx</artifactId>
            <version>4.3.5.RELEASE</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-beans</artifactId>
            <version>4.3.5.RELEASE</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
            <version>4.3.5.RELEASE</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>4.3.5.RELEASE</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId> spring-test</artifactId>
            <version>4.3.5.RELEASE</version>
            <scope>test</scope>
        </dependency>

        <!--c3p0-->
        <dependency>
            <groupId>com.mchange</groupId>
            <artifactId>c3p0</artifactId>
            <version>0.9.5.1</version>
        </dependency>

        <!--jdbc-->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-jdbc</artifactId>
            <version>3.0.5.RELEASE</version>
        </dependency>

        <!-- log4j -->
        <dependency>
            <groupId>log4j</groupId>
            <artifactId>log4j</artifactId>
            <version>1.2.17</version>
        </dependency>

        <!--Hibernate-->
        <dependency>
            <groupId>org.hibernate</groupId>
            <artifactId>hibernate-core</artifactId>
            <version>4.3.11.Final</version>
        </dependency>
        <dependency>
            <groupId>org.hibernate</groupId>
            <artifactId>hibernate-entitymanager</artifactId>
            <version>4.3.11.Final</version>
        </dependency>
        <dependency>
            <groupId>org.hibernate</groupId>
            <artifactId>hibernate-ehcache</artifactId>
            <version>4.3.11.Final</version>
        </dependency>

        <!--spring-data-jpa-->
        <dependency>
            <groupId>org.springframework.data</groupId>
            <artifactId>spring-data-jpa</artifactId>
            <version>1.7.1.RELEASE</version>
        </dependency>

        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
            <scope>test</scope>
        </dependency>

    </dependencies>



</project>
```

（2）PersonRepository.java:

```
package com.wgs.springdata.dao;


import com.wgs.springdata.model.Person;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * @author GenshenWang.nomico
 * @date 2017/12/31.
 */
public interface PersonRepository extends CrudRepository<Person, Integer> {
    Person getByLastName(String lastName);
    Person getById(int id);

    /* --------命名查询-----------  */
    //getByLastNameEndingWithAndIdLessThan < = >WHERE lastName LIKE %? AND id < ?
    List<Person> getByLastNameEndingWithAndIdLessThan(String lastName, Integer id);
    //getByLastNameStartingWithAndIdGreaterThan < = > WHERE lastName LIKE ?% AND id > ?
    List<Person> getByLastNameStartingWithAndIdGreaterThan(String lastName, Integer id);

     /* --------@Query注解查询-----------  */
     //使用 @Query 注解可以自定义 JPQL 语句以实现更灵活的查询
     //查询 id 值最大的那个 Person
     @Query("SELECT p FROM Person p WHERE p.id = (SELECT max(p2.id) FROM Person p2)")
     Person getMaxIdPerson();

     //为 @Query 注解传递参数的方式1: 命名参数的方式.
    @Query("SELECT p FROM Person p WHERE p.lastName = :lastName AND p.email = :email")
    Person testQueryAnnotationParams2(@Param("email") String email, @Param("lastName") String lastName);

    /* --------原生SQL查询：设置 nativeQuery=true 即可以使用原生的 SQL 查询-----------  */
    @Query(value="SELECT count(id) FROM jpa_persons", nativeQuery=true)
    long getTotalCount();

    /* --- @Query + @Modifying 执行更新/删除操作-----  */
    @Modifying
    @Query("UPDATE Person p SET p.email = :email WHERE id = :id")
    int updatePersonEmail(@Param("id") Integer id, @Param("email") String email);

    @Modifying
    @Query("DELETE FROM Person WHERE id = :id")
    void deletePerson(@Param("id") Integer id);
}
```

（3）TestSpringDataJPA.java:

```
import com.wgs.springdata.dao.PersonRepository;
import com.wgs.springdata.dao.PersonRepository3;
import com.wgs.springdata.model.Person;
import com.wgs.springdata.service.PersonService;
import com.wgs.springdata.service.PersonService2;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.domain.Sort.Order;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.ArrayList;
import java.util.List;

/**
 * @author GenshenWang.nomico
 * @date 2017/12/30.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration({"classpath:applicationContext.xml"})
public class TestSpringDataJPA {

    private ApplicationContext ctx = null;
    private PersonRepository personRepository = null;
    private PersonRepository3 personRepository3 = null;
    private PersonService personService = null;
    private PersonService2 personService2 = null;

    {
        ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
        personRepository = ctx.getBean(PersonRepository.class);
        personRepository3 = ctx.getBean(PersonRepository3.class);
        personService = ctx.getBean(PersonService.class);
        personService2 = ctx.getBean(PersonService2.class);
    }

    //测试SpringData与JPA整合
    @Test
    public void testSpringDataHelloWorld(){
        Person person = personRepository.getByLastName("aa");
        System.out.println(person.getLastName());
    }

    // 测试命名查询
    @Test
    public void testSpringDataQuery(){
        List<Person> personList = personRepository.getByLastNameEndingWithAndIdLessThan("a", 3);
        System.out.println(personList.size());

        personList = personRepository.getByLastNameStartingWithAndIdGreaterThan("a", 2);
        System.out.println(personList.size());
    }

    //测试注解查询
    @Test
    public void testSpringDataQueryAnnotation(){
        Person person = personRepository.getMaxIdPerson();
        System.out.println("Max id person: " + person.getLastName());

        person = personRepository.testQueryAnnotationParams2("ab@qq.com", "abab");
        System.out.println("Person: " + person.getLastName());
    }

    //测试原生SQL
    @Test
    public void testNativeSqlQuery(){
        long count = personRepository.getTotalCount();
        System.out.println("总人数是：" + count);
    }

    //测试@Query + @Modifying 执行更新/删除操作
    @Test
    public void testModifying(){
        personService.updatePersonEmailById(4, "updata@qq.com");
    }

    //测试CrudRepository接口
    @Test
    public void testCrudRepository(){
        List<Person> personList = new ArrayList<Person>();
        for(int i = 'a'; i <= 'z'; i++){
            Person person = new Person();
            person.setEmail((char)i + "" + (char)i + "@qq.com");
            person.setLastName((char)i + "" + (char)i);
            personList.add(person);
        }
        personService2.save(personList);
    }

    //测试分页
    @Test
    public void testPagingAndSortingRespository_Paging(){
        //获取第几页数据，从0开始
        int pageNo = 1;
        //每页记录数
        int pageSize = 5;
        ////Pageable 接口通常使用的其 PageRequest 实现类. 其中封装了需要分页的信息
        PageRequest pageRequest = new PageRequest(pageNo, pageSize);
        //查询符合条件的分页信息
        Page<Person> personPage = personRepository3.findAll(pageRequest);
        System.out.println("总记录数: " + personPage.getTotalElements());
        System.out.println("当前第几页: " + (personPage.getNumber() + 1));
        System.out.println("总页数: " + personPage.getTotalPages());

        //当前结果：当前页面的 List: [Person[id=10, lastName = ff, email = ff@qq.com], Person[id=11, lastName = gg, email = gg@qq.com],
        // Person[id=12, lastName = hh, email = hh@qq.com], Person[id=13, lastName = ii, email = ii@qq.com], Person[id=14, lastName = jj, email = jj@qq.com]]
        System.out.println("当前页面的 List: " + personPage.getContent());
        System.out.println("当前页面的记录数: " + personPage.getNumberOfElements());
    }

    //测试排序
    @Test
    public void testPagingAndSortingRespository_Sorting(){
        //获取第几页数据，从0开始
        int pageNo = 1;
        //每页记录数
        int pageSize = 5;
        //排序相关的. Sort 封装了排序的信息
        //Order 是具体针对于某一个属性进行升序还是降序.
        Order order1 = new Order(Direction.DESC, "id");
       // Order order2 = new Order(Direction.ASC, "email");
        Sort sort = new Sort(order1);

        //带有排序的查询条件，按id降序
        PageRequest pageRequest = new PageRequest(pageNo, pageSize, sort);
        //查询符合条件的分页信息
        Page<Person> personPage = personRepository3.findAll(pageRequest);
        System.out.println("总记录数: " + personPage.getTotalElements());
        System.out.println("当前第几页: " + (personPage.getNumber() + 1));
        System.out.println("总页数: " + personPage.getTotalPages());

        //当前结果：当前页面的 List: [Person[id=25, lastName = uu, email = uu@qq.com], Person[id=24, lastName = tt, email = tt@qq.com], Person[id=23, lastName = ss, email = ss@qq.com],
        // Person[id=22, lastName = rr, email = rr@qq.com], Person[id=21, lastName = qq, email = qq@qq.com]]
        System.out.println("当前页面的 List: " + personPage.getContent());
        System.out.println("当前页面的记录数: " + personPage.getNumberOfElements());
    }

}
```

（4）数据库表结构及数据：   
 ![Alt text](https://img-blog.csdn.net/20180101013215151?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

### 最后祝大家在2018年心想事成，工作顺利！

---

2018.1.1 in TC。