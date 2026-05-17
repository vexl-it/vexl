import {Stack, Typography} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import ContactsAccessPrivilegesInfoModal from './ContactsAccessPrivilegesInfoModal'

function ListHeader(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <Stack mt="$2" mb="$4" gap="$2">
      <ContactsAccessPrivilegesInfoModal />
      <Typography
        variant="description"
        textAlign="center"
        color="$foregroundSecondary"
      >
        {t('postLoginFlow.contactsList.toAddCustomContact')}
      </Typography>
    </Stack>
  )
}

export default ListHeader
