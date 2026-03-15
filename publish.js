#!/usr/bin/env node

/**
 * 博客文章发布工具
 *
 * 使用方法：
 * 1. 将 Markdown 文章放入 articles 文件夹
 * 2. 运行 node publish.js
 * 3. 文章将自动发布到 data/articles.json
 */

const fs = require('fs');
const path = require('path');

// 配置
const ARTICLES_DIR = path.join(__dirname, 'articles');
const OUTPUT_FILE = path.join(__dirname, 'data', 'articles.json');

// 从文件名提取 slug
function extractSlug(filename) {
    return path.basename(filename, '.md')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

// 从内容提取元数据（支持 Front Matter）
function parseFrontMatter(content) {
    const frontMatter = {};

    // 检查是否有 Front Matter (--- 包裹的 YAML)
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);

    if (frontMatterMatch) {
        const lines = frontMatterMatch[1].split('\n');
        lines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim();
                frontMatter[key.trim()] = value.replace(/^['"]|['"]$/g, '');
            }
        });
        content = content.replace(frontMatterMatch[0], '');
    }

    return { frontMatter, content };
}

// 提取标题
function extractTitle(content) {
    const match = content.match(/^#\s+(.*)$/m);
    return match ? match[1].trim() : '无标题';
}

// 提取摘要（第一段非标题文字）
function extractExcerpt(content) {
    const lines = content.split('\n')
        .filter(line => line.trim() && !line.startsWith('#') && !line.startsWith('```'));
    const excerpt = lines.join(' ').trim();
    return excerpt.substring(0, 150) + (excerpt.length > 150 ? '...' : '');
}

// 自动分类
function autoCategory(content, title) {
    const text = (content + ' ' + title).toLowerCase();

    if (text.includes('javascript') || text.includes('js') || text.includes('vue') ||
        text.includes('react') || text.includes('css') || text.includes('html') ||
        text.includes('前端')) {
        return '前端开发';
    }
    // 架构设计：分布式、微服务、设计模式、消息队列、RPC 等
    if (text.includes('架构') || text.includes('分布式') || text.includes('微服务') ||
        text.includes('设计模式') || text.includes('solid') || text.includes('责任链') ||
        text.includes('观察者') || text.includes('适配器') || text.includes('装饰模式') ||
        text.includes('工厂模式') || text.includes('模板方法') || text.includes('代理模式') ||
        text.includes('策略模式') || text.includes('消息队列') || text.includes('kafka') ||
        text.includes('rpc') || text.includes('dubbo') || text.includes('高可用') ||
        text.includes('cap') || text.includes('raft') || text.includes('paxos') ||
        text.includes('2pc') || text.includes('3pc') || text.includes('一致性') ||
        text.includes('session') || text.includes('hystrix') || text.includes('降级')) {
        return '架构设计';
    }
    if (text.includes('node') || text.includes('python') || text.includes('java') ||
        text.includes('go') || text.includes('rust') || text.includes('后端') ||
        text.includes('api') || text.includes('数据库')) {
        return '后端开发';
    }
    if (text.includes('ai') || text.includes('llm') || text.includes('gpt') ||
        text.includes('claude') || text.includes('模型') || text.includes('人工智能')) {
        return 'AI 应用';
    }
    if (text.includes('工具') || text.includes('技巧') || text.includes('效率')) {
        return '工具技巧';
    }
    return '随笔杂谈';
}

// 读取现有文章
function readExistingArticles() {
    if (fs.existsSync(OUTPUT_FILE)) {
        return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    }
    return [];
}

// 发布文章
function publish() {
    // 确保目录存在
    if (!fs.existsSync(ARTICLES_DIR)) {
        fs.mkdirSync(ARTICLES_DIR, { recursive: true });
        console.log('📁 已创建 articles 文件夹');
    }

    if (!fs.existsSync(path.join(__dirname, 'data'))) {
        fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    }

    // 读取 Markdown 文件
    const files = fs.readdirSync(ARTICLES_DIR)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse(); // 最新的在前

    if (files.length === 0) {
        console.log('❗ articles 文件夹中没有 Markdown 文件');
        return;
    }

    const existingArticles = readExistingArticles();
    const existingIds = new Set(existingArticles.map(a => a.id));

    const newArticles = files.map((file, index) => {
        const filepath = path.join(ARTICLES_DIR, file);
        const content = fs.readFileSync(filepath, 'utf-8');
        const { frontMatter, content: mainContent } = parseFrontMatter(content);

        // 如果已有 id，保持不变；否则生成新 id
        let id = existingArticles.find(a => a.slug === extractSlug(file))?.id;
        if (!id) {
            id = Math.max(0, ...Array.from(existingIds)) + 1;
            existingIds.add(id);
        }

        return {
            id,
            title: frontMatter.title || extractTitle(mainContent),
            slug: extractSlug(file),
            excerpt: frontMatter.excerpt || extractExcerpt(mainContent),
            content: mainContent.trim(),
            date: frontMatter.date || new Date().toISOString().split('T')[0],
            category: frontMatter.category || autoCategory(mainContent, frontMatter.title || ''),
            tags: frontMatter.tags ? frontMatter.tags.split(',').map(t => t.trim()) : [],
            tagClass: frontMatter.tagClass || 'frontend',
            colorClass: frontMatter.colorClass || 'blue',
            likes: parseInt(frontMatter.likes) || 0,
            views: parseInt(frontMatter.views) || 0
        };
    });

    // 写入文件
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newArticles, null, 2), 'utf-8');

    console.log(`✅ 已发布 ${newArticles.length} 篇文章`);
    console.log(`📄 输出文件：${OUTPUT_FILE}`);
    console.log('\n文章列表:');
    newArticles.forEach(a => {
        console.log(`   - [${a.date}] ${a.title} (${a.category})`);
    });
}

// 运行
publish();
