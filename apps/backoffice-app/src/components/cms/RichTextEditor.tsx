'use client'

import {ACCEPTED_CMS_IMAGE_TYPES} from '@/src/services/cms/domain'
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from '@tiptap/react'
import {Array} from 'effect'
import {useRef, useState, type MouseEvent} from 'react'
import {createRichTextExtensions} from './richTextExtensions'

const EDITOR_PROPS = {
  attributes: {class: 'cms-content min-h-64 px-3 py-2 focus:outline-none'},
}

interface Props {
  readonly initialValue: string
  /** Receives '' when the editor holds no text. */
  readonly onChange: (html: string) => void
  readonly uploadImage: (file: File) => Promise<string>
}

const promptLink = (editor: Editor): void => {
  const current = editor.getAttributes('link').href
  const url = window.prompt(
    'Link URL (empty removes the link)',
    typeof current === 'string' ? current : 'https://'
  )
  if (url === null) return

  const chain = editor.chain().focus().extendMarkRange('link')
  if (url.trim() === '') chain.unsetLink().run()
  else chain.setLink({href: url.trim()}).run()
}

const keepEditorFocus = (e: MouseEvent): void => {
  e.preventDefault()
}

function Toolbar({
  editor,
  onPickImage,
  uploading,
}: {
  readonly editor: Editor
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
      isActive: active.h2,
      run: () => editor.chain().focus().toggleHeading({level: 2}).run(),
    },
    {
      label: 'H3',
      isActive: active.h3,
      run: () => editor.chain().focus().toggleHeading({level: 3}).run(),
    },
    {
      label: 'B',
      isActive: active.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'I',
      isActive: active.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Link',
      isActive: active.link,
      run: () => {
        promptLink(editor)
      },
    },
    {
      label: '• List',
      isActive: active.bulletList,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: '1. List',
      isActive: active.orderedList,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Quote',
      isActive: active.blockquote,
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ]

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2">
      {Array.map(buttons, (button) => (
        <button
          key={button.label}
          type="button"
          onMouseDown={keepEditorFocus}
          onClick={button.run}
          className={`rounded px-2 py-1 text-xs font-medium ${
            button.isActive
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-100'
          }`}
        >
          {button.label}
        </button>
      ))}
      <button
        type="button"
        onMouseDown={keepEditorFocus}
        onClick={onPickImage}
        disabled={uploading}
        className="rounded bg-white px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Image'}
      </button>
    </div>
  )
}

export function RichTextEditor({initialValue, onChange, uploadImage}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
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

  const insertImage = async (file: File) => {
    if (!editor) return
    setUploading(true)
    setError(null)
    try {
      const src = await uploadImage(file)
      const alt = window.prompt('Describe the image (alt text)') ?? ''
      editor.chain().focus().setImage({src, alt}).run()
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
      <div className="overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
        {!!editor && (
          <Toolbar
            editor={editor}
            uploading={uploading}
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
          if (file) void insertImage(file)
        }}
      />
      {!!error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
