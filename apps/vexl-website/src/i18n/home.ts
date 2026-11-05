import {localized} from './locales'

export interface HeroPhoneImage {
  readonly src: string
  readonly srcSet?: string
  readonly sizes?: string
  readonly width?: number
  readonly loading?: 'lazy'
}

interface Card {
  readonly title: string
  readonly text: string
}

export const home = localized<{
  readonly title: string
  readonly description: string
  readonly hero: {
    readonly headline: string
    readonly text: string
    readonly scanToDownload: readonly [string, string]
    readonly downloadButton: string
    readonly phoneImage: HeroPhoneImage
  }
  readonly howItWorks: {
    readonly headline: string
    readonly contacts: Card
    readonly offers: Card
    readonly chat: Card
    readonly meet: Card
  }
  readonly features: {
    readonly friends: Card
    readonly marketplace: Card
    readonly noData: Card
    readonly anonymisation: Card
  }
  readonly noKyc: {
    readonly headline: string
    readonly everyExchange: string
    readonly name: string
    readonly phoneNumber: string
    readonly selfie: string
    readonly creditCard: string
    readonly address: string
    readonly email: string
    readonly bankAccount: string
    readonly vexl: string
    readonly nickname: string
    readonly messageImage: string
    readonly downloadButton: string
  }
  readonly openSource: {
    readonly headline: string
    readonly text: string
  }
  readonly claim: {
    readonly miniclaim: readonly [string, string]
    readonly headline: string
  }
  readonly foundation: {
    readonly headline: string
    readonly text: string
  }
}>({
  en: {
    title: 'Trade Bitcoin Privately P2P | Vexl',
    description:
      'Trade Bitcoin peer-to-peer with friends and friends of friends. No KYC, fully anonymous, end-to-end encrypted chat. Open-source mobile app.',
    hero: {
      headline: 'Trade bitcoin privately.',
      text: 'Vexl is a mobile app that gives users an easy and safe way to trade Bitcoin peer-to-peer, without KYC.',
      scanToDownload: ['Scan to download', 'Vexl App'],
      downloadButton: 'Download vexl',
      phoneImage: {
        src: '/wf/6a1049661859ee47d0bf75d5_hp_hero.webp',
        sizes: '(max-width: 1919px) 100vw, 1400px',
        width: 1479,
        srcSet:
          '/wf/6a1049661859ee47d0bf75d5_hp_hero-p-500.webp 500w, /wf/6a1049661859ee47d0bf75d5_hp_hero-p-800.webp 800w, /wf/6a1049661859ee47d0bf75d5_hp_hero-p-1080.webp 1080w, /wf/6a1049661859ee47d0bf75d5_hp_hero.webp 1089w',
      },
    },
    howItWorks: {
      headline: 'How it works',
      contacts: {
        title: 'Add your contacts securely',
        text: 'Create your trusted network and discover offers from friends, and friends of friends.',
      },
      offers: {
        title: 'Browse or add offers',
        text: 'Vexl works as a private marketplace. Browse or add offers and choose who you want to connect with.',
      },
      chat: {
        title: 'Chat anonymously',
        text: 'Send or receive request based on an offer. Chat anonymously until you decide to reveal your identity.',
      },
      meet: {
        title: 'Meet & trade privately',
        text: 'Agree on the details, meet in person, and exchange privately. Vexl never handles your money or tracks your purchases.',
      },
    },
    features: {
      friends: {
        title: 'Friends',
        text: 'When you import your contact list, Vexl allows you to connect with your real world social network: your friends and friends of friends.',
      },
      marketplace: {
        title: 'Marketplace',
        text: 'Browse anonymized offers within your real world social bubble and filter them according to your needs.',
      },
      noData: {
        title: 'No data stored',
        text: "We do not store any personal information or any of your messages, period. We are completely open-source so don't just take our word for it, check the source code yourself. 😎",
      },
      anonymisation: {
        title: 'Anonymisation',
        text: 'You choose if and when you want to reveal your identity. You are in control of your data. No two users see you the same way, your public profile is new with every trade.',
      },
    },
    noKyc: {
      headline: 'No KYC needed',
      everyExchange: 'Every exchange:',
      name: 'Name',
      phoneNumber: 'Phone Number',
      selfie: 'Selfie',
      creditCard: 'Credit Card',
      address: 'Adress',
      email: 'E-mail',
      bankAccount: 'Bank Account',
      vexl: 'vexl:',
      nickname: 'Nickname',
      messageImage: '/wf/666236118d31f54f579689d2_Zprava.png',
      downloadButton: 'Download Vexl',
    },
    openSource: {
      headline: 'Vexl is fully open source',
      text: 'Anyone can look for any backdoors or any other malicious intent. Also, you can look at the report from an independent Security Audit.',
    },
    claim: {
      miniclaim: ['Without freedom to transact,', 'we have no other rights.'],
      headline:
        'Bitcoin has been in the hands of institutions for far too long. We want to make it accessible to everyone again.',
    },
    foundation: {
      headline: 'Brought to you by Vexl Foundation',
      text: 'The Foundation seeks to collaborate with other organizations and individuals who share the vision of a free and open financial world.',
    },
  },
  cs: {
    title: 'Soukromé P2P obchodování Bitcoinu | Vexl',
    description:
      'Vexl je mobilní aplikace, která svým uživatelům poskytuje jednoduchý, dostupný a bezpečný způsob jak obchodovat bitcoin tak, jak bylo zamýšleno - p2p a bez KYC.',
    hero: {
      headline: 'Bitcoin obchod soukromě',
      text: 'Vexl je mobilní aplikace, která svým uživatelům poskytuje jednoduchý, dostupný a bezpečný způsob jak obchodovat bitcoin tak, jak bylo zamýšleno - peer-to-peer a bez KYC.',
      scanToDownload: ['Naskenuj a stáhni', 'aplikaci Vexl'],
      downloadButton: 'Stáhnout Vexl',
      phoneImage: {
        src: '/wf/66e2cc20b9c4af13f929b651_Frame-2-kopie-2-.png',
        loading: 'lazy',
      },
    },
    howItWorks: {
      headline: 'Jak to funguje',
      contacts: {
        title: 'Přidejte své kontakty bezpečně',
        text: 'Vytvořte si svou důvěryhodnou síť a objevujte nabídky od přátel a přátel přátel.',
      },
      offers: {
        title: 'Procházejte nebo přidávejte nabídky',
        text: 'Vexl funguje jako soukromé tržiště. Procházejte nebo přidávejte nabídky a vyberte si, s kým se chcete spojit.',
      },
      chat: {
        title: 'Chatujte anonymně',
        text: 'Odešlete nebo přijměte žádost na základě nabídky. Chatujte anonymně, dokud se nerozhodnete odhalit svou identitu.',
      },
      meet: {
        title: 'Sejděte se a obchodujte soukromě',
        text: 'Dohodněte se na podrobnostech, sejděte se osobně a vyměňte si soukromě. Vexl nikdy nespravuje vaše peníze ani nesleduje vaše nákupy.',
      },
    },
    features: {
      friends: {
        title: 'Přátelé',
        text: 'Když importujete svůj seznam kontaktů, Vexl vám umožní spojit se s vaší reálnou sociální sítí: s vašimi přáteli a přáteli přátel.',
      },
      marketplace: {
        title: 'Tržiště',
        text: 'Procházejte anonymizované nabídky ve vaší skutečné sociální bublině a filtrujte je podle svých potřeb.',
      },
      noData: {
        title: 'Žádná data uložena',
        text: 'Neukládáme žádné osobní údaje ani žádné z vašich zpráv, tečka. Jsme kompletně open-source, takže nám to nemusíte jen tak věřit, zkontrolujte si zdrojový kód sami. 😎',
      },
      anonymisation: {
        title: 'Anonymizace',
        text: 'Vy si zvolíte, zda a kdy chcete odhalit svou identitu. Svá data máte pod kontrolou. Žádní dva uživatelé vás nevidí stejně, váš veřejný profil je s každým obchodem nový.',
      },
    },
    noKyc: {
      headline: 'KYC není potřeba',
      everyExchange: 'Každá směnárna:',
      name: 'Jméno',
      phoneNumber: 'Telefonní číslo',
      selfie: 'Selfie',
      creditCard: 'Kreditní karta',
      address: 'Adresa',
      email: 'E-mail',
      bankAccount: 'Bankovní účet',
      vexl: 'vexl:',
      nickname: 'Přezdívka',
      messageImage: '/wf/66d76911e660ce070afb747e_Frame-7254.png',
      downloadButton: 'Stáhnout Vexl',
    },
    openSource: {
      headline: 'Vexl je plně open source',
      text: 'Kdokoli může hledat zadní vrátka nebo jiné nekalé úmysly. Můžete se také podívat na zprávu z nezávislého bezpečnostního auditu.',
    },
    claim: {
      miniclaim: ['Bez svobody obchodovat,', 'nemáme žádná jiná práva.'],
      headline:
        'Bitcoin byl v rukou institucí příliš dlouho. Chceme ho zpřístupnit znovu všem.',
    },
    foundation: {
      headline: 'Přináší vám nadační fond Vexl',
      text: 'Nadace se snaží spolupracovat s dalšími organizacemi a jednotlivci, kteří sdílejí vizi svobodného a otevřeného finančního světa.',
    },
  },
})

export type HomeMessages = (typeof home)['en']

/** The live Czech page leaves the bottom hero untranslated. */
export const bottomHero: {
  readonly headline: readonly [string, string]
  readonly scanToDownload: readonly [string, string]
  readonly downloadButton: string
} = {
  headline: ['Vexl is quick.', 'Buy Bitcoin today.'],
  scanToDownload: ['Scan to download', 'Vexl App'],
  downloadButton: 'Download vexl',
}
