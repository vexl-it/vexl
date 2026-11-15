import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {ChecklistCell, PeopleUsers} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {friendChecksAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function FriendCheckCell(): React.ReactElement {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const checks = useAtomValue(friendChecksAtom)
  const vouchedCount = pipe(
    checks,
    Array.filter((check) => check.vouchedByMe),
    Array.length
  )
  const isWaiting = Array.some(
    checks,
    (check) => !check.vouchedByMe && !check.refusal
  )

  const [state, subtitle] = ((): [
    'initial' | 'pending' | 'completed',
    string,
  ] => {
    if (vouchedCount > 0)
      return [
        'completed',
        t('tradeChecklist.friendCheck.cell.vouched', {count: vouchedCount}),
      ]
    if (isWaiting)
      return ['pending', t('tradeChecklist.friendCheck.cell.pending')]
    if (Array.isNonEmptyReadonlyArray(checks))
      return ['initial', t('tradeChecklist.friendCheck.cell.notVouched')]
    return ['initial', t('tradeChecklist.friendCheck.cell.initial')]
  })()

  return (
    <ChecklistCell
      icon={PeopleUsers}
      pressable
      state={state}
      subtitle={subtitle}
      onPress={() => {
        navigation.navigate('FriendCheck')
      }}
      headline={t('tradeChecklist.friendCheck.title')}
    />
  )
}

export default FriendCheckCell
