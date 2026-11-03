import {PersonRow} from '@vexl-next/ui'
import React from 'react'
import {type StoredContactWithComputedValues} from '../../../state/contacts/domain'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {ContactAvatar} from '../../ContactAvatar'

function VexlOnlyContactItem({
  contact,
}: {
  readonly contact: StoredContactWithComputedValues
}): React.ReactElement {
  const {
    info: {nonUniqueContactId, name},
    computedValues: {normalizedNumber},
  } = contact

  return (
    <PersonRow
      avatar={<ContactAvatar contactId={nonUniqueContactId} size="$9" />}
      title={name}
      subtitle={getInternationalPhoneNumber(normalizedNumber)}
    />
  )
}

export default React.memo(VexlOnlyContactItem)
