---
title: "【Core Java Volume1】重写equals,hashCode,toString方法"
date: 2016-09-21
category: 后端开发
tags: []
---

1 重写equals()方法：

例：重写父类Employee3的equals方法

```
//重写equals
	//1 显示命名参数otherObject，稍后转化为other
	public boolean equals(Object otherObject){
		//2 检测this与 otherObject 是否引用同一个对象
		if(this == otherObject) return true;
		//3 检测otherObject 是否为null
		if(otherObject == null) return false;
		// 4 比较this与 sotherObject 是否为同一个类
		if(getClass()!= otherObject.getClass())
			return false;
		//5 转化
		Employee3 other =(Employee3)otherObject;
		//比较，基本类型的就用==比较
		return Objects.equals(name, other.name) && salary ==other.salary 
			&& Objects.equals(hireDate, other.hireDate);
	}
```

子类Manager3继承Employee3，其重写的equals()方法如下：

```
<span style="white-space:pre">	</span>public boolean equals(Object otherObject){
		if(! super.equals(otherObject))
			return false;
		
		Manager3 other =(Manager3)otherObject;
		return bonus == other.bonus;
	}
```

  

2 重写HashCode()方法：

父类：

```
//重写hashCode
	public int hashCode(){
		return Objects.hash(name,salary,hireDate);
	}
```

子类：

```
<span style="white-space:pre">	</span>public int hashCode(){
		return super.hashCode() + 17*new Double(bonus).hashCode();
	}
```

  

3 重写toString()方法:返回对象值的字符串，最好通过调用getClass().getName()获得类名的字符串

父类：

```
//重写toString
	public String toString(){
		return getClass().getName()+"[name="+name+",salary="+salary+",hireDate="+hireDate+"]";
	}
```

 子类：


```
	public String toString(){
		return super.toString()+"[bonus="+bonus+"]";
	}
```

  