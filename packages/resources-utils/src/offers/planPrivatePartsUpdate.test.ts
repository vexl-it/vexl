import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Schema} from 'effect'
import {planPrivatePartsUpdate} from './planPrivatePartsUpdate'

const existing = Schema.decodeSync(PublicKeyV2)('V2_PUB_existing')
const added = Schema.decodeSync(PublicKeyV2)('V2_PUB_added')
const removed = Schema.decodeSync(PublicKeyV2)('V2_PUB_removed')
const club = Schema.decodeSync(ClubUuid)('00000000-0000-4000-8000-000000000001')

it('collects newly added and queued recipients once per offer', () => {
  const plan = planPrivatePartsUpdate({
    currentConnections: {
      firstLevel: [existing, removed],
      secondLevel: [],
      clubs: {},
    },
    targetConnections: {
      firstLevel: [existing, added],
      secondLevel: [added],
      clubs: {[club]: [added]},
    },
    connectionsToRefresh: [existing, existing, removed],
  })

  expect(plan.encryptionCandidates).toEqual(new Set([existing, added, removed]))
})

it('includes changes in connection level even when the recipient already has the offer', () => {
  const plan = planPrivatePartsUpdate({
    currentConnections: {
      firstLevel: [],
      secondLevel: [existing],
      clubs: {},
    },
    targetConnections: {
      firstLevel: [existing],
      secondLevel: [],
      clubs: {},
    },
  })

  expect(plan.encryptionCandidates).toEqual(new Set([existing]))
})
