/**
 * Converts anonymous avatar SVG strings from the mobile app into
 * react-native-svg React components for the UI package.
 *
 * Usage: node scripts/convert-avatars.mjs
 */

import {mkdirSync, readFileSync, writeFileSync} from 'fs'
import {dirname, join} from 'path'
import {fileURLToPath} from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MOBILE_IMAGES = join(
  ROOT,
  '..',
  '..',
  'apps',
  'mobile',
  'src',
  'components',
  'AnonymousAvatar',
  'images'
)
const OUT_DIR = join(ROOT, 'src', 'assets', 'anonymousAvatars')

// SVG attr -> JSX prop mapping
const ATTR_MAP = {
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'mask-type': 'maskType',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-width': 'strokeWidth',
  'xmlns': null, // remove
  'xmlns:xlink': null,
  'xml:space': null,
  'maskUnits': 'maskUnits',
  'gradientUnits': 'gradientUnits',
  'userSpaceOnUse': 'userSpaceOnUse', // value, not attr
  'viewBox': 'viewBox',
}

// SVG tag -> react-native-svg import name
const TAG_MAP = {
  svg: 'Svg',
  path: 'Path',
  g: 'G',
  rect: 'Rect',
  defs: 'Defs',
  clipPath: 'ClipPath',
  mask: 'Mask',
  linearGradient: 'LinearGradient',
  stop: 'Stop',
  circle: 'Circle',
  line: 'Line',
  ellipse: 'Ellipse',
  polygon: 'Polygon',
  polyline: 'Polyline',
  text: 'Text',
  image: 'Image',
  filter: 'Filter',
  feColorMatrix: 'FeColorMatrix',
}

/** Convert a kebab-case SVG attribute to camelCase JSX prop. */
function convertAttr(attr) {
  if (ATTR_MAP[attr] !== undefined) return ATTR_MAP[attr]
  // style attribute with inline CSS needs special handling
  if (attr === 'style') return 'style'
  return attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

/** Parse an inline style string into a JS object literal string. */
function parseStyleToObject(styleStr) {
  const pairs = styleStr.split(';').filter((s) => s.trim())
  const entries = pairs.map((pair) => {
    const [key, ...vals] = pair.split(':')
    const prop = key.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    const val = vals.join(':').trim()
    return `${prop}: '${val}'`
  })
  return `{{${entries.join(', ')}}}`
}

/** Convert an SVG XML string into JSX string for react-native-svg. */
function svgToJsx(svgXml) {
  let jsx = svgXml.trim()
  const usedTags = new Set()

  // Strip whitespace between tags to avoid {' '} text nodes from Prettier
  // (React Native SVG does not support text strings outside <Text>)
  jsx = jsx.replace(/>\s+</g, '><')

  // Replace self-closing and opening tags
  jsx = jsx.replace(
    /<(\/?)([\w-]+)([^>]*?)(\s*\/)?>/g,
    (match, closing, tag, attrs, selfClose) => {
      const rnsTag = TAG_MAP[tag]
      if (!rnsTag) {
        // Unknown tag, keep as-is (shouldn't happen with our avatars)
        return match
      }
      usedTags.add(tag)

      if (closing) return `</${rnsTag}>`

      // Convert attributes
      let newAttrs = attrs.replace(
        /([\w-:]+)\s*=\s*"([^"]*)"/g,
        (_, attr, val) => {
          const jsxAttr = convertAttr(attr)
          if (jsxAttr === null) return '' // remove attribute
          if (jsxAttr === 'style') {
            return `style=${parseStyleToObject(val)}`
          }
          return `${jsxAttr}="${val}"`
        }
      )

      return `<${rnsTag}${newAttrs}${selfClose ? ' /' : ''}>`
    }
  )

  // Collect imports
  const imports = []
  for (const tag of Object.keys(TAG_MAP)) {
    if (usedTags.has(tag)) {
      const rnsName = TAG_MAP[tag]
      if (rnsName === 'Svg') {
        imports.unshift('Svg') // Svg first as default-like
      } else {
        imports.push(rnsName)
      }
    }
  }

  return {jsx, imports}
}

/** Extract SVG strings from the mobile app source file. */
function extractSvgStrings(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const svgs = []
  // Match template literals containing SVG
  const re = /`(<svg[\s\S]*?<\/svg>\s*)`/g
  let m
  while ((m = re.exec(content)) !== null) {
    svgs.push(m[1].trim())
  }
  return svgs
}

/** Generate a component file for a single avatar with optional grayscale. */
function generateComponent(name, svgXml) {
  const {jsx, imports} = svgToJsx(svgXml)

  // Inject width={size} height={size} into root Svg tag
  const jsxWithProps = jsx.replace(/^<Svg/, '<Svg width={size} height={size}')

  // Wrap inner SVG content with conditional grayscale filter
  const jsxWithGrayscale = jsxWithProps
    .replace(
      /^(<Svg[^>]*>)/,
      '$1{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}>'
    )
    .replace(/<\/Svg>$/, '</G></Svg>')

  // Ensure Filter, FeColorMatrix, Defs, and G are always imported
  const allImports = new Set(imports)
  allImports.add('Defs')
  allImports.add('Filter')
  allImports.add('FeColorMatrix')
  allImports.add('G')
  const importList = [...allImports].filter((i) => i !== 'Svg').join(', ')

  // Only add eslint-disable when the SVG uses x/y attributes (on Mask/Rect)
  // which trigger false-positive @typescript-eslint/no-deprecated warnings
  const hasDeprecatedXY = / [xy]="/.test(jsxWithGrayscale)
  const eslintDisable = hasDeprecatedXY
    ? '/* eslint-disable @typescript-eslint/no-deprecated */\n'
    : ''

  return `${eslintDisable}import React from 'react'
import Svg, {${importList}} from 'react-native-svg'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
}

export function ${name}({size = 150, grayscale = false}: Props): React.JSX.Element {
  // prettier-ignore
  return (${jsxWithGrayscale})
}
`
}

// --- Main ---

// Extract SVGs
const basicSvgs = extractSvgStrings(join(MOBILE_IMAGES, 'avatarsSvg.ts'))
const goldenSvgs = extractSvgStrings(
  join(MOBILE_IMAGES, 'avatarsGoldenGlassesAndBackgroundSvg.ts')
)

console.log(
  `Found ${basicSvgs.length} basic avatars, ${goldenSvgs.length} golden avatars`
)

// Generate components
const basicComponents = []
const goldenComponents = []

mkdirSync(OUT_DIR, {recursive: true})

for (let i = 0; i < basicSvgs.length; i++) {
  const name = `AvatarBasic${i + 1}`
  const code = generateComponent(name, basicSvgs[i])
  writeFileSync(join(OUT_DIR, `${name}.tsx`), code)
  basicComponents.push(name)
  console.log(`  wrote ${name}.tsx`)
}

for (let i = 0; i < goldenSvgs.length; i++) {
  const name = `AvatarGolden${i + 1}`
  const code = generateComponent(name, goldenSvgs[i])
  writeFileSync(join(OUT_DIR, `${name}.tsx`), code)
  goldenComponents.push(name)
  console.log(`  wrote ${name}.tsx`)
}

// Generate index.ts
const indexLines = []

for (const name of basicComponents) {
  indexLines.push(`import {${name}} from './${name}'`)
}
for (const name of goldenComponents) {
  indexLines.push(`import {${name}} from './${name}'`)
}

indexLines.push('')
indexLines.push(`export const avatarsSvg = [${basicComponents.join(', ')}]`)
indexLines.push(
  `export const avatarsGoldenGlassesAndBackgroundSvg = [${goldenComponents.join(', ')}]`
)
indexLines.push('')

writeFileSync(join(OUT_DIR, 'index.ts'), indexLines.join('\n'))
console.log('\nwrote index.ts')
console.log('Done!')
