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
    src: '/images/photos/stage-no-middlemen-no-kyc-talk.webp',
    width: 2000,
    height: 1600,
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
  booth: {
    src: '/images/photos/booth-trade-bitcoin-privately-banner.webp',
    width: 2000,
    height: 1336,
  },
  panel: {
    src: '/images/photos/stage-panel-privacy-matters-hoodie.webp',
    width: 2000,
    height: 1336,
  },
  signSuit: {
    src: '/images/photos/people-privacy-matters-sign-suit.webp',
    width: 1600,
    height: 2000,
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
} as const

export type PhotoKey = keyof typeof photos
