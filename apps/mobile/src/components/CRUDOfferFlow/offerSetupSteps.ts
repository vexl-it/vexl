import {type IconProps} from '@vexl-next/ui'
import type React from 'react'

export type OfferSetupStep =
  | 'offerType'
  | 'listingType'
  | 'productCategory'
  | 'amount'
  | 'location'
  | 'network'
  | 'describe'
  | 'language'
  | 'friendLevel'
  | 'clubs'

export type EditableOfferField = Exclude<
  OfferSetupStep,
  'offerType' | 'listingType'
>

export interface OfferFormStepProps {
  readonly active: boolean
  readonly onEdit?: () => void
  readonly onComplete?: () => void
  readonly ctaLabel?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly overline?: string
  readonly showInitialIcon?: boolean
}
