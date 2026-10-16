import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {AddUserPersonContact, Button} from '@vexl-next/ui'
import {Effect, Option, Schema} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {addContactWithUiFeedbackActionAtom} from '../../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {hashPhoneNumberE} from '../../../state/contacts/utils'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {reportErrorE} from '../../../utils/reportError'

export function AddToContactsButton({
  fullPhoneNumber,
  userImage,
  userName,
}: {
  fullPhoneNumber?: string
  userImage?: RealLifeInfo['image']
  userName: string
}): React.ReactElement | null {
  const addRevealedContact = useSetAtom(addContactWithUiFeedbackActionAtom)
  const {t} = useTranslation()
  const [contactAdded, setContactAdded] = React.useState(false)

  const handlePress = (): void => {
    if (!fullPhoneNumber) return

    void Effect.runPromise(
      Effect.gen(function* (_) {
        const normalizedNumber = yield* _(
          Schema.decodeUnknown(E164PhoneNumber)(fullPhoneNumber)
        )
        const hash = yield* _(hashPhoneNumberE(normalizedNumber))

        return yield* _(
          addRevealedContact({
            avatar: userImage,
            info: {
              name: userName,
              numberToDisplay: fullPhoneNumber,
              rawNumber: fullPhoneNumber,
              label: Option.none(),
              nonUniqueContactId: Option.none(),
            },
            computedValues: {
              hash,
              normalizedNumber,
            },
          })
        )
      }).pipe(
        Effect.tap((contactSuccessfullyImportedOrEdited) =>
          Effect.sync(() => {
            if (contactSuccessfullyImportedOrEdited) {
              setContactAdded(true)
            }
          })
        ),
        Effect.tapError((error) =>
          reportErrorE(
            'warn',
            new Error('Error while adding revealed contact from chat message'),
            {error}
          )
        ),
        Effect.ignore
      )
    )
  }

  if (!fullPhoneNumber) return null

  return (
    <Button
      icon={AddUserPersonContact}
      disabled={contactAdded}
      onPress={handlePress}
      size="small"
      variant="tertiary"
      width="100%"
    >
      {t('messages.addToContacts')}
    </Button>
  )
}
