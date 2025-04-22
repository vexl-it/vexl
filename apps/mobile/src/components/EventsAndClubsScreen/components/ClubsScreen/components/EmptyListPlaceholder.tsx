import {useNavigation} from '@react-navigation/native'
import {Text, YStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {ImageUniversal} from '../../../../Image'
import anonymousAvatarSvg from '../../../../images/anonymousAvatarSvg'

export function EmptyListPlaceholder(): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()

  return (
    <YStack f={1} alignItems="center" justifyContent="center" gap="$4">
      <ImageUniversal source={{type: 'svgXml', svgXml: anonymousAvatarSvg}} />
      <Text textAlign="center" col="$greyOnWhite" fos={20}>
        {t('clubs.noClubYet')}
      </Text>
      <Button
        size="large"
        variant="secondary"
        text={t('suggestion.whatAreClubs')}
        onPress={() => {
          navigation.navigate('Faqs', {pageType: 'WHAT_ARE_VEXL_CLUBS'})
        }}
      />
    </YStack>
  )
}
