import Clipboard from '@react-native-clipboard/clipboard'
import {Banner, Image} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import openUrl from '../../../utils/openUrl'
import {toastNotificationAtom} from '../../ToastNotification/atom'

const NITRO_PHONE_DISCOUNT_CODE = 'VEXL2025'

function NitroPhoneBanner(): React.ReactElement {
  const {t} = useTranslation()
  const nitroPhoneWeb = t('phoneCooperation.nitroPhoneWeb')
  const setToastNotification = useSetAtom(toastNotificationAtom)

  const handleCopyCodePress = useCallback(() => {
    Clipboard.setString(NITRO_PHONE_DISCOUNT_CODE)
    setToastNotification(t('common.copied'))
  }, [setToastNotification, t])

  const handleMoreInfoPress = useCallback(() => {
    openUrl(nitroPhoneWeb)()
  }, [nitroPhoneWeb])

  return (
    <Banner
      color="pink"
      title={t('phoneCooperation.vexlLovesNitrokey')}
      description={t('phoneCooperation.useCodeForNitrophoneDiscount', {
        code: NITRO_PHONE_DISCOUNT_CODE,
      })}
      image={
        <Image
          objectFit="cover"
          source={require('../images/nitro_phone.png')}
          style={{height: 112, width: '100%'}}
        />
      }
      primaryButton={{
        label: t('phoneCooperation.copyCode'),
        onPress: handleCopyCodePress,
      }}
      secondaryButton={{
        label: t('phoneCooperation.moreInfo'),
        onPress: handleMoreInfoPress,
      }}
    />
  )
}

export default NitroPhoneBanner
