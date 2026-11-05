import {localized} from './locales'

/** Page copy outside the questions, which live in `content/faq/<locale>.md`. */
export const faq = localized({
  en: {
    metaTitle: 'Frequently Asked Questions - Vexl App',
    metaDescription: 'All you wanted know about the Vexl App.',
    heading: 'Frequently Asked Questions',
  },
  cs: {
    metaTitle: 'Nejčastější dotazy – Vexl App',
    metaDescription: 'Vše, co jste chtěli vědět o aplikaci Vexl.',
    heading: 'Nejčastější dotazy',
  },
})
