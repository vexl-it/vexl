import {useFocusEffect} from '@react-navigation/native'
import {type SpokenLanguage} from '@vexl-next/domain/src/general/offers'
import {
  useSetAtom,
  type PrimitiveAtom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import React, {useCallback} from 'react'
import {Modal} from 'react-native'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Button from '../../../Button'
import Screen from '../../../Screen'
import ScreenTitle from '../../../ScreenTitle'
import SpokenLanguagesList from './SpokenLanguagesList'

interface Props {
  createIsThisLanguageSelectedAtom: (
    spokenLanguageAtom: SpokenLanguage
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
  onClose: () => void
  onSubmit: () => void
  resetSelectedSpokenLanguagesActionAtom: PrimitiveAtom<void>
  visible: boolean
}

function SpokenLanguageSelect({
  createIsThisLanguageSelectedAtom,
  onClose,
  onSubmit,
  resetSelectedSpokenLanguagesActionAtom,
  visible,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const resetSelectedSpokenLanguages = useSetAtom(
    resetSelectedSpokenLanguagesActionAtom
  )

  useFocusEffect(
    useCallback(() => {
      resetSelectedSpokenLanguages()
    }, [resetSelectedSpokenLanguages])
  )

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Screen customHorizontalPadding={getTokens().space[2].val}>
        <ScreenTitle
          text={t('offerForm.spokenLanguages.preferredLanguages')}
          textColor="$greyAccent5"
          onBackButtonPress={onClose}
          withBackButton
        />
        <SpokenLanguagesList
          createIsThisLanguageSelectedAtom={createIsThisLanguageSelectedAtom}
        />
        <Button
          onPress={() => {
            onSubmit()
            onClose()
          }}
          variant="secondary"
          text={t('common.submit')}
        />
      </Screen>
    </Modal>
  )
}

export default SpokenLanguageSelect
