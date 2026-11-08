import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {RowCheckbox, ScrollView, YStack} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {type PrimitiveAtom, useAtom} from 'jotai'
import React from 'react'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {type StoredContactWithComputedValues} from '../domain'

const MAX_LIST_HEIGHT = 360

function ContactToKeepRow({
  contact,
  numbersToKeepAtom,
}: {
  readonly contact: StoredContactWithComputedValues
  readonly numbersToKeepAtom: PrimitiveAtom<readonly E164PhoneNumber[]>
}): React.ReactElement {
  const [numbersToKeep, setNumbersToKeep] = useAtom(numbersToKeepAtom)
  const {normalizedNumber} = contact.computedValues

  return (
    <RowCheckbox
      label={contact.info.name}
      description={getInternationalPhoneNumber(normalizedNumber)}
      checked={Array.contains(numbersToKeep, normalizedNumber)}
      onCheckedChange={(checked) => {
        setNumbersToKeep((previous) =>
          checked
            ? pipe(previous, Array.append(normalizedNumber), Array.dedupe)
            : pipe(
                previous,
                Array.filter((number) => number !== normalizedNumber)
              )
        )
      }}
    />
  )
}

export function SelectContactsToKeepInVexlComponent({
  contacts,
  numbersToKeepAtom,
}: {
  readonly contacts: readonly StoredContactWithComputedValues[]
  readonly numbersToKeepAtom: PrimitiveAtom<readonly E164PhoneNumber[]>
}): React.ReactElement {
  return (
    <ScrollView
      maxHeight={MAX_LIST_HEIGHT}
      showsVerticalScrollIndicator={Array.length(contacts) > 3}
    >
      <YStack gap="$3">
        {pipe(
          contacts,
          Array.map((contact) => (
            <ContactToKeepRow
              key={contact.computedValues.normalizedNumber}
              contact={contact}
              numbersToKeepAtom={numbersToKeepAtom}
            />
          ))
        )}
      </YStack>
    </ScrollView>
  )
}
