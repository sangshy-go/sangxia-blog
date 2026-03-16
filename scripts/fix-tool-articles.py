#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
将工具技巧类文章从架构设计归类到后端开发
"""

import json
from pathlib import Path

# 读取数据
data_path = Path(__file__).parent.parent / 'data' / 'articles.json'
with open(data_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 工具技巧关键词 → 后端开发
tool_keywords = ['git', 'github', 'eclipse', 'chrome', 'sql', '插件', '工具', 'idea', 'maven', 'gradle']

fixed_count = 0
for article in data:
    title = article['title'].lower()
    # 如果当前是架构设计，但标题包含工具关键词，改为后端开发
    if article['category'] == '架构设计':
        if any(kw in title for kw in tool_keywords):
            old_category = article['category']
            article['category'] = '后端开发'
            fixed_count += 1
            print(f'修复：[{old_category}] → [后端开发] - {article["title"][:50]}...')

# 保存
output_path = Path(__file__).parent.parent / 'data' / 'articles.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'\n✅ 修复了 {fixed_count} 篇文章')

# 验证
categories = {}
for a in data:
    cat = a.get('category', '')
    categories[cat] = categories.get(cat, 0) + 1

print('\n分类统计:')
for cat, count in sorted(categories.items()):
    print(f'  {cat}: {count}篇 ({count/len(data)*100:.1f}%)')

print(f'\n总文章数：{len(data)}')
print(f'每页 15 篇，总页数：{(len(data)+14)//15}')
