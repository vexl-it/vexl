import {Stack, UsageMeter} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import {contactSelectMolecule} from '../atom'
import BulkSelectionButton from './BulkSelectionButton'

export default function ContactUsageMeter({
  onReviewUnused,
}: {
  readonly onReviewUnused: () => void
}): React.JSX.Element {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {contactUsageAtom} = useMolecule(contactSelectMolecule)
  const {used, total} = useAtomValue(contactUsageAtom)
  return (
    <Stack bg="$backgroundPrimary" py="$4">
      <UsageMeter
        used={used}
        total={total}
        label={t(
          used < total
            ? 'contactPreferences.usage.using'
            : 'contactPreferences.usage.usingAll',
          {
            used: formatInteger(used, locale),
            total: formatInteger(total, locale),
          }
        )}
        action={<BulkSelectionButton />}
        linkLabel={t('contactPreferences.usage.reviewUnused')}
        onLinkPress={onReviewUnused}
      />
    </Stack>
  )
}
