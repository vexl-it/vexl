import {type Metadata} from 'next'
import React from 'react'
import {Footer} from '../../components/Footer'
import {GlobalStyles} from '../../components/GlobalStyles'
import {Navbar} from '../../components/Navbar'
import {type CopyKey} from '../../copy/copyFiles'
import {pageCopy} from '../../copy/pageCopy'
import {type Locale, localizedPath} from '../../i18n/locales'
import {pageMetadata} from '../../metadata'
import {EventList} from './EventList'
import {communityPagePath, type Events, eventsPage} from './events'

export function communityMetadata(locale: Locale, page: number): Metadata {
  const t = pageCopy(locale, 'community')
  return pageMetadata({
    locale,
    path: communityPagePath(page),
    title: t.text('meta.title'),
    description: t.text('meta.description'),
    image: '/wf/6685518811a45b0613823a21_Community_page.jpg',
  })
}

interface SupportItem {
  readonly icon: string
  readonly className: string
  readonly text: CopyKey<'community'>
}

const supportRows: ReadonlyArray<readonly [SupportItem, SupportItem]> = [
  [
    {
      icon: '/wf/668528bf82aae62591bc61d3_Commercial.png',
      className: 'div-block-53',
      text: 'support.promotional',
    },
    {
      icon: '/wf/668528bfe48cfb60be632592_Graduation-Cap.png',
      className: 'div-block-53 white',
      text: 'support.training',
    },
  ],
  [
    {
      icon: '/wf/668528bff4bd14a30b55c35d_T-Shirt.png',
      className: 'div-block-53 yellow',
      text: 'support.merch',
    },
    {
      icon: '/wf/668528bfae25e835d0b99493_Speech-Bubble.png',
      className: 'div-block-53 green',
      text: 'support.speakers',
    },
  ],
]

/** `page` is the page of past events. */
export function CommunityPage({
  locale,
  events: allEvents,
  page,
}: {
  readonly locale: Locale
  readonly events: Events
  readonly page: number
}): React.JSX.Element {
  const t = pageCopy(locale, 'community')
  const events = eventsPage(allEvents, page)
  const href = (target: number): string =>
    localizedPath(locale, communityPagePath(target))
  return (
    <div className="page-wrapper">
      <GlobalStyles />
      <Navbar locale={locale} path="/community" />
      <div className="main-wrapper">
        <section className="section-6">
          <div className="w-layout-blockcontainer w-container">
            <div className="div-block-44">
              <div className="text-block-5">{t('hero.label')}</div>
              <h1 className="heading-2">{t('hero.heading')}</h1>
              <div className="p is-hero centered">{t('hero.intro')}</div>
              <div className="div-block-45">
                <a href="#Events" className="button hero w-button">
                  {t('hero.browseEvents')}
                </a>
                <a href="#Host_event" className="button secondary w-button">
                  {t('hero.hostEvent')}
                </a>
              </div>
            </div>
          </div>
        </section>
        <div
          id="Events"
          className="w-layout-blockcontainer container-7 events w-container"
        >
          <h2 className="heading-3">{t('events.upcoming')}</h2>
          <EventList events={events.upcoming} t={t} />
          <h2 className="heading-3">{t('events.past')}</h2>
          <EventList
            events={events.past}
            t={t}
            previousHref={
              events.previousPage === undefined
                ? undefined
                : href(events.previousPage)
            }
            nextHref={
              events.nextPage === undefined ? undefined : href(events.nextPage)
            }
          />
        </div>
        <section id="Host_event">
          <div className="w-layout-blockcontainer container-8 w-container">
            <div className="div-block-51">
              <h1 className="heading-3">{t('host.heading')}</h1>
              <div className="text-block-8">{t('host.text')}</div>
              <div className="div-block-52">
                <a
                  href="https://dl.dropboxusercontent.com/scl/fi/tgbbejiiyrrxlgn5xkqom/Meetups-Welcome-Kit-2.zip?rlkey=47y4hzmgvtfbh059pvz7lelzj&dl=0"
                  target="_blank"
                  className="button hero w-button"
                  rel="noreferrer"
                >
                  {t('host.downloadMaterials')}
                </a>
                <a
                  href="mailto:marketing@vexl.it"
                  className="button secondary w-button"
                >
                  <strong>{t('host.emailUs')}</strong>
                </a>
              </div>
            </div>
            <div>
              <h2 className="heading-4">{t('support.heading')}</h2>
              {supportRows.map((row) => (
                <div key={row[0].text} className="div-block-55">
                  {row.map((item) => (
                    <div key={item.text} className="div-block-54">
                      <div className={item.className}>
                        <img
                          src={item.icon}
                          loading="lazy"
                          alt=""
                          className="image-17"
                        />
                      </div>
                      <div className="text-block-9">{t(item.text)}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="section-7">
          <div className="w-layout-blockcontainer container-9 w-container">
            <h1 className="heading-2">{t('pastEvents.heading')}</h1>
          </div>
          <div className="div-block-56" />
        </section>
        <Footer locale={locale} />
      </div>
    </div>
  )
}
