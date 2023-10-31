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
      "gotIt": "Rozumiem",
      "search": "Hľadať",
      "deselectAll": "Zrušiť výber",
      "selectAll": "Vybrať všetky",
      "cancel": "Zrušiť",
      "unknownError": "Neznáma chyba",
      "unexpectedServerResponse": "Neočakávaná odpoveď servera",
      "networkErrors": {
        "errNetwork": "Chyba sieťového pripojenia. Ste pripojení k internetu?",
        "errCanceled": "Požiadavka bola zrušená",
        "etimedout": "Časový limit požiadavky vypršal",
        "econnaborted": "Pripojenie prerušené"
      },
      "submit": "Potvrdiť",
      "cryptoError": "Neočakávaná chyba šifrovania",
      "secondsShort": "s",
      "ok": "ok",
      "request": "Požiadať",
      "back": "Späť",
      "goBack": "Krok späť",
      "close": "Zavrieť",
      "done": "Hotovo",
      "errorCreatingInbox": "Chyba pri vytváraní schránky používateľa.",
      "accept": "Akceptovať",
      "decline": "Odmietnuť",
      "youSure": "Si si istý?",
      "nope": "Nie",
      "yesDelete": "Áno, vymazať",
      "more": "Viac",
      "yes": "Áno",
      "no": "Nie",
      "myOffers": "Moje ponuky",
      "errorOpeningLink": {
        "message": "Chyba pri otváraní odkazu.",
        "text": "Skopírovať do schránky?",
        "copy": "Skopírovať a zavrieť"
      },
      "nice": "Dobre",
      "success": "Podarilo sa!",
      "requested": "Požiadané",
      "now": "Teraz",
      "declined": "Zamietnuté",
      "reset": "Reset",
      "you": "Ty",
      "allow": "Povoliť",
      "currency": "Mena",
      "whatDoesThisMean": "Čo znamená '{{term}}'?",
      "learnMore": "Dozvedieť sa viac",
      "unableToShareImage": "Nemožno zdieľať obrázok.",
      "requestAgain": "Požiadať znovu",
      "seeDetail": "Zobraziť podrobnosti",
      "notNow": "Teraz nie",
      "niceWithExclamationMark": "Nice!",
      "nothingFound": "Nič sme nenašli.",
      "sendRequest": "Odoslať požiadavku",
      "change": "Zmeniť",
      "errorWhileReadingQrCode": "Chyba pri načítaní QR kódu.",
      "copyErrorToClipboard": "Skopírovať chybu do schránky",
      "me": "Ja",
      "error": "Chyba",
      "chatNotFoundError": "Chat nenájdený!",
      "send": "Send",
      "thanks": "Thanks!",
      "vexl": "Vexl",
      "dontShowMeThisAgain": "Don’t show me this again"
    },
    "loginFlow": {
      "anonymityNotice":
        "Bez tvojho povolenia to nikto neuvidí. Dokonca ani my.",
      "intro": {
        "title1": "Anonymne sa spoj so svojimi kontaktami.",
        "title2": "Pozri si ich ponuky.",
        "title3": "Začni chatovat, odhaľte svoje identity a obchodujte."
      },
      "start": {
        "subtitle": "Vitaj! Chceš začať vexlovať?",
        "touLabel": "Súhlasím s",
        "termsOfUse": "podmienkami používania"
      },
      "anonymizationNotice": {
        "title": "Tvoja identita bude anonymizovaná.",
        "text":
          "Nikto neuvidí tvoje skutočné meno a profilový obrázok, kým ho neodhalíš v konkrétnom obchode. Dokonca ani my. Najskôr poďme nastaviť tvoju skutočnú identitu."
      },
      "name": {
        "prompt": "Ako ti hovoria tvoji priatelia?",
        "placeholder": "Meno alebo prezývka",
        "nameValidationError":
          "Tvoje meno by malo byť dostatočne dlhé na to, aby si ho nevedela zapamäť zlatá rybička, ale zároveň dostatočne krátke na to, aby sa zmestilo na papierik v koláčiku šťastia - povedzme niekde medzi 1 a 25 znakmi."
      },
      "photo": {
        "title": "Ahoj {{name}}! Vyber si svoju profilovú fotku.",
        "selectSource": "Vyber si, odkiaľ chceš obrázok nahrať",
        "camera": "Fotoaparát",
        "gallery": "Galéria",
        "permissionsNotGranted": "Prístup zamietnutý.",
        "nothingSelected": "Nebol vybraný žiadny obrázok"
      },
      "anonymization": {
        "beforeTitle": "Toto je tvoj súkromný profil",
        "afterTitle": "Identita anonymizovaná!",
        "action": "Anonymizovať",
        "afterDescription":
          "Takto ťa uvidia ostatní užívatelia, než im odhalíš svoju identitu."
      },
      "phoneNumber": {
        "title": "Aké je tvoje telefónne číslo?",
        "placeholder": "Telefónne číslo",
        "text":
          "Aby sme ťa mohli spojiť s Vexl komunitou, musíš zadať svoje telefónne číslo.",
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
        "retryCountdown": "Nedostal si kód? Poslať znovu o",
        "retry": "Nedostal si kód? Poslať znovu",
        "errors": {
          "userAlreadyExists":
            "Používateľ s týmto telefónnym číslom už existuje.",
          "challengeCouldNotBeGenerated":
            "Výzvu nebolo možné vytvoriť. Skús to znova neskôr.",
          "verificationNotFound": "Neplatný kód notifikácie",
          "UserNotFound": "Používateľ nebol nájdený. Skús kód poslať znova.",
          "SignatureCouldNotBeGenerated":
            "Podpis sa nepodarilo vygenerovať. Skús to znova neskôr.",
          "PublicKeyOrHashInvalid":
            "Verejný kľúč alebo hash je neplatný. Skús to znova neskôr"
        },
        "success": {
          "title": "Tvoje číslo bolo overené. Poďme nastaviť tvoj profil.",
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
          "Vexl ťa anonymne prepojí s tvojimi priateľmi a priateľmi tvojich priateľov. Neskôr môžeš spravovať svoje kontakty a rozhodnúť, ktorých z nich chceš zahrnúť do svojho sociálneho okruhu.",
        "anonymizationCaption":
          "Tvoje kontakty neuvidí nikto ďalší. Dokonca ani my."
      },
      "importContactsButton": "Import kontaktov",
      "contactsList": {
        "addContactManually": "Pridať kontakt {{number}} manuálne",
        "inputPlaceholder": "Hľadať alebo pridať číslo",
        "nothingFound": {
          "title": "Nebol nájdený žiadny kontakt.",
          "text":
            "Ak chceš pridať telefónne číslo, ktoré nemáš v zozname kontaktov, zadaj ho do vyhľadávacieho riadku (s predvoľbou krajiny)."
        },
        "toAddCustomContact":
          "Ak chceš pridať telefónne číslo, ktoré nemáš v zozname kontaktov, zadaj ho do vyhľadávacieho riadku (s predvoľbou krajiny).",
        "addContact": "Pridať kontakt",
        "addThisPhoneNumber":
          "Chceš pridať toto číslo medzi tvoje Vexl kontakty?",
        "addContactName": "Pridať meno",
        "contactAdded": "Kontakt bol pridaný.",
        "youHaveAddedContact":
          "{{contactName}} bol pridaný k tvojim Vexl kontaktom.",
        "submitted": "Odoslané",
        "new": "Nové",
        "nonSubmitted": "Neodoslané"
      },
      "allowNotifications": {
        "title": "Povoliť notifikácie",
        "text":
          "Vďaka notifikáciam sa dozvieš, keď niekto prijme tvoju ponuku, alebo ti príde nová správa.",
        "action": "Povoliť",
        "cancel": "Preskočiť",
        "errors": {
          "permissionDenied":
            "Notifikácie neboli povolené. Môžeš ich povoliť neskôr v systémových nastaveniach.",
          "unknownError": "Neznáma chyba v procese žiadosti o povolenie.",
          "notAvailableOnEmulator": "Notifikácie niesú v emulátore dostupné."
        },
        "vexlCantBeUsedWithoutNotifications":
          "Aplikáciu Vexl nie je možné používať bez notifikácií."
      }
    },
    "settings": {
      "yourReach": "Tvoj dosah: {{number}} vexlákov",
      "items": {
        "changeProfilePicture": "Zmeniť profilový obrázok",
        "editName": "Zmeniť meno",
        "contactsImported": "Správa kontaktov",
        "xFriends": "{{number}} priateľov",
        "setPin": "Nastaviť PIN",
        "faceId": "Face ID",
        "allowScreenshots": "Povoliť screenshoty",
        "allowScreenshotsDescription": "Zákazať užívateľom snímky chatu",
        "termsAndPrivacy": "Podmienky a Ochrana súkromia",
        "faqs": "Často kladené otázky",
        "reportIssue": "Kontaktovať podporu",
        "inAppLogs": "Hlásenia v aplikácii",
        "requestKnownData": "Vyžiadanie údajov",
        "followUsOn": "Sleduj nás na",
        "twitter": "Twitter",
        "twitterUrl": "https://twitter.com/vexl",
        "readMoreOn": "Prečítaj si viac na",
        "medium": "Medium",
        "mediumUrl": "https://blog.vexl.it",
        "learnMoreOn": "Viac sa dozvieš na",
        "website": "Vexl.it",
        "websiteUrl": "https://vexl.it",
        "deleteAccount": "Zmazať účet",
        "supportEmail": "support@vexl.it"
      },
      "noLogoutExplanation":
        "Chceš sa odhlásiť? Takúto možnosť Vexl neponúka - môžeš ale zmazať svoj účet.",
      "support":
        "Ak sa ti Vexl páči a chceš nás podporiť, budeme radi za akýkoľvek príspevok v Bitcoine.",
      "version": "Verzia Vexl aplikácie: {{version}}",
      "logoutDialog": {
        "title": "Zmazať účet?",
        "title2": "Si si istý?",
        "description":
          "Naozaj si želáš vymazať tvoj účet? Tento krok nie je možné vrátiť späť."
      }
    },
    "offer": {
      "title": "Ponuka",
      "cashOnly": "V hotovosti",
      "onlineOnly": "Online platba",
      "upTo": "Až do",
      "forSeller": "Pre predávajúceho",
      "forBuyer": "Pre kupujúceho",
      "bank": "Banka",
      "revolut": "Online platba",
      "isSelling": "predáva",
      "isBuying": "kupuje",
      "directFriend": "Priamy priateľ",
      "friendOfFriend": "Priateľ priateľa",
      "buy": "Nákup",
      "sell": "Predaj",
      "filterOffers": "Filtrovať ponuky",
      "numberOfCommon": "{{number}} spoločných",
      "offerNotFound":
        "Ponuka nebola nájdená. Je možné, že ju autor odstránil.",
      "inputPlaceholder": "Tu napíš správu...",
      "sendRequest": "Odoslať žiadosť",
      "report": {
        "areYouSureTitle": "Nahlásiť ponuku?",
        "areYouSureText":
          "Skutočne chceš nahlásiť túto ponuku? Tento krok nie je možné vrátiť späť.",
        "yes": "Áno, nahlásiť",
        "thankYou": "Ďakujeme!",
        "inappropriateContentWasReported":
          "Nevhodný obsah bol anonymne nahlásený.",
        "reportLimitReached":
          "Pre dnešok si dosiahol maximálny počet možných nahlásení. Skús to znova za 24 hodín."
      },
      "goToChat": "Prejsť na chat",
      "requestStatus": {
        "requested":
          "Žiadosť o obchodovanie odoslaná. Oznámime ti, keď bude akceptovaná.",
        "accepted": "Žiadosť bola prijatá",
        "denied": "Žiadosť bola odmietnutá",
        "initial": "Toto bude tvoja prvá interakcia s touto ponukou.",
        "cancelled":
          "V minulosti si v súvislosti s touto ponukou zrušil žiadosť o obchod.",
        "deleted":
          "S týmto používateľom si sa už o tejto ponuke rozprával, ale vymazal si chat.",
        "otherSideLeft":
          "Na túto ponuku si už reagoval, ale protistrana opustila chat.",
        "leaved": "Na túto ponuku si už v minulosti reagoval."
      },
      "listEmpty": "Tvoj marketplace sa práve zahrieva. Vráť sa o pár minút!",
      "emptyAction": "Pridať novú ponuku",
      "createOfferAndReachVexlers":
        "Tvoj dosah je {{reachNumber}} vexlákov. Naimportuj viac kontaktov, aby si videl viac ponúk",
      "filterActive": "Filter aktívny",
      "totalOffers": "Celkovo: {{totalCount}} ponúk",
      "notImportedAnyContacts":
        "Nemáš importované žiadne kontakty. Import kontaktov ti umožní zobraziť ponuky z tvojej siete.",
      "socialNetworkTooSmall":
        "Importoval si malé množstvo kontaktov. Je možné, že nebudeš vidieť žiadne ponuky.",
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
      "rerequestTomorrow": "Ďalšiu žiadosť môžeš poslať zajtra.",
      "rerequestDays": "Ďalšiu požiadavku môžeš poslať o {{days}} dní.",
      "rerequest": "Poslať žiadosť znova",
      "cancelRequest": "Zrušiť žiadosť",
      "requestWasCancelledByOtherSide":
        "Žiadosť nemožno prijať, pretože ju druhá strana zrušila.",
      "requestNotFound":
        "Žiadosť nemožno prijať, pretože druhá strana zrušila svoj účet.",
      "otherSideAccountDeleted": "Protistrana zmazala účet",
      "createOfferNudge":
        "Rozšír svoj dosah v sociálnej sieti a buď prvý, kto vytvorí ponuku podľa daných kritérií.",
      "offerAuthorSpeaks": "{{name}} hovorí {{spokenLanguages}}"
    },
    "termsOfUse": {
      "termsOfUse": "Podmienky používania",
      "privacyPolicy": "Ochrana súkromia",
      "dontHaveTime":
        "Nemáš čas to všetko čítať? Pozri si často kladené otázky.",
      "cautiousNoticeAboutMachineTranslation":
        "Upozornenie: Nasledujúci text prešiel strojovým prekladom, pre prístup k pôvodnej anglickej verzii pokračuj na webovú stránku."
    },
    "faqs": {
      "faqs": "Často kladené otázky",
      "whatIsVexl": "Čo je to Vexl?",
      "vexlIsPlatform":
        "Vexl je platforma, kde môžeš dohadovať zmenu Bitcoinu v rámci svojej reálnej sociálnej siete - so svojimi priateľmi a priateľmi ich priateľov - a pritom, pokiaľ si to želáš, zostať v úplnej anonymite.",
      "whoCanSeeMyContacts": "Kto môže vidieť moje kontakty?",
      "peopleWhomYouAllowToSee":
        "Ľudia, ktorým odhalíš svoju identitu, môžu vidieť tvoje meno a profilový obrázok, nič viac.",
      "howCanIRemainAnonymous":
        "Ako môžem zostať v anonymite a pritom byť súčasťou Vexlu?",
      "byDefaultYouParticipateInTheNetwork":
        "Ostatní účastníci siete ťa uvidia pod tvojím Vexl menom a avatarom, ktoré ti boli pridelené pri registrácii. Svoju identitu môžeš odhaliť iba pre konkrétny obchod v našom zabezpečenom, end-to-end šifrovanom chate.",
      "howCanIMakeSure":
        "Ako sa môžem uistiť, že osoba, s ktorou sa rozprávam, je práve tá, s ktorou sa chcem rozprávať?",
      "oneChallenge":
        "Jedným z úskalí skutočne anonymných komunikačných systémov, ako je Vexl, je to, že si niekedy musíš overiť totožnosť osoby, s ktorou komunikuješ! V takýchto prípadoch je najlepšie použiť zabezpečený sekundárny komunikačný kanál, aby si si s druhou osobou potvrdil, že ste obaja tí, za ktorých sa vydávate.",
      "howCanIEnsure":
        "Ako sa môžem uistiť, že moja komunikácia a obchody sú súkromné a šifrované?",
      "vexlIsOpensource":
        "Vexl má voľne dostupný zdrojový kod, je tzv. open source - ktokoľvek v ňom môže hľadať zadné vrátka, škodlivé úmysly. Môžeš sa tiež pozrieť na správu z nezávislého bezpečnostného auditu.",
      "howCanYouEnsure": "Ako si môžem byť istý, že moje údaje sú chránené?",
      "vexlIsDesigned":
        "Vexl je navrhnutý tak, aby nikdy nezhromažďoval ani neukladal žiadne citlivé informácie. K správam a ďalšiemu obsahu nemáme my, ani iné tretie strany prístup, pretože sú vždy end-to-end šifrované. Naše podmienky poskytovania služieb a zásady ochrany osobných údajov sú k dispozícii nižšie.",
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
        "premiumOrDiscount": "Prémium alebo zľava",
        "youBuyForTheActualMarketPrice":
          "Kupuješ za trhovú cenu. Pohni s posuvníkom, aby si nakúpil rýchlejšie alebo lacnejšie.",
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
          "Predácaš za trhovú cenu. Pohni s posuvníkom, aby si predal rýchlejšie alebo zarobil viac.",
        "youEarnBitMore":
          "Zarobíš o niečo viac, ale môže to trvať o niečo dlhšie.",
        "youWantToEarnFortune":
          "Chceš zarobiť veľa, ale môže trvať roky, kým nájdeš kupcu.",
        "youSellSlightlyFaster":
          "Predávaš o niečo rýchlejšie, ale trochu pod trhovou cenou",
        "youSellMuchFaster":
          "Predávaš oveľa rýchlejšie, ale hlboko pod trhovou cenou",
        "youBuyBtcFor": "Nakupuješ BTC za",
        "youSellBtcFor": "Predávaš BTC za",
        "marketPrice": "trhová cena",
        "sellFaster": "Predať rýchlejšie",
        "earnMore": "Zarobiť viac",
        "premiumOrDiscountExplained": "Vysvetlenie prémie a zľavy",
        "influenceImpactOfYourSellOffer":
          "Ovplyvni dosah tvojej ponuky. Predaj rýchlejšie pridaním zľavy alebo zarob viac pridaním prémia k trhovej cene Bitcoinu.",
        "influenceImpactOfYourBuyOffer":
          "Ovplyvni dosah tvojej ponuky. Nakúp lacnejšie pridaním zľavy alebo kúp rýchlejšie pridaním prémia k trhovej cene Bitcoinu.",
        "playWithItAndSee":
          "Pohni posuvníkom a zisti, ako to ovplyvní záujem ostatných.",
        "plus": "+",
        "minus": "-",
        "youEarnSoMuchMore": "Zarobíš omnoho viac, ale môže to chvíľu trvať."
      },
      "buyCheaperByUsingDiscount":
        "Nakúp lacnejšie použitím zľavy alebo nakúp rýchlejšie pridaním prémia k trhovej cene Bitcoinu",
      "sellFasterWithDiscount":
        "Predávaj rýchlejšie pomocou zľavy alebo zarob viac pridaním prémia k trhovej cene Bitcoinu.",
      "location": {
        "location": "Lokalita",
        "meetingInPerson":
          "Osobné stretnutie je bezpečnejšie. Na čo si dať pozor pri online obchode? ",
        "checkItOut": "Pozri sa na to",
        "addCityOrDistrict": "Pridať mesto alebo oblasť",
        "whatToWatchOutForOnline": "Na čo si dať pozor pri online obchodovaní?",
        "moneySentByRandomPerson":
          "Peniaze obdržané od náhodnej osoby môžu mať kriminálny pôvod a byť vystopovateľné.",
        "neverSendCrypto": "Nikdy neposielaj Bitcoin pred prijatím platby.",
        "alwaysVerifyTheName":
          "Vždy si over meno majiteľa účtu, od ktorého si platbu prijal, či sedí s deklarovanou identitou protistrany.",
        "forwardTheAddress":
          "Adresu preposielaj bezpečným spôsobom a nezabudni si ju overiť iným bezpečným kanálom."
      },
      "inPerson": "Osobne",
      "online": "Online",
      "paymentMethod": {
        "paymentMethod": "Platobná metóda",
        "cash": "Hotovosť",
        "bank": "Banka",
        "revolut": "Online platba"
      },
      "network": {
        "network": "Sieť",
        "lightning": "Lightning",
        "theBestOption":
          "Najlepšia možnosť pre nižšie čiastky. Zvyčajne super rýchla.",
        "onChain": "On chain",
        "theBestFor": "Lepšia pre pomerne veľké sumy. Môže trvať dlhšie."
      },
      "description": {
        "description": "Popis",
        "writeWhyPeopleShouldTake":
          "Napíš, prečo by ľudia mali prijať tvoju ponuku."
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
        "Chyba pri vyhľadávaní dostupných lokalít",
      "offerEncryption": {
        "encryptingYourOffer": "Šifrovanie tvojej ponuky ...",
        "dontShutDownTheApp":
          "Nevypínaj prosím aplikáciu počas šifrovania tvojej ponuky. Môže to trvať niekoľko minút.",
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
      "errorDescriptionNotFilled": "Vyplň prosím popis ponuky.",
      "selectCurrency": "Výber meny",
      "currencyYouWouldLikeToUse": "Mena, ktorú chceš použiť pri obchodovaní.",
      "spokenLanguages": {
        "indicatePreferredLanguage": "Zadaj preferovaný jazyk",
        "ENG": "Anglicky",
        "DEU": "Nemecky",
        "CZE": "Česky",
        "SVK": "Slovensky",
        "PRT": "Protugalsky",
        "FRA": "Francúzsky",
        "ITA": "Taliansky",
        "ESP": "Španielsky",
        "language": "Jazyk",
        "preferredLanguages": "Preferovaný jazyk"
      }
    },
    "notifications": {
      "permissionsNotGranted": {
        "title": "Notifikáce neboli povolené.",
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
        "body": "Tvoja žiadosť na odhalenie identity bola schválená."
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
        "title": "Žiadosť schválená!",
        "body": "Tvoja žiadosť bola schválená."
      },
      "DISAPPROVE_MESSAGING": {
        "title": "Žiadosť zamietnutá!",
        "body": "Tvoja žiadosť bola zamietnutá."
      },
      "DELETE_CHAT": {
        "title": "Chat bol zmazaný",
        "body": "Jeden z tvojich chatov bol vymazaný."
      },
      "BLOCK_CHAT": {
        "title": "Bol si zablokovaný!",
        "body": "Niekto ťa práve zablokoval."
      },
      "INACTIVITY_REMINDER": {
        "title": "Dlho sme o tebe nepočuli!",
        "body":
          "Od poslednej návštevy aplikácie už ubehlo veľa času. Otvor Vexl, aby tvoje ponuky ostali aktívne!"
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
            "Dáme ti vedieť, keď by mali byť tvoje ponuky kvôli neaktivite vymazané."
        },
        "marketplace": {
          "title": "marketplace",
          "body": "marketplace"
        },
        "newOfferInMarketplace": {
          "title": "Notifikácie o ponukách",
          "body": "Dostávaj notifikácie o nových ponukách."
        },
        "newPhoneContacts": {
          "title": "Notifikácie o nových kontaktoch",
          "body": "Dostávaj notifikácie o nových kontaktoch v sieti."
        },
        "offer": {
          "title": "offer",
          "body": "offer"
        },
        "screenTitle": "Nastavenie notifikácií"
      },
      "REQUEST_CONTACT_REVEAL": {
        "title": "Žiadosť o telefónne číslo",
        "body": "Dostal si žiadosť o odhalenie telefónneho čísla"
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
        "title": "Nové ponuky na marketplace",
        "body": "Máš nové ponuky na marketplace"
      },
      "NEW_CONTACTS_ON_DEVICE": {
        "title": "Nemáš synchronizované všetky svoje kontakty",
        "body":
          "Na zariadení máš nové kontakty, ktoré si ešte nesynchronizoval s Vexlom. Rozšír si sieť ich synchronizáciou."
      }
    },
    "myOffers": {
      "addNewOffer": "Pridať novú ponuku",
      "activeOffers": "{{count}} aktívnych ponúk",
      "filterOffers": "Filtrovať ponuky",
      "errorWhileFetchingYourOffers": "Chyba pri načítavaní ponúk",
      "editOffer": "Upraviť ponuku",
      "myOffer": "Moja ponuka",
      "offerAdded": "Pridaná {{date}}",
      "sortedByNewest": "Zoradené podľa najnovších",
      "sortedByOldest": "Zoradené podľa najstarších",
      "offerToSell": "Predávaš",
      "offerToBuy": "Nakupuješ"
    },
    "editOffer": {
      "editOffer": "Upraviť ponuku",
      "active": "Aktívna",
      "inactive": "Neaktívna",
      "saveChanges": "Uložiť zmeny",
      "offerUnableToChangeOfferActivation":
        "Nebolo možné zmeniť aktiváciu ponuky.",
      "editingYourOffer": "Úprava tvojej ponuky ...",
      "pleaseWait": "Počkaj prosím",
      "offerEditSuccess": "Úprava prebehla úspešne",
      "youCanCheckYourOffer":
        "Svoju ponuku si môžeš skontrolovať v časti Moje ponuky",
      "errorEditingOffer": "Chyba pri upravovaní ponuky",
      "errorOfferNotFound": "Ponuka nenájdená!",
      "deletingYourOffer": "Mazanie tvojej ponuky ...",
      "offerDeleted": "Ponuka odstránená",
      "errorDeletingOffer": "Chyba pri mazaní ponuky",
      "deleteOffer": "Zmazať ponuku?",
      "deleteOfferDescription":
        "Naozaj chceš vymazať svoju ponuku? Túto akciu nie je možné vrátiť späť."
    },
    "filterOffers": {
      "filterResults": "Filtrovať výsledky",
      "sorting": "Zoradenie",
      "lowestFeeFirst": "Najnižší poplatok",
      "highestFee": "Najvyšší poplatok",
      "newestOffer": "Najnovšia ponuka",
      "oldestOffer": "Najstaršia ponuka",
      "lowestAmount": "Najnižšia hodnota",
      "highestAmount": "Najvyššia hodnota",
      "selectSortingMethod": "Vyber spôsob zoradenia",
      "searchByText": "Vyhľadávanie podľa textu",
      "noTextFilter": "Nebol zvolený žiaden textový filter",
      "chooseCurrency": "Vyber menu"
    },
    "messages": {
      "yourOffer": "Tvoja ponuka",
      "theirOffer": "Ponuka protistrany",
      "listTitle": "Chaty",
      "isBuying": "kupuje",
      "isSelling": "predáva",
      "thisWillBeYourFirstInteraction":
        "Toto bude tvoja prvá interakcia s týmto používateľom v súvislosti s touto ponukou.",
      "wellLetYouKnowOnceUserAccepts":
        "Žiadosť odoslaná. Dáme ti vedieť hneď, keď druhá strana odpovie.",
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
          "CANCEL_REQUEST_MESSAGING": "Žiadosť o komunikáciu zrušená",
          "ONLY_IMAGE": "{{them}} poslal obrázok",
          "REQUEST_CONTACT_REVEAL":
            "{{them}} chce odhaliť tvoje telefónne číslo.",
          "APPROVE_CONTACT_REVEAL": "Telefónne číslo odhalené",
          "DISAPPROVE_CONTACT_REVEAL":
            "Žiadosť o telefónne číslo bola zamietnutá."
        },
        "outgoing": {
          "MESSAGE": "Ja: {{message}}",
          "REQUEST_REVEAL": "Požiadal si o odhalenie identity",
          "APPROVE_REVEAL": "Identita odhalená",
          "DISAPPROVE_REVEAL": "Odhalenie identity zamietnuté.",
          "REQUEST_MESSAGING": "Žiadosť odoslaná",
          "APPROVE_MESSAGING": "Schválil si komunikáciu.",
          "DISAPPROVE_MESSAGING": "Odmietol si žiadosť o správu.",
          "DELETE_CHAT": "Opustil si chat",
          "BLOCK_CHAT": "Užívateľ bol zabolkovaný",
          "OFFER_DELETED": "Vymazal si svoju ponuku.",
          "INBOX_DELETED": "Vymazal si chat.",
          "CANCEL_REQUEST_MESSAGING": "Zrušil si žiadosť o komunikáciu.",
          "ONLY_IMAGE": "Poslal si obrázok",
          "REQUEST_CONTACT_REVEAL":
            "Tvoja žiadosť o telefónne číslo bola odoslaná.",
          "APPROVE_CONTACT_REVEAL": "Telefónne číslo bolo odhalené",
          "DISAPPROVE_CONTACT_REVEAL":
            "Žiadosť o telefónne číslo bola zamietnutá."
        }
      },
      "deleteChat": "Odstrániť chat",
      "askToReveal": "Požiadať o odhalenie identity",
      "blockUser": "Zablokovať užívateľa",
      "sending": "odosielanie...",
      "unknownErrorWhileSending": "Neznáma chyba pri odosielaní správy",
      "tapToResent": "Odoslať znova.",
      "deniedByMe": "Odmietol si žiadosť o komunikáciu s užívateľom {{name}}.",
      "deniedByThem": "{{name}} zamietol vašu žiadosť o správu.",
      "requestMessageWasDeleted": "Užívateľ neposlal žiadnu úvodnú správu.",
      "typeSomething": "Napíš niečo ...",
      "offerDeleted": "Ponuka vymazaná",
      "leaveToo": "Tiež opustiť?",
      "leaveChat": "Opustiť chat?",
      "deleteChatQuestion": "Zmazať chat?",
      "blockForewerQuestion": "Zablokovať navždy?",
      "yesBlock": "Áno, zablokovať.",
      "deleteChatExplanation1":
        "Ukončil si obchod? Zatvorením chatu bude táto konverzácia nenávratne odstránená.",
      "deleteChatExplanation2":
        "Tento krok je nevratný. Chceš tento chat zmazať?",
      "blockChatExplanation1":
        "Naozaj chceš tohto užívateľa zablokovať? Tento krok nejde vrátiť späť. Dobre si to rozmysli.",
      "blockChatExplanation2":
        "Naozaj chceš tohto užívateľa zablokovať? Tento krok nejde vrátiť späť. Dobre si to rozmysli.",
      "chatEmpty": "Zatiaľ nemáš žiadne chaty",
      "chatEmptyExplanation": "Začni konverzáciu reakciou na ponuku.",
      "seeOffers": "Pozri si ponuky",
      "identityRevealRequestModal": {
        "title": "Poslať žiadosť na odhalenie identity?",
        "text":
          "Odoslaním žiadosti na odhalenie identity zárověn súhlasíš s odhalením tvojej identity.",
        "send": "Odoslať žiadosť"
      },
      "identityRevealRespondModal": {
        "title": "Chceš odhaliť svoju identitu?",
        "text": "Ak odhalíš svoju identitu, uvidíš aj identitu protistrany."
      },
      "identityAlreadyRequested":
        "V tejto konverzácii už bola odoslaná žiadosť na odhalenie identity",
      "identityRevealRequest": "Žiadosť o odhalenie identity",
      "identityRevealed": "Identita odhalená",
      "identitySend": {
        "title": "Odhalenie identity odoslané",
        "subtitle": "čakanie na odpoveď"
      },
      "tapToReveal": "Stlač pre odhalenie alebo zamietnutie",
      "letsRevealIdentities": "Poďme si odhaliť identity!",
      "reveal": "Odhaliť",
      "themDeclined": "{{name}} zamietol",
      "youDeclined": "Zamietol si",
      "reportOffer": "Nahlásiť ponuku",
      "ended": "Ukončené",
      "textMessageTypes": {
        "REQUEST_MESSAGING": "Reakcia na tvoju ponuku: {{message}}",
        "CANCEL_REQUEST_MESSAGING": "Táto požiadavka bola zrušená.",
        "DISAPPROVE_MESSAGING": "Táto požiadavka bola zamietnutá.",
        "APPROVE_MESSAGING":
          "Požiadavka schválená, teraz sa môžete pobaviť o detailoch."
      },
      "youHaveAlreadyTalked":
        "S týmto užívateľom si si už v minulosti písal. Stlačením zobrazíš históriu.",
      "requestPendingActionBar": {
        "top": "Chat čaká na tvoje schválenie",
        "bottom": "Vyššie je vaša predošlá komunikácia."
      },
      "showFullChatHistory":
        "S týmto používateľom si si už o tejto ponuke chatoval, stlač pre zobrazenie histórie chatu.",
      "unableToRespondOfferRemoved": {
        "title": "Ponuka bola odstránená",
        "text":
          "Nieje možné odoslať odpoveď. Ponuka bola odstránená. Chceš opustiť chat?"
      },
      "offerWasReported": "Ponuka bola nahlásená.",
      "unableToSelectImageToSend": {
        "title": "Nebolo možné vybrať obrázok",
        "missingPermissions":
          "Vexl potrebuje povolenie na prístup k tvojim obrázkom. Môžeš to zmeniť v nastaveniach."
      },
      "imageToSend": "Odoslať obrázok:",
      "actionBanner": {
        "requestPending": "Čakanie na odpoveď",
        "bottomText": "Predošlá komunikácia je zobrazená vyššie",
        "buttonText": "Odpovedať"
      },
      "cancelRequestDialog": {
        "title": "Si si istý?",
        "description":
          "Ak zrušíš žiadosť o komunikáciu, druhá strana ju nebude môcť prijať.",
        "yes": "Áno, zrušiť"
      },
      "contactRevealRespondModal": {
        "title": "Určite chceš odhaliť svoje telefónne číslo? ",
        "text": "Táto akcia odhalí protistrane tvoje telefónne číslo."
      },
      "contactRevealRequestModal": {
        "title": "Požiadaj o telefónne číslo",
        "text": "Odoslaním žiadosti zároveň súhlasíš s odhalením svojho čísla."
      },
      "contactAlreadyRequested": "Žiadosť o telefónne číslo už bola odoslaná.",
      "contactRevealRequest": "Žiadosť na odhalenie čísla",
      "contactRevealSent": {
        "title": "Žiadosť na odhalenie čísla bola odoslaná",
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
      "tapToAddToYourVexlContacts": "Pridať do Vexl kontaktov.",
      "howWasTheTrade": "How was the trade?",
      "yourAnswerIsAnonymous": "Your answer is 100% anonymous",
      "anyProblems": "Any problems?",
      "whatWasWrongExactly": "What was wrong exactly?",
      "howWasCreatingNewOffer": "How was creating new offer?",
      "whatWasGreatAboutIt": "What was great about it?",
      "whatWorkedWellExactly": "What worked well exactly?",
      "tradeChecklist": "Trade checklist",
      "vexlbotNotifications": "Vexlbot notifications"
    },
    "progressBar": {
      "ENCRYPTING_PRIVATE_PAYLOADS": "{{percentDone}}% hotovo",
      "FETCHING_CONTACTS": "",
      "CONSTRUCTING_PRIVATE_PAYLOADS": "Konštruovanie súkromného nákladu",
      "CONSTRUCTING_PUBLIC_PAYLOAD":
        "Konštruovanie a šifrovanie verejného užitočného zaťaženia",
      "SENDING_OFFER_TO_NETWORK": "Odosielanie ponuky",
      "DONE": "Hotovo"
    },
    "commonFriends": {
      "commonFriends": "Spoloční priatelia",
      "commonFriendsCount": "{{commonFriendsCount}} spoločných priateľov",
      "call": "Volať"
    },
    "reportIssue": {
      "openInEmail": "Otvoriť v emaili",
      "somethingWentWrong": "Niečo sa pokazilo?",
      "feelFreeToGetInTouch": "Kontaktuj našu podporu",
      "predefinedBody": "Ahoj! Chcel by som nahlásiť chybu..."
    },
    "AppLogs": {
      "title": "Aplikačné logy",
      "clear": "Vymazať logy",
      "export": "Exportovať logy",
      "errorExporting": "Došlo k chybe pri exportovaní logov.",
      "warning":
        "Povolenie zaznamenávania aplikačných logov môže zapríčíniť spomalenie aplikácie a zaberať väčší úložný priestor.",
      "anonymizeAlert": {
        "title": "Would you like to anonymize logs?",
        "text":
          "We can try to strip private keys and personal information from logs before exporting them. Always make sure to verify by yourself."
      },
      "noLogs": "Žiadne logy"
    },
    "MaintenanceScreen": {
      "title": "Údržba na marketplace",
      "text": "Aplikácia Vexl je v údržbe. Vráť sa, prosím, neskôr."
    },
    "ForceUpdateScreen": {
      "title": "Je dostupná nová verzia aplikácie!",
      "text": "Nainštaluj si najnovšiu verziu aplikácie.",
      "action": "Aktualizovať"
    },
    "btcPriceChart": {
      "requestCouldNotBeProcessed":
        "Požiadavka na získanie aktuálnej ceny BTC zlyhala."
    },
    "deepLinks": {
      "importContacts": {
        "alert": {
          "title": "Import kontaktov",
          "text":
            "Chceš importovať {{contactName}} s číslom {{contactNumber}}?"
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
        "👋 Vyzerá to, že máš nejaké nové kontakty. Chceš ich importovať?",
      "importNow": "Importovať teraz"
    },
    "addContactDialog": {
      "addContact": "Přidat kontakt",
      "addThisPhoneNumber":
        "Chceš pridať toto telefónne číslo medzi svoje Vexl kontakty?",
      "addContactName": "Pridať meno kontaktu",
      "contactAdded": "Kontakt pridaný",
      "youHaveAddedContact":
        "Pridal si si {{contactName}} do svojich Vexl kontaktov.",
      "contactAlreadyInContactList":
        "Kontakt už bol uložený do telefónneho zoznamu.",
      "wouldYouLikeToChangeTheName":
        "Chceš pre toto číslo zmeniť meno z uloženého {{name}}?",
      "keepCurrent": "Ponechať",
      "contactUpdated": "Kontakt aktualizovaný",
      "youHaveSuccessfullyUpdatedContact":
        "Vexl kontakty boli úspešne aktualizované."
    },
    "qrScanner": {
      "title": "Naskenuj QR kód iného používateľa.",
      "invalidQrCodeScanned": "Naskenovaný QR kód je chybný.",
      "missingCameraPermissions": "Chýbajúce povolenia pre fotoaparát.",
      "grantPermissions": "Získať povolenia",
      "grantPermissionsInSettings":
        "Nebolo možné získať povolenie. Pre naskenovanie QR kódu otvor nastavenia a povoľ Vexlu používanie fotoaparátu.",
      "openSettings": "Otvoriť nastavenia"
    },
    "": "",
    "feedback": {
      "objection": {
        "APP": "App",
        "PROCESS": "Process",
        "RESPONDING_TIME": "Responding time",
        "CANCELED_OFFER": "Canceled offer",
        "IMPOSSIBLE_TO_AGREE": "Impossible to agree",
        "LEFT_THE_CHAT": "Left the chat",
        "DID_NOT_SHOW_UP": "Didn't show up",
        "I_MET_NEW_FRIEND": "I met new friend",
        "DEAL_WAS_SMOOTH": "Deal was smooth",
        "IT_WAS_FAST": "It was fast"
      }
    },
    "vexlbot": {
      "bot": "bot",
      "initialWelcomeMessage":
        "Welcome to the chat. Let’s agree on trade details with {{name}}. I’ll help you along the way.",
      "openTradeChecklist": "Open Trade Checklist"
    },
    "tradeChecklist": {
      "agreeOnTradeDetails": "Agree on trade details",
      "thisDealIsFullyOnline":
        "This deal is fully online. Be careful and consider risks. Meeting in person is always safer.",
      "readMoreInFullArticle": "Read more in full article",
      "tradeOnlyWithPeopleYouKnow": "Trade online only with people you know.",
      "alwaysMoneyBeforeBtc": "Always money before BTC.",
      "watchOutForSuspiciousBehaviour": "Watch out for suspicious behaviour.",
      "notVisibleToAnyoneNotice":
        "Not visible to anyone except chat participants",
      "acknowledgeAndContinue": "Acknowledge and continue chatting",
      "youCanPickWhatYouFill": "It’s optional. You can pick what you fill.",
      "options": {
        "DATE_AND_TIME": "Date and time",
        "MEETING_LOCATION": "Meeting location",
        "CALCULATE_AMOUNT": "Calculate amount",
        "SET_NETWORK": "Set network",
        "REVEAL_IDENTITY": "Reveal identity",
        "REVEAL_PHONE_NUMBER": "Reveal phone number"
      },
      "saveAndContinue": "Save and continue chatting",
      "shareRecognitionSignInChat": "Or share the recognition sign in chat"
    }
  }
/* JSON ends */

export default otherSk
