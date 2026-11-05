import {Array, pipe} from 'effect'
import {type Metadata} from 'next'
import React from 'react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import {Footer} from '../../../../src/components/Footer'
import {GlobalStyles} from '../../../../src/components/GlobalStyles'
import {Navbar} from '../../../../src/components/Navbar'
import {faq} from '../../../../src/i18n/faq'
import {pageMetadata} from '../../../../src/metadata'
import {resolveLocale, type LocaleParams} from '../../../../src/pageParams'
import {FaqAccordion, FaqCard} from '../../../../src/views/faq/FaqAccordion'
import {
  faqSections,
  markdownToPlainText,
  type FaqSectionContent,
} from '../../../../src/views/faq/faqContent'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  return {
    ...pageMetadata({
      locale,
      path: '/faq',
      title: faq[locale].metaTitle,
      description: faq[locale].metaDescription,
    }),
    robots: {index: false, follow: false},
  }
}

function InlineMarkdown({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <Markdown allowedElements={['strong']} unwrapDisallowed>
      {children}
    </Markdown>
  )
}

function FaqJsonLd({
  sections,
}: {
  readonly sections: readonly FaqSectionContent[]
}): React.JSX.Element {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pipe(
      sections,
      Array.flatMap((section) => section.cards),
      Array.map((card) => ({
        '@type': 'Question',
        name: markdownToPlainText(card.question),
        acceptedAnswer: {
          '@type': 'Answer',
          text: markdownToPlainText(card.answer),
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
  const t = faq[locale]
  const sections = faqSections(locale)
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
              <h1 className="h1 hero faqs">{t.heading}</h1>
              <div className="faq-menu-wrapper">
                {sections.map((section, index) => (
                  <React.Fragment key={section.id}>
                    {index > 0 ? <div className="menu-dot-wrapper" /> : null}
                    <a
                      href={`#${section.id}`}
                      className="button-text w-variant-41d64057-01e5-941d-92c6-d0f9d43977fd w-inline-block"
                    >
                      <div>
                        <InlineMarkdown>{section.title}</InlineMarkdown>
                      </div>
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
                    <h2 className="h3">
                      <InlineMarkdown>{section.title}</InlineMarkdown>
                    </h2>
                  </div>
                  <div className="faq-wrapper">
                    {section.cards.map((card, index) => (
                      <FaqCard
                        key={card.question}
                        id={`${section.id}-${index}`}
                        question={
                          <InlineMarkdown>{card.question}</InlineMarkdown>
                        }
                      >
                        <div className="text-rich-text is-faq-text w-richtext">
                          <Markdown rehypePlugins={[rehypeRaw]}>
                            {card.answer}
                          </Markdown>
                        </div>
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
      <FaqJsonLd sections={sections} />
    </div>
  )
}
