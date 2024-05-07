import {useFocusEffect} from '@react-navigation/native'
import React, {useCallback, useState} from 'react'
import {Linking} from 'react-native'
import {Stack, Text} from 'tamagui'
import {areContactsPermissionsGranted} from '../../../../../state/contacts/utils'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import EmptyListWrapper from '../../../../EmptyListWrapper'

function ContactsListEmpty(): JSX.Element {
  const {t} = useTranslation()
  const [permissionsGranted, setPermissionsGranted] = useState(false)

  const checkPermissions = useCallback(async () => {
    setPermissionsGranted(await areContactsPermissionsGranted())
  }, [])

  useFocusEffect(
    useCallback(() => {
      void checkPermissions()
    }, [checkPermissions])
  )

  return (
    <EmptyListWrapper
      buttonText={!permissionsGranted ? t('common.allowNow') : undefined}
      onButtonPress={
        !permissionsGranted
          ? () => {
              void Linking.openSettings()
            }
          : undefined
      }
    >
      <Stack space="$2">
        <Text textAlign="center" col="$greyOnWhite" fos={20} ff="$body600">
          {!permissionsGranted
            ? t('contacts.youHaveNotAllowedAccessToYourContacts')
            : t('postLoginFlow.contactsList.nothingFound.title')}
        </Text>
        <Text textAlign="center" fos={14} ta="center" col="$greyOnWhite">
          {!permissionsGranted
            ? t('contacts.didYouChangeYourMind')
            : t('postLoginFlow.contactsList.nothingFound.text')}
        </Text>
      </Stack>
    </EmptyListWrapper>
  )
}

export default ContactsListEmpty
