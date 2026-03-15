---
title: "excellentexport--一个可以导出报表的插件"
date: 2017-01-23
category: 随笔杂谈
tags: [excellentexport, 报表, Firefox]
---

### excellentexport--一个可以导出报表的插件

在页面上导出文件成为txt,doc,csv...等格式文件的插件很多，本篇文章简单介绍一个能将表格中内容导出成csv格式的插件--excellentexport。

下面简单介绍下如何现报表导出。

**1 导入插件**

```
 <script src="${pageContext.request.contextPath}/resources/excellentexport/excellentexport.min.js"></script>
```

  
**2 添加按钮**

```
  <div class="box-header">
                <a class="btn btn-success export-csv-btn" downlaod="data.csv" href="#">数据导出</a>
         </div>
```

  
**3 添加操作**

```
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
```

即可实现。

--------------------------------------------------------------------------------------------

注：今天遇到一个有意思的问题，就是在Chrome浏览器点击这个导出报表的按钮的时候可以导出文件，但是在Firefox浏览器中点击这个按钮的时候，

却没有反应。

原因：Firefox与这个按钮插件有兼容性问题，只能说火狐浏览器做的越来越不如Chrome啊。

解决办法：升级excellentexport.min.js这个插件为最新版本即可。