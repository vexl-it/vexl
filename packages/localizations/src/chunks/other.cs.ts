import type en from "./other.en"

const otherCs: typeof en =
  /* JSON starts */
  {
    "common": {
      "next": "Další",
      "skip": "Přeskočit",
      "finish": "Dokončit",
      "confirm": "Potvrdit",
      "continue": "Pokračovat",
      "save": "Uložit",
      "gotIt": "Rozumím",
      "search": "Hledat",
      "deselectAll": "Zrušit výběr",
      "selectAll": "Vybrat vše",
      "cancel": "Zrušit",
      "unknownError": "Neznámá chyba",
      "unexpectedServerResponse": "Neočekávaná odpověď ze serveru",
      "networkErrors": {
        "errNetwork": "Chyba síťového připojení. Jste připojeni k internetu?",
        "errCanceled": "Požadavek byl zrušen",
        "etimedout": "Časový limit požadavku vypršel",
        "econnaborted": "Spojení bylo přerušeno"
      },
      "submit": "Potvrdit",
      "cryptoError": "Neočekávaná chyba při šifrování",
      "secondsShort": "s",
      "ok": "ok",
      "request": "Požádat",
      "back": "Zpět",
      "goBack": "Krok zpět",
      "close": "Zavřít",
      "done": "Hotovo",
      "errorCreatingInbox": "Chyba při vytváření uživatelské schránky.",
      "accept": "Akceptovat",
      "decline": "Odmítnout",
      "youSure": "Jsi si jistý?",
      "nope": "Ne",
      "yesDelete": "Ano, vymazat",
      "more": "Víc",
      "yes": "Ano",
      "no": "Ne",
      "myOffers": "Moje nabídky",
      "errorOpeningLink": {
        "message": "Chyba při otevírání odkazu.",
        "text": "Zkopírovat do schránky?",
        "copy": "Zkopírovat a zavřít"
      },
      "nice": "Dobře",
      "success": "Povedlo se",
      "requested": "Požádáno",
      "now": "Teď",
      "declined": "Zamítnuto",
      "reset": "Reset",
      "you": "Ty",
      "allow": "Povolit",
      "currency": "Měna",
      "whatDoesThisMean": "Co znamená '{{term}}'?",
      "learnMore": "Dovědet se víc",
      "unableToShareImage": "Nelze sdílet obrázek.",
      "requestAgain": "Požádat znovu",
      "seeDetail": "Zobrazit podrobnosti",
      "notNow": "Teď ne",
      "niceWithExclamationMark": "Nice!",
      "nothingFound": "Nic sme nenašli.",
      "sendRequest": "Odeslat požadavek",
      "change": "Změnit",
      "errorWhileReadingQrCode": "Chyba při načítání QR kódu.",
      "copyErrorToClipboard": "Zkopírovat chybu do schránky",
      "me": "Já",
      "error": "Chyba",
      "chatNotFoundError": "Chat nebyl nalezen!",
      "send": "Odeslat",
      "thanks": "Díky!",
      "vexl": "Vexl",
      "dontShowMeThisAgain": "Don’t show me this again"
    },
    "loginFlow": {
      "anonymityNotice": "Bez tvého svolení jej nikdo neuvidí. Ani my.",
      "intro": {
        "title1": "Anonymně se spoj se svými kontakty.",
        "title2": "Podívej se na jejich nabídky.",
        "title3": "Začni chatovat, odhalte své identity a obchodujte."
      },
      "start": {
        "subtitle": "Vítej! Chceš začít vexlovat?",
        "touLabel": "Souhlasím s",
        "termsOfUse": "podmínkami užití"
      },
      "anonymizationNotice": {
        "title": "Tvoje identita bude anonymizována.",
        "text":
          "Nikdo neuvidí tvoje skutečné jméno a profilový obrázek, dokud je neodhalíš pro konkrétní obchod. Dokonce ani my. Nejprve nastavíme tvoji skutečnou identitu."
      },
      "name": {
        "prompt": "Jak ti říkají kamarádi?",
        "placeholder": "Jméno nebo přezdívka",
        "nameValidationError":
          "Tvoje jméno by mělo být dostatečně dlouhé, aby si ho nezapamatovala zlatá rybka, ale zároveň dostatečně krátké, aby se vešlo na kousek papíru v koláčku štěstí - řekněme mezi 1 a 25 znaky."
      },
      "photo": {
        "title": "Ahoj {{name}}! Vyber si svoji profilovou fotku.",
        "selectSource": "Vyber si, odkud chceš obrázek nahrát",
        "camera": "Fotoaparát",
        "gallery": "Galérie",
        "permissionsNotGranted": "Přístup zamítnut.",
        "nothingSelected": "Nebyl vybrán žádný obrázek"
      },
      "anonymization": {
        "beforeTitle": "Tohle je tvůj soukromej profil",
        "afterTitle": "Identita anonymizovaná!",
        "action": "Anonymizovat",
        "afterDescription":
          "Takto tě uvidí ostatní uživatelé, než jim odhalíš svou intenditu."
      },
      "phoneNumber": {
        "title": "Jaké je tvoje telefonní číslo?",
        "placeholder": "Telefonní číslo",
        "text":
          "Abychom tě mohli spojit s komunitou Vexl, musíš zadat své telefonní číslo.",
        "errors": {
          "invalidPhoneNumber":
            "Neplatné telefonní číslo. Zkus to prosím znovu.",
          "previousCodeNotExpired":
            "Ověřování tohoto telefonního čísla již probíhá. Počkej prosím, dokud nevyprší jeho platnost."
        }
      },
      "verificationCode": {
        "title": "Právě jsme ti zaslali verifikační kód",
        "text": "Pro ověření jej zadej níže",
        "inputPlaceholder": "Ověřovací kód",
        "retryCountdown": "Neobdržel jsi kód? Poslat znova za",
        "retry": "Neobdržel jsi kód? Zkus ho poslat znova.",
        "errors": {
          "userAlreadyExists":
            "Uživatel s tímto telefonním číslem již existuje.",
          "challengeCouldNotBeGenerated":
            "Výzvu nebylo možné vytvořit. Zkus to později.",
          "verificationNotFound": "Neplatný kód notifikace",
          "UserNotFound": "Uživatel nebyl nalezen. Zkus kód odeslat znovu.",
          "SignatureCouldNotBeGenerated":
            "Podpis se nepodařilo vygenerovat. Zkus to znovu později",
          "PublicKeyOrHashInvalid":
            "Veřejný klíč nebo hash je neplatný. Zkus to znovu později."
        },
        "success": {
          "title": "Tvé číslo bylo ověřeno. Čas nastavit tvůj profil.",
          "errorWhileParsingSessionForInternalState":
            "Chyba při ukládání uživatele"
        }
      },
      "importContacts": {
        "title": "Pojďme nyní najít tvoje přátele!",
        "text":
          "Vexl používá tvojí reálnou sociální síť - tvoje přátele a jejich přátele. Čím více kontaktů přidáš, tím více nabídek uvidíš.",
        "anonymityNotice": "Tvé kontakty neuvidí nikdo další. Dokonce ani my.",
        "action": "Import kontaktů"
      }
    },
    "postLoginFlow": {
      "contactsExplanation": {
        "title": "Pojďme nyní najít tvoje přátele!",
        "text": "Svou sociální síť můžeš později upravovat v nastavení.",
        "anonymizationCaption":
          "Tvé kontakty neuvidí nikdo další. Dokonce ani my."
      },
      "importContactsButton": "Import kontaktů",
      "contactsList": {
        "addContactManually": "Přidat kontakt {{number}} manuálne",
        "inputPlaceholder": "Hledání nebo přidání čísla",
        "nothingFound": {
          "title": "Žádný kontakt nebyl nalezen.",
          "text":
            "Chceš-li přidat telefonní číslo, které nemáš v seznamu kontaktů, zadej ho do vyhledávacího řádku (s předčíslím země)."
        },
        "toAddCustomContact":
          "Chceš-li přidat telefonní číslo, které nemáš v seznamu kontaktů, zadej ho do vyhledávacího řádku (s předčíslím země).",
        "addContact": "Přidat kontakt",
        "addThisPhoneNumber": "Chceš přidat toto číslo mezi tvé Vexl kontakty?",
        "addContactName": "Přidat jméno",
        "contactAdded": "Kontakt byl přidán.",
        "youHaveAddedContact":
          "{{contactName}} byl přidán ke tvým Vexl kontaktům.",
        "submitted": "Odesláno",
        "new": "Nový",
        "nonSubmitted": "Neodesláno"
      },
      "allowNotifications": {
        "title": "Povolit notifikace",
        "text":
          "Díky notifikacím se dozvíš, když ostatní přijmou tvé nabídky nebo když ti přijdou nové zprávy.",
        "action": "Povolit",
        "cancel": "Přeskočit",
        "errors": {
          "permissionDenied":
            "Notifikace nebyli povoleny. Můžeš je povolit později v nastavení systému.",
          "unknownError": "Neznámá chyba při žádosti o oprávnění",
          "notAvailableOnEmulator":
            "Notifikace nejsou v emulátoru k dispozici."
        },
        "vexlCantBeUsedWithoutNotifications":
          "Aplikaci Vexl není možné používat bez notifikací."
      }
    },
    "settings": {
      "yourReach": "Tvůj dosah: {{number}} vexláků",
      "items": {
        "changeProfilePicture": "Změnit profilový obrázek",
        "editName": "Změnit jméno",
        "contactsImported": "Správa kontaktů",
        "xFriends": "{{number}} přátel",
        "setPin": "Nastavit PIN",
        "faceId": "Face ID",
        "allowScreenshots": "Povolit screenshoty",
        "allowScreenshotsDescription":
          "Zakázat uživatelům pořizovat snímky chatu",
        "termsAndPrivacy": "Podmínky a Ochrana soukromí",
        "faqs": "Často kladené otázky",
        "reportIssue": "Kontaktovat podporu",
        "inAppLogs": "Aplikační logy",
        "requestKnownData": "Vyžádání údajů",
        "followUsOn": "Sleduj nás na",
        "twitter": "Twitter",
        "twitterUrl": "https://twitter.com/vexl",
        "readMoreOn": "Přečti si více na",
        "medium": "Medium",
        "mediumUrl": "https://blog.vexl.it",
        "learnMoreOn": "Více informací nalezneš na",
        "website": "Vexl.it",
        "websiteUrl": "https://vexl.it",
        "deleteAccount": "Smazat účet",
        "supportEmail": "support@vexl.it"
      },
      "noLogoutExplanation":
        "Chceš se odhlásit? Taková možnost ve Vexlu není - můžeš ale smazat svůj účet.",
      "support":
        "Pokud se ti Vexl líbí a chceš nás podpořit, budeme rádi za jakýkoli příspěvek v Bitcoinu.",
      "version": "Verze aplikace Vexl: {{version}}",
      "logoutDialog": {
        "title": "Smazat účet?",
        "title2": "Jsi si jistý ?",
        "description":
          "Opravdu chceš, aby byl tvůj účet smazán? Tento krok nelze vzít zpět."
      }
    },
    "offer": {
      "title": "Nabídka",
      "cashOnly": "V hotovosti",
      "onlineOnly": "Online platba",
      "upTo": "Až do",
      "forSeller": "Pro prodávajícího",
      "forBuyer": "Pro kupujícího",
      "bank": "Banka",
      "revolut": "Online platba",
      "isSelling": "prodává",
      "isBuying": "kupuje",
      "directFriend": "Přímý přítel",
      "friendOfFriend": "Přítel přítele",
      "buy": "Nákup",
      "sell": "Prodej",
      "filterOffers": "Filtrovat nabídky",
      "numberOfCommon": "{{number}} společných",
      "offerNotFound":
        "Nabídka nebyla nalezena. Je možné, že ji autor odstranil.",
      "inputPlaceholder": "Zde napiš zprávu...",
      "sendRequest": "Odeslat žádost",
      "report": {
        "areYouSureTitle": "Nahlásit nabídku?",
        "areYouSureText":
          "Skutečně chceš nahlásit tuhle nabídku? Tahle akce je nevratná.",
        "yes": "Ano, nahlásit",
        "thankYou": "Děkujeme!",
        "inappropriateContentWasReported":
          "Nevhodný obsah byl anonymně nahlášen.",
        "reportLimitReached":
          "Pro dnešek jsi dosáhl maximálního počtu nahlášení. Zkus to znovu za 24 hodin."
      },
      "goToChat": "Přejít na chat",
      "requestStatus": {
        "requested":
          "Žádost o obchodování odeslána. Po jejím přijetí tě budeme informovat.",
        "accepted": "Žádost byla přijata",
        "denied": "Žádost byla zamítnuta",
        "initial": "Toto bude tvoje první interakce s touto nabídkou.",
        "cancelled":
          "V minulosti jsi v souvislosti s touto nabídkou zrušili žádost o obchod.",
        "deleted":
          "S tímto uživatelem jsi již o této nabídce mluvil, ale smazal jsi chat.",
        "otherSideLeft":
          "Na tuto nabídku jsi již odpověděl, ale druhá strana opustila chat.",
        "leaved": "Na tuto nabídku jsi již v minulosti reagoval."
      },
      "listEmpty": "Tvůj marketplace se právě zahřívá. Vrať se za pár minut!",
      "emptyAction": "Přidat novou nabídku",
      "createOfferAndReachVexlers":
        "Tvůj dosah je {{reachNumber}} vexláků. Naimportuj víc kontaktů abys viděl víc nabídek",
      "filterActive": "Filtr aktivní",
      "totalOffers": "Celkově: {{totalCount}} nabídek",
      "notImportedAnyContacts":
        "Nemáš importované žádné kontakty. Import kontaktů ti umožní zobrazit nabídky z tvé sítě.",
      "socialNetworkTooSmall":
        "Importoval jsi malé množství kontaktů. Je možné, že neuvidíš žádné nabídky.",
      "noOffersToMatchFilter":
        "Nemáš žádné nabídky, které odpovídají zadaným kritériím.",
      "offersAreLoadingAndShouldBeReady":
        "Nabídky se načítají a měly by být dostupné za {{minutes}} minut.",
      "marketplaceEmpty": "Marketplace je zatím prázdný",
      "resetFilter": "Resetovat filtr",
      "totalFilteredOffers":
        "Filtrováno: {{count}} nabídek (z celkového počtu {{totalCount}})",
      "offerFromDirectFriend": "Nabídka od přímého přítele",
      "offerFromFriendOfFriend": "Nabídka od přítele jedného z tvých kontaktů",
      "youSeeThisOfferBecause":
        "Vidíš tuto nabídku, protože druhá strana má tvoje telefonní číslo uloženo ve svém seznamu kontaktů.",
      "beCautiousWeCannotVerify":
        "Buď opatrný, nemůžeme ověřit, zda se opravdu znáte.",
      "dontForgetToVerifyTheIdentity":
        "Nezapomeň si ověřit identitu protistrany prostřednictvím společného přítele.",
      "noDirectConnection": "Pravděpodobně se s touto osobou navzájem neznáte.",
      "rerequestTomorrow": "Další žádost můžeš poslat zítra.",
      "rerequestDays": "Další žádost můžeš poslat za {{days}} dní.",
      "rerequest": "Odeslat žádost znova",
      "cancelRequest": "Zrušit žádost",
      "requestWasCancelledByOtherSide":
        "Žádost nelze přijmout, protože jí druhá strana zrušila.",
      "requestNotFound":
        "Žádost nelze přijmout, protože druhá strana odstranila svůj účet.",
      "otherSideAccountDeleted": "Protistrana smazala účet",
      "createOfferNudge":
        "Rozšiř svůj dosah v tvé sociální síti a buď první, kdo předloží nabídku na základě daných kritérií.",
      "offerAuthorSpeaks": "{{name}} mluví {{spokenLanguages}}"
    },
    "termsOfUse": {
      "termsOfUse": "Podmínky užití",
      "privacyPolicy": "Ochrana soukromí",
      "dontHaveTime":
        "Nemáš čas si vše přečíst? Podívej se na často kladené otázky.",
      "cautiousNoticeAboutMachineTranslation":
        "Upozornění: Následující text byl strojově přeložen, pro přístup k původní anglické verzi prosím pokračuj na webové stránky."
    },
    "faqs": {
      "faqs": "Často kladené otázky",
      "whatIsVexl": "Co je to Vexl?",
      "vexlIsPlatform":
        "Vexl je platforma kde můžeš domlouvat směnu bitcoinu v rámci své reálné sociální sítě - se svými přáteli a přáteli jejich přátel - a přitom zůstat zcela anonymní, pokud si to přeješ.",
      "whoCanSeeMyContacts": "Kdo může vidět moje kontakty?",
      "peopleWhomYouAllowToSee":
        "Lidé, kterým dovolíš vidět tvou identitu, mohou vidět tvoje jméno a profilový obrázek, nic víc.",
      "howCanIRemainAnonymous":
        "Jak mohu zůstat anonymní a přitom být součástí Vexlu?",
      "byDefaultYouParticipateInTheNetwork":
        "Ostatní účastníci sítě tě uvidí pod tvým Vexl jménem a avatarem, které ti byly přiděleny při registraci. Svou identitu můžeš odhalit pouze pro konkrétní obchod v našem zabezpečeném, end-to-end šifrovaném chatu.",
      "howCanIMakeSure":
        "Jak se mohu ujistit, že osoba, se kterou mluvím, je ta, se kterou chci mluvit?",
      "oneChallenge":
        "Jedním z úskalí skutečně anonymních komunikačních systémů, jako je Vexl, je to, že někdy musíte ověřit totožnost osoby, se kterou komunikujš! V takových případech je nejlepší použít zabezpečený sekundární komunikační kanál, aby jsi si s druhou osobou potvrdil, že jste oba ti, za které se vydáváte.",
      "howCanIEnsure":
        "Jak se mohu ujistit, že moje komunikace a obchody jsou soukromé a šifrované?",
      "vexlIsOpensource":
        "Vexl má otevřený zdrojový kód, je tzv. open source - kdokoli v něm může hledat zadní vrátka nebo škodlivé úmysly. Můžeš se taky podívat na zprávu z nezávislého bezpečnostního auditu.",
      "howCanYouEnsure": "Jak můžete zajistit ochranu mých údajů?",
      "vexlIsDesigned":
        "Vexl je navržen tak, aby nikdy neshromažďoval ani neukládal žádné citlivé informace. Ke zprávám a dalšímu obsahu nemáme my ani jiné třetí strany přístup, protože jsou vždy end-to-end šifrovány. Naše podmínky poskytování služeb a zásady ochrany osobních údajů jsou k dispozici níže.",
      "howDoIContactVexl": "Jak mohu kontaktovat Vexl ?",
      "youCanAlwaysReachOutToUs":
        "Vždy se na nás můžeš obrátit prostřednictvím e-mailu: support@vexl.it. Nebo se s námi můžeš setkat během svého příštího P2P obchodu! 😻"
    },
    "offerForm": {
      "myNewOffer": "Nová nabídka",
      "iWantTo": "Chci",
      "sellBitcoin": "Prodat Bitcoin",
      "buyBitcoin": "Koupit Bitcoin",
      "amountOfTransaction": {
        "amountOfTransaction": "Částka",
        "pleaseSelectCurrencyFirst": "Nejdřív si vyber měnu",
        "pleaseSelectLocationFirst": "Nejdřív si vyber místo"
      },
      "premiumOrDiscount": {
        "premiumOrDiscount": "Premium nebo sleva",
        "youBuyForTheActualMarketPrice":
          "Kupuješ za skutečnou tržní cenu. Pohni s posuvníkem a nakup levněji nebo rychleji.",
        "theOptimalPositionForMostPeople":
          "Optimální pozice pro většinu lidí. Nakupuješ o něco rychleji, ale za trochu vyšší cenu.",
        "youBuyReallyFast":
          "Nakupuješ opravdu rychle, ale hodně nad tržní cenou.",
        "youBuyPrettyCheap":
          "Nakupuješ poměrně levně, ale může trvat o něco déle, než najdeš prodávajícího.",
        "youBuyVeryCheaply":
          "Nakupuješ velmi levně, ale může chvíli trvat, než najdeš prodávajícího.",
        "buyFaster": "Nakupuješ rychleji",
        "buyCheaply": "Nakupuješ levně",
        "youSellForTheActualMarketPrice":
          "Prodáváš za skutečnou tržní cenu. Pohni s posuvníkem a prodávej rychleji nebo vydělej víc.",
        "youEarnBitMore": "Vyděláš o něco víc, ale může to trvat o něco déle.",
        "youWantToEarnFortune":
          "Chceš vydělat majlant, ale může trvat roky, než najdeš kupce.",
        "youSellSlightlyFaster":
          "Prodáváš o něco rychleji, ale trochu pod tržní cenou.",
        "youSellMuchFaster":
          "Prodáváš mnohem rychleji, ale hluboko pod tržní cenou",
        "youBuyBtcFor": "Nakupuješ BTC za",
        "youSellBtcFor": "Prodávaš BTC za",
        "marketPrice": "tržní cena",
        "sellFaster": "Prodat rychleji",
        "earnMore": "Vydělat více",
        "premiumOrDiscountExplained": "Vysvětlení prémia a slevy",
        "influenceImpactOfYourSellOffer":
          "Ovlivni dopad své nabídky. Prodej rychleji přidáním slevy nebo vydělej více přidáním bonusu k tržní ceně Bitcoinu.",
        "influenceImpactOfYourBuyOffer":
          "Ovlivni dopad své nabídky. Nakup rychleji přidáním slevy nebo nakup více přidáním bonusu k tržní ceně Bitcoinu.",
        "playWithItAndSee":
          "Pohni posuvníkem a zjisti, jak to ovlivní zájem ostatních.",
        "plus": "+",
        "minus": "-",
        "youEarnSoMuchMore":
          "Vyděláš mnohem více, ale může to trvat o něco déle."
      },
      "buyCheaperByUsingDiscount":
        "Nakup levněji použitím slevy nebo nakup rychleji přidáním prémia k tržní ceně Bitcoinu.",
      "sellFasterWithDiscount":
        "Prodávej rychleji pomocí slevy nebo vydělej více přidáním prémia k tržní ceně Bitcoinu.",
      "location": {
        "location": "Lokalita",
        "meetingInPerson":
          "Osobní setkání je bezpečnější. Na co si dát pozor u online obchodu?",
        "checkItOut": "Podívej se na to",
        "addCityOrDistrict": "Přidat město nebo oblast",
        "whatToWatchOutForOnline":
          "Na co si dávat pozor při obchodování online?",
        "moneySentByRandomPerson":
          "Peníze zaslané náhodnou osobou mohou mít kriminální původ a mohou být vystopovatelné.",
        "neverSendCrypto": "Nikdy neposílej Bitcoin před obdržením platby.",
        "alwaysVerifyTheName":
          "Vždy si ověř jméno majitele účtu, od kterého jsi platbu obdržel, jestli sedí s deklarovanou identitou protistrany.",
        "forwardTheAddress":
          "Adresu předej bezpečným způsobem a nezapomeň ji ověřit jiným bezpečným kanálem."
      },
      "inPerson": "Osobně",
      "online": "Online",
      "paymentMethod": {
        "paymentMethod": "Platební metoda",
        "cash": "Hotovost",
        "bank": "Banka",
        "revolut": "Online platba"
      },
      "network": {
        "network": "Síť",
        "lightning": "Lightning",
        "theBestOption":
          "Nejlepší volba pro nižší částky. Obvykle velmi rychlá.",
        "onChain": "On chain",
        "theBestFor": "Lepší pro poměrně velké částky. Může trvat déle."
      },
      "description": {
        "description": "Popis",
        "writeWhyPeopleShouldTake":
          "Napiš, proč by lidé měli přijmout tvoji nabídku."
      },
      "friendLevel": {
        "friendLevel": "Úroveň přátel",
        "firstDegree": "1. stupeň",
        "secondDegree": "2. stupeň",
        "noVexlers": "Žádní vexláci",
        "reachVexlers": "Dosah: {{count}} vexláků"
      },
      "publishOffer": "Zveřejnit nabídku",
      "errorCreatingOffer": "Chyba při vytváření nabídky",
      "errorSearchingForAvailableLocation":
        "Chyba při vyhledávání dostupných lokalit",
      "offerEncryption": {
        "encryptingYourOffer": "Šifrování tvé nabídky ...",
        "dontShutDownTheApp":
          "Nevypínej prosím aplikaci během šifrování nabídky. Může to trvat několik minut.",
        "forVexlers": "pro {{count}} vexláků",
        "doneOfferPoster": "Hotovo! Nabídka odeslána.",
        "yourFriendsAndFriendsOfFriends":
          "Tví přátelé a přátelé jejich přátel nyní mohou vidět tvoji nabídku.",
        "anonymouslyDeliveredToVexlers":
          "Anonymně doručeno pro {{count}} vexláků"
      },
      "noVexlersFoundForYourOffer":
        "Pro tvoji nabídku nebyl nalezen žádný vexlák",
      "errorLocationNotFilled": "Vyplň prosím lokalitu.",
      "errorDescriptionNotFilled": "Vyplň prosím popis nabídky.",
      "selectCurrency": "Výběr měny",
      "currencyYouWouldLikeToUse": "Měna, kterou chceš použít k obchodování",
      "spokenLanguages": {
        "indicatePreferredLanguage": "Zadej preferovaný jazyk",
        "ENG": "Anglicky",
        "DEU": "Německy",
        "CZE": "Česky",
        "SVK": "Slovensky",
        "PRT": "Protugalsky",
        "FRA": "Francouzsky",
        "ITA": "Italsky",
        "ESP": "Španělsky",
        "language": "Jazyk",
        "preferredLanguages": "Preferovaný jazyk"
      }
    },
    "notifications": {
      "permissionsNotGranted": {
        "title": "Notifikace nebyly povoleny.",
        "message": "Můžeš je povolit v nastavení.",
        "openSettings": "Otevřít nastavení"
      },
      "errorWhileOpening": "Došlo k chybě při otevírání notifikace.",
      "MESSAGE": {
        "title": "Nová zpráva",
        "body": "Dostal jsi novou zprávu."
      },
      "REQUEST_REVEAL": {
        "title": "Žádost o odhalení identity",
        "body": "Byl jsi požádán o odhalení své indentity."
      },
      "APPROVE_REVEAL": {
        "title": "Identita odhalena!",
        "body": "Tvoje žádost o odhalení indentity byla schválena."
      },
      "DISAPPROVE_REVEAL": {
        "title": "Žádost zamítnuta!",
        "body": "Tvoje žádost o odhalení indentity byla zamítnuta."
      },
      "REQUEST_MESSAGING": {
        "title": "Nová žádost!",
        "body": "Máš novou žádost."
      },
      "APPROVE_MESSAGING": {
        "title": "Žádost schválena!",
        "body": "Tvoje žádost byla schválena."
      },
      "DISAPPROVE_MESSAGING": {
        "title": "Žádost zamítnuta!",
        "body": "Tvoje žádost byla zamítnuta."
      },
      "DELETE_CHAT": {
        "title": "Chat byl smazán",
        "body": "Jeden z tvých chatů byl smazán."
      },
      "BLOCK_CHAT": {
        "title": "Byl jsi zablokován!",
        "body": "Někdo tě právě zablokoval."
      },
      "INACTIVITY_REMINDER": {
        "title": "Dlouho jsme o tobě neslyšeli!",
        "body":
          "Od poslední návštěvy aplikace už uběhlo hodně času. Otevři Vexl, aby tvé nabídky zůstaly aktivní!"
      },
      "preferences": {
        "marketing": {
          "title": "Marketingové notifikace",
          "body": "Dostávej novinky o nových funkcích!"
        },
        "chat": {
          "title": "Notifikace o chatu",
          "body": "Dostávej notifikace na nové žádosti a zprávy."
        },
        "inactivityWarnings": {
          "title": "Varování o neaktivitě",
          "body":
            "Dáme ti vědět, když by tvé nabídky měly být kvůli neaktivitě vymazány."
        },
        "marketplace": {
          "title": "marketplace",
          "body": "marketplace"
        },
        "newOfferInMarketplace": {
          "title": "Notifikace o nabýdkách",
          "body": "Dostávej notifikace o nových nabídkách."
        },
        "newPhoneContacts": {
          "title": "Notifikace o nových kontaktech",
          "body": "Dostávej notifikace o nových kontaktech v síti."
        },
        "offer": {
          "title": "offer",
          "body": "offer"
        },
        "screenTitle": "Nastavení notifikací"
      },
      "REQUEST_CONTACT_REVEAL": {
        "title": "Žádost o telefonní číslo",
        "body": "Byli jsi požádán o sdělení svého telefonního čísla."
      },
      "APPROVE_CONTACT_REVEAL": {
        "title": "Telefonní číslo odhaleno!",
        "body": "Tvá žádost o odhalení telefonního čísla byla schválena."
      },
      "DISAPPROVE_CONTACT_REVEAL": {
        "title": "Žádost zamítnuta!",
        "body": "Tvá žádost o odhalení telefonního čísla byla zamítnuta."
      },
      "NEW_OFFERS_IN_MARKETPLACE": {
        "title": "Nové nabídky na marketplace",
        "body": "Máš nové nabídky na marketplace"
      },
      "NEW_CONTACTS_ON_DEVICE": {
        "title": "Nemáš synchronizované všechny kontakty.",
        "body":
          "V zařízení máš nové kontakty, které jsi ještě nesynchronizoval s Vexlem. Rozšiř svou síť jejich synchronizací."
      }
    },
    "myOffers": {
      "addNewOffer": "Přidat novou nabídku",
      "activeOffers": "{{count}} aktivních nabídek",
      "filterOffers": "Filtrovat nabídky",
      "errorWhileFetchingYourOffers": "Chyba při načítání nabídek",
      "editOffer": "Upravit nabídku",
      "myOffer": "Moje nabídka",
      "offerAdded": "Přidaná {{date}}",
      "sortedByNewest": "Seřazeno podle nejnovějších",
      "sortedByOldest": "Seřazeno podle nejstarších",
      "offerToSell": "Prodáváš",
      "offerToBuy": "Nakupuješ"
    },
    "editOffer": {
      "editOffer": "Upravit nabídku",
      "active": "Aktivní",
      "inactive": "Neaktivní",
      "saveChanges": "Uložit změny",
      "offerUnableToChangeOfferActivation":
        "Aktivaci nabídky nebylo možné změnit.",
      "editingYourOffer": "Úprava tvé nabídky ...",
      "pleaseWait": "Počkej prosím",
      "offerEditSuccess": "Editace proběhla úspěšně",
      "youCanCheckYourOffer":
        "Svou nabídku můžeš zkontrolovat v sekci Moje nabídky",
      "errorEditingOffer": "Chyba při úpravě nabídky",
      "errorOfferNotFound": "Nabídka nebyla nalezena!",
      "deletingYourOffer": "Odstranění tvojí nabídky ...",
      "offerDeleted": "Nabídka odstraněna",
      "errorDeletingOffer": "Chyba při odstraňování nabídky",
      "deleteOffer": "Smazat nabídku?",
      "deleteOfferDescription":
        "Opravdu chceš smazat nabídku? Tuto akci již nikdy nebudš moct vrátit zpět."
    },
    "filterOffers": {
      "filterResults": "Filtrovat výsledky",
      "sorting": "Seřazení",
      "lowestFeeFirst": "Nejnižší poplatek",
      "highestFee": "Nejvyšší poplatek",
      "newestOffer": "Nejnovější nabídka",
      "oldestOffer": "Nejstarší nabídka",
      "lowestAmount": "Nejnižší hodnota",
      "highestAmount": "Nejvyšší hodnota",
      "selectSortingMethod": "Vyber způsob řazení",
      "searchByText": "Vyhledávání podle textu",
      "noTextFilter": "Nebyl vybrán žádný textový filtr",
      "chooseCurrency": "Vyber měnu"
    },
    "messages": {
      "yourOffer": "Tvoje nabídka",
      "theirOffer": "Nabídka protistrany",
      "listTitle": "Chaty",
      "isBuying": "nakupuje",
      "isSelling": "prodává",
      "thisWillBeYourFirstInteraction":
        "Toto bude tvoje první interakce s touto nabídkou.",
      "wellLetYouKnowOnceUserAccepts":
        "Žádost byla odeslána. Dáme ti vědět, jakmile druhá strana odpoví.",
      "messagePreviews": {
        "incoming": {
          "MESSAGE": "{{them}}: {{message}}",
          "REQUEST_REVEAL": "{{them}} požádal o odhalení identity",
          "APPROVE_REVEAL": "Identita odhalena",
          "DISAPPROVE_REVEAL": "Odhalení identity zamítnuto",
          "REQUEST_MESSAGING": "Reagoval na tvoji nabídku",
          "APPROVE_MESSAGING": "Žádost o zprávu schválena",
          "DISAPPROVE_MESSAGING": "Žádost o zprávu zamítnuta",
          "DELETE_CHAT": "{{them}} opustil chat",
          "BLOCK_CHAT": "{{them}} tě zablokoval.",
          "OFFER_DELETED": "{{them}} smazal svou nabídku.",
          "INBOX_DELETED": "{{them}} smazal chat.",
          "CANCEL_REQUEST_MESSAGING": "Požadavek na komunikaci zrušen",
          "ONLY_IMAGE": "{{them}} poslal obrázek",
          "REQUEST_CONTACT_REVEAL":
            "{{them}} chce odhalit tvé telefonní číslo.",
          "APPROVE_CONTACT_REVEAL": "Telefonní číslo odhaleno",
          "DISAPPROVE_CONTACT_REVEAL":
            "Žádost o telefonní číslo byla zamítnuta."
        },
        "outgoing": {
          "MESSAGE": "Já: {{message}}",
          "REQUEST_REVEAL": "Požádal jsi o odhalení identity",
          "APPROVE_REVEAL": "Identita odhalená",
          "DISAPPROVE_REVEAL": "Odhalení identity zamítnuto.",
          "REQUEST_MESSAGING": "Žádost odeslána",
          "APPROVE_MESSAGING": "Komunikaci jsi schválil.",
          "DISAPPROVE_MESSAGING": "Odmítnul jsi žádost o zprávu.",
          "DELETE_CHAT": "Opustil jsi chat",
          "BLOCK_CHAT": "Uživatel byl zablokován.",
          "OFFER_DELETED": "Smazal jsi nabídku",
          "INBOX_DELETED": "Smazal jsi chat.",
          "CANCEL_REQUEST_MESSAGING": "Zrušil jsi žádost o komunikaci.",
          "ONLY_IMAGE": "Poslal jsi obrázek",
          "REQUEST_CONTACT_REVEAL":
            "Tvá žádost o telefonní číslo byla odeslána.",
          "APPROVE_CONTACT_REVEAL": "Telefonní číslo bylo odhaleno",
          "DISAPPROVE_CONTACT_REVEAL":
            "Žádost o telefonní číslo byla zamítnuta."
        }
      },
      "deleteChat": "Odstránit chat",
      "askToReveal": "Požádat o odhalení identity",
      "blockUser": "Zablokovat uživatele",
      "sending": "odesílání...",
      "unknownErrorWhileSending": "Neznáma chyba při odesílání zprávy",
      "tapToResent": "Odeslat znovu.",
      "deniedByMe": "Odmítli jste žádost o komunikaci s uživatelem {{name}}.",
      "deniedByThem": "{{name}} odmítl vaši žádost o zprávu.",
      "requestMessageWasDeleted": "Uživatel neposlal žádnou úvodní zprávu.",
      "typeSomething": "Napiš něco ...",
      "offerDeleted": "Nabídka smazána",
      "leaveToo": "Taky opustit?",
      "leaveChat": "Opustit chat?",
      "deleteChatQuestion": "Smazat chat?",
      "blockForewerQuestion": "Zablokovat navždy?",
      "yesBlock": "Ano, zablokovat.",
      "deleteChatExplanation1":
        "Ukončil jsi obchod? Zavřením chatu bude tato konverzace trvale smazána.",
      "deleteChatExplanation2":
        "Tenhle krok je nevratný. Chceš tenhle chat zmazať?",
      "blockChatExplanation1":
        "Opravdu chceš uživatele zablokovat? Tento krok nelze vrátit zpět. Dobře si to rozmysli.",
      "blockChatExplanation2":
        "Opravdu chceš uživatele zablokovat? Tento krok nelze vrátit zpět. Dobře si to rozmysli.",
      "chatEmpty": "Zatím nemáš žádné chaty",
      "chatEmptyExplanation": "Začni konverzaci odesláním žádosti na nabídku.",
      "seeOffers": "Podívej se na nabídky",
      "identityRevealRequestModal": {
        "title": "Odeslat žádost o odhalení identity?",
        "text":
          "Odesláním žádosti o odhalení identity souhlasíš i s odhalením své identity.",
        "send": "Odeslat žádost"
      },
      "identityRevealRespondModal": {
        "title": "Chceš odhalit identitu? ",
        "text":
          "Pokud odhalíš svou identitu, zobrazí se také identita protistrany."
      },
      "identityAlreadyRequested":
        "V konverzaci již byl odeslán požadavek na zjištění identity",
      "identityRevealRequest": "Žádost o odhalení identity",
      "identityRevealed": "Identita odhalena",
      "identitySend": {
        "title": "Odhalení identity odeslané",
        "subtitle": "čekání na odpověď"
      },
      "tapToReveal": "Stiskni pro odhalení nebo zamítnutí",
      "letsRevealIdentities": "Pojďme si odhalit identity!",
      "reveal": "Odhalit",
      "themDeclined": "{{name}} odmítl",
      "youDeclined": "Odmítl jsi",
      "reportOffer": "Nahlásit nabídku",
      "ended": "Ukončeno",
      "textMessageTypes": {
        "REQUEST_MESSAGING": "Reakce na tvou nabídku: {{message}}",
        "CANCEL_REQUEST_MESSAGING": "Tento požadavek byl zrušen.",
        "DISAPPROVE_MESSAGING": "Tento požadavek byl zamítnut.",
        "APPROVE_MESSAGING":
          "Žádost byla schválena, nyní můžete projednat podrobnosti."
      },
      "youHaveAlreadyTalked":
        "S tímto uživatelem už jste si psali. Stisknutím zobrazíš historii.",
      "requestPendingActionBar": {
        "top": "Chat čeká na tvé schválení",
        "bottom": "Výše je vaše předchozí komunikace."
      },
      "showFullChatHistory":
        "S tímto uživatelem jsi již o této nabídce chatoval, stiskni pro zobrazení historie chatu.",
      "unableToRespondOfferRemoved": {
        "title": "Nabídka byla odstraněna",
        "text":
          "Odpověď není možné odeslat. Nabídka byla odstraněna. Chceš opustit chat?"
      },
      "offerWasReported": "Nabídka byla nahlášena.",
      "unableToSelectImageToSend": {
        "title": "Nebylo možné vybrat obrázek",
        "missingPermissions":
          "Vexl potřebuje povolení k přístupu k tvým obrázkům. To můžeš změnit v nastaveních."
      },
      "imageToSend": "Odeslat obrázek:",
      "actionBanner": {
        "requestPending": "Čekání na odpověď",
        "bottomText": "Předchozí komunikace je uvedena výše",
        "buttonText": "Odpovědět"
      },
      "cancelRequestDialog": {
        "title": "Jsi si jistý?",
        "description":
          "Pokud žádost o komunikaci zrušíš, druhá strana ji nebude moci přijmout.",
        "yes": "Ano, zrušit"
      },
      "contactRevealRespondModal": {
        "title": "Určitě chceš odhalit své telefonní číslo? ",
        "text": "Tahle akce odhalí protistraně tvé telefonní číslo."
      },
      "contactRevealRequestModal": {
        "title": "Požádej o telefonní číslo",
        "text": "Odesláním žádosti souhlasíš s odhalením svého čísla."
      },
      "contactAlreadyRequested": "Žádost o telefonní číslo již byla odeslaná.",
      "contactRevealRequest": "Žádost o odhalení čísla",
      "contactRevealSent": {
        "title": "Žádost o odhalení čísla byla odeslána",
        "subtitle": "Čekání na odpověď"
      },
      "letsExchangeContacts": "Vyměňme si kontakty!",
      "phoneNumberRevealed": "Telefonní číslo bylo odhaleno!",
      "phoneNumberReveal": "Odhalení telefonního čísla",
      "phoneNumberRevealDeclined": "Odhalení telefonního čísla bylo zamítnuto",
      "contactIsAlreadyInYourContactList":
        "Kontakt už byl uložen do telefonního seznamu.",
      "addUserToYourContacts": "Přidat {{name}} do kontaktů?",
      "tapToAddToYourVexlContacts": "Přidat do Vexl kontaktů.",
      "howWasTheTrade": "Jak probíhal obchod?",
      "yourAnswerIsAnonymous": "Tvoje odpověď je 100% anonymní.",
      "anyProblems": "Nějaké problémy?",
      "whatWasWrongExactly": "Co konkrétně bylo špatně?",
      "howWasCreatingNewOffer": "Jaké bylo vytváření nové nabídky?",
      "whatWasGreatAboutIt": "Co se ti líbilo?",
      "whatWorkedWellExactly": "Co fungovalo dobře?",
      "tradeChecklist": "Trade checklist",
      "vexlbotNotifications": "Vexlbot notifications"
    },
    "progressBar": {
      "ENCRYPTING_PRIVATE_PAYLOADS": "{{percentDone}}% hotovo",
      "FETCHING_CONTACTS": "",
      "CONSTRUCTING_PRIVATE_PAYLOADS":
        "Sestavení soukromého užitečného zatížení",
      "CONSTRUCTING_PUBLIC_PAYLOAD":
        "Sestavení a zašifrování veřejného užitečného zatížení",
      "SENDING_OFFER_TO_NETWORK": "Odesílaní nabídky",
      "DONE": "Hotovo"
    },
    "commonFriends": {
      "commonFriends": "Společní přátelé",
      "commonFriendsCount": "{{commonFriendsCount}} společných přátel",
      "call": "Volat"
    },
    "reportIssue": {
      "openInEmail": "Otevřít v emailu",
      "somethingWentWrong": "Něco se pokazilo?",
      "feelFreeToGetInTouch": "Kontaktuj naši podporu",
      "predefinedBody": "Ahoj! Chtěl bych nahlásit chybu..."
    },
    "AppLogs": {
      "title": "Aplikáční logy",
      "clear": "Vymazat logy",
      "export": "Exportovat logy",
      "errorExporting": "Došlo k chybě při exportování logů.",
      "warning":
        "Zapnutí logování může negativně ovlivnit rychlost aplikace a zabere více místa na zařízení",
      "anonymizeAlert": {
        "title": "Would you like to anonymize logs?",
        "text":
          "We can try to strip private keys and personal information from logs before exporting them. Always make sure to verify by yourself."
      },
      "noLogs": "Žádné logy"
    },
    "MaintenanceScreen": {
      "title": "Údržba marketplace",
      "text": "Aplikace Vexl je v údržbě. Vrať se prosím později."
    },
    "ForceUpdateScreen": {
      "title": "Je dostupná nová verze aplikace!",
      "text": "Nainstaluj si nejnovější verzi aplikace.",
      "action": "Aktualizovat"
    },
    "btcPriceChart": {
      "requestCouldNotBeProcessed":
        "Požadavek na získání aktuální ceny BTC se nezdařil."
    },
    "deepLinks": {
      "importContacts": {
        "alert": {
          "title": "Import kontaktů",
          "text":
            "Chceš importovat {{contactName}} s číslem {{contactNumber}}?"
        },
        "successAlert": {
          "title": "Kontakt přidán"
        }
      }
    },
    "qrCode": {
      "joinVexl": "Připoj se k Vexlu"
    },
    "editName": {
      "editName": "Upravit jméno",
      "errorUserNameNotValid": "Jméno není v pořádku"
    },
    "changeProfilePicture": {
      "changeProfilePicture": "Změnit profilový obrázek",
      "uploadNewPhoto": "Vybrat obrázek"
    },
    "suggestion": {
      "vexl": "Vexl",
      "suggests": "doporučuje",
      "yourAppGuide": "Tvůj průvodce aplikací",
      "addMoreContacts": "Přidat více kontaktů",
      "noOffersFromOthersYet":
        "🤔 Žádné nabídky od ostatních? Zkus přidat další kontakty a vyčkej. ✌️",
      "createYourFirstOffer":
        "👋 Vytvoř svou první nabídku na nákup nebo prodej Bitcoinu.",
      "importNewlyAddedContacts":
        "👋 Vypadá to, že máš nové kontakty. Chceš je importovat?",
      "importNow": "Importovat nyní"
    },
    "addContactDialog": {
      "addContact": "Přidat kontakt",
      "addThisPhoneNumber":
        "Chceš přidat toto telefonní číslo do Vexl kontaktů?",
      "addContactName": "Přidat jméno kontaktu",
      "contactAdded": "Kontakt přidán",
      "youHaveAddedContact":
        "Přidal jsi {{contactName}} do svých Vexl kontaktů.",
      "contactAlreadyInContactList":
        "Kontakt už byl uložen do telefonního seznamu.",
      "wouldYouLikeToChangeTheName":
        "Chceš pro toto číslo změnit jméno z uloženého {{name}}?",
      "keepCurrent": "Ponechat",
      "contactUpdated": "Kontakt aktualizován",
      "youHaveSuccessfullyUpdatedContact":
        "Vexl kontakty byly úspěšně aktualizovány."
    },
    "qrScanner": {
      "title": "Naskenuj QR kód jiného uživatele.",
      "invalidQrCodeScanned": "Naskenovaný QR kód je chybný.",
      "missingCameraPermissions": "Chybějící oprávnění pro fotoaparát.",
      "grantPermissions": "Získat povolení",
      "grantPermissionsInSettings":
        "Povolení nebylo možné získat. Chceš-li naskenovat QR kód, otevři nastavení a povol Vexlu používání fotoaparát.",
      "openSettings": "Otevřít nastavení"
    },
    "feedback": {
      "objection": {
        "APP": "Aplikace",
        "PROCESS": "Proces",
        "RESPONDING_TIME": "Reakční doba",
        "CANCELED_OFFER": "Zrušená nabídka",
        "IMPOSSIBLE_TO_AGREE": "Nemožné se dohodnout",
        "LEFT_THE_CHAT": "Opustil/a chat",
        "DID_NOT_SHOW_UP": "Protistrana nepřišla",
        "I_MET_NEW_FRIEND": "Potkal/a jsem nového přítele",
        "DEAL_WAS_SMOOTH": "Obchod probíhal hladce.",
        "IT_WAS_FAST": "Bylo to rychlé."
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
    },
    "": "You have added {{contactName}} to your Vexl contacts."
  }
/* JSON ends */

export default otherCs
