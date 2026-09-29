# 样式维护入口

`src/styles/index.css` 是全站样式入口，顺序为基础样式、公共组件、页面。添加新 CSS 文件后需要在对应入口导入。

- `base.css`：字体、全局主题变量、重置、加载动画。
- `content.css`：通用标题、正文、筛选按钮、分页和详情基础外观。
- `display-stand.css`：展台网格公共布局（桌面 3 列、平板 850px 2 列、手机 580px 单列）。
- `src/pages/<栏目>/styles.css`：该栏目卡片、底图、日期和响应式外观。
- `src/components/<组件>/styles.css`：导航、搜索、音乐等全局组件的外观。
- `src/pages/home/styles.css`：首页样式索引，区域规则位于它的 styles 子目录。

全站响应式断点遵循统一标准：
- **平板端（`max-width: 850px`）**：主导航切换为底部悬浮胶囊栏，展台网格转为 2 列，3D 岛屿切换为 compact 紧凑视角，小猫缩小并靠下。
- **手机端（`max-width: 580px / 480px`）**：展台网格转为单列居中，各卡片保持最大安全宽度（360px~380px）防止横向溢出，调整内边距与标题字号。
- **安全区支持**：底部悬浮条、小猫及页面底部内边距均接入 `env(safe-area-inset-bottom)`，适配全面屏手机与 iOS Home 手势条。

首页天空与地景已合并到 `pages/home/styles/scenery.css`。首页手作展示板在 `pages/home/styles/crafts.css`，列表工作台在 `pages/crafts/styles.css`，两者是独立结构。

`.父元素 .子元素` 表示限定范围；夜间、悬停和 media 是条件覆盖，不应当作重复删除。先修改已有变量或规则，避免不断追加同名覆盖。注释解释布局约束、兼容原因和素材坐标等代码本身看不出的信息，不逐行复述尺寸、定位、文字或颜色属性。

底图清单由目录扫描，标签规则在各栏目 `presentation.data.ts`。`standAttributes` 写入 `--stand-image`，CSS 通过 `[data-stand-image]` 使用它；特殊坐标用 `[data-stand-layout='布局名']` 调整。

完整说明：[维护手册](../../docs/维护手册.md)；添加栏目：[新增页面教程](../../docs/新增页面教程.md)。
