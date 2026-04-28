import {existsSync, readFileSync} from 'node:fs'
import path from 'node:path'

const componentPath = path.join(__dirname, 'OfferPropertiesCard.tsx')
const offerDetailScreenPath = path.join(
  __dirname,
  'OfferDetailScreen',
  'index.tsx'
)

describe('OfferPropertiesCard extraction', () => {
  test('moves OfferPropertiesCard into its own top-level component file', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  test('removes inline OfferPropertiesCard from OfferDetailScreen', () => {
    const offerDetailScreenSource = readFileSync(offerDetailScreenPath, 'utf8')

    expect(offerDetailScreenSource).toContain(
      "import OfferPropertiesCard from '../OfferPropertiesCard'"
    )
    expect(offerDetailScreenSource).not.toContain(
      'function OfferPropertiesCard('
    )
    expect(offerDetailScreenSource).not.toContain('function DetailRow(')
  })
})
