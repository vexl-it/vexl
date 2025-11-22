import {
  type UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Option} from 'effect/index'
import {atom} from 'jotai'

export const processingNotificationsAtom = atom<
  Array<{
    id: Uuid
    start: UnixMilliseconds
    end: Option.Option<UnixMilliseconds>
    type: 'hook' | 'handler'
  }>
>([])

export const reportProcessingNotificationsStartActionAtom = atom(
  null,
  (get, set, id: Uuid, type: 'hook' | 'handler') => {
    set(processingNotificationsAtom, (prev) => [
      ...prev,
      {id, start: unixMillisecondsNow(), end: Option.none(), type},
    ])
  }
)

export const reportProcessingNotificationEndActionAtom = atom(
  null,
  (get, set, id: Uuid) => {
    set(
      processingNotificationsAtom,
      get(processingNotificationsAtom).map((item) =>
        item.id === id
          ? {...item, end: Option.some(unixMillisecondsNow())}
          : item
      )
    )
  }
)
