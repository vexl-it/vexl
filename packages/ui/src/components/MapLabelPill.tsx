import React from 'react'
import {styled, useTheme} from 'tamagui'
import {YStack} from '../primitives'
import {Loader} from './Loader'
import {Typography, type TypographyProps} from './Typography'

const MapLabelPillFrame = styled(YStack, {
  name: 'MapLabelPill',
  alignSelf: 'center',
  alignItems: 'center',
  paddingHorizontal: '$4',

  variants: {
    variant: {
      default: {
        paddingVertical: '$2',
        borderRadius: '$6',
        backgroundColor: '$backgroundPrimary',
      },
      highlight: {
        paddingVertical: '$3',
        borderRadius: '$5',
        backgroundColor: '$accentHighlightPrimary',
      },
    },
  } as const,
})

export interface MapLabelPillProps {
  readonly label: string
  readonly detail?: string
  readonly variant?: 'default' | 'highlight'
  readonly error?: boolean
  readonly loading?: boolean
}

export function MapLabelPill({
  label,
  detail,
  variant = 'default',
  error = false,
  loading = false,
}: MapLabelPillProps): React.JSX.Element {
  const theme = useTheme()
  const highlight = variant === 'highlight'
  const textProps = {
    variant: highlight ? 'description' : 'micro',
    lineHeight: highlight ? '100%' : undefined,
    textAlign: 'center',
    color: error
      ? '$redForeground'
      : highlight
        ? '$backgroundPrimary'
        : '$foregroundPrimary',
  } satisfies Omit<TypographyProps, 'children'>

  return (
    <MapLabelPillFrame variant={variant}>
      {loading ? (
        <Loader
          size="small"
          color={
            highlight
              ? theme.backgroundPrimary.get()
              : theme.foregroundPrimary.get()
          }
        />
      ) : (
        <>
          <Typography {...textProps}>{label}</Typography>
          {detail != null ? (
            <Typography {...textProps}>{detail}</Typography>
          ) : null}
        </>
      )}
    </MapLabelPillFrame>
  )
}
