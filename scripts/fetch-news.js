/**
 * BIM Daily - 每日资讯抓取脚本
 *
 * 使用 OpenAI API 搜索和整理建筑科技/BIM相关资讯
 * 可扩展接入 Google News RSS、Bing News API 等数据源
 */

import { OpenAI } from 'openai';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'site', 'data');

// 确保数据目录存在
if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
}

const today = new Date().toISOString().split('T')[0];

// 搜索关键词列表
const SEARCH_TOPICS = [
    'BIM技术 最新动态',
    '建筑信息模型 新闻',
    '智慧建造 数字化',
    '建筑科技 AI',
    '数字孪生 建筑',
    'Revit Archicad 更新',
    '装配式建筑 技术',
    '绿色建筑 BIM',
];

async function fetchWithAI() {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `你是一个建筑科技资讯编辑。请根据以下主题，生成今天(${today})的建筑科技和BIM领域资讯汇总。

主题领域：
${SEARCH_TOPICS.join('\n')}

请生成5-8条近期真实可能存在的资讯，每条包含：
- title: 标题（中文，简洁有吸引力）
- url: 来源链接（可用占位符）
- source: 来源媒体名称
- summary: 50-80字摘要
- tags: 标签数组，可选值为 BIM/数字孪生/智慧建造/AI/政策/软件
- time: 发布时间 HH:MM 格式

请直接返回JSON格式，结构如下：
{
  "date": "${today}",
  "articles": [...]
}`;

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
}

async function main() {
    console.log(`🏗️  BIM Daily - 正在生成 ${today} 的资讯...`);

    try {
        const data = await fetchWithAI();

        const outputPath = join(DATA_DIR, `${today}.json`);
        writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

        console.log(`✅ 成功生成 ${data.articles.length} 条资讯`);
        console.log(`📁 文件已保存: ${outputPath}`);
    } catch (err) {
        console.error('❌ 生成失败:', err.message);

        // 如果AI生成失败，创建一个空的占位文件
        const fallback = { date: today, articles: [] };
        const outputPath = join(DATA_DIR, `${today}.json`);
        writeFileSync(outputPath, JSON.stringify(fallback, null, 2), 'utf-8');

        process.exit(1);
    }
}

main();
