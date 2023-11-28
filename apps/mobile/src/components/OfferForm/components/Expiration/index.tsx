import DropdownSelectButton from '../../../DropdownSelectButton'
import {type PrimitiveAtom, useSetAtom} from 'jotai'
import OfferExpirationModal from './components/OfferExpirationModal'
import {type JSDateString} from '../../../../../../../packages/domain/src/utility/JSDateString.brand'
import {Text} from 'tamagui'
import {DateTime} from 'luxon'
import {useAtom} from 'jotai/index'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../utils/localization/I18nProvider'

interface Props {
  expirationDateAtom: PrimitiveAtom<JSDateString | undefined>
  offerExpirationModalVisibleAtom: PrimitiveAtom<boolean>
}

function Expiration({
  expirationDateAtom,
  offerExpirationModalVisibleAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const locale = getCurrentLocale()
  const [expirationDate, setExpirationDate] = useAtom(expirationDateAtom)
  const setOfferExpirationModalVisible = useSetAtom(
    offerExpirationModalVisibleAtom
  )

  return (
    <>
      <DropdownSelectButton
        clearButtonVisible={!!expirationDate}
        onClearPress={() => {
          setExpirationDate(undefined)
        }}
        onPress={() => {
          setOfferExpirationModalVisible(true)
        }}
      >
        <Text
          fos={18}
          ff={'$body600'}
          col={expirationDate ? '$main' : '$greyOnBlack'}
        >
          {expirationDate
            ? DateTime.fromISO(expirationDate).toLocaleString(
                DateTime.DATE_FULL,
                {locale}
              )
            : t('offerForm.expiration.expirationDate')}
        </Text>
      </DropdownSelectButton>
      <OfferExpirationModal
        expirationDateAtom={expirationDateAtom}
        offerExpirationModalVisibleAtom={offerExpirationModalVisibleAtom}
      />
    </>
  )
}

export default Expiration
