import {Separator, Typography, XStack, YStack} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {getInternationalPhoneNumber} from '../../../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import {type ContactReachState} from '../contactReachAtoms'
import ContactAvatar from './ContactAvatar'

function ReachBody({
  reach,
  name,
}: {
  readonly reach: ContactReachState
  readonly name: string
}): React.JSX.Element {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  if (reach.type === 'active') {
    if (reach.people === 0) {
      return (
        <YStack gap="$5">
          <Typography color="$foregroundSecondary" variant="paragraph">
            {t('contactPreferences.contactReach.sheet.zero', {name})}
          </Typography>
          <Typography color="$foregroundSecondary" variant="paragraph">
            {t('contactPreferences.contactReach.sheet.zeroDirect', {name})}
          </Typography>
        </YStack>
      )
    }
    return (
      <YStack gap="$5">
        <YStack gap="$2">
          <Typography color="$foregroundPrimary" variant="heading3">
            {t('contactPreferences.contactReach.people', {
              count: reach.people,
              localizedString: formatInteger(reach.people, locale),
            })}
          </Typography>
          <Typography color="$foregroundSecondary" variant="description">
            {t('contactPreferences.contactReach.sheet.inNetworkThrough', {
              name,
              count: reach.people,
            })}
          </Typography>
        </YStack>
        {reach.exclusive > 0 && (
          <YStack bg="$backgroundTertiary" p="$5" br="$5">
            <Typography color="$foregroundPrimary" variant="description">
              {t('contactPreferences.contactReach.sheet.onlyThrough', {
                name,
                count: reach.exclusive,
                localizedString: formatInteger(reach.exclusive, locale),
              })}
            </Typography>
          </YStack>
        )}
        <Separator borderColor="$backgroundTertiary" />
        <Typography variant="micro" color="$foregroundSecondary">
          {t('contactPreferences.contactReach.sheet.footnote', {name})}
        </Typography>
      </YStack>
    )
  }
  if (reach.type === 'pendingOff') {
    return (
      <Typography color="$foregroundSecondary" variant="paragraph">
        {reach.loss > 0
          ? t('contactPreferences.contactReach.sheet.pendingOff', {
              name,
              count: reach.loss,
              localizedString: formatInteger(reach.loss, locale),
            })
          : t('contactPreferences.contactReach.sheet.pendingOffNoLoss', {
              name,
            })}
      </Typography>
    )
  }
  return (
    <Typography color="$foregroundSecondary" variant="paragraph">
      {t(
        reach.type === 'unused'
          ? 'contactPreferences.contactReach.sheet.unused'
          : reach.type === 'pendingOn'
            ? 'contactPreferences.contactReach.sheet.pendingOn'
            : 'contactPreferences.contactReach.sheet.notSynced',
        {name}
      )}
    </Typography>
  )
}

export default function ContactReachDetails({
  contact,
  reach,
}: {
  readonly contact: StoredContactWithComputedValues
  readonly reach: ContactReachState
}): React.JSX.Element {
  const name = contact.info.name
  return (
    <YStack gap="$5">
      <XStack ai="center" gap="$4">
        <ContactAvatar contact={contact} />
        <YStack f={1} gap="$1">
          <Typography color="$foregroundPrimary" variant="descriptionBold">
            {name}
          </Typography>
          <Typography variant="micro" color="$foregroundSecondary">
            {getInternationalPhoneNumber(
              contact.computedValues.normalizedNumber
            )}
          </Typography>
        </YStack>
      </XStack>
      <ReachBody reach={reach} name={name} />
    </YStack>
  )
}
