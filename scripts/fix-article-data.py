#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
修复文章数据：
1. 将所有文章归类到 4 个大分类：后端开发、随笔杂谈、AI 应用、架构设计
2. 清理标签格式（去掉方括号）
3. 确保每篇文章都有有效的标签
"""

import json
import re
from pathlib import Path

# 4 个大分类
VALID_CATEGORIES = ['后端开发', '随笔杂谈', 'AI 应用', '架构设计']

# 分类映射规则
CATEGORY_MAPPING = {
    '前端开发': '后端开发',  # 前端文章归到后端开发
    '工具技巧': '架构设计',  # 工具技巧归到架构设计
}

# 标签清理规则
def clean_tags(tags):
    """清理标签格式，去掉方括号和空白"""
    if tags is None:
        return []
    
    if isinstance(tags, str):
        # 字符串转列表
        tags = tags.replace('[', '').replace(']', '').replace('"', '').replace("'", '')
        tags = [t.strip() for t in tags.split(',') if t.strip()]
    
    if not isinstance(tags, list):
        return []
    
    cleaned = []
    for tag in tags:
        # 去掉方括号和空白
        t = str(tag).replace('[', '').replace(']', '').replace('"', '').replace("'", '').strip()
        if t and t != '':
            cleaned.append(t)
    
    return cleaned

# 根据文章内容自动分配标签
def auto_assign_tags(article):
    """根据标题和分类自动分配标签"""
    title = article.get('title', '').lower()
    category = article.get('category', '')
    
    tags = []
    
    # 根据分类分配标签
    if 'java' in title or 'spring' in title or 'jvm' in title:
        tags.append('Java')
    if 'redis' in title:
        tags.append('Redis')
    if 'mysql' in title or 'sql' in title or '数据库' in title:
        tags.append('MySQL')
    if 'docker' in title or '容器' in title or 'k8s' in title:
        tags.append('Docker')
    if 'kafka' in title or 'mq' in title or '消息' in title:
        tags.append('Kafka')
    if '分布式' in title or '微服务' in title:
        tags.append('分布式')
    if '限流' in title:
        tags.append('限流')
    if '算法' in title or '数据结构' in title:
        tags.append('算法')
    if '设计模式' in title or 'solid' in title:
        tags.append('设计模式')
    if 'ai' in title or '大模型' in title or 'llm' in title:
        tags.append('AI')
    if '前端' in title or 'vue' in title or 'react' in title:
        tags.append('前端')
    if '随笔' in title or '杂谈' in title or '记录' in title:
        tags.append('随笔')
    
    # 如果没有标签，使用分类作为标签
    if not tags:
        tags.append(category)
    
    return tags

def main():
    # 读取文章数据
    data_path = Path(__file__).parent.parent / 'data' / 'articles.json'
    with open(data_path, 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    print(f'读取文章：{len(articles)}篇\n')
    
    # 统计数据
    stats = {
        'category_fixed': 0,
        'tags_cleaned': 0,
        'tags_auto_assigned': 0,
    }
    
    fixed_articles = []
    
    for article in articles:
        # 1. 修复分类
        old_category = article.get('category', '')
        if old_category not in VALID_CATEGORIES:
            new_category = CATEGORY_MAPPING.get(old_category, '后端开发')
            article['category'] = new_category
            stats['category_fixed'] += 1
            print(f'分类修复：[{old_category}] → [{new_category}] - {article["title"][:30]}...')
        
        # 2. 清理标签
        old_tags = article.get('tags', [])
        cleaned_tags = clean_tags(old_tags)
        
        # 如果清理后没有标签，自动分配
        if not cleaned_tags:
            cleaned_tags = auto_assign_tags(article)
            stats['tags_auto_assigned'] += 1
        elif cleaned_tags != old_tags:
            stats['tags_cleaned'] += 1
        
        article['tags'] = cleaned_tags
        fixed_articles.append(article)
    
    # 保存修复后的数据
    output_path = Path(__file__).parent.parent / 'data' / 'articles.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(fixed_articles, f, ensure_ascii=False, indent=2)
    
    print(f'\n===== 修复完成 =====')
    print(f'修复分类：{stats["category_fixed"]}篇')
    print(f'清理标签：{stats["tags_cleaned"]}篇')
    print(f'自动分配标签：{stats["tags_auto_assigned"]}篇')
    print(f'\n新数据已保存到：{output_path}')
    
    # 验证修复结果
    print(f'\n===== 验证结果 =====')
    category_count = {}
    for article in fixed_articles:
        cat = article.get('category', '')
        category_count[cat] = category_count.get(cat, 0) + 1
    
    print('各大分类文章数:')
    for cat in VALID_CATEGORIES:
        count = category_count.get(cat, 0)
        print(f'  {cat}: {count}篇 ({count/len(fixed_articles)*100:.1f}%)')
    
    # 检查是否有无效分类
    invalid_cats = [cat for cat in category_count if cat not in VALID_CATEGORIES]
    if invalid_cats:
        print(f'\n❌ 仍有无效分类：{invalid_cats}')
    else:
        print(f'\n✅ 所有文章都已归类到 4 个大分类')
    
    # 检查标签
    articles_without_tags = [a for a in fixed_articles if not a.get('tags')]
    if articles_without_tags:
        print(f'❌ 仍有 {len(articles_without_tags)} 篇文章没有标签')
    else:
        print(f'✅ 所有文章都有标签')

if __name__ == '__main__':
    main()
