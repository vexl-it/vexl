import {type KeyHolder} from '@vexl-next/cryptography'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'

function getClubConnectionsForUuids({
  clubsUuids,
  myStoredClubs,
}: {
  clubsUuids: ClubUuid[]
  myStoredClubs: Record<ClubUuid, KeyHolder.PrivateKeyHolder>
}): PublicKeyPemBase64[] {
  return Array.from(clubsUuids)
    .map((clubUuid) => myStoredClubs[clubUuid])
    .filter((entry) => !!entry)
    .map((one) => one.publicKeyPemBase64)
}

export default getClubConnectionsForUuids
