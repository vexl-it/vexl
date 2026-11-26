import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Button, SelectableItem, YStack} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React, {useState} from 'react'
import {pickedPhoneNumberOrMain} from '../state/session/sessionPhoneNumbers'
import {userPhoneNumbersAtom} from '../state/session/userDataAtoms'
import {getInternationalPhoneNumber} from '../utils/getInternationalPhoneNumber'
import {useTranslation} from '../utils/localization/I18nProvider'
import {EditIconButton} from './EditIconButton'

// Main number until the user picks another one.
export function usePickedPhoneNumber(): {
  readonly phoneNumbers: Array.NonEmptyReadonlyArray<E164PhoneNumber>
  readonly phoneNumber: E164PhoneNumber
  readonly pickPhoneNumber: (phoneNumber: E164PhoneNumber) => void
} {
  const phoneNumbers = useAtomValue(userPhoneNumbersAtom)
  const [picked, pickPhoneNumber] = useState<E164PhoneNumber>()

  return {
    phoneNumbers,
    phoneNumber: pickedPhoneNumberOrMain(phoneNumbers, picked),
    pickPhoneNumber,
  }
}

// `children` places the "Change number" button, which is null for an account
// with a single number. The list of numbers opens below whatever it renders.
export function ChangePhoneNumber({
  phoneNumbers,
  value,
  onValueChange,
  iconOnly = false,
  children,
}: {
  readonly phoneNumbers: readonly E164PhoneNumber[]
  readonly value: E164PhoneNumber
  readonly onValueChange: (phoneNumber: E164PhoneNumber) => void
  readonly iconOnly?: boolean
  readonly children: (
    changeButton: React.ReactElement | null
  ) => React.ReactNode
}): React.ReactElement {
  const {t} = useTranslation()
  const [choosing, setChoosing] = useState(false)
  const toggleChoosing = (): void => {
    setChoosing((prev) => !prev)
  }

  const changeButton = iconOnly ? (
    <EditIconButton
      aria-label={t('common.changePhoneNumber')}
      aria-expanded={choosing}
      onPress={toggleChoosing}
    />
  ) : (
    <Button
      variant="secondary"
      size="small"
      aria-expanded={choosing}
      onPress={toggleChoosing}
    >
      {t('common.changePhoneNumber')}
    </Button>
  )

  return (
    <>
      {children(phoneNumbers.length > 1 ? changeButton : null)}
      {choosing ? (
        <YStack>
          {pipe(
            phoneNumbers,
            Array.map((one) => (
              <SelectableItem
                key={one}
                label={getInternationalPhoneNumber(one)}
                selected={one === value}
                onPress={() => {
                  onValueChange(one)
                  setChoosing(false)
                }}
              />
            ))
          )}
        </YStack>
      ) : null}
    </>
  )
}
