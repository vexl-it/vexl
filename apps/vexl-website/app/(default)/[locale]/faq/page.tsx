import {Footer} from '@/src/components/Footer'
import {GlobalStyles} from '@/src/components/GlobalStyles'
import {Navbar} from '@/src/components/Navbar'
import {type PageCopy, pageCopy, renderInlineCopy} from '@/src/copy/pageCopy'
import {pageMetadata} from '@/src/metadata'
import {type LocaleParams, resolveLocale} from '@/src/pageParams'
import {FaqAccordion, FaqCard} from '@/src/views/faq/FaqAccordion'
import {
  answerParagraphs,
  answerPlainText,
  type FaqQuestion,
  type FaqSection,
  faqSections,
} from '@/src/views/faq/faqContent'
import {Array, pipe} from 'effect'
import {type Metadata} from 'next'
import React from 'react'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  const t = pageCopy(locale, 'faq')
  return {
    ...pageMetadata({
      locale,
      path: '/faq',
      title: t.text('meta.title'),
      description: t.text('meta.description'),
    }),
    robots: {index: false, follow: false},
  }
}

// Blocks are separated by newlines, like the Markdown the FAQ used to be
function Answer({
  question,
  t,
}: {
  readonly question: FaqQuestion
  readonly t: PageCopy<'faq'>
}): React.JSX.Element {
  return (
    <div className="text-rich-text is-faq-text w-richtext">
      {pipe(
        question.blocks,
        Array.flatMap((block) =>
          block.type === 'heading'
            ? [<h5 key={block.key}>{t(block.key)}</h5>]
            : Array.map(
                answerParagraphs(t.raw(block.key)),
                (paragraph, index) => (
                  <p key={`${block.key}-${index}`} {...t.marker(block.key)}>
                    {renderInlineCopy(paragraph)}
                  </p>
                )
              )
        ),
        Array.intersperse('\n')
      )}
    </div>
  )
}

function FaqJsonLd({
  sections,
  t,
}: {
  readonly sections: readonly FaqSection[]
  readonly t: PageCopy<'faq'>
}): React.JSX.Element {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pipe(
      sections,
      Array.flatMap((section) => section.questions),
      Array.map((question) => ({
        '@type': 'Question',
        name: t.text(question.key),
        acceptedAnswer: {
          '@type': 'Answer',
          text: answerPlainText(question, t),
        },
      }))
    ),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
      }}
    />
  )
}

export default async function FaqPage(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const locale = await resolveLocale(props)
  const t = pageCopy(locale, 'faq')
  const sections = faqSections(locale, t)
  return (
    <div className="page-wrapper">
      <Navbar locale={locale} path="/faq" />
      <GlobalStyles />
      <main className="main-wrapper">
        <section className="section is-default-hero">
          <div className="w-layout-blockcontainer container container-hero w-container">
            <div className="hero-default-wrapper">
              <div className="glasses-wrapper">
                <img
                  src="/wf/63088c60442a08324b0046b6_glasses-yellow.webp"
                  loading="lazy"
                  width={97.5}
                  alt=""
                  className="glasses-image"
                />
              </div>
              <h1 className="h1 hero faqs">{t('hero.heading')}</h1>
              <div className="faq-menu-wrapper">
                {sections.map((section, index) => (
                  <React.Fragment key={section.id}>
                    {index > 0 ? <div className="menu-dot-wrapper" /> : null}
                    <a
                      href={`#${section.id}`}
                      className="button-text w-variant-41d64057-01e5-941d-92c6-d0f9d43977fd w-inline-block"
                    >
                      <div>{t(section.title)}</div>
                    </a>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>
        <FaqAccordion>
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="section is-faq-section"
            >
              <div className="w-layout-blockcontainer container is-faq-container w-container">
                <div className="faq-section-wrapper">
                  <div className="faq-section-title-wrapper">
                    <h2 className="h3">{t(section.title)}</h2>
                  </div>
                  <div className="faq-wrapper">
                    {section.questions.map((question) => (
                      <FaqCard
                        key={question.key}
                        id={question.key}
                        question={t(question.key)}
                      >
                        <Answer question={question} t={t} />
                      </FaqCard>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </FaqAccordion>
      </main>
      <div className="background-dark">
        <Footer locale={locale} />
      </div>
      <FaqJsonLd sections={sections} t={t} />
    </div>
  )
}
