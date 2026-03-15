---
title: "BigDecimal操作double、float精度丢失问题"
date: 2019-07-03
category: 随笔杂谈
tags: []
---

#### 一、问题

最近使用BigDecimal进行数值加减运算的时候踩了一个小坑：BigDecimal操作double、float数值时精度丢失。  
举个例子：

```
    public static void main(String[] args) {
        float d1 = 1.2f;
        float d2 = 2.1f;
        BigDecimal b1 = new BigDecimal(d1);
        BigDecimal b2 = new BigDecimal(d2);
        System.out.println(b1.add(b2));
    }
```

理想输出结果是3.3，实际上输出结果是3.2999999523162841796875。如果这个数乘以1000000000，这样就可能造成公司损失成千上万的金额，仅仅是由于精度丢失造成的。

我们知道，Java简单类型不能精确进行的浮点数运算，️而BigDecimal就是用来对超过16位的数字进行精确的浮点数运算的，那么为什么刚刚举的例子中会出现精度丢失的情况呢？

下面是BigDecimal的构造方法文档的解释：

> public BigDecimal(double val)  
> 将 double 转换为 BigDecimal，后者是 double 的二进制浮点值准确的十进制表示形式。返回的 BigDecimal 的标度是使 (10scale × val) 为整数的最小值。

> 即：  
> new BigDecimal(0.1) 所创建的 BigDecimal 正好等于 0.1（非标度值 1，其标度为 1），但是它实际上等于 0.1000000000000000055511151231257827021181583404541015625。这是因为 0.1 无法准确地表示为 double（或者说对于该情况，不能表示为任何有限长度的二进制小数）。这样，传入 到构造方法的值不会正好等于 0.1（虽然表面上等于该值）。

通过BigDecima的文档可以看出使用BigDecimal的构造函数进行封装Double、Float型数值的时候，实际创建的值与我们期望的值会出现误差，因此在进行运算时会出现精度的丢失。

#### 二、如何避免

在使用的时候，有两种方法：

- 使用new BigDecimal(String);
- 使用BigDecimal.valuOf（Double）；

1、new BigDecimal(String)：

```
    public static void main(String[] args) {
        double d1 = 1.2;
        double d2 = 2.1;
        BigDecimal b1 = new BigDecimal(d1.toString());
        BigDecimal b2 = new BigDecimal(d2.toString());
        System.out.println(b1.add(b2));
    }
```

输出结果为：3.3

2、BigDecimal.valuOf（double）的使用：

```
    public static void main(String[] args) {
        double d1 = 1.2;
        double d2 = 2.1;
        BigDecimal b1 = BigDecimal.valueOf(d1);
        BigDecimal b2 = BigDecimal.valueOf(d2);
        System.out.println(b1.add(b2));
    }
```

输出结果为3.3.  
我们可以看下源码：

```
    public static BigDecimal valueOf(double val) {
        return new BigDecimal(Double.toString(val));
    }
```

可以看到 BigDecimal.valueOf(double)其实就等同于new BigDecimal(String)。

所以以后使用BigDecimal进行计算的时候一定要注意精度问题，不然造成公司百万、千万损失的时候可不就只是几个小数点的问题了，需要被杀了祭天的，sad。。