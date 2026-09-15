# 护照旅行地图

`JourneyMap.tsx` 支持 `variant="world"` 和 `variant="china"`。两幅地图各占一个跨页，位于签证之后、旅行年鉴之前。共享护照传入的 `passportTravelStamps`，没有独立的旅行清单。

## 数据与分组

- `world.generated.json`：Natural Earth 5.1.2，1:50m Admin 0 国家地区轮廓，移除南极洲后共 241 个形状。使用 D3 Natural Earth 投影。
- 两张地图的地区块使用纯色。`AtlasPaper.tsx` 只取背景原图中 `(22, 10)–(1514, 1010)` 的纸页范围，移除封皮外边后贴合护照内页轮廓，保留页内装饰。世界地图在原投影基础上等比放大 7.5% 并向下移动；这次地理图形、文字及图钉变换独立于背景取景。
- `china.generated.json`：DataV.GeoAtlas 的中国省级边界（34 个省级地区），使用 D3 Conic Conformal 投影。主图放大展示省份，南海诸岛使用右下角独立附图与 Mercator 投影。地图与标签共用生成时的投影参数。
- `china-cities.generated.json`：市级边界，仅在中国地图放大镜开启时加载。大陆、香港与澳门来自 DataV，台湾县市边界补充自 NLSC 2025 数据，合计 391 个城市级区域。
- 世界地图及其放大镜每个国家／地区只有一个旅行标签，中国各省份的旅行统一收在“中国”标签内；中国地图普通视图每个省份一个标签。标签位于对应国家或省份中心，点击后在记录卡内选择城市。
- 世界地图索引只列国家 / 地区，中国地图索引只列省级地区；点击分组后可在记录卡内切换该组城市。放大后的中国地图改为城市标签，按每个城市的经纬度定位。
- 新城市优先在旅行文章或手动旅行章填写 `province`（如“山东”或“山东省”）。内置常用城市可推断省份；香港、澳门、台湾按对应省级地区分组。未能定位的城市仍可在地点索引选择。
- 重复城市保留全部旅行章，真实日期优先展示。同城游记去重显示文章入口；文章章精确关联原文，手动章按国家与城市匹配现有文章。无文章时按钮显示“游记待记录”。
- 城市记录右上角复用关联旅行明信片的 `stampImage` 或 `customIcon`。优先使用当前旅行章的文章素材，再查找同城文章；没有素材时不显示装饰。

## 放大镜与手机

右上角放大镜可点击开启，也可直接拖入地图。镜片下方提供移动手柄与 2–24 倍调节；手柄支持方向键移动，Escape 收起。镜内背景使用同一个纸页取景。只缩放地理图形与标签间距，标签在独立图层保持 22px 宽、11px 字号。中国地图的普通视图只显示省界与省份标签，镜内显示市级分界线和可直接选择的城市标签。

抓取镜片或手柄后按拖动距离移动，保留原来的抓取偏移，不把镜片中心跳到鼠标位置。通过 SVG 屏幕坐标矩阵换算拖动方向，兼容整本护照旋转及手机缩放。

手机单页保留完整地图，城市记录位于下方。地点索引在当前书页内展开，提供不依赖地图密集标签的选择入口。放大镜、记录卡、文章链接与索引操作不会触发护照手势翻屏。

## 生成与资源

日常构建不联网请求地图数据。重新生成：

- 世界地图：`node scripts/build-journey-map.mjs`
- 中国地图：`node scripts/build-china-map.mjs`

世界地图脚本可追加本地 GeoJSON 路径；中国地图脚本可追加缓存目录，默认使用系统临时目录下的 `windchime-geoatlas`。首次生成下载省级、市级及台湾县市数据，之后复用缓存，缓存完整时可离线生成。中国数据来源：[DataV.GeoAtlas GeoJSON](https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json)，[官方文档](https://help.aliyun.com/zh/datav/datav-6-0/user-guide/choropleth-layer-of-v3-x)；台湾县市边界来自 [NLSC 开放数据](https://data.gov.tw/dataset/7442)，使用 [GeoJSON 镜像](https://geo.maderaojen.me/datasets/tw-counties/releases/v1/2026-08-07.1/data.geojson)，授权为[政府资料开放授权条款第 1 版](https://data.gov.tw/license)。

`public/images/passport/旅行地图书页.webp` 为 1536 × 1024 的纸纹背景，来自本项目 Image Gen 编辑结果，保留水彩海洋、书缝、边缘和装饰。两幅地图的轮廓、文字、统计、图钉和记录均由代码绘制。

`public/fonts/旅行足迹.woff2` 为 Ma Shan Zheng 四字子集，授权见 `public/fonts/MaShanZheng-OFL.txt`。

其他来源：[Natural Earth](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/)（公共领域）、[D3](https://d3js.org/d3-geo/projection)、[Ma Shan Zheng](https://github.com/google/fonts/tree/main/ofl/mashanzheng)（SIL OFL）。
