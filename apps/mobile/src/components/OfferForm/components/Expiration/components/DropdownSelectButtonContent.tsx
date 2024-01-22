import {type JSDateString} from '@vexl-next/domain/src/utility/JSDateString.brand'
import {useAtom, type PrimitiveAtom} from 'jotai'
import {DateTime} from 'luxon'
import {TouchableOpacity} from 'react-native'
import {Text, XStack, getTokens} from 'tamagui'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../utils/localization/I18nProvider'
import Image from '../../../../Image'
import clearInputSvg from '../../../../images/clearInputSvg'

interface Props {
  expirationDateAtom: PrimitiveAtom<JSDateString | undefined>
}

function DropdownSelectButtonContent({expirationDateAtom}: Props): JSX.Element {
  const {t} = useTranslation()
  const locale = getCurrentLocale()
  const [expirationDate, setExpirationDate] = useAtom(expirationDateAtom)

  return (
    <XStack f={1} ai="center" jc="space-between">
      <Text fos={18} ff="$body600" col="$greyOnBlack">
        {expirationDate
          ? DateTime.fromISO(expirationDate).toLocaleString(
              DateTime.DATE_FULL,
              {locale}
            )
          : t('offerForm.expiration.expirationDate')}
      </Text>
      {expirationDate && (
        <TouchableOpacity
          onPress={() => {
            setExpirationDate(undefined)
          }}
        >
          <Image
            height={22}
            stroke={getTokens().color.grey.val}
            source={clearInputSvg}
          />
        </TouchableOpacity>
      )}
    </XStack>
  )
}

export default DropdownSelectButtonContent
