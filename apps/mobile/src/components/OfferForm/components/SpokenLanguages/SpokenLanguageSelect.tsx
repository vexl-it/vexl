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
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Button from '../../../Button'
import IconButton from '../../../IconButton'
import ScreenTitle from '../../../ScreenTitle'
import closeSvg from '../../../images/closeSvg'
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
}: Props): JSX.Element {
  const {t} = useTranslation()
  const {bottom, top} = useSafeAreaInsets()
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
      <Stack f={1} bc="$grey" px="$4" pb={bottom} pt={top}>
        <ScreenTitle
          text={t('offerForm.spokenLanguages.preferredLanguages')}
          textColor="$greyAccent5"
        >
          <IconButton variant="dark" icon={closeSvg} onPress={onClose} />
        </ScreenTitle>
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
      </Stack>
    </Modal>
  )
}

export default SpokenLanguageSelect
