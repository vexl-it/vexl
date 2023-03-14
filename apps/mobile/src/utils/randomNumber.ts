import seed from 'seed-random'
export default function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function randomNumberFromSeed(
  min: number,
  max: number,
  seedString: string
): number {
  const generated = seed(seedString)()
  return Math.floor(generated * (max - min + 1) + min)
}
