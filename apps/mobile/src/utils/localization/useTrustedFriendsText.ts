import {useAtomValue} from 'jotai'
import {trustedFriendsEnabledAtom} from '../../state/featureFlags'
import {formatInteger} from './formatting'
import {formattingLocaleAtom} from './formattingLocaleAtom'
import {useTranslation} from './I18nProvider'

export function useTrustedFriendsText(count: number): string | undefined {
  const enabled = useAtomValue(trustedFriendsEnabledAtom)
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)

  return enabled && count > 0
    ? t('marketplace.trustedFriendsCount', {
        count,
        localizedString: formatInteger(count, locale),
      })
    : undefined
}
