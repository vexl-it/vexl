import {Text, YStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

export function EmptyListPlaceholder(): JSX.Element {
  const {t} = useTranslation()
  return (
    <YStack f={1} alignItems="center" alignContent="center">
      <Text ff="$body600" fs={24}>
        {t('clubs.noClubYet')}
      </Text>
    </YStack>
  )
}
