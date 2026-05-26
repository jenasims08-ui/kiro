/**
 * BIM Daily - 每日资讯抓取脚本
 * 
 * 使用 Google News RSS 搜索建筑科技/BIM相关真实新闻
 * 无需任何 API Key，完全免费
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'docs', 'data');

// 确保数据目录存在
if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
}

const today = new Date().toISOString().split('T')[0];

// 搜索关键词列表（Google News RSS 查询）
const SEARCH_QUERIES = [
    'BIM建筑信息模型',
    'Revit BIM software',
    'digital twin construction',
    '智慧建造 数字化',
    'BIM AI architecture',
    'buildingSMART IFC',
    'construction technology 2026',
    '装配式建筑 BIM',
];

// 标签关键词映射
const TAG_RULES = [
    { keywords: ['BIM', 'Revit', 'ArchiCAD', 'Tekla', 'IFC', 'buildingSMART', '建筑信息'], tag: 'BIM' },
    { keywords: ['digital twin', '数字孪生', 'twin'], tag: '数字孪生' },
    { keywords: ['smart construction', '智慧建造', '智慧工地', 'robot', '机器人', 'drone', '无人机', '装配式'], tag: '智慧建造' },
    { keywords: ['AI', 'artificial intelligence', '人工智能', 'machine learning', 'GPT', 'generative'], tag: 'AI' },
    { keywords: ['policy', '政策', 'standard', '标准', 'ISO', 'regulation', '规范', '指导意见'], tag: '政策' },
    { keywords: ['software', '软件', 'release', '发布', 'update', '更新', 'version', 'plugin', '插件'], tag: '软件' },
];

function assignTags(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const tags = [];
    for (const rule of TAG_RULES) {
        if (rule.keywords.some(kw => text.includes(kw.toLowerCase()))) {
            tags.push(rule.tag);
        }
    }
    // 默认至少有一个标签
    if (tags.length === 0) tags.push('BIM');
    return [...new Set(tags)].slice(0, 3); // 最多3个标签
}

// HTTP(S) GET 请求
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 BIMDaily/1.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // 跟随重定向
                return fetchUrl(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

// 解析 Google News RSS XML
function parseRssItems(xml) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];

        const title = extractTag(itemXml, 'title');
        const link = extractTag(itemXml, 'link');
        const pubDate = extractTag(itemXml, 'pubDate');
        const source = extractTag(itemXml, 'source');
        const description = extractTag(itemXml, 'description');

        if (title && link) {
            items.push({
                title: decodeHtmlEntities(title),
                url: link,
                source: source ? decodeHtmlEntities(source) : extractDomain(link),
                description: decodeHtmlEntities(stripHtml(description || '')),
                pubDate: pubDate ? new Date(pubDate) : new Date(),
            });
        }
    }

    return items;
}

function extractTag(xml, tag) {
    // 尝试 CDATA
    const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`);
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();

    // 普通标签
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
}

function decodeHtmlEntities(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
}

function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').trim();
}

function extractDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return 'Unknown';
    }
}

// 从 Google News RSS 获取资讯
async function fetchFromGoogleNews(query) {
    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`;

    try {
        const xml = await fetchUrl(rssUrl);
        return parseRssItems(xml);
    } catch (err) {
        console.warn(`⚠️  查询 "${query}" 失败: ${err.message}`);
        return [];
    }
}

// 去重
function deduplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
        // 用标题前20个字符去重
        const key = article.title.substring(0, 20).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// 过滤：只保留最近14天的文章
function filterRecent(articles, days = 14) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return articles.filter(a => a.pubDate >= cutoff);
}

async function main() {
    console.log(`🏗️  BIM Daily - 正在抓取 ${today} 的真实资讯...`);
    console.log(`📡 使用 Google News RSS，共 ${SEARCH_QUERIES.length} 个关键词\n`);

    let allArticles = [];

    for (const query of SEARCH_QUERIES) {
        console.log(`   🔍 搜索: ${query}`);
        const items = await fetchFromGoogleNews(query);
        console.log(`      找到 ${items.length} 条结果`);
        allArticles.push(...items);

        // 避免请求过快
        await new Promise(r => setTimeout(r, 1000));
    }

    // 去重
    allArticles = deduplicateArticles(allArticles);
    console.log(`\n📊 去重后共 ${allArticles.length} 条`);

    // 只保留最近14天
    allArticles = filterRecent(allArticles, 14);
    console.log(`📅 最近14天: ${allArticles.length} 条`);

    // 按时间排序（最新在前）
    allArticles.sort((a, b) => b.pubDate - a.pubDate);

    // 取前15条
    const topArticles = allArticles.slice(0, 15);

    // 格式化为输出格式
    const articles = topArticles.map(item => {
        const hours = item.pubDate.getHours().toString().padStart(2, '0');
        const minutes = item.pubDate.getMinutes().toString().padStart(2, '0');
        return {
            title: item.title,
            url: item.url,
            source: item.source,
            summary: item.description.substring(0, 120) || item.title,
            tags: assignTags(item.title, item.description),
            time: `${hours}:${minutes}`,
        };
    });

    const data = {
        date: today,
        articles,
    };

    const outputPath = join(DATA_DIR, `${today}.json`);
    writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`\n✅ 成功生成 ${articles.length} 条真实资讯`);
    console.log(`📁 文件已保存: ${outputPath}`);

    // 更新 index.json
    updateIndex();
}

function updateIndex() {
    const files = readdirSync(DATA_DIR);
    const dates = files
        .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .map(f => f.replace('.json', ''))
        .sort((a, b) => b.localeCompare(a))
        .slice(0, 14); // 只保留最近14天

    const index = { dates, lastUpdated: new Date().toISOString() };
    writeFileSync(join(DATA_DIR, 'index.json'), JSON.stringify(index, null, 2), 'utf-8');
    console.log(`📋 索引已更新: ${dates.length} 天的数据`);
}

main().catch(err => {
    console.error('❌ 抓取失败:', err.message);
    process.exit(1);
});
