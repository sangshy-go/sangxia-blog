// ===== 分页修复补丁 - 2026-03-16 =====
// 只负责添加分页控件，不干扰文章列表渲染

(function() {
    console.log('🔧 [分页补丁] 脚本已加载');
    
    // 保存原始的 render 函数
    const originalRender = window.render;
    
    // 重写 render 函数
    window.render = function() {
        // 调用原始 render（渲染文章列表）
        if (originalRender) {
            originalRender();
        }
        
        // 等待 DOM 更新后再添加分页
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                addPagination();
            });
        });
    };
    
    // 添加分页的函数
    function addPagination() {
        // 获取当前状态
        const state = window.state;
        if (!state) return;
        
        const currentPage = state.pageNum;
        const filtered = window.filterArticles ? window.filterArticles() : [];
        const total = Math.ceil(filtered.length / state.pageSize);
        
        // 只有总页数 > 1 才添加分页
        if (total <= 1) return;
        
        // 查找 articles-wrapper
        const articlesWrapper = document.querySelector('.articles-wrapper');
        if (!articlesWrapper) return;
        
        // 移除旧的分页（如果有）
        const oldPagination = articlesWrapper.querySelector('.pagination-wrapper');
        if (oldPagination) {
            oldPagination.remove();
        }
        
        // 创建分页容器
        const paginationWrapper = document.createElement('div');
        paginationWrapper.className = 'pagination-wrapper';
        
        // 创建分页按钮容器
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        
        // 上一页按钮
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← 上一页';
        prevBtn.disabled = currentPage === 1;
        if (currentPage === 1) prevBtn.style.opacity = '0.5';
        prevBtn.onclick = function() {
            if (currentPage > 1) window.goToPage(currentPage - 1);
        };
        pagination.appendChild(prevBtn);
        
        // 页码按钮
        const showPages = [];
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= currentPage - 1 && i <= currentPage + 1)) {
                showPages.push(i);
            }
        }
        
        let lastPage = 0;
        showPages.forEach(pageNum => {
            if (pageNum - lastPage > 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.color = 'var(--text-light)';
                pagination.appendChild(ellipsis);
            }
            
            const btn = document.createElement('button');
            btn.textContent = pageNum.toString();
            if (pageNum === currentPage) {
                btn.className = 'active';
            }
            btn.onclick = function() {
                window.goToPage(pageNum);
            };
            pagination.appendChild(btn);
            
            lastPage = pageNum;
        });
        
        // 下一页按钮
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '下一页 →';
        nextBtn.disabled = currentPage >= total;
        if (currentPage >= total) nextBtn.style.opacity = '0.5';
        nextBtn.onclick = function() {
            if (currentPage < total) window.goToPage(currentPage + 1);
        };
        pagination.appendChild(nextBtn);
        
        // 页码信息
        const pageInfo = document.createElement('div');
        pageInfo.textContent = `第 ${currentPage} 页 / 共 ${total} 页 | 文章数：${filtered.length}`;
        pageInfo.style.textAlign = 'center';
        pageInfo.style.marginTop = '1rem';
        pageInfo.style.fontSize = '0.85rem';
        pageInfo.style.color = '#7c5cec';
        pageInfo.style.fontWeight = 'bold';
        
        // 组装
        paginationWrapper.appendChild(pagination);
        paginationWrapper.appendChild(pageInfo);
        articlesWrapper.appendChild(paginationWrapper);
        
        console.log(`✅ [分页补丁] 分页已添加 | 第 ${currentPage}/${total} 页 | 文章数：${filtered.length}`);
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'complete') {
        setTimeout(addPagination, 100);
    }
})();
