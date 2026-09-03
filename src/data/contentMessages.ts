export const contentMessages = {
  museums: [
    '故宫博物院',
    '大英博物馆',
    '卢浮宫',
    '大都会艺术博物馆',
    '梵蒂冈博物馆',
    '纽约现代艺术博物馆',
    '乌菲兹美术馆',
    '普拉多博物馆',
  ],
  museum: {
    missing: ['藏品外借至{museum}', '藏品被盗窃', '藏品正在维护'],
    empty: ['待收藏', '等待新藏品入馆'],
  },
  recipes: {
    missing: ['被吃掉了', '刚刚被端走', '正在重新摆盘'],
    empty: ['正在研发新菜品', '等待新菜谱'],
  },
  crafts: {
    missing: ['正在制作中', '材料采购中', '灵感正在施工'],
    empty: ['等待新的手工作品', '工作台暂时空着'],
  },
  travel: {
    missing: ['正在拍摄中', '胶卷正在冲洗', '照片还在路上'],
    empty: ['即将前往', '下一站待定'],
  },
  planting: {
    missing: ['去农场打僵尸了', '正在花园里散步', '暂时离开花盆'],
    empty: ['等待新植物到来', '等待下一颗种子'],
  },
  posts: {
    missing: ['文章配图正在绘制', '照片正在整理', '封面还在路上'],
    empty: ['等待新的岛屿来信', '下一篇文章正在构思'],
  },
} as const

type MessageSection = Exclude<keyof typeof contentMessages, 'museums'>
type MessageKind = 'missing' | 'empty'

const messageBags = new Map<string, string[]>()

function drawRandom(key: string, items: readonly string[]) {
  let bag = messageBags.get(key)
  if (!bag?.length) {
    bag = [...items].sort(() => Math.random() - 0.5)
    messageBags.set(key, bag)
  }
  return bag.pop() ?? items[0] ?? ''
}

export function getContentMessage(section: MessageSection, kind: MessageKind) {
  const messages = contentMessages[section][kind]
  let message: string = drawRandom(`${section}:${kind}`, messages)
  if (message.includes('{museum}')) {
    message = message.replace('{museum}', drawRandom('museums', contentMessages.museums))
  }
  return message
}
