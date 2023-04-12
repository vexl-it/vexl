import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import downArrow from '../../../../../images/downArrow'
import addIconSvg from '../../../../../images/addIconSvg'
import {Stack, XStack} from 'tamagui'

interface Props {
  onAddPress: () => void
}

function OffersListButtons({onAddPress}: Props): JSX.Element {
  const {t} = useTranslation()
  return (
    <XStack mt="$4" mx="$2" jc="space-between">
      <Button
        onPress={() => {}}
        variant={'blackOnDark'}
        small
        text={t('offer.filterOffers')}
        afterIcon={downArrow}
      />
      <XStack>
        <Button
          onPress={() => {}}
          variant={'primary'}
          small
          text={t('offer.myOffers')}
        />
        <Stack w="$2" />
        <Button
          onPress={onAddPress}
          variant={'primary'}
          small
          afterIcon={addIconSvg}
        />
      </XStack>
    </XStack>
  )
}

export default OffersListButtons
