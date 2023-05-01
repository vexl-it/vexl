import {Text, YStack} from 'tamagui'
import Button from '../../../../Button'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useNavigation} from '@react-navigation/native'

function EmptyListPlaceholder(): JSX.Element {
  const navigation = useNavigation()
  const {t} = useTranslation()
  // const refresh = useTriggerOffersRefresh()

  return (
    <YStack flex={1} space="$4" ai={'center'} py="$4" jc={'center'} f={1}>
      <Text color="$white" fos={20} ff={'$body600'}>
        {t('offer.listEmpty')}
      </Text>
      <Button
        text={t('offer.emptyAction')}
        variant={'primary'}
        small={true}
        onPress={() => {
          navigation.navigate('CreateOffer')
        }}
      ></Button>
    </YStack>
  )
}

export default EmptyListPlaceholder
