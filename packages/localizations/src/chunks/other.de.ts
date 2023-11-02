import type en from "./other.en"

const otherDe: typeof en =
  /* JSON starts */
  {
    "common": {
      "next": "Weiter",
      "skip": "Überspringen",
      "finish": "Fertigstellen",
      "confirm": "Bestätigen",
      "continue": "Weiter",
      "save": "Speichern",
      "gotIt": "Ich hab's",
      "search": "Suchen",
      "deselectAll": "Alle abwählen",
      "selectAll": "Alles auswählen",
      "cancel": "Abbrechen",
      "unknownError": "Unbekannter Fehler",
      "unexpectedServerResponse": "Unerwartete Server-Antwort",
      "networkErrors": {
        "errNetwork":
          "Ein Netzwerkfehler ist aufgetreten.  Sind Sie mit dem Internet verbunden?",
        "errCanceled": "Anforderung wurde abgebrochen",
        "etimedout": "Zeitüberschreitung der Anforderung",
        "econnaborted": "Verbindung abgebrochen"
      },
      "submit": "Absenden",
      "cryptoError": "Unerwarteter Kryptographie-Fehler",
      "secondsShort": "s",
      "ok": "ok",
      "request": "Anforderung",
      "back": "Zurück",
      "goBack": "Zurückgehen",
      "close": "Schließen",
      "done": "Fertig",
      "errorCreatingInbox": "Fehler beim Erstellen des Benutzereingangs.",
      "accept": "Akzeptieren",
      "decline": "Ablehnen",
      "youSure": "Bist du sicher?",
      "nope": "Nein",
      "yesDelete": "Ja, löschen",
      "more": "Mehr",
      "yes": "Ja",
      "no": "Nein",
      "myOffers": "Meine Angebote",
      "errorOpeningLink": {
        "message": "Fehler beim Öffnen des Links",
        "text": "Stattdessen in die Zwischenablage kopieren?",
        "copy": "Kopieren und schließen"
      },
      "nice": "Schön",
      "success": "Erfolgreich!",
      "requested": "Angefordert",
      "now": "Jetzt",
      "declined": "Abgelehnt",
      "reset": "Zurücksetzen",
      "you": "Du",
      "allow": "Erlauben",
      "currency": "Währung",
      "whatDoesThisMean": "Was bedeutet das?",
      "learnMore": "Mehr erfahren",
      "unableToShareImage": "Das Bild kann nicht geteilt werden.",
      "requestAgain": "Wiederholen die Anfrage",
      "seeDetail": "Details anzeigen",
      "notNow": "Not now",
      "niceWithExclamationMark": "Nice!",
      "nothingFound": "Nichts gefunden",
      "sendRequest": "Anfrage senden",
      "change": "Ändern",
      "errorWhileReadingQrCode": "Fehler beim Lesen des QR-Codes",
      "copyErrorToClipboard": "Fehler in die Zwischenablage kopieren",
      "me": "Ich",
      "error": "Fehler",
      "chatNotFoundError": "Chat nicht gefunden!",
      "send": "Senden",
      "thanks": "Danke!",
      "vexl": "Vexl",
      "dontShowMeThisAgain": "Don’t show me this again"
    },
    "loginFlow": {
      "anonymityNotice":
        "Niemand wird dies sehen, bis du es erlaubst. Nicht einmal wir.",
      "intro": {
        "title1": "Importiere deine Kontakte anonym.",
        "title2": "Sieh deren Kauf- und Verkaufsangebote.",
        "title3":
          "Forder die Identität derer an, die dir gefallen und tausche."
      },
      "start": {
        "subtitle": "Herzlich willkommen! Bist du bereit anzufangen?",
        "touLabel": "Ich stimme zu",
        "termsOfUse": "Nutzungsbedingungen"
      },
      "anonymizationNotice": {
        "title": "Deine Identität wird anonymisiert.",
        "text":
          "Niemand wird deinen echten Namen und dein Profilbild sehen, bis du ihn für einen bestimmten Handel preisgibst. Nicht einmal wir. Lass uns zuerst deine wahre Identität feststellen."
      },
      "name": {
        "prompt": "Wie wirst du von deinen Freunden genannt?",
        "placeholder": "Name oder Spitzname",
        "nameValidationError":
          "Der Name sollte mindestens 1 Zeichen und maximal 25 Zeichen lang sein"
      },
      "photo": {
        "title": "Hallo {{name}}! Wie siehst du aus?",
        "selectSource": "Wähle die Quelle deines Bildes",
        "camera": "Kamera",
        "gallery": "Galerie",
        "permissionsNotGranted": "Berechtigungen verweigert.",
        "nothingSelected": "Es wurde kein Bild ausgewählt"
      },
      "anonymization": {
        "beforeTitle": "Dies ist dein privates Profil",
        "afterTitle": "Identität anonymisiert!",
        "action": "Anonymisieren",
        "afterDescription":
          "So wirst du von anderen Benutzern gesehen, bis du deine wahre Identität preisgibst."
      },
      "phoneNumber": {
        "title": "Wie lautet deine Telefonnummer?",
        "placeholder": "Telefonnummer",
        "text":
          "Um dich mit der Vexl-Gemeinschaft zu verbinden, gib deine Telefonnummer ein",
        "errors": {
          "invalidPhoneNumber":
            "Ungültige Telefonnummer. Bitte versuche es erneut.",
          "previousCodeNotExpired":
            "Die Verifizierung für diese Telefonnummer ist bereits im Gang. Bitte warten Sie, bis sie abgelaufen ist."
        }
      },
      "verificationCode": {
        "title": "Wir haben dir den Verifizierungscode geschickt",
        "text": "Gib ihn zur Verifizierung unten ein",
        "inputPlaceholder": "Dein Verifizierungscode",
        "retryCountdown":
          "Hast du keinen Code erhalten? Tipp zum erneuten Senden",
        "retry": "Hast du keinen Code erhalten? Tipp zum erneuten Senden",
        "errors": {
          "userAlreadyExists":
            "Ein Benutzer mit dieser Telefonnummer existiert bereits",
          "challengeCouldNotBeGenerated":
            "Herausforderung konnte nicht generiert werden. Versuchen Sie es später noch einmal",
          "verificationNotFound": "Verifizierungscode falsch.",
          "UserNotFound":
            "Benutzer nicht gefunden. Versuche, den Code erneut zu senden.",
          "SignatureCouldNotBeGenerated":
            "Signatur konnte nicht generiert werden. Versuche es später noch einmal.",
          "PublicKeyOrHashInvalid":
            "Öffentlicher Schlüssel oder Hash ungültig. Versuche es später noch einmal."
        },
        "success": {
          "title": "Rufnummer verifiziert. Lass uns dein Profil einrichten.",
          "errorWhileParsingSessionForInternalState":
            "Fehler beim Speichern des Benutzers"
        }
      },
      "importContacts": {
        "title": "Jetzt lass uns deine Freunde finden!",
        "text":
          "Vexl nutzt dein reales soziales Netzwerk - deine Freunde und deren Freunde. Je mehr Kontakte du hinzufügst, desto mehr Angebote wirst du sehen.",
        "anonymityNotice":
          "Niemand kann deine Kontakte sehen. Nicht einmal wir.",
        "action": "Kontakte importieren"
      }
    },
    "postLoginFlow": {
      "contactsExplanation": {
        "title": "Finden wir jetzt deine Freunde!",
        "text":
          "Du kannst später deine soziales Netzwerk in den Einstellungen verwalten.",
        "anonymizationCaption":
          "Niemand kann deine Kontakte sehen. Nicht einmal wir."
      },
      "importContactsButton": "Kontakte importieren",
      "contactsList": {
        "addContactManually": "Kontakt {{number}} manuell hinzufügen",
        "inputPlaceholder": "Nummer suchen oder hinzufügen",
        "nothingFound": {
          "title": "Kein Kontakt gefunden.",
          "text":
            "Um die Telefonnummer direkt hinzuzufügen, gib sie in die Suchleiste ein (mit Ländervorwahl)."
        },
        "toAddCustomContact":
          "Um die Telefonnummer direkt hinzuzufügen, gib sie in die Suchleiste ein (mit Ländervorwahl).",
        "addContact": "Kontakt hinzufügen",
        "addThisPhoneNumber":
          "Möchtest du diese Telefonnummer deinen Vexl-Kontakten hinzufügen?",
        "addContactName": "Kontaktname hinzufügen",
        "contactAdded": "Kontaktname hinzugefügt",
        "youHaveAddedContact":
          "You have added {{contactName}} to your Vexl contacts.",
        "submitted": "Eingereichte",
        "new": "Neue",
        "nonSubmitted": "Nicht eingereichte"
      },
      "allowNotifications": {
        "title": "Benachrichtigungen aktivieren",
        "text":
          "Durch das Aktivieren von Benachrichtigungen erfährst du, wenn andere deine Angebote annehmen oder wenn Nachrichten eingehen.",
        "action": "Erlauben",
        "cancel": "Überspringen",
        "errors": {
          "permissionDenied":
            "Berechtigungen nicht erteilt. Du kannst sie später in den Systemeinstellungen zulassen.",
          "unknownError":
            "Unbekannter Fehler beim Anfordern von Berechtigungen",
          "notAvailableOnEmulator":
            "Benachrichtigungen sind auf dem Emulator nicht verfügbar"
        },
        "vexlCantBeUsedWithoutNotifications":
          "Die Vexl-App kann ohne diese Erlaubnis nicht verwendet werden."
      }
    },
    "settings": {
      "yourReach": "Deine Reichweite: {{number}} vexlers",
      "items": {
        "changeProfilePicture": "Profilbild ändern",
        "editName": "Name bearbeiten",
        "contactsImported": "Verwaltung der Kontakte",
        "xFriends": "{{number}} Freunde",
        "setPin": "PIN festlegen",
        "faceId": "Face ID",
        "allowScreenshots": "Screenshots zulassen",
        "allowScreenshotsDescription":
          "Verhindern, dass Benutzer Screenshots des Chats machen",
        "termsAndPrivacy": "Bedingungen und Datenschutz",
        "faqs": "FAQs",
        "reportIssue": "Problem melden",
        "inAppLogs": "In-App-Protokolle",
        "requestKnownData": "Bekannte Daten anfordern",
        "followUsOn": "Folge uns auf",
        "twitter": "Twitter",
        "twitterUrl": "https://twitter.com/vexl",
        "readMoreOn": "Lies mehr auf",
        "medium": "Medium",
        "mediumUrl": "https://blog.vexl.it",
        "learnMoreOn": "Mehr erfahren über",
        "website": "Vexl.it",
        "websiteUrl": "https://vexl.it",
        "deleteAccount": "Konto löschen",
        "supportEmail": "support@vexl.it"
      },
      "noLogoutExplanation":
        "Du kannst die Abmeldung nicht finden? So etwas gibt es nicht. Aber du kannst dein Konto löschen.",
      "support":
        "Wenn du Vexl magst, unterstütze deine Verbesserung, indem du ein paar Bitcoin als Spende schickst!",
      "version": "Vexl App Version: {{version}}",
      "logoutDialog": {
        "title": "Konto löschen?",
        "title2": "Bist du sicher?",
        "description":
          "Bist du sicher, dass du dein Konto löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden."
      }
    },
    "offer": {
      "title": "Angebot",
      "cashOnly": "Nur Bargeld",
      "onlineOnly": "Nur online",
      "upTo": "Bis zu",
      "forSeller": "Für Verkäufer",
      "forBuyer": "Für den Käufer",
      "bank": "Bank",
      "revolut": "Online-Zahlung",
      "isSelling": "verkauft",
      "isBuying": "kauft",
      "directFriend": "Direkter Freund",
      "friendOfFriend": "Freund eines Freundes",
      "buy": "Kauf",
      "sell": "Verkauf",
      "filterOffers": "Angebote filtern",
      "numberOfCommon": "{{number}} Allgemein",
      "offerNotFound":
        "Angebot nicht gefunden. Es könnte vom Autor gelöscht worden sein",
      "inputPlaceholder": "Gib hier deine Nachricht ein",
      "sendRequest": "Anfrage senden",
      "report": {
        "areYouSureTitle": "Angebot melden?",
        "areYouSureText":
          "Bist du sicher, dass du dieses Angebot melden möchtest? Einmal gemeldet, kann es nicht mehr rückgängig gemacht werden. Wähle mit Bedacht.",
        "yes": "Ja, melden",
        "thankYou": "Danke!",
        "inappropriateContentWasReported":
          "Unangemessener Inhalt wurde anonym gemeldet.",
        "reportLimitReached":
          "Du hast die maximale Anzahl von Meldungen für heute erreicht. Versuche es in 24 Stunden erneut."
      },
      "goToChat": "Zum Chat gehen",
      "requestStatus": {
        "requested":
          "Du hast einen Handel beantragt. Wir werden dich benachrichtigen, sobald er angenommen wurde.",
        "accepted": "Deine Anfrage wurde angenommen.",
        "denied": "Dein Antrag wurde abgelehnt.",
        "initial": "Dies wird deine erste Interaktion mit diesem Angebot sein.",
        "cancelled":
          "Du hast eine Handelsanfrage für dieses Angebot storniert.",
        "deleted":
          "Du hast bereits mit diesem Angebot interagiert, aber den Chat gelöscht.",
        "otherSideLeft":
          "Du hast bereits mit diesem Angebot interagiert, aber die Gegenpartei hat den Chat verlassen.",
        "leaved": "Du hast schon einmal mit diesem Angebot interagiert"
      },
      "listEmpty":
        "Dein Marktplatz wird gerade aufgewärmt. Kom in ein paar Minuten wieder!",
      "emptyAction": "Neues Angebot hinzufügen",
      "createOfferAndReachVexlers": "Du erreichst {{reachNumber}} vexlers.",
      "filterActive": "Filter aktiv",
      "totalOffers": "Insgesamt: {{totalCount}} Angebote",
      "notImportedAnyContacts":
        "Du hast keine Kontakte importiert. Importiere Kontakte, um Angebote aus deinem Netzwerk zu sehen",
      "socialNetworkTooSmall":
        "Du hast nur wenige Kontakte importiert, so dass du möglicherweise keine Angebote siehst.",
      "noOffersToMatchFilter":
        "Es gibt keine Angebote, die deinen Filterkriterien entsprechen",
      "offersAreLoadingAndShouldBeReady":
        "Die Angebote werden geladen und sollten in {{minutes}} Minuten für dich bereit sein",
      "marketplaceEmpty": "Der Marktplatz ist noch leer",
      "resetFilter": "Filter zurücksetzen",
      "totalFilteredOffers":
        "Gefiltert: {{count}} Angebote (von insgesamt {{totalCount}})",
      "offerFromDirectFriend": "Angebot von einem direkten Freund",
      "offerFromFriendOfFriend": "Angebot von einem Freund eines Freundes",
      "youSeeThisOfferBecause":
        "Du siehst dieses Angebot, weil die Gegenpartei deine Telefonnummer in seiner Kontaktliste gespeichert hat.",
      "beCautiousWeCannotVerify":
        "Sei vorsichtig, wir können nicht überprüfen, ob sie sich im wirklichen Leben kennen.",
      "dontForgetToVerifyTheIdentity":
        "Vergiss nicht, die Identität des Gegenparteis mit einem gemeinsamen Kontakt zu überprüfen.",
      "noDirectConnection":
        "Dies ist ein Kontakt, mit dem du keine direkte Verbindung hast.",
      "rerequestTomorrow": "Du kannst morgen eine weitere Anfrage senden.",
      "rerequestDays":
        "Du kannst eine weitere Anfrage in {{days}} Tagen senden",
      "rerequest": "Anfrage erneut senden",
      "cancelRequest": "Anfrage stornieren",
      "requestWasCancelledByOtherSide":
        "Kann nicht genehmigt werden. Die Gegenseite hat die Anfrage storniert",
      "requestNotFound":
        "Kann nicht genehmigt werden. Die Gegenseite hat ihr Konto gelöscht",
      "otherSideAccountDeleted": "Other side has deleted their account",
      "createOfferNudge":
        "Erweiter dein Einfluss im sozialen Netzwerk und sei der Erste, der ein Angebot für diese Kriterien erstellt.",
      "offerAuthorSpeaks": "{{name}} spricht {{spokenLanguages}}"
    },
    "termsOfUse": {
      "termsOfUse": "AGB",
      "privacyPolicy": "DSGVO",
      "dontHaveTime":
        "Du hast keine Zeit, dies alles zu lesen? Werfe einen Blick auf Häufig gestellte Fragen.",
      "cautiousNoticeAboutMachineTranslation":
        "Der folgende Text wurde maschinell übersetzt, um Ihnen die Originalversion auf Englisch zugänglich zu machen, gehen Sie bitte zur Website"
    },
    "faqs": {
      "faqs": "Häufig gestellte Fragen",
      "whatIsVexl": "Was ist Vexl?",
      "vexlIsPlatform":
        "Vexl ist eine Plattform, auf der du mit Bitcoin innerhalb deines realen sozialen Netzwerks - deninen Freunden und den Freunden ihrer Freunde - handeln kannst, während du völlig anonym bleibst - wenn du es wünschst.",
      "whoCanSeeMyContacts": "Wer kann meine Kontakte sehen?",
      "peopleWhomYouAllowToSee":
        "Personen, denen du erlaubst, deine Identität zu sehen, können deinen Namen und dein Profilbild sehen, und das ist alles.",
      "howCanIRemainAnonymous":
        "Wie kann ich anonym bleiben und trotzdem an Vexl teilnehmen?",
      "byDefaultYouParticipateInTheNetwork":
        "Standardmäßig nimmst du an dem Netzwerk unter deinem Vexl-Namen und deinem Vexl-Avatar teil, die du bei der Registrierung angegeben hast. Du kannst deine Identität nur für einen bestimmten Handel in unserem sicheren, durchgängig verschlüsselten Chat preisgeben.",
      "howCanIMakeSure":
        "Wie kann ich sicherstellen, dass die Person, mit der ich spreche, auch die Person ist, mit der ich sprechen möchte?",
      "oneChallenge":
        "Eine Herausforderung bei wirklich anonymen Kommunikationssystemen wie Vexl ist, dass du manchmal die Identität deines Gesprächspartners überprüfen müss! In solchen Fällen ist es am besten, einen sicheren sekundären Kommunikationskanal zu verwenden, um mit der anderen Person zu bestätigen, dass Sie beide die sind, für die Sie sich ausgeben.",
      "howCanIEnsure":
        "Wie kann ich sicherstellen, dass meine Kommunikation und mein Handel privat und verschlüsselt sind?",
      "vexlIsOpensource":
        "Vexl ist quelloffen - jeder kann nach einer Hintertür oder böswilligen Absichten suchen. Außerdem kannst du dich hier den Bericht eines unabhängigen Sicherheitsaudits ansehen.",
      "howCanYouEnsure":
        "Wie können Sie sicherstellen, dass meine Daten geschützt sind?",
      "vexlIsDesigned":
        "Vexl ist so konzipiert, dass niemals sensible Informationen gesammelt oder gespeichert werden. Vexl-Nachrichten und andere Inhalte können weder von uns noch von Dritten eingesehen werden, da sie immer Ende-zu-Ende-verschlüsselt, privat und sicher sind. Unsere Allgemeinen Geschäftsbedingungen und Datenschutzrichtlinien findest du unten.",
      "howDoIContactVexl": "Wie kann ich Vexl kontaktieren?",
      "youCanAlwaysReachOutToUs":
        "Du kannst dich jederzeit per E-Mail an uns wenden: support@vexl.it. Für eine private Kommunikation kannst du uns auch eine e2ee-Mail schicken. Oder du kannst uns bei deinem nächsten P2P-Handel treffen! 😻"
    },
    "offerForm": {
      "myNewOffer": "Neues Angebot",
      "iWantTo": "Ich möchte",
      "sellBitcoin": "Bitcoin verkaufen",
      "buyBitcoin": "Bitcoin kaufen",
      "amountOfTransaction": {
        "amountOfTransaction": "Betrag",
        "pleaseSelectCurrencyFirst": "Bitte wähle zuerst die Währung",
        "pleaseSelectLocationFirst": "Bitte wähle zuerst den Standort"
      },
      "premiumOrDiscount": {
        "premiumOrDiscount": "Aufschlag oder Abschlag",
        "youBuyForTheActualMarketPrice":
          "Du kaufst für den aktuellen Marktpreis. Spiel mit dem Schieberegler, um schneller zu verkaufen oder mehr zu verdienen.",
        "theOptimalPositionForMostPeople":
          "Für die meisten Menschen die optimale Position. Du kaufst etwas schneller, aber etwas überteuert.",
        "youBuyReallyFast":
          "Du kaufst schnell, aber zu einem deutlich höheren Preis als dem Marktpreis.",
        "youBuyPrettyCheap":
          "Du kaufst recht günstig, aber es kann etwas länger dauern, einen Verkäufer zu finden.",
        "youBuyVeryCheaply":
          "Du kaufst sehr billig, aber es kann eine Weile dauern, bis du einen Verkäufer findest.",
        "buyFaster": "Schnell kaufen",
        "buyCheaply": "Günstig kaufen",
        "youSellForTheActualMarketPrice":
          "Du verkaufst für den tatsächlichen Marktpreis. Spiel mit dem Schieberegler, um schneller zu verkaufen oder mehr zu verdienen.",
        "youEarnBitMore":
          "Du verdienst ein bisschen mehr, aber es kann etwas länger dauern.",
        "youWantToEarnFortune":
          "Du willst ein Vermögen verdienen, aber es kann Jahre dauern, einen Käufer zu finden.",
        "youSellSlightlyFaster":
          "Du verkaufst etwas schneller, aber ein bisschen unter dem Marktpreis.",
        "youSellMuchFaster":
          "Du verkaufst viel schneller, aber weit unter dem Marktpreis.",
        "youBuyBtcFor": "Du kaufst BTC für",
        "youSellBtcFor": "Du verkaufst BTC für",
        "marketPrice": "Marktpreis",
        "sellFaster": "Schneller verkaufen",
        "earnMore": "Du verdienst mehr",
        "premiumOrDiscountExplained": "Aufschlag oder Abschlag erklärt",
        "influenceImpactOfYourSellOffer":
          "Beeinfluss die Wirkung deines Angebots. Verkauf schneller, indem du einen Rabatt gewährst, oder verdien mehr, indem du eine Prämie auf den Bitcoin-Marktpreis aufschlagst.",
        "influenceImpactOfYourBuyOffer":
          "Beeinfluss die Wirkung deines Angebots. Kaufe billiger, indem du einen Abschlag hinzufügst, oder kauf schneller, indem du einen Aufschlag auf den Bitcoin-Marktpreis hinzufügst.",
        "playWithItAndSee":
          "Spiel damit und sehe, wie es das Interesse der anderen beeinflusst.",
        "plus": "+",
        "minus": "-",
        "youEarnSoMuchMore":
          "Du verdienst so viel mehr, aber es kann eine Weile dauern."
      },
      "buyCheaperByUsingDiscount":
        "Kaufe billiger, indem du einen Rabatt gewährst, oder kaufe schneller, indem du einen Aufschlag auf den Bitcoin-Marktpreis gewährst.",
      "sellFasterWithDiscount":
        "Verkaufe schneller mit einem Rabatt oder verdiene mehr, indem du einen Aufschlag auf den Bitcoin-Marktpreis zahlst.",
      "location": {
        "location": "Standort",
        "meetingInPerson":
          "Ein persönliches Treffen ist sicherer. Worauf sollte man online achten?",
        "checkItOut": "Check it out",
        "addCityOrDistrict": "Stadt oder Bezirk hinzufügen",
        "whatToWatchOutForOnline": "Worauf sollte man online achten?",
        "moneySentByRandomPerson":
          "Geld, das von einer zufälligen Person gesendet wird, kann kriminellen Ursprungs sein und zurückverfolgt werden.",
        "neverSendCrypto":
          "Sende niemals Bitcoin, bevor du eine Zahlung erhalten hast.",
        "alwaysVerifyTheName":
          "Überprüfe immer den Namen des Kontoinhabers, von dem du die Zahlung erhalten hast, mit der angegebenen Identität der Gegenpartei.",
        "forwardTheAddress":
          "Übermittel die Adresse auf sichere Weise und vergewiss dich, dass es über einen anderen sicheren Kanal verifiziert wurde."
      },
      "inPerson": "Persönlich",
      "online": "Online",
      "paymentMethod": {
        "paymentMethod": "Zahlungsmethode",
        "cash": "Bargeld",
        "bank": "Bank",
        "revolut": "Online-Zahlung"
      },
      "network": {
        "network": "Netzwerk",
        "lightning": "Lightning",
        "theBestOption":
          "Die beste Option für wirklich kleine Beträge. Normalerweise superschnell.",
        "onChain": "On chain",
        "theBestFor": "Die beste Option für größere Beträge. Langsamer."
      },
      "description": {
        "description": "Beschreibung",
        "writeWhyPeopleShouldTake":
          "Schreibe, warum die Leute dein Angebot annehmen sollten."
      },
      "friendLevel": {
        "friendLevel": "Freundschaftsgrad",
        "firstDegree": "1. Grad",
        "secondDegree": "2. Grad",
        "noVexlers": "Keine Vexler",
        "reachVexlers": "Du erreichst {{count}} Vexler"
      },
      "publishOffer": "Angebot veröffentlichen",
      "errorCreatingOffer": "Fehler beim Erstellen des Angebots",
      "errorSearchingForAvailableLocation":
        "Fehler bei der Suche nach verfügbaren Standorten",
      "offerEncryption": {
        "encryptingYourOffer": "Verschlüssele dein Angebot ...",
        "dontShutDownTheApp":
          "Schalte die App während des Verschlüsselns nicht aus. Dies kann mehrere Minuten dauern.",
        "forVexlers": "für {{count}} vexlers",
        "doneOfferPoster": "Erledigt! Angebot veröffentlicht.",
        "yourFriendsAndFriendsOfFriends":
          "Deine Freunde und die Freunde ihrer Freunde können jetzt dein Angebot sehen.",
        "anonymouslyDeliveredToVexlers":
          "Anonym zugestellt an {{count}} vexlers"
      },
      "noVexlersFoundForYourOffer": "Keine Vexler für dein Angebot gefunden",
      "errorLocationNotFilled": "Bitte gebe den Ort des Angebots an",
      "errorDescriptionNotFilled":
        "Bitte gebe eine Beschreibung des Angebots ein",
      "selectCurrency": "Währung auswählen",
      "currencyYouWouldLikeToUse":
        "Die Währung, die du für deinen Handel verwenden möchtest.",
      "spokenLanguages": {
        "indicatePreferredLanguage": "Gewünschte Sprache angeben",
        "ENG": "English",
        "DEU": "Deutsch",
        "CZE": "Tschechisch",
        "SVK": "Slowakisch",
        "PRT": "Portugiesisch",
        "FRA": "Französisch",
        "ITA": "Italienisch",
        "ESP": "Spanisch",
        "language": "Sprache",
        "preferredLanguages": "Bevorzugte Sprachen"
      }
    },
    "notifications": {
      "permissionsNotGranted": {
        "title": "Berechtigungen für Benachrichtigungen wurden nicht erteilt",
        "message": "Du kannst sie in den Einstellungen aktivieren",
        "openSettings": "Einstellungen öffnen"
      },
      "errorWhileOpening": "Fehler beim Öffnen der Benachrichtigung",
      "MESSAGE": {
        "title": "Neue Nachricht",
        "body": "Du hast eine neue Nachricht erhalten."
      },
      "REQUEST_REVEAL": {
        "title": "Identitätsanfrage erhalten",
        "body": "Du bist aufgefordert worden, deine Identität preiszugeben."
      },
      "APPROVE_REVEAL": {
        "title": "Identität aufgedeckt!",
        "body": "Dein Antrag auf Preisgeben der Identität wurde genehmigt."
      },
      "DISAPPROVE_REVEAL": {
        "title": "Antrag auf Preisgeben der Identität abgelehnt",
        "body": "Dein Antrag auf Preisgeben der Identität abgelehnt"
      },
      "REQUEST_MESSAGING": {
        "title": "Neue Anfrage!",
        "body": "Du hast eine neue Anfrage erhalten."
      },
      "APPROVE_MESSAGING": {
        "title": "Antrag genehmigt!",
        "body": "Dein Antrag war genehmigt!"
      },
      "DISAPPROVE_MESSAGING": {
        "title": "Antrag abgelehnt",
        "body": "Dein Antrag war abgelehnt"
      },
      "DELETE_CHAT": {
        "title": "Chat gelöscht",
        "body": "Einer deiner Chats wurde gelöscht."
      },
      "BLOCK_CHAT": {
        "title": "Du bist blockiert worden",
        "body": "Jemand hat dich gerade blockiert."
      },
      "INACTIVITY_REMINDER": {
        "title": "Lange nicht mehr gesehen!",
        "body":
          "Du hast dich lange Zeit nicht angemelden. Logg dich ein, um die Deaktivierung deiner Angebote zu verhindern."
      },
      "preferences": {
        "marketing": {
          "title": "Marketing Benachrichtigungen",
          "body": "Benachrichtigung über neue Funktionen usw..."
        },
        "chat": {
          "title": "Chat Benachrichtigungen",
          "body":
            "Benachrichtigungen über neue Anfragen und Nachrichten erhalten."
        },
        "inactivityWarnings": {
          "title": "Inaktivitätswarnungen",
          "body":
            "Wir werden dich benachrichtigen, wenn deine Angebote aufgrund von Inaktivität deaktiviert werden sollen."
        },
        "marketplace": {
          "title": "marketplace",
          "body": "marketplace"
        },
        "newOfferInMarketplace": {
          "title": "Benachrichtigungen über neue Angebote",
          "body": "Benachrichtigungen über neue Angebote erhalten."
        },
        "newPhoneContacts": {
          "title": "Benachrichtigungen über neue Kontakte",
          "body": "Benachrichtigungen über neue Kontakte im Netzwerk erhalten."
        },
        "offer": {
          "title": "offer",
          "body": "offer"
        },
        "screenTitle": "Einstellungen für Benachrichtigungen"
      },
      "REQUEST_CONTACT_REVEAL": {
        "title": "Antrag auf Weitergabe der Telefonnummer",
        "body": "Du bist aufgefordert worden, deine Telefonnummer mitzuteilen."
      },
      "APPROVE_CONTACT_REVEAL": {
        "title": "Telefonnummer enthült!",
        "body": "Dein Antrag auf Austausch von Telefonnummern wurde genehmigt."
      },
      "DISAPPROVE_CONTACT_REVEAL": {
        "title": "Antrag abgelehnt!",
        "body": "Dein Antrag auf Austausch von Telefonnummern wurde abgelehnt."
      },
      "NEW_OFFERS_IN_MARKETPLACE": {
        "title": "Neue Angebote auf dem Marktplatz",
        "body":
          "Neue Angebote auf dem Marktplatz. Öffne die App, um sie zu sehen."
      },
      "NEW_CONTACTS_ON_DEVICE": {
        "title": "Deine Kontakte sind nicht synchronisiert",
        "body":
          "Du hast neue Kontakte, die du nicht synchronisiert hast. Erweiter dein Netzwerk und synchronisiere Sie sie alle!"
      }
    },
    "myOffers": {
      "addNewOffer": "Neues Angebot hinzufügen",
      "activeOffers": "{{count}} aktive Angebote",
      "filterOffers": "Angebote filtern",
      "errorWhileFetchingYourOffers": "Fehler beim Abrufen von Angeboten",
      "editOffer": "Angebot bearbeiten",
      "myOffer": "Mein Angebot",
      "offerAdded": "Hinzugefügt {{date}}",
      "sortedByNewest": "Sortiert nach neuesten",
      "sortedByOldest": "Sortiert nach dem ältesten",
      "offerToSell": "Du verkaufst",
      "offerToBuy": "Du kaufst"
    },
    "editOffer": {
      "editOffer": "Angebot bearbeiten",
      "active": "Aktiv",
      "inactive": "Inaktiv",
      "saveChanges": "Änderungen speichern",
      "offerUnableToChangeOfferActivation":
        "Aktivierung des Angebots kann nicht geändert werden",
      "editingYourOffer": "Dein Angebot bearbeiten ...",
      "pleaseWait": "Bitte warte",
      "offerEditSuccess": "Erfolg der Angebotsbearbeitung",
      "youCanCheckYourOffer":
        "Du kannst dein Angebot in deinem Angebotsbereich überprüfen",
      "errorEditingOffer": "Fehler bei der Bearbeitung des Angebots",
      "errorOfferNotFound": "Angebot nicht gefunden!",
      "deletingYourOffer": "Dein Angebot löschen ...",
      "offerDeleted": "Angebot gelöscht",
      "errorDeletingOffer": "Fehler beim Löschen des Angebots",
      "deleteOffer": "Angebot löschen?",
      "deleteOfferDescription":
        "Bist du sicher, dass du dieses Angebot löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden"
    },
    "filterOffers": {
      "filterResults": "Ergebnisse filtern",
      "sorting": "Sortieren",
      "lowestFeeFirst": "Niedrigste Gebühr",
      "highestFee": "Höchste Gebühr",
      "newestOffer": "Neuestes Angebot",
      "oldestOffer": "Ältestes Angebot",
      "lowestAmount": "Niedrigster Betrag",
      "highestAmount": "Höchster Betrag",
      "selectSortingMethod": "Sortiermethode wählen",
      "searchByText": "Suche nach text",
      "noTextFilter": "Kein Textfilter ausgewählt",
      "chooseCurrency": "Währung auswählen"
    },
    "messages": {
      "yourOffer": "Dein Angebot",
      "theirOffer": "Dein Angebot",
      "listTitle": "Chats",
      "isBuying": "kauft",
      "isSelling": "will verkaufen",
      "thisWillBeYourFirstInteraction":
        "Dies wird deine erste Interaktion mit diesem Angebot sein.",
      "wellLetYouKnowOnceUserAccepts":
        "Anfrage gesendet. Wir werden dich benachrichtigen, sobald die andere Seite geantwortet hat.",
      "messagePreviews": {
        "incoming": {
          "MESSAGE": "{{them}}: {{message}}",
          "REQUEST_REVEAL": "{{them}} beantragte Identitätsenthüllung",
          "APPROVE_REVEAL": "Identität offenbart",
          "DISAPPROVE_REVEAL": "Identitätsenthüllung abgelehnt",
          "REQUEST_MESSAGING": "Reagierte auf dein Angebot",
          "APPROVE_MESSAGING": "Anfrage wurde angenommen",
          "DISAPPROVE_MESSAGING": "Antrag wurde abgelehnt",
          "DELETE_CHAT": "{{them}} hat den Chat verlassen",
          "BLOCK_CHAT": "{{them}} hat dich blockiert",
          "OFFER_DELETED": "{{them}} hat das Angebot gelöscht",
          "INBOX_DELETED": "{{them}} hat den Chat gelöscht.",
          "CANCEL_REQUEST_MESSAGING": "Anfrage wurde storniert",
          "ONLY_IMAGE": "{{them}} hat ein Bild gesendet",
          "REQUEST_CONTACT_REVEAL":
            "{{them}} angeforderte Telefonnummer aufdecken",
          "APPROVE_CONTACT_REVEAL": "Telefonnummer aufgedeckt",
          "DISAPPROVE_CONTACT_REVEAL": "Telefonnummer aufdecken abgelehnt"
        },
        "outgoing": {
          "MESSAGE": "Ich: {{message}}",
          "REQUEST_REVEAL": "Du hast um Identitätsenthüllung gebeten",
          "APPROVE_REVEAL": "Identität offenbart",
          "DISAPPROVE_REVEAL": "Identitätsenthüllung abgelehnt",
          "REQUEST_MESSAGING": "Anfrage gesendet",
          "APPROVE_MESSAGING": "Du hast die Nachrichtenübermittlung genehmigt",
          "DISAPPROVE_MESSAGING":
            "Du hast die Anfrage nach Nachrichten abgelehnt",
          "DELETE_CHAT": "Du hast den Chat verlassen",
          "BLOCK_CHAT": "Benutzer wurde blockiert",
          "OFFER_DELETED": "Du hast dein Angebot gelöscht",
          "INBOX_DELETED": "Du hast diesen Posteingang gelöscht",
          "CANCEL_REQUEST_MESSAGING":
            "Du hast den Antrag auf Nachrichtenübermittlung storniert.",
          "ONLY_IMAGE": "Du hast ein Bild gesendet",
          "REQUEST_CONTACT_REVEAL": "Du hast eine Telefonnummer beantragt.",
          "APPROVE_CONTACT_REVEAL": "Telefonnummer wurde weitergegeben.",
          "DISAPPROVE_CONTACT_REVEAL": "Telefonnummer aufdecken abgelehnt"
        }
      },
      "deleteChat": "Chat löschen",
      "askToReveal": "Identität preisgeben",
      "blockUser": "Benutzer blockieren",
      "sending": "Senden...",
      "unknownErrorWhileSending":
        "Unbekannter Fehler beim Senden der Nachricht",
      "tapToResent": "Tipp, um erneut zu senden.",
      "deniedByMe": "Du hast die Nachrichtenanfrage mit {{name}} abgelehnt.",
      "deniedByThem": "{{name}} hat deine Nachrichtenanforderung abgelehnt.",
      "requestMessageWasDeleted":
        "Der Benutzer hat keine ursprüngliche Nachricht angegeben.",
      "typeSomething": "Gib etwas ein ...",
      "offerDeleted": "Angebot gelöscht",
      "leaveToo": "Auch verlassen?",
      "leaveChat": "Chat verlassen?",
      "deleteChatQuestion": "Chat löschen?",
      "blockForewerQuestion": "Für immer blockieren?",
      "yesBlock": "Ja, sperren",
      "deleteChatExplanation1":
        "Bist du fertig mit dem Handel? Das Schließen des Chats bedeutet, dass dein Gespräch dauerhaft gelöscht wirst.",
      "deleteChatExplanation2":
        "Dies ist der endgültige Schritt. Bitte bestätige diese Aktion noch einmal, um den Chat zu löschen.",
      "blockChatExplanation1":
        "Willst du diesen Benutzer wirklich blockieren? Du kannst diese Aktion nicht mehr rückgängig machen. Wähle mit Bedacht.",
      "blockChatExplanation2":
        "Willst du diesen Benutzer wirklich sperren? Du kannst diese Aktion nicht mehr rückgängig machen. Wähle mit Bedacht.",
      "chatEmpty": "Noch keine Chats",
      "chatEmptyExplanation":
        "Beginn ein Gespräch, indem du ein Angebot anforderst.",
      "seeOffers": "Angebote sehen",
      "identityRevealRequestModal": {
        "title": "Anfrage zur Offenlegung der Identität senden?",
        "text":
          "Mit dem Absenden der Anfrage erklärst du dich damit einverstanden, dass auch deine eigene Identität preisgegeben wird.",
        "send": "Anfrage senden"
      },
      "identityRevealRespondModal": {
        "title": "Möchtest du deine Identität preisgeben?",
        "text":
          "Wenn du deine Identität preisgibst, siehst du auch die Identität deines Gesprächspartners."
      },
      "identityAlreadyRequested":
        "Identitätsanfrage wurde bereits in der Konversation gesendet",
      "identityRevealRequest": "Antrag auf Preisgabe der Identität",
      "identityRevealed": "Identität offenbart",
      "identitySend": {
        "title": "Anfrage zur Offenlegung der Identität gesendet",
        "subtitle": "Warten auf Antwort"
      },
      "tapToReveal": "Tipp zum Aufdecken oder Ablehnen",
      "letsRevealIdentities": "Identitäten aufdecken!",
      "reveal": "Aufdecken",
      "themDeclined": "{{name}} Abgelehnt",
      "youDeclined": "Du hast abgelehnt",
      "reportOffer": "Angebot melden",
      "ended": "Beendet",
      "textMessageTypes": {
        "REQUEST_MESSAGING": "Anfrage gesendet: {{message}}",
        "CANCEL_REQUEST_MESSAGING": "Anfrage abgebrochen",
        "DISAPPROVE_MESSAGING": "Anfrage abgelehnt",
        "APPROVE_MESSAGING":
          "Antrag genehmigt, du kannst jetzt die Einzelheiten besprechen."
      },
      "youHaveAlreadyTalked":
        "Du hast einen Nachrichtenverlauf mit diesem Benutzer. Drücke, um mehr zu sehen.",
      "requestPendingActionBar": {
        "top": "Der Chat wartet auf deine Zustimmung",
        "bottom":
          "Oben ist die Kommunikation, die Sie bisher mit dem Benutzer hatten"
      },
      "showFullChatHistory":
        "Du hast bereits mit diesem Angebot interagiert. Tippe, um den Chatverlauf zu sehen.",
      "unableToRespondOfferRemoved": {
        "title": "Angebot wurde entfernt.",
        "text":
          "Antwort kann nicht gesendet werden. Angebot wurde gelöscht. Möchtest du den Chat verlassen?"
      },
      "offerWasReported": "Angebot wurde gemeldet.",
      "unableToSelectImageToSend": {
        "title": "Bild kann nicht ausgewählt werden.",
        "missingPermissions":
          "Vexl benötigt Berechtigung, um auf deine Bilder zuzugreifen. Aktiviere sie in den Einstellungen."
      },
      "imageToSend": "Bild zum Senden:",
      "actionBanner": {
        "requestPending": "Anfrage ausstehend.",
        "bottomText": "Die vorherige Kommunikation wird oben angezeigt.",
        "buttonText": "Antworten"
      },
      "cancelRequestDialog": {
        "title": "Bist du sicher?",
        "description":
          "If you cancel the messaging request other side will be unable to accept it",
        "yes": "Ja, abbrechen"
      },
      "contactRevealRespondModal": {
        "title":
          "Bist du sicher, dass du deine Telefonnummer weitergeben willst?",
        "text": "Es wird der Gegenpartei deine Telefonnummer weitergeben."
      },
      "contactRevealRequestModal": {
        "title": "Rufnummernanforderung senden.",
        "text":
          "Wenn du eine Telefonnummer anforderst, erklärst du dich damit einverstanden, auch deine Telefonnummer weiterzugeben."
      },
      "contactAlreadyRequested":
        "Eine Telefonnummer wurde bereits angefordert.",
      "contactRevealRequest": "Antrag auf Weitergabe der Telefonnummer",
      "contactRevealSent": {
        "title": "Antrag auf Weitergabe der Telefonnummer gesendet",
        "subtitle": "Warten auf Antwort"
      },
      "letsExchangeContacts": "Tauschen wir Kontakte aus!",
      "phoneNumberRevealed": "Telefonnummer enthüllt!",
      "phoneNumberReveal": "Telefonnummer enthüllen",
      "phoneNumberRevealDeclined":
        "Sie haben abnehmen ihre Telefonnummer weiterzugeben",
      "contactIsAlreadyInYourContactList":
        "Der Kontakt befindet sich bereits in deiner Kontaktliste.",
      "addUserToYourContacts": "Füge {{Name}} zu deinen Kontakten hinzu?",
      "tapToAddToYourVexlContacts":
        "Tipp auf, um sie zu deinen Vexl-Kontakten hinzuzufügen.",
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
      "ENCRYPTING_PRIVATE_PAYLOADS": "{{percentDone}}% erledigt",
      "FETCHING_CONTACTS": "",
      "CONSTRUCTING_PRIVATE_PAYLOADS": "Konstruktion von privaten Nutzdaten",
      "CONSTRUCTING_PUBLIC_PAYLOAD":
        "Konstruieren und Verschlüsseln der öffentlichen Nutzdaten",
      "SENDING_OFFER_TO_NETWORK": "Angebot hochladen",
      "DONE": "Erledigt"
    },
    "commonFriends": {
      "commonFriends": "Gemeinsame Freunde",
      "commonFriendsCount": "{{commonFriendsCount}} gemeinsame Freunde",
      "call": "Anruf"
    },
    "reportIssue": {
      "openInEmail": "In E-Mail öffnen",
      "somethingWentWrong": "Ein Fehler ist aufgetreten?",
      "feelFreeToGetInTouch": "Wende dich bitte an unseren Support.",
      "predefinedBody": "Hallo! Ich melde ein Problem..."
    },
    "AppLogs": {
      "title": "In App-Protokollen",
      "clear": "Protokolle löschen",
      "export": "Protokolle exportieren",
      "errorExporting": "Fehler beim Exportieren von Protokollen",
      "warning":
        "Die Aktivierung von Approtokollen kann dazu führen, dass die App langsamer wird und mehr Speicherplatz benötigt.",
      "anonymizeAlert": {
        "title": "Möchtest du die Protokolle anonymisieren?",
        "text":
          "Wir können versuchen, private Schlüssel und persönliche Informationen aus den Protokollen zu entfernen, bevor sie exportiert werden. Vergewisse dich aber immer selbst."
      },
      "noLogs": "Keine Logs"
    },
    "MaintenanceScreen": {
      "title": "Marketplace-Wartung",
      "text": "Die Vexl-App wird gerade gewartet. Komm bitte später wieder."
    },
    "ForceUpdateScreen": {
      "title": "Neue Version verfügbar",
      "text":
        "Lade die neueste Version von Vexl herunter, damit die App richtig funktioniert.",
      "action": "Jetzt aktualisieren"
    },
    "btcPriceChart": {
      "requestCouldNotBeProcessed":
        "Anfrage nach dem aktuellen BTC-Preis fehlgeschlagen"
    },
    "deepLinks": {
      "importContacts": {
        "alert": {
          "title": "Kontakt importieren",
          "text":
            "Möchtest du {{contactName}} mit der Nummer {{contactNumber}} importieren?"
        },
        "successAlert": {
          "title": "Kontakt importiert"
        }
      }
    },
    "qrCode": {
      "joinVexl": "Vexl beitreten"
    },
    "editName": {
      "editName": "Name bearbeiten",
      "errorUserNameNotValid": "Benutzername ist ungültig"
    },
    "changeProfilePicture": {
      "changeProfilePicture": "Profilbild ändern",
      "uploadNewPhoto": "Neues Foto hochladen"
    },
    "suggestion": {
      "vexl": "Vexl",
      "suggests": "schlägt vor",
      "yourAppGuide": "Deine App-Anleitung",
      "addMoreContacts": "Füge mehr Kontakte hinzu",
      "noOffersFromOthersYet":
        "🤔 Noch keine Angebote von anderen? Versuche weitere Kontakte hinzuzufügen und warte ✌️",
      "createYourFirstOffer":
        "👋 Erstelle dein erstes Angebot zum Kauf oder Verkauf von Bitcoin.",
      "importNewlyAddedContacts":
        "👋 Sieht aus, du hast ein paar neue Kontakte. Willst du sie jetzt importieren?",
      "importNow": "Jetzt importieren"
    },
    "addContactDialog": {
      "addContact": "Kontakt hinzufügen",
      "addThisPhoneNumber":
        "Möchtest du diese Telefonnummer deinen Vexl-Kontakten hinzufügen?",
      "addContactName": "Kontaktname hinzufügen",
      "contactAdded": "Kontakt hinzugefügt.",
      "youHaveAddedContact":
        "Du hast {{contactName}} deinen Vexl-Kontakten hinzugefügt.",
      "contactAlreadyInContactList":
        "Der Kontakt befindet sich bereits in deiner Kontaktliste.",
      "wouldYouLikeToChangeTheName":
        "Möchtest du den Namen {{Name}} für diese Rufnummer ändern?",
      "keepCurrent": "Aktuell halten",
      "contactUpdated": "Kontakt aktualisiert",
      "youHaveSuccessfullyUpdatedContact":
        "Du hast deine Vexl-Kontakte erfolgreich aktualisiert."
    },
    "qrScanner": {
      "title": "Scan den QR-Code eines anderen Benutzers",
      "invalidQrCodeScanned": "Ungültiger QR-Code gescannt",
      "missingCameraPermissions": "Fehlende Kameraberechtigungen",
      "grantPermissions": "Berechtigungen erteilen",
      "grantPermissionsInSettings":
        "Kann keine Berechtigungen anfragen. Öffne die Einstellungen, um den Kamerazugriff für Vexl zu erlauben.",
      "openSettings": "Einstellungen öffnen"
    },
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

export default otherDe
