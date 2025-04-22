import {getTokens, Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Image, {ImageUniversal} from '../Image'
import infoSvg from '../images/infoSvg'
import clubsRevealIdentityGraphicSvg from './images/clubsRevealIdentityGraphicSvg'

function ClubsRevealIdentityDialogContent(): JSX.Element {
  const {t} = useTranslation()

  return (
    <Stack f={1} ai="center" gap="$2">
      <ImageUniversal
        source={{type: 'svgXml', svgXml: clubsRevealIdentityGraphicSvg}}
      />
      <Text fontFamily="$heading" fontSize={28} color="$black">
        {t('clubs.doYouWantToRevealIdentity')}
      </Text>
      <Text fontSize={18} color="$greyOnWhite">
        {t('clubs.ifYouRevealIdentityToClubMember')}
      </Text>
      <XStack ai="center" gap="$2">
        <Image fill={getTokens().color.red.val} source={infoSvg} />
        <Text fos={16} col="$red">
          {t('clubs.rememberThatTradingInClubsIsLessSafe')}
        </Text>
      </XStack>
    </Stack>
  )
}

export default ClubsRevealIdentityDialogContent
