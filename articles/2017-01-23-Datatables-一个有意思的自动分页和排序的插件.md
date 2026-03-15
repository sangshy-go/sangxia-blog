---
title: "Datatables--一个有意思的自动分页和排序的插件"
date: 2017-01-23
category: 前端开发
tags: []
---

### Datatables--一个有意思的自动分页和排序的插件

相信大家在做表格显示的时候都做过分页显示的功能，实现起来只需要简单几句SQL+java代码即可实现，但这不是本篇的重点。本篇文章想要介绍一个有意思功能强大的可以自动分页和选择对表格中列进行排序的插件--Datatables。

当然，本篇所讲的分页和排序只是Datatables的一部分小功能，还有很多其他的强大功能，可自行去官网查看API使用。

详情参看官网：【http://datatables.club/】

#### 1 什么是Datatables？

Datatables是一款jquery表格插件。它是一个高度灵活的工具，可以将任何HTML表格添加高级的交互功能。

1. 分页，即时搜索和排序
2. 几乎支持任何数据源：DOM， javascript， Ajax 和 服务器处理
3. 支持不同主题 DataTables, jQuery UI, Bootstrap, Foundation
4. 各式各样的扩展: Editor, TableTools, FixedColumns ……
5. 丰富多样的option和强大的API
6. 支持国际化

#### 2  五分钟上手Datatables

在项目中使用 DataTables的步骤也很简单。

只需要引入三个文件即可，jQuery库，一个DT的核心js文件和一个DT的css文件即可。

##### 1)引入三个文件

```
<!--第一步：引入Javascript / CSS （CDN）-->
<!-- DataTables CSS -->
<link rel="stylesheet" type="text/css" href="http://cdn.datatables.net/1.10.13/css/jquery.dataTables.css">
 
<!-- jQuery -->
<script type="text/javascript" charset="utf8" src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
 
<!-- DataTables -->
<script type="text/javascript" charset="utf8" src="http://cdn.datatables.net/1.10.13/js/jquery.dataTables.js"></script>
```

##### 2)在html的table中加上id或者class；

如：

```
<table id="table_id_example"></table>
```

##### 3)初始化Datatables:

```
<!--第三步：初始化Datatables-->
$(document).ready( function () {
    $('#table_id_example').DataTable();
} );
```

#### 3   附上我的code供参考：

```
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%--
  Created by IntelliJ IDEA.
  User: wanggenshen_sx
  Date: 2017/1/22
  Time: 14:08
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>商品信息统计</title>
      <!--第一步：引入Javascript / CSS （CDN）-->
      <!-- DataTables CSS -->
   <link rel="stylesheet" href="bootstrap/css/bootstrap.min.css">
   <link rel="stylesheet" type="text/css" href="http://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css">
   <!-- jQuery -->
    <script src="//cdn.bootcss.com/jquery/2.1.4/jquery.min.js"></script>
   <!-- DataTables -->
   <script type="text/javascript" charset="utf8" src="http://cdn.datatables.net/1.10.13/js/jquery.dataTables.js">
   </script>

    <script src="${pageContext.request.contextPath}/resources/excellentexport/excellentexport.min.js"></script>
</head>
<body>

<div style="text-align: center ">
    <h2>[ --------商品信息统计-------------]</h2>
</div>
<!--Table表格显示-->
<div class="row">
 <div class="col-xs-12">

     <div class="box">
         <div class="box-header">
                <a class="btn btn-success export-csv-btn" downlaod="data.csv" href="#">数据导出</a>
         </div>

         <div class="box-body">
             <div class="table-responsive">
                 <table class="table table-striped  order_table" id="export-csv-table">
                     <thead>
                     <tr>
                         <th>日期</th>
                         <th>商品剩余</th>
                         <th>商品一日留存率</th>
                         <th>商品一周留存率</th>
                         <th>商品一月留存率</th>
                     </tr>
                     </thead>

                     <tbody>
                     <c:forEach var="info" items="${statisticsInfo}">
                         <tr>
                             <td><fmt:formatDate value="${info.date}" pattern="yyyy-MM-dd"/></td>
                             <td>${info.remainGoods}</td>
                             <td>${info.d1Retention}</td>
                             <td>${info.d7Retention}</td>
                             <td>${info.d28Retention}</td>
                         </tr>
                     </c:forEach>
                     </tbody>
                  </table>
             </div>
         </div>
     </div>
 </div>
</div>
 <script>
     //加入分页
     $(document).ready( function () {
         $('.order_table').DataTable({
             //开启搜索框
             "searching": true,
             //允许分页
            "paging": true,
             //左下角信息 showing 1 to 7 of 7entries
             "info":true,
             //支持国际化，将search转为中文
             language: {
                 "search": "在表格中搜索:",
                 "oPaginate": {
                     "sPrevious": "上页",
                     "sNext": "下页",
                 },
             },
             "columnDefs": [
                 {
                     //targets指定列禁止排序功能
                     "orderable": false,
                     "targets": [0,1,2]
                 }
             ]
         });
     } );

     // 导出CSV
     $(".export-csv-btn").click(function () {
         if($("#export-csv-table").size() === 1) {
             if($("#export-csv-table tbody tr").length > 0 && !$("#export-csv-table tbody tr td").hasClass("dataTables_empty")) {
                 return ExcellentExport.csv(this, 'export-csv-table');
             } else {
                 alert("数据不存在");
                 return false;
             }
         } else {
             return false;
         }
     });
 </script>
</body>
</html>
```

  

#### 4 实现效果：

![](https://img-blog.csdn.net/20170123110005735?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

上图有个数据导出功能，也是一个有意思的插件，将在下篇简要介绍。