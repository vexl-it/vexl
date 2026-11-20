'use client'

import {
  CLICKS_RANGE_DAYS,
  ShortLinkClicksChart,
} from '@/src/components/ShortLinkClicksChart'
import {
  Button,
  buttonClassName,
  CopyButton,
  ExternalLinkIcon,
  Field,
  FormMessage,
  Input,
  Modal,
  TrashIcon,
} from '@/src/components/ui'
import {makeApiErrorMessage} from '@/src/services/apiErrorMessage'
import {formatDate, formatNumber} from '@/src/services/format'
import {publicUrl, usePublicHosts} from '@/src/services/publicHosts'
import {updateShortLink} from '@/src/services/shortLinks/api'
import {isHttpUrl, type ShortLink} from '@/src/services/shortLinks/domain'
import {Array, pipe} from 'effect'
import {useState} from 'react'
import {clicksInRange} from './format'

const errorMessage = makeApiErrorMessage({})

export function ShortLinkDetailsModal({
  link,
  onUpdated,
  onDelete,
  onClose,
}: {
  readonly link: ShortLink
  readonly onUpdated: (link: ShortLink) => void
  readonly onDelete: () => void
  readonly onClose: () => void
}) {
  const hosts = usePublicHosts()
  const shortUrl = publicUrl(hosts.shortLinks, link.slug)
  const [targetUrl, setTargetUrl] = useState(link.targetUrl)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const target = targetUrl.trim()
  const valid = isHttpUrl(target)
  const rangeClicks = clicksInRange(link)

  const handleSave = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const result = await updateShortLink(link.slug, {targetUrl: target})
      onUpdated(result.link)
      setSaved(true)
    } catch (updateError) {
      setError(errorMessage(updateError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={<span className="font-mono break-all">{shortUrl}</span>}
      description={
        link.updatedAt === link.createdAt
          ? `Created ${formatDate(link.createdAt)}`
          : `Created ${formatDate(link.createdAt)} · target changed ${formatDate(link.updatedAt)}`
      }
      footer={
        <>
          <Button
            variant="ghost"
            icon={<TrashIcon />}
            className="mr-auto"
            onClick={onDelete}
          >
            Delete link
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <CopyButton value={shortUrl} label="Copy short URL" size="md" />
          <a
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonClassName({variant: 'ghost'})}
          >
            <ExternalLinkIcon />
            Open
          </a>
        </div>

        <form onSubmit={handleSave} noValidate className="space-y-3">
          <div className="flex items-start gap-2">
            <Field
              label="Target URL"
              className="min-w-0 flex-1"
              hint="Changing it redirects everyone who already has the short link."
              error={
                valid
                  ? null
                  : 'Enter a full URL starting with https:// or http://'
              }
            >
              <Input
                type="url"
                value={targetUrl}
                onChange={(event) => {
                  setTargetUrl(event.target.value)
                  setSaved(false)
                }}
                invalid={!valid}
              />
            </Field>
            <Button
              type="submit"
              variant="primary"
              className="mt-6.5"
              loading={saving}
              disabled={!valid || target === link.targetUrl}
            >
              Save
            </Button>
          </div>
          <FormMessage
            error={error}
            success={saved ? 'Target updated.' : null}
          />
        </form>

        <dl className="grid grid-cols-3 gap-3">
          {pipe(
            [
              {label: 'All time', value: link.totalClicks},
              {label: `Last ${CLICKS_RANGE_DAYS} days`, value: rangeClicks},
              {label: 'Last 7 days', value: link.clicksLast7Days},
            ],
            Array.map(({label, value}) => (
              <div
                key={label}
                className="rounded-control border border-line px-3 py-2.5"
              >
                <dt className="text-xs text-ink-muted">{label}</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                  {formatNumber(value)}
                </dd>
              </div>
            ))
          )}
        </dl>

        <div>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-ink-subtle uppercase">
            Clicks per day, last {CLICKS_RANGE_DAYS} days
          </h3>
          {rangeClicks > 0 ? (
            <ShortLinkClicksChart dailyClicks={link.dailyClicks} />
          ) : (
            <p className="rounded-control border border-dashed border-line-strong px-4 py-8 text-center text-ink-muted">
              No clicks in the last {CLICKS_RANGE_DAYS} days.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
