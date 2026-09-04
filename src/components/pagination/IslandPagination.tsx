import { ChevronLeft, ChevronRight } from 'lucide-react'

/** 通用翻页按钮：页数不超过一页时隐藏，点击后把目标页码交还页面。 */
export function IslandPagination({
  page,
  total,
  onChange,
}: {
  page: number
  total: number
  onChange: (page: number) => void
}) {
  if (total <= 1) return null
  return (
    <nav className="island-pagination" aria-label="分页">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} />
      </button>
      <span>
        <b>{page}</b> / {total}
      </span>
      <label>
        快速跳转{' '}
        <select value={page} onChange={(event) => onChange(Number(event.target.value))}>
          {Array.from({ length: total }, (_, index) => (
            <option key={index + 1} value={index + 1}>
              第 {index + 1} 页
            </option>
          ))}
        </select>
      </label>
      <button disabled={page === total} onClick={() => onChange(page + 1)}>
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
