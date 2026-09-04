# 风铃岛通信

这是一个由 Vite、React 和 Markdown 组成的个人网站。内容写在 `src/content`，页面放在 `src/pages`，固定素材放在 `public`。

## 从哪里开始维护

- [详细维护手册](docs/维护手册.md)：按“我要修改什么”查文件；包括标签、随机底图、图片、首页、护照、样式和发布。
- [新增页面教程](docs/新增页面教程.md)：以“摄影”栏目为例，从 Markdown 到首页预览、列表页、详情页和随机底图的完整接入过程。
- [样式说明](src/styles/README.md)：样式入口、覆盖顺序与定位办法。

## 当前目录

```text
src/
├─ content/<栏目>/           Markdown、preview、detail、images
├─ pages/
│  ├─ <栏目>/
│  │  ├─ page.tsx            列表、筛选、分页、卡片和空位
│  │  ├─ detailpage.tsx      单条内容详情
│  │  ├─ <栏目>.data.ts      加载和排序本栏目的内容
│  │  ├─ presentation.data.ts 文案与标签底图规则
│  │  └─ styles.css          本栏目样式
│  ├─ home/                  首页装配、区域组件及区域样式
│  └─ passport/              首页和独立页面共用的护照
├─ shared/
│  ├─ config.ts              栏目元信息、色板、分页配置
│  ├─ data.ts                栏目数据汇总、国旗、文案入口
│  └─ utils.ts               日期、Markdown、图片、随机底图、天文与时区工具
├─ components/               导航、搜索、音乐、天气、猫等全站组件
├─ hooks/                    图片状态、天气请求、稳定随机选择
├─ context/                  全站日夜和天气状态
├─ styles/                   全局基础、通用内容、底座网格样式
├─ App.tsx                   路由与应用外壳
└─ main.tsx                  React 启动、HashRouter、主题 Provider
build/stand-assets.ts        扫描每个栏目自己的底图目录
build/music-playlist.ts      扫描歌曲、按需提取/输出独立封面
public/                     固定图片、模型、音频
scripts/                    维护用验证脚本，不会在网页里运行
docs/                       维护与扩展教程
```

普通栏目为 posts、crafts、recipes、travel、planting；museum 使用专属藏品模型。home 和 passport 没有常规列表/详情结构。

## 开发与检查

仓库使用 `pnpm-lock.yaml`；安装依赖用 `pnpm install`，避免混用锁文件。已有依赖时可以用 npm 执行现有脚本：

```sh
npm run dev
npx tsc --noEmit
npm run lint
node scripts/test-presentation.mjs
node scripts/test-stand-pools.mjs
node scripts/test-sky.mjs
node scripts/test-theme-contrast.mjs
node scripts/test-music.mjs
npm run build
```

`npm run dev` 输出的本地地址就是预览地址，端口被占用时会递增。列表地址例如 `/#/crafts`，详情地址例如 `/#/crafts/bottle-lamp`。

## 本次整理约定

- 首页 `sky.css`、`landscape.css` 合并为 `home/styles/scenery.css`，保留原来的天空到地景的规则顺序。
- 普通栏目的标签筛选直接在各自 `page.tsx` 中维护；博物馆分类筛选仍在本栏目 `MuseumFilters.tsx`。
- `shared` 只有三个实际实现文件，不再保留旧目录转发文件。
- 注释按功能块说明用途：数据定义、状态、计算、事件、副作用、界面区域及 CSS 规则。同类字段和重复元素按组说明。
- 依赖、锁文件、构建产物、图片二进制不逐行添加注释；JSON 不支持注释，配置用途在维护手册说明。
