import {Typography} from '@vexl-next/ui'
import {ChevronDown, ChevronUp} from '@vexl-next/ui/src/icons'
import React, {type ReactNode, useState} from 'react'
import {getTokens, useTheme, XStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import AnimatedCollapse from '../../FilterOffersScreen/components/AnimatedCollapse'

interface Props {
  readonly changedOptionsCount: number
  readonly children: ReactNode
}

function MoreOptions({
  changedOptionsCount,
  children,
}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <XStack
        alignItems="center"
        justifyContent="center"
        gap="$3"
        paddingVertical="$6"
        onPress={() => {
          setExpanded((previous) => !previous)
        }}
      >
        <XStack alignItems="center" gap="$2">
          <Typography
            variant="descriptionBold"
            color="$accentHighlightSecondary"
          >
            {expanded
              ? t('offerForm.hideOptions')
              : t('offerForm.showMoreOptions')}
          </Typography>
          {changedOptionsCount > 0 ? (
            <XStack
              backgroundColor="$accentYellowSecondary"
              borderRadius="$8"
              minWidth={19}
              paddingHorizontal="$1"
              paddingVertical={2}
              alignItems="center"
              justifyContent="center"
            >
              <Typography
                variant="micro"
                color="$accentHighlightSecondary"
                textAlign="center"
              >
                {changedOptionsCount}
              </Typography>
            </XStack>
          ) : null}
        </XStack>
        {expanded ? (
          <ChevronUp
            color={theme.accentHighlightSecondary.get()}
            size={getTokens().size.$7.val}
          />
        ) : (
          <ChevronDown
            color={theme.accentHighlightSecondary.get()}
            size={getTokens().size.$7.val}
          />
        )}
      </XStack>

      {expanded ? (
        <AnimatedCollapse expanded animateOnMount>
          {children}
        </AnimatedCollapse>
      ) : null}
    </>
  )
}

export default MoreOptions
