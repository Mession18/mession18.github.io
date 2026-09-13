/** 模板 Markdown 只供复制编辑：兼容旧的 `_模板.md` 和新的 `模板.md` 命名。 */
export function isMarkdownTemplate(path: string) {
  const filename = path.split('/').pop() ?? ''
  return filename.startsWith('_') || /模板\.md$/i.test(filename)
}
