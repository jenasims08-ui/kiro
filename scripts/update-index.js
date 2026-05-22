/**
 * 更新 data/index.json 索引文件
 * 扫描 site/data/ 目录下的所有日期JSON文件并生成索引
 */

import { readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'site', 'data');

function updateIndex() {
    const files = readdirSync(DATA_DIR);

    const dates = files
        .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .map(f => f.replace('.json', ''))
        .sort((a, b) => b.localeCompare(a)); // 降序排列

    const index = {
        dates,
        lastUpdated: new Date().toISOString(),
    };

    const outputPath = join(DATA_DIR, 'index.json');
    writeFileSync(outputPath, JSON.stringify(index, null, 2), 'utf-8');

    console.log(`✅ 索引已更新: ${dates.length} 天的数据`);
}

updateIndex();
