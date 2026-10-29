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

## 视频播放与画质

点击作品后才加载视频。存在 `film-lite.mp4` 的作品默认使用流畅版，可在播放器中切换原画，保留观看进度和暂停状态。原文件 `film.mp4` 保持不变。

流畅版采用 H.264、最长宽度 960 像素、CRF 26、最大视频码率 650 kb/s、2 秒关键帧间隔，并将 MP4 索引前置；原音频直接复制。只有实际体积减少至少 20% 的版本才收录到 `video-sources.js`。非遗采访和冬日纪事原文件已较小，因此继续使用原文件。

验证播放器：`node tests/player.test.cjs`。

可在播放脚本前设置 `window.PORTFOLIO_MEDIA_BASE` 为自己的媒体目录地址，目录仍需保持 `作品 ID/film.mp4` 和 `作品 ID/film-lite.mp4` 结构。减小文件可降低所需带宽，但无法保证 GitHub Pages 在所有地区的连接速度。
