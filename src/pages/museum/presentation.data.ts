import standPools from 'virtual:island-stand-pools'
import {
  standPoolByFiles,
  standRulesByImageNames,
  type PresentationConfig,
} from '../../shared/presentation'

const pedestals = standPools.museum
const basicPedestalFiles = ['museum-pedestal-v3.png']

/** 文案和底图统一在这里维护；文章的多个标签会合并所有命中规则的底图。 */
export const presentation: PresentationConfig = {
  messages: {
    missing: ['藏品外借至{museum}', '藏品被盗窃', '藏品正在维护'],
    empty: ['待收藏', '等待新藏品入馆'],
    tokens: {
      museum: [
        '故宫博物院',
        '大英博物馆',
        '卢浮宫',
        '大都会艺术博物馆',
        '梵蒂冈博物馆',
        '纽约现代艺术博物馆',
        '乌菲兹美术馆',
        '普拉多博物馆',
      ],
    },
  },
  stands: {
    default: standPoolByFiles(pedestals, basicPedestalFiles),
    byTags: standRulesByImageNames(pedestals, basicPedestalFiles),
    empty: pedestals,
  },
}
