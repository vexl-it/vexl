import fs from 'node:fs'
import path from 'node:path'

export function jsonFiles(directory) {
  if (!fs.existsSync(directory)) return []
  return fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right))
}

// Flattens nested objects into a Map of dotted keys -> string leaves.
export function flattenStringEntries(value, prefix = '') {
  const entries = new Map()
  for (const [key, child] of Object.entries(value)) {
    const childKey = prefix === '' ? key : `${prefix}.${key}`
    if (typeof child === 'string') {
      entries.set(childKey, child)
    } else if (
      child !== null &&
      !Array.isArray(child) &&
      typeof child === 'object'
    ) {
      for (const [nestedKey, nestedValue] of flattenStringEntries(
        child,
        childKey
      )) {
        entries.set(nestedKey, nestedValue)
      }
    }
  }
  return entries
}

// Returns undefined when the file does not exist; throws on invalid JSON.
export function readFlattenedJson(...pathSegments) {
  const filePath = path.join(...pathSegments)
  if (!fs.existsSync(filePath)) return undefined
  return flattenStringEntries(JSON.parse(fs.readFileSync(filePath, 'utf8')))
}

// i18next interpolation: {{name}} and {{name, format}}.
export function placeholderNames(value) {
  const names = new Set()
  for (const match of value.matchAll(/\{\{([^{}]+)\}\}/g)) {
    names.add(match[1].split(',')[0].trim())
  }
  return names
}
