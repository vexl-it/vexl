import {useAtom} from 'jotai'
import React from 'react'
import {XStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {sendReadReceiptsAtom} from '../../../../../utils/preferences'
import Switch from '../../../../Switch'
import ItemText from './ButtonSectionItemText'

function SendReadReceipts(): React.ReactElement {
  const {t} = useTranslation()
  const [sendReadReceipts, setSendReadReceipts] = useAtom(sendReadReceiptsAtom)

  return (
    <XStack f={1} ai="center" jc="space-between">
      <ItemText>{t('settings.items.sendReadReceipts')}</ItemText>
      <Switch
        value={sendReadReceipts}
        onChange={() => {
          setSendReadReceipts(!sendReadReceipts)
        }}
      />
    </XStack>
  )
}

export default SendReadReceipts
