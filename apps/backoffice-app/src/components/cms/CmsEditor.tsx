'use client'

import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ExternalLinkIcon,
  FormMessage,
  Page,
  PageHeader,
  StatusMessage,
  useConfirm,
} from '@/src/components/ui'
import {useCmsImageUpload} from '@/src/hooks/useCms'
import {useCmsItem} from '@/src/hooks/useCmsItem'
import {isScheduled, type CmsResource} from '@/src/services/cms/resources'
import {formatDateTime} from '@/src/services/format'
import {type CmsStatus} from '@vexl-next/domain/src/general/cms'
import {Either} from 'effect'
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {StatusBadge} from './StatusBadge'

export interface CmsFieldsProps<Item, Draft> {
  /** Null until the item is saved for the first time. */
  readonly item: Item | null
  readonly draft: Draft
  readonly setDraft: Dispatch<SetStateAction<Draft>>
  readonly uploadImage: (file: File) => Promise<string>
}

interface Props<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
  Draft,
> {
  readonly resource: CmsResource<Id, Item, Input>
  /** Null for a new item. */
  readonly id: string | null
  readonly toDraft: (item: Item | null) => Draft
  /** Left is the reason the draft cannot be saved yet. */
  readonly toInput: (draft: Draft) => Either.Either<Input, string>
  readonly Main: ComponentType<CmsFieldsProps<Item, Draft>>
  readonly Side: ComponentType<CmsFieldsProps<Item, Draft>>
}

function useWarnBeforeLeaving(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
    }
  }, [enabled])
}

function CmsForm<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
  Draft,
>({
  resource,
  toDraft,
  toInput,
  Main,
  Side,
  item,
  saving,
  error,
  success,
  save,
  unpublish,
}: Omit<Props<Id, Item, Input, Draft>, 'id'> &
  Omit<ReturnType<typeof useCmsItem<Id, Item, Input>>, 'loading'>) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const {uploadImage, uploading} = useCmsImageUpload()
  const {confirm, dialog} = useConfirm()
  const [draft, setDraft] = useState(() => toDraft(item))
  const [savedDraft, setSavedDraft] = useState(draft)
  const [validationError, setValidationError] = useState<string | null>(null)
  const dirty = draft !== savedDraft
  useWarnBeforeLeaving(dirty)

  const status: CmsStatus = item?.status ?? 'draft'
  const visibleFrom = item ? resource.visibleFrom?.(item) : undefined
  const scheduled = isScheduled(status, visibleFrom)
  const busy = saving || uploading

  const handleSave = async (publish: boolean) => {
    setValidationError(null)
    if (!formRef.current?.reportValidity()) return
    const input = toInput(draft)
    if (Either.isLeft(input)) {
      setValidationError(input.left)
      return
    }
    if (
      publish &&
      !(await confirm({
        title: `Publish this ${resource.noun}?`,
        message: resource.visibleFrom
          ? `It is saved and goes to the website. A ${resource.noun} dated in the future appears on that date.`
          : 'It is saved and goes to the website right away.',
        confirmLabel: 'Save and publish',
        tone: 'primary',
      }))
    )
      return
    if (await save(input.right, publish)) setSavedDraft(draft)
  }

  const handleUnpublish = async () => {
    const confirmed = await confirm({
      title: `Unpublish this ${resource.noun}?`,
      message: dirty
        ? 'It disappears from the website and becomes a draft again. Your unsaved changes stay in the form.'
        : 'It disappears from the website and becomes a draft again.',
      confirmLabel: 'Unpublish',
    })
    if (confirmed) void unpublish()
  }

  const fields = {item, draft, setDraft, uploadImage}

  return (
    <form
      ref={formRef}
      inert={saving}
      onSubmit={(e) => {
        e.preventDefault()
        void handleSave(false)
      }}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]"
    >
      <div className="min-w-0 space-y-6">
        <Main {...fields} />
      </div>
      <aside className="min-w-0 space-y-6 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
        <Card title="Publish">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} visibleFrom={visibleFrom} />
              {dirty ? (
                <span className="text-xs font-medium text-warning-ink">
                  Unsaved changes
                </span>
              ) : null}
            </div>
            <p className="text-sm text-ink-muted">
              {status === 'draft'
                ? item === null
                  ? `Not saved yet. Save a draft to keep working on it, or publish it straight away.`
                  : `Only visible here. Publish it to put it on the website.`
                : scheduled && visibleFrom
                  ? `Goes live on ${formatDateTime(visibleFrom)}.`
                  : 'Live on the website. Saving updates it right away.'}
            </p>
            {item &&
            status === 'published' &&
            !scheduled &&
            resource.publicUrl ? (
              <a
                href={resource.publicUrl(item)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-ink underline decoration-accent decoration-2 underline-offset-2"
              >
                View on the website
                <ExternalLinkIcon className="size-3.5" />
              </a>
            ) : null}
            <FormMessage
              error={validationError ?? error}
              success={dirty ? null : success}
            />
            <div className="grid gap-2">
              {status === 'draft' ? (
                <>
                  <Button
                    variant="primary"
                    disabled={busy}
                    onClick={() => {
                      void handleSave(true)
                    }}
                  >
                    Save and publish
                  </Button>
                  <Button type="submit" loading={saving} disabled={busy}>
                    Save draft
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={saving}
                    disabled={busy}
                  >
                    Save changes
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => {
                      void handleUnpublish()
                    }}
                  >
                    Unpublish
                  </Button>
                </>
              )}
            </div>
            {uploading ? (
              <p className="text-xs text-ink-muted">
                Waiting for an image upload to finish…
              </p>
            ) : null}
          </div>
        </Card>
        <Side {...fields} />
      </aside>
      {dialog}
    </form>
  )
}

export function CmsEditor<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
  Draft,
>({id, ...props}: Props<Id, Item, Input, Draft>) {
  const {resource} = props
  const {loading, ...cmsItem} = useCmsItem(resource, id)
  const listHref = resource.path

  return (
    <Page>
      <PageHeader
        back={{href: listHref, label: `All ${resource.nouns}`}}
        title={`${id === null && cmsItem.item === null ? 'New' : 'Edit'} ${resource.noun}`}
      />
      {loading ? (
        <StatusMessage loading>Loading…</StatusMessage>
      ) : id !== null && cmsItem.item === null ? (
        <Alert
          tone="error"
          action={
            <ButtonLink href={listHref} size="sm">
              Back to the list
            </ButtonLink>
          }
        >
          {cmsItem.error}
        </Alert>
      ) : (
        <CmsForm {...props} {...cmsItem} />
      )}
    </Page>
  )
}
