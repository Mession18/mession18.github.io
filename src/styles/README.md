# 样式维护入口

`src/styles/index.css` 是全站样式入口，顺序为基础样式、公共组件、页面。添加新 CSS 文件后需要在对应入口导入。

- `base.css`：字体、全局主题变量、重置、加载动画。
- `content.css`：通用标题、正文、筛选按钮、分页和详情基础外观。
- `display-stand.css`：展台网格公共布局。
- `src/pages/<栏目>/styles.css`：该栏目卡片、底图、日期和响应式外观。
- `src/components/<组件>/styles.css`：导航、搜索、音乐等全局组件的外观。
- `src/pages/home/styles.css`：首页样式索引，区域规则位于它的 styles 子目录。

首页天空与地景已合并到 `pages/home/styles/scenery.css`。首页手作展示板在 `pages/home/styles/crafts.css`，列表工作台在 `pages/crafts/styles.css`，两者是独立结构。

`.父元素 .子元素` 表示限定范围；夜间、悬停和 media 是条件覆盖，不应当作重复删除。先修改已有变量或规则，避免不断追加同名覆盖。注释按选择器组说明尺寸、定位、文字、颜色及交互的用途，同类重复选择器在首次出现处解释。

底图清单由目录扫描，标签规则在各栏目 `presentation.data.ts`。`standAttributes` 写入 `--stand-image`，CSS 通过 `[data-stand-image]` 使用它；特殊坐标用 `[data-stand-layout='布局名']` 调整。

完整说明：[维护手册](../../docs/维护手册.md)；添加栏目：[新增页面教程](../../docs/新增页面教程.md)。
