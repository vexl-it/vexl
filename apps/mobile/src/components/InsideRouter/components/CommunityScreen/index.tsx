import React from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {InsideScreen} from '../InsideScreen'

function CommunityScreen(): React.JSX.Element {
  const {t} = useTranslation()

  return (
    <InsideScreen title={t('tabBar.community')}>
      <></>
    </InsideScreen>
  )
}

export default CommunityScreen
