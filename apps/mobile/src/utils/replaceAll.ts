function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function replaceAll(
  str: string,
  find: string[],
  replace: string
): string {
  return str.replace(new RegExp(find.map(escapeRegExp).join('|'), 'g'), replace)
}
