#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
数据清洗脚本 - 清理文章数据中的特殊字符
防止 HTML 注入和 XSS 攻击
"""

import json
import html
from pathlib import Path

def clean_text(text):
    """清理文本中的特殊字符"""
    if not text:
        return ''
    
    # HTML 转义
    text = html.escape(text)
    
    # 移除可能的危险字符
    dangerous_chars = {
        '`': '`',  # 反引号
        '\x00': '',  # 空字符
    }
    
    for char, replacement in dangerous_chars.items():
        text = text.replace(char, replacement)
    
    return text

def main():
    data_path = Path(__file__).parent.parent / 'data' / 'articles.json'
    
    with open(data_path, 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    print(f'读取文章：{len(articles)}篇\n')
    
    cleaned_count = 0
    for article in articles:
        # 清理所有文本字段
        fields_to_clean = ['title', 'excerpt', 'content', 'category']
        
        for field in fields_to_clean:
            if field in article and isinstance(article[field], str):
                original = article[field]
                cleaned = clean_text(original)
                if original != cleaned:
                    article[field] = cleaned
                    cleaned_count += 1
                    print(f'清理文章 {article["id"]}: {field} 字段')
    
    # 保存清理后的数据
    backup_path = data_path.with_suffix('.json.backup')
    output_path = data_path
    
    # 备份原文件
    import shutil
    shutil.copy2(output_path, backup_path)
    print(f'\n已备份原文件：{backup_path}')
    
    # 保存清理后的数据
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    
    print(f'\n✅ 清理完成！')
    print(f'   清理了 {cleaned_count} 个字段')
    print(f'   数据已保存到：{output_path}')
    
    # 验证
    print(f'\n===== 验证结果 =====')
    dangerous_found = False
    for article in articles[:10]:
        for field in ['title', 'excerpt']:
            if field in article:
                if '`' in article[field] or '<script' in article[field].lower():
                    print(f'⚠️  文章 {article["id"]} 的 {field} 仍包含危险字符')
                    dangerous_found = True
    
    if not dangerous_found:
        print('✅ 前 10 篇文章验证通过，无危险字符')

if __name__ == '__main__':
    main()
