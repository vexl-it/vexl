'use client'

import {useCms} from '@/src/hooks/useCms'
import {cmsErrorMessage} from '@/src/services/cms/api'
import {type CmsResource} from '@/src/services/cms/resources'
import {type CmsStatus} from '@vexl-next/domain/src/general/cms'
import {Array, pipe} from 'effect'
import Link from 'next/link'
import {useCallback, useEffect, useState, type ReactNode} from 'react'
import {StatusBadge} from './StatusBadge'

interface Column<Item> {
  readonly header: string
  readonly render: (item: Item) => ReactNode
}

interface Props<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
> {
  readonly resource: CmsResource<Id, Item, Input>
  readonly title: string
  readonly newLabel: string
  readonly columns: ReadonlyArray<Column<Item>>
  readonly itemName: (item: Item) => string
  /** Posts are published from the edit page, next to their preview. */
  readonly publishFromList: boolean
}

export function CmsListPage<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
>({
  resource,
  title,
  newLabel,
  columns,
  itemName,
  publishFromList,
}: Props<Id, Item, Input>) {
  const cms = useCms()
  const [items, setItems] = useState<readonly Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await cms((client, headers) => resource.list(client, headers)))
    } catch (loadError) {
      setError(cmsErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [cms, resource])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const replaceItem = (updated: Item) => {
    setItems((current) =>
      Array.map(current, (one) => (one.id === updated.id ? updated : one))
    )
  }

  const handleSetStatus = async (item: Item, status: CmsStatus) => {
    setError(null)
    try {
      replaceItem(
        await cms((client, headers) =>
          resource.setStatus(client, headers, item.id, status)
        )
      )
    } catch (statusError) {
      setError(cmsErrorMessage(statusError))
    }
  }

  const handleDelete = async (item: Item) => {
    if (!window.confirm(`Delete "${itemName(item)}"? This cannot be undone.`))
      return

    setError(null)
    try {
      await cms((client, headers) => resource.remove(client, headers, item.id))
      setItems((current) =>
        pipe(
          current,
          Array.filter((one) => one.id !== item.id)
        )
      )
    } catch (deleteError) {
      setError(cmsErrorMessage(deleteError))
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <h1 className="sm:flex-auto text-2xl font-semibold text-gray-900">
          {title}
        </h1>
        <Link
          href={`${resource.path}/create`}
          className="mt-4 sm:mt-0 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          {newLabel}
        </Link>
      </div>

      {!!error && (
        <div className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 text-center text-gray-600">Loading…</div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                {Array.map(columns, (column) => (
                  <th
                    key={column.header}
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    {column.header}
                  </th>
                ))}
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.map(items, (item) => (
                <tr key={item.id}>
                  {Array.map(columns, (column) => (
                    <td
                      key={column.header}
                      className="px-3 py-4 text-sm text-gray-700"
                    >
                      {column.render(item)}
                    </td>
                  ))}
                  <td className="px-3 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-4 text-sm font-medium">
                      <Link
                        href={`${resource.path}/${item.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                      {item.status === 'published' ? (
                        <button
                          type="button"
                          onClick={() => {
                            void handleSetStatus(item, 'draft')
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Unpublish
                        </button>
                      ) : publishFromList ? (
                        <button
                          type="button"
                          onClick={() => {
                            void handleSetStatus(item, 'published')
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Publish
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          void handleDelete(item)
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="py-12 text-center text-gray-500">Nothing here yet</p>
          )}
        </div>
      )}
    </div>
  )
}
