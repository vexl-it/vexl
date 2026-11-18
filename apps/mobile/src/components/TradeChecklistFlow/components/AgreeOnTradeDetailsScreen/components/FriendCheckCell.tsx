import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {ChecklistCell, PeopleUsers} from '@vexl-next/ui'
import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {friendCheckSubjectAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

function FriendCheckCell(): React.ReactElement {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const subject = useAtomValue(friendCheckSubjectAtom)
  const nickname = Option.getOrUndefined(subject)?.nickname

  return (
    <ChecklistCell
      icon={PeopleUsers}
      pressable
      state="initial"
      subtitle={
        Option.isNone(subject)
          ? t('tradeChecklist.friendCheck.cell.revealFirst')
          : nickname
            ? t('tradeChecklist.friendCheck.cell.subtitle', {name: nickname})
            : t('tradeChecklist.friendCheck.cell.subtitleUnnamed')
      }
      onPress={() => {
        navigation.navigate('FriendCheck')
      }}
      headline={t('tradeChecklist.friendCheck.title')}
    />
  )
}

export default FriendCheckCell
