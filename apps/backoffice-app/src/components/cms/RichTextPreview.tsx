'use client'

import {EditorContent, useEditor} from '@tiptap/react'
import {useEffect, useState} from 'react'
import {createRichTextExtensions} from './richTextExtensions'

const EDITOR_PROPS = {attributes: {class: 'cms-content'}}

/**
 * Renders through the editor schema instead of `dangerouslySetInnerHTML`:
 * stored HTML is untrusted and a script here could read the admin token.
 */
export function RichTextPreview({html}: {readonly html: string}) {
  const [extensions] = useState(createRichTextExtensions)
  const editor = useEditor({
    extensions,
    editable: false,
    immediatelyRender: false,
    editorProps: EDITOR_PROPS,
  })

  useEffect(() => {
    editor?.commands.setContent(html)
  }, [editor, html])

  return <EditorContent editor={editor} />
}
