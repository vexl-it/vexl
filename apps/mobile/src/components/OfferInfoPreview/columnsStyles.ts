import {Stack, styled, Text} from 'tamagui'

export const InfoItemContainer = styled(Stack, {
  f: 1,
  ai: 'center',
})

export const InfoDivider = styled(Stack, {
  bg: 'rgb(196, 196, 196)',
  w: 1,
  als: 'stretch',
})

export const InfoText = styled(Text, {
  col: '$greyOnWhite',
  fos: 14,
  ff: '$body500',
  textAlign: 'center',
})

export const PriceText = styled(InfoText, {
  mb: '$2',
})

export const PriceBigger = styled(InfoText, {
  fos: 20,
})
