import {z} from 'zod'

export const Curve = z.enum(['secp256k1', 'secp224r1']).brand<'Curve'>()
export type Curve = z.TypeOf<typeof Curve>

export const curves = {
  'secp224r1': Curve.parse('secp224r1'),
  'secp256k1': Curve.parse('secp256k1'),
}
export const curvesMap: Record<string, Curve> = {
  'P-256K': Curve.parse('secp256k1'),
  'P-224': Curve.parse('secp224r1'),
  'secp224r1': Curve.parse('secp224r1'),
  'secp256k1': Curve.parse('secp256k1'),
}

export function normalizeCurveName(rawCurveName: string): Curve {
  const foundCurve = curvesMap[rawCurveName]
  if (!foundCurve) throw new Error(`Curve name: ${rawCurveName} not supported`)
  return foundCurve
}

export const defaultCurve: Curve = Curve.parse('secp256k1')
