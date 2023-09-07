import type en from "./other.en"

const otherSk: typeof en =
  /* JSON starts */
  {
    "common": {
      "next": "Ďalej",
      "skip": "Preskočiť",
      "finish": "Dokončiť",
      "confirm": "Potvrdiť",
      "continue": "Pokračovať",
      "save": "Uložiť",
      "gotIt": "Mám to",
      "search": "Vyhľadávanie",
      "deselectAll": "Zrušiť výber všetkých",
      "selectAll": "Vybrať všetko",
      "cancel": "Zrušiť",
      "unknownError": "Neznáma chyba",
      "unexpectedServerResponse": "Neočakávaná odpoveď servera",
      "networkErrors": {
        "errNetwork": "Vyskytla sa chyba siete. Ste pripojení na internet?",
        "errCanceled": "Požiadavka bola zrušená",
        "etimedout": "Požiadavka sa vyčerpala",
        "econnaborted": "Pripojenie sa prerušilo"
      },
      "submit": "Odoslať",
      "cryptoError": "Neočakávaná chyba kryptografie",
      "secondsShort": "s",
      "ok": "ok",
      "request": "Požiadavka",
      "back": "Späť",
      "goBack": "Vráť sa späť",
      "close": "Zatvoriť",
      "done": "Hotovo",
      "errorCreatingInbox": "Chyba pri vytváraní používateľskej schránky.",
      "accept": "Prijať",
      "decline": "Odmietnuť",
      "youSure": "Určite?",
      "nope": "Nie",
      "yesDelete": "Áno, vymazať",
      "more": "Viac na",
      "yes": "Áno",
      "no": "Nie",
      "myOffers": "Moje ponuky",
      "errorOpeningLink": {
        "message": "Chyba pri otváraní linku.",
        "text": "Skopírovať do schránky?",
        "copy": "Skopírovať a zavrieť"
      },
      "nice": "Dobre",
      "success": "Podarilo sa",
      "requested": "Požiadané",
      "now": "Teraz",
      "declined": "Zamietnuté",
      "reset": "Reset",
      "you": "Ty",
      "allow": "Povoliť",
      "currency": "Mena",
      "whatDoesThisMean": "Čo znamená '{{term}}'?",
      "learnMore": "Dozvedieť sa viac",
      "unableToShareImage": "Unable to share the image",
      "requestAgain": "Request again",
      "seeDetail": "See details",
      "notNow": "Not now",
      "niceWithExclamationMark": "Nice!",
      "nothingFound": "Nič sme nenašli.",
      "sendRequest": "Odoslať žiadosť",
      "change": "Zmeniť",
      "errorWhileReadingQrCode": "Error while reading QR code",
      "copyErrorToClipboard": "Skopírovať chybu do schránky",
      "me": "Me"
    },
    "loginFlow": {
      "anonymityNotice": "Kým to nepovolíš, nikto to neuvidí. Dokonca ani my.",
      "intro": {
        "title1": "Anonymne se spoj so svojimi kontaktami.",
        "title2": "Pozri sa na ich ponuky.",
        "title3": "Začnite chatovat, odhaľte svoje identity a obchodujte."
      },
      "start": {
        "subtitle": "Vitaj! Chceš začať vexlovať?",
        "touLabel": "Súhlasím s",
        "termsOfUse": "podmienkami"
      },
      "anonymizationNotice": {
        "title": "Tvoja identita bude anonymizovaná.",
        "text":
          "Nikto neuvidí tvoje skutočné meno a profilový obrázok, kým ho neodhalíš pre konkrétny obchod. Dokonca aj my. Najprv nastavíme tvoju skutočnú identitu."
      },
      "name": {
        "prompt": "Ako ti vravia kamaráti?",
        "placeholder": "Meno alebo prezývka",
        "nameValidationError":
          "Meno by malo mať aspoň 1 znak a maximálne 25 znakov"
      },
      "photo": {
        "title": "Ahoj {{name}}! Vyber si svoju profilovú fotku.",
        "selectSource": "Vyber si, odkiaľ chceš obrázok nahrať",
        "camera": "Fotoaparát",
        "gallery": "Galéria",
        "permissionsNotGranted": "Oprávnenia neboli udelené.",
        "nothingSelected": "Nebol vybraný žiadny obrázok"
      },
      "anonymization": {
        "beforeTitle": "Toto je tvoj súkromný profil",
        "afterTitle": "Identita anonymizovaná!",
        "action": "Anonymizovať",
        "afterDescription":
          "Takto ťa uvidia ostatní užívatelia, než im odhalíš svoj súkromný profil."
      },
      "phoneNumber": {
        "title": "Aké je tvoje telefónne číslo?",
        "placeholder": "Telefónne číslo",
        "text":
          "Aby sme ťa mohli spojiť s komunitou Vexl, musíš zadať svoje telefónne číslo.",
        "errors": {
          "invalidPhoneNumber":
            "Neplatné telefónne číslo. Skús to prosím znovu.",
          "previousCodeNotExpired":
            "Overovanie tohto telefónneho čísla už prebieha. Počkaj, prosím, kým nevyprší jeho platnosť."
        }
      },
      "verificationCode": {
        "title": "Práve sme ti poslali verifikačný kód",
        "text": "Na overenie ho zadaj nižšie",
        "inputPlaceholder": "Overovací kód",
        "retryCountdown": "Nedostal si kód? Skús ho poslať znovu.",
        "retry": "Nedostal si kód? Skús ho poslať znovu.",
        "errors": {
          "userAlreadyExists":
            "Používateľ s týmto telefónnym číslom už existuje",
          "challengeCouldNotBeGenerated":
            "Výzvu nebolo možné vygenerovať. Skúste to znova neskôr",
          "verificationNotFound": "Overovací kód je nesprávny.",
          "UserNotFound": "Používateľ nebol nájdený. Skús kód poslať znova.",
          "SignatureCouldNotBeGenerated":
            "Podpis sa nepodarilo vygenerovať. Skús to znova neskôr.",
          "PublicKeyOrHashInvalid":
            "Verejný kľúč alebo hash je neplatný. Skús to znova neskôr"
        },
        "success": {
          "title": "Tvoje číslo bolo overené. [nwln] Čas nastaviť tvoj profil.",
          "errorWhileParsingSessionForInternalState":
            "Chyba pri ukladaní používateľa"
        }
      },
      "importContacts": {
        "title": "Poďme nájsť tvojich priateľov!",
        "text":
          "Vexl používa tvoju reálnu sociálnu sieť - tvojich priateľov a ich priateľov. Čím viac kontaktov pridáš, tým viac ponúk uvidíš.",
        "anonymityNotice":
          "Tvoje kontakty neuvidí nikto ďalší. Dokonca ani my.",
        "action": "Import kontaktov"
      }
    },
    "postLoginFlow": {
      "contactsExplanation": {
        "title": "Nájdime teraz tvojich priateľov!",
        "text":
          "Vexl používa tvoju reálnu sociálnu sieť - tvojich priateľov a ich priateľov. Čím viac kontaktov pridáš, tým viac ponúk uvidíš.",
        "anonymizationCaption":
          "Tvoje kontakty neuvidí nikto ďalší. Dokonca ani my."
      },
      "importContactsButton": "Import kontaktov",
      "contactsList": {
        "addContactManually": "Manuálne pridanie kontaktu {{number}}",
        "inputPlaceholder": "Vyhľadávanie alebo pridanie čísla",
        "nothingFound": {
          "title": "Nenašiel sa žiadny kontakt.",
          "text":
            "Ak chceš pridať telefónne číslo napriamo, zadaj ho do vyhľadávacieho riadku (s predvoľbou krajiny)."
        },
        "toAddCustomContact":
          "Ak chceš pridať telefónne číslo napriamo, zadaj ho do vyhľadávacieho riadku (s predvoľbou krajiny).",
        "addContact": "Pridať kontakt",
        "addThisPhoneNumber":
          "Chceš pridať toto číslo medzi tvoje Vexl kontakty?",
        "addContactName": "Pridať meno",
        "contactAdded": "Kontakt bol pridaný.",
        "youHaveAddedContact":
          "{{contactName}} bol pridaný k tvojim Vexl kontaktom.",
        "submitted": "Submitted",
        "new": "New",
        "nonSubmitted": "Non-submitted"
      },
      "allowNotifications": {
        "title": "Povoliť notifikácie",
        "text":
          "Vďaka notifikáciam sa dozvieš, keď niekto prijme tvoju ponuku, alebo ti príde nová správa.",
        "action": "Povoliť",
        "cancel": "Preskočiť",
        "errors": {
          "permissionDenied":
            "Notifikácie neboli povolené. Môžeš ich povoliť pozdejšie v nastavení systému.",
          "unknownError": "Neznáma chyba pri vyžiadaní oprávnení",
          "notAvailableOnEmulator": "Oznámenia nie sú v emulátore k dispozícii"
        },
        "vexlCantBeUsedWithoutNotifications":
          "Aplikáciu Vexl nie je možné používať bez notifikácií."
      }
    },
    "settings": {
      "yourReach": "Tvoj dosah: {{number}} vexlákov",
      "items": {
        "changeProfilePicture": "Zmeniť profilový obrázok",
        "editName": "Upraviť meno",
        "contactsImported": "Správa kontaktov",
        "xFriends": "{{number}} priateľov",
        "setPin": "Nastaviť PIN",
        "faceId": "Face ID",
        "allowScreenshots": "Povoliť screenshoty",
        "allowScreenshotsDescription": "Zákazať užívateľom screenshoty chatu",
        "termsAndPrivacy": "Podmienky a ochrana osobných údajov",
        "faqs": "Podmienky použitia a Ochrana súkromia",
        "reportIssue": "Kontaktovať podporu",
        "inAppLogs": "Logy aplikácie",
        "requestKnownData": "Vyžiadanie údajov",
        "followUsOn": "Sleduj nás na",
        "twitter": "Twitter",
        "twitterUrl": "https://twitter.com/vexl",
        "readMoreOn": "Prečítaj si viac na",
        "medium": "Medium",
        "mediumUrl": "https://blog.vexl.it",
        "learnMoreOn": "Ďalšie informácie na",
        "website": "Vexl.it",
        "websiteUrl": "https://vexl.it",
        "deleteAccount": "Odstrániť účet",
        "supportEmail": "support@vexl.it"
      },
      "noLogoutExplanation":
        "Chceš sa odhlásiť? Taká možnosť vo Vexli nie je - môžeš ale vymazať účet.",
      "support":
        "Ak se ti Vexl páči, budeme radi za tvoj príspevok v tvrdej mene.",
      "version": "Verzia aplikácie Vexl: Vxl: {{version}}",
      "logoutDialog": {
        "title": "Vymazať účet?",
        "title2": "Si si istý?",
        "description":
          "Naozaj chcete vymazať svoj účet? Túto akciu už nikdy nebudete môcť vrátiť späť."
      }
    },
    "offer": {
      "title": "Ponuka",
      "cashOnly": "Iba v hotovosti",
      "onlineOnly": "Len online",
      "upTo": "Až do",
      "forSeller": "Pre predávajúceho",
      "forBuyer": "Pre kupujúceho",
      "bank": "Banka",
      "revolut": "Online platby",
      "isSelling": "predáva",
      "isBuying": "kupuje",
      "directFriend": "Priamy priateľ",
      "friendOfFriend": "Priateľ priateľa",
      "buy": "Kúpiť",
      "sell": "Predať",
      "filterOffers": "Filtrovanie ponúk",
      "numberOfCommon": "{{number}} spoločné",
      "offerNotFound": "Ponuka nebola nájdená. Autor ju možno vymazal",
      "inputPlaceholder": "Tu napíš správu...",
      "sendRequest": "Odoslať žiadosť",
      "report": {
        "areYouSureTitle": "Nahlásiť ponuku?",
        "areYouSureText":
          "Skutočne chcete nahlásiť túto ponuku? Táto akcia je nevratná.",
        "yes": "Áno, nahlásiť",
        "thankYou": "Ďakujeme!",
        "inappropriateContentWasReported":
          "Nevhodný obsah bol anonymne nahlásený.",
        "reportLimitReached":
          "Pre dnešok bol dosiahnutý maximálny počet hlásení. Skús to znova za 24 hodín."
      },
      "goToChat": "Prejdite do chatu",
      "requestStatus": {
        "requested":
          "Bola odoslaná žiadosť o obchodovanie. Po jej prijatí vám dáme vedieť.",
        "accepted": "Your request was accepted.",
        "denied": "Your request was declined.",
        "initial": "This will be your first interaction with this offer.",
        "cancelled":
          "You previously cancelled the trade request for this offer.",
        "deleted":
          "You have already interacted with this offer, but you deleted the chat.",
        "otherSideLeft":
          "You have already interacted with this offer, but the counterparty left the chat.",
        "leaved": "You have already interacted with this offer before."
      },
      "listEmpty": "Tvoj marketplace sa práve zahrieva. Vráť sa o pár minút!",
      "emptyAction": "Pridať novú ponuku",
      "createOfferAndReachVexlers":
        "Tvoj dosah je {{reachNumber}} vexlákov.\nNaimportuj viac kontaktov, aby si videl viac ponúk",
      "filterActive": "Filter aktívny",
      "totalOffers": "Celkovo: {{totalCount}} ponúk",
      "notImportedAnyContacts":
        "Nemáš importované žiadne kontakty. Import kontaktov ti umožní zobraziť ponuky z tvojej siete.",
      "socialNetworkTooSmall":
        "Z dôvodu importovania malého množstva kontaktov je možné, že nebudeš vidieť žiadne ponuky.",
      "noOffersToMatchFilter":
        "Nemáš žiadne ponuky, ktoré zodpovedajú zadaným filtrovacím kritériám.",
      "offersAreLoadingAndShouldBeReady":
        "Ponuky sa načítajú a mali by byť dostupné za {{minutes}} minút.",
      "marketplaceEmpty": "Marketplace je zatiaľ prázdny",
      "resetFilter": "Resetovať filter",
      "totalFilteredOffers":
        "Filtrovaných: {{count}} ponúk (z celkového počtu {{totalCount}})",
      "offerFromDirectFriend": "Ponuka od priameho priateľa",
      "offerFromFriendOfFriend":
        "Ponuka od priateľa jedného z tvojich kontaktov",
      "youSeeThisOfferBecause":
        "Táto ponuka je pre teba viditeľná pretože protistrana má v zozname tvoje telefónne číslo.",
      "beCautiousWeCannotVerify":
        "Buď opatrný, nevieme garantovať, že sa skutočne poznáte.",
      "dontForgetToVerifyTheIdentity":
        "Nezabudni si overiť identitu protistrany prostredníctvom spoločného priateľa.",
      "noDirectConnection":
        "S týmto človekom sa pravdepodobne osobne nepoznáte.",
      "rerequestTomorrow": "You can send another request tomorrow.",
      "rerequestDays": "You can send another request in {{days}} days.",
      "rerequest": "Poslať požiadavku znova",
      "cancelRequest": "Zruš požiadavku",
      "requestWasCancelledByOtherSide":
        "Požiadavku nemožno prijať, pretože jej druhá strana zrušila.",
      "requestNotFound":
        "Požiadavku nemožno prijať, pretože druhá strana zrušila svoj účet.",
      "otherSideAccountDeleted": "Protistrana zmazala účet"
    },
    "termsOfUse": {
      "termsOfUse": "Podmienky používania",
      "privacyPolicy": "Zásady ochrany osobných údajov",
      "dontHaveTime":
        "Nemáte čas to všetko čítať? Pozrite sa na často kladené otázky."
    },
    "faqs": {
      "faqs": "Často kladené otázky",
      "whatIsVexl": "Čo je to Vexl?",
      "vexlIsPlatform":
        "Vexl je platforma kde môžeš dohadovať zmenu bitcoinu v rámci svojej reálnej sociálnej siete - so svojimi priateľmi a priateľmi ich priateľov - a pritom zostať úplne anonymný, pokiaľ si to praješ.",
      "whoCanSeeMyContacts": "Kto môže vidieť moje kontakty?",
      "peopleWhomYouAllowToSee":
        "Ľudia, ktorým dovolíš vidieť svoju identitu, môžu vidieť vaších spoločných priateľov. To je všetko.",
      "howCanIRemainAnonymous":
        "Ako môžem zostať anonymný a pritom byť súčasťou Vexlu?",
      "byDefaultYouParticipateInTheNetwork":
        "Ostatní účastníci siete ťa uvidia pod tvojim Vexl menom a avatarom, ktoré ti boli pridelené pri registrácii. Svoju identitu môžeš odhaliť iba pre konkrétny obchod v našom zabezpečenom, end-to-end šifrovanom chate.",
      "howCanIMakeSure":
        "Ako sa môžem uistiť, že osoba, s ktorou sa bavím, je ta, s ktorou sa chcem baviť?",
      "oneChallenge":
        "Jedným z úskalí skutočne anonymných komunikačných systémov, ako je Vexl, je to, že si niekedy musíte overiť totožnosť osoby, s ktorou komunikujete! V takýchto prípadoch je najlepšie použiť zabezpečený sekundárny komunikačný kanál, aby si si s druhou osobou potvrdil, že ste obaja tí, za ktorých sa vydávate.",
      "howCanIEnsure":
        "Ako sa môžem uistiť, že moja komunikácia a obchody sú súkromné a šifrované?",
      "vexlIsOpensource":
        "Vexl má otvorený zdrojový kod - ktokoľvek v ňom môže hľadať zadné vrátka alebo škodlivé úmysly. Môžeš sa tiež pozrieť na správu z nezávislého bezpečnostného auditu.",
      "howCanYouEnsure": "Ako môžete zaistiť ochranu mojich údajov?",
      "vexlIsDesigned":
        "Vexl je navrhnutý tak, aby nikto nezhromažďoval ani neukládal žiadne citlivé informácie. K správam a ďalšiemu obsahu nemáme my ani iné tretie strany prístup, pretože sú vždy šifrované end-to-end. Naše podmienky poskytovania služieb a zásady ochrany osobných údajov sú k dispozícii nižšie.",
      "howDoIContactVexl": "Ako môžem kontaktovať Vexl ?",
      "youCanAlwaysReachOutToUs":
        "Vždy sa na nás môžeš obrátiť prostredníctvom e-mailu: support@vexl.it. Alebo sa s nami môžeš stretnúť počas svojho budúceho P2P obchodu! 😻"
    },
    "offerForm": {
      "myNewOffer": "Nová ponuka",
      "iWantTo": "Chcem",
      "sellBitcoin": "Predať Bitcoin",
      "buyBitcoin": "Kúpiť Bitcoin",
      "amountOfTransaction": {
        "amountOfTransaction": "Čiastka",
        "pleaseSelectCurrencyFirst": "Najskôr si vyber menu",
        "pleaseSelectLocationFirst": "Najskôr si vyber miesto"
      },
      "premiumOrDiscount": {
        "premiumOrDiscount": "Premium alebo zľava",
        "youBuyForTheActualMarketPrice":
          "Kupuješ za skutočnú trhovú cenu. Pohni s posuvníkom, aby si nakúpil rýchlejšie alebo lacnejšie.",
        "theOptimalPositionForMostPeople":
          "Optimálna pozícia pre väčšinu ľudí. Nakupuješ o niečo rýchlejšie, ale za trochu vyššiu cenu.",
        "youBuyReallyFast":
          "Nakupuješ naozaj rýchlo, ale vysoko nad trhovou cenou.",
        "youBuyPrettyCheap":
          "Kupuješ pomerne lacno, ale môže trvať o niečo dlhšie, kým nájdeš predávajúceho.",
        "youBuyVeryCheaply":
          "Nakupuješ veľmi lacno, ale môže chvíľu trvať, kým nájdeš predávajúceho.",
        "buyFaster": "Nakupuješ rýchlejšie",
        "buyCheaply": "Nakupuješ lacno",
        "youSellForTheActualMarketPrice":
          "Predávaš za skutočnú trhovú cenu. Pohni s posuvníkom, aby si predával rýchlejšie alebo zarobil viac.",
        "youEarnBitMore":
          "Zarábaš o niečo viac, ale môže to trvať o niečo dlhšie.",
        "youWantToEarnFortune":
          "Chceš zarobiť veľa, ale môže trvať roky, kým nájdeš kupcu.",
        "youSellSlightlyFaster":
          "Predávaš o niečo rýchlejšie, ale trochu pod trhovou cenou",
        "youSellMuchFaster":
          "Predávaš oveľa rýchlejšie, ale hlboko pod trhovou cenou",
        "youBuyBtcFor": "Kupujete BTC za",
        "youSellBtcFor": "Predávate BTC za",
        "marketPrice": "trhovú cenu",
        "sellFaster": "Predávaš rýchlejšie",
        "earnMore": "Zarobíš viac",
        "premiumOrDiscountExplained": "Vysvetlenie prémia a zľavy",
        "influenceImpactOfYourSellOffer":
          "Ovplyvni dosah svojej ponuky. Predaj rýchlejšie pridaním zľavy alebo zarob viac pridaním prémia k trhovej cene bitcoinu.",
        "influenceImpactOfYourBuyOffer":
          "Ovplyvni dosah svojej ponuky. Nakupuj rýchlejšie pridaním zľavy alebo nakupuj viac pridaním prémia k trhovej cene bitcoinu.",
        "playWithItAndSee":
          "Pohni posuvníkom a zisti, ako to ovplyvní záujem ostatných.",
        "plus": "+",
        "minus": "-",
        "youEarnSoMuchMore": "Zarobíš omnoho viac, ale môže to chvíľu trvať."
      },
      "buyCheaperByUsingDiscount":
        "Nakúp lacnejšie použitím zľavy alebo nakúp rýchlejšie pridaním prémia k trhovej cene bitcoinu",
      "sellFasterWithDiscount":
        "Predávaj rýchlejšie pomocou zľavy alebo zarob viac pridaním prémia k trhovej cene bitcoinu.",
      "location": {
        "location": "Lokalita",
        "meetingInPerson":
          "Osobné stretnutie je bezpečnejšie. Na čo si dať pozor pri online obchodoch? ",
        "checkItOut": "Pozri sa na to",
        "addCityOrDistrict": "Pridať mesto alebo okres",
        "whatToWatchOutForOnline": "Na čo si dať pozor online?",
        "moneySentByRandomPerson":
          "Peniaze poslané náhodnou osobou môžu mať kriminálny pôvod a dajú sa vystopovať.",
        "neverSendCrypto": "Nikdy neposielajte bitcoin pred prijatím platby.",
        "alwaysVerifyTheName":
          "Vždy si over meno majiteľa účtu, od ktorého si platbu prijal, či sedí s deklarovanou identitou protistrany.",
        "forwardTheAddress":
          "Adresu preposielaj bezpečným spôsobom a nezabudnite ju overiť iným bezpečným kanálom."
      },
      "inPerson": "Osobne",
      "online": "Online",
      "paymentMethod": {
        "paymentMethod": "Spôsob platby",
        "cash": "Hotovosť",
        "bank": "Banka",
        "revolut": "Online platby"
      },
      "network": {
        "network": "Sieť",
        "lightning": "Lightning",
        "theBestOption":
          "Najlepšia možnosť pre malé sumy. Zvyčajne super rýchla.",
        "onChain": "On chain",
        "theBestFor": "Lepšia pre pomerne veľké sumy. Môže to trvať dlhšie."
      },
      "description": {
        "description": "Popis",
        "writeWhyPeopleShouldTake":
          "Napíšte, prečo by ľudia mali prijať vašu ponuku."
      },
      "friendLevel": {
        "friendLevel": "Úroveň priateľov",
        "firstDegree": "1. stupeň",
        "secondDegree": "2. stupeň",
        "noVexlers": "Žiadni vexláci",
        "reachVexlers": "Dosah: {{count}} vexlákov"
      },
      "publishOffer": "Zverejniť ponuku",
      "errorCreatingOffer": "Chyba pri vytváraní ponuky",
      "errorSearchingForAvailableLocation":
        "Chyba pri vyhľadávaní dostupných miest",
      "offerEncryption": {
        "encryptingYourOffer": "Šifrovanie ponuky ...",
        "dontShutDownTheApp":
          "Počas šifrovania nevypínajte aplikáciu. Môže to trvať niekoľko minút.",
        "forVexlers": "pre {{count}} vexlákov",
        "doneOfferPoster": "Hotovo! Ponuka odoslaná.",
        "yourFriendsAndFriendsOfFriends":
          "Tvoju ponuku teraz môžu vidieť tvoji priatelia a priatelia ich priateľov.",
        "anonymouslyDeliveredToVexlers":
          "Anonymne doručené pre {{count}} vexlákov"
      },
      "noVexlersFoundForYourOffer":
        "Pre tvoju ponuku neboli nájdení žiadni vexláci",
      "errorLocationNotFilled": "Vyplň prosím lokalitu.",
      "errorDescriptionNotFilled": "Vyplň prosím popis nabídky.",
      "selectCurrency": "Výber meny",
      "currencyYouWouldLikeToUse": "Mena, ktorú chceš použiť pri obchodovaní."
    },
    "notifications": {
      "permissionsNotGranted": {
        "title": "Neboli povolené notifikace.",
        "message": "Môžeš ich povoliť v nastaveniach.",
        "openSettings": "Otvoriť nastavenia"
      },
      "errorWhileOpening": "Došlo k chybe pri otváraní notifikácie.",
      "MESSAGE": {
        "title": "Nová správa",
        "body": "Dostal si novú správu."
      },
      "REQUEST_REVEAL": {
        "title": "Žiadosť o odhalenie identity",
        "body": "Bol si požiadaný odhaliť svoju identitu."
      },
      "APPROVE_REVEAL": {
        "title": "Identita odhalená!",
        "body": "Tvoja žiadosť o odhalenie identity bola schválená."
      },
      "DISAPPROVE_REVEAL": {
        "title": "Žiadosť zamietnutá!",
        "body": "Tvoja žiadosť o odhalenie identity bola zamietnutá."
      },
      "REQUEST_MESSAGING": {
        "title": "Nová žiadosť!",
        "body": "Máš novú žiadosť."
      },
      "APPROVE_MESSAGING": {
        "title": "Schválená žiadosť!",
        "body": "Tvoja žiadosť bola schválená."
      },
      "DISAPPROVE_MESSAGING": {
        "title": "Zamietnutá žiadosť",
        "body": "Tvoja žiadosť bola zamietnutá-"
      },
      "DELETE_CHAT": {
        "title": "Zmazaný chat",
        "body": "Jeden z tvojich chatov bol vymazaný."
      },
      "BLOCK_CHAT": {
        "title": "Bol si zablokovaný!",
        "body": "Niekto ťa práve zablokoval."
      },
      "INACTIVITY_REMINDER": {
        "title": "Dlho sme o tebe nepočuli!",
        "body":
          "Od poslednej návštevy appky už ubehlo hodne času. Otvor Vexl, aby tvoje ponuky ostali aktívne!"
      },
      "preferences": {
        "marketing": {
          "title": "Marketingové notifikácie",
          "body": "Dostávaj novinky o nových funkciách!"
        },
        "chat": {
          "title": "Notifikácie o chate",
          "body": "Dostávaj notifikácie na nové žiadosti a správy."
        },
        "inactivityWarnings": {
          "title": "Varovanie o neaktivite",
          "body":
            "Dáme ti vedieť, keď by mali byť tvoje ponuky vymazané kvôli neaktivite."
        },
        "marketplace": {
          "title": "marketplace",
          "body": "marketplace"
        },
        "newOfferInMarketplace": {
          "title": "newOfferInMarketplace",
          "body": "newOfferInMarketplace"
        },
        "newPhoneContacts": {
          "title": "newPhoneContacts",
          "body": "newPhoneContacts"
        },
        "offer": {
          "title": "offer",
          "body": "offer"
        },
        "screenTitle": "Nastavenie notifikácií"
      },
      "REQUEST_CONTACT_REVEAL": {
        "title": "Žiadosť o telefónne číslo",
        "body": "Bolo požiadané o výmenu telefónneho čísla."
      },
      "APPROVE_CONTACT_REVEAL": {
        "title": "Telefónne číslo odhalené!",
        "body": "Tvoja žiadosť o odhalenie telefónneho čísla bola schválená."
      },
      "DISAPPROVE_CONTACT_REVEAL": {
        "title": "Žiadosť zamietnutá!",
        "body": "Tvoja žiadosť o odhalenie telefónneho čísla bola zamietnutá."
      },
      "NEW_OFFERS_IN_MARKETPLACE": {
        "title": "New offers in marketplace",
        "body":
          "There are new offers in marketplace. Open the app to view them."
      },
      "NEW_CONTACTS_ON_DEVICE": {
        "title": "Your contacts are not synced all the way",
        "body":
          "You have new contacts on device that you have not synced. Exapand your network and sync them all!"
      }
    },
    "myOffers": {
      "addNewOffer": "Pridať novú ponuku",
      "activeOffers": "{{count}} aktívne ponuky",
      "filterOffers": "Filtrovanie ponúk",
      "errorWhileFetchingYourOffers": "Chyba pri načítavaní ponúk",
      "editOffer": "Upraviť ponuku",
      "myOffer": "Moja ponuka",
      "offerAdded": "Pridané {{date}}",
      "sortedByNewest": "Zoradené podľa najnovších",
      "sortedByOldest": "Zoradené podľa najstarších"
    },
    "editOffer": {
      "editOffer": "Upraviť ponuku",
      "active": "Aktívne",
      "inactive": "Neaktívne",
      "saveChanges": "Uložiť zmeny",
      "offerUnableToChangeOfferActivation":
        "Nie je možné zmeniť aktiváciu ponuky",
      "editingYourOffer": "Úprava ponuky ...",
      "pleaseWait": "Počkaj prosím",
      "offerEditSuccess": "Úprava prebehla úspešne",
      "youCanCheckYourOffer":
        "Svoju ponuku si môžeš skontrolovať v časti Moje ponuky",
      "errorEditingOffer": "Chyba pri úprave ponuky",
      "errorOfferNotFound": "Ponuka nebola nájdená!",
      "deletingYourOffer": "Odstránenie tvojej ponuky ...",
      "offerDeleted": "Ponuka odstránená",
      "errorDeletingOffer": "Chyba pri odstraňovaní ponuky",
      "deleteOffer": "Zmazať ponuku?",
      "deleteOfferDescription":
        "Naozaj chcete vymazať svoju ponuku? Túto akciu nie je možné vrátiť späť."
    },
    "filterOffers": {
      "filterResults": "Filtrovanie výsledkov",
      "sorting": "Triedenie",
      "lowestFeeFirst": "Najnižší poplatok",
      "highestFee": "Najvyšší poplatok",
      "newestOffer": "Najnovšia ponuka",
      "oldestOffer": "Najstaršia ponuka",
      "lowestAmount": "Najnižšia suma",
      "highestAmount": "Najvyššia suma",
      "selectSortingMethod": "Vyberte spôsob triedenia",
      "searchByText": "Search by text",
      "noTextFilter": "No text filter selected"
    },
    "messages": {
      "yourOffer": "Tvoja ponuka",
      "theirOffer": "Ponuka protistrany",
      "listTitle": "Chaty",
      "isBuying": "kupuje",
      "isSelling": "predáva",
      "thisWillBeYourFirstInteraction":
        "Toto bude tvoja prvá interakcia s touto ponukou.",
      "wellLetYouKnowOnceUserAccepts":
        "Žiadosť odoslaná. Dáme ti vedieť, keď druhá strana odpovie.",
      "messagePreviews": {
        "incoming": {
          "MESSAGE": "{{them}}: {{message}}",
          "REQUEST_REVEAL": "{{them}} požiadal o odhalenie identity",
          "APPROVE_REVEAL": "Identita odhalená",
          "DISAPPROVE_REVEAL": "Odhalenie identity zamietnuté",
          "REQUEST_MESSAGING": "Reagoval na tvoju ponuku",
          "APPROVE_MESSAGING": "Žiadosť o správu schválená",
          "DISAPPROVE_MESSAGING": "Žiadosť o správu odmietnutá",
          "DELETE_CHAT": "{{them}} opustil chat",
          "BLOCK_CHAT": "{{them}} ťa zablokoval.",
          "OFFER_DELETED": "{{them}} vymazal svoju ponuku.",
          "INBOX_DELETED": "{{them}} vymazal chat.",
          "CANCEL_REQUEST_MESSAGING": "Zrušil žiadosť o správu",
          "ONLY_IMAGE": "{{them}} sent an image",
          "REQUEST_CONTACT_REVEAL":
            "{{them}} chce odhaliť tvoje telefónne číslo.",
          "APPROVE_CONTACT_REVEAL": "Telefónne číslo odhalené",
          "DISAPPROVE_CONTACT_REVEAL":
            "Žiadosť o telefónne číslo bola zamietnutá."
        },
        "outgoing": {
          "MESSAGE": "Ja: {{message}}",
          "REQUEST_REVEAL": "Požiadali ste o odhalenie identity",
          "APPROVE_REVEAL": "Identita odhalená",
          "DISAPPROVE_REVEAL": "Odhalenie identity zamietnuté.",
          "REQUEST_MESSAGING": "Žiadosť odoslaná",
          "APPROVE_MESSAGING": "Schválili ste zasielanie správ",
          "DISAPPROVE_MESSAGING": "Odmietol si žiadosť o správu.",
          "DELETE_CHAT": "Opustil si chat",
          "BLOCK_CHAT": "Používateľ bol zablokovaný",
          "OFFER_DELETED": "Vymazal si svoju ponuku.",
          "INBOX_DELETED": "Vymazal si chat.",
          "CANCEL_REQUEST_MESSAGING": "Žiadosť o správu zrušená",
          "ONLY_IMAGE": "You have sent an image",
          "REQUEST_CONTACT_REVEAL":
            "Tvoja žiadosť o telefónne číslo bola odoslaná.",
          "APPROVE_CONTACT_REVEAL": "Telefónne číslo bolo odhalené",
          "DISAPPROVE_CONTACT_REVEAL":
            "Žiadosť o telefónne číslo bola zamietnutá."
        }
      },
      "deleteChat": "Odstrániť chat",
      "askToReveal": "Požiadajte o odhalenie identity",
      "blockUser": "Zablokovať používateľa",
      "sending": "odosielanie...",
      "unknownErrorWhileSending": "Neznáma chyba pri odosielaní správy",
      "tapToResent": "Ťuknite na položku pre opätovné odoslanie.",
      "deniedByMe": "Odmietli ste žiadosť o odoslanie správy s {{name}}.",
      "deniedByThem": "{{name}} zamietol vašu žiadosť o správu.",
      "requestMessageWasDeleted": "Užívateľ neposlal žiadnu úvodnú správu.",
      "typeSomething": "Zadajte niečo ...",
      "offerDeleted": "Ponuka odstránená",
      "leaveToo": "Odísť tiež?",
      "leaveChat": "Opustiť chat?",
      "deleteChatQuestion": "Vymazať chat?",
      "blockForewerQuestion": "Zablokovať navždy?",
      "yesBlock": "Áno, zablokovať",
      "deleteChatExplanation1":
        "Skončili ste s obchodovaním? Ukončenie chatu znamená, že vaša konverzácia bude natrvalo vymazaná.",
      "deleteChatExplanation2":
        "Tento krok je nevratný. Chceš tento chat zmazať?",
      "blockChatExplanation1":
        "Naozaj chceš užívateľa zablokovať? Tento krok nejde vrátiť späť. Dobre si to rozmysli.",
      "blockChatExplanation2":
        "Naozaj chceš užívateľa zablokovať? Tento krok nejde vrátiť späť. Dobre si to rozmysli.",
      "chatEmpty": "Zatiaľ žiadne chaty",
      "chatEmptyExplanation": "Začni konverzáciu odoslaním žiadosti na ponuku.",
      "seeOffers": "Pozrite si ponuky",
      "identityRevealRequestModal": {
        "title": "Poslať žiadosť o odhalenie identity?",
        "text":
          "Odoslaním žiadosti o odhalenie identity súhlasíš aj s odhalením tvojej identity.",
        "send": "Odoslať žiadosť"
      },
      "identityRevealRespondModal": {
        "title": "Chceš odhaliť identitu?",
        "text": "Ak odhalíš svoju identitu, uvidíš aj identitu protistrany."
      },
      "identityAlreadyRequested":
        "V konverzácii už bola odoslaná žiadosť o zistenie identity",
      "identityRevealRequest": "Žiadosť o odhalenie identity",
      "identityRevealed": "Identity revealed",
      "identitySend": {
        "title": "Identity request sent",
        "subtitle": "waiting for response"
      },
      "tapToReveal": "Klikni pre odhalenie identity alebo zamietnutie",
      "letsRevealIdentities": "Poďme si odhaliť identity!",
      "reveal": "Odhaliť",
      "themDeclined": "{{name}} odmietol",
      "youDeclined": "Odmietli ste",
      "reportOffer": "Nahlásiť ponuku",
      "ended": " ukončené",
      "textMessageTypes": {
        "REQUEST_MESSAGING": "Your request: {{message}}",
        "CANCEL_REQUEST_MESSAGING": "This request was cancelled.",
        "DISAPPROVE_MESSAGING": "This request was denied.",
        "APPROVE_MESSAGING":
          "Request approved, you can now discuss the details."
      },
      "youHaveAlreadyTalked":
        "S tímto uživatelem už jste si psali. Klepnutím zobrazíte historii.",
      "requestPendingActionBar": {
        "top": "Chat is waiting for your approval",
        "bottom": "Above is communication you had with the user so far"
      },
      "showFullChatHistory":
        "You have already interacted with this offer. Tap to see chat history.",
      "unableToRespondOfferRemoved": {
        "title": "Offer was removed",
        "text":
          "Unable to send response. Offer has been deleted. Do you want to leave the chat?"
      },
      "offerWasReported": "Offer was reported",
      "unableToSelectImageToSend": {
        "title": "Unable to select image",
        "missingPermissions":
          "Vexl needs permission to access your images. Enable them in the settings."
      },
      "imageToSend": "Image to send: ",
      "actionBanner": {
        "requestPending": "Request pending",
        "bottomText": "Previous communication is displayed above",
        "buttonText": "Respond"
      },
      "cancelRequestDialog": {
        "title": "Si si istý?",
        "description":
          "If you cancel the messaging request other side will be unable to accept it",
        "yes": "Áno, zrušiť"
      },
      "contactRevealRespondModal": {
        "title": "Určite chceš odhaliť svoje telefónne číslo? ",
        "text": "Táto akcia odhalí protistrane tvoje telefónne číslo."
      },
      "contactRevealRequestModal": {
        "title": "Požiadaj o telefónne číslo",
        "text": "Odoslaním žiadosti súhlasíš s odhalením svojho čísla."
      },
      "contactAlreadyRequested": "Žiadosť o telefónne číslo už bola odoslaná.",
      "contactRevealRequest": "Žiadosť o odhalenie čísla",
      "contactRevealSent": {
        "title": "Žiadosť o odhalenie čísla bola odoslaná",
        "subtitle": "Čakanie na odpoveď"
      },
      "letsExchangeContacts": "Vymeňme si kontakty!",
      "phoneNumberRevealed": "Telefónne číslo bolo odhalené! ",
      "phoneNumberReveal": "Odhalenie telefónneho čísla",
      "phoneNumberRevealDeclined":
        "Odhalenie telefónneho čísla bolo zamietnuté.",
      "contactIsAlreadyInYourContactList":
        "Kontakt už bol uložený do telefónneho zoznamu.",
      "addUserToYourContacts": "Pridať {{name}} do kontaktov?",
      "tapToAddToYourVexlContacts": "Pridať do Vexl kontaktov."
    },
    "progressBar": {
      "ENCRYPTING_PRIVATE_PAYLOADS": "{{percentDone}}% hotovo",
      "FETCHING_CONTACTS": "",
      "CONSTRUCTING_PRIVATE_PAYLOADS": "Konštruovanie súkromného nákladu",
      "CONSTRUCTING_PUBLIC_PAYLOAD":
        "Konštruovanie a šifrovanie verejného užitočného zaťaženia",
      "SENDING_OFFER_TO_NETWORK": "Odoslanie ponuky",
      "DONE": "Hotovo"
    },
    "commonFriends": {
      "commonFriends": "Spoloční priatelia",
      "commonFriendsCount": "{{commonFriendsCount}} spoločných priateľov"
    },
    "reportIssue": {
      "openInEmail": "Otvoriť v emaili.",
      "somethingWentWrong": "Niečo sa pokazilo.",
      "feelFreeToGetInTouch": "Kontaktujte našu podporu",
      "predefinedBody": "Ahoj! Chcel by som nahlásiť chybu..."
    },
    "AppLogs": {
      "title": "Aplikačné logy",
      "clear": "Vymazať logy",
      "export": "Exportovať logy",
      "errorExporting": "Došlo k chybe pri exportovaní logov.",
      "warning":
        "Povolenie zaznamenávania aplikačných logov môže zapríčíniť spomalenie aplikácie a zaberať väčší priestor na disku.",
      "anonymizeAlert": {
        "title": "Would you like to anonymize logs?",
        "text":
          "We can try to strip private keys and personal information from logs before exporting them. Always make sure to verify by yourself."
      },
      "noLogs": "No logs"
    },
    "MaintenanceScreen": {
      "title": "Údržba marketplace",
      "text": "Aplikácia Vexl je v údržbe. Vráťte sa, prosím, neskôr."
    },
    "ForceUpdateScreen": {
      "title": "Je dostupná nová verzia aplikácie!",
      "text": "Nainštaluj si najnovšiu verziu aplikácie.",
      "action": "Aktualizovať"
    },
    "btcPriceChart": {
      "requestCouldNotBeProcessed":
        "Request to obtain current BTC price failed"
    },
    "deepLinks": {
      "importContacts": {
        "alert": {
          "title": "Import kontaktov",
          "text":
            "Chcete importovať {{contactName}} s číslom {{contactNumber}}?"
        },
        "successAlert": {
          "title": "Kontakt pridaný"
        }
      }
    },
    "qrCode": {
      "joinVexl": "Pripoj sa k Vexlu"
    },
    "editName": {
      "editName": "Upraviť meno",
      "errorUserNameNotValid": "Meno nie je valídne"
    },
    "changeProfilePicture": {
      "changeProfilePicture": "Zmeniť profilový obrázok",
      "uploadNewPhoto": "Vybrať obrázok"
    },
    "suggestion": {
      "vexl": "Vexl",
      "suggests": "odporúča",
      "yourAppGuide": "Tvoj sprievodca aplikáciou",
      "addMoreContacts": "Pridať víac kontaktov",
      "noOffersFromOthersYet":
        "🤔 Žiadne ponuky od ostatných? Zkús pridať ďalšie kontakty a počkaj. ✌️",
      "createYourFirstOffer":
        "👋 Vytvor svoju prvú ponuku na nákup alebo predaj Bitcoinu.",
      "importNewlyAddedContacts":
        "👋 Looks like you've got some new contacts. Want to import them now?",
      "importNow": "Import now"
    },
    "addContactDialog": {
      "addContact": "Pridanie kontaktu",
      "addThisPhoneNumber":
        "Would you like to add this phone number to your Vexl contacts?",
      "addContactName": "Add contact name",
      "contactAdded": "Contact added.",
      "youHaveAddedContact":
        "You have added {{contactName}} to your Vexl contacts.",
      "contactAlreadyInContactList":
        "Kontakt už bol uložený do telefónneho zoznamu.",
      "wouldYouLikeToChangeTheName":
        "Chceš pre toto číslo zmeniť meno na {{name}}?",
      "keepCurrent": "Ponechať",
      "contactUpdated": "Kontakt aktualizovaný",
      "youHaveSuccessfullyUpdatedContact":
        "Vexl kontakty boli úspešne aktualizované."
    },
    "": ""
  }
/* JSON ends */

export default otherSk
