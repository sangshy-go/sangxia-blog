// ===== 分页修复补丁 - 2026-03-16 =====
// 在页面加载完成后，强制添加分页控件

(function() {
    console.log('🔧 [分页补丁] 脚本已加载');
    
    // 保存原始的 render 函数
    const originalRender = window.render;
    
    // 重写 render 函数
    window.render = function() {
        console.log('🔧 [分页补丁] render 被调用，当前 state.pageNum:', window.state?.pageNum);
        
        // 调用原始 render
        if (originalRender) {
            originalRender();
        }
        
        console.log('🔧 [分页补丁] 原始 render 完成，当前 state.pageNum:', window.state?.pageNum);
        
        // 延迟执行，确保 DOM 已经渲染
        setTimeout(() => {
            console.log('🔧 [分页补丁] setTimeout 触发，当前 state.pageNum:', window.state?.pageNum);
            addPagination();
        }, 10);
    };
    
    // 添加分页的函数
    function addPagination() {
        console.log('🔧 [分页补丁] === 开始添加分页 ===');
        
        // 获取当前状态（直接从全局 state 读取）
        const state = window.state;
        if (!state) {
            console.error('🔧 [分页补丁] 找不到 window.state');
            return;
        }
        
        const currentPage = state.pageNum;
        const filtered = window.filterArticles ? window.filterArticles() : [];
        const total = Math.ceil(filtered.length / state.pageSize);
        
        console.log('🔧 [分页补丁] 当前页码:', currentPage);
        console.log('🔧 [分页补丁] 文章数:', filtered.length);
        console.log('🔧 [分页补丁] 总页数:', total);
        
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
        
        // 移除旧的分页（如果有）
        const oldPagination = articlesWrapper.querySelector('.pagination-wrapper');
        if (oldPagination) {
            console.log('🔧 [分页补丁] 移除旧分页');
            oldPagination.remove();
        }
        
        console.log('🔧 [分页补丁] 创建新分页，当前页:', currentPage);
        
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
            console.log('🔧 [分页补丁] 点击上一页，目标页:', currentPage - 1);
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
                console.log('🔧 [分页补丁] 点击页码', pageNum);
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
            console.log('🔧 [分页补丁] 点击下一页，目标页:', currentPage + 1);
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
        
        console.log('🔧 [分页补丁] ✅ 分页添加成功！当前页:', currentPage);
    }
    
    console.log('🔧 [分页补丁] 重写 render 函数完成');
    
    // 如果页面已经加载，立即执行一次
    if (document.readyState === 'complete') {
        console.log('🔧 [分页补丁] 页面已加载，立即执行');
        setTimeout(() => {
            addPagination();
        }, 100);
    }
})();
