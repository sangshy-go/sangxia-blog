---
title: "基于POI + Java注解实现Excel通用读写组件"
date: 2019-01-05
category: 后端开发
tags: [java excel]
---

基于Apache POI的Java读写excel的操作实现，网上的教程有很多，但是都不是很通用，尤其是在写操作的时候，你不知道写进来的数据格式是怎么样的，更无法去格式化。因此本文基于Apache POI，利用Java注解的方式，实现一个通用的Excel读写工具类。

#### 一、Excel读操作

excel读操作相对比较简单，实现方式比较统一，就是读取excel的每一行，再读取每一列，将内容取出。具体实现如下。

```
 /**
     * 日期格式化
     */
    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyy-MM-dd HH:mm");

    /**
     * 整数格式化,取所有整数部分
     */
    private static final DecimalFormat df = new DecimalFormat("#");


    /**
     * 读取Excel表格表头的内容
     * @param inputStream
     * @return String 表头内容的数组
     */
    public static List<String> readExcelTitle(InputStream inputStream, String fileName) throws Exception {
        List<String> titles = Lists.newArrayList();
        Workbook workbook = getWorkbook(inputStream, fileName);
        if (workbook == null) {
            return titles;
        }
        Sheet sheet = workbook.getSheetAt(0);
        //excel为空
        if (sheet.getLastRowNum() == 0 && sheet.getPhysicalNumberOfRows() == 0) {
            return titles;
        }
        //得到首行的row
        Row row = sheet.getRow(0);
        //标题总列数
        int colNum = row.getPhysicalNumberOfCells();
        for (int i = 0; i < colNum; i++) {
            titles.add(getStringCellValue(row.getCell(i)));
        }
        return titles;
    }

    /**
     * 读取excel文件内容
     * @param inputStream 文件输入流, excel具体内容
     * @param fileName 文件名,通过文件后缀名判断excel版本
     * @return
     * @throws Exception
     */
    public static List<List<String>> readExcelContent(InputStream inputStream, String fileName) throws Exception {
        List<List<String>> result = Lists.newArrayList();
        Workbook workbook = getWorkbook(inputStream, fileName);
        if (workbook == null) {
            return result;
        }
        try {
            Sheet sheet = workbook.getSheetAt(0);
            Row row = sheet.getRow(0);
            if (row == null) {
                return result;
            }
            int colNum = row.getLastCellNum();
            // 得到总行数
            int rowNum = sheet.getLastRowNum();
            // 正文内容应该从第二行开始,第一行为表头的标题
            for (int i = 0; i <= rowNum; i++) {
                row = sheet.getRow(i);
                // 过滤空白行
                if (isBlankRow(colNum, row)) {
                    continue;
                }
                List<String> rowContents = Lists.newArrayList();
                for (int j = 0; j < colNum; j++) {
                    rowContents.add(getCellValue(row.getCell(j)));
                }
                result.add(rowContents);
            }
        } catch (Exception e) {
            throw new Exception("excel解析失败！");
        }

        return result;
    }

    private static boolean isBlankRow(int colNum, Row row) {
        for (int i = 0; i <= colNum; i++) {
            // 只要有一列不为空, 该行就不为空行
            if (StringUtils.isNotBlank(getCellValue(row.getCell(i)))) {
                return false;
            }
        }
        return true;
    }

    
    /**
     * 获取workbook
     */
    private static Workbook createWorkbook(String fileName) throws Exception {
        Workbook workbook = null;
        if (isExcel2003(fileName)) {
            //2003 版本的excel
            workbook = new HSSFWorkbook();
        } else if (isExcel2007(fileName)) {
            //2007 版本的excel
            workbook = new XSSFWorkbook();
        } else {
            throw new Exception("file is not excel!");
        }
        return workbook;
    }


    /**
     * 获取workbook
     */
    private static Workbook getWorkbook(InputStream inputStream, String fileName) throws Exception {
        Workbook workbook = null;
        if (isExcel2003(fileName)) {
            //2003 版本的excel
            workbook = new HSSFWorkbook(inputStream);
        } else if (isExcel2007(fileName)) {
            //2007 版本的excel
            workbook = new XSSFWorkbook(inputStream);
        } else {
            throw new Exception("Excel文件格式有误！");
        }
        return workbook;
    }

    /**
     * 获取单元格数据内容为字符串类型的数据
     * @param cell Excel单元格
     * @return String 单元格数据内容
     */
    private static String getStringCellValue(Cell cell) {
        String cellValue = StringUtils.EMPTY;
        if (cell != null) {
            cellValue = cell.getStringCellValue().trim();
        }
        return cellValue;
    }

    /**
     * 对表格中数值进行格式化
     * @param cell Excel单元格
     * @return
     */
    public static String getCellValue(Cell cell) {
        String value = StringUtils.EMPTY;
        if (cell != null) {
            switch (cell.getCellType()) {
                case Cell.CELL_TYPE_STRING:
                    value = cell.getRichStringCellValue().getString().trim();
                    break;
                case Cell.CELL_TYPE_NUMERIC:
                    if ("m/d/yy".equals(cell.getCellStyle().getDataFormatString())) {
                        value = sdf.format(cell.getDateCellValue());
                    } else if (HSSFDateUtil.isCellDateFormatted(cell)) {
                        Date date = cell.getDateCellValue();
                        value = sdf.format(date);
                    } else {
                        value = df.format(cell.getNumericCellValue());
                    }
                    break;
                case Cell.CELL_TYPE_BOOLEAN:
                    value = String.valueOf(cell.getBooleanCellValue());
                    break;
                case Cell.CELL_TYPE_BLANK:
                    break;
                default:
                    break;
            }
        }
        return value;
    }

    /**
     * 是否是2003的excel，返回true是2003
     */
    public static boolean isExcel2003(String filePath)  {
        return filePath.matches("^.+\\.(?i)(xls)$");
    }

    /**
     * 是否是2007的excel，返回true是2007
     */
    public static boolean isExcel2007(String filePath)  {
        return filePath.matches("^.+\\.(?i)(xlsx)$");
    }
```

测试：

```
 @Test
    public void testRead() throws Exception {
        // 对读取Excel表格标题测试
        String fileName = "/Users/wanggenshen/Documents/testexcel.xlsx";
        FileInputStream is = new FileInputStream(fileName);
        List<List<String>> contents = ExcelUtil.readExcelContent(is, fileName);
        System.out.println(contents.size());
    }
```

#### 二、Excel写

excel写操作需要确定写入的每一行的列数、每一列的类型，所以这里我用一个注解来映射写入的内容与excel每一列之间的关系。

```
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Inherited
public @interface ExcelProperty {


    /**
     * 列顺序，越小越靠前
     * @return 列顺序
     */
    int rowIndex() default 99999;

    /**
     * 字段类型
     */
    Class<?> fieldType();
}
```

然后就需要写一个写的方法，声明需要写入excel的表头、内容、每一列的类型。

```
    public static File writeExcel(String filePath, List<String> titleList, List<List<String>> dataList, Class<?> clazz) throws Exception {
        if(CollectionUtils.isEmpty(dataList)){
            return new File(filePath);
        }
        Workbook workbook = null;
        File file = new File(filePath);
        FileOutputStream fos = null;
        try {
            fos = new FileOutputStream(file);

            int colNum = dataList.get(0).size();
            Map<Integer, Class<?>> colTypeMap = buildExcelColTypeMap(clazz);
            if (MapUtils.isEmpty(colTypeMap) || colTypeMap.size() != colNum) {
                throw new Exception("clazz type not math the excel cols");
            }
            fos = new FileOutputStream(file);
            workbook = createWorkbook(filePath);
            Sheet sheet = workbook.createSheet("sheet1");

            // excel表头
            Row row = sheet.createRow(0);
            for (int index = 0; index < colNum; index++) {
                Cell cell = row.createCell(index);
                cell.setCellType(Cell.CELL_TYPE_STRING);
                cell.setCellValue(titleList.get(index));
            }

            // 数据内容从第一行开始
            for (int i = 0; i < dataList.size(); i++) {
                row = sheet.createRow(i + 1);
                List<String> rowContent = dataList.get(i);
                for (int j = 0; j < colNum; j++) {
                    Class fieldType = colTypeMap.get(j + 1);
                    Cell cell = row.createCell(j);
                    writeCellValue(workbook, cell, rowContent.get(j), fieldType);
                }
            }
            workbook.write(fos);
        } finally {
            if (fos != null) {
                try {
                    fos.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        return file;
    }

    private static void writeCellValue(Workbook workbook, Cell cell, String value, Class fieldType) throws Exception {
        try {
            if (Integer.class == fieldType || java.lang.Long.class == fieldType) {
                double d = NumberUtils.toDouble(String.valueOf(value));
                cell.setCellValue(d);
                cell.setCellType(Cell.CELL_TYPE_NUMERIC);
            } else if (java.lang.Double.class == fieldType || java.lang.Float.class == fieldType) {
                double d = NumberUtils.toDouble(String.valueOf(value));
                cell.setCellValue(d);
                cell.setCellType(Cell.CELL_TYPE_NUMERIC);
            } else if (java.util.Date.class == fieldType) {
                CellStyle cellStyle = workbook.createCellStyle();
                short format = workbook.createDataFormat().getFormat("yyyy-mm-dd HH:mm");
                cellStyle.setDataFormat(format);
                Date date = DateUtils.parseDate(value, "yyyy-mm-dd HH:mm");
                cell.setCellValue(date);
                cell.setCellStyle(cellStyle);
                cell.setCellType(Cell.CELL_TYPE_NUMERIC);
            } else if (java.lang.String.class == fieldType) {
                cell.setCellValue(value);
                cell.setCellType(Cell.CELL_TYPE_STRING);
            } else if (java.lang.Boolean.class == fieldType) {
                cell.setCellValue(Boolean.valueOf(value));
                cell.setCellType(Cell.CELL_TYPE_BOOLEAN);
            } else {
                cell.setCellValue("");
                cell.setCellType(Cell.CELL_TYPE_BLANK);
            }
        } catch (Exception e) {
            throw new Exception("invalid cell value format");
        }

    }

    /**
     * 构建excel每一列的类型
     * @param clazz 标有ExcelProperty的注解
     * @return
     */
    private static Map<Integer, Class<?>> buildExcelColTypeMap(Class<?> clazz) throws Exception {
        Map<Integer, Class<?>> excelColTypeMap = Maps.newHashMap();
        Field[] fields = clazz.getDeclaredFields();
        for (int i = 0; i < fields.length; i++) {
            Field field = fields[i];
            if (!field.isAnnotationPresent(ExcelProperty.class)) {
                throw new Exception(String.format("Class field has no ExcelProperty Annotation", field));
            }
            ExcelProperty excelProperties = fields[i].getAnnotation(ExcelProperty.class);
            excelColTypeMap.put(excelProperties.rowIndex(), excelProperties.fieldType());
        }
        return excelColTypeMap;
    }

    /**
     * 获取workbook
     */
    private static Workbook createWorkbook(String fileName) throws Exception {
        Workbook workbook = null;
        if (isExcel2003(fileName)) {
            //2003 版本的excel
            workbook = new HSSFWorkbook();
        } else if (isExcel2007(fileName)) {
            //2007 版本的excel
            workbook = new XSSFWorkbook();
        } else {
            throw new Exception("file is not excel!");
        }
        return workbook;
    }


    /**
     * 获取workbook
     */
    private static Workbook getWorkbook(InputStream inputStream, String fileName) throws Exception {
        Workbook workbook = null;
        if (isExcel2003(fileName)) {
            //2003 版本的excel
            workbook = new HSSFWorkbook(inputStream);
        } else if (isExcel2007(fileName)) {
            //2007 版本的excel
            workbook = new XSSFWorkbook(inputStream);
        } else {
            throw new Exception("Excel文件格式有误！");
        }
        return workbook;
    }

    /**
     * 获取单元格数据内容为字符串类型的数据
     * @param cell Excel单元格
     * @return String 单元格数据内容
     */
    private static String getStringCellValue(Cell cell) {
        String cellValue = StringUtils.EMPTY;
        if (cell != null) {
            cellValue = cell.getStringCellValue().trim();
        }
        return cellValue;
    }

    /**
     * 对表格中数值进行格式化
     * @param cell Excel单元格
     * @return
     */
    public static String getCellValue(Cell cell) {
        String value = StringUtils.EMPTY;
        if (cell != null) {
            switch (cell.getCellType()) {
                case Cell.CELL_TYPE_STRING:
                    value = cell.getRichStringCellValue().getString().trim();
                    break;
                case Cell.CELL_TYPE_NUMERIC:
                    if ("m/d/yy".equals(cell.getCellStyle().getDataFormatString())) {
                        value = sdf.format(cell.getDateCellValue());
                    } else if (HSSFDateUtil.isCellDateFormatted(cell)) {
                        Date date = cell.getDateCellValue();
                        value = sdf.format(date);
                    } else {
                        value = df.format(cell.getNumericCellValue());
                    }
                    break;
                case Cell.CELL_TYPE_BOOLEAN:
                    value = String.valueOf(cell.getBooleanCellValue());
                    break;
                case Cell.CELL_TYPE_BLANK:
                    break;
                default:
                    break;
            }
```

**如何使用：**  
将要创建的excel格式如下：  
![](./images/95a77aaf581a55ba.png)

首先需要利用注解，声明插入excel的内容与excel的关系：

```
public class ExcelConfigDTO {

    @ExcelProperty(rowIndex = 1, fieldType = Long.class)
    private long no;
    @ExcelProperty(rowIndex = 2, fieldType = Integer.class)
    private int score;
    @ExcelProperty(rowIndex = 3, fieldType = String.class)
    private String pass;
    @ExcelProperty(rowIndex = 4, fieldType = String.class)
    private String grade;
}
```

**测试**

```
@Test
    public void testWrite() throws Exception {
        // 对读取Excel表格标题测试
        String fileName = "/Users/wanggenshen/Documents/testexcel.xlsx";
        List<String> titleList = Lists.newArrayList("学号", "成绩", "是否及格", "年级");

        List<List<String>> dataList = Lists.newArrayList();
        List<String> data1 = Lists.newArrayList();
        data1.add("12345");
        data1.add("87");
        data1.add("是");
        data1.add("大二");

        List<String> data2 = Lists.newArrayList();
        data2.add("243455");
        data2.add("56");
        data2.add("否");
        data2.add("大三");

        dataList.add(data1);
        dataList.add(data2);

        ExcelUtil.writeExcel(fileName, titleList, dataList, ExcelUtil.ExcelConfigDTO.class);
        System.out.println("写入成功");
    }
```

就是这么简单。完整的代码见我的github：。