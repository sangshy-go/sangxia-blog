---
title: "Java中Date/Calendar/Joda-Time比较以及应用Gregoriancalendar类实现简单的日历"
date: 2017-06-14
category: 后端开发
tags: [Date, Calendar, Joda-Time, DateTimeFormatter]
---

关于时间与日期操作，标准Java类库包含了两个类：   
 - **Date类 :** 表示时间   
 - **GregorianCalendar：**表示日历，继承了Calendar类。

---

### **Date类**

java,util.Date，可直接输出其实例化对象，   
 格式如：”Wed Jun 14 17:17:47 CST 2017”

##### **Date类主要API:**

> - getTime(): 获取当前系统的时间(距离1970年1月1日0时开始走过的秒数)，返回一个长整数。
> - before(Date date): 一个时间点是否早于另一个时间点；
> - after(Date date): 一个时间点是否晚于另一个时间点；

Date类也有getDay，getMonth，getYear等方法，但已经不推荐使用。   
 测试代码说如下：

```
/* Date */
Date date = new Date();
System.out.println(date);       System.out.println("当前时间：" + date.getTime());
```

输出如下：

```
Wed Jun 14 16:00:07 CST 2017
当前时间：1497427207277
```

Date构造函数构建了一个日期对象，没有接受任何参数。这个构造函数在内部使用了`System.currentTimeMillis()` 获取当前系统的时间。

但是上述返回的时间不太容易看出，需要一个类来对这个返回的时间进行格式化，显示出我们常见的形式：

##### **DateFormat,SimpleDateFormat类**

SimpleDateFormat继承DateFormat，可对日期进行格式化，返回我们想要的日期格式：

```
/*  DateFormat  SimpleDateFormat */
SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd-EE");
System.out.println("当前时间：" + sdf.format(new Date()));

sdf = new SimpleDateFormat("EE-dd-MM-yyyy");
System.out.println("当前时间2：" + sdf.format(new Date()));

sdf = new SimpleDateFormat("yyyy");
System.out.println("当前年份：" + sdf.format(new Date()));
sdf = new SimpleDateFormat("MM");
System.out.println("当前月份：" + sdf.format(new Date()));
sdf = new SimpleDateFormat("dd");
System.out.println("当前日期：" + sdf.format(new Date()));
```

输出如下：

```
当前时间：2017-06-14-星期三
当前时间2：星期三-14-06-2017
当前年份：2017当前月份：06
当前日期：14
```

比较常用的就是按照想要的日期格式获取当前时间的代码：   
 `SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");`   
 `sdf.format(new Date());`

---

### **Calendar ，Gregoriancalendar类**

Calendar 类可以将日期精确到毫秒，所包含的方法比Date类多的多。

Calendar 类是一个抽象类，Gregoriancalendar拓展了Calendar类。

##### **Gregoriancalendar API 如下：**

**构造函数**

> - public GregorianCalendar() : 构造一个日历对象，用来表示默认地区/时区的当前时间；
> - public GregorianCalendar(int year, int month, int dayOfMonth) : 根据给定日期时间构造一个Gregoriancalendar 对象；   
>    **注：month是从0开始，0表示一月，11表示十二月**
> - GregorianCalendar(int year, int month, int dayOfMonth,int hourOfDay, int minute, int second, int millis)

**常用 方法：**

> - int get(int field) : 获取给定域的值：可以获取年月日，时分秒等等；
> - void set(int field， int value) ： 设置给定域的时间
> - void set(int year,int month, int day)
> - void set(int year,int month, int day,int hour, int minutes, int seconds)
> - Date getTime(): 获得当前值表达的时间点
> - void setTime(Date time) : 设置为指定的日期；
> - void add(int field, int amount) : 给指定域增加时间。可以是负值

**测试代码如下：**

```
/* Calendar  Gregoriancalendar */
Calendar calendar = new GregorianCalendar();
System.out.println("年份：" + calendar.get(Calendar.YEAR));
System.out.println("月份：" + (calendar.get(Calendar.MONTH) + 1));
System.out.println("在一年中第几天：" + calendar.get(Calendar.DAY_OF_YEAR));
System.out.println("在一月中第几天：" + calendar.get(Calendar.DAY_OF_MONTH));
System.out.println("在一周中第几天：" + calendar.get(Calendar.DAY_OF_WEEK));
System.out.println("时：" + calendar.get(Calendar.HOUR));
System.out.println("分：" + calendar.get(Calendar.MINUTE));
System.out.println("秒：" + calendar.get(Calendar.SECOND));
```

**输出如下;**

```
年份：2017
月份：6
在一年中第几天：165
在一月中第几天：14
在一周中第几天：4
时：5
分：32
秒：2
```

---

### 应用Gregoriancalendar 类显示当前月的日历

下面应用Gregoriancalendar类实现一个显示当前月的日历，当前日用一个\*号标记。

**实现的代码如下：**

```
package com.wgs.日期;

import java.text.DateFormatSymbols;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.Locale;

public class CalendarTest {

    public static void buildCalendar(){
        //国际化(每个地区每周的第一天不一样)
        Locale.setDefault(Locale.US);

        GregorianCalendar gCalendar = new GregorianCalendar();

        //获取月份，日
        int today = gCalendar.get(Calendar.DAY_OF_MONTH);
        int month = gCalendar.get(Calendar.MONTH);


        //将一个月的第一天设置为1号
        gCalendar.set(Calendar.DAY_OF_MONTH, 1);
        //得到每周第1天为周几(注：每周第一天需区分周日还是周一)
        int weekDay = gCalendar.get(Calendar.DAY_OF_WEEK);

        //获取每周起始日(周日还是周一)
        int firstDayOfWeek = gCalendar.getFirstDayOfWeek();

        /**
         * 日历第一行需要缩进
         * 
         * 比如，本程序中
         * weekDay ： 一周的第5天
         * firstDayOfWeek ： 每周第一天为周1
         * 周四与周一相差3 所以第一行缩进4个单位
         */
        int indent = 0;
        while (weekDay != firstDayOfWeek){
            indent++;
            gCalendar.add(Calendar.DAY_OF_MONTH, -1);
            weekDay = gCalendar.get(Calendar.DAY_OF_WEEK);
        }


        System.out.println("-----------日历----------");
        //获取表示星期的英文表示：US:【Sun Mon Tue Wed Thu Fri Sat】
        //               CHINA:【 星期日 星期一 星期二 星期三 星期四 星期五 星期六】
        String[] weekdayNames = new DateFormatSymbols().getShortWeekdays();
        //打印
        do{
            //4个字符串
            System.out.printf("%4s", weekdayNames[weekDay]);
            gCalendar.add(Calendar.DAY_OF_WEEK, 1);
            weekDay = gCalendar.get(Calendar.DAY_OF_WEEK);
        }while (weekDay != firstDayOfWeek);

        System.out.println();
        //第一行缩进
        for (int i = 1; i <= indent; i++){
            //空4格
            System.out.print("    ");
        }

        gCalendar.set(Calendar.DAY_OF_MONTH, 1);
        do{
            int day = gCalendar.get(Calendar.DAY_OF_MONTH);
            System.out.printf("%3d", day);

            //当前日标记*
            if(day == today){
                System.out.print("*");
            }else{
                System.out.print(" ");
            }
            //继续打印一周的下一天
            gCalendar.add(Calendar.DAY_OF_MONTH, 1);
            weekDay = gCalendar.get(Calendar.DAY_OF_WEEK);

            //若当前日为周一，则表示到了下周，换行继续打印
            if(weekDay == firstDayOfWeek){
                System.out.println();
            }

        }while(gCalendar.get(Calendar.MONTH) == month);//只要还在当月，就继续打印

        if(weekDay != firstDayOfWeek){
            System.out.println();
        }
    }

    public static void main(String[] args) {

        buildCalendar();
    }

}
```

**输出如图：**   
 ![这里写图片描述](https://img-blog.csdn.net/20170614220807733?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

### Joda-Time

Joda-Time是第三方处理日期与时间的函数。相比较SimpleDateFormat，Joda-Time是线程安全的。

使用：

```
    <dependency>
      <groupId>joda-time</groupId>
      <artifactId>joda-time</artifactId>
      <version>2.3</version>
    </dependency>
```

#### 创建日期

```
DateTime dateTime = new DateTime();
或指定参数
DateTime dateTime = new DateTime(2016, 10, 01, 00, 00);
```

#### Date >>> Str

```
public static String dateToStr(Date date){
    if (date == null){
        return null;
     }
     DateTime dateTime = new DateTime(date);
     return dateTime.toString("forPattern("yyyy-MM-dd HH:mm:ss");");
}
或者
public static String dateToStr(Date date){
    if (date == null){
        return null;
     }
     DateTimeFormatter dtf = DateTimeFormat.forPattern("yyyy-MM-dd    HH:mm:ss");
    String dateTimeStr = dtf.print(dateTime);
    return dateTimeStr ;
}
```

#### Str>>> Date

```
public static Date strToDate(String dateTimeStr){
   DateTimeFormatter dateTimeFormat = DateTimeFormat.forPattern("("yyyy-MM-dd HH:mm:ss");
   DateTime dateTime = dateTimeFormat.parseDateTime(dateTimeStr);
   return dateTime.toDate();
}
```

---

参考：<http://blog.csdn.net/e421083458/article/details/8530280>   
 <https://segmentfault.com/a/1190000006979465>   
 MyBlog : <https://nomico271.github.io/>