const copyWithTextarea = (value: string): boolean => {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

export const copyToClipboard = async (value: string): Promise<void> => {
  if (copyWithTextarea(value)) return

  try {
    await navigator.clipboard.writeText(value)
  } catch {
    throw new Error('Failed to copy to clipboard')
  }
}
