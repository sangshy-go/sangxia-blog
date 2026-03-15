---
title: "Git Commit提交规范和IDEA插件Git Commit Template的使用"
date: 2019-12-06
category: 工具技巧
tags: [git commit message, git]
---

Git是最牛逼的开源分布式版本控制系统，日常开发中常用来管理代码提交、恢复、追踪，是团队开发最常用的一个代码管理工具。

在我们修改了代码并且提交之前，常会使用`git commit -m 'change'`命令来描述我们代码改动的内容，但是很多都不规范，随处可见的 `git commit -m 'update'`，以致于不能清晰地知道每次提交代码的变更内容，所以需要一种规范来管理代码提交的内容。

#### 一、Git Commit message规范

常用的Git Commit message规范采用的是[Angular 规范](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#heading=h.greljkmo14y0)。

本文参考阮老师的文章介绍：

http://www.ruanyifeng.com/blog/2016/01/commit\_message\_change\_log.html.

Angular规范中定义的格式有3个内容：

- Header
- Body
- Footer

```
<type>(<scope>): <subject>
// 空一行
<body>
// 空一行
<footer>
```

##### 1、 Header

Header部分有3个字段： **type(必需), scope(可选), subject(必需)**

> type(必需) ： Type of change：commit的类别；
>
> scope(可选)：Scope of this change：此次commit的影响模块；
>
> subject(必需)：Short description：简短的描述此次代码变更的主要内容

（1）type

type用于说明commit的类别，常用的标识如下：

- **feat：新功能（feature）**
- **fix：修补bug**
- docs：文档（documentation）
- style： 格式（不影响代码运行的变动,空格,格式化,等等）
- refactor：重构（即不是新增功能，也不是修改bug的代码变动
- perf: 性能 (提高代码性能的改变)
- test：增加测试或者修改测试
- build: 影响构建系统或外部依赖项的更改(maven,gradle,npm 等等)
- ci: 对CI配置文件和脚本的更改
- chore：对非 src 和 test 目录的修改
- revert: Revert a commit

最常用的就是feat合fix两种type；

（2）scope

`scope`用于说明 commit 影响的范围，比如数据层、控制层、视图层等等，视项目不同而不同。

（3）subject

`subject`是 commit 目的的简短描述，不超过50个字符，主要介绍此次代码变更的主要内容。

举个例子：  
 eg: feat(订单模块)：订单详情接口增加订单号字段

其中， feat对应type字段；订单模块对应scope(若果scope有内容，括号就存在)；“订单详情接口增加订单号字段”对应subject，简要说明此次代码变更的主要内容。

##### 2、Body

Body 部分是对本次 commit 的详细描述，可以分成多行。

如：

（1）增加订单号字段；

（2）增加了订单退款接口；

日常项目开发中，如果Header中**subject**已经描述清楚此次代码变更的内容后，Body部分就可以为空。

##### 3、Footer

（1）不兼容变动

（2）关闭 Issue

日常项目中开发，Footer不常用，可为空。

##### 4、Revert

若需要撤销上一次的commit，header部分为：`revert: 上一次commit的header内容`；

body部分为：`This reverts commit xxx`，xxx是上一次commit对应的SHA 标识符。

##### 二、IDEA插件Git Commit Template使用

在iTerm中使用命令行的方式提交代码，我们可以使用Commitizen来撰写合格的 Commit message，具体使用见：http://www.ruanyifeng.com/blog/2016/01/commit\_message\_change\_log.html。

本文主要介绍如何使用IDEA中的插件Git Commit Template来撰写Commit message。

首先安装和下载插件Git Commit Template：[下载地址](https://plugins.jetbrains.com/plugin/9861-git-commit-template)

安装后重启IDEA，更改代码，点击IDEA中的VCS版本控制按钮：

![](./images/987229886427e3f9.png)

点击Commit按钮：

![](./images/0e1c9fe82d887d4e.png)

选择Type，填写相应内容，最后点击提交即可：

![](./images/5e2bfbd7dc773f6f.png)

---

参考内容

http://www.ruanyifeng.com/blog/2016/01/commit\_message\_change\_log.html