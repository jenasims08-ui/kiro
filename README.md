# 🏗️ BIM Daily - 建筑科技与BIM资讯每日汇总

每日自动汇总建筑科技、BIM、智慧建造、数字孪生等领域的最新资讯。

## 📋 功能特性

- **每日自动更新**：通过 GitHub Actions 每天自动抓取和生成建筑科技资讯
- **分类标签筛选**：支持按 BIM / 数字孪生 / 智慧建造 / AI / 政策 / 软件 分类浏览
- **响应式设计**：移动端和桌面端均有良好的阅读体验
- **纯静态部署**：零服务器成本，通过 GitHub Pages 免费托管
- **数据驱动**：资讯数据以 JSON 格式存储，易于扩展和维护

## 🗂️ 项目结构

```
├── site/                    # 网站静态文件（部署目录）
│   ├── index.html           # 主页
│   ├── css/style.css        # 样式
│   ├── js/app.js            # 前端渲染逻辑
│   └── data/                # 资讯数据（JSON）
│       ├── index.json       # 日期索引
│       ├── 2025-05-22.json  # 每日资讯
│       └── ...
├── scripts/                 # 自动化脚本
│   ├── fetch-news.js        # 资讯抓取/生成脚本
│   ├── update-index.js      # 索引更新脚本
│   └── package.json         # 脚本依赖
├── .github/workflows/
│   └── daily-update.yml     # GitHub Actions 工作流
└── README.md
```

## 🚀 快速开始

### 本地预览

```bash
# 进入网站目录并启动本地服务器
cd site
python -m http.server 8000
# 访问 http://localhost:8000
```

### 配置自动化

1. **设置 OpenAI API Key**：
   - 在仓库 Settings → Secrets and variables → Actions 中添加 `OPENAI_API_KEY`

2. **启用 GitHub Pages**：
   - Settings → Pages → Source 选择 "GitHub Actions"

3. **手动触发更新**：
   - Actions → Daily BIM News Update → Run workflow

### 手动添加资讯

在 `site/data/` 目录下创建日期命名的 JSON 文件，格式如下：

```json
{
  "date": "2025-05-22",
  "articles": [
    {
      "title": "资讯标题",
      "url": "https://example.com/article",
      "source": "来源媒体",
      "summary": "50-80字摘要描述",
      "tags": ["BIM", "AI"],
      "time": "09:30"
    }
  ]
}
```

然后运行索引更新：

```bash
cd scripts
npm install
node update-index.js
```

## 🔧 自定义配置

### 修改资讯分类

编辑 `site/index.html` 中的 `tag-filter` 区域和 `site/css/style.css` 中对应的标签颜色。

### 修改抓取关键词

编辑 `scripts/fetch-news.js` 中的 `SEARCH_TOPICS` 数组。

### 修改更新频率

编辑 `.github/workflows/daily-update.yml` 中的 `cron` 表达式。

## 📰 资讯覆盖领域

| 标签 | 覆盖内容 |
|------|----------|
| BIM | Revit、ArchiCAD、IFC标准、建筑信息模型 |
| 数字孪生 | 城市数字孪生、建筑数字化运维 |
| 智慧建造 | 装配式建筑、智能工地、机器人施工 |
| AI | 生成式设计、AI辅助建模、智能审图 |
| 政策 | 行业标准、政府文件、规范更新 |
| 软件 | 建筑软件更新、新工具发布 |

## 📄 License

MIT
