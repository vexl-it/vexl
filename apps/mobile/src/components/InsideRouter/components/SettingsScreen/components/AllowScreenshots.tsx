import {XStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Switch from '../../../../Switch'
import {useAtom} from 'jotai'
import ItemText from './ButtonSectionItemText'
import {screenshotsDisabledAtom} from '../../../../../state/showYouDidNotAllowScreenshotsActionAtom'

function AllowScreenshots(): JSX.Element {
  const {t} = useTranslation()
  const [screenshotsDisabled, setScreenshotsDisabled] = useAtom(
    screenshotsDisabledAtom
  )

  return (
    <XStack f={1} ai={'center'} jc={'space-between'}>
      <ItemText>{t('settings.items.allowScreenshots')}</ItemText>
      <Switch
        value={!screenshotsDisabled}
        onChange={() => {
          setScreenshotsDisabled(!screenshotsDisabled)
        }}
      />
    </XStack>
  )
}

export default AllowScreenshots
