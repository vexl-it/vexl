import {localized} from './locales'

/** Legal documents in `content/terms-privacy/<id>.html`, in page order. */
export type TermsDocument =
  | 'terms'
  | 'privacy-policy'
  | 'child-safety-and-sex-abuse-prevention-policy'

export const termsPrivacy = localized<{
  readonly metaTitle: string
  readonly metaDescription: string
  readonly heading: string
  /** Live wraps the Czech heading in a link to the English page. */
  readonly headingHref?: string
  readonly documents: readonly TermsDocument[]
}>({
  en: {
    metaTitle: 'Terms & Privacy - Vexl App',
    metaDescription:
      "Read Vexl's Terms of Service, Privacy Policy, and Child Safety Policy. Learn how we protect your data with encryption and enable peer-to-peer Bitcoin trading.",
    heading: 'Terms & Privacy',
    documents: [
      'terms',
      'privacy-policy',
      'child-safety-and-sex-abuse-prevention-policy',
    ],
  },
  cs: {
    metaTitle: 'Vaše ochrana je pro nás důležitá – Vexl App',
    metaDescription:
      'Přečtěte si Obchodní podmínky, Zásady ochrany osobních údajů a Zásady pro ochranu dětí Vexlu. Zjistěte, jak chráníme vaše data šifrováním a umožňujeme přímé obchodování s Bitcoiny.',
    heading: 'Podmínky a ochrana osobních údajů',
    headingHref: '/terms-privacy',
    documents: ['privacy-policy'],
  },
})
