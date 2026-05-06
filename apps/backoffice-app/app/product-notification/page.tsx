'use client'

import {useRunEffect} from '@/src/hooks/useRunEffect'
import {getAdminToken} from '@/src/services/adminTokenService'
import {
  makeBackofficeCommonHeaders,
  makeContentAdminClient,
} from '@/src/services/contentAdminApi'
import {
  VexlProductNotificationUuid,
  type VexlProductNotification,
} from '@vexl-next/domain/src/general/vexlProductNotification'
import {Array, Schema} from 'effect'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useState, type SyntheticEvent} from 'react'

interface FormData {
  uuid: string
  title: string
  description: string
  issuePushNotification: boolean
  actionLink: string
  actionText: string
  type: VexlProductNotification['type']
}

const formatNotificationDate = (date: Date): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)

const initialFormData = (): FormData => ({
  uuid: crypto.randomUUID(),
  title: '',
  description: '',
  issuePushNotification: false,
  actionLink: '',
  actionText: '',
  type: 'GENERAL',
})

export default function ProductNotificationPage() {
  const [notifications, setNotifications] = useState<
    readonly VexlProductNotification[]
  >([])
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const runEffect = useRunEffect()
  const router = useRouter()

  const loadNotifications = useCallback(async () => {
    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const client = await runEffect(makeContentAdminClient())
      const result = await runEffect(
        client.getVexlProductNotifications({
          headers: makeBackofficeCommonHeaders(),
          urlParams: {newerThan: new Date(0)},
        })
      )
      setNotifications(result.vexlProductNotifications)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load notifications'
      )
    } finally {
      setLoading(false)
    }
  }, [router, runEffect])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const actionLink = formData.actionLink.trim()
    const actionText = formData.actionText.trim()
    const issuePushNotification = formData.issuePushNotification

    try {
      const vexlProductNotification = {
        uuid: Schema.decodeSync(VexlProductNotificationUuid)(formData.uuid),
        title: formData.title.trim(),
        description: formData.description.trim(),
        issuePushNotification,
        date: new Date(),
        type: formData.type,
        ...(actionLink.length === 0 ? {} : {actionLink}),
        ...(actionText.length === 0 ? {} : {actionText}),
      } satisfies VexlProductNotification

      const client = await runEffect(makeContentAdminClient())
      await runEffect(
        client.createVexlProductNotification({
          headers: {'x-admin-token': adminToken},
          payload: {
            vexlProductNotification,
            issuePushNotification,
          },
        })
      )

      setFormData(initialFormData())
      setSuccess('Product notification issued')
      await loadNotifications()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to issue notification'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Product notification
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Issue and review Vexl product notifications
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <form onSubmit={handleSubmit}>
          <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
            <div>
              <label
                htmlFor="uuid"
                className="block text-sm font-medium text-gray-700"
              >
                UUID *
              </label>
              <input
                id="uuid"
                type="text"
                value={formData.uuid}
                onChange={(e) => {
                  setFormData({...formData, uuid: e.target.value})
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border font-mono"
                required
              />
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({...formData, title: e.target.value})
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({...formData, description: e.target.value})
                }}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                required
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700"
              >
                Type *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    type:
                      e.target.value === 'MARKETING' ? 'MARKETING' : 'GENERAL',
                  })
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
              >
                <option value="GENERAL">General</option>
                <option value="MARKETING">Marketing</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="actionLink"
                className="block text-sm font-medium text-gray-700"
              >
                Action link
              </label>
              <input
                id="actionLink"
                type="url"
                value={formData.actionLink}
                onChange={(e) => {
                  setFormData({...formData, actionLink: e.target.value})
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div>
              <label
                htmlFor="actionText"
                className="block text-sm font-medium text-gray-700"
              >
                Action text
              </label>
              <input
                id="actionText"
                type="text"
                value={formData.actionText}
                onChange={(e) => {
                  setFormData({...formData, actionText: e.target.value})
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={formData.issuePushNotification}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    issuePushNotification: e.target.checked,
                  })
                }}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Issue push notification
            </label>

            {!!error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {!!success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                {success}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(initialFormData())
                }}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Issuing...' : 'Issue notification'}
              </button>
            </div>
          </div>
        </form>

        <div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-600">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No product notifications found</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Notification
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Push
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.map(notifications, (notification) => (
                    <tr key={notification.uuid}>
                      <td className="px-3 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {notification.title}
                        </div>
                        <div className="mt-1 max-w-xl text-gray-500">
                          {notification.description}
                        </div>
                        <div className="mt-1 font-mono text-xs text-gray-400">
                          {notification.uuid}
                        </div>
                        {!!notification.actionLink && (
                          <a
                            href={notification.actionLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-indigo-600 hover:text-indigo-900"
                          >
                            {notification.actionText ?? notification.actionLink}
                          </a>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {notification.type}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatNotificationDate(notification.date)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {notification.issuePushNotification ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
