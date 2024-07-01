describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should have marketplace screen visible after application starts', async () => {
    expect(element(by.id('MarketplaceScreen'))).toBeVisible()
  })
})
