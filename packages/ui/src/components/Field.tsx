import {styled} from 'tamagui'

import {Input, XStack} from '../primitives'

export const FieldFrame = styled(XStack, {
  name: 'FieldFrame',
  alignItems: 'center',
  alignSelf: 'stretch',
  minWidth: 0,
  gap: '$3',
  minHeight: '$11',
  paddingHorizontal: '$5',
  borderRadius: '$5',
  backgroundColor: '$backgroundSecondary',
  borderWidth: 1,
  borderColor: 'transparent',

  variants: {
    highlighted: {
      true: {
        borderColor: '$accentHighlightSecondary',
      },
    },
    selected: {
      true: {
        backgroundColor: '$accentYellowSecondary',
      },
    },
    pressable: {
      true: {
        pressStyle: {
          opacity: 0.7,
        },
      },
    },
  } as const,
})

export const FieldInput = styled(Input, {
  name: 'FieldInput',
  unstyled: true,
  flex: 1,
  minWidth: 0,
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  color: '$foregroundPrimary',
  padding: 0,
})
