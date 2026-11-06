import {cmsErrorMessage} from '@/src/services/cms/api'
import {type CmsResource} from '@/src/services/cms/resources'
import {type CmsStatus} from '@vexl-next/domain/src/general/cms'
import {Array, Option} from 'effect'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'
import {useCms} from './useCms'

/** Loads one item (none for a new one) and saves or unpublishes it. */
export function useCmsItem<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
>(resource: CmsResource<Id, Item, Input>, id: string | null) {
  const cms = useCms()
  const router = useRouter()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(id !== null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (id === null) return

    cms((client, headers) => resource.list(client, headers))
      .then((items) => {
        Option.match(
          Array.findFirst(items, (one) => one.id === id),
          {
            onNone: () => {
              setError('Not found. It may have been deleted.')
            },
            onSome: setItem,
          }
        )
      })
      .catch((loadError: unknown) => {
        setError(cmsErrorMessage(loadError))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [cms, resource, id])

  const setStatus = (itemId: Id, status: CmsStatus): Promise<Item> =>
    cms((client, headers) =>
      resource.setStatus(client, headers, itemId, status)
    )

  const withFeedback = async (
    action: () => Promise<void>,
    successMessage: string
  ): Promise<void> => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await action()
      setSuccess(successMessage)
    } catch (actionError) {
      setError(cmsErrorMessage(actionError))
    } finally {
      setSaving(false)
    }
  }

  const save = (input: Input, publish: boolean): Promise<void> =>
    withFeedback(
      async () => {
        // Kept even if publishing fails, so a retry updates instead of creating.
        const saved = await cms((client, headers) =>
          item === null
            ? resource.create(client, headers, input)
            : resource.update(client, headers, item.id, input)
        )
        setItem(saved)
        if (publish) setItem(await setStatus(saved.id, 'published'))
        if (id === null) router.replace(`${resource.path}/${saved.id}/edit`)
      },
      publish ? 'Saved and published' : 'Saved'
    )

  const unpublish = (): Promise<void> =>
    withFeedback(async () => {
      if (item !== null) setItem(await setStatus(item.id, 'draft'))
    }, 'Unpublished')

  return {item, loading, saving, error, success, save, unpublish}
}
