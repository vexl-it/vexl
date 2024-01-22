import {useAtom} from 'jotai'
import {XStack} from 'tamagui'
import {screenshotsDisabledAtom} from '../../../../../state/showYouDidNotAllowScreenshotsActionAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Switch from '../../../../Switch'
import ItemText from './ButtonSectionItemText'

function AllowScreenshots(): JSX.Element {
  const {t} = useTranslation()
  const [screenshotsDisabled, setScreenshotsDisabled] = useAtom(
    screenshotsDisabledAtom
  )

  return (
    <XStack f={1} ai="center" jc="space-between">
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
