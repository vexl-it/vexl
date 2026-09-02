import {Array, pipe} from 'effect'

export interface VcardContact {
  readonly name: string
  readonly phoneNumber: string
}

// Escaping per RFC 2426 (vCard 3.0) - backslash, comma, semicolon, newlines
function escapeVcardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r?\n/g, '\\n')
}

function contactToVcard({name, phoneNumber}: VcardContact): string {
  const escapedName = escapeVcardValue(name.trim())

  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${escapedName};;;`,
    `FN:${escapedName}`,
    `TEL;TYPE=CELL:${phoneNumber}`,
    'END:VCARD',
  ].join('\r\n')
}

export function contactsToVcardString(
  contacts: readonly VcardContact[]
): string {
  return pipe(
    contacts,
    Array.map(contactToVcard),
    Array.join('\r\n'),
    (vcards) => `${vcards}\r\n`
  )
}

export interface ParsedVcardContact {
  readonly name: string
  readonly phoneNumbers: readonly string[]
}

const MAX_PARSED_NAME_LENGTH = 128

function unescapeVcardValue(value: string): string {
  return value.replace(/\\(\\|,|;|n|N)/g, (_, escapedChar: string) =>
    escapedChar === 'n' || escapedChar === 'N' ? ' ' : escapedChar
  )
}

function stripControlCharacters(value: string): string {
  let result = ''
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0
    result += codePoint < 32 || codePoint === 127 ? ' ' : char
  }
  return result
}

// Untrusted input - drop control characters and cap the length
function sanitizeParsedName(name: string): string {
  return stripControlCharacters(name)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PARSED_NAME_LENGTH)
}

// Lines that must terminate a QP soft-break join: card boundaries and
// well-known vCard properties (optionally with an "item1." group and
// ;params), matched case-insensitively like the rest of the parser.
// A whitelist is used because QP continuation content may legitimately
// contain a colon (e.g. "Smith:Jr") and must not be mistaken for a
// property line.
const propertyLinePattern =
  /^([\w-]+\.)?(BEGIN|END|VERSION|FN|N|TEL|EMAIL|ADR|ORG|TITLE|NOTE|URL|PHOTO|BDAY|X-[\w-]+)(;[^:]*)?:/i

function looksLikePropertyLine(line: string): boolean {
  return propertyLinePattern.test(line.trim())
}

function decodeQuotedPrintableValue(value: string): string {
  try {
    return decodeURIComponent(
      value.replace(/%/g, '%25').replace(/=([0-9A-Fa-f]{2})/g, '%$1')
    )
  } catch {
    // malformed QP or invalid UTF-8 - keep the raw value rather than dropping the contact
    return value
  }
}

function splitOnUnescapedSemicolons(value: string): string[] {
  const parts: string[] = []
  let currentPart = ''
  let isEscaped = false
  for (const char of value) {
    if (isEscaped) {
      currentPart += `\\${char}`
      isEscaped = false
    } else if (char === '\\') {
      isEscaped = true
    } else if (char === ';') {
      parts.push(currentPart)
      currentPart = ''
    } else {
      currentPart += char
    }
  }
  parts.push(currentPart)
  return parts
}

// N is "family;given;middle;prefix;suffix" - assemble a display name
function structuredNameToDisplayName(value: string): string {
  const [family, given, middle, prefix, suffix] = pipe(
    splitOnUnescapedSemicolons(value),
    Array.map(unescapeVcardValue)
  )

  return pipe(
    [prefix, given, middle, family, suffix],
    Array.filter(
      (part): part is string => part !== undefined && part.trim() !== ''
    ),
    Array.join(' ')
  )
}

/**
 * Minimal vCard (RFC 2426 / 6350) parser for restoring contact backups.
 * Only FN/N and TEL are read - all other properties (PHOTO, NOTE, URL, ...)
 * are intentionally ignored since the input file is untrusted.
 */
export function parseVcardString(vcardString: string): ParsedVcardContact[] {
  // Line unfolding - a line break followed by space/tab continues the line
  const lines = vcardString.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)

  const parsedContacts: ParsedVcardContact[] = []
  let currentContact:
    | {formattedName?: string; structuredName?: string; phoneNumbers: string[]}
    | undefined

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    if (line === undefined) continue
    const upperCasedLine = line.trim().toUpperCase()
    if (upperCasedLine === 'BEGIN:VCARD') {
      currentContact = {phoneNumbers: []}
      continue
    }
    if (upperCasedLine === 'END:VCARD') {
      if (currentContact !== undefined) {
        const name = sanitizeParsedName(
          currentContact.formattedName ?? currentContact.structuredName ?? ''
        )
        if (name !== '' && currentContact.phoneNumbers.length > 0) {
          parsedContacts.push({
            name,
            phoneNumbers: currentContact.phoneNumbers,
          })
        }
      }
      currentContact = undefined
      continue
    }
    if (currentContact === undefined) continue

    const colonIndex = line.indexOf(':')
    if (colonIndex <= 0) continue
    const propertyAndParams = line.slice(0, colonIndex).split(';')
    // strip params (TEL;TYPE=CELL) and Apple item groups (item1.TEL)
    const property = propertyAndParams[0]
      ?.split('.')
      .pop()
      ?.trim()
      .toUpperCase()
    const isQuotedPrintable = pipe(
      propertyAndParams,
      Array.drop(1),
      Array.some((param) => {
        const normalizedParam = param.trim().toUpperCase()
        return (
          normalizedParam === 'ENCODING=QUOTED-PRINTABLE' ||
          normalizedParam === 'QUOTED-PRINTABLE'
        )
      })
    )
    let value = line.slice(colonIndex + 1).trim()
    if (isQuotedPrintable) {
      while (value.endsWith('=') && lineIndex + 1 < lines.length) {
        const nextLine = lines[lineIndex + 1]
        if (nextLine === undefined) break
        // A malformed trailing "=" (not a real QP soft break) must not eat
        // the next property or card boundary - stop instead of consuming it.
        if (looksLikePropertyLine(nextLine)) break
        lineIndex++
        value = `${value.slice(0, -1)}${nextLine}`
      }
      if (property === 'FN' || property === 'N' || property === 'TEL') {
        value = decodeQuotedPrintableValue(value)
      }
    }
    if (value === '') continue

    if (property === 'FN' && currentContact.formattedName === undefined) {
      currentContact.formattedName = unescapeVcardValue(value)
    } else if (
      property === 'N' &&
      currentContact.structuredName === undefined
    ) {
      currentContact.structuredName = structuredNameToDisplayName(value)
    } else if (property === 'TEL') {
      currentContact.phoneNumbers.push(unescapeVcardValue(value))
    }
  }

  return parsedContacts
}
