# 博物馆展台生成草稿

这六张由内置 image_gen 生成。当前输出是 RGB，尚未具有透明通道，不能当作透明成品。放在子目录避免自动加入网站展台随机池。原版未改动。

文件对应：photo 照片（胡桃木与镜头）；music 音乐（酒红木与唱片音符）；movie 电影（深蓝与胶片）；game 游戏（绿色与手柄按键）；book 书籍（橡木、青色皮革与书本羽毛）；souvenir 纪念品（旅行皮箱、指南针和勋章）。

生成约束：以 museum-pedestal-v3.png 为参考，保持 1536×1024 画布与原版展台比例；上方圆台前沿保留日期文字区域，正面两块奶油色空白铭牌用于标题和说明。主题装饰只安排在侧柱及边缘；平台留空，不生成文字，不遮挡文字区域。要求真实透明 PNG，但本轮工具没有正确输出透明通道。

通用提示词：

Edit the provided ORIGINAL museum pedestal into ONE themed variant. Critical production UI asset: retain original 1536x1024 canvas aspect ratio 3:2, exact scale and centered registration, silhouette bounds x112..1422 y202..923. Keep empty raised elliptical platform x330..1200 y202..360, unobstructed front curved rim for date text. Preserve TWO blank cream plaques at EXACT coordinates: upper rounded plaque x250..1285 y362..532; lower rectangular plaque x285..1250 y592..785. These two plaques and the front rim constitute THREE web text overlay regions: DO NOT move, resize, cover, or add text to them. All inscriptions supplied by webpage; NO letters numbers logos anywhere. Keep plaques warm pale cream suitable for dark brown text. Same friendly polished 3D illustrated museum furniture style, frontal slight top-down perspective. Theme only changes materials colors and tasteful small side ornamentation, not layout. Keep platform empty for webpage exhibit image. Output genuine transparent alpha PNG outside furniture, NO checkerboard pixels, no white backdrop, no environment, no ground plane, no backdrop shadow. 

透明成品已完成：上级目录的 photo.png、music.png、movie.png、game.png、book.png、souvenir.png 均为 1536×1024 RGBA PNG。经用户同意使用本地工具清除与外边界连通的浅色背景，保留内部铭牌高光，并对边缘轻微内缩羽化。此目录保留生成草稿供对照；网站只读取上级目录直属图片。
