// ===== 分页修复补丁 - 2026-03-16 =====
// 在页面加载完成后，强制添加分页控件

(function() {
    console.log('🔧 [分页补丁] 脚本已加载');
    
    // 保存原始的 render 函数
    const originalRender = window.render;
    
    // 重写 render 函数
    window.render = function() {
        console.log('🔧 [分页补丁] render 被调用，当前页码:', window.state?.pageNum);
        
        // 调用原始 render
        if (originalRender) {
            originalRender();
        }
        
        // 延迟执行，确保 DOM 已经渲染
        setTimeout(() => {
            console.log('🔧 [分页补丁] 开始检查分页');
            
            // 检查是否已经有分页
            const existingPagination = document.querySelector('.pagination-wrapper');
            if (existingPagination) {
                console.log('🔧 [分页补丁] 已存在分页，跳过');
                return;
            }
            
            // 获取当前状态
            const filtered = window.filterArticles ? window.filterArticles() : [];
            const total = Math.ceil(filtered.length / (window.state?.pageSize || 15));
            const currentPage = window.state?.pageNum || 1;
            
            console.log('🔧 [分页补丁] 文章数:', filtered.length, '总页数:', total, '当前页:', currentPage);
            
            // 只有总页数 > 1 才添加分页
            if (total <= 1) {
                console.log('🔧 [分页补丁] 总页数 <= 1，不添加分页');
                return;
            }
            
            // 查找 articles-wrapper
            const articlesWrapper = document.querySelector('.articles-wrapper');
            if (!articlesWrapper) {
                console.error('🔧 [分页补丁] 找不到 .articles-wrapper');
                return;
            }
            
            console.log('🔧 [分页补丁] 找到 articles-wrapper，开始添加分页');
            
            // 创建分页容器
            const paginationWrapper = document.createElement('div');
            paginationWrapper.className = 'pagination-wrapper';
            paginationWrapper.style.cssText = 'margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border-color);display:flex;flex-direction:column;align-items:center;width:100%;';
            
            // 创建分页按钮容器
            const pagination = document.createElement('div');
            pagination.className = 'pagination';
            pagination.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;';
            
            // 上一页按钮
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '← 上一页';
            prevBtn.disabled = currentPage === 1;
            prevBtn.style.cssText = 'padding:0.5rem 1rem;border:1px solid var(--border-color);background:var(--card-bg);color:var(--text-muted);border-radius:6px;cursor:' + (currentPage === 1 ? 'not-allowed' : 'pointer');
            prevBtn.onclick = () => { if (currentPage > 1) window.goToPage(currentPage - 1); };
            pagination.appendChild(prevBtn);
            
            // 页码按钮
            for (let i = 1; i <= total; i++) {
                if (i === 1 || i === total || (i >= currentPage - 1 && i <= currentPage + 1)) {
                    if (i > 1 && i < currentPage - 1) {
                        const ellipsis = document.createElement('span');
                        ellipsis.textContent = '...';
                        ellipsis.style.color = 'var(--text-light)';
                        pagination.appendChild(ellipsis);
                    }
                    
                    const btn = document.createElement('button');
                    btn.textContent = i.toString();
                    btn.className = i === currentPage ? 'active' : '';
                    btn.style.cssText = 'padding:0.5rem 1rem;border:1px solid ' + (i === currentPage ? '#7c5cec' : 'var(--border-color)') + ';background:' + (i === currentPage ? '#7c5cec' : 'var(--card-bg)') + ';color:' + (i === currentPage ? '#fff' : 'var(--text-muted)') + ';border-radius:6px;cursor:pointer;font-weight:' + (i === currentPage ? 'bold' : 'normal');
                    btn.onclick = () => window.goToPage(i);
                    pagination.appendChild(btn);
                }
            }
            
            // 下一页按钮
            const nextBtn = document.createElement('button');
            nextBtn.textContent = '下一页 →';
            nextBtn.disabled = currentPage >= total;
            nextBtn.style.cssText = 'padding:0.5rem 1rem;border:1px solid var(--border-color);background:var(--card-bg);color:var(--text-muted);border-radius:6px;cursor:' + (currentPage >= total ? 'not-allowed' : 'pointer');
            nextBtn.onclick = () => { if (currentPage < total) window.goToPage(currentPage + 1); };
            pagination.appendChild(nextBtn);
            
            // 页码信息
            const pageInfo = document.createElement('div');
            pageInfo.textContent = `第 ${currentPage} 页 / 共 ${total} 页 | 文章数：${filtered.length}`;
            pageInfo.style.cssText = 'text-align:center;margin-top:1rem;font-size:0.85rem;color:#7c5cec;font-weight:bold;';
            
            // 组装
            paginationWrapper.appendChild(pagination);
            paginationWrapper.appendChild(pageInfo);
            articlesWrapper.appendChild(paginationWrapper);
            
            console.log('🔧 [分页补丁] ✅ 分页添加成功！');
        }, 100);
    };
    
    console.log('🔧 [分页补丁] 重写 render 函数完成');
    
    // 如果页面已经加载，立即执行一次
    if (document.readyState === 'complete') {
        console.log('🔧 [分页补丁] 页面已加载，立即执行');
        setTimeout(() => {
            const existingPagination = document.querySelector('.pagination-wrapper');
            if (!existingPagination && window.render) {
                console.log('🔧 [分页补丁] 触发 render');
                window.render();
            }
        }, 200);
    }
})();
