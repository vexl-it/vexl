import {atom} from 'jotai'
import {
  getLocationCompactDisplayLabelForLocations,
  getLocationFullDisplayLabel,
  getLocationFullDisplayLabels,
  type OfferLocationLabelData,
} from './offerLocationLabels'
import {currentAppLanguageAtom} from './preferences'

export const offerLocationLabelsAtom = atom((get) => {
  const appLanguage = get(currentAppLanguageAtom)

  return {
    getFullLabel: (location: OfferLocationLabelData) =>
      getLocationFullDisplayLabel(location, appLanguage),
    getFullLabels: (locations: readonly OfferLocationLabelData[]) =>
      getLocationFullDisplayLabels(locations, appLanguage),
    getCompactLabelForLocations: (
      locations: readonly OfferLocationLabelData[]
    ) => getLocationCompactDisplayLabelForLocations(locations, appLanguage),
  }
})
