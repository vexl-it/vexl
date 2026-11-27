import {useNavigation} from '@react-navigation/native'
import {
  IconButton,
  PencilWriteEdit,
  ReachLabel,
  Stack,
  Typography,
  XStack,
  useTheme,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import React from 'react'
import {Pressable} from 'react-native'
import {type ContactPreferencesStackScreenProps} from '../../../../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {getInternationalPhoneNumber} from '../../../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {formatInteger} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import {globalDialogAtom} from '../../../../GlobalDialog'
import {contactSelectMolecule} from '../atom'
import ContactAvatar from './ContactAvatar'
import ContactReachDetails from './ContactReachDetails'
import IsSelectedSwitch from './IsSelectedSwitch'

interface Props {
  contactAtom: Atom<StoredContactWithComputedValues>
}

function ContactItem({contactAtom}: Props): React.ReactElement {
  const contact = useAtomValue(contactAtom)
  const navigation =
    useNavigation<
      ContactPreferencesStackScreenProps<'ContactPreferencesList'>['navigation']
    >()
  const {selectContactAtom, contactReachAtom} = useMolecule(
    contactSelectMolecule
  )
  const theme = useTheme()
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const showDialog = useSetAtom(globalDialogAtom)
  const {
    info: {name},
    computedValues: {normalizedNumber},
  } = contact
  const selectedAtom = selectContactAtom(normalizedNumber)
  const isSelected = useAtomValue(selectedAtom)
  const setSelected = useSetAtom(selectedAtom)
  const reach = useAtomValue(contactReachAtom(normalizedNumber))
  const count =
    reach.type === 'active'
      ? reach.people
      : reach.type === 'pendingOff'
        ? reach.loss
        : 0
  const isLoss = reach.type === 'pendingOff'
  const localizedString = formatInteger(count, locale)
  const reachLabel = t(
    isLoss
      ? 'contactPreferences.contactReach.loss'
      : 'contactPreferences.contactReach.people',
    {count, localizedString}
  )
  const internationalNumber = getInternationalPhoneNumber(normalizedNumber)
  const accessibilityLabel = [
    name,
    internationalNumber,
    ...(count > 0
      ? [
          isLoss
            ? t('contactPreferences.contactReach.sheet.pendingOff', {
                name,
                count,
                localizedString,
              })
            : t('contactPreferences.contactReach.a11yLabel', {
                count,
                localizedString,
              }),
        ]
      : []),
  ].join(', ')
  const showDetails = (): void => {
    Effect.runFork(
      showDialog({
        children: <ContactReachDetails contact={contact} reach={reach} />,
        positiveButtonText: t(
          reach.type === 'unused'
            ? 'contactPreferences.contactReach.sheet.switchOn'
            : 'common.close'
        ),
        negativeButtonText:
          reach.type === 'unused' ? t('common.close') : undefined,
      }).pipe(
        Effect.tap((confirmed) => {
          if (confirmed && reach.type === 'unused') setSelected(true)
        })
      )
    )
  }
  const contactTextColor = isSelected
    ? '$foregroundPrimary'
    : '$foregroundTertiary'
  const contactNumberColor = isSelected
    ? '$foregroundSecondary'
    : '$foregroundTertiary'

  return (
    <XStack testID="@contactItem" ai="center" gap="$3" py="$4" px="$2">
      <Pressable
        style={{flex: 1}}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={showDetails}
      >
        <XStack ai="center" gap="$3">
          <ContactAvatar contact={contact} selected={isSelected} />
          <Stack f={1} gap="$1" minWidth={0}>
            <Typography
              variant="descriptionBold"
              color={contactTextColor}
              numberOfLines={1}
            >
              {name}
            </Typography>
            <Typography
              testID="@contactItem/normalizedNumber"
              variant="micro"
              color={contactNumberColor}
              numberOfLines={1}
            >
              {internationalNumber}
            </Typography>
            {count > 0 ? (
              <ReachLabel
                label={reachLabel}
                tone={isLoss ? 'loss' : 'neutral'}
              />
            ) : null}
          </Stack>
        </XStack>
      </Pressable>
      <XStack gap="$2" ai="center">
        <IconButton
          testID="@contactItem/edit"
          aria-label={t('addContactDialog.editContact')}
          backgroundColor="$backgroundTertiary"
          onPress={() => {
            navigation.navigate('AddNewContact', {
              editContactNumber: normalizedNumber,
            })
          }}
        >
          <PencilWriteEdit size={24} color={theme.foregroundPrimary.get()} />
        </IconButton>
        <IsSelectedSwitch contactNumber={normalizedNumber} />
      </XStack>
    </XStack>
  )
}

export default React.memo(ContactItem)
