import {Option} from 'effect'
import {
  type PlaceTranslations,
  type PlaceWithContextRecord,
} from '../db/PlacesDbService/domain'
import {SELF_SUFFICIENT_TYPES, viewportLatRadiusDeg} from './common'

/**
 * "cs-CZ" / "CS" / "cs" → "cs". Anything that isn't a two-letter code falls
 * back to "en" — Intl.DisplayNames throws on invalid locale tags.
 */
export const pickLang = (lang: string): string => {
  const code = lang.toLowerCase().slice(0, 2)
  return /^[a-z]{2}$/.test(code) ? code : 'en'
}

export const localizedName = (
  name: string,
  names: PlaceTranslations,
  lang: string
): string => names[lang] ?? name

export const countryDisplayName = (
  countryCode: Option.Option<string>,
  lang: string
): Option.Option<string> =>
  Option.flatMap(countryCode, (code) =>
    Option.fromNullable(
      new Intl.DisplayNames([lang, 'en'], {
        type: 'region',
        fallback: 'code',
      }).of(code.toUpperCase())
    )
  )

const isSelfSufficientType = (placeType: string): boolean =>
  SELF_SUFFICIENT_TYPES.some((one) => one === placeType)

export const localizedCityContext = (
  record: Pick<PlaceWithContextRecord, 'placeType' | 'cityName' | 'cityNames'>,
  lang: string
): Option.Option<string> =>
  isSelfSufficientType(record.placeType)
    ? Option.none()
    : Option.map(record.cityName, (cityName) =>
        localizedName(
          cityName,
          Option.getOrElse(record.cityNames, (): PlaceTranslations => ({})),
          lang
        )
      )

/**
 * Second suggestion row: "Praha, Czechia" for sub-city places, "Slovakia" for
 * cities. Falls back to the place name itself when we know neither the city
 * nor the country (should be rare).
 */
export const buildSuggestSecondRow = (
  record: PlaceWithContextRecord,
  lang: string
): string => {
  const parts = [
    Option.getOrUndefined(localizedCityContext(record, lang)),
    Option.getOrUndefined(countryDisplayName(record.countryCode, lang)),
  ].filter((one) => one !== undefined)

  return parts.length > 0
    ? parts.join(', ')
    : localizedName(record.name, record.names, lang)
}

/**
 * Reverse-geocode address, matching the shape the app displayed with Google:
 * "Vinohrady, Praha - CZ" for sub-city places, "Bratislava - SK" for cities.
 */
export const buildGeocodeAddress = (
  record: Pick<
    PlaceWithContextRecord,
    'placeType' | 'name' | 'names' | 'countryCode' | 'cityName' | 'cityNames'
  >,
  lang: string
): string => {
  const placeName = localizedName(record.name, record.names, lang)
  const cityPart = Option.getOrUndefined(localizedCityContext(record, lang))
  const namePart =
    cityPart !== undefined && cityPart !== placeName
      ? `${placeName}, ${cityPart}`
      : placeName

  return Option.match(record.countryCode, {
    onNone: () => namePart,
    onSome: (code) => `${namePart} - ${code.toUpperCase()}`,
  })
}

export const buildViewport = (
  latitude: number,
  longitude: number,
  placeType: string
): {
  northeast: {latitude: number; longitude: number}
  southwest: {latitude: number; longitude: number}
} => {
  const latDelta = viewportLatRadiusDeg(placeType)
  const latRad = (latitude * Math.PI) / 180
  const lonDelta = Math.min(5, latDelta / Math.max(0.05, Math.cos(latRad)))

  return {
    northeast: {
      latitude: Math.min(90, latitude + latDelta),
      longitude: longitude + lonDelta,
    },
    southwest: {
      latitude: Math.max(-90, latitude - latDelta),
      longitude: longitude - lonDelta,
    },
  }
}

/** Escapes LIKE pattern characters so user input is matched literally. */
export const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, (match) => `\\${match}`)
