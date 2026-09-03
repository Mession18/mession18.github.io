/** SVG 仅作为界面图标使用，不计入文章或藏品的有效预览图片。 */
export function isDisplayImage(src?: string): src is string {
  return Boolean(src && !/\.svg(?:$|\?)/i.test(src))
}

export function displayImageOrUndefined(src?: string) {
  return isDisplayImage(src) ? src : undefined
}
