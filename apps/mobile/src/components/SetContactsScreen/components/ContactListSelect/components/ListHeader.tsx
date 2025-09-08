import React from 'react'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import ContactsAccessPrivilegesInfoModal from './ContactsAccessPrivilegesInfoModal'

function ListHeader(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Stack mt="$2" mb="$4" gap="$2">
      <ContactsAccessPrivilegesInfoModal />
      <Text fos={14} ta="center" col="$greyOnWhite">
        {t('postLoginFlow.contactsList.toAddCustomContact')}
      </Text>
    </Stack>
  )
}

export default ListHeader
