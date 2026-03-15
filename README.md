# 桑夏博客

一个简单的个人技术博客系统，支持从外部 JSON 文件加载文章数据。

## 目录结构

```
sangxia-blog/
├── index.html          # 博客主页
├── server.js           # Node.js 服务器（文章统计功能）
├── package.json        # Node.js 依赖配置
├── publish.js          # 文章发布工具
├── data/
│   ├── articles.json   # 文章数据（自动生成）
│   └── stats.json      # 文章统计数据（阅读数、点赞数）
└── articles/           # Markdown 文章文件夹
    ├── article1.md
    └── article2.md
```

## 快速开始

### 步骤 1：安装依赖

```bash
npm install
```

### 步骤 2：启动服务器

```bash
npm start
```

服务器会运行在 `http://localhost:3000`

### 步骤 3：访问博客

打开浏览器访问 `http://localhost:3000`

## 发布文章

### 步骤 1：创建 Markdown 文件

在 `articles` 文件夹中创建 `.md` 文件，例如 `articles/my-article.md`：

```markdown
---
title: 文章标题
date: 2026-03-06
category: 前端开发
tags: JavaScript,Vue
excerpt: 文章摘要（可选，自动生成）
---

# 文章标题

正文内容...
```

**Front Matter 是可选的**，如果不写，系统会自动提取标题和生成摘要。

### 步骤 2：运行发布命令

```bash
node publish.js
```

### 步骤 3：刷新博客

刷新浏览器页面即可看到新文章。

## 文章统计功能

系统会自动统计每篇文章的阅读数和点赞数，数据持久化存储在 `data/stats.json` 文件中。

- **阅读数**：用户点击文章时自动 +1
- **点赞数**：用户点击点赞按钮时自动 +1
- **初始值**：根据文章标题和内容质量智能生成（热门文章主题初始值更高）

### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/articles/stats` | GET | 获取所有文章统计数据 |
| `/api/articles/:id/view` | POST | 增加文章阅读数 |
| `/api/articles/:id/like` | POST | 增加文章点赞数 |
| `/api/articles/init` | POST | 批量初始化文章统计数据 |

## 本地预览（纯静态模式）

如果只需要浏览文章，不需要统计功能，可以使用任意 HTTP 服务器打开：

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

然后访问 `http://localhost:8000`

**注意**：纯静态模式下，文章统计数据会存储在浏览器 localStorage 中，更换浏览器或清除缓存会丢失数据。

## 部署

### 方案一：完整部署（推荐）

支持文章统计功能，需要 Node.js 环境：

```bash
# 1. 安装依赖
npm install

# 2. 启动服务器
npm start

# 3. 使用 PM2 守护进程（可选）
pm2 start server.js --name blog
```

### 方案二：静态部署

仅浏览文章，无统计功能，可部署到：

- GitHub Pages
- Vercel
- Netlify
- 阿里云 OSS
- 腾讯云 COS

**注意**：静态部署时，文章统计数据会存储在浏览器 localStorage 中。

## 自定义样式

在 `index.html` 的 `<style>` 部分修改 CSS 变量：

```css
:root {
    --primary: #7c5cec;      /* 主题色 */
    --bg-color: #f5f7fa;     /* 背景色 */
    --card-bg: #fff;         /* 卡片背景 */
}
```

## 添加新分类

1. 在 `index.html` 中找到 `renderCategories()` 函数
2. 添加新的分类：`{ name: '新分类', icon: '🔖' }`
3. 在 `render()` 函数的筛选按钮中添加对应的按钮

## Front Matter 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| title | 文章标题 | `我的第一篇文章` |
| date | 发布日期 | `2026-03-06` |
| category | 分类 | `前端开发` |
| tags | 标签（逗号分隔） | `JavaScript,Vue` |
| excerpt | 摘要 | 可选，自动生成 |
| tagClass | 样式标签 | `frontend/backend/ai` |
| colorClass | 颜色主题 | `blue/green/purple` |
| likes | 点赞数 | `0` |
| views | 阅读数 | `0` |
