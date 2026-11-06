import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'

const isSafeLink = (url: string): boolean =>
  /^(https?:\/\/|mailto:|\/|#)/i.test(url)

/**
 * The schema is the allowlist: anything not listed here is dropped when HTML
 * is loaded, so the editor and the preview only ever render these tags.
 * h4–h6 stay parseable because imported Webflow posts use them.
 */
export const createRichTextExtensions = () => [
  StarterKit.configure({
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    heading: {levels: [2, 3, 4, 5, 6]},
    link: {
      openOnClick: false,
      autolink: true,
      isAllowedUri: isSafeLink,
    },
  }),
  Image,
]
