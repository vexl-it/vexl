import {z} from 'zod'
export const Curve = z.enum(['secp256k1', 'secp224r1']).brand<'Curve'>()
export type Curve = z.TypeOf<typeof Curve>

const curves: Record<string, Curve> = {
  'P-256K': Curve.parse('secp256k1'),
  'P-224': Curve.parse('secp224r1'),
  'secp224r1': Curve.parse('secp224r1'),
  'secp256k1': Curve.parse('secp256k1'),
}

export function normalizeCurveName(rawCurveName: string): Curve {
  const foundCurve = curves[rawCurveName]
  if (!foundCurve) throw new Error(`Curve name: ${rawCurveName} not supported`)
  return foundCurve
}

export const defaultCurve = curves.secp256k1
