interface MapStyleStyler {
  color?: string
  visibility?: string
}

interface MapStyleRule {
  elementType?: string
  featureType?: string
  stylers: MapStyleStyler[]
}

function mapColor(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`
}

export const darkMapTheme: MapStyleRule[] = [
  {
    elementType: 'geometry',
    stylers: [{color: mapColor(0x212121)}],
  },
  {
    elementType: 'labels.icon',
    stylers: [{visibility: 'off'}],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{color: mapColor(0x757575)}],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{color: mapColor(0x212121)}],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{color: mapColor(0x757575)}],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{color: mapColor(0x9e9e9e)}],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{visibility: 'off'}],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{color: mapColor(0xbdbdbd)}],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{color: mapColor(0x757575)}],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{color: mapColor(0x181818)}],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{color: mapColor(0x616161)}],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.stroke',
    stylers: [{color: mapColor(0x1b1b1b)}],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{color: mapColor(0x2c2c2c)}],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{color: mapColor(0x8a8a8a)}],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{color: mapColor(0x373737)}],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{color: mapColor(0x3c3c3c)}],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{color: mapColor(0x4e4e4e)}],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{color: mapColor(0x616161)}],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{color: mapColor(0x757575)}],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{color: mapColor(0x000000)}],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{color: mapColor(0x3d3d3d)}],
  },
]

function invertHexColor(color: string): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec(color)
  const hexValue = match?.[1]

  if (!hexValue) return color

  const value = Number.parseInt(hexValue, 16)
  const invertedValue = 0xffffff ^ value

  return `#${invertedValue.toString(16).padStart(6, '0').toUpperCase()}`
}

function invertStyler(styler: MapStyleStyler): MapStyleStyler {
  if (!styler.color) return styler

  return {
    ...styler,
    color: invertHexColor(styler.color),
  }
}

export const lightMapTheme: MapStyleRule[] = darkMapTheme.map((rule) => ({
  ...rule,
  stylers: rule.stylers.map(invertStyler),
}))

export function getMapTheme(theme: 'light' | 'dark'): MapStyleRule[] {
  return theme === 'dark' ? darkMapTheme : lightMapTheme
}

export default darkMapTheme
