'use client'

import {useCmsImageUpload} from '@/src/hooks/useCms'
import {formatDateTime, toDateTimeLocal} from '@/src/services/cms/dateTimeLocal'
import {
  BlogPostInput,
  type BlogPost,
  type BlogPostContent,
  type CmsStatus,
} from '@vexl-next/domain/src/general/cms'
import {Array, Either, Option, pipe, Schema} from 'effect'
import {useRef, useState} from 'react'
import {type CmsFormProps} from './CmsEditor'
import {CmsFormFooter} from './CmsFormFooter'
import {Field, ImageField, inputClassName} from './fields'
import {RichTextEditor} from './RichTextEditor'
import {RichTextPreview} from './RichTextPreview'

type Language = 'en' | 'cs'
const LANGUAGES: readonly Language[] = ['en', 'cs']

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

const toInput = (draft: BlogPostDraft): Either.Either<BlogPostInput, string> =>
  pipe(
    LANGUAGES,
    Array.findFirst((language) => draft[language].body === ''),
    Option.match({
      onSome: (language) =>
        Either.left(`The ${language.toUpperCase()} body is empty.`),
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

function PostPreview({
  draft,
  language,
}: {
  readonly draft: BlogPostDraft
  readonly language: Language
}) {
  const content = draft[language]
  return (
    <article className="rounded-lg bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase text-gray-400">
        {language} preview
      </p>
      {!!draft.imageUrl && (
        <img
          src={draft.imageUrl}
          alt=""
          className="mt-3 max-h-64 w-full rounded object-cover"
        />
      )}
      <p className="mt-3 text-sm text-gray-500">
        {formatDateTime(draft.publishedAt)}
      </p>
      <h1 className="mt-1 text-3xl font-bold text-gray-900">{content.title}</h1>
      {!!content.summary && (
        <p className="mt-2 text-lg text-gray-600">{content.summary}</p>
      )}
      <div className="mt-4 text-gray-800">
        <RichTextPreview html={content.body} />
      </div>
    </article>
  )
}

type Props = CmsFormProps<BlogPost, BlogPostInput>

export function BlogPostForm({
  item,
  saving,
  error,
  success,
  onSave,
  onUnpublish,
}: Props) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const uploadImage = useCmsImageUpload()
  const [draft, setDraft] = useState(() => draftFromPost(item))
  const [validationError, setValidationError] = useState<string | null>(null)
  const status: CmsStatus = item?.status ?? 'draft'

  const setContent = (
    language: Language,
    field: keyof ContentDraft,
    value: string
  ) => {
    setDraft((current) => ({
      ...current,
      [language]: {...current[language], [field]: value},
    }))
  }

  const handleSave = (publish: boolean) => {
    setValidationError(null)
    if (!formRef.current?.reportValidity()) return
    Either.match(toInput(draft), {
      onLeft: setValidationError,
      onRight: (input) => {
        onSave(input, publish)
      },
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()
        handleSave(false)
      }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 gap-6 rounded-lg bg-white p-6 shadow-sm md:grid-cols-2">
        <Field label="Slug (URL) *">
          <input
            type="text"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Lowercase letters, numbers and dashes"
            value={draft.slug}
            onChange={(e) => {
              setDraft({...draft, slug: e.target.value})
            }}
            className={`${inputClassName} font-mono`}
          />
        </Field>
        <Field label="Published on *">
          <input
            type="datetime-local"
            required
            value={draft.publishedAt}
            onChange={(e) => {
              setDraft({...draft, publishedAt: e.target.value})
            }}
            className={inputClassName}
          />
        </Field>
        <ImageField
          label="Cover image"
          value={draft.imageUrl}
          onChange={(imageUrl) => {
            setDraft((current) => ({...current, imageUrl}))
          }}
          uploadImage={uploadImage}
        />
        <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(e) => {
              setDraft({...draft, featured: e.target.checked})
            }}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          Featured
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.map(LANGUAGES, (language) => (
          <section
            key={language}
            className="space-y-4 rounded-lg bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {language === 'en' ? 'English' : 'Czech'}
            </h2>
            <Field label="Title *">
              <input
                type="text"
                required
                value={draft[language].title}
                onChange={(e) => {
                  setContent(language, 'title', e.target.value)
                }}
                className={inputClassName}
              />
            </Field>
            <Field label="Summary">
              <textarea
                rows={2}
                value={draft[language].summary}
                onChange={(e) => {
                  setContent(language, 'summary', e.target.value)
                }}
                className={inputClassName}
              />
            </Field>
            <div className="text-sm font-medium text-gray-700">
              Body *
              <div className="mt-1">
                <RichTextEditor
                  initialValue={draft[language].body}
                  onChange={(body) => {
                    setContent(language, 'body', body)
                  }}
                  uploadImage={uploadImage}
                />
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.map(LANGUAGES, (language) => (
          <PostPreview key={language} draft={draft} language={language} />
        ))}
      </div>

      <CmsFormFooter
        status={status}
        saving={saving}
        error={validationError ?? error}
        success={success}
        onSave={handleSave}
        onUnpublish={onUnpublish}
      />
    </form>
  )
}
