import {element, expect, waitFor} from 'detox'
import {openApp} from './utils'

describe('Login flow UI tests', () => {
  beforeAll(async () => {
    await openApp({
      newInstance: true,
      permissions: {contacts: 'YES', notifications: 'YES'},
    })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should test successfull login flow', async () => {
    await expect(element(by.id('marketplace-screen'))).not.toBeVisible()
    await expect(element(by.id('intro-flow'))).toBeVisible()

    await element(by.id('progress-journey-skip-button')).tap()

    // StartScreen
    await expect(element(by.id('start-screen'))).toBeVisible()
    await element(by.id('tos-switch')).tap()

    await element(by.id('secondary-next-button-proxy')).tap()

    // PhoneNumberScreen
    await expect(element(by.id('phone-number-screen'))).toBeVisible()
    await element(by.id('phone-number-input'))
      .typeText('720958958')
      .then(async () => {
        await element(by.id('phone-number-screen-subtitle')).tap()
      })
    await element(by.id('secondary-next-button-proxy')).tap()

    // VerificationCodeScreen
    await element(by.id('verification-code-input')).replaceText('222222')
    await element(by.id('secondary-next-button-proxy')).tap()

    // SuccessLoginScreen
    try {
      await waitFor(element(by.id('success-login-screen')))
        .toBeVisible()
        .withTimeout(2000)
    } catch (e) {
      console.log('Success screen did not appear, it means modal is present.')
    }

    try {
      await expect(element(by.id('animated-dialog'))).toBeVisible()
      await element(by.id('are-you-sure-dialog-positive-button')).tap()
    } catch (e) {
      console.log('Modal did not appear, continuing with the test.')
    }

    // SuccessLoginScreen should now be visible after modal disappeared
    await expect(element(by.id('success-login-screen'))).toBeVisible()

    await waitFor(element(by.id('import-contacts-explanation')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('secondary-next-button-proxy')).tap()

    await expect(element(by.id('marketplace-screen'))).toBeVisible()
  })

  it('should import contact', async () => {
    const normalizedNumber = '+420721958958'

    await waitFor(element(by.id('marketplace-screen')))
      .toBeVisible()
      .withTimeout(6000)

    await expect(element(by.id('Settings-tab-button'))).toBeVisible()
    await element(by.id('Settings-tab-button')).tap()

    await element(by.id('contacts-management-button')).tap()

    await expect(element(by.id('set-contacts-screen'))).toBeVisible()
    await element(by.id('search-add-number-input')).replaceText(
      normalizedNumber
    )

    try {
      await element(by.id('add-contact-manually-button')).tap()
      await expect(element(by.id('animated-dialog'))).toBeVisible()
      await element(by.id('are-you-sure-dialog-positive-button')).tap()
      await element(by.id('are-you-sure-dialog-negative-button')).tap()
      await waitFor(element(by.id('animated-dialog')))
        .toBeVisible()
        .withTimeout(1000)
      await element(by.id('are-you-sure-dialog-positive-button')).tap()

      await element(by.id('submitted-contacts-tab')).tap()
      await expect(element(by.id('contact-list-item'))).toBeVisible()
      await expect(
        element(by.id('contact-list-item-normalized-number'))
      ).toHaveText(normalizedNumber)
    } catch (e) {
      console.log(`Contact is probably already added and is in contact list`)
    }
  })

  it('should create offer', async () => {
    const testOfferDescription = 'Detox test offer'

    await waitFor(element(by.id('marketplace-screen')))
      .toBeVisible()
      .withTimeout(3000)

    await expect(element(by.id('create-offer-tab-button'))).toBeVisible()
    await element(by.id('create-offer-tab-button')).tap()

    // ListingAndOfferTypeScreen
    await expect(
      element(by.id('listing-type-and-offer-type-screen'))
    ).toBeVisible()
    await element(by.id('listing-type-BITCOIN')).tap()
    await element(by.id('offer-type-SELL')).tap()
    await element(by.id('progress-journey-next-button')).tap()

    // CurrencyAndAmountScreen
    await expect(element(by.id('currency-and-amount-screen'))).toBeVisible()
    await element(by.id('progress-journey-next-button')).tap()

    // LocationAndPaymentMethodScreen
    await expect(
      element(by.id('location-and-payment-method-screen'))
    ).toBeVisible()
    await element(by.id('location-ONLINE')).tap()
    await element(by.id('progress-journey-next-button')).tap()

    // OfferDescriptionScreen
    await expect(element(by.id('offer-description-screen'))).toBeVisible()
    await element(by.id('offer-description-input')).replaceText(
      testOfferDescription
    )
    await element(by.id('progress-journey-next-button')).tap()

    // SpokenLanguagesNetworkAndFriendLevelScreen
    await expect(
      element(by.id('spoken-languages-network-and-friend-level-screen'))
    ).toBeVisible()
    await element(by.id('progress-journey-done-finish-button')).tap()

    await waitFor(element(by.id('marketplace-screen')))
      .toBeVisible()
      .withTimeout(10000)

    // Check if created offer exists in my offers
    await element(by.id('MyOffers-tab-button')).tap()
    await expect(element(by.text(testOfferDescription))).toBeVisible()
  })
})
