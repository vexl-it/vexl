import {type NoteRepostId} from '@vexl-next/domain/src/general/notes'
import {Array} from 'effect'
import {atom} from 'jotai'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {RepostToConnectionsItems, type RepostToConnectionsItem} from '../domain'

export const repostToConnectionsAtom = atomWithParsedMmkvStorage(
  'repost-to-connections',
  {
    repostToConnections: [],
  },
  RepostToConnectionsItems,
  'account'
)

export const upsertRepostToConnectionsActionAtom = atom<
  null,
  [RepostToConnectionsItem],
  unknown
>(null, (get, set, newValue) => {
  set(repostToConnectionsAtom, (previousValue) => ({
    repostToConnections: [
      ...previousValue.repostToConnections.filter(
        (one) => one.repostId !== newValue.repostId
      ),
      newValue,
    ],
  }))
})

export const deleteRepostToConnectionsActionAtom = atom(
  null,
  (get, set, repostIdsToDelete: readonly NoteRepostId[]) => {
    set(repostToConnectionsAtom, (old) => ({
      repostToConnections: old.repostToConnections.filter(
        (one) => !Array.contains(repostIdsToDelete, one.repostId)
      ),
    }))
  }
)
