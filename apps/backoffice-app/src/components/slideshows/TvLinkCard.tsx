'use client'

import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CopyButton,
  ExternalLinkIcon,
  FormMessage,
  Input,
  RefreshIcon,
  useConfirm,
} from '@/src/components/ui'
import {publicUrl, usePublicHosts} from '@/src/services/publicHosts'
import {regenerateSlideshowToken} from '@/src/services/slideshows/api'
import {type TvSlideshow} from '@/src/services/slideshows/domain'
import {useState} from 'react'
import {regenerateLinkConfirmation, tvUrl} from './tvLink'

type Regeneration = 'idle' | 'running' | 'done' | {readonly error: string}

export function TvLinkCard({
  slideshow,
  onRegenerated,
}: {
  readonly slideshow: TvSlideshow
  readonly onRegenerated: (slideshow: TvSlideshow) => void
}) {
  const hosts = usePublicHosts()
  const {confirm, dialog} = useConfirm()
  const [regeneration, setRegeneration] = useState<Regeneration>('idle')
  const url = tvUrl(hosts, slideshow)

  const regenerate = async () => {
    if (!(await confirm(regenerateLinkConfirmation(hosts, slideshow)))) return

    setRegeneration('running')
    try {
      onRegenerated((await regenerateSlideshowToken(slideshow.uuid)).slideshow)
      setRegeneration('done')
    } catch (error) {
      setRegeneration({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to regenerate the link',
      })
    }
  }

  return (
    <Card
      title="TV link"
      description="Open it in the TV's browser. Anyone with the link can watch."
    >
      <div className="space-y-3">
        <Input
          readOnly
          aria-label="TV link"
          value={url}
          className="font-mono text-xs"
          onFocus={(event) => {
            event.target.select()
          }}
        />
        <div className="flex flex-wrap gap-2">
          <CopyButton value={url} label="Copy link" />
          <ButtonLink
            href={url}
            target="_blank"
            rel="noreferrer"
            size="sm"
            icon={<ExternalLinkIcon />}
          >
            Open
          </ButtonLink>
          <Button
            size="sm"
            icon={<RefreshIcon />}
            loading={regeneration === 'running'}
            onClick={regenerate}
          >
            Regenerate link
          </Button>
        </div>
        {slideshow.publicSlug ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
            The link with the token works too.
            <CopyButton
              variant="ghost"
              value={publicUrl(hosts.slideshows, slideshow.publicToken)}
              label="Copy token link"
            />
          </div>
        ) : null}
        <FormMessage
          error={typeof regeneration === 'object' ? regeneration.error : null}
          success={
            regeneration === 'done'
              ? 'New link created. Open it on every TV that used the old one.'
              : null
          }
        />
        {slideshow.isEnabled ? null : (
          <Alert tone="warning">
            Disabled: the link shows “Slideshow not found” until you enable the
            slideshow and save.
          </Alert>
        )}
      </div>
      {dialog}
    </Card>
  )
}
