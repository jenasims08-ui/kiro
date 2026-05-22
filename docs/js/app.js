/**
 * BIM Daily - 建筑科技资讯每日汇总
 * 前端渲染逻辑
 */

(function() {
    'use strict';

    const newsFeed = document.getElementById('newsFeed');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');
    const tagFilter = document.getElementById('tagFilter');

    let allData = [];
    let currentTag = 'all';

    // 获取最近N天的日期列表
    function getRecentDates(days = 7) {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    }

    // 加载JSON数据
    async function loadData() {
        const dates = getRecentDates(7);
        const results = [];

        for (const date of dates) {
            try {
                const resp = await fetch(`data/${date}.json`);
                if (resp.ok) {
                    const data = await resp.json();
                    results.push(data);
                }
            } catch (e) {
                // 该日期无数据，跳过
            }
        }

        return results;
    }

    // 渲染新闻列表
    function renderNews(data, filterTag) {
        newsFeed.innerHTML = '';
        let hasContent = false;

        for (const day of data) {
            let articles = day.articles;

            if (filterTag && filterTag !== 'all') {
                articles = articles.filter(a => a.tags.includes(filterTag));
            }

            if (articles.length === 0) continue;
            hasContent = true;

            const section = document.createElement('div');
            section.className = 'day-section';

            const dateStr = formatDate(day.date);
            section.innerHTML = `
                <div class="day-header">
                    <span class="day-date">${dateStr}</span>
                    <span class="day-count">${articles.length} 条资讯</span>
                </div>
            `;

            for (const article of articles) {
                const card = createNewsCard(article);
                section.appendChild(card);
            }

            newsFeed.appendChild(section);
        }

        noData.style.display = hasContent ? 'none' : 'block';
    }

    // 创建新闻卡片
    function createNewsCard(article) {
        const card = document.createElement('a');
        card.className = 'news-card';
        card.href = article.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        const tagsHtml = article.tags.map(tag =>
            `<span class="news-tag" data-tag="${tag}">${tag}</span>`
        ).join('');

        card.innerHTML = `
            <div class="news-card-header">
                <h3 class="news-title">${escapeHtml(article.title)}</h3>
            </div>
            <div class="news-meta">
                <span class="news-source">${escapeHtml(article.source)}</span>
                <span class="news-time">${article.time || ''}</span>
                <div class="news-tags">${tagsHtml}</div>
            </div>
            <p class="news-summary">${escapeHtml(article.summary)}</p>
        `;

        return card;
    }

    // 格式化日期
    function formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));

        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekday = weekdays[date.getDay()];

        const month = date.getMonth() + 1;
        const day = date.getDate();

        let label = `${month}月${day}日 ${weekday}`;
        if (diffDays === 0) label = `今天 · ${label}`;
        else if (diffDays === 1) label = `昨天 · ${label}`;

        return label;
    }

    // HTML转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 标签过滤事件
    tagFilter.addEventListener('click', function(e) {
        if (!e.target.classList.contains('tag-btn')) return;

        tagFilter.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        currentTag = e.target.dataset.tag;
        renderNews(allData, currentTag);
    });

    // 初始化
    async function init() {
        try {
            allData = await loadData();
            loading.style.display = 'none';

            if (allData.length === 0) {
                noData.style.display = 'block';
                return;
            }

            renderNews(allData, currentTag);
        } catch (err) {
            loading.innerHTML = '<p>加载失败，请刷新重试</p>';
            console.error('加载数据失败:', err);
        }
    }

    init();
})();
