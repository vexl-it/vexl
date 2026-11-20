'use client'

import {cx} from '@/src/components/ui'
import {ACCEPTED_CMS_IMAGE_TYPES} from '@/src/services/cms/domain'
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from '@tiptap/react'
import {Array} from 'effect'
import {useRef, useState, type MouseEvent, type ReactNode} from 'react'
import {createRichTextExtensions} from './richTextExtensions'
import {useTextPrompt} from './TextPrompt'

const EDITOR_PROPS = {
  attributes: {
    class:
      'cms-content min-h-80 max-h-[70vh] overflow-y-auto px-4 py-3 focus:outline-none',
  },
}

interface Props {
  readonly initialValue: string
  /** Receives '' when the editor holds no text. */
  readonly onChange: (html: string) => void
  readonly uploadImage: (file: File) => Promise<string>
}

const keepEditorFocus = (e: MouseEvent): void => {
  e.preventDefault()
}

function ToolbarButton({
  title,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  readonly title: string
  readonly active?: boolean
  readonly disabled?: boolean
  readonly onClick: () => void
  readonly children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={keepEditorFocus}
      onClick={onClick}
      className={cx(
        'h-7 min-w-7 cursor-pointer rounded px-2 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        active
          ? 'bg-ink text-white'
          : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
      )}
    >
      {children}
    </button>
  )
}

function Toolbar({
  editor,
  onLink,
  onPickImage,
  uploading,
}: {
  readonly editor: Editor
  readonly onLink: () => void
  readonly onPickImage: () => void
  readonly uploading: boolean
}) {
  const active = useEditorState({
    editor,
    selector: ({editor: current}) => ({
      h2: current.isActive('heading', {level: 2}),
      h3: current.isActive('heading', {level: 3}),
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      link: current.isActive('link'),
      bulletList: current.isActive('bulletList'),
      orderedList: current.isActive('orderedList'),
      blockquote: current.isActive('blockquote'),
    }),
  })

  const buttons = [
    {
      label: 'H2',
      title: 'Heading',
      isActive: active.h2,
      run: () => editor.chain().focus().toggleHeading({level: 2}).run(),
    },
    {
      label: 'H3',
      title: 'Subheading',
      isActive: active.h3,
      run: () => editor.chain().focus().toggleHeading({level: 3}).run(),
    },
    {
      label: <span className="font-bold">B</span>,
      title: 'Bold',
      isActive: active.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: <span className="italic">I</span>,
      title: 'Italic',
      isActive: active.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {label: 'Link', title: 'Link', isActive: active.link, run: onLink},
    {
      label: '• List',
      title: 'Bullet list',
      isActive: active.bulletList,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: '1. List',
      title: 'Numbered list',
      isActive: active.orderedList,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Quote',
      title: 'Quote',
      isActive: active.blockquote,
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ]

  return (
    <div className="flex flex-wrap gap-0.5 border-b border-line bg-surface-muted p-1.5">
      {Array.map(buttons, (button) => (
        <ToolbarButton
          key={button.title}
          title={button.title}
          active={button.isActive}
          onClick={button.run}
        >
          {button.label}
        </ToolbarButton>
      ))}
      <ToolbarButton
        title="Insert an image"
        disabled={uploading}
        onClick={onPickImage}
      >
        {uploading ? 'Uploading…' : 'Image'}
      </ToolbarButton>
    </div>
  )
}

export function RichTextEditor({initialValue, onChange, uploadImage}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const {prompt, dialog} = useTextPrompt()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // useEditor re-applies options that change between renders.
  const [extensions] = useState(createRichTextExtensions)
  const [content] = useState(initialValue)
  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    editorProps: EDITOR_PROPS,
    onUpdate: ({editor: current}) => {
      onChange(current.isEmpty ? '' : current.getHTML())
    },
  })

  const editLink = async (current: Editor) => {
    const href = current.getAttributes('link').href
    const url = await prompt({
      title: 'Link',
      label: 'URL',
      hint: 'Leave empty to remove the link.',
      initialValue: typeof href === 'string' ? href : 'https://',
      confirmLabel: 'Apply',
    })
    if (url === null) return

    const chain = current.chain().focus().extendMarkRange('link')
    if (url.trim() === '') chain.unsetLink().run()
    else chain.setLink({href: url.trim()}).run()
  }

  const insertImage = async (current: Editor, file: File) => {
    setUploading(true)
    setError(null)
    try {
      const src = await uploadImage(file)
      const alt = await prompt({
        title: 'Describe the image',
        label: 'Alt text',
        hint: 'Read aloud by screen readers and shown if the image fails to load.',
        confirmLabel: 'Insert image',
      })
      current
        .chain()
        .focus()
        .setImage({src, alt: alt ?? ''})
        .run()
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Failed to upload image'
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="overflow-hidden rounded-control border border-line-strong bg-surface shadow-card focus-within:border-focus focus-within:ring-3 focus-within:ring-accent/40">
        {!!editor && (
          <Toolbar
            editor={editor}
            uploading={uploading}
            onLink={() => {
              void editLink(editor)
            }}
            onPickImage={() => fileInputRef.current?.click()}
          />
        )}
        <EditorContent editor={editor} />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_CMS_IMAGE_TYPES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file && editor) void insertImage(editor, file)
        }}
      />
      {!!error && <p className="mt-1.5 text-xs text-danger-ink">{error}</p>}
      {dialog}
    </div>
  )
}
