import {Schema} from 'effect/index'

export const Curve = Schema.Literal('secp256k1', 'secp224r1').pipe(
  Schema.brand('Curve')
)
export type Curve = typeof Curve.Type

export const curves = {
  'secp224r1': Schema.decodeSync(Curve)('secp224r1'),
  'secp256k1': Schema.decodeSync(Curve)('secp256k1'),
}
export const curvesMap: Record<string, Curve> = {
  'P-256K': Schema.decodeSync(Curve)('secp256k1'),
  'P-224': Schema.decodeSync(Curve)('secp224r1'),
  'secp224r1': Schema.decodeSync(Curve)('secp224r1'),
  'secp256k1': Schema.decodeSync(Curve)('secp256k1'),
}

export function normalizeCurveName(rawCurveName: string): Curve {
  const foundCurve = curvesMap[rawCurveName]
  if (!foundCurve) throw new Error(`Curve name: ${rawCurveName} not supported`)
  return foundCurve
}

export const defaultCurve: Curve = Schema.decodeSync(Curve)('secp256k1')
