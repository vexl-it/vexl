// Vexl's own event photos, BTC Prague 2026. Metadata stripped on export.
export const photos = {
  team: {
    src: '/images/photos/team-btc-prague-group-photo.webp',
    width: 2000,
    height: 1336,
  },
  teamBacks: {
    src: '/images/photos/team-backs-protecting-privacy-since-2022.webp',
    width: 2000,
    height: 1336,
  },
  talk: {
    src: '/images/photos/stage-trade-bitcoin-privately-talk.webp',
    width: 1600,
    height: 2000,
  },
  signLaughing: {
    src: '/images/photos/people-privacy-matters-laughing.webp',
    width: 2000,
    height: 1600,
  },
  mask: {
    src: '/images/photos/people-i-love-vexl-anonymous-mask.webp',
    width: 2000,
    height: 1600,
  },
  wave: {
    src: '/images/photos/stage-physical-gatherings-wave.webp',
    width: 1600,
    height: 2000,
  },
  crowd: {
    src: '/images/photos/booth-canopy-crowd.webp',
    width: 2000,
    height: 1600,
  },
  wristband: {
    src: '/images/photos/detail-privacy-is-not-a-crime-wristband.webp',
    width: 2000,
    height: 1600,
  },
  flyers: {
    src: '/images/photos/team-handing-out-flyers.webp',
    width: 2000,
    height: 1600,
  },
  signCowboy: {
    src: '/images/photos/people-privacy-matters-cowboy-hat.webp',
    width: 2000,
    height: 1600,
  },
  conversation: {
    src: '/images/photos/people-conversation-vexl-tent.webp',
    width: 1600,
    height: 2000,
  },
  signMerch: {
    src: '/images/photos/people-privacy-matters-merch-store.webp',
    width: 2000,
    height: 1600,
  },
  blownKiss: {
    src: '/images/photos/people-i-love-vexl-blown-kiss.webp',
    width: 1600,
    height: 2000,
  },
} as const

export type PhotoKey = keyof typeof photos
