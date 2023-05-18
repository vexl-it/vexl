import {device} from "detox";

describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it.skip('should have welcome screen', () => {
    const welcomeScreen = element(by.id('welcome'));

    expect(welcomeScreen).toBeVisible();
  });
});
