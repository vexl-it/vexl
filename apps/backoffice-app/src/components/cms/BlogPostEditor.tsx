'use client'

import {
  Card,
  Checkbox,
  CheckIcon,
  CopyButton,
  Field,
  Input,
  SegmentedControl,
  Textarea,
} from '@/src/components/ui'
import {toDateTimeLocal} from '@/src/services/cms/dateTimeLocal'
import {slugify} from '@/src/services/cms/domain'
import {blogPostPublicUrl, blogPostResource} from '@/src/services/cms/resources'
import {formatDateTime} from '@/src/services/format'
import {
  BlogPostInput,
  type BlogPost,
  type BlogPostContent,
} from '@vexl-next/domain/src/general/cms'
import {Array, Either, Option, pipe, Schema} from 'effect'
import {useState} from 'react'
import {CmsEditor, type CmsFieldsProps} from './CmsEditor'
import {ImageField} from './ImageField'
import {RichTextEditor} from './RichTextEditor'
import {RichTextPreview} from './RichTextPreview'

type Language = 'en' | 'cs'
const LANGUAGES: readonly Language[] = ['en', 'cs']
const LANGUAGE_NAMES: Record<Language, string> = {en: 'English', cs: 'Czech'}

type Mode = 'write' | 'preview'

interface ContentDraft {
  readonly title: string
  readonly summary: string
  readonly body: string
}

interface BlogPostDraft {
  readonly slug: string
  readonly featured: boolean
  readonly imageUrl: string
  readonly publishedAt: string
  readonly en: ContentDraft
  readonly cs: ContentDraft
}

type Fields = CmsFieldsProps<BlogPost, BlogPostDraft>

const EMPTY_CONTENT: ContentDraft = {title: '', summary: '', body: ''}

const contentDraft = (content: BlogPostContent): ContentDraft => ({
  title: content.title,
  summary: Option.getOrElse(content.summary, () => ''),
  body: content.body,
})

const draftFromPost = (post: BlogPost | null): BlogPostDraft =>
  post === null
    ? {
        slug: '',
        featured: false,
        imageUrl: '',
        publishedAt: toDateTimeLocal(new Date()),
        en: EMPTY_CONTENT,
        cs: EMPTY_CONTENT,
      }
    : {
        slug: post.slug,
        featured: post.featured,
        imageUrl: Option.getOrElse(post.imageUrl, () => ''),
        publishedAt: toDateTimeLocal(post.publishedAt),
        en: contentDraft(post.en),
        cs: Option.match(post.cs, {
          onNone: () => EMPTY_CONTENT,
          onSome: contentDraft,
        }),
      }

const optional = (value: string): string | undefined =>
  value.trim() === '' ? undefined : value.trim()

const contentInput = (content: ContentDraft) => ({
  title: content.title.trim(),
  summary: optional(content.summary),
  body: content.body,
})

const isStarted = (content: ContentDraft): boolean =>
  content.title.trim() !== '' || content.body !== ''

const isComplete = (content: ContentDraft): boolean =>
  content.title.trim() !== '' && content.body !== ''

const toInput = (draft: BlogPostDraft): Either.Either<BlogPostInput, string> =>
  pipe(
    LANGUAGES,
    Array.findFirst((language) => !isComplete(draft[language])),
    Option.match({
      onSome: (language) =>
        Either.left(
          `${LANGUAGE_NAMES[language]} needs a title and a body. A post is saved in both languages.`
        ),
      onNone: () =>
        Schema.decodeUnknownEither(BlogPostInput)({
          slug: draft.slug.trim(),
          featured: draft.featured,
          imageUrl: optional(draft.imageUrl),
          publishedAt: draft.publishedAt,
          en: contentInput(draft.en),
          cs: contentInput(draft.cs),
        }).pipe(Either.mapLeft((error) => error.message)),
    })
  )

function LanguageLabel({
  language,
  content,
}: {
  readonly language: Language
  readonly content: ContentDraft
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {LANGUAGE_NAMES[language]}
      {isComplete(content) ? (
        <CheckIcon className="size-3.5 text-success-ink" />
      ) : (
        <span className="font-normal text-warning-ink">
          {isStarted(content) ? 'incomplete' : 'empty'}
        </span>
      )}
    </span>
  )
}

function PostPreview({
  draft,
  language,
}: {
  readonly draft: BlogPostDraft
  readonly language: Language
}) {
  const content = draft[language]
  return (
    <article className="mx-auto max-w-2xl">
      {!!draft.imageUrl && (
        <img
          src={draft.imageUrl}
          alt=""
          className="mb-5 aspect-video w-full rounded-card bg-canvas object-cover"
        />
      )}
      <p className="text-sm text-ink-subtle">
        {formatDateTime(draft.publishedAt)}
      </p>
      <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink">
        {content.title || <span className="text-ink-subtle">No title yet</span>}
      </h2>
      {!!content.summary && (
        <p className="mt-3 text-lg text-ink-muted">{content.summary}</p>
      )}
      <div className="mt-5">
        <RichTextPreview html={content.body} />
      </div>
    </article>
  )
}

function PostContent({item, draft, setDraft, uploadImage}: Fields) {
  const [language, setLanguage] = useState<Language>('en')
  const [mode, setMode] = useState<Mode>('write')

  const setContent = (target: Language, changes: Partial<ContentDraft>) => {
    setDraft((current) => ({
      ...current,
      [target]: {...current[target], ...changes},
    }))
  }

  // A new post's slug follows the English title until someone edits the slug.
  const setTitle = (target: Language, title: string) => {
    setDraft((current) => ({
      ...current,
      [target]: {...current[target], title},
      slug:
        item === null &&
        target === 'en' &&
        current.slug === slugify(current.en.title)
          ? slugify(title)
          : current.slug,
    }))
  }

  return (
    <Card
      title="Content"
      description="Written once per language. Both are needed to save."
      actions={
        <>
          <SegmentedControl
            label="Language"
            value={language}
            onChange={setLanguage}
            options={Array.map(LANGUAGES, (one) => ({
              value: one,
              label: <LanguageLabel language={one} content={draft[one]} />,
            }))}
          />
          <SegmentedControl<Mode>
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              {value: 'write', label: 'Write'},
              {value: 'preview', label: 'Preview'},
            ]}
          />
        </>
      }
    >
      {mode === 'preview' ? (
        <PostPreview draft={draft} language={language} />
      ) : null}
      {/* Both stay mounted so switching keeps each editor's undo history. */}
      {Array.map(LANGUAGES, (one) => (
        <div
          key={one}
          hidden={mode === 'preview' || one !== language}
          className="space-y-5"
        >
          <Field label={`Title (${LANGUAGE_NAMES[one]})`} required>
            <Input
              value={draft[one].title}
              onChange={(e) => {
                setTitle(one, e.target.value)
              }}
              className="h-11 text-lg font-semibold"
            />
          </Field>
          <Field
            label="Summary"
            hint="A short teaser shown with the title in post lists."
          >
            <Textarea
              rows={3}
              value={draft[one].summary}
              onChange={(e) => {
                setContent(one, {summary: e.target.value})
              }}
            />
          </Field>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Body<span className="text-danger"> *</span>
            </span>
            <RichTextEditor
              initialValue={draft[one].body}
              onChange={(body) => {
                setContent(one, {body})
              }}
              uploadImage={uploadImage}
            />
          </div>
        </div>
      ))}
    </Card>
  )
}

function PostSettings({draft, setDraft, uploadImage}: Fields) {
  const publicUrl = blogPostPublicUrl(draft.slug)

  return (
    <>
      <Card title="Settings">
        <div className="space-y-5">
          <div>
            <Field label="Slug" required>
              <Input
                required
                pattern="[a-z0-9]+(-+[a-z0-9]+)*"
                title="Lowercase letters, numbers and dashes"
                value={draft.slug}
                onChange={(e) => {
                  setDraft((current) => ({...current, slug: e.target.value}))
                }}
                className="font-mono"
              />
            </Field>
            <div className="mt-1.5 flex items-start justify-between gap-2">
              <span className="break-all font-mono text-xs text-ink-muted">
                {publicUrl}
              </span>
              <CopyButton value={publicUrl} label="Copy URL" />
            </div>
          </div>
          <Field
            label="Publish date"
            required
            hint="Shown on the post, in your local time. A published post with a future date stays hidden until then."
          >
            <Input
              type="datetime-local"
              required
              value={draft.publishedAt}
              onChange={(e) => {
                setDraft((current) => ({
                  ...current,
                  publishedAt: e.target.value,
                }))
              }}
            />
          </Field>
          <Checkbox
            label="Featured"
            description="Highlighted among the posts on the website."
            checked={draft.featured}
            onChange={(e) => {
              setDraft((current) => ({...current, featured: e.target.checked}))
            }}
          />
        </div>
      </Card>
      <Card title="Cover image">
        <ImageField
          label="Image URL"
          wide
          value={draft.imageUrl}
          onChange={(imageUrl) => {
            setDraft((current) => ({...current, imageUrl}))
          }}
          uploadImage={uploadImage}
        />
      </Card>
    </>
  )
}

export function BlogPostEditor({id}: {readonly id: string | null}) {
  return (
    <CmsEditor
      resource={blogPostResource}
      id={id}
      toDraft={draftFromPost}
      toInput={toInput}
      Main={PostContent}
      Side={PostSettings}
    />
  )
}
