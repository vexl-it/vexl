import {useNavigation} from '@react-navigation/native'
import {Banner} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../utils/localization/I18nProvider'

function AddIdentityBanner(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()

  return (
    <Banner
      color="pink"
      title={t('editProfileScreen.addIdentity.title')}
      description={t('editProfileScreen.addIdentity.description')}
      primaryButton={{
        label: t('editProfileScreen.addIdentity.button'),
        onPress: () => {
          navigation.navigate('EditIdentity')
        },
      }}
    />
  )
}

export default AddIdentityBanner
