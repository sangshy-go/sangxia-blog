---
title: "JAVA 注解的学习和对Spring注解的理解"
date: 2017-03-14
category: 后端开发
tags: []
---

转载：【http://blog.csdn.net/fly\_sky520/article/details/21522903】

从前年开始使用[spring](http://lib.csdn.net/base/javaee "Java EE知识库")和[hibernate](http://lib.csdn.net/base/javaee "Java EE知识库")，mybatis等框架时，就转到注解来了。直到前些时，突然对注解开始好奇起来。为什么写注解就可以了？不需要大量配置文件呢？于是我查看了一些资料，对注解有了初步了解。

**引言：什么是注解？**

在IDE中，我们可以链接spring mvc中的@RequestMapping注解，发现以下源码

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. @Target(value = {ElementType.METHOD, ElementType.TYPE})
2. @Retention(value = RetentionPolicy.RUNTIME)
3. @Documented
4. @Mapping
5. public @interface RequestMapping {
7. public String[] value() default {};
9. public RequestMethod[] method() default {};
11. public String[] params() default {};
13. public String[] headers() default {};
15. public String[] consumes() default {};
17. public String[] produces() default {};
18. }

这其实就是注解的写法。从这里我们可以发现，注解的写法比较简单，只要在intface前面加上@，就可以定义一个注解。但有几个其他的注解我们还不是很明白，同样spring是怎么通过这个注解进行运转的呢？
  

**首先：注解的作用是什么？**

1》生成文档，比如我们用的ide里面会自动加上比如@param，@return，@author等注解。

2》编译时格式检查。这个最常见的是@override，@SuppressWarnings等等。

3》跟踪代码依赖性，实现替代配置文件功能。上面的源码例子其实就是这个作用。

**其次：元注解**

在包 [Java](http://lib.csdn.net/base/javase "Java SE知识库").lang.annotation 中包含所有定义【自定义注解】所需用到的原注解和接口。如接口 java.lang.annotation.Annotation 是所有注解继承的接口,并且是自动继承，不需要定义时指定，类似于所有类都自动继承Object。查看Documented.class，可以看到这是个借口。它有三个注解（@Documented，@Retention，@Target），除此外，还有@Inherited，构成4个元注解。

@Documented 将此注解包含在 javadoc 中 ，它代表着此注解会被javadoc工具提取成文档。

在doc文档中的内容会因为此注解的信息内容不同而不同。相当与@see,@param 等。

@Retention 表示在什么级别保存该注解信息。可选的参数值在枚举类型 RetentionPolicy 中，包括：   
           RetentionPolicy.SOURCE 注解将被编译器丢弃   
           RetentionPolicy.CLASS 注解在class文件中可用，但会被VM丢弃   
           RetentionPolicy.RUNTIME VM将在运行期也保留注释，因此可以通过反射机制读取注解的信息。

@Target 表示该注解用于什么地方，可能的值在枚举类 ElemenetType 中，包括：   
           ElemenetType.CONSTRUCTOR 构造器声明   
           ElemenetType.FIELD 域声明（包括 enum 实例）   
           ElemenetType.LOCAL\_VARIABLE 局部变量声明  
           ElemenetType.ANNOTATION\_TYPE 作用于注解量声明  
           ElemenetType.METHOD 方法声明  
           ElemenetType.PACKAGE 包声明   
           ElemenetType.PARAMETER 参数声明   
           ElemenetType.TYPE 类，接口（包括注解类型）或enum声明 

@Inherited 允许子类继承父类中的注解。

**然后：我们来自己编写注解**

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. /\*\*
2. \* 自定义注解
3. \* @author Fly
4. \*/
5. @Documented
6. @Target({ElementType.METHOD, ElementType.TYPE})
7. @Retention(RetentionPolicy.RUNTIME)
8. public @interface AnnotationTest {
10. public String name() default "";
12. public String sex() default "男";
13. }

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. /\*\*
2. \* 注解测试
3. \*
4. \* @author Fly
5. \*/
6. @AnnotationTest(sex = "男", name = "张飞")
7. public class MyAnnotationTest {

10. @AnnotationTest(sex = "男", name = "Fly")
11. public void setFly() {
12. }

15. @AnnotationTest(sex = "女", name = "李明")
16. public void setLiMing() {
17. }

20. public static void main(String[] args) {
21. //检查类MyAnnotationTest是否含有@AnnotationTest注解
22. if (MyAnnotationTest.class.isAnnotationPresent(AnnotationTest.class)) {
23. //若存在就获取注解
24. AnnotationTest annotation = (AnnotationTest) MyAnnotationTest.class.getAnnotation(AnnotationTest.class);
25. System.out.println(annotation);
26. //获取注解属性
27. System.out.println(annotation.sex());
28. System.out.println(annotation.name());
29. System.out.println("///////////////////////////////////////////");
30. Method[] \_methods = MyAnnotationTest.class.getDeclaredMethods();
31. for (Method method : \_methods) {
32. System.out.println(method);
33. if (method.isAnnotationPresent(AnnotationTest.class)) {
34. AnnotationTest test = method.getAnnotation(AnnotationTest.class);
35. System.out.println("AnnotationTest(method=" + method.getName() + ",name=" + test.name() + ",sex=" + test.sex() + ")");

38. }
39. }
40. }
41. }
42. }

测试结果如下：

@test.AnnotationTest(sex=男, name=张飞)  
 男  
 张飞  
 ///////////////////////////////////////////  
 public static void test.MyAnnotationTest.main(java.lang.String[])  
 public void test.MyAnnotationTest.setLiMing()  
 AnnotationTest(method=setLiMing,name=李明,sex=女)  
 public void test.MyAnnotationTest.setFly()  
 AnnotationTest(method=setFly,name=Fly,sex=男)

到这里，我们对注解的基本有点了解了，注解的运用其实与反射式分不开的。我们可以利用代码中的注解间接控制程序代码的运行，它们通过Java反射机制读取注解的信息，并根据这些信息更改目标程序的逻辑。但是我们怎么使用注解呢？怎么让注解发挥作用，例如spring等框架时如何应用注解的呢？

**然后：注解理解的深入**  
 我们结合spring的控制反转和依赖注入来继续说明这个问题。

看下面的代码，首先是一个IUser接口，包含一个login方法。然后又一个中文登录方法和英文登录方法都实现了Iuser接口。

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. public interface IUser {
3. public void login();
4. }

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. public class ChineseUserImpl implements IUser {
2. @Override
3. public void login() {
4. System.err.println("用户登录！");
5. }
6. }

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. public class EnglishUserImpl implements IUser {
2. @Override
3. public void login() {
4. System.err.println("User Login！");
5. }
6. }

然后有一个Test类，要注入IUser接口

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. @AnnotationTest
2. public class Test {
4. private IUser userdao;
6. public IUser getUserdao() {
7. return userdao;
8. }
10. @AnnotationTest(nation = "ChineseUserImpl")
11. public void setUserdao(IUser userdao) {
12. this.userdao = userdao;
13. }
15. public void loginTest() {
16. userdao.login();
17. }
18. }

我们实现的是setter注入方式。为了配合这个例子，我把@AnnotationTest也稍作修改。

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. @Documented
2. @Target({ElementType.METHOD, ElementType.TYPE, ElementType.FIELD})
3. @Retention(RetentionPolicy.RUNTIME)
4. public @interface AnnotationTest {
6. public String nation() default "";
7. }

然后再引入一个类Container，类似spring容器的作用

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. public class Container {
3. public static Test getBean() {
4. Test test = new Test();
5. if (Test.class.isAnnotationPresent(AnnotationTest.class)) {
6. Method[] methods = Test.class.getDeclaredMethods();
7. for (Method method : methods) {
8. System.out.println(method);
9. if (method.isAnnotationPresent(AnnotationTest.class)) {
10. AnnotationTest annotest = method.getAnnotation(AnnotationTest.class);
11. System.out.println("AnnotationTest(field=" + method.getName()
12. + ",nation=" + annotest.nation() + ")");
13. IUser userdao;
14. try {
15. userdao = (IUser) Class.forName("test." + annotest.nation()).newInstance();
16. test.setUserdao(userdao);
17. } catch (Exception ex) {
18. Logger.getLogger(Container.class.getName()).log(Level.SEVERE, null, ex);
19. }
20. }
21. }
22. } else {
23. System.out.println("没有注解标记！");
24. }
25. return test;
26. }
27. }

在容器里面我使用反射获取注解属性nation所标注的内容，然后对Test类中的接口进行具体实现。这里的Container就是所谓的外部容器，可以对我们的注解或者是xml配置文件进行解析，以降低耦合性。

最后我们再进行[测试](http://lib.csdn.net/base/softwaretest "软件测试知识库")，代码如下

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. /\*\*
2. \* 注解测试
3. \*
4. \* @author Fly
5. \*/
6. public class MyAnnotationTest {
8. public static void main(String[] args) {
9. Test test = Container.getBean();
10. test.loginTest();
11. }
12. }

测试结果如下：

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. public void test.Test.loginTest()
2. public void test.Test.setUserdao(test.IUser)
3. AnnotationTest(field=setUserdao,nation=ChineseUserDaoImpl)
4. public test.IUser test.Test.getUserdao()
5. 用户登录！

如果我把Test类中的

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. @AnnotationTest(nation = "ChineseUserImpl")

修改成

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. @AnnotationTest(nation = "EnglishUserImpl")

结构就变成

**[java]** 
[view plain](http://blog.csdn.net/fly_sky520/article/details/21522903# "view plain")
 [copy](http://blog.csdn.net/fly_sky520/article/details/21522903# "copy")[![在CODE上查看代码片](https://code.csdn.net/assets/CODE_ico.png)](https://code.csdn.net/snippets/244740 "在CODE上查看代码片")
[![派生到我的代码片](https://code.csdn.net/assets/ico_fork.svg)](https://code.csdn.net/snippets/244740/fork "派生到我的代码片")

1. public void test.Test.loginTest()
2. public test.IUser test.Test.getUserdao()
3. public void test.Test.setUserdao(test.IUser)
4. AnnotationTest(field=setUserdao,nation=EnglishUserImpl)
5. User Login！

**总结**

1、所有的注解类都隐式继承于 java.lang.annotation.Annotation，注解不允许显式继承于其他的接口。

2、注解不能直接干扰程序代码的运行，无论增加或删除注解，代码都能够正常运行。Java语言解释器会忽略这些注解，而由第三方工具负责对注解进行处理。

3、一个注解可以拥有多个成员，成员声明和接口方法声明类似，这里，我们仅定义了一个成员，成员的声明有以下几点限制：  
 a)   成员以无入参无抛出异常的方式声明，如boolean value(String str)、boolean value() throws Exception等方式是非法的；  
 b)   可以通过default为成员指定一个默认值，如String level() default "LOW\_LEVEL"、int high() default 2是合法的，当然也可以不指定默认值；  
 c)   成员类型是受限的，合法的类型包括原始类型及其封装类、String、Class、enums、注解类型，以及上述类型的数组类型。如ForumService value()、List foo()是非法的。  
 d)   如果注解只有一个成员，则成员名必须取名为value()，在使用时可以忽略成员名和赋值号（=），如@Description("使用注解的实例")。注解类拥有多个成员时，如果仅对value成员进行赋值则也可不使用赋值号，如果同时对多个成员进行赋值，则必须使用赋值号，如@DeclareParents (value = "NaiveWaiter", defaultImpl = SmartSeller.class)。  
 e)   注解类可以没有成员，没有成员的注解称为标识注解，解释程序以标识注解存在与否进行相应的处理；