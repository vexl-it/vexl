import {localized} from './locales'

export interface DownloadStep {
  readonly title: string
  readonly copy: string
  /** Bold sentence closing the copy. */
  readonly emphasis?: string
  /** Shorter copy shown on phones instead of `copy`. */
  readonly mobileCopy?: string
  readonly action?: {
    readonly label: string
    readonly href: string
    readonly newTab: boolean
  }
}

export interface DownloadMessages extends Readonly<typeof shared> {
  readonly metaTitle: string
  readonly metaDescription: string
  /** Lines of the hero heading. */
  readonly heading: readonly string[]
  readonly iphoneSubtitle: string
  readonly steps: readonly DownloadStep[]
  readonly footText: string
  readonly footLink: string
  readonly otherStoresSubtitle: string
}

const shared = {
  android: 'Android',
  androidSubtitle: 'Fastest option',
  googlePlay: 'Get it on Google Play',
  alternatives: 'Alternative Options',
  alternativesSubtitle: 'Prefer an alternative to the Play Store?',
  otherStores: 'Other app stores',
  otherWays: 'Other ways to install',
  otherWaysSubtitle:
    'You can also use the APK from GitHub. We recommend installing it via Obtainium to receive updates.',
  freedom: 'Your freedom. Your choice.',
  freedomSubtitle: 'Vexl is private and non-KYC.',
  iphoneTitle: 'iOS (iPhone)',
}

const downloadEn: DownloadMessages = {
  ...shared,
  metaTitle: 'Download Vexl | Get the app on iPhone or Android',
  metaDescription:
    'Get Vexl on your phone. One tap on Android, three steps on iPhone. No KYC, no accounts, no App Store gatekeepers.',
  heading: ['Get the Vexl\u00a0app'],
  iphoneSubtitle: '3 easy steps – please read instructions first',
  steps: [
    {
      title: 'Get AltStore Pal',
      copy: 'AltStore is an alternative app platform that lets you securely download and update our app outside the App Store — helping you take back your freedom to install the apps you want.',
      emphasis: 'Return here after downloading.',
      mobileCopy:
        'Return to this page once the download is complete. Then follow step 2.',
      action: {
        label: 'Get AltStore Pal',
        href: 'https://altstore.io/download',
        newTab: true,
      },
    },
    {
      title: 'Add Freedom Store',
      copy: 'Freedom Store lets you install apps Apple won’t. Add it as a source in AltStore to take back control of your device and access Bitcoin and freedom tech apps without App Store gatekeepers.',
      emphasis: 'Tap the button on the right and install Vexl from there.',
      mobileCopy:
        'Add Freedom Store in AltStore Pal to access freedom tech apps. Install Vexl from there.',
      action: {
        label: 'Add Freedomstore source',
        href: 'altstore-pal://source?url=https://source.freedomstore.io/',
        newTab: false,
      },
    },
    {
      title: 'Install Vexl',
      copy: 'Install Vexl from the Freedom Store. That feeling? It’s freedom — and it’s yours again.',
      mobileCopy: 'Install Vexl from Freedom Store and start trading.',
    },
  ],
  footText: 'Outside the EU?',
  footLink: 'View instructions',
  otherStoresSubtitle: 'Choose one of the following options.',
}

const downloadNonEuEn: DownloadMessages = {
  ...shared,
  metaTitle: 'Get the Vexl app outside the EU',
  metaDescription:
    'Install Vexl on iPhone via TestFlight, or on Android from Google Play and alternative stores.',
  heading: ['Non-EU', 'download'],
  iphoneSubtitle: '2 easy steps – please read instructions first',
  steps: [
    {
      title: 'Download TestFlight from the App Store',
      copy: 'TestFlight is an official Apple app that provides a secure way to download and update our app with the newest features.',
      action: {
        label: 'Download TestFlight',
        href: 'https://apps.apple.com/us/app/testflight/id899247664?mt=8',
        newTab: true,
      },
    },
    {
      title: 'Download Vexl and start trading Bitcoin',
      copy: 'Open the Vexl beta in TestFlight, install it, and you are ready to trade.',
      action: {
        label: 'Download Vexl',
        href: 'https://testflight.apple.com/join/SuPp5FF2',
        newTab: true,
      },
    },
  ],
  footText: 'In the EU?',
  footLink: 'View EU instructions',
  otherStoresSubtitle: 'Try one of the following options.',
}

// Live serves the download pages untranslated in Czech too.
export const download = localized({en: downloadEn, cs: downloadEn})
export const downloadNonEu = localized({
  en: downloadNonEuEn,
  cs: downloadNonEuEn,
})
