# 桑夏博客 - 部署指南

## 方案 1：GitHub Pages（免费，推荐）⭐

### 优点
- 完全免费
- 自动 HTTPS
- 自动部署（git push 即可）
- 支持自定义域名
- 全球 CDN 加速

### 部署步骤

#### 1. 创建 GitHub 仓库
```bash
cd ~/IdeaProjects/sangxia-blog

# 初始化 git（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 在 GitHub 上创建仓库后，关联远程仓库
git remote add origin https://github.com/你的用户名/sangxia-blog.git
```

#### 2. 配置 GitHub Pages
1. 打开 GitHub 仓库页面
2. 点击 **Settings** → **Pages**
3. **Source** 选择：`Deploy from a branch`
4. **Branch** 选择：`main` / `root`
5. 点击 **Save**

#### 3. 推送代码
```bash
git push -u origin main
```

#### 4. 访问博客
- 默认地址：`https://你的用户名.github.io/sangxia-blog/`
- 自定义域名：在 Pages 设置中配置

### 自动部署工作流

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

---

## 方案 2：Vercel（免费，推荐）⭐

### 优点
- 完全免费
- 自动 HTTPS
- 全球 CDN
- 自动预览部署
- 支持自定义域名

### 部署步骤

#### 1. 访问 Vercel
打开 https://vercel.com

#### 2. 导入 GitHub 仓库
1. 点击 **Add New Project**
2. 选择 **Import Git Repository**
3. 选择 `sangxia-blog` 仓库
4. 点击 **Deploy**

#### 3. 配置（可选）
- 自定义域名：在 Settings → Domains 配置
- 环境变量：无需配置（纯静态）

#### 4. 访问博客
- 默认地址：`https://sangxia-blog.vercel.app/`
- 自动部署：每次 git push 自动更新

---

## 方案 3：Netlify（免费）

### 优点
- 完全免费
- 拖拽部署（无需 git）
- 自动 HTTPS
- 支持表单、函数扩展

### 部署步骤

#### 方式 A：Git 部署
1. 访问 https://netlify.com
2. 点击 **Add new site** → **Import an existing project**
3. 连接 GitHub，选择仓库
4. 点击 **Deploy site**

#### 方式 B：拖拽部署
1. 访问 https://app.netlify.com/drop
2. 将整个项目文件夹拖到页面
3. 立即部署成功

---

## 方案 4：云服务器（Nginx）

### 适用场景
- 已有云服务器
- 需要完全控制
- 多个项目统一部署

### 部署步骤

#### 1. 上传文件到服务器
```bash
# 打包项目
cd ~/IdeaProjects/sangxia-blog
tar -czf blog.tar.gz *

# 上传到服务器
scp blog.tar.gz user@your-server:/tmp/

# 登录服务器
ssh user@your-server
```

#### 2. 解压到 Nginx 目录
```bash
# 解压
cd /var/www
sudo tar -xzf /tmp/blog.tar.gz -C sangxia-blog/

# 设置权限
sudo chown -R www-data:www-data sangxia-blog/
sudo chmod -R 755 sangxia-blog/
```

#### 3. 配置 Nginx
```nginx
# /etc/nginx/sites-available/sangxia-blog
server {
    listen 80;
    server_name blog.your-domain.com;
    
    root /var/www/sangxia-blog;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # 缓存静态资源
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4. 启用并重启
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/sangxia-blog /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 5. 配置 HTTPS（可选）
```bash
# 使用 Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d blog.your-domain.com
```

---

## 方案 5：对象存储 + CDN（阿里云 OSS/腾讯云 COS）

### 优点
- 超低成本（几分钱/天）
- 高可用
- 全球加速
- 无需维护服务器

### 阿里云 OSS 部署

#### 1. 创建 OSS Bucket
1. 访问 https://oss.console.aliyun.com
2. 创建 Bucket（选择公共读）
3. 记录 Endpoint（如：`oss-cn-hangzhou.aliyuncs.com`）

#### 2. 安装 ossutil
```bash
wget https://gosspublic.alicdn.com/ossutil/1.7.0/ossutil64
chmod +x ossutil64
./ossutil64 config
# 输入 AccessKey、Secret、Endpoint
```

#### 3. 上传文件
```bash
cd ~/IdeaProjects/sangxia-blog
./ossutil64 cp -r . oss://your-bucket-name/
```

#### 4. 配置 CDN（可选）
1. 在 OSS 控制台绑定自定义域名
2. 开通 CDN 加速
3. CNAME 配置

---

## 📊 方案对比

| 方案 | 费用 | 难度 | 维护成本 | 推荐度 |
|------|------|------|---------|--------|
| GitHub Pages | 免费 | ⭐ | 无 | ⭐⭐⭐⭐⭐ |
| Vercel | 免费 | ⭐ | 无 | ⭐⭐⭐⭐⭐ |
| Netlify | 免费 | ⭐ | 无 | ⭐⭐⭐⭐ |
| 云服务器 | ¥50+/月 | ⭐⭐⭐ | 高 | ⭐⭐⭐ |
| 对象存储 | ¥1-10/月 | ⭐⭐ | 低 | ⭐⭐⭐⭐ |

---

## 🎯 推荐方案

### 个人博客首选：GitHub Pages 或 Vercel

**理由**：
1. **零成本** - 完全免费
2. **零维护** - 无需管理服务器
3. **自动部署** - git push 即可
4. **全球 CDN** - 访问速度快
5. **自动 HTTPS** - 安全可靠

### 快速开始（GitHub Pages）

```bash
# 1. 在 GitHub 创建仓库
# 2. 推送代码
cd ~/IdeaProjects/sangxia-blog
git remote add origin https://github.com/你的用户名/sangxia-blog.git
git push -u origin main

# 3. 开启 GitHub Pages
# Settings → Pages → 选择 main 分支 → Save

# 4. 访问
# https://你的用户名.github.io/sangxia-blog/
```

---

## 📝 部署前检查清单

- [ ] 测试本地运行正常
- [ ] 移除调试代码和日志
- [ ] 检查所有链接有效
- [ ] 优化图片大小
- [ ] 配置 favicon
- [ ] 准备自定义域名（可选）
- [ ] 备份数据

---

## 🔧 自定义域名配置

### 1. 购买域名
- 阿里云、腾讯云、GoDaddy 等

### 2. DNS 配置
```
# GitHub Pages
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   你的用户名.github.io

# Vercel
CNAME @     cname.vercel-dns.com
```

### 3. 项目配置
创建 `CNAME` 文件（GitHub Pages）：
```
blog.your-domain.com
```

---

## 💡 后续优化建议

1. **添加评论系统** - Disqus、Gitalk
2. **添加统计** - Google Analytics、百度统计
3. **SEO 优化** - 添加 meta 标签、sitemap
4. **RSS 订阅** - 生成 feed.xml
5. **搜索功能** - 接入 Algolia 或本地搜索

---

**祝部署顺利！** 🎉
