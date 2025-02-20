import {useAtomValue} from 'jotai'
import {Stack, Text} from 'tamagui'
import {type PostLoginFlowStackScreenProps} from '../../../../navigationTypes'
import {useFinishPostLoginFlow} from '../../../../state/postLoginOnboarding'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {showClubsFlowAtom} from '../../../../utils/preferences'
import Image from '../../../Image'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'
import WhiteContainer from '../../../WhiteContainer'
import findOffersInVexlClubsSvg from './image/findOffersInVexlClubsSvg'

type Props = PostLoginFlowStackScreenProps<'FindOffersInVexlClubsScreen'>

function FindOffersInVexlClubsScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const finishPostLoginFlow = useFinishPostLoginFlow()
  const showClubsFlow = useAtomValue(showClubsFlowAtom)

  return (
    <WhiteContainer testID="@findOffersInVexlClubsScreen">
      <Stack f={1} jc="space-between">
        <HeaderProxy showBackButton={false} progressNumber={3} />
        <Stack f={1} ai="center" mb="$4">
          <Image
            style={{height: '100%', width: '100%'}}
            resizeMode="contain"
            source={findOffersInVexlClubsSvg}
          />
        </Stack>
        <Stack jc="space-around">
          <Stack>
            <Text col="$black" mb="$3" fos={28} ff="$heading">
              {t('postLoginFlow.findOffersInVexlClubs.title')}
            </Text>
          </Stack>
          <Text fos={16} ff="$body500" mb="$6" col="$greyOnWhite">
            {t('postLoginFlow.findOffersInVexlClubs.text')}
          </Text>
        </Stack>
        {!!showClubsFlow && (
          <NextButtonProxy
            disabled={false}
            text={t('clubs.joinNewClub')}
            onPress={() => {
              navigation.navigate('JoinClubFlow', {
                screen: 'ScanClubQrCodeScreen',
              })
            }}
            secondButton={{
              text: t('common.skip'),
              onPress: finishPostLoginFlow,
            }}
          />
        )}
      </Stack>
    </WhiteContainer>
  )
}

export default FindOffersInVexlClubsScreen
