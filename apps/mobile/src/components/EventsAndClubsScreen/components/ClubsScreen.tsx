import {Text, XStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'

export default function ClubsScreen(): JSX.Element {
  const {t} = useTranslation()
  return (
    <XStack
      p="$3"
      f={1}
      alignContent="center"
      alignItems="center"
      justifyContent="center"
    >
      <Text textAlign="center" fontFamily="$body500" fontSize={16}>
        {t('clubs.commingSoon')}
      </Text>
    </XStack>
  )
}
