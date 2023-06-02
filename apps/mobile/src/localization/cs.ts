import TosEn from './tos/en'
import PPEn from './privacyPolicy/en'

export default {
  'common': {
    'next': 'Další',
    'skip': 'Přeskočit',
    'finish': 'Dokončit',
    'confirm': 'Potvrdit',
    'continue': 'Pokračovat',
    'save': 'Uložit',
    'gotIt': 'Mám to',
    'search': 'Hledat na',
    'deselectAll': 'Zrušit výběr všeho',
    'selectAll': 'Vybrat vše',
    'cancel': 'Zrušit',
    'unknownError': 'Neznámá chyba',
    'unexpectedServerResponse': 'Neočekávaná odpověď serveru',
    'networkErrors': {
      'errNetwork': 'Došlo k chybě sítě. Jste připojeni k internetu?',
      'errCanceled': 'Požadavek byl zrušen',
      'etimedout': 'Požadavek vypršel',
      'econnaborted': 'Připojení bylo přerušeno',
    },
    'submit': 'Odeslat',
    'cryptoError': 'Neočekávaná chyba kryptografie',
    'secondsShort': 's',
    'ok': 'ok',
    'request': 'Požadavek',
    'back': 'Zpět',
    'goBack': 'Vrátit se zpět',
    'close': 'Zavřít',
    'done': 'Hotovo',
    'errorCreatingInbox': 'Chyba při vytváření uživatelské schránky.',
    'accept': 'Přijmout',
    'decline': 'Odmítnout',
    'youSure': 'Jste si jisti?',
    'nope': 'Ne',
    'yesDelete': 'Ano, vymažte',
    'more': 'Více na',
    'yes': 'Ano',
    'no': 'Ne',
    'myOffers': 'Moje nabídky',
  },
  'loginFlow': {
    'anonymityNotice': 'Dokud to nepovolíte, nikdo to neuvidí. Dokonce ani my.',
    'intro': {
      'title1': 'Importujte své kontakty anonymně.',
      'title2': 'Prohlédněte si jejich nabídky nákupu a prodeje.',
      'title3':
        'Vyžádejte si identitu těch, které se vám líbí, a obchodujte s nimi.',
    },
    'start': {
      'subtitle': 'Vítejte! Jste připraveni začít?',
      'touLabel': 'Souhlasím s',
      'termsOfUse': 'Podmínky používání',
    },
    'anonymizationNotice': {
      'title': 'Vaše identita bude anonymizována',
      'text':
        'Nikdo neuvidí vaše skutečné jméno a profilový obrázek, dokud je neodhalíte pro konkrétní obchod. Dokonce i my. Nejprve nastavíme vaši skutečnou identitu.',
    },
    'name': {
      'prompt': 'Jak vám říkají vaši přátelé?',
      'placeholder': 'Celým jménem nebo přezdívkou',
      'nameValidationError':
        'Jméno by mělo mít alespoň 1 znak a maximálně 50 znaků.',
    },
    'photo': {
      'title': 'Ahoj {{name}}! Jak vypadáš?',
      'selectSource': 'Vyberte zdroj svého obrázku',
      'camera': 'Fotoaparát',
      'gallery': 'Galerie',
      'permissionsNotGranted': 'Oprávnění nebyla udělena.',
      'nothingSelected': 'Nebyl vybrán žádný obrázek',
    },
    'anonymization': {
      'beforeTitle': 'Toto je vaše identita',
      'afterTitle': 'Identita anonymizována!',
      'action': 'Anonymizovat',
      'afterDescription':
        'Takto vás budou vidět ostatní uživatelé, dokud neodhalíte svou skutečnou identitu.',
    },
    'phoneNumber': {
      'title': 'Jaké je vaše telefonní číslo?',
      'placeholder': 'Telefonní číslo',
      'text':
        'Abychom vás mohli spojit s komunitou Vexl, zadejte své telefonní číslo.',
      'errors': {
        'invalidPhoneNumber':
          'Neplatné telefonní číslo. Zkuste prosím zadat jiné',
        'previousCodeNotExpired':
          'Ověřování tohoto telefonního čísla již probíhá. Počkejte prosím, dokud nevyprší jeho platnost',
      },
    },
    'verificationCode': {
      'title': 'Právě jsme vám zaslali kód',
      'text': 'Pro ověření jej zadejte níže',
      'inputPlaceholder': 'Váš ověřovací kód',
      'retryCountdown': 'Neobdrželi jste kód? Pošlete jej znovu',
      'retry': 'Neobdrželi jste kód? Klepněte na pro opětovné odeslání',
      'errors': {
        'userAlreadyExists': 'Uživatel s tímto telefonním číslem již existuje',
        'challengeCouldNotBeGenerated':
          'Výzvu se nepodařilo vygenerovat. Zkuste to znovu později',
        'verificationNotFound': 'Chybný ověřovací kód.',
        'UserNotFound': 'Uživatel nebyl nalezen. Zkuste kód odeslat znovu.',
        'SignatureCouldNotBeGenerated':
          'Podpis se nepodařilo vygenerovat. Zkuste to znovu později',
        'PublicKeyOrHashInvalid':
          'Veřejný klíč nebo hash je neplatný. Zkuste to znovu později',
      },
      'success': {
        'title': 'Telefon ověřen.\n Nastavíme váš profil.',
        'errorWhileParsingSessionForInternalState':
          'Chyba při ukládání uživatele',
      },
    },
    'importContacts': {
      'title': 'Pojďme nyní najít vaše přátele!',
      'text':
        'Vexl používá vaši reálnou sociální síť - vaše přátele a jejich přátele. Čím více kontaktů přidáte, tím více nabídek uvidíte.',
      'anonymityNotice': 'Vaše kontakty nemůže nikdo vidět. Dokonce ani my.',
      'action': 'Import kontaktů',
    },
  },
  'postLoginFlow': {
    'contactsExplanation': {
      'title': 'Pojďme nyní najít vaše přátele!',
      'text':
        'Vexl využívá vaši reálnou sociální síť - vaše přátele a jejich přátele. Čím více kontaktů přidáte, tím více nabídek uvidíte.',
      'anonymizationCaption': 'Vaše kontakty nikdo nevidí. Dokonce ani my.',
    },
    'importContactsButton': 'Import kontaktů',
    'contactsList': {
      'addContact': 'Ruční přidání kontaktu {{number}}',
      'inputPlaceholder': 'Vyhledávání nebo přidání čísla',
      'nothingFound': {
        'title': 'Nebyl nalezen žádný kontakt.',
        'text':
          'Chcete-li přidat telefonní číslo přímo, zadejte jej do vyhledávacího řádku (s předčíslím země).',
      },
      'toAddCustomContact':
        'Chcete-li přidat telefonní číslo přímo, zadejte jej do vyhledávacího řádku (s předvolbou země).',
    },
    'allowNotifications': {
      'title': 'Povolit oprávnění k oznámení',
      'text':
        'Povolením oznámení se dozvíte, když ostatní přijmou vaše nabídky nebo když vám přijdou zprávy.',
      'action': 'Povolit',
      'cancel': 'Přeskočit',
      'errors': {
        'permissionDenied':
          'Oprávnění není povoleno. Můžete je povolit později v nastavení systému.',
        'unknownError': 'Neznámá chyba při žádosti o oprávnění',
        'notAvailableOnEmulator': 'Oznámení nejsou v emulátoru k dispozici',
      },
    },
  },
  'settings': {
    'yourReach': 'Váš dosah: {{number}} vexlerů',
    'items': {
      'changeProfilePicture': 'Změna profilového obrázku',
      'editName': 'Upravit jméno',
      'contactsImported': 'Importované kontakty',
      'xFriends': '{{number}} přátel',
      'setPin': 'Nastavit PIN',
      'faceId': 'ID obličeje',
      'czechCrown': 'Česká koruna',
      'allowScreenshots': 'Povolit snímky obrazovky',
      'allowScreenshotsDescription':
        'Odmítnout uživatelům pořizovat snímky chatu',
      'termsAndPrivacy': 'Podmínky a ochrana osobních údajů',
      'faqs': 'Nejčastější dotazy',
      'reportIssue': 'Nahlásit problém',
      'inAppLogs': 'Záznamy v aplikaci',
      'requestKnownData': 'Vyžádání známých údajů',
      'followUsOn': 'Sledujte nás na',
      'twitter': 'Twitter',
      'twitterUrl': 'https://twitter.com/vexl',
      'readMoreOn': 'Přečtěte si více na',
      'medium': 'Médium',
      'mediumUrl': 'https://blog.vexl.it',
      'learnMoreOn': 'Další informace na',
      'website': 'Vexl.it',
      'websiteUrl': 'https://vexl.it',
      'deleteAccount': 'Smazat účet',
    },
    'noLogoutExplanation':
      'Nemůžete najít odhlášení? Nic takového neexistuje. [nwln] Ale účet můžete smazat.',
    'support':
      'Pokud se vám Vexl líbí, podpořte jeho vylepšování zasláním nějakých bitcoinů jako daru!',
    'version': 'Verze aplikace Vexl: Vxl: {{version}}',
    'logoutDialog': {
      'title': 'Smazat účet?',
      'title2': 'Jste si jistí?',
      'description':
        'Opravdu chcete smazat svůj účet? Tuto akci již nikdy nebudete moci vrátit zpět.',
    },
  },
  'offer': {
    'title': 'Nabídka',
    'cashOnly': 'Pouze v hotovosti',
    'onlineOnly': 'Pouze online',
    'upTo': 'Až do',
    'forSeller': 'Pro prodávajícího',
    'forBuyer': 'Pro kupujícího',
    'bank': 'Banka',
    'revolut': 'Revolut',
    'isSelling': 'prodává',
    'isBuying': 'kupuje',
    'directFriend': 'Přímý přítel',
    'friendOfFriend': 'Přítel přítele',
    'buy': 'Koupit',
    'sell': 'Prodej',
    'filterOffers': 'Filtrovat nabídky',
    'numberOfCommon': '{{number}} společné',
    'offerNotFound': 'Nabídka nebyla nalezena. Možná byla smazána autorem',
    'inputPlaceholder': 'Např. pojďme vyměnit mého přítele...',
    'sendRequest': 'Odeslat požadavek',
    'report': {
      'areYouSureTitle': 'Nahlásit nabídku?',
      'areYouSureText':
        'Opravdu chcete tuto nabídku nahlásit? Tuto akci již nikdy nebudete moci vrátit zpět. Rozhodujte se moudře.',
      'yes': 'Ano, nahlásit',
    },
    'goToChat': 'Přejděte na chat',
    'requestAlreadySent':
      'Byla odeslána žádost o obchodování. Dáme vám vědět, jakmile bude přijata.',
    'listEmpty': 'Tržiště je zatím prázdné',
    'emptyAction': 'Přidat novou nabídku',
  },
  'termsOfUse': {
    'termsOfUse': 'Podmínky používání',
    'privacyPolicy': 'Zásady ochrany osobních údajů',
    'dontHaveTime':
      'Nemáte čas to všechno číst? Podívejte se na často kladené otázky.',
    'termsOfUseText': TosEn,
    'privacyPolicyText': PPEn,
  },
  'faqs': {
    'faqs': 'Často kladené otázky',
    'whatIsVexl': 'Co je to Vexl?',
    'vexlIsPlatform':
      'Vexl je platforma, kde můžete obchodovat s bitcoiny v rámci své reálné sociální sítě - svých přátel a přátel jejich přátel - a přitom zůstat zcela anonymní - pokud si to přejete.',
    'whoCanSeeMyContacts': 'Kdo může vidět mé kontakty?',
    'peopleWhomYouAllowToSee':
      'Lidé, kterým dovolíte vidět vaši identitu, mohou vidět vaše společné přátele. To je vše.',
    'howCanIRemainAnonymous':
      'Jak mohu zůstat v anonymitě a přesto se účastnit Vexl?',
    'byDefaultYouParticipateInTheNetwork':
      'Ve výchozím nastavení se sítě účastníte pod svým jménem Vexl a avatarem Vexl, které vám byly přiděleny při registraci. Svou identitu můžete odhalit pouze na konkrétní obchod v našem zabezpečeném, end-to-end šifrovaném chatu.',
    'howCanIMakeSure':
      'Jak se mohu ujistit, že osoba, se kterou mluvím, je ta, se kterou chci mluvit?',
    'oneChallenge':
      'Jedním z problémů skutečně anonymních komunikačních systémů, jako je Vexl, je, že někdy je třeba ověřit totožnost osoby, se kterou hovoříte! V takových případech je nejlepší použít zabezpečený sekundární komunikační kanál, abyste si s druhou osobou potvrdili, že jste oba tím, za koho se vydáváte.',
    'howCanIEnsure':
      'Jak mohu zajistit, aby moje komunikace a obchody byly soukromé a šifrované?',
    'vexlIsOpensource':
      'Vexl je otevřený zdrojový kód - kdokoli může hledat jakákoli zadní vrátka nebo nekalé úmysly. Také se zde můžete podívat na zprávu z nezávislého bezpečnostního auditu .',
    'howCanYouEnsure': 'Jak můžete zajistit ochranu mých dat?',
    'vexlIsDesigned':
      'Vexl je navržen tak, aby nikdy neshromažďoval ani neukládal žádné citlivé informace. Ke zprávám Vexl a dalšímu obsahu nemáme přístup my ani jiné třetí strany, protože jsou vždy end-to-end šifrované, soukromé a zabezpečené. Naše podmínky poskytování služeb a zásady ochrany osobních údajů jsou k dispozici níže.',
    'howDoIContactVexl': 'Jak mohu kontaktovat společnost Vexl?',
    'youCanAlwaysReachOutToUs':
      'Vždy se na nás můžete obrátit prostřednictvím e-mailu: support@vexl.it. Pro soukromou komunikaci nám můžete také poslat e-mail e2ee. Nebo se s námi můžete setkat během svého příštího P2P obchodu! 😻',
  },
  'offerForm': {
    'myNewOffer': 'Moje nová nabídka',
    'iWantTo': 'Chci',
    'sellBitcoin': 'Prodat bitcoin',
    'buyBitcoin': 'Koupit Bitcoin',
    'currency': 'Měna',
    'czk': 'CZK',
    'eur': 'EUR',
    'usd': 'USD',
    'amountOfTransaction': {
      'amountOfTransaction': 'Částka transakce',
      'eurSymbol': '€',
      'dollarSymbol': '$',
      'czkSymbol': 'Kč',
      'pleaseSelectCurrencyFirst': 'Vyberte prosím nejprve měnu',
      'pleaseSelectLocationFirst': 'Vyberte prosím nejprve místo',
    },
    'premiumOrDiscount': {
      'premiumOrDiscount': 'Prémie nebo sleva',
      'youBuyForTheActualMarketPrice':
        'Kupujete za skutečnou tržní cenu. Pohrajte si s posuvníkem a prodávejte rychleji nebo vydělejte více.',
      'theOptimalPositionForMostPeople':
        'Optimální pozice pro většinu lidí. Nakupujete o něco rychleji, ale za trochu vyšší cenu',
      'youBuyReallyFast':
        'Nakupujete opravdu rychle, ale o tolik nad tržní cenu',
      'youBuyPrettyCheap':
        'Nakupujete poměrně levně, ale může trvat o něco déle, než najdete prodávajícího',
      'youBuyVeryCheaply':
        'Nakupujete velmi levně, ale může chvíli trvat, než najdete prodávajícího',
      'buyFaster': 'Nakupujete rychleji',
      'buyCheaply': 'Nakupujete levně',
      'youSellForTheActualMarketPrice':
        'Prodáváte za skutečnou tržní cenu. Pohrajte si s posuvníkem a prodávejte rychleji nebo vydělávejte více.',
      'youEarnBitMore': 'Vyděláte o něco více, ale může to trvat o něco déle.',
      'youWantToEarnFortune':
        'Chcete vydělat majlant, ale může trvat roky, než najdete prodejce.',
      'youSellSlightlyFaster':
        'Prodáváte o něco rychleji, ale trochu pod tržní cenou.',
      'youSellMuchFaster':
        'Prodáváte mnohem rychleji, ale hluboko pod tržní cenou',
      'youBuyBtcFor': 'Kupujete BTC za',
      'youSellBtcFor': 'Prodáváte BTC za',
      'marketPrice': 'tržní cenu',
      'sellFaster': 'Prodáváte rychleji',
      'earnMore': 'Vyděláte více',
      'premiumOrDiscountExplained': 'Vysvětlení prémie nebo slevy',
      'influenceImpactOfYourSellOffer':
        'Ovlivněte dopad své nabídky. Prodejte rychleji přidáním slevy nebo vydělejte více přidáním prémie k tržní ceně bitcoinu.',
      'influenceImpactOfYourBuyOffer':
        'Ovlivněte dopad své nabídky. Nakupujte levněji přidáním slevy nebo nakupujte rychleji přidáním prémie k tržní ceně bitcoinu.',
      'playWithItAndSee':
        'Pohrajte si s tím a zjistěte, jak to ovlivní zájem ostatních.',
      'plus': '+',
      'minus': '-',
    },
    'buyCheaperByUsingDiscount':
      'Nakupte levněji použitím slevy nebo nakupte rychleji přidáním prémie k tržní ceně bitcoinu.',
    'sellFasterWithDiscount':
      'Prodávejte rychleji pomocí slevy nebo vydělejte více přidáním prémie k tržní ceně bitcoinu.',
    'location': {
      'location': 'Umístění',
      'meetingInPerson':
        'Osobní setkání je bezpečnější. Na co si dát pozor online?',
      'checkItOut': 'Podívejte se na to',
      'addCityOrDistrict': 'Přidejte město nebo okres',
      'whatToWatchOutForOnline': 'Na co si dát pozor online?',
      'moneySentByRandomPerson':
        'Peníze zaslané náhodnou osobou mohou mít kriminální původ a mohou být dohledatelné.',
      'neverSendCrypto': 'Nikdy neposílejte kryptoměnu před obdržením platby.',
      'alwaysVerifyTheName':
        'Vždy si ověřte jméno majitele účtu, od kterého jste platbu obdrželi, s deklarovanou identitou protistrany.',
      'forwardTheAddress':
        'Adresu předejte bezpečným způsobem a nezapomeňte ji ověřit jiným bezpečným kanálem.',
    },
    'inPerson': 'Osobně',
    'online': 'Online',
    'paymentMethod': {
      'paymentMethod': 'Způsob platby',
      'cash': 'V hotovosti',
      'bank': 'Banka',
      'revolut': 'Revolut',
    },
    'network': {
      'network': 'Síť',
      'lightning': 'Blesk',
      'theBestOption':
        'Nejlepší volba pro opravdu malé částky. Obvykle mnohem rychlejší.',
      'onChain': 'V řetězci',
      'theBestFor': 'Nejlepší pro poměrně velké částky. Někdy to trvá déle.',
    },
    'description': {
      'description': 'Popis',
      'writeWhyPeopleShouldTake':
        'Napište, proč by lidé měli vaši nabídku přijmout.',
    },
    'friendLevel': {
      'friendLevel': 'Úroveň přítele',
      'firstDegree': '1. stupeň',
      'secondDegree': '2. stupeň',
      'noVexlers': 'Žádné vexláky',
      'reachVexlers': 'Dosáhnout {{count}} vexláků',
    },
    'publishOffer': 'Zveřejnit nabídku',
    'errorCreatingOffer': 'Chyba při vytváření nabídky',
    'errorSearchingForAvailableLocation':
      'Chyba při vyhledávání dostupných míst',
    'offerEncryption': {
      'encryptingYourOffer': 'Šifrování nabídky ...',
      'dontShutDownTheApp':
        'Během šifrování nevypínejte aplikaci. Může to trvat několik minut.',
      'forVexlers': 'pro {{count}} veksláky',
      'doneOfferPoster': 'Hotovo! Nabídka odeslána.',
      'yourFriendsAndFriendsOfFriends':
        'Vaši přátelé a přátelé jejich přátel nyní mohou vidět vaši nabídku.',
      'anonymouslyDeliveredToVexlers':
        'Anonymně doručeno pro {{count}} vexlers',
    },
    'noVexlersFoundForYourOffer': 'Pro vaši nabídku nebyl nalezen žádný vexler',
    'errorLocationNotFilled': 'Vyplňte prosím umístění nabídky',
    'errorDescriptionNotFilled': 'Vyplňte prosím popis nabídky',
  },
  'notifications': {
    'permissionsNotGranted': {
      'title': 'Oprávnění pro oznámení nebyla udělena',
      'message': 'Můžete je povolit v nastavení',
      'openSettings': 'Otevřít nastavení',
    },
  },
  'myOffers': {
    'addNewOffer': 'Přidat novou nabídku',
    'activeOffers': '{{count}} aktivní nabídky',
    'filterOffers': 'Filtrovat nabídky',
    'errorWhileFetchingYourOffers': 'Chyba při načítání nabídek',
    'editOffer': 'Upravit nabídku',
    'myOffer': 'Moje nabídka',
    'offerAdded': 'Přidáno {{date}}',
    'sortedByNewest': 'Seřazeno podle nejnovějších',
    'sortedByOldest': 'Seřazeno podle nejstaršího',
  },
  'editOffer': {
    'editOffer': 'Upravit nabídku',
    'active': 'Aktivní',
    'inactive': 'Neaktivní',
    'saveChanges': 'Uložit změny',
    'offerUnableToChangeOfferActivation': 'Nelze změnit aktivaci nabídky',
    'editingYourOffer': 'Úprava nabídky ...',
    'pleaseWait': 'Počkejte prosím',
    'offerEditSuccess': 'Úspěšná editace nabídky',
    'youCanCheckYourOffer': 'Svou nabídku můžete zkontrolovat v sekci Nabídky',
    'errorEditingOffer': 'Chyba při úpravě nabídky',
    'errorOfferNotFound': 'Nabídka nebyla nalezena!',
    'deletingYourOffer': 'Odstranění vaší nabídky ...',
    'offerDeleted': 'Nabídka smazána',
    'errorDeletingOffer': 'Chyba při mazání nabídky',
  },
  'filterOffers': {
    'filterResults': 'Filtrování výsledků',
    'sorting': 'Třídění',
    'lowestFeeFirst': 'Nejnižší poplatek jako první',
    'highestFee': 'Nejvyšší poplatek',
    'newestOffer': 'Nejnovější nabídka',
    'oldestOffer': 'Nejstarší nabídka',
    'lowestAmount': 'Nejnižší částka',
    'highestAmount': 'Nejvyšší částka',
    'selectSortingMethod': 'Zvolte způsob řazení',
  },
  'messages': {
    'yourOffer': 'Vaše nabídka',
    'theirOffer': 'Jejich nabídka',
    'listTitle': 'Chaty',
    'isBuying': 'kupuje',
    'isSelling': 'prodává',
    'thisWillBeYourFirstInteraction':
      'Toto bude vaše první interakce s touto nabídkou.',
    'wellLetYouKnowOnceUserAccepts':
      'Žádost byla odeslána. Dáme vám vědět, jakmile druhá strana odpoví.',
    'messagePreviews': {
      'incoming': {
        'MESSAGE': '{{them}}: {{message}}',
        'REQUEST_REVEAL': '{{them}} požádal o odhalení identity',
        'APPROVE_REVEAL': 'Identita odhalena',
        'DISAPPROVE_REVEAL': 'Odmítl odhalení identity',
        'REQUEST_MESSAGING': 'Reagoval na vaši nabídku',
        'APPROVE_MESSAGING': 'Schválené zasílání zpráv',
        'DISAPPROVE_MESSAGING': 'Odmítl žádost o zasílání zpráv',
        'DELETE_CHAT': '{{them}} opustil chat',
        'BLOCK_CHAT': '{{them}} Zablokoval vás',
        'OFFER_DELETED': '{{them}} smazal svou nabídku',
        'INBOX_DELETED': '{{them}} smazal svou doručenou poštu',
      },
      'outgoing': {
        'MESSAGE': 'Já: {{message}}',
        'REQUEST_REVEAL': 'Požádali jste o odhalení identity',
        'APPROVE_REVEAL': 'Identita odhalena',
        'DISAPPROVE_REVEAL': 'Odhalení identity odmítnuto',
        'REQUEST_MESSAGING': 'Žádost byla odeslána',
        'APPROVE_MESSAGING': 'Schválili jste zasílání zpráv',
        'DISAPPROVE_MESSAGING': 'Odmítli jste žádost o zasílání zpráv',
        'DELETE_CHAT': 'Opustili jste chat',
        'BLOCK_CHAT': 'Uživatel byl zablokován',
        'OFFER_DELETED': 'Smazali jste nabídku',
        'INBOX_DELETED': 'Smazali jste tuto schránku',
      },
    },
    'deleteChat': 'Smazat chat',
    'askToReveal': 'Požádat o odhalení totožnosti',
    'blockUser': 'Zablokovat uživatele',
    'sending': 'zasílání...',
    'unknownErrorWhileSending': 'Neznámá chyba při odesílání zprávy',
    'tapToResent': 'Klepněte na pro opětovné odeslání.',
    'deniedByMe': 'Odmítli jste žádost o zaslání zprávy s {{name}}.',
    'deniedByThem': '{{name}} odmítl vaši žádost o zasílání zpráv.',
    'requestMessageWasDeleted': 'Zpráva s požadavkem byla smazána',
    'typeSomething': 'Zadejte něco ...',
    'offerDeleted': 'Nabídka smazána',
    'leaveToo': 'Odejít také?',
    'leaveChat': 'Opustit chat?',
    'deleteChatQuestion': 'Smazat chat?',
    'blockForewerQuestion': 'Zablokovat navždy?',
    'yesBlock': 'Ano, zablokovat',
    'deleteChatExplanation1':
      'Skončili jste s obchodováním? Ukončení chatu znamená, že vaše konverzace bude trvale smazána.',
    'deleteChatExplanation2':
      'Jedná se o definitivní krok, potvrďte prosím tuto akci ještě jednou, aby byla skutečná.',
    'blockChatExplanation1':
      'Opravdu chcete tohoto uživatele zablokovat? Tuto akci již nikdy nebudete moci vzít zpět. Rozhodujte se moudře.',
    'blockChatExplanation2':
      'Opravdu chcete tohoto uživatele zablokovat? Tuto akci již nikdy nebudete moci vzít zpět. Rozhodněte se moudře.',
    'chatEmpty': 'Zatím žádné chaty',
    'chatEmptyExplanation': 'Začněte konverzaci vyžádáním nabídky',
    'seeOffers': 'Podívejte se na nabídky',
    'identityRevealRequestModal': {
      'title': 'Poslat žádost o odhalení identity?',
      'text': 'Odesláním požadavku souhlasíte s odhalením i své identity.',
      'send': 'Odeslat žádost',
    },
    'identityRevealRespondModal': {
      'title': 'Chcete odhalit identitu?',
      'text':
        'Pokud odhalíte svou identitu, zobrazí se také identita protistrany.',
    },
    'identityAlreadyRequested':
      'V konverzaci již byl odeslán požadavek na zjištění totožnosti',
    'identityRevealRequest': 'Žádost o odhalení identity',
    'tapToReveal': 'Klepněte na možnost odhalit nebo odmítnout',
    'letsRevealIdentities': 'Umožňuje odhalit identitu',
    'reveal': 'Odhalit',
    'themDeclined': '{{name}} odmítl',
    'youDeclined': 'Odmítli jste',
  },
  'progressBar': {
    'ENCRYPTING_PRIVATE_PAYLOADS': '{{percentDone}}% hotovo',
    'FETCHING_CONTACTS': '',
    'CONSTRUCTING_PRIVATE_PAYLOADS': 'Sestavení soukromého užitečného zatížení',
    'CONSTRUCTING_PUBLIC_PAYLOAD':
      'Sestavení a zašifrování veřejného užitečného zatížení',
    'SENDING_OFFER_TO_NETWORK': 'Nahrání nabídky',
    'DONE': 'Hotovo',
  },
  'commonFriends': {
    'commonFriends': 'Společní přátelé',
    'commonFriendsCount': '{{commonFriendsCount}} společní přátelé',
  },
}
