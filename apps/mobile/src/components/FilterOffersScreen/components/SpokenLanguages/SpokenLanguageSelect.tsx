import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Modal} from 'react-native'
import {Stack} from 'tamagui'
import ScreenTitle from '../../../ScreenTitle'
import IconButton from '../../../IconButton'
import closeSvg from '../../../images/closeSvg'
import Button from '../../../Button'
import SpokenLanguagesList from './SpokenLanguagesList'
import {useFocusEffect} from '@react-navigation/native'
import {resetSpokenLanguagesToInitialStateActionAtom} from '../../atom'

interface Props {
  onClose: () => void
  onSubmit: () => void
  visible: boolean
}

function SpokenLanguageSelect({
  onClose,
  onSubmit,
  visible,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const {bottom, top} = useSafeAreaInsets()
  const resetSpokenLanguagesToInitialState = useSetAtom(
    resetSpokenLanguagesToInitialStateActionAtom
  )

  useFocusEffect(
    useCallback(() => {
      resetSpokenLanguagesToInitialState()
    }, [resetSpokenLanguagesToInitialState])
  )

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Stack f={1} bc={'$grey'} px={'$4'} pb={bottom} pt={top}>
        <ScreenTitle
          text={t('offerForm.spokenLanguages.preferredLanguages')}
          textColor={'$greyAccent5'}
        >
          <IconButton variant={'dark'} icon={closeSvg} onPress={onClose} />
        </ScreenTitle>
        <SpokenLanguagesList />
        <Button
          onPress={() => {
            onSubmit()
            onClose()
          }}
          variant={'secondary'}
          text={t('common.submit')}
        />
      </Stack>
    </Modal>
  )
}

export default SpokenLanguageSelect
