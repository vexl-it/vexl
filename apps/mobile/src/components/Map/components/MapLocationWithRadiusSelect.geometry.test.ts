import {
  calculateAsymmetricZoomRange,
  calculateAvailableSelectionFrame,
  calculateCenteredZoomRange,
  calculateLongitudeRadiusDelta,
  calculateNormalizedSliderValueFromZoom,
  calculateRingDiameter,
  calculateZoomFromLongitudeDelta,
  calculateZoomFromNormalizedSliderValue,
} from './MapLocationWithRadiusSelect.geometry'

describe('MapLocationWithRadiusSelect geometry', () => {
  test('calculates the selectable frame inside measured overlays', () => {
    expect(
      calculateAvailableSelectionFrame({
        container: {width: 390, height: 844},
        overlays: {top: 140, bottom: 228, left: 0, right: 0},
      })
    ).toEqual({
      x: 0,
      y: 140,
      width: 390,
      height: 476,
      centerX: 195,
      centerY: 378,
    })
  })

  test('clamps ring diameter to the shorter available frame side minus margin', () => {
    expect(
      calculateRingDiameter({
        frame: {
          x: 0,
          y: 120,
          width: 390,
          height: 300,
          centerX: 195,
          centerY: 270,
        },
        margin: 16,
      })
    ).toBe(268)
  })

  test('does not return a negative ring diameter for cramped frames', () => {
    expect(
      calculateRingDiameter({
        frame: {
          x: 0,
          y: 0,
          width: 30,
          height: 20,
          centerX: 15,
          centerY: 10,
        },
        margin: 16,
      })
    ).toBe(0)
  })

  test('calculates longitude radius delta across the dateline', () => {
    expect(
      calculateLongitudeRadiusDelta({
        centerLongitude: 179,
        edgeLongitude: -179,
      })
    ).toBe(2)
  })

  test('calculates zoom from longitude delta using web mercator sizing', () => {
    expect(
      calculateZoomFromLongitudeDelta({
        longitudeDelta: 360,
        mapWidth: 256,
      })
    ).toBeCloseTo(0)

    expect(
      calculateZoomFromLongitudeDelta({
        longitudeDelta: 180,
        mapWidth: 256,
      })
    ).toBeCloseTo(1)
  })

  test('centers zoom range around the initial zoom', () => {
    const zoomRange = calculateCenteredZoomRange({
      centerZoom: 7.2,
      span: 9,
      minZoom: 0,
      maxZoom: 20,
    })

    expect(zoomRange.min).toBeCloseTo(2.7)
    expect(zoomRange.max).toBeCloseTo(11.7)
    expect((zoomRange.min + zoomRange.max) / 2).toBeCloseTo(7.2)
  })

  test('clamps centered zoom range to absolute zoom bounds', () => {
    expect(
      calculateCenteredZoomRange({
        centerZoom: 18,
        span: 9,
        minZoom: 0,
        maxZoom: 20,
      })
    ).toEqual({
      min: 11,
      max: 20,
    })
  })

  test('allows less zoom out than zoom in from the initial zoom', () => {
    expect(
      calculateAsymmetricZoomRange({
        initialZoom: 6,
        zoomOut: 0.8,
        zoomIn: 6,
        minZoom: 0,
        maxZoom: 20,
      })
    ).toEqual({
      min: 5.2,
      max: 12,
    })
  })

  test('clamps asymmetric zoom range to absolute zoom bounds', () => {
    expect(
      calculateAsymmetricZoomRange({
        initialZoom: 19,
        zoomOut: 0.8,
        zoomIn: 6,
        minZoom: 0,
        maxZoom: 20,
      })
    ).toEqual({
      min: 18.2,
      max: 20,
    })
  })

  test('keeps initial zoom at the center of normalized slider value', () => {
    expect(
      calculateZoomFromNormalizedSliderValue({
        sliderValue: 0.5,
        initialZoom: 6,
        zoomOut: 0.8,
        zoomIn: 6,
        minZoom: 0,
        maxZoom: 20,
      })
    ).toBe(6)
  })

  test('maps normalized slider left side to capped zoom out', () => {
    expect(
      calculateZoomFromNormalizedSliderValue({
        sliderValue: 0,
        initialZoom: 6,
        zoomOut: 0.8,
        zoomIn: 6,
        minZoom: 0,
        maxZoom: 20,
      })
    ).toBe(5.2)
  })

  test('maps normalized slider right side to larger zoom in', () => {
    expect(
      calculateZoomFromNormalizedSliderValue({
        sliderValue: 1,
        initialZoom: 6,
        zoomOut: 0.8,
        zoomIn: 6,
        minZoom: 0,
        maxZoom: 20,
      })
    ).toBe(12)
  })

  test('maps zoom back to normalized slider value', () => {
    const input = {
      initialZoom: 6,
      zoomOut: 0.8,
      zoomIn: 6,
      minZoom: 0,
      maxZoom: 20,
    }

    expect(
      calculateNormalizedSliderValueFromZoom({
        ...input,
        zoom: 5.2,
      })
    ).toBe(0)

    expect(
      calculateNormalizedSliderValueFromZoom({
        ...input,
        zoom: 6,
      })
    ).toBe(0.5)

    expect(
      calculateNormalizedSliderValueFromZoom({
        ...input,
        zoom: 12,
      })
    ).toBe(1)
  })

  test('clamps zoom outside normalized slider bounds', () => {
    const input = {
      initialZoom: 6,
      zoomOut: 0.8,
      zoomIn: 6,
      minZoom: 0,
      maxZoom: 20,
    }

    expect(
      calculateNormalizedSliderValueFromZoom({
        ...input,
        zoom: 4,
      })
    ).toBe(0)

    expect(
      calculateNormalizedSliderValueFromZoom({
        ...input,
        zoom: 15,
      })
    ).toBe(1)
  })
})
