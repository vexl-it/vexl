export type Side = 'you' | 'them'

export const otherSide = (side: Side): Side => (side === 'you' ? 'them' : 'you')
