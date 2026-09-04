# 样式与调参入口

所有项目样式统一放在 `src/styles/`，由 `index.css` 统一引入；`main.tsx` 只引入这个入口。旧的 `src/styles.css` 已拆分，不要重新往根目录添加样式文件。

## 页面文件

| 页面 / 区域 | 文件           | 调整范围                                                                       |
| ----------- | -------------- | ------------------------------------------------------------------------------ |
| 首页        | `home.css`     | 首屏风景、首页各栏目预览、拍立得、漂流瓶、首页的昼夜效果                       |
| 文章        | `posts.css`    | 文章标签调参、阅读页标题、正文、引用、结束区域；其他内容的阅读页也复用正文样式 |
| 博物馆      | `museum.css`   | 展台、藏品图、名称、介绍、日期、标签和藏品详情                                 |
| 菜谱        | `recipes.css`  | 餐盘、菜品图、名称、日期、标签、缺图和空位                                     |
| 手工        | `crafts.css`   | 工作台、相框、作品图、木牌、蓝图、台历、标签和空位                             |
| 旅游        | `travel.css`   | 明信片、邮票、标题、介绍、日期、标签和空位                                     |
| 种植        | `planting.css` | 花盆、植物图、名称、日期、标签、缺图和空位                                     |
| 护照        | `passport.css` | 封面、身份页、签证章、翻页和护照缩放                                           |

护照不是独立路由页面。`HomePage.tsx` 引用 `Passport` 组件，组件的 `id="about"` 是首页锚点；导航 `/\#about` 指向它。使用 HashRouter 后浏览器地址为 `/#/#about`。首页样式文件中也标注了护照样式的去向。

首页的“菜谱预览”和菜谱列表页不是同一组件：前者在 `home.css`，后者在 `recipes.css`。其他首页预览区域同理。

## 全局组件

| 文件                | 用途                                                 |
| ------------------- | ---------------------------------------------------- |
| `header.css`        | 顶部栏、品牌、导航、操作按钮的排列                   |
| `cat.css`           | 左下角猫、对话框、隐藏/返回按钮                      |
| `weather.css`       | 天气控制器、雨雪等全屏特效、主题切换按钮             |
| `search.css`        | 搜索按钮、弹窗、输入框和搜索结果                     |
| `music.css`         | 音乐播放器、播放控制和歌单                           |
| `footer.css`        | 页脚                                                 |
| `base.css`          | 全站字体、主题色变量、基础重置、加载和页面过渡       |
| `content.css`       | 公用卡片、页面标题、分页、标签按钮结构、通用缺图样式 |
| `display-stand.css` | 博物馆、菜谱、手工、旅游、种植共用的三列网格         |

## 更换底座图片

图片仍放在 `public/images/`；下面的变量在对应页面 CSS 顶部。实际内容和空位共用一个变量，不用改两个地方。

| 页面   | 变量                    |
| ------ | ----------------------- |
| 博物馆 | `--museum-base-image`   |
| 菜谱   | `--recipe-base-image`   |
| 手工   | `--craft-base-image`    |
| 种植   | `--planting-base-image` |

例如在 `crafts.css` 修改 `--craft-base-image: url('/images/crafts/workbench.png');`。

旅游明信片由 CSS 绘制，没有底座素材。帖子预览图仍从 Markdown 读取，不属于底座配置。更换不同构图或宽高比的底图之后，仍需在同一 CSS 文件中调整名称、日期等位置。

## 标签的位置与格式

每个列表页面的 CSS 顶部都有 `.<页面>-page` 调参块：

| 参数                | 效果                                         |
| ------------------- | -------------------------------------------- |
| `--tags-top`        | 整条标签栏向下/向上移动，正值向下，负值向上  |
| `--tags-gap`        | 标签按钮之间的间隔                           |
| `--tags-bottom-gap` | 标签栏到下方列表之间的间隔                   |
| `--tags-align`      | 对齐方式：`center`、`flex-start`、`flex-end` |
| `--tags-font-size`  | 字号                                         |
| `--tags-padding`    | 按钮内部上下、左右留白                       |
| `--tags-radius`     | 按钮圆角                                     |

实际标签内容仍来自 Markdown，手工状态仍由 `finaldate` 推导；CSS 只控制显示，不改变筛选逻辑。共用按钮结构只在 `content.css` 定义一次，不必复制到各页。

## 图片和文字位置

| 文件           | 要找的选择器                                                                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `museum.css`   | `.collection-display-space` / `.collection-picture`（图片），`.collection-pedestal::before`（底座），`.collection-exhibit-name`（名称），`.collection-exhibit-description`（介绍），`.collection-exhibit-date`（日期） |
| `recipes.css`  | `.recipe-dish-image`（图片），`.recipe-dish-portrait`（竖图），`.recipe-plate > strong`（名称），`.recipe-plate > svg`（日期），`.recipe-eaten` / `.recipe-empty-sign`（缺图 / 空位）                                  |
| `crafts.css`   | `.craft-workbench-display`（整体），`.craft-art-frame`（相框），`.craft-nameplate`（名称），`.craft-blueprint-description`（介绍），`.craft-date` / `.craft-start-date` / `.craft-finish-date`（台历日期）             |
| `travel.css`   | `.travel-card-photo`（图片），`.travel-card-message`（信息栏），其 `strong` / `p` / `time`（标题 / 介绍 / 日期），`.travel-card-stamp`（邮票）                                                                         |
| `planting.css` | `.planting-preview`（植物图），`.planting-pot > strong`（名称），`.planting-dates`（日期），`.planting-missing` / `.planting-empty-sign`（缺图 / 空位）                                                                |

`top` 越大通常越靠下；`left` 越大越靠右；`width` / `height` 控制大小。图片与覆盖文字保留原来的容器坐标系，本次没有重设你已有的定位值。

博物馆、菜谱、种植的日期弧度也已移到对应 CSS 顶部的 `--museum-date-arc`、`--recipe-date-arc`、`--planting-date-arc`。它们使用 SVG 路径坐标，不是百分比；`M` 是起点，`Q` 是控制点及终点。通常先调整日期容器位置，只有改变弧度时才改路径。

## 底座间距

默认修改 `display-stand.css` 的 `--display-stand-column-gap`（左右）、`--display-stand-row-gap`（上下）、`--display-stand-columns`（列数）、`--display-stand-max-width`（网格总宽度）。

只想改某一页时，取消该页面顶部调参块中相应的注释并修改数值，其他页面不受影响。

## 手机与主题

每个功能自己的 `@media` 和主题规则已放回所属文件；不要另建一个混合所有功能的“手机调参文件”。当前 `index.html` 仍保留 `width=1280` 的固定布局视口，因此手机默认缩放桌面布局，物理屏幕宽度不等于 CSS 媒体查询宽度。本次不改变这个策略。

Markdown 日期、标签、文案随机选择、猫的拖动坐标、天气粒子轨迹等运行时数据仍留在 TypeScript；静态视觉样式和底座选择由 CSS 管理。
