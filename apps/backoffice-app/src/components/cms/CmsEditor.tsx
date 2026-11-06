'use client'

import {useCmsItem} from '@/src/hooks/useCmsItem'
import {type CmsResource} from '@/src/services/cms/resources'
import {type CmsStatus} from '@vexl-next/domain/src/general/cms'
import Link from 'next/link'
import {type ReactNode} from 'react'
import {FormMessage} from './fields'

export interface CmsFormProps<Item, Input> {
  readonly item: Item | null
  readonly saving: boolean
  readonly error: string | null
  readonly success: string | null
  readonly onSave: (input: Input, publish: boolean) => void
  readonly onUnpublish: () => void
}

interface Props<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
> {
  readonly resource: CmsResource<Id, Item, Input>
  /** None for a new item. */
  readonly id: string | null
  readonly title: string
  readonly renderForm: (props: CmsFormProps<Item, Input>) => ReactNode
}

export function CmsEditor<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
>({resource, id, title, renderForm}: Props<Id, Item, Input>) {
  const {item, loading, saving, error, success, save, unpublish} = useCmsItem(
    resource,
    id
  )

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div>
        <Link
          href={resource.path}
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          ← Back to list
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">{title}</h1>
      </div>
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : id !== null && item === null ? (
        <FormMessage error={error} />
      ) : (
        renderForm({
          item,
          saving,
          error,
          success,
          onSave: (input, publish) => {
            void save(input, publish)
          },
          onUnpublish: () => {
            void unpublish()
          },
        })
      )}
    </div>
  )
}
