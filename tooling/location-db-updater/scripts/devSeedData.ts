/**
 * Dev-only fixture: the major Slovak and Czech cities plus the European
 * capitals. Enough for /suggest and /geocode to return sensible results out of
 * the box, with zero external tooling or downloads. Populations and
 * coordinates are approximate — this data never leaves a dev machine.
 *
 * seedDevPlaces.ts inserts these with NEGATIVE ids (OSM-derived ids are always
 * positive), and skips any entry whose name already exists as a settlement of
 * the same country — so after a real SK+CZ OSM ingest only the missing
 * capitals are added on top.
 *
 * Translation keys must come from SUPPORTED_LANGS (src/places/common.ts).
 */
export interface DevSeedPlace {
  readonly placeType: 'city' | 'town'
  readonly name: string
  readonly names: Readonly<Record<string, string>>
  readonly countryCode: string
  readonly population: number
  readonly latitude: number
  readonly longitude: number
}

const city = (
  name: string,
  countryCode: string,
  population: number,
  latitude: number,
  longitude: number,
  names: Readonly<Record<string, string>> = {}
): DevSeedPlace => ({
  placeType: population >= 100_000 ? 'city' : 'town',
  name,
  names,
  countryCode,
  population,
  latitude,
  longitude,
})

const capital = (
  name: string,
  countryCode: string,
  population: number,
  latitude: number,
  longitude: number,
  names: Readonly<Record<string, string>> = {}
): DevSeedPlace => ({
  // Capitals are always 'city' regardless of size (Vaduz, Valletta, …), so
  // they rank and zoom like the country's principal place they are.
  placeType: 'city',
  name,
  names,
  countryCode,
  population,
  latitude,
  longitude,
})

export const devSeedPlaces: readonly DevSeedPlace[] = [
  // Slovakia
  capital('Bratislava', 'sk', 475_503, 48.1486, 17.1077, {
    de: 'Pressburg',
    ja: 'ブラチスラヴァ',
  }),
  city('Košice', 'sk', 229_040, 48.7164, 21.2611, {de: 'Kaschau'}),
  city('Prešov', 'sk', 84_824, 49.0018, 21.2393),
  city('Žilina', 'sk', 82_656, 49.2231, 18.7394),
  city('Nitra', 'sk', 78_489, 48.3061, 18.0764),
  city('Banská Bystrica', 'sk', 76_018, 48.7363, 19.1462),
  city('Trnava', 'sk', 63_803, 48.3774, 17.5883),
  city('Trenčín', 'sk', 54_740, 48.8945, 18.0444),
  city('Martin', 'sk', 52_044, 49.0665, 18.9235),
  city('Poprad', 'sk', 49_855, 49.0553, 20.2988),

  // Czechia
  capital('Praha', 'cz', 1_384_732, 50.0875, 14.4213, {
    en: 'Prague',
    de: 'Prag',
    fr: 'Prague',
    es: 'Praga',
    it: 'Praga',
    pl: 'Praga',
  }),
  city('Brno', 'cz', 400_566, 49.1951, 16.6068, {de: 'Brünn'}),
  city('Ostrava', 'cz', 283_504, 49.8209, 18.2625),
  city('Plzeň', 'cz', 185_599, 49.7475, 13.3776, {
    en: 'Pilsen',
    de: 'Pilsen',
  }),
  city('Liberec', 'cz', 107_982, 50.7663, 15.0543),
  city('Olomouc', 'cz', 102_293, 49.5938, 17.2509),
  city('České Budějovice', 'cz', 96_369, 48.9745, 14.4743, {de: 'Budweis'}),
  city('Hradec Králové', 'cz', 93_906, 50.2092, 15.8328),
  city('Pardubice', 'cz', 92_362, 50.0343, 15.7812),
  city('Ústí nad Labem', 'cz', 91_982, 50.6607, 14.0328),
  city('Zlín', 'cz', 74_997, 49.2265, 17.6707),

  // European capitals
  capital('Wien', 'at', 1_982_442, 48.2082, 16.3738, {
    en: 'Vienna',
    cs: 'Vídeň',
    sk: 'Viedeň',
    fr: 'Vienne',
    es: 'Viena',
    it: 'Vienna',
    pl: 'Wiedeń',
  }),
  capital('Berlin', 'de', 3_878_100, 52.52, 13.405, {
    cs: 'Berlín',
    sk: 'Berlín',
    es: 'Berlín',
  }),
  capital('Warszawa', 'pl', 1_863_056, 52.2297, 21.0122, {
    en: 'Warsaw',
    de: 'Warschau',
    cs: 'Varšava',
    sk: 'Varšava',
    fr: 'Varsovie',
  }),
  capital('Budapest', 'hu', 1_685_342, 47.4979, 19.0402, {
    cs: 'Budapešť',
    sk: 'Budapešť',
  }),
  capital('Paris', 'fr', 2_102_650, 48.8566, 2.3522, {
    cs: 'Paříž',
    sk: 'Paríž',
    es: 'París',
    it: 'Parigi',
    pl: 'Paryż',
  }),
  capital('London', 'gb', 8_799_728, 51.5074, -0.1278, {
    cs: 'Londýn',
    sk: 'Londýn',
    fr: 'Londres',
    es: 'Londres',
    it: 'Londra',
    pl: 'Londyn',
  }),
  capital('Roma', 'it', 2_748_109, 41.9028, 12.4964, {
    en: 'Rome',
    de: 'Rom',
    cs: 'Řím',
    sk: 'Rím',
    fr: 'Rome',
  }),
  capital('Madrid', 'es', 3_305_408, 40.4168, -3.7038),
  capital('Lisboa', 'pt', 545_923, 38.7223, -9.1393, {
    en: 'Lisbon',
    de: 'Lissabon',
    cs: 'Lisabon',
    sk: 'Lisabon',
  }),
  capital('Amsterdam', 'nl', 905_234, 52.3676, 4.9041, {cs: 'Amsterodam'}),
  capital('Bruxelles', 'be', 1_222_637, 50.8503, 4.3517, {
    en: 'Brussels',
    nl: 'Brussel',
    de: 'Brüssel',
    cs: 'Brusel',
    sk: 'Brusel',
  }),
  capital('Bern', 'ch', 134_506, 46.948, 7.4474, {fr: 'Berne'}),
  capital('Luxembourg', 'lu', 132_780, 49.6116, 6.1319, {
    de: 'Luxemburg',
    cs: 'Lucemburk',
  }),
  capital('Dublin', 'ie', 588_233, 53.3498, -6.2603),
  capital('København', 'dk', 660_842, 55.6761, 12.5683, {
    en: 'Copenhagen',
    de: 'Kopenhagen',
    cs: 'Kodaň',
    sk: 'Kodaň',
  }),
  capital('Stockholm', 'se', 984_748, 59.3293, 18.0686),
  capital('Oslo', 'no', 709_037, 59.9139, 10.7522),
  capital('Helsinki', 'fi', 664_028, 60.1699, 24.9384, {cs: 'Helsinky'}),
  capital('Tallinn', 'ee', 445_005, 59.437, 24.7536),
  capital('Rīga', 'lv', 614_618, 56.9496, 24.1052, {en: 'Riga', cs: 'Riga'}),
  capital('Vilnius', 'lt', 593_436, 54.6872, 25.2797),
  capital('Minsk', 'by', 1_995_471, 53.9006, 27.559),
  capital('Київ', 'ua', 2_952_301, 50.4501, 30.5234, {
    en: 'Kyiv',
    de: 'Kiew',
    cs: 'Kyjev',
    sk: 'Kyjev',
    pl: 'Kijów',
  }),
  capital('Chișinău', 'md', 639_994, 47.0105, 28.8638, {cs: 'Kišiněv'}),
  capital('București', 'ro', 1_716_961, 44.4268, 26.1025, {
    en: 'Bucharest',
    de: 'Bukarest',
    cs: 'Bukurešť',
    sk: 'Bukurešť',
  }),
  capital('София', 'bg', 1_241_396, 42.6977, 23.3219, {
    en: 'Sofia',
    de: 'Sofia',
    cs: 'Sofie',
  }),
  capital('Beograd', 'rs', 1_166_763, 44.7866, 20.4489, {
    en: 'Belgrade',
    de: 'Belgrad',
    cs: 'Bělehrad',
    sk: 'Belehrad',
  }),
  capital('Zagreb', 'hr', 767_131, 45.815, 15.9819, {
    cs: 'Záhřeb',
    sk: 'Záhreb',
  }),
  capital('Ljubljana', 'si', 295_504, 46.0569, 14.5058, {cs: 'Lublaň'}),
  capital('Sarajevo', 'ba', 275_524, 43.8563, 18.4131),
  capital('Podgorica', 'me', 150_977, 42.4304, 19.2594),
  capital('Skopje', 'mk', 544_086, 41.9973, 21.428),
  capital('Tiranë', 'al', 418_495, 41.3275, 19.8187, {
    en: 'Tirana',
    cs: 'Tirana',
  }),
  capital('Αθήνα', 'gr', 664_046, 37.9838, 23.7275, {
    en: 'Athens',
    de: 'Athen',
    cs: 'Atény',
    sk: 'Atény',
  }),
  capital('Москва', 'ru', 12_655_050, 55.7558, 37.6173, {
    en: 'Moscow',
    de: 'Moskau',
    cs: 'Moskva',
    sk: 'Moskva',
  }),
  capital('Reykjavík', 'is', 139_875, 64.1466, -21.9426),
  capital('Valletta', 'mt', 5_827, 35.8989, 14.5146),
  capital('Λευκωσία', 'cy', 55_014, 35.1856, 33.3823, {
    en: 'Nicosia',
    cs: 'Nikósie',
  }),
  capital('Andorra la Vella', 'ad', 22_873, 42.5063, 1.5218),
  capital('Monaco', 'mc', 38_350, 43.7384, 7.4246),
  capital('San Marino', 'sm', 4_061, 43.9424, 12.4578),
  capital('Vaduz', 'li', 5_696, 47.141, 9.5209),
]
