import {createTokens} from 'tamagui'

// Design tokens from Figma — Vexl redesign DEV (node 593:39715)
export const tokens = createTokens({
  color: {
    // Primitives (mode-invariant)
    black100: '#000000',
    white100: '#FFFFFF',
    transparent: 'transparent',

    // Brand yellows
    yellow100: '#FCCD6C',
    yellow50: '#FFE1A2',
    gold100: '#BE8821',
    yellowDark: '#4C3E20',

    // Vibrant palette
    greenLight: '#ACD9B7',
    greenDark: '#455749',
    pinkLight: '#FCC5F3',
    pinkDark: '#654F61',
    redLight: '#EE675E',
    redDark: '#A0433C',
  },

  // Spacing scale from Figma
  space: {
    0: 0,
    0.5: 1,
    1: 2,
    2: 4,
    3: 8,
    4: 12,
    5: 16,
    6: 20,
    7: 24,
    8: 32,
    9: 40,
    10: 48,
    11: 56,
    12: 64,
    13: 80,
    true: 16,
    '-0.5': -1,
    '-1': -2,
    '-2': -4,
    '-3': -8,
    '-4': -12,
    '-5': -16,
  },

  // Size scale (mirrors spacing for consistency)
  size: {
    0: 0,
    0.5: 1,
    1: 2,
    2: 4,
    3: 8,
    4: 12,
    5: 16,
    6: 20,
    7: 24,
    8: 32,
    9: 40,
    10: 48,
    11: 56,
    12: 64,
    13: 80,
    true: 16,
  },

  // Corner radius from Figma
  radius: {
    0: 0,
    1: 2,
    2: 4,
    2.5: 8,
    3: 10,
    4: 12,
    5: 16,
    6: 18,
    7: 20,
    8: 30,
    9: 32,
    10: 36,
    11: 40,
    true: 8,
  },

  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
})
