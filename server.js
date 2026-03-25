const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8080;

// 数据文件路径
const STATS_FILE = path.join(__dirname, 'data', 'stats.json');
const ARTICLES_FILE = path.join(__dirname, 'data', 'articles.json');

// 中间件 - 增加 JSON 大小限制到 10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// 加载统计数据
function loadStats() {
    if (fs.existsSync(STATS_FILE)) {
        const content = fs.readFileSync(STATS_FILE, 'utf8');
        return JSON.parse(content);
    }
    return {};
}

// 保存统计数据到文件
function saveStats(stats) {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
}

// 获取初始统计数据（基于文章标题和质量）
function getInitialStats(title, category) {
    let baseViews = 1000;
    let baseLikes = 50;

    const hotTopics = ['Redis', 'MySQL', '分布式', '微服务', 'Docker', 'Kubernetes', 'Kafka', 'Spring', 'AI', '大模型', 'Claude', 'GPT', '算法', '数据结构'];
    const mediumTopics = ['限流', '消息队列', 'Netty', '设计模式', 'Vue', 'React', 'JavaScript', 'Node.js', 'Git', 'Linux'];
    const normalTopics = ['随笔', '工具', '技巧', '教程', '入门', '简介', '安装', '配置'];

    const titleLower = title.toLowerCase();
    let viewMultiplier = 1;
    let likeMultiplier = 1;

    if (hotTopics.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
        viewMultiplier = 8 + Math.random() * 12;
        likeMultiplier = 8 + Math.random() * 12;
    } else if (mediumTopics.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
        viewMultiplier = 4 + Math.random() * 6;
        likeMultiplier = 4 + Math.random() * 6;
    } else if (normalTopics.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
        viewMultiplier = 1 + Math.random() * 4;
        likeMultiplier = 1 + Math.random() * 4;
    } else {
        viewMultiplier = 1 + Math.random() * 4;
        likeMultiplier = 1 + Math.random() * 4;
    }

    // 特殊文章加成
    if (title.includes('系列') || title.includes('（一') || title.includes('（1')) {
        viewMultiplier *= 1.3;
        likeMultiplier *= 1.3;
    }
    if (title.includes('实战') || title.includes('实践') || title.includes('案例')) {
        viewMultiplier *= 1.5;
        likeMultiplier *= 1.5;
    }
    if (title.includes('面试') || title.includes('面试题')) {
        viewMultiplier *= 2;
        likeMultiplier *= 1.8;
    }

    baseViews = Math.floor(baseViews * viewMultiplier);
    baseLikes = Math.floor(baseLikes * likeMultiplier);

    // 限制范围
    baseViews = Math.min(Math.max(baseViews, 1000), 20000);
    baseLikes = Math.min(Math.max(baseLikes, 50), 1000);

    return { baseViews, baseLikes };
}

// API: 获取所有文章统计数据
app.get('/api/articles/stats', (req, res) => {
    const stats = loadStats();
    res.json(stats);
});

// API: 增加文章阅读量
app.post('/api/articles/:id/view', (req, res) => {
    const { id } = req.params;
    const { title, category } = req.body;

    const stats = loadStats();

    if (!stats[id]) {
        // 首次访问，生成初始值
        const { baseViews, baseLikes } = getInitialStats(title, category);
        stats[id] = {
            views: baseViews,
            likes: baseLikes,
            initialized: true
        };
    }

    stats[id].views++;
    saveStats(stats);

    res.json({
        views: stats[id].views,
        likes: stats[id].likes
    });
});

// API: 增加文章点赞数
app.post('/api/articles/:id/like', (req, res) => {
    const { id } = req.params;
    const { title, category } = req.body;

    const stats = loadStats();

    if (!stats[id]) {
        // 首次点赞，生成初始值
        const { baseViews, baseLikes } = getInitialStats(title, category);
        stats[id] = {
            views: baseViews,
            likes: baseLikes,
            initialized: true
        };
    }

    stats[id].likes++;
    saveStats(stats);

    res.json({
        views: stats[id].views,
        likes: stats[id].likes
    });
});

// API: 批量初始化文章统计数据
app.post('/api/articles/init', (req, res) => {
    const { articles } = req.body;
    const stats = loadStats();

    let initialized = false;

    articles.forEach(article => {
        if (!stats[article.id]) {
            const { baseViews, baseLikes } = getInitialStats(article.title, article.category);
            stats[article.id] = {
                views: baseViews,
                likes: baseLikes,
                initialized: true
            };
            initialized = true;
        }
    });

    if (initialized) {
        saveStats(stats);
    }

    res.json({ success: true, count: Object.keys(stats).length });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`博客服务器运行在 http://localhost:${PORT}`);
    console.log(`API 端点:`);
    console.log(`  GET  /api/articles/stats - 获取所有统计数据`);
    console.log(`  POST /api/articles/:id/view - 增加阅读量`);
    console.log(`  POST /api/articles/:id/like - 增加点赞数`);
    console.log(`  POST /api/articles/init - 批量初始化统计数据`);
});
