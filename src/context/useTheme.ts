import { useContext } from 'react'
import { ThemeContext } from './ThemeState'

/** 读取主题上下文，若未包裹 Provider 则报错，避免静默使用无效状态。 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
