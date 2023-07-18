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
      "gotIt": "Mám to",
      "search": "Hledat",
      "deselectAll": "Zrušit výběr všeho",
      "selectAll": "Vybrat vše",
      "cancel": "Zrušit",
      "unknownError": "Neznámá chyba",
      "unexpectedServerResponse": "Neočekávaná odpověď serveru",
      "networkErrors": {
        "errNetwork": "Došlo k chybě sítě. Jste připojeni k internetu?",
        "errCanceled": "Požadavek byl zrušen",
        "etimedout": "Požadavek vypršel",
        "econnaborted": "Připojení bylo přerušeno"
      },
      "submit": "Odeslat",
      "cryptoError": "Neočekávaná chyba kryptografie",
      "secondsShort": "s",
      "ok": "ok",
      "request": "Požadavek",
      "back": "Zpět",
      "goBack": "Vrátit se zpět",
      "close": "Zavřít",
      "done": "Hotovo",
      "errorCreatingInbox": "Chyba při vytváření uživatelské schránky.",
      "accept": "Přijmout",
      "decline": "Odmítnout",
      "youSure": "Určitě?",
      "nope": "Ne",
      "yesDelete": "Ano, vymazat",
      "more": "Více na",
      "yes": "Ano",
      "no": "Ne",
      "myOffers": "Moje nabídky",
      "errorOpeningLink": {
        "message": "Chyba při otvírání linku.",
        "text": "Zkopírovat do schránky?",
        "copy": "Zkopírovat a zavřít"
      },
      "nice": "Dobře",
      "success": "Povedlo se",
      "requested": "Požádáno",
      "now": "Teď",
      "declined": "Zamítnuto",
      "reset": "Reset",
      "you": "Vy",
      "allow": "Povolit",
      "currency": "Měna",
      "whatDoesThisMean": "Co znamená '{{term}}'?",
      "learnMore": "Dovědet se víc",
      "unableToShareImage": "Unable to share the image",
      "requestAgain": "Request again"
    },
    "loginFlow": {
      "anonymityNotice": "Bez tvého svolení jej nikdo neuvidí. Ani my.",
      "intro": {
        "title1": "Anonymně se spoj se svými kontakty.",
        "title2": "Podívej se na jejich nabídky.",
        "title3": "Začněte chatovat, odhalte své identity a obchodujte."
      },
      "start": {
        "subtitle": "Vítej! Chceš začít vexlovat?",
        "touLabel": "Souhlasím s",
        "termsOfUse": "podmínkami"
      },
      "anonymizationNotice": {
        "title": "Tvoje identita bude anonymizována.",
        "text":
          "Nikdo neuvidí tvoje skutečné jméno a profilový obrázek, dokud je neodhalíš pro konkrétní obchod. Dokonce i my. Nejprve nastavíme tvoji skutečnou identitu."
      },
      "name": {
        "prompt": "Jak ti říkají kamarádi?",
        "placeholder": "Jméno nebo přezdívka",
        "nameValidationError":
          "Jméno by mělo mít alespoň 1 znak a maximálně 50 znaků."
      },
      "photo": {
        "title": "Ahoj {{name}}! Vyber si svoji profilovou fotku.",
        "selectSource": "Vyber si, odkud chceš obrázek nahrát",
        "camera": "Fotoaparát",
        "gallery": "Galerie",
        "permissionsNotGranted": "Oprávnění nebyla udělena.",
        "nothingSelected": "Nebyl vybrán žádný obrázek"
      },
      "anonymization": {
        "beforeTitle": "Tohle je tvůj soukromej profil",
        "afterTitle": "Identita anonymizována!",
        "action": "Anonymizovat",
        "afterDescription":
          "Takto tě uvidí ostatní uživatelé, než jim odhalíš svůj soukromý profil."
      },
      "phoneNumber": {
        "title": "Jaké je tvoje telefonní číslo?",
        "placeholder": "Telefonní číslo",
        "text":
          "Abychom vás mohli spojit s komunitou Vexl, musíte zadat své telefonní číslo.",
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
        "retryCountdown": "Neobdržel jsi kód? Zkus ho poslat znova.",
        "retry": "Neobdržel jsi kód? Zkus ho poslat znova.",
        "errors": {
          "userAlreadyExists":
            "Uživatel s tímto telefonním číslem již existuje",
          "challengeCouldNotBeGenerated":
            "Výzvu se nepodařilo vygenerovat. Zkuste to znovu později",
          "verificationNotFound": "Chybný ověřovací kód.",
          "UserNotFound": "Uživatel nebyl nalezen. Zkus kód odeslat znovu.",
          "SignatureCouldNotBeGenerated":
            "Podpis se nepodařilo vygenerovat. Zkus to znovu později",
          "PublicKeyOrHashInvalid":
            "Veřejný klíč nebo hash je neplatný. Zkus to znovu později."
        },
        "success": {
          "title": "Tvé číslo bylo ověřeno. [nwln] Čas nastavit tvůj profil.",
          "errorWhileParsingSessionForInternalState":
            "Chyba při ukládání uživatele"
        }
      },
      "importContacts": {
        "title": "Pojďme nyní najít tvoje přátele!",
        "text":
          "Vexl používá tvojí reálnou sociální síť - tvoje přátele a jejich přátele. Čím více kontaktů přidáš, tím více nabídek uvidíš.",
        "anonymityNotice": "Vaše kontakty nemůže nikdo vidět. Dokonce ani my.",
        "action": "Import kontaktů"
      }
    },
    "postLoginFlow": {
      "contactsExplanation": {
        "title": "Pojďme nyní najít tvoje přátele!",
        "text":
          "Vexl používá tvojí reálnou sociální síť - tvoje přátele a jejich přátele. Čím více kontaktů přidáte, tím více nabídek uvidíte.",
        "anonymizationCaption":
          "Tvé kontakty neuvidí nikdo další. Dokonce ani my."
      },
      "importContactsButton": "Import kontaktů",
      "contactsList": {
        "addContact": "Ruční přidání kontaktu {{number}}",
        "inputPlaceholder": "Vyhledávání nebo přidání čísla",
        "nothingFound": {
          "title": "Nebyl nalezen žádný kontakt.",
          "text":
            "Chceš-li přidat telefonní číslo napřímo, zadej ho do vyhledávacího řádku (s předčíslím země)."
        },
        "toAddCustomContact":
          "Chceš-li přidat telefonní číslo napřímo, zadej ho do vyhledávacího řádku (s předčíslím země)."
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
          "notAvailableOnEmulator": "Oznámení nejsou v emulátoru k dispozici"
        },
        "vexlCantBeUsedWithoutNotifications":
          "Aplikaci Vexl není možné používat bez notifikací."
      }
    },
    "settings": {
      "yourReach": "Tvůj dosah: {{number}} vexlákov",
      "items": {
        "changeProfilePicture": "Změnit profilový obrázek",
        "editName": "Upravit jméno",
        "contactsImported": "Správa kontaktů",
        "xFriends": "{{number}} přátel",
        "setPin": "Nastavit PIN",
        "faceId": "Face ID",
        "allowScreenshots": "Povolit screenshoty",
        "allowScreenshotsDescription":
          "Zakázat uživatelům pořizovat snímky chatu",
        "termsAndPrivacy": "Podmínky a ochrana osobních údajů",
        "faqs": "Podmínky použití a Ochrana soukromí",
        "reportIssue": "Nahlásit problém",
        "inAppLogs": "Aplikační logy",
        "requestKnownData": "Vyžádání údajů",
        "followUsOn": "Sleduj nás na",
        "twitter": "Twitter",
        "twitterUrl": "https://twitter.com/vexl",
        "readMoreOn": "Přečti si více na",
        "medium": "Medium",
        "mediumUrl": "https://blog.vexl.it",
        "learnMoreOn": "Další informace na",
        "website": "Vexl.it",
        "websiteUrl": "https://vexl.it",
        "deleteAccount": "Smazat účet",
        "supportEmail": "support@vexl.it"
      },
      "noLogoutExplanation":
        "Chceš se odhlásit? Taková možnost ve Vexlu není - můžeš ale smazat účet.",
      "support":
        "Pokud se ti Vexl líbí, budeme rádi za tvůj příspěvek v tvrdé měně.",
      "version": "Verze aplikace Vexl: Vxl: {{version}}",
      "logoutDialog": {
        "title": "Smazat účet?",
        "title2": "jsi si jistý ?",
        "description":
          "Opravdu chcete smazat svůj účet? Tuto akci již nikdy nebudete moci vrátit zpět."
      }
    },
    "offer": {
      "title": "Nabídka",
      "cashOnly": "Pouze v hotovosti",
      "onlineOnly": "Pouze online",
      "upTo": "Až do",
      "forSeller": "Pro prodávajícího",
      "forBuyer": "Pro kupujícího",
      "bank": "Banka",
      "revolut": "Online platby",
      "isSelling": "prodává",
      "isBuying": "kupuje",
      "directFriend": "Přímý přítel",
      "friendOfFriend": "Přítel přítele",
      "buy": "Koupit",
      "sell": "Prodat",
      "filterOffers": "Filtrovat nabídky",
      "numberOfCommon": "{{number}} společné",
      "offerNotFound": "Nabídka nebyla nalezena. Možná byla smazána autorem",
      "inputPlaceholder": "Sem napiš zprávu...",
      "sendRequest": "Odeslat žádost",
      "report": {
        "areYouSureTitle": "Nahlásit nabídku?",
        "areYouSureText":
          "Skutečně chceš nahlásit tuhle nabídku? Tahle akce je nevratná.",
        "yes": "Ano, nahlásit",
        "thankYou": "Děkujeme!",
        "inappropriateContentWasReported":
          "Nevhodný obsah byl anonymně nahlášen."
      },
      "goToChat": "Přejděte na chat",
      "requestStatus": {
        "requested":
          "Byla odeslána žádost o obchodování. Dáme vám vědět, jakmile bude přijata.",
        "accepted": "Your request was accepted.",
        "denied": "Your request was declined.",
        "initial": "This will be your first interaction with this offer.",
        "cancelled": "You have cancelled trade request for this offer.",
        "deleted":
          "You have already interacted with this offer before, but you have deleted the chat",
        "otherSideLeft":
          "You have already interacted with this offer before, but other side has left the chat.",
        "leaved": "You have already interacted with this offer before"
      },
      "listEmpty": "Tvůj marketplace se právě zahřívá. Vrať se za pár minut!",
      "emptyAction": "Přidat novou nabídku",
      "createOfferAndReachVexlers":
        "Tvůj dosah je {{reachNumber}} vexláků.\nNaimportuj víc kontaktů abys viděl nabídky",
      "filterActive": "Filtr aktivní",
      "totalOffers": "Celkově: {{totalCount}} nabídek",
      "notImportedAnyContacts":
        "Nemáš importované žádné kontakty. Import kontaktů ti umožní zobrazit nabídky z tvé sítě.",
      "socialNetworkTooSmall":
        "Z důvodu importování malého množství kontaktů je možné, že neuvidíš žádné nabídky.",
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
      "rerequestTomorrow": "You can sent another request tomorrow",
      "rerequestDays": "You can sent another request in {{days}} days",
      "rerequest": "Odeslat žádost znova",
      "cancelRequest": "Zrušit žádost",
      "requestWasCancelledByOtherSide":
        "Žádost nelze přijmout, protože jí druhá strana zrušila.",
      "requestNotFound":
        "Žádost nelze přijmout, protože druhá strana odstranila svůj účet."
    },
    "termsOfUse": {
      "termsOfUse": "Podmínky používání",
      "privacyPolicy": "Zásady ochrany osobních údajů",
      "dontHaveTime":
        "Nemáte čas to všechno číst? Podívejte se na často kladené otázky."
    },
    "faqs": {
      "faqs": "Často kladené otázky",
      "whatIsVexl": "Co je to Vexl?",
      "vexlIsPlatform":
        "Vexl je platforma kde můžeš domlouvat směnu bitcoinu v rámci své reálné sociální sítě - se svými přáteli a přáteli jejich přátel - a přitom zůstat zcela anonymní, pokud si to přeješ.",
      "whoCanSeeMyContacts": "Kdo může vidět mé kontakty?",
      "peopleWhomYouAllowToSee":
        "Lidé, kterým dovolíš vidět tvou identitu, mohou vidět tvé společné přátele. To je vše.",
      "howCanIRemainAnonymous":
        "Jak mohu zůstat anonymní a přitom být součástí Vexlu?",
      "byDefaultYouParticipateInTheNetwork":
        "Ostatní účastníci sítě tě uvidí pod tvým Vexl jménem a avatarem, které ti byly přiděleny při registraci. Svou identitu můžeš odhalit pouze pro konkrétní obchod v našem zabezpečeném, end-to-end šifrovaném chatu.",
      "howCanIMakeSure":
        "Jak se mohu ujistit, že osoba, se kterou mluvím, je ta, se kterou chci mluvit?",
      "oneChallenge":
        "Jedním z úskalí skutečně anonymních komunikačních systémů, jako je Vexl, je to, že někdy musíte ověřit totožnost osoby, se kterou komunikujete! V takových případech je nejlepší použít zabezpečený sekundární komunikační kanál, aby jsi si s druhou osobou potvrdil, že jste oba ti, za které se vydáváte.",
      "howCanIEnsure":
        "Jak se mohu ujistit, že moje komunikace a obchody jsou soukromé a šifrované?",
      "vexlIsOpensource":
        "Vexl má otevřený zdrojový kód - kdokoli v něm může hledat zadní vrátka nebo škodlivé úmysly. Můžeš se taky podívat na zprávu z nezávislého bezpečnostního auditu.",
      "howCanYouEnsure": "Jak můžete zajistit ochranu mých údajů?",
      "vexlIsDesigned":
        "Vexl je navržen tak, aby nikdy neshromažďoval ani neukládal žádné citlivé informace. Ke zprávám a dalšímu obsahu nemáme my ani jiné třetí strany přístup, protože jsou vždy šifrovány end-to-end. Naše podmínky poskytování služeb a zásady ochrany osobních údajů jsou k dispozici níže.",
      "howDoIContactVexl": "Jak mohu kontaktovat Vexl ?",
      "youCanAlwaysReachOutToUs":
        "Vždy se na nás můžeš obrátit prostřednictvím e-mailu: support@vexl.it. Nebo se s námi můžeš setkat během svého příštího P2P obchodu! 😻"
    },
    "offerForm": {
      "myNewOffer": "Nová nabídka",
      "iWantTo": "Chci",
      "sellBitcoin": "Prodat bitcoin",
      "buyBitcoin": "Koupit Bitcoin",
      "amountOfTransaction": {
        "amountOfTransaction": "Částka",
        "pleaseSelectCurrencyFirst": "Nejdřív si vyber měnu",
        "pleaseSelectLocationFirst": "Nejdřív si vyber místo"
      },
      "premiumOrDiscount": {
        "premiumOrDiscount": "Premium nebo sleva",
        "youBuyForTheActualMarketPrice":
          "Kupuješ za skutečnou tržní cenu. Pohni s posuvníkem a prodávej rychleji nebo vydělej více.",
        "theOptimalPositionForMostPeople":
          "Optimální pozice pro většinu lidí. Nakupuješ o něco rychleji, ale za trochu vyšší cenu",
        "youBuyReallyFast":
          "Nakupuješ opravdu rychle, ale hodně nad tržní cenou",
        "youBuyPrettyCheap":
          "Nakupuješ poměrně levně, ale může trvat o něco déle, než najdeš prodávajícího",
        "youBuyVeryCheaply":
          "Nakupuješ velmi levně, ale může chvíli trvat, než najdeš prodávajícího",
        "buyFaster": "Nakupuješ rychleji",
        "buyCheaply": "Nakupuješ levně",
        "youSellForTheActualMarketPrice":
          "Prodáváš za skutečnou tržní cenu. Pohni s posuvníkem a prodávej rychleji nebo vydělávej více.",
        "youEarnBitMore": "Vyděláš o něco více, ale může to trvat o něco déle.",
        "youWantToEarnFortune":
          "Chceš vydělat majlant, ale může trvat roky, než najdeš kupce.",
        "youSellSlightlyFaster":
          "Prodáváš o něco rychleji, ale trochu pod tržní cenou.",
        "youSellMuchFaster":
          "Prodáváš mnohem rychleji, ale hluboko pod tržní cenou",
        "youBuyBtcFor": "Kupujete BTC za",
        "youSellBtcFor": "Prodáváte BTC za",
        "marketPrice": "tržní cenu",
        "sellFaster": "Prodáváš rychleji",
        "earnMore": "Vyděláš více",
        "premiumOrDiscountExplained": "Vysvětlení prémia a slevy",
        "influenceImpactOfYourSellOffer":
          "Ovlivni dopad své nabídky. Prodávej rychleji přidáním slevy nebo vydělávej více přidáním bonusu k tržní ceně bitcoinu.",
        "influenceImpactOfYourBuyOffer":
          "Ovlivni dopad své nabídky. Nakupuj rychleji přidáním slevy nebo nakupuj více přidáním bonusu k tržní ceně bitcoinu.",
        "playWithItAndSee":
          "Pohni posuvníkem a zjisti, jak to ovlivní zájem ostatních.",
        "plus": "+",
        "minus": "-"
      },
      "buyCheaperByUsingDiscount":
        "Nakup levněji použitím slevy nebo nakup rychleji přidáním prémia k tržní ceně bitcoinu.",
      "sellFasterWithDiscount":
        "Prodávej rychleji pomocí slevy nebo vydělej více přidáním prémia k tržní ceně bitcoinu.",
      "location": {
        "location": "Lokalita",
        "meetingInPerson":
          "Osobní setkání je bezpečnější. Na co si dát pozor u online obchodů?",
        "checkItOut": "Podívej se na to",
        "addCityOrDistrict": "Přidejte město nebo okres",
        "whatToWatchOutForOnline": "Na co si dát pozor online?",
        "moneySentByRandomPerson":
          "Peníze zaslané náhodnou osobou mohou mít kriminální původ a mohou být vystopovatelné.",
        "neverSendCrypto": "Nikdy neposílejte bitcoin před obdržením platby.",
        "alwaysVerifyTheName":
          "Vždy si ověř jméno majitele účtu, od kterého jsi platbu obdržel, jestli sedí s deklarovanou identitou protistrany.",
        "forwardTheAddress":
          "Adresu předej bezpečným způsobem a nezapomeň ji ověřit jiným bezpečným kanálem."
      },
      "inPerson": "Osobně",
      "online": "Online",
      "paymentMethod": {
        "paymentMethod": "Způsob platby",
        "cash": "V hotovosti",
        "bank": "Banka",
        "revolut": "Online platby"
      },
      "network": {
        "network": "Síť",
        "lightning": "Lightning",
        "theBestOption":
          "Nejlepší volba pro opravdu malé částky. Obvykle super rychlá.",
        "onChain": "On chain",
        "theBestFor": "Lepší pro poměrně velké částky. Může to trvat déle."
      },
      "description": {
        "description": "Popis",
        "writeWhyPeopleShouldTake":
          "Napište, proč by lidé měli vaši nabídku přijmout."
      },
      "friendLevel": {
        "friendLevel": "Úroveň přítele",
        "firstDegree": "1. stupeň",
        "secondDegree": "2. stupeň",
        "noVexlers": "Žádní vexláci",
        "reachVexlers": "Dosah: {{count}} vexláků"
      },
      "publishOffer": "Zveřejnit nabídku",
      "errorCreatingOffer": "Chyba při vytváření nabídky",
      "errorSearchingForAvailableLocation":
        "Chyba při vyhledávání dostupných míst",
      "offerEncryption": {
        "encryptingYourOffer": "Šifrování nabídky ...",
        "dontShutDownTheApp":
          "Během šifrování nevypínejte aplikaci. Může to trvat několik minut.",
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
      "errorDescriptionNotFilled": "Vyplň prosím popis nabídky."
    },
    "notifications": {
      "permissionsNotGranted": {
        "title": "Notifikace nebyly povoleny.",
        "message": "Můžeš je povolit v nastavení",
        "openSettings": "Otevřít nastavení"
      },
      "errorWhileOpening": "Došlo k chybě při otevírání notifikace."
    },
    "myOffers": {
      "addNewOffer": "Přidat novou nabídku",
      "activeOffers": "{{count}} aktivní nabídky",
      "filterOffers": "Filtrovat nabídky",
      "errorWhileFetchingYourOffers": "Chyba při načítání nabídek",
      "editOffer": "Upravit nabídku",
      "myOffer": "Moje nabídka",
      "offerAdded": "Přidáno {{date}}",
      "sortedByNewest": "Seřazeno podle nejnovějších",
      "sortedByOldest": "Seřazeno podle nejstaršího"
    },
    "editOffer": {
      "editOffer": "Upravit nabídku",
      "active": "Aktivní",
      "inactive": "Neaktivní",
      "saveChanges": "Uložit změny",
      "offerUnableToChangeOfferActivation": "Nelze změnit aktivaci nabídky",
      "editingYourOffer": "Úprava nabídky ...",
      "pleaseWait": "Počkej prosím",
      "offerEditSuccess": "Editace proběhla úspěšně",
      "youCanCheckYourOffer":
        "Svou nabídku můžeš zkontrolovat v sekci Moje nabídky",
      "errorEditingOffer": "Chyba při úpravě nabídky",
      "errorOfferNotFound": "Nabídka nebyla nalezena!",
      "deletingYourOffer": "Odstranění tvojí nabídky ...",
      "offerDeleted": "Nabídka smazána",
      "errorDeletingOffer": "Chyba při mazání nabídky",
      "deleteOffer": "Smazat nabídku?",
      "deleteOfferDescription":
        "Opravdu chcete smazat nabídku? Tuto akci již nikdy nebudete moci vrátit zpět."
    },
    "filterOffers": {
      "filterResults": "Filtrování výsledků",
      "sorting": "Třídění",
      "lowestFeeFirst": "Nejnižší poplatek",
      "highestFee": "Nejvyšší poplatek",
      "newestOffer": "Nejnovější nabídka",
      "oldestOffer": "Nejstarší nabídka",
      "lowestAmount": "Nejnižší částka",
      "highestAmount": "Nejvyšší částka",
      "selectSortingMethod": "Zvolte způsob řazení"
    },
    "messages": {
      "yourOffer": "Tvoje nabídka",
      "theirOffer": "Nabídka protistrany",
      "listTitle": "Chaty",
      "isBuying": "kupuje",
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
          "CANCEL_REQUEST_MESSAGING": "Zrušil žádost o zprávu"
        },
        "outgoing": {
          "MESSAGE": "Já: {{message}}",
          "REQUEST_REVEAL": "Požádali jste o odhalení identity",
          "APPROVE_REVEAL": "Identita odhalena",
          "DISAPPROVE_REVEAL": "Odhalení identity odmítnuto",
          "REQUEST_MESSAGING": "Žádost odeslána",
          "APPROVE_MESSAGING": "Schválili jste zasílání zpráv",
          "DISAPPROVE_MESSAGING": "Odmítnul jsi žádost o zprávu.",
          "DELETE_CHAT": "Opustil jsi chat",
          "BLOCK_CHAT": "Uživatel byl zablokován",
          "OFFER_DELETED": "Smazal jsi nabídku",
          "INBOX_DELETED": "Smazal jsi chat.",
          "CANCEL_REQUEST_MESSAGING": "Žádost o zprávu zrušena"
        }
      },
      "deleteChat": "Odstránit chat",
      "askToReveal": "Požádat o odhalení identity",
      "blockUser": "Zablokovat uživatele",
      "sending": "zasílání...",
      "unknownErrorWhileSending": "Neznámá chyba při odesílání zprávy",
      "tapToResent": "Klepněte na pro opětovné odeslání.",
      "deniedByMe": "Odmítli jste žádost o zaslání zprávy s {{name}}.",
      "deniedByThem": "{{name}} odmítl vaši žádost o zprávu.",
      "requestMessageWasDeleted": "Uživatel neposlal žádnou úvodní zprávu.",
      "typeSomething": "Zadejte něco ...",
      "offerDeleted": "Nabídka smazána",
      "leaveToo": "Odejít také?",
      "leaveChat": "Opustit chat?",
      "deleteChatQuestion": "Smazat chat?",
      "blockForewerQuestion": "Zablokovat navždy?",
      "yesBlock": "Ano, zablokovat",
      "deleteChatExplanation1":
        "Skončili jste s obchodováním? Ukončení chatu znamená, že vaše konverzace bude trvale smazána.",
      "deleteChatExplanation2": "Tento krok je nevratný.",
      "blockChatExplanation1":
        "Opravdu chceš uživatele zablokovat? Tento krok nejde vrátit zpět. Dobře si to rozmysli.",
      "blockChatExplanation2":
        "Opravdu chceš uživatele zablokovat? Tento krok nejde vrátit zpět. Dobře si to rozmysli.",
      "chatEmpty": "Zatím žádné chaty",
      "chatEmptyExplanation": "Začni konverzaci odesláním žádosti na nabídku.",
      "seeOffers": "Podívejte se na nabídky",
      "identityRevealRequestModal": {
        "title": "Poslat žádost o odhalení identity?",
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
        "title": "Poslali jste žádost o odhalení identity",
        "subtitle": "Čekám na odpověď...."
      },
      "tapToReveal": "Klikni pro odhalení identity nebo zamítnutí",
      "letsRevealIdentities": "Pojďme si odhalit identity!",
      "reveal": "Odhalit",
      "themDeclined": "{{name}} odmítl",
      "youDeclined": "Odmítli jste",
      "reportOffer": "Nahlásit nabídku",
      "ended": "Ukončeno",
      "textMessageTypes": {
        "REQUEST_MESSAGING": "Request sent: {{message}}",
        "CANCEL_REQUEST_MESSAGING": "Request cancelled",
        "DISAPPROVE_MESSAGING": "Request denied",
        "APPROVE_MESSAGING": "Request approved"
      },
      "youHaveAlreadyTalked":
        "S tímto uživatelem už jste si psali. Klepnutím zobrazíte historii.",
      "requestPendingActionBar": {
        "top": "Chat is waiting for your approval",
        "bottom": "Above is communication you had with the user so far"
      },
      "showFullChatHistory":
        "You have some previous communication with this user. Tap to see full chat history.",
      "unableToRespondOfferRemoved": {
        "title": "Offer was removed",
        "text":
          "Unable to send response. Author has removed the offer. Do you want to delete the chat?"
      },
      "offerWasReported": "Offer was reported"
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
      "commonFriendsCount": "{{commonFriendsCount}} společní přátelé"
    },
    "reportIssue": {
      "openInEmail": "Otevřít v emailu.",
      "somethingWentWrong": "Něco se pokazilo.",
      "feelFreeToGetInTouch": "Kontaktujte podporu",
      "predefinedBody": "Ahoj! Chtěl bych nahlásit chybu..."
    },
    "AppLogs": {
      "title": "Aplikáční logy",
      "clear": "Vymazat logy",
      "export": "Exportovat logy",
      "errorExporting": "Došlo k chybě u exportování logů.",
      "warning":
        "Zapnutí logování může negativně ovlivnit rychlost aplikace a zabere více místa na zařízení",
      "anonymizeAlert": {
        "title": "Would you like to anonymize logs?",
        "text":
          "We can try to strip private keys and personal information from logs before exporting them. Always make sure to verify by yourself."
      }
    },
    "MaintenanceScreen": {
      "title": "Údržba marketplace",
      "text": "Aplikace Vexl je v údržbě. Vraťte se prosím později."
    },
    "ForceUpdateScreen": {
      "title": "Je dostupná nová verze aplikace!",
      "text": "Nainstaluj si nejnovši verzi aplikace.",
      "action": "Aktualizovat"
    },
    "btcPriceChart": {
      "requestCouldNotBeProcessed": ":D"
    },
    "deepLinks": {
      "importContacts": {
        "alert": {
          "title": "Import kontaktu",
          "text":
            "Chcete importovat {{contactName}} s číslem {{contactNumber}}?"
        },
        "successAlert": {
          "title": "Kontakt přidán"
        }
      }
    },
    "qrCode": {
      "joinVexl": "Připoj se na Vexl"
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
        "👋 Vytvoř svou první nabídku na nákup nebo prodej Bitcoinu."
    }
  }
/* JSON ends */

export default otherCs
