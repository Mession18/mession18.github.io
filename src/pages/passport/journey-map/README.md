# 护照旅行地图

`JourneyMap.tsx` 展示摊开的复古地图册；`journey-map.css` 控制版面、书页厚度、书缝光影和响应式样式。内容统一读取护照页传入的 `passportTravelStamps`，没有独立的旅行清单。

## 地图与定位

- `world.generated.json` 是 Natural Earth 5.1.2 的 1:50m Admin 0 国家地区轮廓，移除南极洲后共 241 个形状。它不是完整导航底图。
- 使用 D3 Natural Earth 投影。SVG 轮廓和城市经纬度使用相同投影参数，保证落点对齐。
- 简体中文国家地区名称复用 `shared/country-flags.ts`，已到访区域自动着色。
- `journey-map.data.ts` 内置城市坐标，以国家地区码分别索引。新城市可在 Markdown 或手动旅行章中填写 `latitude`、`longitude`，也可以在坐标表补充。未识别城市保留在地点索引中，不伪装成国家中心位置。
- 密集地点聚合成带数字的图钉，点击后可选择具体城市。重复地点保留全部旅行章，真实日期优先展示，手动章继续参与联动。
- 手机端将地点详情放在书页下方，完整保留世界地图；地点索引提供独立的城市选择入口。

重新生成轮廓：`node scripts/build-journey-map.mjs`。可加本地 GeoJSON 路径以离线生成；日常构建不联网获取地图。

## 视觉资产

- `public/images/passport/旅行地图书页.webp`：1536 × 1024，约 263 KiB。根据已确认参考图，用 Image Gen 编辑移除地图、标题、动态数字、图钉、弹窗和图例，保留纸纹、水彩海洋、书脊缝线、磨损边缘、邮戳和边角装饰。地图、标题、统计、图钉与弹窗均由代码独立绘制。
- `public/fonts/旅行足迹.woff2`：Ma Shan Zheng 字体的四字子集，约 2.3 KiB。授权在 `public/fonts/MaShanZheng-OFL.txt`。
- 书页原图来自本次 Image Gen 编辑结果 `exec-f9abcf80-2cc2-487a-85de-c13857cf639e.png`。概念参考：`C:/Users/Mession/.codex/generated_images/01a09943-f3d0-77e2-a9e9-044a0b68cbf8/exec-b8b7bc9a-7401-446b-9a67-e15759fd2165.png`。

与参考图有意保留的差异：使用实际的 2 个国家地区、14 座城市；采用真实地理投影而非生成图的手绘地理；密集城市增加聚合选择；书外增加可收起的地点索引，便于键盘和手机访问。

数据及字体来源：[Natural Earth](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/)（公共领域）、[D3 投影](https://d3js.org/d3-geo/projection)、[Ma Shan Zheng](https://github.com/google/fonts/tree/main/ofl/mashanzheng)（SIL OFL）。
