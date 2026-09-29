import standPools from 'virtual:island-stand-pools'
import {
  standPoolByFiles,
  standRulesByImageNames,
  type PresentationConfig,
} from '../../shared/presentation'

const pots = standPools.planting
const basicPotFiles = ['flower-pot.png']

const baseRules = standRulesByImageNames(pots, basicPotFiles)
const tagAliases: Record<string, string[]> = {
  '观花植物': ['观花'],
  '观叶植物': ['观叶'],
  '球根': ['春日球根'],
}
const enrichedRules = baseRules.map((rule) => {
  const extra = rule.tags.flatMap((tag) => tagAliases[tag] ?? [])
  return extra.length ? { ...rule, tags: [...rule.tags, ...extra] } : rule
})

/** 文案和底图统一在这里维护；文章的多个标签会合并所有命中规则的底图。 */
export const presentation: PresentationConfig = {
  messages: {
    missing: ['去农场打僵尸了', '正在花园里散步', '暂时离开花盆'],
    empty: ['等待新植物到来', '等待下一颗种子'],
  },
  stands: {
    default: standPoolByFiles(pots, basicPotFiles),
    byTags: enrichedRules,
    empty: pots,
  },
}
