import TosEn from './tos/en'
import PPEn from './privacyPolicy/en'

export default {
  'common': {
    'next': 'Ďalšie',
    'skip': 'Vynechať',
    'finish': 'Dokončiť',
    'confirm': 'Potvrdiť',
    'continue': 'Pokračovať',
    'save': 'Uložiť',
    'gotIt': 'Mám to',
    'search': 'Vyhľadávanie',
    'deselectAll': 'Zrušiť výber všetkých',
    'selectAll': 'Vybrať všetko',
    'cancel': 'Zrušiť',
    'unknownError': 'Neznáma chyba',
    'unexpectedServerResponse': 'Neočakávaná odpoveď servera',
    'networkErrors': {
      'errNetwork': 'Vyskytla sa chyba siete. Ste pripojení na internet?',
      'errCanceled': 'Požiadavka bola zrušená',
      'etimedout': 'Požiadavka sa vyčerpala',
      'econnaborted': 'Pripojenie sa prerušilo',
    },
    'submit': 'Odoslať',
    'cryptoError': 'Neočakávaná chyba kryptografie',
    'secondsShort': 's',
    'ok': 'ok',
    'request': 'Požiadavka',
    'back': 'Späť',
    'goBack': 'Vráť sa späť',
    'close': 'Zatvoriť',
    'done': 'Hotovo',
    'errorCreatingInbox': 'Chyba pri vytváraní používateľskej schránky.',
    'accept': 'Prijať',
    'decline': 'Odmietnuť',
    'youSure': 'Ste si istí?',
    'nope': 'Nie',
    'yesDelete': 'Áno, vymažte',
    'more': 'Viac na',
    'yes': 'Áno',
    'no': 'Nie',
    'myOffers': 'Moje ponuky',
  },
  'loginFlow': {
    'anonymityNotice': 'Nikto to neuvidí, kým to nepovolíte. Dokonca ani my.',
    'intro': {
      'title1': 'Anonymný import vašich kontaktov.',
      'title2': 'Pozrite si ich ponuky na nákup a predaj.',
      'title3':
        'Vyžiadajte si identitu tých, ktoré sa vám páčia, a obchodujte.',
    },
    'start': {
      'subtitle': 'Vitajte! Ste pripravení začať?',
      'touLabel': 'Súhlasím s',
      'termsOfUse': 'Podmienky používania',
    },
    'anonymizationNotice': {
      'title': 'Vaša identita bude anonymizovaná',
      'text':
        'Nikto neuvidí vaše skutočné meno a profilový obrázok, kým ho neodhalíte pre konkrétny obchod. Dokonca aj my. Najprv nastavíme vašu skutočnú identitu.',
    },
    'name': {
      'prompt': 'Ako vás volajú vaši priatelia?',
      'placeholder': 'Celé meno alebo prezývka',
      'nameValidationError':
        'Meno by malo mať aspoň 1 znak a maximálne 50 znakov',
    },
    'photo': {
      'title': 'Ahoj {{name}}! Ako vyzeráš?',
      'selectSource': 'Vyberte zdroj vášho obrázku',
      'camera': 'Fotoaparát',
      'gallery': 'Galéria',
      'permissionsNotGranted': 'Oprávnenia neboli udelené.',
      'nothingSelected': 'Nebol vybraný žiadny obrázok',
    },
    'anonymization': {
      'beforeTitle': 'Toto je vaša identita',
      'afterTitle': 'Anonymizovaná identita!',
      'action': 'Anonymizovať',
      'afterDescription':
        'Takto vás budú vidieť ostatní používatelia, kým neodhalíte svoju skutočnú identitu.',
    },
    'phoneNumber': {
      'title': 'Aké je vaše telefónne číslo?',
      'placeholder': 'Telefónne číslo',
      'text':
        'Aby sme vás mohli spojiť s komunitou Vexl, zadajte svoje telefónne číslo',
      'errors': {
        'invalidPhoneNumber':
          'Neplatné telefónne číslo. Skúste prosím zadať iné',
        'previousCodeNotExpired':
          'Overovanie tohto telefónneho čísla už prebieha. Počkajte, prosím, kým nevyprší jeho platnosť',
      },
    },
    'verificationCode': {
      'title': 'Práve sme vám poslali kód',
      'text': 'Na overenie ho zadajte nižšie',
      'inputPlaceholder': 'Váš overovací kód',
      'retryCountdown': 'Neobdržali ste kód? Pošlite ho znova',
      'retry': 'Neobdržali ste kód? Ťuknite na položku pre opätovné odoslanie',
      'errors': {
        'userAlreadyExists': 'Používateľ s týmto telefónnym číslom už existuje',
        'challengeCouldNotBeGenerated':
          'Výzvu nebolo možné vygenerovať. Skúste to znova neskôr',
        'verificationNotFound': 'Overovací kód je nesprávny.',
        'UserNotFound': 'Používateľ nebol nájdený. Skúste kód poslať znova.',
        'SignatureCouldNotBeGenerated':
          'Podpis sa nepodarilo vygenerovať. Skúste to znova neskôr',
        'PublicKeyOrHashInvalid':
          'Verejný kľúč alebo hash je neplatný. Skúste to znova neskôr',
      },
      'success': {
        'title': 'Telefón overený. [nwln] Nastavme váš profil.',
        'errorWhileParsingSessionForInternalState':
          'Chyba pri ukladaní používateľa',
      },
    },
    'importContacts': {
      'title': 'Nájdime teraz vašich priateľov!',
      'text':
        'Vexl používa vašu reálnu sociálnu sieť - vašich priateľov a ich priateľov. Čím viac kontaktov pridáte, tým viac ponúk uvidíte.',
      'anonymityNotice': 'Nikto nemôže vidieť vaše kontakty. Dokonca ani my.',
      'action': 'Importovanie kontaktov',
    },
  },
  'postLoginFlow': {
    'contactsExplanation': {
      'title': 'Nájdime teraz vašich priateľov!',
      'text':
        'Vexl využíva vašu reálnu sociálnu sieť - vašich priateľov a ich priateľov. Čím viac kontaktov pridáte, tým viac ponúk uvidíte.',
      'anonymizationCaption':
        'Nikto nemôže vidieť vaše kontakty. Dokonca ani my.',
    },
    'importContactsButton': 'Importovanie kontaktov',
    'contactsList': {
      'addContact': 'Manuálne pridanie kontaktu {{number}}',
      'inputPlaceholder': 'Vyhľadávanie alebo pridanie čísla',
      'nothingFound': {
        'title': 'Nenašiel sa žiadny kontakt.',
        'text':
          'Ak chcete pridať telefónne číslo priamo, zadajte ho do vyhľadávacieho riadku (s predvoľbou krajiny).',
      },
      'toAddCustomContact':
        'Ak chcete pridať telefónne číslo priamo, zadajte ho do vyhľadávacieho riadka (s predvoľbou krajiny)',
    },
    'allowNotifications': {
      'title': 'Povolenie oprávnení na oznamovanie',
      'text':
        'Povolenie oznámení vám umožní dozvedieť sa, keď ostatní prijmú vaše ponuky alebo keď prídu správy.',
      'action': 'Povoliť',
      'cancel': 'Vynechať',
      'errors': {
        'permissionDenied':
          'Povolenie nie je povolené. Môžete ich povoliť neskôr v nastaveniach systému.',
        'unknownError': 'Neznáma chyba pri vyžiadaní oprávnení',
        'notAvailableOnEmulator': 'Oznámenia nie sú v emulátore k dispozícii',
      },
    },
  },
  'settings': {
    'yourReach': 'Váš dosah: {{number}} vexlerov',
    'items': {
      'changeProfilePicture': 'Zmeniť profilový obrázok',
      'editName': 'Upraviť meno',
      'contactsImported': 'Importované kontakty',
      'xFriends': '{{number}} priateľov',
      'setPin': 'Nastaviť PIN',
      'faceId': 'Identifikácia tváre',
      'czechCrown': 'Česká koruna',
      'allowScreenshots': 'Povoliť snímky obrazovky',
      'allowScreenshotsDescription': 'Odmietnuť používateľom snímanie chatu',
      'termsAndPrivacy': 'Podmienky a ochrana osobných údajov',
      'faqs': 'Často kladené otázky',
      'reportIssue': 'Nahlásiť problém',
      'inAppLogs': 'Záznamy v aplikácii',
      'requestKnownData': 'Vyžiadanie známych údajov',
      'followUsOn': 'Sledujte nás na',
      'twitter': 'Twitter',
      'twitterUrl': 'https://twitter.com/vexl',
      'readMoreOn': 'Prečítajte si viac na',
      'medium': 'Médium',
      'mediumUrl': 'https://blog.vexl.it',
      'learnMoreOn': 'Ďalšie informácie na',
      'website': 'Vexl.it',
      'websiteUrl': 'https://vexl.it',
      'deleteAccount': 'Odstrániť účet',
    },
    'noLogoutExplanation':
      'Nemôžete nájsť odhlásenie? Nič také neexistuje. [nwln] Ale môžete odstrániť účet.',
    'support':
      'Ak sa vám Vexl páči, podporte jeho vylepšovanie zaslaním niekoľkých bitcoinov ako dar!',
    'version': 'Verzia aplikácie Vexl: Vxl: {{version}}',
    'logoutDialog': {
      'title': 'Vymazať účet?',
      'title2': 'Si si istý?',
      'description':
        'Naozaj chcete vymazať svoj účet? Túto akciu už nikdy nebudete môcť vrátiť späť.',
    },
  },
  'offer': {
    'title': 'Ponuka',
    'cashOnly': 'Iba v hotovosti',
    'onlineOnly': 'Len online',
    'upTo': 'Až do',
    'forSeller': 'Pre predávajúceho',
    'forBuyer': 'Pre kupujúceho',
    'bank': 'Banka',
    'revolut': 'Revolut',
    'isSelling': 'predáva',
    'isBuying': 'kupuje',
    'directFriend': 'Priamy priateľ',
    'friendOfFriend': 'Priateľ priateľa',
    'buy': 'Kúpiť',
    'sell': 'Predaj',
    'filterOffers': 'Filtrovanie ponúk',
    'numberOfCommon': '{{number}} spoločné',
    'offerNotFound': 'Ponuka nebola nájdená. Autor ju možno vymazal',
    'inputPlaceholder': 'Napr. poďme vymeniť môjho priateľa...',
    'sendRequest': 'Odoslať požiadavku',
    'report': {
      'areYouSureTitle': 'Nahlásiť ponuku?',
      'areYouSureText':
        'Naozaj chcete nahlásiť túto ponuku? Túto akciu už nikdy nebudete môcť vrátiť späť. Rozhodujte sa múdro.',
      'yes': 'Áno, nahláste',
    },
    'goToChat': 'Prejdite do chatu',
    'requestAlreadySent':
      'Bola odoslaná žiadosť o obchodovanie. Po jej prijatí vám dáme vedieť.',
    'listEmpty': 'Trhovisko zatiaľ prázdne',
    'emptyAction': 'Pridať novú ponuku',
  },
  'termsOfUse': {
    'termsOfUse': 'Podmienky používania',
    'privacyPolicy': 'Zásady ochrany osobných údajov',
    'dontHaveTime':
      'Nemáte čas to všetko čítať? Pozrite sa na často kladené otázky.',
    'termsOfUseText': TosEn,
    'privacyPolicyText': PPEn,
  },
  'faqs': {
    'faqs': 'Často kladené otázky',
    'whatIsVexl': 'Čo je to Vexl?',
    'vexlIsPlatform':
      'Vexl je platforma, na ktorej môžete obchodovať s Bitcoinmi v rámci svojej reálnej sociálnej siete - svojich priateľov a priateľov ich priateľov - a zároveň zostať v úplnej anonymite - ak si to želáte.',
    'whoCanSeeMyContacts': 'Kto môže vidieť moje kontakty?',
    'peopleWhomYouAllowToSee':
      'Ľudia, ktorým umožníte vidieť vašu identitu, môžu vidieť vašich spoločných priateľov. To je všetko.',
    'howCanIRemainAnonymous':
      'Ako môžem zostať v anonymite a pritom sa zúčastňovať na sieti Vexl?',
    'byDefaultYouParticipateInTheNetwork':
      'V predvolenom nastavení sa na sieti zúčastňujete pod svojím menom Vexl a avatarom Vexl, ktoré vám boli pridelené počas registrácie. Svoju identitu môžete odhaliť len na konkrétny obchod v našom bezpečnom, end-to-end šifrovanom chate.',
    'howCanIMakeSure':
      'Ako sa môžem uistiť, že osoba, s ktorou hovorím, je osoba, s ktorou chcem hovoriť?',
    'oneChallenge':
      'Jednou z výziev pri skutočne anonymných komunikačných systémoch, ako je Vexl, je, že niekedy je potrebné overiť totožnosť osoby, s ktorou hovoríte! V takýchto prípadoch je najlepšie použiť zabezpečený sekundárny komunikačný kanál, aby ste si s druhou osobou potvrdili, že ste obaja tí, za ktorých sa vydávate.',
    'howCanIEnsure':
      'Ako môžem zabezpečiť, aby moja komunikácia a obchody boli súkromné a zašifrované?',
    'vexlIsOpensource':
      'Vexl je otvorený zdrojový kód - ktokoľvek môže hľadať akékoľvek zadné vrátka alebo nekalé úmysly. Tiež si tu môžete pozrieť správu z nezávislého bezpečnostného auditu .',
    'howCanYouEnsure': 'Ako môžete zabezpečiť ochranu mojich údajov?',
    'vexlIsDesigned':
      'Vexl je navrhnutý tak, aby nikdy nezhromažďoval ani neukladal žiadne citlivé informácie. K správam Vexl a inému obsahu nemáme prístup my ani iné tretie strany, pretože sú vždy šifrované od konca do konca, súkromné a bezpečné. Naše podmienky používania služby a zásady ochrany osobných údajov sú k dispozícii nižšie.',
    'howDoIContactVexl': 'Ako môžem kontaktovať spoločnosť Vexl?',
    'youCanAlwaysReachOutToUs':
      'Vždy nás môžete kontaktovať prostredníctvom e-mailu: support@vexl.it. V prípade súkromnej komunikácie nám môžete poslať aj e2ee mail. Alebo sa s nami môžete stretnúť počas najbližšieho obchodu P2P! 😻',
  },
  'offerForm': {
    'myNewOffer': 'Moja nová ponuka',
    'iWantTo': 'Chcem',
    'sellBitcoin': 'Predať Bitcoin',
    'buyBitcoin': 'Kúpiť Bitcoin',
    'currency': 'Mena',
    'czk': 'CZK',
    'eur': 'EUR',
    'usd': 'USD',
    'amountOfTransaction': {
      'amountOfTransaction': 'Suma transakcie',
      'eurSymbol': '€',
      'dollarSymbol': '$',
      'czkSymbol': 'Kč',
      'pleaseSelectCurrencyFirst': 'Najskôr vyberte menu',
      'pleaseSelectLocationFirst': 'Najskôr vyberte miesto',
    },
    'premiumOrDiscount': {
      'premiumOrDiscount': 'Prémia alebo zľava',
      'youBuyForTheActualMarketPrice':
        'Kupujete za skutočnú trhovú cenu. Pohrajte si s posuvníkom, aby ste predávali rýchlejšie alebo zarobili viac.',
      'theOptimalPositionForMostPeople':
        'Optimálna pozícia pre väčšinu ľudí. Nakupujete o niečo rýchlejšie, ale za trochu vyššiu cenu',
      'youBuyReallyFast':
        'Nakupujete naozaj rýchlo, ale o toľko nad trhovú cenu',
      'youBuyPrettyCheap':
        'Kupujete pomerne lacno, ale môže trvať o niečo dlhšie, kým nájdete predávajúceho',
      'youBuyVeryCheaply':
        'Nakupujete veľmi lacno, ale môže chvíľu trvať, kým nájdete predávajúceho',
      'buyFaster': 'Nakupujete rýchlejšie',
      'buyCheaply': 'Nakupujete lacno',
      'youSellForTheActualMarketPrice':
        'Predávate za skutočnú trhovú cenu. Hrajte sa s posuvníkom, aby ste predávali rýchlejšie alebo zarobili viac.',
      'youEarnBitMore':
        'Zarábate o niečo viac, ale môže to trvať o niečo dlhšie.',
      'youWantToEarnFortune':
        'Chcete zarobiť veľa, ale môže trvať roky, kým nájdete predajcu.',
      'youSellSlightlyFaster':
        'Predávate o niečo rýchlejšie, ale trochu pod trhovou cenou',
      'youSellMuchFaster':
        'Predávate oveľa rýchlejšie, ale hlboko pod trhovou cenou',
      'youBuyBtcFor': 'Kupujete BTC za',
      'youSellBtcFor': 'Predávate BTC za',
      'marketPrice': 'trhovú cenu',
      'sellFaster': 'Predávate rýchlejšie',
      'earnMore': 'Vydelávate viac',
      'premiumOrDiscountExplained': 'Vysvetlenie prémie alebo zľavy',
      'influenceImpactOfYourSellOffer':
        'Ovplyvnite vplyv svojej ponuky. Predajte rýchlejšie pridaním zľavy alebo zarobte viac pridaním prémie k trhovej cene bitcoinu.',
      'influenceImpactOfYourBuyOffer':
        'Ovplyvnite vplyv svojej ponuky. Nakupujte lacnejšie pridaním zľavy alebo nakupujte rýchlejšie pridaním prémie k trhovej cene Bitcoinu.',
      'playWithItAndSee':
        'Pohrajte sa s tým a zistite, ako to ovplyvní záujem ostatných.',
      'plus': '+',
      'minus': '-',
    },
    'buyCheaperByUsingDiscount':
      'Kúpte lacnejšie použitím zľavy alebo kúpte rýchlejšie pridaním prémie k trhovej cene bitcoinu',
    'sellFasterWithDiscount':
      'Predajte rýchlejšie pomocou zľavy alebo zarobte viac pridaním prémie k trhovej cene bitcoinu.',
    'location': {
      'location': 'Umiestnenie',
      'meetingInPerson':
        'Osobné stretnutie je bezpečnejšie. Na čo si dať pozor online?',
      'checkItOut': 'Pozrite si to',
      'addCityOrDistrict': 'Pridať mesto alebo okres',
      'whatToWatchOutForOnline': 'Na čo si dať pozor online?',
      'moneySentByRandomPerson':
        'Peniaze poslané náhodnou osobou môžu mať kriminálny pôvod a dajú sa vystopovať.',
      'neverSendCrypto': 'Nikdy neposielajte kryptomenu pred prijatím platby.',
      'alwaysVerifyTheName':
        'Vždy si overte meno majiteľa účtu, od ktorého ste platbu prijali, s deklarovanou identitou protistrany.',
      'forwardTheAddress':
        'Adresu preposielajte bezpečným spôsobom a nezabudnite ju overiť iným bezpečným kanálom.',
    },
    'inPerson': 'Osobne',
    'online': 'Online',
    'paymentMethod': {
      'paymentMethod': 'Spôsob platby',
      'cash': 'Hotovosť',
      'bank': 'Banka',
      'revolut': 'Revolut',
    },
    'network': {
      'network': 'Sieť',
      'lightning': 'Lightning',
      'theBestOption':
        'Najlepšia možnosť pre skutočne malé sumy. Zvyčajne oveľa rýchlejšie.',
      'onChain': 'V reťazci',
      'theBestFor': 'Najlepšia pre pomerne veľké sumy. Niekedy to trvá dlhšie.',
    },
    'description': {
      'description': 'Popis',
      'writeWhyPeopleShouldTake':
        'Napíšte, prečo by ľudia mali prijať vašu ponuku.',
    },
    'friendLevel': {
      'friendLevel': 'Úroveň priateľov',
      'firstDegree': '1. stupeň',
      'secondDegree': '2. stupeň',
      'noVexlers': 'Žiadne veksláci',
      'reachVexlers': 'Dosiahnuť {{count}} vexlákov',
    },
    'publishOffer': 'Zverejniť ponuku',
    'errorCreatingOffer': 'Chyba pri vytváraní ponuky',
    'errorSearchingForAvailableLocation':
      'Chyba pri vyhľadávaní dostupných miest',
    'offerEncryption': {
      'encryptingYourOffer': 'Šifrovanie ponuky ...',
      'dontShutDownTheApp':
        'Počas šifrovania nevypínajte aplikáciu. Môže to trvať niekoľko minút.',
      'forVexlers': 'pre {{count}} vekslákov',
      'doneOfferPoster': 'Hotovo! Ponuka odoslaná.',
      'yourFriendsAndFriendsOfFriends':
        'Vašu ponuku teraz môžu vidieť vaši priatelia a priatelia ich priateľov.',
      'anonymouslyDeliveredToVexlers':
        'Anonymne doručené pre {{count}} vexlerov',
    },
    'noVexlersFoundForYourOffer':
      'Pre vašu ponuku neboli nájdení žiadni vexleri',
    'errorLocationNotFilled': 'Prosím, vyplňte umiestnenie ponuky',
    'errorDescriptionNotFilled': 'Prosím, vyplňte popis ponuky',
  },
  'notifications': {
    'permissionsNotGranted': {
      'title': 'Oprávnenia na upozornenia neboli udelené',
      'message': 'Môžete ich povoliť v nastaveniach',
      'openSettings': 'Otvorte nastavenia',
    },
  },
  'myOffers': {
    'addNewOffer': 'Pridať novú ponuku',
    'activeOffers': '{{count}} aktívne ponuky',
    'filterOffers': 'Filtrovanie ponúk',
    'errorWhileFetchingYourOffers': 'Chyba pri načítavaní vašich ponúk',
    'editOffer': 'Upraviť ponuku',
    'myOffer': 'Moja ponuka',
    'offerAdded': 'Pridané {{date}}',
    'sortedByNewest': 'Zoradené podľa najnovších',
    'sortedByOldest': 'Zoradené podľa najstarších',
  },
  'editOffer': {
    'editOffer': 'Upraviť ponuku',
    'active': 'Aktívne',
    'inactive': 'Neaktívne',
    'saveChanges': 'Uložiť zmeny',
    'offerUnableToChangeOfferActivation':
      'Nie je možné zmeniť aktiváciu ponuky',
    'editingYourOffer': 'Úprava vašej ponuky ...',
    'pleaseWait': 'Počkajte prosím',
    'offerEditSuccess': 'Úspešná úprava ponuky',
    'youCanCheckYourOffer':
      'Svoju ponuku si môžete skontrolovať v časti ponuky',
    'errorEditingOffer': 'Chyba pri úprave ponuky',
    'errorOfferNotFound': 'Ponuka nebola nájdená!',
    'deletingYourOffer': 'Odstránenie vašej ponuky ...',
    'offerDeleted': 'Ponuka odstránená',
    'errorDeletingOffer': 'Chyba pri odstraňovaní ponuky',
  },
  'filterOffers': {
    'filterResults': 'Filtrovanie výsledkov',
    'sorting': 'Triedenie',
    'lowestFeeFirst': 'Najskôr najnižší poplatok',
    'highestFee': 'Najvyšší poplatok',
    'newestOffer': 'Najnovšia ponuka',
    'oldestOffer': 'Najstaršia ponuka',
    'lowestAmount': 'Najnižšia suma',
    'highestAmount': 'Najvyššia suma',
    'selectSortingMethod': 'Vyberte spôsob triedenia',
  },
  'messages': {
    'yourOffer': 'Vaša ponuka',
    'theirOffer': 'Ich ponuka',
    'listTitle': 'Chaty',
    'isBuying': 'kupuje',
    'isSelling': 'predáva',
    'thisWillBeYourFirstInteraction':
      'Toto bude vaša prvá interakcia s touto ponukou.',
    'wellLetYouKnowOnceUserAccepts':
      'Požiadavka odoslaná. Dáme vám vedieť, keď druhá strana odpovie.',
    'messagePreviews': {
      'incoming': {
        'MESSAGE': '{{them}}: {{message}}',
        'REQUEST_REVEAL': '{{them}} požiadal o odhalenie identity',
        'APPROVE_REVEAL': 'Identita odhalená',
        'DISAPPROVE_REVEAL': 'Odmietnuté odhalenie identity',
        'REQUEST_MESSAGING': 'Reagoval na vašu ponuku',
        'APPROVE_MESSAGING': 'Schválené zasielanie správ',
        'DISAPPROVE_MESSAGING': 'Odmietol žiadosť o zasielanie správ',
        'DELETE_CHAT': '{{them}} opustil chat',
        'BLOCK_CHAT': '{{them}} Zablokoval vás',
        'OFFER_DELETED': '{{them}} vymazal svoju ponuku',
        'INBOX_DELETED': '{{them}} vymazal svoju doručenú poštu',
      },
      'outgoing': {
        'MESSAGE': 'Ja: {{message}}',
        'REQUEST_REVEAL': 'Požiadali ste o odhalenie identity',
        'APPROVE_REVEAL': 'Identita odhalená',
        'DISAPPROVE_REVEAL': 'Odhalenie totožnosti odmietnuté',
        'REQUEST_MESSAGING': 'Žiadosť odoslaná',
        'APPROVE_MESSAGING': 'Schválili ste zasielanie správ',
        'DISAPPROVE_MESSAGING': 'Odmietli ste žiadosť o zasielanie správ',
        'DELETE_CHAT': 'Opustili ste chat',
        'BLOCK_CHAT': 'Používateľ bol zablokovaný',
        'OFFER_DELETED': 'Vymazali ste svoju ponuku',
        'INBOX_DELETED': 'Vymazali ste túto schránku',
      },
    },
    'deleteChat': 'Odstrániť chat',
    'askToReveal': 'Požiadajte o odhalenie totožnosti',
    'blockUser': 'Zablokovať používateľa',
    'sending': 'odosielanie...',
    'unknownErrorWhileSending': 'Neznáma chyba pri odosielaní správy',
    'tapToResent': 'Ťuknite na položku pre opätovné odoslanie.',
    'deniedByMe': 'Odmietli ste žiadosť o odoslanie správy s {{name}}.',
    'deniedByThem': '{{name}} zamietol vašu žiadosť o zasielanie správ.',
    'requestMessageWasDeleted': 'Správa so žiadosťou bola vymazaná',
    'typeSomething': 'Zadajte niečo ...',
    'offerDeleted': 'Ponuka odstránená',
    'leaveToo': 'Odísť tiež?',
    'leaveChat': 'Opustiť chat?',
    'deleteChatQuestion': 'Vymazať chat?',
    'blockForewerQuestion': 'Zablokovať navždy?',
    'yesBlock': 'Áno, zablokovať',
    'deleteChatExplanation1':
      'Skončili ste s obchodovaním? Ukončenie chatu znamená, že vaša konverzácia bude natrvalo vymazaná.',
    'deleteChatExplanation2':
      'Toto je definitívny krok, prosím, potvrďte túto akciu ešte raz, aby bola skutočná.',
    'blockChatExplanation1':
      'Naozaj chcete tohto používateľa zablokovať? Túto akciu už nikdy nebudete môcť vrátiť späť. Rozhodujte sa múdro.',
    'blockChatExplanation2':
      'Naozaj chcete zablokovať tohto používateľa? Túto akciu už nikdy nebudete môcť vrátiť späť. Rozhodnite sa múdro.',
    'chatEmpty': 'Zatiaľ žiadne chaty',
    'chatEmptyExplanation': 'Začnite konverzáciu vyžiadaním ponuky',
    'seeOffers': 'Pozrite si ponuky',
    'identityRevealRequestModal': {
      'title': 'Poslať žiadosť o odhalenie identity?',
      'text': 'Odoslaním žiadosti súhlasíte aj s odhalením svojej identity.',
      'send': 'Odoslať žiadosť',
    },
    'identityRevealRespondModal': {
      'title': 'Chcete odhaliť identitu?',
      'text': 'Ak odhalíte svoju identitu, uvidíte aj identitu protistrany.',
    },
    'identityAlreadyRequested':
      'V konverzácii už bola odoslaná žiadosť o zistenie totožnosti',
    'identityRevealRequest': 'Žiadosť o odhalenie identity',
    'tapToReveal': 'Ťuknite na položku pre odhalenie alebo odmietnutie',
    'letsRevealIdentities': 'Umožňuje odhaliť identitu',
    'reveal': 'Odhaliť',
    'themDeclined': '{{name}} odmietol',
    'youDeclined': 'Odmietli ste',
  },
  'progressBar': {
    'ENCRYPTING_PRIVATE_PAYLOADS': '{{percentDone}}% hotovo',
    'FETCHING_CONTACTS': 'Získanie vašich kontaktov zo servera',
    'CONSTRUCTING_PRIVATE_PAYLOADS': 'Konštruovanie súkromného nákladu',
    'CONSTRUCTING_PUBLIC_PAYLOAD':
      'Konštruovanie a šifrovanie verejného užitočného zaťaženia',
    'SENDING_OFFER_TO_NETWORK': 'Odoslanie ponuky',
    'DONE': 'Hotovo',
  },
  'commonFriends': {
    'commonFriends': 'Spoloční priatelia',
    'commonFriendsCount': '{{commonFriendsCount}} spoločných priateľov',
  },
}
