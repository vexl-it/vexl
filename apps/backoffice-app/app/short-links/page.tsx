'use client'

import {ShortLinkClicksChart} from '@/src/components/ShortLinkClicksChart'
import {getAdminToken} from '@/src/services/adminTokenService'
import {copyToClipboard} from '@/src/services/clipboard'
import {publicUrl, usePublicHosts} from '@/src/services/publicHosts'
import {
  createShortLink,
  deleteShortLink,
  listShortLinks,
  updateShortLink,
} from '@/src/services/shortLinks/api'
import {type ShortLink} from '@/src/services/shortLinks/domain'
import {Array, pipe} from 'effect'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useState} from 'react'

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const replaceLink = (
  links: readonly ShortLink[],
  updated: ShortLink
): readonly ShortLink[] =>
  pipe(
    links,
    Array.map((link) => (link.slug === updated.slug ? updated : link))
  )

export default function ShortLinksPage() {
  const hosts = usePublicHosts()
  const router = useRouter()
  const [links, setLinks] = useState<readonly ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newTargetUrl, setNewTargetUrl] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [creating, setCreating] = useState(false)

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    readonly slug: string
    readonly targetUrl: string
  } | null>(null)

  const requireToken = useCallback((): string | null => {
    const adminToken = getAdminToken()
    if (!adminToken) router.push('/login')
    return adminToken
  }, [router])

  const loadLinks = useCallback(async () => {
    const adminToken = requireToken()
    if (!adminToken) return

    setLoading(true)
    setError(null)
    try {
      const result = await listShortLinks(adminToken)
      setLinks(result.links)
    } catch (loadError) {
      setError(errorMessage(loadError, 'Failed to load short links'))
    } finally {
      setLoading(false)
    }
  }, [requireToken])

  useEffect(() => {
    void loadLinks()
  }, [loadLinks])

  const shortUrl = (link: ShortLink): string =>
    publicUrl(hosts.shortLinks, link.slug)

  const handleCreate = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const adminToken = requireToken()
    if (!adminToken) return

    setCreating(true)
    setError(null)
    try {
      const slug = newSlug.trim().toLowerCase()
      const result = await createShortLink(adminToken, {
        targetUrl: newTargetUrl.trim(),
        ...(slug ? {slug} : {}),
      })
      setLinks((current) => [result.link, ...current])
      setNewTargetUrl('')
      setNewSlug('')
    } catch (createError) {
      setError(errorMessage(createError, 'Failed to create short link'))
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async (link: ShortLink) => {
    try {
      await copyToClipboard(shortUrl(link))
      setCopiedSlug(link.slug)
      window.setTimeout(() => {
        setCopiedSlug(null)
      }, 1500)
    } catch {
      setError('Clipboard copy is blocked. Copy the short URL manually.')
    }
  }

  const handleSaveTarget = async () => {
    if (!editing) return
    const adminToken = requireToken()
    if (!adminToken) return

    setError(null)
    try {
      const result = await updateShortLink(adminToken, editing.slug, {
        targetUrl: editing.targetUrl.trim(),
      })
      setLinks((current) => replaceLink(current, result.link))
      setEditing(null)
    } catch (updateError) {
      setError(errorMessage(updateError, 'Failed to update short link'))
    }
  }

  const handleDelete = async (link: ShortLink) => {
    if (!window.confirm(`Delete ${shortUrl(link)}?`)) return
    const adminToken = requireToken()
    if (!adminToken) return

    setError(null)
    try {
      await deleteShortLink(adminToken, link.slug)
      setLinks((current) =>
        pipe(
          current,
          Array.filter((currentLink) => currentLink.slug !== link.slug)
        )
      )
    } catch (deleteError) {
      setError(errorMessage(deleteError, 'Failed to delete short link'))
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-600">Loading short links...</div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Short links</h1>
        <p className="mt-2 text-sm text-gray-700">
          Links served from {hosts.shortLinks}. Only daily click counts are
          recorded.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="mt-6 flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-end"
      >
        <label className="flex-1 text-sm">
          <span className="block font-medium text-gray-700">Target URL</span>
          <input
            type="url"
            required
            value={newTargetUrl}
            onChange={(event) => {
              setNewTargetUrl(event.target.value)
            }}
            placeholder="https://vexl.it/..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <label className="text-sm sm:w-56">
          <span className="block font-medium text-gray-700">Slug</span>
          <div className="mt-1 flex items-center rounded-md border border-gray-300 shadow-sm focus-within:border-indigo-500">
            <span className="pl-3 font-mono text-xs text-gray-500">
              {hosts.shortLinks}/
            </span>
            <input
              type="text"
              value={newSlug}
              onChange={(event) => {
                setNewSlug(event.target.value)
              }}
              pattern="[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,62}[a-zA-Z0-9])?"
              placeholder="random"
              className="min-w-0 flex-1 rounded-md px-2 py-2 font-mono text-gray-900 focus:outline-none"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create'}
        </button>
      </form>

      {!!error && (
        <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-8 overflow-x-auto">
        {links.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow">
            <p className="text-gray-500">No short links yet</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-300 overflow-hidden rounded-lg bg-white shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Short link
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Target
                </th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                  Clicks
                </th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                  Last 7 days
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Created
                </th>
                <th className="relative px-3 py-3.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pipe(
                links,
                Array.map((link) => (
                  <ShortLinkRows
                    key={link.slug}
                    link={link}
                    shortUrl={shortUrl(link)}
                    copied={copiedSlug === link.slug}
                    expanded={expandedSlug === link.slug}
                    editingTargetUrl={
                      editing?.slug === link.slug ? editing.targetUrl : null
                    }
                    onCopy={() => {
                      void handleCopy(link)
                    }}
                    onToggleStats={() => {
                      setExpandedSlug((current) =>
                        current === link.slug ? null : link.slug
                      )
                    }}
                    onStartEdit={() => {
                      setEditing({slug: link.slug, targetUrl: link.targetUrl})
                    }}
                    onEditTargetUrl={(targetUrl) => {
                      setEditing({slug: link.slug, targetUrl})
                    }}
                    onSaveEdit={() => {
                      void handleSaveTarget()
                    }}
                    onCancelEdit={() => {
                      setEditing(null)
                    }}
                    onDelete={() => {
                      void handleDelete(link)
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ShortLinkRows({
  link,
  shortUrl,
  copied,
  expanded,
  editingTargetUrl,
  onCopy,
  onToggleStats,
  onStartEdit,
  onEditTargetUrl,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  readonly link: ShortLink
  readonly shortUrl: string
  readonly copied: boolean
  readonly expanded: boolean
  readonly editingTargetUrl: string | null
  readonly onCopy: () => void
  readonly onToggleStats: () => void
  readonly onStartEdit: () => void
  readonly onEditTargetUrl: (targetUrl: string) => void
  readonly onSaveEdit: () => void
  readonly onCancelEdit: () => void
  readonly onDelete: () => void
}) {
  return (
    <>
      <tr>
        <td className="whitespace-nowrap px-3 py-4 text-sm">
          <a
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-indigo-700 hover:underline"
          >
            {shortUrl}
          </a>
        </td>
        <td className="max-w-md px-3 py-4 text-sm text-gray-700">
          {editingTargetUrl === null ? (
            <a
              href={link.targetUrl}
              target="_blank"
              rel="noreferrer"
              className="block truncate hover:underline"
              title={link.targetUrl}
            >
              {link.targetUrl}
            </a>
          ) : (
            <input
              type="url"
              autoFocus
              value={editingTargetUrl}
              onChange={(event) => {
                onEditTargetUrl(event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onSaveEdit()
                if (event.key === 'Escape') onCancelEdit()
              }}
              className="block w-full rounded-md border border-gray-300 px-2 py-1 text-gray-900 focus:border-indigo-500 focus:outline-none"
            />
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-4 text-right text-sm tabular-nums text-gray-900">
          {link.totalClicks}
        </td>
        <td className="whitespace-nowrap px-3 py-4 text-right text-sm tabular-nums text-gray-900">
          {link.clicksLast7Days}
        </td>
        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
          {new Date(link.createdAt).toLocaleDateString()}
        </td>
        <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
          <div className="flex flex-wrap justify-end gap-3">
            {editingTargetUrl === null ? (
              <>
                <button
                  onClick={onCopy}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={onToggleStats}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  {expanded ? 'Hide stats' : 'Stats'}
                </button>
                <button
                  onClick={onStartEdit}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Edit target
                </button>
                <button
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onSaveEdit}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {!!expanded && (
        <tr>
          <td colSpan={6} className="bg-gray-50 px-3 py-4">
            <p className="mb-2 text-xs font-medium text-gray-500">
              Clicks per day, last 30 days
            </p>
            <ShortLinkClicksChart dailyClicks={link.dailyClicks} />
          </td>
        </tr>
      )}
    </>
  )
}
