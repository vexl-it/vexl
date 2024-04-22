import {JSONSchema} from '@effect/schema'
import * as S from '@effect/schema/Schema'
import {load as loadWebsite} from 'cheerio'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import {Effect} from 'effect'

dayjs.extend(customParseFormat)

const HostId = S.String.pipe(S.brand('HostId'))
const HostInfo = S.Struct({
  id: HostId,
  name: S.String,
  imageUrl: S.String.pipe(S.optional()),
  website: S.String.pipe(S.optional()),
})

const MeetupLocation = S.Struct({
  city: S.String,
  country: S.String,
  formatedAddress: S.String,
  coordinates: S.Struct({
    latitude: S.Int,
    longitude: S.Int,
  }),
})

const MeetupEvent = S.Struct({
  name: S.String.annotations({description: 'Name of the event'}),
  date: S.Date.annotations({
    description: 'Date of the event',
    jsonSchema: {},
  }),
  languages: S.Array(S.String).annotations({
    description: 'Langauges spoken at the event',
  }),
  location: MeetupLocation.annotations({description: 'Location of the event'}),
  host: HostInfo.annotations({description: 'Host of the event'}),
  description: S.String.pipe(S.optional()).annotations({
    description: 'Further infor about the event provided by the host',
  }),
  expectedAttendees: S.Number.pipe(S.optional()).annotations({
    description: 'Number of attendees expected at the event',
  }),
})

console.log(JSON.stringify(JSONSchema.make(MeetupEvent), null, 2))

const makeRequest = (url: string) =>
  Effect.gen(function* (_) {
    return yield* _(
      Effect.tryPromise(async () => {
        const response = await fetch(url)
        return await response.text()
      })
    )
  })

const processHost = (url: string) =>
  Effect.gen(function* (_) {
    console.log(`processing: ${url}`)
    const html = yield* _(makeRequest(url))
    const $ = loadWebsite(html)

    const name = $('h1 span').first().text()
    const imageUrl = $($('img[alt="Logo"]').get(2)).attr('src')
    const website = $('a')
      .filter(function () {
        return $(this).text().trim().toLowerCase().includes('website')
      })
      .attr('href')

    const list = $("[role='list'] li")
      .toArray()
      .map(function (v) {
        const dateString = $(v)
          .find('h3')
          .first()
          .text()
          .replace(' (CEST)', '')
          .replace(' (CET)', '')
        const date = dayjs(dateString, 'D.MM.YYYY H:mm')
        console.log(dateString, date)

        const name = $($(v).find('h3').get(1)).text()
        const address = $(v).find('[x-collapse] > div').text()

        if (!date.isValid()) console.log(`Invalid date -${dateString}-`)
        return {date: date.toDate(), name, address}
      })

    return S.decode(HostInfo)({name, imageUrl, website, id: name})
  })

const program = Effect.gen(function* (_) {
  const html = yield* _(
    makeRequest('https://portal.einundzwanzig.space/de/meetup/world?l=de')
  )

  const $ = loadWebsite(html)
  const data = new Set(
    $(`td [href^='https://portal.einundzwanzig.space/de/meetup/']`)
      .toArray()
      .map((one) => one.attribs.href)
  )

  const first = data.values().next().value
  yield* _(processHost(first))
})

// Effect.runFork(program)
