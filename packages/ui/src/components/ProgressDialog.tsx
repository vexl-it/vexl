import React from 'react'
import {useTheme} from 'tamagui'

import {XStack, YStack} from '../primitives'
import {Dialog, DialogTitle} from './Dialog'
import {Loader} from './Loader'
import {ProgressBar} from './ProgressBar'
import {Typography} from './Typography'

export type ProgressIndication =
  | {type: 'intermediate'}
  | {type: 'loader'}
  | {type: 'progress'; percentage: number}
  | {type: 'done'}
  | {type: 'hidden'}

type VisibleProgressIndication = Exclude<ProgressIndication, {type: 'hidden'}>

export interface ProgressDialogProps {
  readonly belowProgressLeft?: string
  readonly belowProgressRight?: string
  readonly bottomText?: string
  readonly indicateProgress: ProgressIndication
  readonly onHidden?: () => void
  readonly title: string
  readonly visible: boolean
}

function percentageFromIndicateProgress(
  indicateProgress: VisibleProgressIndication
): number | undefined {
  if (indicateProgress.type === 'intermediate') return undefined
  if (indicateProgress.type === 'loader') return 0
  if (indicateProgress.type === 'done') return 100
  return indicateProgress.percentage
}

function ProgressLabels({
  belowProgressLeft,
  belowProgressRight,
}: {
  readonly belowProgressLeft?: string
  readonly belowProgressRight?: string
}): React.JSX.Element {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$2">
      <Typography
        variant="descriptionBold"
        color="$foregroundPrimary"
        flexShrink={0}
      >
        {belowProgressLeft ?? ''}
      </Typography>
      <Typography
        variant="description"
        color="$foregroundSecondary"
        ellipsizeMode="tail"
        flexShrink={1}
        minWidth={0}
        numberOfLines={2}
        textAlign="right"
      >
        {belowProgressRight ?? ''}
      </Typography>
    </XStack>
  )
}

function ProgressIndicator({
  belowProgressLeft,
  belowProgressRight,
  indicateProgress,
}: Pick<ProgressDialogProps, 'belowProgressLeft' | 'belowProgressRight'> & {
  readonly indicateProgress: VisibleProgressIndication
}): React.JSX.Element {
  const theme = useTheme()

  if (indicateProgress.type === 'loader') {
    return (
      <YStack alignItems="center" justifyContent="center" height="$5">
        <Loader size="medium" color={theme.foregroundPrimary.get()} />
      </YStack>
    )
  }

  return (
    <YStack gap="$3">
      <ProgressBar
        percentage={percentageFromIndicateProgress(indicateProgress)}
      />
      <ProgressLabels
        belowProgressLeft={belowProgressLeft}
        belowProgressRight={belowProgressRight}
      />
    </YStack>
  )
}

export function ProgressDialog({
  belowProgressLeft,
  belowProgressRight,
  bottomText,
  indicateProgress,
  onHidden,
  title,
  visible,
}: ProgressDialogProps): React.JSX.Element {
  return (
    <Dialog visible={visible} onHidden={onHidden}>
      <DialogTitle>{title}</DialogTitle>
      {indicateProgress.type === 'hidden' ? null : (
        <ProgressIndicator
          belowProgressLeft={belowProgressLeft}
          belowProgressRight={belowProgressRight}
          indicateProgress={indicateProgress}
        />
      )}
      {!!bottomText && (
        <Typography variant="paragraphSmall" color="$foregroundSecondary">
          {bottomText}
        </Typography>
      )}
    </Dialog>
  )
}
