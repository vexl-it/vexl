import {useAtom, useAtomValue, type PrimitiveAtom} from 'jotai'
import {Text, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {showClubsFlowAtom} from '../../../utils/preferences'
import Switch from '../../Switch'

interface Props {
  showClubOffersAtom: PrimitiveAtom<boolean | undefined>
}

function ShowClubOffers({showClubOffersAtom}: Props): JSX.Element | null {
  const {t} = useTranslation()

  const [showClubOffers, setShowClubOffers] = useAtom(showClubOffersAtom)
  const showClubsFlow = useAtomValue(showClubsFlowAtom)

  if (!showClubsFlow) return null

  return (
    <YStack gap="$2">
      <XStack ai="center" jc="space-between">
        <Text fos={24} ff="$body700" col="$white">
          {t('filterOffers.showVexlClubsOffers')}
        </Text>
        <Switch value={showClubOffers} onValueChange={setShowClubOffers} />
      </XStack>
      <Text fos={16} ff="$body500" col="$greyOnBlack">
        {t('filterOffers.vexlClubsConnectYouToOffers')}
      </Text>
    </YStack>
  )
}

export default ShowClubOffers
