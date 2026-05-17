import {
  calculateAvailableSelectionFrame,
  calculateLongitudeRadiusDelta,
  calculateRingDiameter,
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
})
