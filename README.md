# MACC Lab Website

这个目录是研究团队的完整首页，包含七个中心动效版本。默认 `index.html` 使用 C-V3，记录在 `site.config.json` 中。

甲方日常维护、导航与正文同步排序、方案切换、成员分组、招生联系及论文引用配置，请看 [甲方维护说明](./docs/甲方维护说明.md)。

仓库：[Ex1st-hash/macc-lab](https://github.com/Ex1st-hash/macc-lab)。GitHub Pages 发布成功后的首页地址为 https://ex1st-hash.github.io/macc-lab/ ，默认 C-V3；其他版本在该地址后添加对应 HTML 文件名即可访问。

当前为设计预览，示例成员、招生、联系方式和引用数据不代表团队正式资料。发布采用手动工作流：在仓库 Settings > Pages 选择 GitHub Actions，然后在 Actions > Publish Website 中运行 Run workflow。后续提交代码后也需手动发布，避免未确认的修改直接上线。

切换默认首页不需要原始反馈包：`npm run select:concept -- A-V2`。共享内容与功能不会丢失。

## 查看七个版本

运行 `start.bat` 后，使用它显示的地址打开以下页面。当前预览地址为 `http://127.0.0.1:4173/`。

| 方案 | 页面 |
| --- | --- |
| A-V1 | [A-V1.html](./A-V1.html) |
| A-V2 | [A-V2.html](./A-V2.html) |
| A-V3 | [A-V3.html](./A-V3.html) |
| B-V3 | [B-V3.html](./B-V3.html) |
| C-V1 | [C-V1.html](./C-V1.html) |
| C-V2 | [C-V2.html](./C-V2.html) |
| C-V3 | [C-V3.html](./C-V3.html) |

七个页面共享团队、新闻、成员、论文、项目、成果和页脚内容，未收到正式资料的部分使用示例。中心画布的绘制代码直接来自反馈包，包含对应方案的节点、连线、波纹、地球数据和光照。A、B 的环形光场与 C 系列各自的构图比例同步保留。C-V3 桌面端额外扩展右侧画布，避免外圈被方形边界裁切；导入器只适配画布尺寸和清屏范围，内部几何及动效不变。

桌面上的 A-V1、A-V2、A-V3、B-V3 按导航栏下方的可视区域居中，并根据窗口高度为完整环形光场预留空间。C 系列保留原方案的非对称构图。正文滚动不改变动效位置；接近页脚时继续使用 `scripts/app.js` 原有的渐隐和轻微上移公式，返回上方时恢复。700px 及以下保留概念稿的移动布局，将动效完整放在介绍与新闻之间；原首页在这个尺寸原本不显示中心碑形图形。

## 文件结构

- `index.html`、`A-V1.html` 等：生成的完整页面
- `templates/homepage.html`: 共享页面结构模板
- `styles/`: 样式文件
- `scripts/content.js`: 可维护的示例内容数据
- `scripts/app.js`: 数据渲染与导航交互
- `scripts/navigation.js`: 导航配置与正文同步排序
- `scripts/citations.js`: 引用弹窗、复制与导出
- `scripts/center-concepts.js`: 动效层位置与响应式布局对接
- `scripts/concepts/`: 七份导入动画、共用球体光照与来源校验值
- `styles/concepts/`: 从原方案提取的视觉样式
- `styles/center-concepts.css`: 完整页面的布局适配
- `styles/client-refinements.css`: 已确认的首页文字与论文区域调整
- `tools/import-concepts.mjs`: 使用 HTML 解析器导入反馈包并生成页面

## 后续怎么改内容

优先只改 `scripts/content.js`：

- 团队名称、英文名、简介、招生及底部联系信息
- 首页新闻
- 成员分组、统一底色和透明 PNG
- 论文、项目、专利、获奖内容

如果只是更新内容，一般不需要改 `index.html` 或 `styles/`。

## 更新与验证方案

安装开发依赖后，传入包含七个方案目录的反馈包路径：

```powershell
npm install
npm run build:concepts -- 'D:\七方案\A-B-C-七方案反馈包(2)'
npm run test:concepts -- 'D:\七方案\A-B-C-七方案反馈包(2)'
```

验证需要本地预览服务运行；可以用环境变量 `PREVIEW_URL` 指定其他端口。Playwright 优先使用已安装的浏览器，也可用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定 Chromium 路径，或运行 `npx playwright install chromium` 安装。

验证包括六种窗口尺寸下的原方案画布像素与节点几何对照、可视区域居中、完整光场边界、正文固定位置、页脚渐隐、返回顶部、动画暂停和恢复、新闻区域滚动及完整页面内容。调整显示尺寸的方案会以相同尺寸的原始绘制器作对照。C-V3 对比原画布内部像素，避开原裁切边缘的抗锯齿变化，并单独检查右侧扩展区域的圆环像素和容器边界。截图和 JSON 结果写入 `artifacts/concepts/`。测试会屏蔽原有的外部成员照片请求，使动效对照可离线重复。
