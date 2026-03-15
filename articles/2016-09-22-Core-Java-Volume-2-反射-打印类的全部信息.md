---
title: "【Core Java Volume 2】反射---打印类的全部信息"
date: 2016-09-22
category: 后端开发
tags: []
---

#### 反射机制最重要的内容---检查类的结构。 Class类中的getFields,getMethods, getConstructors  方法分别返回类提供的public域，方法和构造器数组，其中包括父类的公有成员。 Class类的getDeclareFields、getDeclareMethods和getDeclareConstructors()分别返回类的全部域，方法和构造器，包括私有和受保护成员，但不包括父类的。

```
package com.exe.fifth;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Scanner;

public class ReflectionTest {

	public static void main(String[] args) {
		String name;
		if(args.length > 0)
			name=args[0];
		else{
			Scanner in=new Scanner(System.in);
			//输入一个类名，类似于：java.util.Date
			System.out.println("Enter a classname: ");
			name = in.next();
		}
		
		
		try {
			//获取Class实例
			Class c1 =Class.forName(name);
			//获取运行时类的父类
			Class superc1 = c1.getSuperclass();
			//获得类的权限修饰符
			String modifiers =Modifier.toString(c1.getModifiers());
			
			if(modifiers.length() > 0)
				System.out.print(modifiers +" ");//public:获得类的权限修饰符
			System.out.print("class :"+name);//class :java.util.Date
			
		if(superc1 !=null && superc1 != Object.class)
			System.out.println("extends : "+superc1.getName());
		
		System.out.print("\n{\n");
		printConstructors(c1);//构造器: private static final sun.util.calendar.BaseCalendar gcal;...
		System.out.println("-------------------------");
		printMethods(c1);//方法: public boolean equals(java.lang.Object);...
		System.out.println("-------------------------");
		printFields(c1);//属性: public java.util.Date(java.lang.String);...
		System.out.print("}");
			
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		}
		System.exit(0);
		
	}

	private static void printConstructors(Class c1) {
		//获得构造器
		Constructor[]  constructors=c1.getDeclaredConstructors();
		
		for(Constructor c:constructors){
			String name = c.getName();//构造器名字：java.util.Date
			System.out.print(" ");
			
			String modifiers =Modifier.toString(c.getModifiers());//权限修饰符:public
			if(modifiers.length() > 0)
				System.out.print(modifiers + " ");
			System.out.print(name +"(");
			
			Class[] paramTypes= c.getParameterTypes();//参数类型(int, int, int, int, int, int)
			for(int j=0;j<paramTypes.length;j++){
				if(j>0)
					System.out.print (", ");
				System.out.print(paramTypes[j].getName());
			}
			System.out.print(");");//
		}
	}

	private static void printMethods(Class c1) {
		//获得运行时类本身声明的所有方法，无父类的: public boolean equals(java.lang.Object)
		Method[] methods = c1.getDeclaredMethods();
		for(Method m:methods){
			Class retType=m.getReturnType();//返回值类型：boolean,int...
			String name = m.getName();//方法名：equals(),toString()...
			
			System.out.print(" ");
			String modifiers =Modifier.toString(m.getModifiers());//权限修饰符：public,private...
			if(modifiers.length() > 0)
				System.out.print(modifiers +" ");//public
			
			System.out.print(retType.getName() +" " +name +"(");//boolean equals(
			
			Class[] paramTypes = m.getParameterTypes();//获取形参参数类型
			for(int j=0;j < paramTypes.length;j++){
				if(j>0)
					System.out.print(", ");
				System.out.print(paramTypes[j].getName());//java.lang.Object
			}
			System.out.println(")");//)
		}
	}

	private static void printFields(Class c1) {
		Field[] fields=c1.getDeclaredFields();
		
		for(Field f:fields){
			Class type=f.getType();//返回值类型：long
			String name = f.getName();//属性名：fastTime
			System.out.print(" ");
			String modifiers =Modifier.toString(f.getModifiers());//权限修饰符：private static final 
			if(modifiers.length() > 0)
				System.out.println(modifiers+ " ");
			System.out.println(type.getName()+" "+name+";");
			
		}
		
	}

}
```

  
  