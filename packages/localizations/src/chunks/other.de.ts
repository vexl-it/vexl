import type en from "./other.en"

const otherDe: typeof en =
  /* JSON starts */
  {
    "common": {
      "next": "Nächste",
      "skip": "Überspringen",
      "finish": "Fertigstellen",
      "confirm": "Bestätigen",
      "continue": "Weiter",
      "save": "Speichern",
      "gotIt": "Ich hab's",
      "search": "Suche",
      "deselectAll": "Alle abwählen",
      "selectAll": "Alles auswählen",
      "cancel": "Abbrechen",
      "unknownError": "Unbekannter Fehler",
      "unexpectedServerResponse": "Unerwartete Server-Antwort",
      "networkErrors": {
        "errNetwork":
          "Es ist ein Netzwerkfehler aufgetreten. Sind Sie mit dem Internet verbunden?",
        "errCanceled": "Anfrage wurde abgebrochen",
        "etimedout": "Zeitüberschreitung der Anfrage",
        "econnaborted": "Verbindung abgebrochen"
      },
      "submit": "Absenden",
      "cryptoError": "Unerwarteter Kryptographie-Fehler",
      "secondsShort": "s",
      "ok": "ok",
      "request": "Anfrage",
      "back": "Zurück",
      "goBack": "Zurückgehen",
      "close": "Schließen",
      "done": "Erledigt",
      "errorCreatingInbox": "Fehler beim Erstellen des Benutzereingangs.",
      "accept": "Akzeptieren",
      "decline": "Ablehnen",
      "youSure": "Sind Sie sicher?",
      "nope": "Nö",
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
      "you": "Sie",
      "allow": "Erlauben Sie",
      "currency": "Währung",
      "whatDoesThisMean": "Was bedeutet das?",
      "learnMore": "Mehr erfahren",
      "unableToShareImage": "Unable to share the image",
      "requestAgain": "Request again",
      "seeDetail": "See details",
      "notNow": "Not now",
      "niceWithExclamationMark": "Nice!"
    },
    "loginFlow": {
      "anonymityNotice":
        "Niemand wird dies sehen, bis Sie es erlauben. Nicht einmal wir.",
      "intro": {
        "title1": "Importieren Sie Ihre Kontakte anonym.",
        "title2": "Sehen Sie deren Kauf- und Verkaufsangebote.",
        "title3":
          "Fordern Sie die Identität derer an, die Ihnen gefallen und tauschen Sie."
      },
      "start": {
        "subtitle": "Herzlich willkommen! Sind Sie bereit anzufangen?",
        "touLabel": "Ich stimme zu",
        "termsOfUse": "Nutzungsbedingungen"
      },
      "anonymizationNotice": {
        "title": "Ihre Identität wird anonymisiert.",
        "text":
          "Niemand wird Ihren echten Namen und Ihr Profilbild sehen, bis Sie ihn für einen bestimmten Handel preisgeben. Nicht einmal wir. Lassen Sie uns zuerst Ihre wahre Identität feststellen."
      },
      "name": {
        "prompt": "Wie werden Sie von Ihren Freunden genannt?",
        "placeholder": "Name oder Spitzname",
        "nameValidationError":
          "Der Name sollte mindestens 1 Zeichen und maximal 25 Zeichen lang sein"
      },
      "photo": {
        "title": "Hallo {{name}}! Wie siehst du aus?",
        "selectSource": "Wähle die Quelle deines Bildes",
        "camera": "Kamera",
        "gallery": "Galerie",
        "permissionsNotGranted": "Berechtigungen nicht erteilt.",
        "nothingSelected": "Es wurde kein Bild ausgewählt"
      },
      "anonymization": {
        "beforeTitle": "Dies ist Ihr privates Profil",
        "afterTitle": "Identität anonymisiert!",
        "action": "Anonymisieren",
        "afterDescription":
          "So werden Sie von anderen Benutzern gesehen, bis Sie Ihre wahre Identität preisgeben."
      },
      "phoneNumber": {
        "title": "Wie lautet Ihre Telefonnummer?",
        "placeholder": "Telefonnummer",
        "text":
          "Um dich mit der Vexl-Gemeinschaft zu verbinden, gib deine Telefonnummer ein",
        "errors": {
          "invalidPhoneNumber":
            "Ungültige Telefonnummer. Bitte versuchen Sie es erneut.",
          "previousCodeNotExpired":
            "Die Verifizierung für diese Telefonnummer ist bereits im Gange. Bitte warten Sie, bis sie abläuft."
        }
      },
      "verificationCode": {
        "title": "Wir haben Ihnen gerade den Verifizierungscode geschickt",
        "text": "Geben Sie ihn zur Verifizierung unten ein",
        "inputPlaceholder": "Ihr Verifizierungscode",
        "retryCountdown": "Haben Sie keinen Code erhalten? Erneut einsenden",
        "retry":
          "Sie haben keinen Code erhalten? Tippen Sie zum erneuten Senden",
        "errors": {
          "userAlreadyExists":
            "Benutzer mit dieser Rufnummer existiert bereits",
          "challengeCouldNotBeGenerated":
            "Herausforderung konnte nicht generiert werden. Versuchen Sie es später noch einmal",
          "verificationNotFound": "Verifizierungscode falsch.",
          "UserNotFound":
            "Benutzer nicht gefunden. Versuchen Sie, den Code erneut zu senden.",
          "SignatureCouldNotBeGenerated":
            "Signatur konnte nicht generiert werden. Versuchen Sie es später noch einmal.",
          "PublicKeyOrHashInvalid":
            "Öffentlicher Schlüssel oder Hash ungültig. Versuchen Sie es später noch einmal."
        },
        "success": {
          "title":
            "Rufnummer verifiziert.\nLassen Sie uns Ihr Profil einrichten.",
          "errorWhileParsingSessionForInternalState":
            "Fehler beim Speichern des Benutzers"
        }
      },
      "importContacts": {
        "title": "Jetzt lass uns deine Freunde finden!",
        "text":
          "Vexl nutzt Ihr reales soziales Netzwerk - Ihre Freunde und deren Freunde. Je mehr Kontakte du hinzufügst, desto mehr Angebote wirst du sehen.",
        "anonymityNotice":
          "Niemand kann deine Kontakte sehen. Nicht einmal wir.",
        "action": "Kontakte importieren"
      }
    },
    "postLoginFlow": {
      "contactsExplanation": {
        "title": "Finden wir jetzt Ihre Freunde!",
        "text":
          "Vexl nutzt Ihr reales soziales Netzwerk - Ihre Freunde und deren Freunde. Je mehr Kontakte Sie hinzufügen, desto mehr Angebote werden Sie sehen.",
        "anonymizationCaption":
          "Niemand kann Ihre Kontakte sehen. Nicht einmal wir."
      },
      "importContactsButton": "Kontakte importieren",
      "contactsList": {
        "addContactManually": "Kontakt {{number}} manuell hinzufügen",
        "inputPlaceholder": "Nummer suchen oder hinzufügen",
        "nothingFound": {
          "title": "Kein Kontakt gefunden.",
          "text":
            "Um die Telefonnummer direkt hinzuzufügen, geben Sie sie in die Suchleiste ein (mit Ländervorwahl)."
        },
        "toAddCustomContact":
          "Um die Telefonnummer direkt hinzuzufügen, geben Sie sie in die Suchleiste ein (mit Ländervorwahl)",
        "addContact": "Kontakt {{number}} manuell hinzufügen",
        "addThisPhoneNumber":
          "Would you like to add this phone number to your Vexl contacts?",
        "addContactName": "Add contact name",
        "contactAdded": "Contact added.",
        "youHaveAddedContact":
          "You have added {{contactName}} to your Vexl contacts."
      },
      "allowNotifications": {
        "title": "Benachrichtigungsberechtigungen zulassen",
        "text":
          "Durch das Aktivieren von Benachrichtigungen erfahren Sie, wenn andere Ihre Angebote annehmen oder wenn Nachrichten eingehen.",
        "action": "zulassen",
        "cancel": "Überspringen",
        "errors": {
          "permissionDenied":
            "Berechtigungen nicht erteilt. Sie können sie später in den Systemeinstellungen zulassen.",
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
      "yourReach": "Ihre Reichweite: {{number}} vexlers",
      "items": {
        "changeProfilePicture": "Profilbild ändern",
        "editName": "Name bearbeiten",
        "contactsImported": "Verwaltung der Kontakte",
        "xFriends": "{{number}} Freunde",
        "setPin": "PIN festlegen",
        "faceId": "Gesichtserkennung",
        "allowScreenshots": "Screenshots zulassen",
        "allowScreenshotsDescription":
          "Verhindern, dass Benutzer Screenshots des Chats machen",
        "termsAndPrivacy": "Bedingungen und Datenschutz",
        "faqs": "FAQs",
        "reportIssue": "Problem melden",
        "inAppLogs": "In-App-Protokolle",
        "requestKnownData": "Bekannte Daten anfordern",
        "followUsOn": "Folgen Sie uns auf",
        "twitter": "Twitter",
        "twitterUrl": "https://twitter.com/vexl",
        "readMoreOn": "Lesen Sie mehr auf",
        "medium": "Medium",
        "mediumUrl": "https://blog.vexl.it",
        "learnMoreOn": "Mehr erfahren auf",
        "website": "Vexl.it",
        "websiteUrl": "https://vexl.it",
        "deleteAccount": "Konto löschen",
        "supportEmail": "support@vexl.it"
      },
      "noLogoutExplanation":
        "Sie können die Abmeldung nicht finden? So etwas gibt es nicht. [Das gibt es nicht. Aber du kannst dein Konto löschen.",
      "support":
        "Wenn du Vexl magst, unterstütze seine Verbesserung, indem du ein paar Bitcoin als Spende schickst!",
      "version": "Vexl App Version: {{version}}",
      "logoutDialog": {
        "title": "Konto löschen?",
        "title2": "Sind Sie sicher?",
        "description":
          "Sind Sie sicher, dass Sie Ihr Konto löschen wollen? Diese Aktion kann nicht rückgängig gemacht werden."
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
      "buy": "Kaufen",
      "sell": "Verkaufen",
      "filterOffers": "Angebote filtern",
      "numberOfCommon": "{{number}} Allgemein",
      "offerNotFound":
        "Angebot nicht gefunden. Es könnte vom Autor gelöscht worden sein",
      "inputPlaceholder": "z.B. Lass uns meinen Freund tauschen...",
      "sendRequest": "Anfrage senden",
      "report": {
        "areYouSureTitle": "Angebot melden?",
        "areYouSureText":
          "Sind Sie sicher, dass Sie dieses Angebot melden wollen? Einmal gemeldet, kann es nicht mehr rückgängig gemacht werden. Wählen Sie mit Bedacht.",
        "yes": "Ja, melden",
        "thankYou": "Danke!",
        "inappropriateContentWasReported":
          "Unangemessener Inhalt wurde anonym gemeldet."
      },
      "goToChat": "Zum Chat gehen",
      "requestStatus": {
        "requested":
          "Du hast einen Handel beantragt. Wir werden dich benachrichtigen, sobald er angenommen wurde.",
        "accepted": "Deine Anfrage wurde angenommen.",
        "denied": "Ihr Antrag wurde abgelehnt.",
        "initial": "Dies wird Ihre erste Interaktion mit diesem Angebot sein.",
        "cancelled":
          "Sie haben eine Handelsanfrage für dieses Angebot storniert.",
        "deleted":
          "You have already interacted with this offer, but you deleted the chat.",
        "otherSideLeft":
          "You have already interacted with this offer, but the counterparty left the chat.",
        "leaved": "Sie haben schon einmal mit diesem Angebot interagiert"
      },
      "listEmpty":
        "Ihr Marktplatz wird gerade aufgewärmt. Kommen Sie in ein paar Minuten wieder!",
      "emptyAction": "Neues Angebot hinzufügen",
      "createOfferAndReachVexlers":
        "Sie erreichen {{reachNumber}} vexlers.\nFügen Sie weitere Kontakte hinzu, um die Anzahl der angezeigten Angebote zu erhöhen.",
      "filterActive": "Filter aktiv",
      "totalOffers": "Insgesamt: {{totalCount}} Angebote",
      "notImportedAnyContacts":
        "Sie haben keine Kontakte importiert. Importieren Sie Kontakte, um Angebote aus Ihrem Netzwerk zu sehen",
      "socialNetworkTooSmall":
        "Sie haben nur wenige Kontakte importiert, so dass Sie möglicherweise keine Angebote sehen",
      "noOffersToMatchFilter":
        "Es gibt keine Angebote, die Ihren Filterkriterien entsprechen",
      "offersAreLoadingAndShouldBeReady":
        "Die Angebote werden geladen und sollten in {{minutes}} Minuten für Sie bereit sein",
      "marketplaceEmpty": "Der Marktplatz ist noch leer",
      "resetFilter": "Filter zurücksetzen",
      "totalFilteredOffers":
        "Gefiltert: {{count}} Angebote (von insgesamt {{totalCount}})",
      "offerFromDirectFriend": "Angebot von einem direkten Freund",
      "offerFromFriendOfFriend": "Angebot von einem Freund eines Freundes",
      "youSeeThisOfferBecause":
        "Sie sehen dieses Angebot, weil die Gegenpartei Ihre Telefonnummer in ihrer Kontaktliste gespeichert hat.",
      "beCautiousWeCannotVerify":
        "Seien Sie vorsichtig, wir können nicht überprüfen, ob Sie sich im wirklichen Leben kennen.",
      "dontForgetToVerifyTheIdentity":
        "Vergessen Sie nicht, ihre Identität mit einem gemeinsamen Kontakt zu überprüfen.",
      "noDirectConnection":
        "Dies ist ein Kontakt, mit dem Sie keine direkte Verbindung haben.",
      "rerequestTomorrow": "Sie können morgen eine weitere Anfrage senden",
      "rerequestDays":
        "Sie können eine weitere Anfrage in {{days}} Tagen senden",
      "rerequest": "Anfrage erneut senden",
      "cancelRequest": "Anfrage stornieren",
      "requestWasCancelledByOtherSide":
        "Kann nicht genehmigt werden. Die andere Seite hat die Anfrage storniert",
      "requestNotFound":
        "Kann nicht genehmigt werden. Die Gegenseite hat ihr Konto gelöscht"
    },
    "termsOfUse": {
      "termsOfUse": "Nutzungsbedingungen",
      "privacyPolicy": "Datenschutzrichtlinien",
      "dontHaveTime":
        "Sie haben keine Zeit, dies alles zu lesen? Werfen Sie einen Blick auf Häufig gestellte Fragen."
    },
    "faqs": {
      "faqs": "Häufig gestellte Fragen",
      "whatIsVexl": "Was ist Vexl?",
      "vexlIsPlatform":
        "Vexl ist eine Plattform, auf der Sie mit Bitcoin innerhalb Ihres realen sozialen Netzwerks - Ihren Freunden und den Freunden ihrer Freunde - handeln können, während Sie völlig anonym bleiben - wenn Sie es wünschen.",
      "whoCanSeeMyContacts": "Wer kann meine Kontakte sehen?",
      "peopleWhomYouAllowToSee":
        "Personen, denen Sie erlauben, Ihre Identität zu sehen, können die Freunde sehen, die Sie gemeinsam haben, das ist alles.",
      "howCanIRemainAnonymous":
        "Wie kann ich anonym bleiben und trotzdem an Vexl teilnehmen?",
      "byDefaultYouParticipateInTheNetwork":
        "Standardmäßig nimmst du an dem Netzwerk unter deinem Vexl-Namen und deinem Vexl-Avatar teil, die du bei der Registrierung angegeben hast. Sie können Ihre Identität nur für einen bestimmten Handel in unserem sicheren, durchgängig verschlüsselten Chat preisgeben.",
      "howCanIMakeSure":
        "Wie kann ich sicherstellen, dass die Person, mit der ich spreche, auch die Person ist, mit der ich sprechen möchte?",
      "oneChallenge":
        "Eine Herausforderung bei wirklich anonymen Kommunikationssystemen wie Vexl ist, dass Sie manchmal die Identität Ihres Gesprächspartners überprüfen müssen! In solchen Fällen ist es am besten, einen sicheren sekundären Kommunikationskanal zu verwenden, um mit der anderen Person zu bestätigen, dass Sie beide die sind, für die Sie sich ausgeben.",
      "howCanIEnsure":
        "Wie kann ich sicherstellen, dass meine Kommunikation und mein Handel privat und verschlüsselt sind?",
      "vexlIsOpensource":
        "Vexl ist quelloffen - jeder kann nach einer Hintertür oder böswilligen Absichten suchen. Außerdem können Sie sich hier den Bericht eines unabhängigen Sicherheitsaudits ansehen.",
      "howCanYouEnsure":
        "Wie können Sie sicherstellen, dass meine Daten geschützt sind?",
      "vexlIsDesigned":
        "Vexl ist so konzipiert, dass niemals sensible Informationen gesammelt oder gespeichert werden. Vexl-Nachrichten und andere Inhalte können weder von uns noch von Dritten eingesehen werden, da sie immer Ende-zu-Ende-verschlüsselt, privat und sicher sind. Unsere Allgemeinen Geschäftsbedingungen und Datenschutzrichtlinien finden Sie unten.",
      "howDoIContactVexl": "Wie kann ich Vexl kontaktieren?",
      "youCanAlwaysReachOutToUs":
        "Sie können sich jederzeit per E-Mail an uns wenden: support@vexl.it. Für eine private Kommunikation können Sie uns auch eine e2ee-Mail schicken. Oder du kannst uns bei deinem nächsten P2P-Handel treffen! 😻"
    },
    "offerForm": {
      "myNewOffer": "Neues Angebot",
      "iWantTo": "Ich möchte",
      "sellBitcoin": "Bitcoin verkaufen",
      "buyBitcoin": "Bitcoin kaufen",
      "amountOfTransaction": {
        "amountOfTransaction": "Betrag",
        "pleaseSelectCurrencyFirst": "Bitte wählen Sie zuerst die Währung",
        "pleaseSelectLocationFirst": "Bitte wählen Sie zuerst den Standort"
      },
      "premiumOrDiscount": {
        "premiumOrDiscount": "Aufschlag oder Abschlag",
        "youBuyForTheActualMarketPrice":
          "Sie kaufen für den aktuellen Marktpreis. Spielen Sie mit dem Schieberegler, um schneller zu verkaufen oder mehr zu verdienen.",
        "theOptimalPositionForMostPeople":
          "Für die meisten Menschen die optimale Position. Sie kaufen etwas schneller, aber etwas überteuert",
        "youBuyReallyFast":
          "Sie kaufen schnell, aber zu einem deutlich höheren Preis als dem Marktpreis",
        "youBuyPrettyCheap":
          "Sie kaufen recht günstig, aber es kann etwas länger dauern, einen Verkäufer zu finden",
        "youBuyVeryCheaply":
          "Sie kaufen sehr billig, aber es kann eine Weile dauern, bis Sie einen Verkäufer finden",
        "buyFaster": "Schnell kaufen",
        "buyCheaply": "Günstig kaufen",
        "youSellForTheActualMarketPrice":
          "Sie verkaufen für den tatsächlichen Marktpreis. Spielen Sie mit dem Schieberegler, um schneller zu verkaufen oder mehr zu verdienen.",
        "youEarnBitMore":
          "Sie verdienen ein bisschen mehr, aber es kann etwas länger dauern.",
        "youWantToEarnFortune":
          "Sie wollen ein Vermögen verdienen, aber es kann Jahre dauern, einen Käufer zu finden.",
        "youSellSlightlyFaster":
          "Sie verkaufen etwas schneller, aber ein bisschen unter dem Marktpreis",
        "youSellMuchFaster":
          "Sie verkaufen viel schneller, aber weit unter dem Marktpreis",
        "youBuyBtcFor": "Sie kaufen BTC für",
        "youSellBtcFor": "Sie verkaufen BTC für",
        "marketPrice": "Marktpreis",
        "sellFaster": "Schneller verkaufen",
        "earnMore": "Sie verdienen mehr",
        "premiumOrDiscountExplained": "Aufschlag oder Abschlag erklärt",
        "influenceImpactOfYourSellOffer":
          "Beeinflussen Sie die Wirkung Ihres Angebots. Verkaufen Sie schneller, indem Sie einen Rabatt gewähren, oder verdienen Sie mehr, indem Sie eine Prämie auf den Bitcoin-Marktpreis aufschlagen.",
        "influenceImpactOfYourBuyOffer":
          "Beeinflussen Sie die Wirkung Ihres Angebots. Kaufen Sie billiger, indem Sie einen Abschlag hinzufügen, oder kaufen Sie schneller, indem Sie einen Aufschlag auf den Bitcoin-Marktpreis hinzufügen.",
        "playWithItAndSee":
          "Spielen Sie damit und sehen Sie, wie es das Interesse der anderen beeinflusst.",
        "plus": "+",
        "minus": "-"
      },
      "buyCheaperByUsingDiscount":
        "Kaufen Sie billiger, indem Sie einen Rabatt gewähren, oder kaufen Sie schneller, indem Sie einen Aufschlag auf den Bitcoin-Marktpreis gewähren.",
      "sellFasterWithDiscount":
        "Verkaufen Sie schneller mit einem Rabatt oder verdienen Sie mehr, indem Sie einen Aufschlag auf den Bitcoin-Marktpreis zahlen.",
      "location": {
        "location": "Standort",
        "meetingInPerson":
          "Ein persönliches Treffen ist sicherer. Worauf sollte man online achten?",
        "checkItOut": "Prüfen Sie es",
        "addCityOrDistrict": "Stadt oder Bezirk hinzufügen",
        "whatToWatchOutForOnline": "Worauf sollte man online achten?",
        "moneySentByRandomPerson":
          "Geld, das von einer zufälligen Person gesendet wird, kann kriminellen Ursprungs sein und zurückverfolgt werden.",
        "neverSendCrypto":
          "Senden Sie niemals Bitcoin, bevor Sie eine Zahlung erhalten haben.",
        "alwaysVerifyTheName":
          "Überprüfen Sie immer den Namen des Kontoinhabers, von dem Sie die Zahlung erhalten haben, mit der angegebenen Identität der Gegenpartei.",
        "forwardTheAddress":
          "Übermitteln Sie die Adresse auf sichere Weise und vergewissern Sie sich, dass sie über einen anderen sicheren Kanal verifiziert wurde."
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
        "lightning": "Blitzzahlung",
        "theBestOption":
          "Die beste Option für wirklich kleine Beträge. Normalerweise superschnell.",
        "onChain": "Auf Kette",
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
        "reachVexlers": "Erreichen Sie {{count}} Vexler"
      },
      "publishOffer": "Angebot veröffentlichen",
      "errorCreatingOffer": "Fehler beim Erstellen des Angebots",
      "errorSearchingForAvailableLocation":
        "Fehler bei der Suche nach verfügbaren Standorten",
      "offerEncryption": {
        "encryptingYourOffer": "Verschlüsseln Sie Ihr Angebot ...",
        "dontShutDownTheApp":
          "Schalten Sie die App während des Verschlüsselns nicht aus. Dies kann mehrere Minuten dauern.",
        "forVexlers": "für {{count}} vexlers",
        "doneOfferPoster": "Erledigt! Angebot veröffentlicht.",
        "yourFriendsAndFriendsOfFriends":
          "Ihre Freunde und die Freunde ihrer Freunde können jetzt Ihr Angebot sehen.",
        "anonymouslyDeliveredToVexlers":
          "Anonym zugestellt an {{count}} vexlers"
      },
      "noVexlersFoundForYourOffer": "Keine Vexler für Ihr Angebot gefunden",
      "errorLocationNotFilled": "Bitte geben Sie den Ort des Angebots an",
      "errorDescriptionNotFilled":
        "Bitte geben Sie eine Beschreibung des Angebots ein"
    },
    "notifications": {
      "permissionsNotGranted": {
        "title": "Berechtigungen für Benachrichtigungen wurden nicht erteilt",
        "message": "Sie können sie in den Einstellungen aktivieren",
        "openSettings": "Einstellungen öffnen"
      },
      "errorWhileOpening": "Fehler beim Öffnen der Benachrichtigung"
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
      "sortedByOldest": "Sortiert nach dem ältesten"
    },
    "editOffer": {
      "editOffer": "Angebot bearbeiten",
      "active": "Aktiv",
      "inactive": "Inaktiv",
      "saveChanges": "Änderungen speichern",
      "offerUnableToChangeOfferActivation":
        "Aktivierung des Angebots kann nicht geändert werden",
      "editingYourOffer": "Ihr Angebot bearbeiten ...",
      "pleaseWait": "Bitte warten",
      "offerEditSuccess": "Erfolg der Angebotsbearbeitung",
      "youCanCheckYourOffer":
        "Sie können Ihr Angebot in Ihrem Angebotsbereich überprüfen",
      "errorEditingOffer": "Fehler bei der Bearbeitung des Angebots",
      "errorOfferNotFound": "Angebot nicht gefunden!",
      "deletingYourOffer": "Ihr Angebot löschen ...",
      "offerDeleted": "Angebot gelöscht",
      "errorDeletingOffer": "Fehler beim Löschen des Angebots",
      "deleteOffer": "Angebot löschen?",
      "deleteOfferDescription":
        "Sind Sie sicher, dass Sie dieses Angebot löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden"
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
      "selectSortingMethod": "Sortiermethode wählen"
    },
    "messages": {
      "yourOffer": "Ihr Angebot",
      "theirOffer": "Ihr Angebot",
      "listTitle": "Chats",
      "isBuying": "kauft",
      "isSelling": "will verkaufen",
      "thisWillBeYourFirstInteraction":
        "Dies wird Ihre erste Interaktion mit diesem Angebot sein.",
      "wellLetYouKnowOnceUserAccepts":
        "Anfrage gesendet. Wir werden Sie benachrichtigen, sobald die andere Seite geantwortet hat.",
      "messagePreviews": {
        "incoming": {
          "MESSAGE": "{{them}}: {{message}}",
          "REQUEST_REVEAL": "{{them}} beantragte Identitätsenthüllung",
          "APPROVE_REVEAL": "Identität offenbart",
          "DISAPPROVE_REVEAL": "Identitätsenthüllung abgelehnt",
          "REQUEST_MESSAGING": "Reagierte auf Ihr Angebot",
          "APPROVE_MESSAGING": "Anfrage wurde angenommen",
          "DISAPPROVE_MESSAGING": "Antrag wurde abgelehnt",
          "DELETE_CHAT": "{{them}} hat den Chat verlassen",
          "BLOCK_CHAT": "{{them}} hat Sie blockiert",
          "OFFER_DELETED": "{{them}} hat das Angebot gelöscht",
          "INBOX_DELETED": "{{them}} hat den Chat gelöscht.",
          "CANCEL_REQUEST_MESSAGING": "Anfrage wurde storniert"
        },
        "outgoing": {
          "MESSAGE": "Ich: {{message}}",
          "REQUEST_REVEAL": "Sie haben um Identitätsenthüllung gebeten",
          "APPROVE_REVEAL": "Identität offenbart",
          "DISAPPROVE_REVEAL": "Identitätsenthüllung abgelehnt",
          "REQUEST_MESSAGING": "Anfrage gesendet",
          "APPROVE_MESSAGING":
            "Sie haben die Nachrichtenübermittlung genehmigt",
          "DISAPPROVE_MESSAGING":
            "Sie haben die Anfrage nach Nachrichten abgelehnt",
          "DELETE_CHAT": "Sie haben den Chat verlassen",
          "BLOCK_CHAT": "Benutzer wurde blockiert",
          "OFFER_DELETED": "Sie haben Ihr Angebot gelöscht",
          "INBOX_DELETED": "Sie haben diesen Posteingang gelöscht",
          "CANCEL_REQUEST_MESSAGING":
            "Sie haben den Antrag auf Nachrichtenübermittlung storniert"
        }
      },
      "deleteChat": "Chat löschen",
      "askToReveal": "Identität preisgeben",
      "blockUser": "Benutzer blockieren",
      "sending": "Senden...",
      "unknownErrorWhileSending":
        "Unbekannter Fehler beim Senden der Nachricht",
      "tapToResent": "Tippen Sie auf , um erneut zu senden.",
      "deniedByMe": "Sie haben die Nachrichtenanfrage mit {{name}} abgelehnt.",
      "deniedByThem": "{{name}} hat Ihre Nachrichtenanforderung abgelehnt.",
      "requestMessageWasDeleted":
        "Der Benutzer hat keine ursprüngliche Nachricht angegeben.",
      "typeSomething": "Geben Sie etwas ein ...",
      "offerDeleted": "Angebot gelöscht",
      "leaveToo": "Auch verlassen?",
      "leaveChat": "Chat verlassen?",
      "deleteChatQuestion": "Chat löschen?",
      "blockForewerQuestion": "Für immer blockieren?",
      "yesBlock": "Ja, sperren",
      "deleteChatExplanation1":
        "Sind Sie fertig mit dem Handel? Das Schließen des Chats bedeutet, dass Ihr Gespräch dauerhaft gelöscht wird.",
      "deleteChatExplanation2":
        "Dies ist der endgültige Schritt. Bitte bestätigen Sie diese Aktion noch einmal, um den Chat zu löschen.",
      "blockChatExplanation1":
        "Wollen Sie diesen Benutzer wirklich blockieren? Sie können diese Aktion nicht mehr rückgängig machen. Wählen Sie mit Bedacht.",
      "blockChatExplanation2":
        "Willst du diesen Benutzer wirklich sperren? Sie können diese Aktion nicht mehr rückgängig machen. Wählen Sie mit Bedacht.",
      "chatEmpty": "Noch keine Chats",
      "chatEmptyExplanation":
        "Beginnen Sie ein Gespräch, indem Sie ein Angebot anfordern",
      "seeOffers": "Angebote sehen",
      "identityRevealRequestModal": {
        "title": "Anfrage zur Offenlegung der Identität senden?",
        "text":
          "Mit dem Absenden der Anfrage erklären Sie sich damit einverstanden, dass auch Ihre eigene Identität preisgegeben wird.",
        "send": "Anfrage senden"
      },
      "identityRevealRespondModal": {
        "title": "Möchten Sie Ihre Identität preisgeben?",
        "text":
          "Wenn Sie Ihre Identität preisgeben, sehen Sie auch die Identität Ihres Gesprächspartners."
      },
      "identityAlreadyRequested":
        "Identitätsanfrage wurde bereits in der Konversation gesendet",
      "identityRevealRequest": "Antrag auf Preisgabe der Identität",
      "identityRevealed": "Identität offenbart",
      "identitySend": {
        "title": "Anfrage zur Offenlegung der Identität gesendet",
        "subtitle": "Warten auf Antwort"
      },
      "tapToReveal": "Tippen Sie zum Aufdecken oder Ablehnen",
      "letsRevealIdentities": "Identitäten aufdecken!",
      "reveal": "Aufdecken",
      "themDeclined": "{{name}} Abgelehnt",
      "youDeclined": "Sie haben abgelehnt",
      "reportOffer": "Angebot melden",
      "ended": "Beendet",
      "textMessageTypes": {
        "REQUEST_MESSAGING": "Anfrage gesendet: {{message}}",
        "CANCEL_REQUEST_MESSAGING": "Anfrage abgebrochen",
        "DISAPPROVE_MESSAGING": "Anfrage abgelehnt",
        "APPROVE_MESSAGING": "Antrag genehmigt"
      },
      "youHaveAlreadyTalked":
        "Sie haben einen Nachrichtenverlauf mit diesem Benutzer. Drücken Sie, um mehr zu sehen",
      "requestPendingActionBar": {
        "top": "Der Chat wartet auf Ihre Zustimmung",
        "bottom":
          "Oben ist die Kommunikation, die Sie bisher mit dem Benutzer hatten"
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
      }
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
      "commonFriendsCount": "{{commonFriendsCount}} gemeinsame Freunde"
    },
    "reportIssue": {
      "openInEmail": "In E-Mail öffnen",
      "somethingWentWrong": "Ein Fehler ist aufgetreten",
      "feelFreeToGetInTouch": "Wenden Sie sich bitte an unseren Support.",
      "predefinedBody": "Hallo! Ich melde ein Problem..."
    },
    "AppLogs": {
      "title": "In App-Protokollen",
      "clear": "Protokolle löschen",
      "export": "Protokolle exportieren",
      "errorExporting": "Fehler beim Exportieren von Protokollen",
      "warning":
        "Die Aktivierung von App-Protokollen kann dazu führen, dass die App langsamer wird und mehr Speicherplatz benötigt.",
      "anonymizeAlert": {
        "title": "Möchten Sie die Protokolle anonymisieren?",
        "text":
          "Wir können versuchen, private Schlüssel und persönliche Informationen aus den Protokollen zu entfernen, bevor sie exportiert werden. Vergewissern Sie sich aber immer selbst."
      }
    },
    "MaintenanceScreen": {
      "title": "Marketplace-Wartung",
      "text":
        "Die Vexl-App wird gerade gewartet. Kommen Sie bitte später wieder."
    },
    "ForceUpdateScreen": {
      "title": "Neue Version verfügbar",
      "text":
        "Laden Sie die neueste Version von Vexl herunter, damit die App richtig funktioniert.",
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
            "Möchten Sie {{contactName}} mit der Nummer {{contactNumber}} importieren?"
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
      "suggests": "schlägt  vor.",
      "yourAppGuide": "Ihre App-Anleitung",
      "addMoreContacts": "Füge mehr Kontakte hinzu",
      "noOffersFromOthersYet":
        "🤔 Noch keine Angebote von anderen? Versuchen Sie, weitere Kontakte hinzuzufügen, und warten Sie ✌️",
      "createYourFirstOffer":
        "👋 Erstellen Sie Ihr erstes Angebot zum Kauf oder Verkauf von Bitcoin."
    }
  }
/* JSON ends */

export default otherDe
