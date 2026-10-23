# 陈星宇 · 个人作品集网站

纯静态站点（HTML + CSS + 原生 JS），无构建步骤，直接由 GitHub Pages 托管。

## 本地预览

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 目录结构

```
index.html        页面主体
style.css         基础样式
editorial.css     排版 / 视觉样式
app.js            页面逻辑
motion.js         滚动与动画（GSAP + ScrollTrigger + Lenis）
projects.js       项目数据
assets/           图片、视频等静态资源
vendor/           第三方库（GSAP / ScrollTrigger / Lenis / three.js / Vanta / hls.js）
```

## 部署

仓库 `main` 分支根目录即发布源，推送后 GitHub Pages 自动更新。
根目录下的 `.nojekyll` 用于跳过 Jekyll 构建，保证以 `_` 开头的目录也能正常访问。
