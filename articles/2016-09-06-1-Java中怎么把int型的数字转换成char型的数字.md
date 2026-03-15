---
title: "【1】Java中怎么把int型的数字转换成char型的数字"
date: 2016-09-06
category: 后端开发
tags: []
---

今天在做中兴笔试题时候涉及到了int>>char类型转换的问题；有两种方法：

一：方法一：

```
int i = 1;
char c = (char) (i+48);<span style="color: rgb(0, 130, 0); font-family: Monaco, "DejaVu Sans Mono", "Bitstream Vera Sans Mono", Consolas, "Courier New", monospace; font-size: 1em; line-height: 18px; background-color: rgb(250, 250, 250);"> </span>
```

把char字符型数字转成int数字，因为他们的ascii码值恰好相差48，因此把char型数字减去48得到int型数据，例如'4'转换成了4

二：方法二

```
<span style="white-space:pre">		</span>int num2=9;
		String s = String.valueOf(num2);
		char c = s.charAt(0);
```

  

原因不详![委屈](http://static.blog.csdn.net/xheditor/xheditor_emot/default/wronged.gif)

同理：char>>>int

方法一：

当char类型为数字时：

```
<span style="white-space:pre">	</span>char a = '1';
        int i = Integer.parseInt(String.valueOf(a));
```

  

当char类型是'a' 'A'时：

```
//将字符串转化为数字
    public static int hexToNum(char ch){
        int chNum=0;
        if(ch>='0' && ch<='9'){
            chNum=ch-'0';
        }else if(ch>='A' && ch<='Z'){
            chNum=ch-'A'+10;
        }else if(ch>='a' && ch<='z'){
        	chNum=ch-'a'+10;
        }
        return chNum;
            
    }
```

  
反映出我的基础还很不扎实，要好好看基础。

1. \* 把char字符型数字转成int数字，因为他们的ascii码值恰好相差48，
2. \* 因此把char型数字减去48得到int型数据，例如'4'转换成了4