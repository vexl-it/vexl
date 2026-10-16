import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {
  VexlbotActionCard as UiVexlbotActionCard,
  type VexlbotActionCardProps,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {atom, useAtom} from 'jotai'
import React, {useMemo} from 'react'
import {type ChatTransientMessageId} from '../../../../../state/chat/domain'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {chatMolecule} from '../../../atoms'

interface Props extends Omit<
  VexlbotActionCardProps,
  'brandLabel' | 'botLabel'
> {
  readonly managedHidingId?: ChatMessageId | ChatTransientMessageId | undefined
}

export default function VexlbotActionCard({
  managedHidingId,
  onClosePress,
  ...rest
}: Props): React.JSX.Element | null {
  const {t} = useTranslation()
  const {createHideMessageAtom} = useMolecule(chatMolecule)
  const [isHidden, setHidden] = useAtom(
    useMemo(() => {
      if (!managedHidingId) return atom(false)
      return createHideMessageAtom(managedHidingId)
    }, [createHideMessageAtom, managedHidingId])
  )

  if (isHidden) return null
  return (
    <UiVexlbotActionCard
      mx="$4"
      {...rest}
      brandLabel={t('common.vexl')}
      botLabel={t('vexlbot.bot')}
      onClosePress={
        onClosePress ??
        (managedHidingId
          ? () => {
              setHidden(true)
            }
          : undefined)
      }
    />
  )
}
