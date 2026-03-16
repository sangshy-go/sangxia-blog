#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
文章置顶管理脚本

用法：
    python3 pin-article.py list              # 列出所有置顶文章
    python3 pin-article.py add <id>          # 置顶某篇文章
    python3 pin-article.py remove <id>       # 取消置顶
    python3 pin-article.py clear             # 取消所有置顶
"""

import json
import sys
from pathlib import Path

def load_articles():
    data_path = Path(__file__).parent.parent / 'data' / 'articles.json'
    with open(data_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_articles(articles):
    data_path = Path(__file__).parent.parent / 'data' / 'articles.json'
    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

def list_pinned(articles):
    pinned = [a for a in articles if a.get('pinned', False)]
    if not pinned:
        print('暂无置顶文章')
        return
    
    print(f'📌 置顶文章（{len(pinned)}篇）:\n')
    for i, article in enumerate(pinned, 1):
        print(f'{i}. [ID:{article["id"]}] {article["title"][:50]}...')
        print(f'   分类：{article["category"]} | 日期：{article["date"]}')
        print()

def add_pin(articles, article_id):
    for article in articles:
        if article['id'] == article_id:
            article['pinned'] = True
            print(f'✅ 已置顶：{article["title"][:50]}...')
            return True
    print(f'❌ 未找到文章 ID: {article_id}')
    return False

def remove_pin(articles, article_id):
    for article in articles:
        if article['id'] == article_id:
            article['pinned'] = False
            print(f'✅ 已取消置顶：{article["title"][:50]}...')
            return True
    print(f'❌ 未找到文章 ID: {article_id}')
    return False

def clear_all(articles):
    count = sum(1 for a in articles if a.get('pinned', False))
    for article in articles:
        article['pinned'] = False
    print(f'✅ 已取消所有 {count} 篇置顶文章')

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    articles = load_articles()
    command = sys.argv[1]
    
    if command == 'list':
        list_pinned(articles)
    
    elif command == 'add':
        if len(sys.argv) < 3:
            print('❌ 请提供文章 ID')
            print('用法：python3 pin-article.py add <id>')
            return
        article_id = int(sys.argv[2])
        if add_pin(articles, article_id):
            save_articles(articles)
    
    elif command == 'remove':
        if len(sys.argv) < 3:
            print('❌ 请提供文章 ID')
            print('用法：python3 pin-article.py remove <id>')
            return
        article_id = int(sys.argv[2])
        if remove_pin(articles, article_id):
            save_articles(articles)
    
    elif command == 'clear':
        clear_all(articles)
        save_articles(articles)
    
    else:
        print(f'❌ 未知命令：{command}')
        print(__doc__)

if __name__ == '__main__':
    main()
