import {type Messages} from './en'

export const cs: Messages = {
  meta: {
    home: {
      title: 'Obchodujte bitcoin soukromě, peer-to-peer | Vexl',
      description:
        'Kupujte a prodávejte bitcoin peer-to-peer s přáteli a přáteli přátel. Bez KYC, bez prostředníků, s end-to-end šifrovaným chatem. Otevřený kód.',
    },
    download: {
      title: 'Stáhněte si Vexl | Aplikace pro iPhone i Android',
      description:
        'Vexl do telefonu. Na Androidu jedním klepnutím, na iPhonu ve třech krocích. Bez KYC, bez účtů, bez strážců App Storu.',
    },
    downloadNonEu: {
      title: 'Stažení Vexlu mimo EU | Vexl',
      description:
        'Vexl na iPhone přes TestFlight, na Android z Google Play nebo z alternativního obchodu.',
    },
    faq: {
      title: 'Nejčastější dotazy – Vexl App',
      description:
        'Odpovědi o soukromí, poplatcích, nabídkách a obchodování ve Vexlu.',
    },
    community: {
      title: 'Vexl - Komunitní události | Bitcoinová setkání a konference',
      description:
        'Připojte se k Vexl Bitcoin komunitě. Prohlédněte si nadcházející události, uspořádejte si vlastní sraz a spojte se s podobně smýšlejícími Bitcoinovými nadšenci z celého světa.',
    },
    blog: {
      title: 'Blog - Vexl',
      description:
        'Proč jsme vytvořili Vexl, jak funguje peer-to-peer obchodování s Bitcoinem a jak v praxi vypadá svět bez KYC.',
    },
    terms: {
      title: 'Vaše ochrana je pro nás důležitá – Vexl App',
      description:
        'Přečtěte si Obchodní podmínky, Zásady ochrany osobních údajů a Zásady pro ochranu dětí Vexlu. Zjistěte, jak chráníme vaše data šifrováním a umožňujeme přímé obchodování s Bitcoiny.',
    },
    audit: {
      title: 'Bezpečnostní audit | Penetrační test aplikace Vexl',
      description:
        'Stáhněte si oficiální zprávu z penetračního testu mobilní aplikace Vexl. Transparentní posouzení bezpečnosti naší peer-to-peer platformy.',
    },
    notFound: {
      title: 'Stránka nenalezena | Vexl',
      description: 'Tato stránka neexistuje.',
    },
  },
  nav: {
    howItWorks: 'Jak to funguje',
    community: 'Komunita',
    blog: 'Blog',
    faq: 'Nejčastější dotazy',
    download: 'Stáhnout',
    otherLanguage: 'English',
    openMenu: 'Otevřít menu',
    closeMenu: 'Zavřít menu',
  },
  footer: {
    tagline: 'Vexl nečte vaše chaty a nikdy nedrží vaše peníze ani bitcoin.',
    explore: 'Vexl',
    about: 'O nás',
    foundation: 'Nadační fond Vexl',
    leaderboard: 'Žebříček zemí',
    audit: 'Bezpečnostní audit',
    github: 'Zdrojový kód',
    brand: 'Brand manuál',
    follow: 'Sledujte nás',
    youtube: 'YouTube',
    x: 'X',
    nostr: 'Nostr',
    contact: {
      title: 'Kontakt',
      lines: [
        'Vexl s.r.o.',
        'Kundratka 2359/17a',
        '180 00 Praha, Česká republika',
        'IČO: 17270642',
      ],
      email: 'support@vexl.it',
    },
    terms: 'Podmínky a ochrana soukromí',
    rights: 'Vexl © {year}',
  },
  scanToDownload: 'Naskenujte a stáhněte aplikaci Vexl',
  downloadVexl: 'Stáhnout Vexl',
  home: {
    hero: {
      title: 'Obchodujte bitcoin soukromě.',
      text: 'Kupujte a prodávejte bitcoin s lidmi z kontaktů ve vašem telefonu a s jejich přáteli. Bez ověřování totožnosti, bez prostředníků. Zůstáváte v anonymitě, dokud se sami nerozhodnete jinak.',
      howItWorks: 'Jak to funguje',
    },
    mock: {
      label: 'Ukázkové nabídky. Lidé jsou smyšlení.',
      marketplace: 'Tržiště',
      buy: 'Koupit',
      sell: 'Prodat',
      has: 'Má',
      wants: 'Chce',
      friendOfFriend: 'Přítel přítele',
      directFriend: 'Přímý přítel',
      cash: 'Hotovost',
      offers: [
        {
          id: 'coffee',
          side: 'sell',
          direct: false,
          price: '5 000 – 25 000 Kč',
          description: 'Prodám bitcoin za hotovost. Klidně se potkáme u kávy.',
          place: 'Praha',
          commonFriends: '2 společní přátelé',
          trusted: '1 důvěryhodný přítel',
        },
        {
          id: 'savings',
          side: 'sell',
          direct: true,
          price: '1 000 – 8 000 Kč',
          description: 'I malé částky. Poprvé? Se vším vás provedu.',
          place: 'Brno',
          commonFriends: '5 společných přátel',
        },
        {
          id: 'stack',
          side: 'buy',
          direct: false,
          price: '2 500 – 12 000 Kč',
          description: 'Každý měsíc nakupuji bitcoin za hotovost.',
          place: 'Ostrava',
          commonFriends: '3 společní přátelé',
        },
        {
          id: 'pizza',
          side: 'buy',
          direct: true,
          price: '500 – 2 500 Kč',
          description: 'Chci si nejdřív vyzkoušet bitcoin s malou částkou.',
          place: 'Plzeň',
          commonFriends: '1 společný přítel',
        },
        {
          id: 'market',
          side: 'sell',
          direct: false,
          price: '2 500 – 15 000 Kč',
          description:
            'Každý měsíc prodám kousek. Hodí se mi sobotní farmářské trhy.',
          place: 'Olomouc',
          commonFriends: '4 společní přátelé',
        },
        {
          id: 'weekly',
          side: 'buy',
          direct: false,
          price: '800 – 4 000 Kč',
          description:
            'Spořím: každý týden koupím trochu bitcoinu za hotovost.',
          place: 'Liberec',
          commonFriends: '2 společní přátelé',
        },
      ],
    },
    howItWorks: {
      eyebrow: 'Jak to funguje',
      title: 'Vaše kontakty jsou tržiště.',
      text: 'Mezi vámi a tím, s kým obchodujete, nestojí žádná firma. Takhle probíhá obchod.',
      caption: 'Obrazovky z aplikace. Lidé jsou smyšlení.',
      steps: {
        contacts: {
          title: 'Přidejte své kontakty',
          text: 'Vexl vás podle kontaktů v telefonu propojí s přáteli a přáteli přátel. Jejich čísla opouštějí váš telefon jen jako hashe, nikdy v čitelné podobě.',
        },
        offer: {
          title: 'Najděte nabídku',
          text: 'U nabídky vidíte částku, místo a kolik máte společných přátel. Jména zůstávají skrytá.',
        },
        chat: {
          title: 'Pište si anonymně',
          text: 'Pošlete žádost. Jakmile ji druhá strana přijme, domluvíte se v chatu šifrovaném end-to-end.',
        },
        trade: {
          title: 'Sejděte se a obchodujte',
          text: 'Jména a fotky si odhalíte, jen když oba souhlasíte. Pak se sejdete a obchod uzavřete. Vexl nesahá na hotovost ani na bitcoin.',
        },
      },
      mocks: {
        friendsOfFriends: 'Přátelé přátel',
        requestHeader: 'Vaše žádost',
        request: 'Ahoj! Platí ještě nabídka? Mám zájem o bitcoin za 7 000 Kč.',
        vexlbot: 'Vexlbot',
        accepted: 'Přijato',
        requestAccepted: 'Vaše žádost byla přijata.',
        reply: 'Platí. Ve čtvrtek v kavárně u hlavního nádraží?',
        revealed: 'Identity odhaleny',
        you: 'Vy',
        theirName: 'Jana',
        lastMessage: 'Tak ve čtvrtek. Nejdřív hotovost, pak pošlu bitcoin.',
      },
    },
    noKyc: {
      title: 'Žádný doklad. Žádné selfie. Žádný bankovní účet.',
      text: 'Směnárny tohle všechno obvykle chtějí, než vůbec můžete nakoupit. Vexl chce telefonní číslo a to zůstane soukromé, dokud se nerozhodnete ho sdílet.',
      exchangeTitle: 'Běžná směnárna chce',
      exchangeAsks: {
        name: 'Celé jméno',
        phone: 'Telefonní číslo',
        selfie: 'Selfie s dokladem',
        card: 'Platební kartu',
        address: 'Adresu bydliště',
        email: 'E-mail',
        bank: 'Bankovní účet',
      },
      vexlTitle: 'Vexl chce',
      vexlAsk: 'Telefonní číslo',
      message: 'To je vše. Kupujete bitcoin, ne ostrov.',
    },
    community: {
      title: 'Bitcoin začíná u lidí.',
      text: 'Meetupy, přednášky a hospodské kvízy, které pořádají lidé, kteří používají Vexl. Najděte nějaký ve svém okolí, nebo uspořádejte vlastní.',
      action: 'Prozkoumat komunitu',
      photos: {
        talk: 'Přednáška na pódiu Vexlu na BTC Prague před bannerem Trade Bitcoin privately',
        sign: 'Dva lidé se smějí za žlutou cedulí Privacy matters',
        mask: 'Návštěvník v masce drží ceduli I love Vexl',
      },
    },
    trust: {
      eyebrow: 'Bez svobody transakcí nemáme žádná další práva.',
      title: 'Vyvíjeno otevřeně.',
      text: 'Nemusíte nám věřit. Ověřte si to sami.',
      teamPhoto:
        'Tým Vexlu na BTC Prague před stánkem s nápisem No middlemen. No KYC. Peer-to-peer.',
      openSource: {
        title: 'Open source',
        text: 'Aplikace i servery jsou na GitHubu pod github.com/vexl-it. Kód si může přečíst kdokoli.',
        action: 'Přečíst kód',
      },
      audit: {
        title: 'Bezpečnostní audit',
        text: 'Firma Citadelo v roce 2022 otestovala první verzi aplikace a její servery. Zpráva je veřejná.',
        action: 'Přečíst audit',
      },
      foundation: {
        title: 'Nadační fond Vexl',
        text: 'Za Vexlem stojí Nadační fond Vexl, který spolupracuje se všemi, kdo chtějí svobodný a otevřený finanční svět.',
        action: 'Poznat nadační fond',
      },
    },
    cta: {
      title: 'Bitcoin, jak byl zamýšlen.',
      text: 'Peer-to-peer, mezi lidmi. Bez dokladů.',
    },
  },
  download: {
    title: 'Stáhněte si aplikaci Vexl',
    nonEuTitle: 'Vexl mimo EU',
    intro:
      'Na Androidu máte Vexl na jedno klepnutí v Google Play. Na iPhonu v App Storu není, takže to dá pár kroků navíc.',
    qrTitle: 'Jste na počítači?',
    qrText:
      'Naskenujte kód fotoaparátem v telefonu a otevřete tuto stránku tam.',
    iphone: 'iPhone',
    android: 'Android',
    ios: {
      title: 'iOS (iPhone)',
      subtitle: 'Tři kroky. Než začnete, přečtěte si je.',
      steps: {
        altStore: {
          title: 'Stáhněte si AltStore Pal',
          text: 'AltStore je obchod s aplikacemi pro iPhony v EU. Nainstaluje a aktualizuje Vexl mimo App Store.',
          emphasis: 'Po stažení se sem vraťte.',
          action: 'Stáhnout AltStore Pal',
        },
        freedomStore: {
          title: 'Přidejte Freedom Store',
          text: 'Ve Freedom Storu najdete Vexl uvnitř AltStoru. Přidejte ho jako zdroj.',
          emphasis: 'Klepněte na tlačítko níže na svém iPhonu.',
          action: 'Přidat zdroj Freedom Store',
        },
        install: {
          title: 'Nainstalujte Vexl',
          text: 'Otevřete Freedom Store v AltStoru a nainstalujte Vexl. Aktualizace pak přicházejí odtamtud jako u jiných aplikací.',
        },
      },
      outsideEu: 'Tento návod je pro iPhony v EU. Jste mimo EU?',
      viewInstructions: 'Zobrazit návod mimo EU',
    },
    iosNonEu: {
      title: 'iOS (iPhone)',
      subtitle: 'Dva kroky. Než začnete, přečtěte si je.',
      steps: {
        testFlight: {
          title: 'Stáhněte si TestFlight z App Storu',
          text: 'TestFlight je oficiální aplikace od Applu, přes kterou si naši aplikaci bezpečně stáhnete a aktualizujete s nejnovějšími funkcemi.',
          action: 'Stáhnout TestFlight',
        },
        install: {
          title: 'Stáhněte si Vexl a začněte obchodovat bitcoin',
          text: 'Otevřete betu Vexlu v TestFlightu, nainstalujte ji a můžete obchodovat.',
          action: 'Stáhnout Vexl',
        },
      },
      inEu: 'Tento návod je pro iPhony mimo EU. Jste v EU?',
      viewEuInstructions: 'Zobrazit návod pro EU',
    },
    androidCard: {
      title: 'Android',
      subtitle: 'Nejrychlejší možnost',
      googlePlay: 'Stáhnout z Google Play',
    },
    alternatives: {
      title: 'Android bez Google Play',
      subtitle: 'Chcete jiný obchod s aplikacemi, nebo žádný?',
      storesTitle: 'Jiné obchody s aplikacemi',
      storesText: 'Vyberte si jednu z těchto možností.',
      otherWaysTitle: 'Další způsoby instalace',
      otherWaysText:
        'Můžete použít i APK z GitHubu. Doporučujeme ho instalovat přes Obtainium, abyste dostávali aktualizace.',
    },
  },
  faq: {title: 'Nejčastější dotazy'},
  community: {
    eyebrow: 'Komunita',
    title: 'Poznejte lidi, kteří za obchody stojí.',
    text: 'Meetupy, přednášky a hospodské kvízy, které pořádají lidé používající Vexl. Přijďte na jeden, nebo uspořádejte vlastní.',
    browseEvents: 'Prohlížet události',
    hostEvent: 'Uspořádat akci',
    upcomingTitle: 'Nadcházející události',
    noUpcoming:
      'Zatím nejsou ohlášené žádné další akce. Tady jsme byli doposud.',
    pastTitle: 'Proběhlé události',
    showOlder: 'Zobrazit starší události',
    host: {
      title: 'Uspořádejte vlastní akci',
      text: 'Meetupy jsou místo, kde zazáříme. Pomůžeme vám s propagací, školením, balíčky merche i řečníky.',
      materials: 'Stáhnout meetup kit',
      email: 'Napsat na marketing@vexl.it',
    },
    gallery: {
      title: 'Z našich akcí',
    },
    photos: {
      signCowboy:
        'Návštěvnice v kovbojském klobouku a člen týmu Vexl s cedulí Privacy matters',
      wave: 'Řečník mává z pódia Vexlu',
      conversation: 'Dva lidé zabraní do rozhovoru ve stanu Vexlu',
      crowd: 'Návštěvníci u stánku Vexlu pod jeho přístřeškem',
      signMerch: 'Dva lidé s cedulí Privacy matters před stánkem s merchem',
      flyers: 'Tým Vexlu rozdává letáky',
      wristband: 'Náramky Vexl a placka Privacy is not a crime',
      teamBacks: 'Tým Vexlu zezadu v tričkách Protecting privacy since 2022',
    },
  },
  blog: {
    title: 'Blog',
    text: 'Proč jsme vytvořili Vexl, jak funguje peer-to-peer obchodování s Bitcoinem a jak v praxi vypadá svět bez KYC.',
    back: '← Zpět na blog',
    publishedBy: 'Publikováno od {author}',
    readingTime: '{minutes} min. čtení',
    tableOfContents: 'Obsah',
    related: 'Další články',
    englishOnly: 'Tento článek je dostupný pouze v angličtině.',
  },
  terms: {
    title: 'Podmínky a ochrana osobních údajů',
    englishOnly: 'Tyto dokumenty jsou dostupné pouze v angličtině.',
    onThisPage: 'Na této stránce',
  },
  audit: {
    title: 'Bezpečnostní audit',
    text: 'V roce 2022 se bezpečnostní firma Citadelo pokusila prolomit první verzi Vexlu. Celá zpráva je veřejná.',
    facts: {
      by: {label: 'Testoval', value: 'Citadelo'},
      when: {label: 'Kdy', value: '1.–11. srpna 2022'},
      scope: {
        label: 'Co',
        value: 'Vexl 1.1.0 pro Android a iOS a kód jeho serverů',
      },
      method: {label: 'Metodika', value: 'OWASP Mobile Top 10'},
      findings: {
        label: 'Nálezy',
        value: '5 středních, 4 nízké, 7 poznámek. Žádný vysoký ani kritický.',
      },
    },
    note: 'Aplikace se od auditu hodně změnila. Její kód je veřejný, takže si aktuální verzi může ověřit kdokoli.',
    download: 'Stáhnout zprávu (PDF)',
    code: 'Přečíst kód',
  },
  notFound: {
    title: 'Stránka nenalezena',
    text: 'Stránka, kterou hledáte, neexistuje.',
    home: 'Přejít na hlavní stránku',
    photo: 'Návštěvnice drží ceduli I love Vexl a posílá vzdušný polibek',
  },
}
