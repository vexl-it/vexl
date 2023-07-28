import type en from "./other.en"

const otherIt: typeof en =
  /* JSON starts */
  {
    "common": {
      "next": "Avanti",
      "skip": "Salto",
      "finish": "Terminare",
      "confirm": "Confermare",
      "continue": "Continua",
      "save": "Salva",
      "gotIt": "Ottenuto",
      "search": "Ricerca",
      "deselectAll": "Deseleziona tutto",
      "selectAll": "Seleziona tutti",
      "cancel": "Annulla",
      "unknownError": "Errore sconosciuto",
      "unexpectedServerResponse": "Risposta inattesa del server",
      "networkErrors": {
        "errNetwork":
          "Si è verificato un errore di rete. Siete connessi a Internet?",
        "errCanceled": "La richiesta è stata annullata",
        "etimedout": "La richiesta è scaduta",
        "econnaborted": "Connessione interrotta"
      },
      "submit": "Invia",
      "cryptoError": "Errore di crittografia inatteso",
      "secondsShort": "s",
      "ok": "ok",
      "request": "Richiesta",
      "back": "Indietro",
      "goBack": "Torna indietro",
      "close": "Chiudere",
      "done": "Fatto",
      "errorCreatingInbox":
        "Errore nella creazione della casella di posta utente.",
      "accept": "Accettare",
      "decline": "Rifiuta",
      "youSure": "Sei sicuro?",
      "nope": "No",
      "yesDelete": "Sì, eliminare",
      "more": "Di più",
      "yes": "Sì, sì",
      "no": "No",
      "myOffers": "Le mie offerte",
      "errorOpeningLink": {
        "message": "Errore nell'apertura del link",
        "text": "Copiare negli appunti?",
        "copy": "Copia e chiudi"
      },
      "nice": "Ottimo",
      "success": "Successo!",
      "requested": "Richiesto",
      "now": "Ora",
      "declined": "Declinato",
      "reset": "Azzeramento",
      "you": "Voi",
      "allow": "Consenti",
      "currency": "Valuta",
      "whatDoesThisMean": "Cosa significa?",
      "learnMore": "Per saperne di più",
      "unableToShareImage": "Unable to share the image",
      "requestAgain": "Request again",
      "seeDetail": "See details",
      "notNow": "Not now",
      "niceWithExclamationMark": "Nice!"
    },
    "loginFlow": {
      "anonymityNotice":
        "Nessuno lo vedrà finché non lo permetterete. Nemmeno noi.",
      "intro": {
        "title1": "Importa i tuoi contatti in modo anonimo.",
        "title2": "Vedere le loro offerte di acquisto e vendita.",
        "title3": "Richiedi l'identità di quelli che ti piacciono e scambia."
      },
      "start": {
        "subtitle": "Benvenuti! Sei pronto per iniziare?",
        "touLabel": "Accetto",
        "termsOfUse": "Condizioni d'uso"
      },
      "anonymizationNotice": {
        "title": "La tua identità sarà anonima.",
        "text":
          "Nessuno vedrà il vostro vero nome e la vostra immagine del profilo fino a quando non li rivelerete per particolari scambi. Nemmeno noi. Per prima cosa definiamo la tua vera identità."
      },
      "name": {
        "prompt": "Come ti chiamano i tuoi amici?",
        "placeholder": "Nome o soprannome",
        "nameValidationError":
          "Il nome deve essere lungo almeno 1 carattere e al massimo 25."
      },
      "photo": {
        "title": "Ehi {{name}}! Che aspetto hai?",
        "selectSource": "Seleziona la fonte dell'immagine",
        "camera": "Fotocamera",
        "gallery": "Galleria",
        "permissionsNotGranted": "Permessi non concessi.",
        "nothingSelected": "Non è stata selezionata alcuna immagine"
      },
      "anonymization": {
        "beforeTitle": "Questo è il tuo profilo privato",
        "afterTitle": "Identità anonimizzata!",
        "action": "Anonimizza",
        "afterDescription":
          "Questo è il modo in cui gli altri utenti ti vedranno finché non rivelerai la tua vera identità."
      },
      "phoneNumber": {
        "title": "Qual è il tuo numero di telefono?",
        "placeholder": "Numero di telefono",
        "text":
          "Per metterti in contatto con la comunità Vexl, inserisci il tuo numero di telefono.",
        "errors": {
          "invalidPhoneNumber": "Numero di telefono non valido. Riprovare.",
          "previousCodeNotExpired":
            "La verifica per questo numero di telefono è già in corso. Attendere la scadenza"
        }
      },
      "verificationCode": {
        "title": "Ti abbiamo appena inviato il codice di verifica",
        "text": "Inseriscilo qui sotto per verificare",
        "inputPlaceholder": "Il tuo codice di verifica",
        "retryCountdown": "Non hai ricevuto il codice? Invia di nuovo",
        "retry":
          "Non hai ricevuto il codice? Toccare per inviare nuovamente il codice",
        "errors": {
          "userAlreadyExists":
            "L'utente con questo numero di telefono esiste già",
          "challengeCouldNotBeGenerated":
            "Non è stato possibile generare una sfida. Riprovare più tardi",
          "verificationNotFound": "Codice di verifica errato.",
          "UserNotFound":
            "Utente non trovato. Provare a inviare nuovamente il codice.",
          "SignatureCouldNotBeGenerated":
            "Non è stato possibile generare la firma. Riprovare più tardi",
          "PublicKeyOrHashInvalid":
            "Chiave pubblica o hash non validi. Riprovare più tardi"
        },
        "success": {
          "title":
            "Numero di telefono verificato.\nConfiguriamo il tuo profilo.",
          "errorWhileParsingSessionForInternalState":
            "Errore durante il salvataggio dell'utente"
        }
      },
      "importContacts": {
        "title": "Ora troviamo i tuoi amici!",
        "text":
          "Vexl utilizza la rete sociale del mondo reale: i vostri amici e i loro amici. Più contatti aggiungete, più offerte vedrete.",
        "anonymityNotice": "Nessuno può vedere i tuoi contatti. Nemmeno noi.",
        "action": "Importare i contatti"
      }
    },
    "postLoginFlow": {
      "contactsExplanation": {
        "title": "Ora cerchiamo i vostri amici!",
        "text":
          "Vexl utilizza la rete sociale del mondo reale: i vostri amici e i loro amici. Più contatti aggiungete, più offerte vedrete.",
        "anonymizationCaption":
          "Nessuno può vedere i vostri contatti. Nemmeno noi."
      },
      "importContactsButton": "Importazione di contatti",
      "contactsList": {
        "addContactManually": "Aggiungi un contatto {{number}} manualmente",
        "inputPlaceholder": "Cerca o aggiungi un numero",
        "nothingFound": {
          "title": "Nessun contatto trovato.",
          "text":
            "Per aggiungere direttamente il numero di telefono, digitarlo nella barra di ricerca (con il prefisso del Paese)."
        },
        "toAddCustomContact":
          "Per aggiungere direttamente il numero di telefono, digitarlo nella barra di ricerca (con il prefisso del paese).",
        "addContact": "Add contact",
        "addThisPhoneNumber":
          "Would you like to add this phone number to your Vexl contacts?",
        "addContactName": "Add contact name",
        "contactAdded": "Contact added.",
        "youHaveAddedContact":
          "You have added {{contactName}} to your Vexl contacts."
      },
      "allowNotifications": {
        "title": "Consentire i permessi di notifica",
        "text":
          "L'abilitazione delle notifiche consente di sapere quando gli altri accettano le vostre offerte o quando arrivano dei messaggi.",
        "action": "Consenti",
        "cancel": "Salta",
        "errors": {
          "permissionDenied":
            "Permessi non concessi. È possibile autorizzarli in un secondo momento nelle impostazioni di sistema.",
          "unknownError": "Errore sconosciuto durante la richiesta di permessi",
          "notAvailableOnEmulator":
            "Le notifiche non sono disponibili sull'emulatore"
        },
        "vexlCantBeUsedWithoutNotifications":
          "L'app Vexl non può essere utilizzata senza questo permesso."
      }
    },
    "settings": {
      "yourReach": "La tua portata: {{number}} vexler",
      "items": {
        "changeProfilePicture": "Cambia l'immagine del profilo",
        "editName": "Modifica il nome",
        "contactsImported": "Gestione dei contatti",
        "xFriends": "{{number}} Amici",
        "setPin": "Imposta PIN",
        "faceId": "Face ID",
        "allowScreenshots": "Consenti screenshot",
        "allowScreenshotsDescription":
          "Impedisce agli utenti di effettuare screenshot della chat",
        "termsAndPrivacy": "Condizioni e privacy",
        "faqs": "Domande frequenti",
        "reportIssue": "Segnala un problema",
        "inAppLogs": "Registri in-app",
        "requestKnownData": "Richiesta di dati noti",
        "followUsOn": "Seguici su",
        "twitter": "Twitter",
        "twitterUrl": "https://twitter.com/vexl",
        "readMoreOn": "Per saperne di più su",
        "medium": "Media",
        "mediumUrl": "https://blog.vexl.it",
        "learnMoreOn": "Per saperne di più su",
        "website": "Vexl.it",
        "websiteUrl": "https://vexl.it",
        "deleteAccount": "Cancellare l'account",
        "supportEmail": "support@vexl.it"
      },
      "noLogoutExplanation":
        "Non riuscite a trovare il logout? Non esiste.\nMa puoi cancellare il tuo account.",
      "support":
        "Se ti piace Vexl, sostieni il suo miglioramento inviando qualche bitcoin come donazione!",
      "version": "Versione dell'app Vexl: {{version}}",
      "logoutDialog": {
        "title": "Cancellare l'account?",
        "title2": "Sei sicuro?",
        "description":
          "Sei sicuro di voler cancellare il tuo account? Questa azione non può essere annullata"
      }
    },
    "offer": {
      "title": "Offerta",
      "cashOnly": "Solo contanti",
      "onlineOnly": "Solo online",
      "upTo": "Fino a",
      "forSeller": "Per il venditore",
      "forBuyer": "Per l'acquirente",
      "bank": "In banca",
      "revolut": "Pagamento online",
      "isSelling": "si vende",
      "isBuying": "acquista",
      "directFriend": "Amico diretto",
      "friendOfFriend": "Amico di un amico",
      "buy": "Comprare",
      "sell": "Vendere",
      "filterOffers": "Filtrare le offerte",
      "numberOfCommon": "{{number}} comune",
      "offerNotFound":
        "Offerta non trovata. Potrebbe essere stata cancellata dall'autore",
      "inputPlaceholder": "Ad esempio, scambiamo il mio amico...",
      "sendRequest": "Invia richiesta",
      "report": {
        "areYouSureTitle": "Segnalare l'offerta?",
        "areYouSureText":
          "Sei sicuro di voler segnalare questa offerta? Una volta segnalata, non può essere annullata. Scegli con saggezza.",
        "yes": "Sì, segnala",
        "thankYou": "Grazie!",
        "inappropriateContentWasReported":
          "Il contenuto inappropriato è stato segnalato in forma anonima."
      },
      "goToChat": "Vai alla chat",
      "requestStatus": {
        "requested":
          "Hai richiesto uno scambio. Ti informeremo quando sarà accettata.",
        "accepted": "La tua richiesta è stata accettata.",
        "denied": "La richiesta è stata rifiutata.",
        "initial":
          "Questa sarà la vostra prima interazione con questa offerta.",
        "cancelled":
          "Avete annullato la richiesta di scambio per questa offerta.",
        "deleted":
          "You have already interacted with this offer, but you deleted the chat.",
        "otherSideLeft":
          "You have already interacted with this offer, but the counterparty left the chat.",
        "leaved": "Vous avez déjà interagi avec cette offre auparavant"
      },
      "listEmpty":
        "Il mercato è in fase di riscaldamento. Torna tra un paio di minuti!",
      "emptyAction": "Aggiungi una nuova offerta",
      "createOfferAndReachVexlers":
        "Hai raggiunto i {{reachNumber}} vexler.\nAggiungi altri contatti per aumentare il numero di offerte visualizzate.",
      "filterActive": "Filtro attivo",
      "totalOffers": "Totale: {{totalCount}} offerte",
      "notImportedAnyContacts":
        "Non hai importato alcun contatto. Importa i contatti per vedere le offerte della tua rete",
      "socialNetworkTooSmall":
        "Sono stati importati solo pochi contatti, quindi è possibile che non venga visualizzata alcuna offerta.",
      "noOffersToMatchFilter":
        "Non ci sono offerte che corrispondono ai criteri del filtro",
      "offersAreLoadingAndShouldBeReady":
        "Le offerte sono in fase di caricamento e dovrebbero essere pronte tra {{minutes}} minuti.",
      "marketplaceEmpty": "Il mercato è ancora vuoto",
      "resetFilter": "Ripristina il filtro",
      "totalFilteredOffers":
        "Filtrato: {{count}} offerte (su un totale di {{totalCount}})",
      "offerFromDirectFriend": "Offerta di un amico diretto",
      "offerFromFriendOfFriend": "Offerta da un amico di un amico",
      "youSeeThisOfferBecause":
        "Vedete questa offerta perché la controparte ha salvato il vostro numero di telefono nella sua lista di contatti.",
      "beCautiousWeCannotVerify":
        "Siate prudenti, non possiamo verificare se vi conoscete davvero nella vita reale.",
      "dontForgetToVerifyTheIdentity":
        "Non dimenticate di verificare la loro identità con un contatto comune.",
      "noDirectConnection":
        "Si tratta di un contatto con cui non avete un legame diretto.",
      "rerequestTomorrow": "È possibile inviare un'altra richiesta domani",
      "rerequestDays": "Puoi inviare un'altra richiesta tra {{days}} giorni",
      "rerequest": "Invia nuovamente la richiesta",
      "cancelRequest": "Annulla la richiesta",
      "requestWasCancelledByOtherSide":
        "Impossibile approvare. L'altra parte ha annullato la richiesta",
      "requestNotFound":
        "Impossibile approvare. L'altra parte ha cancellato il proprio account"
    },
    "termsOfUse": {
      "termsOfUse": "Condizioni d'uso",
      "privacyPolicy": "Informativa sulla privacy",
      "dontHaveTime":
        "Non avete tempo per leggere tutto questo? Date un'occhiata alle Domande frequenti."
    },
    "faqs": {
      "faqs": "Domande frequenti",
      "whatIsVexl": "Che cos'è Vexl?",
      "vexlIsPlatform":
        "Vexl è una piattaforma in cui è possibile scambiare Bitcoin all'interno della propria rete sociale del mondo reale - i propri amici e gli amici dei loro amici - rimanendo completamente anonimi, se lo si desidera.",
      "whoCanSeeMyContacts": "Chi può vedere i miei contatti?",
      "peopleWhomYouAllowToSee":
        "Le persone a cui permettete di vedere la vostra identità possono vedere gli amici che avete in comune e questo è tutto.",
      "howCanIRemainAnonymous":
        "Come posso rimanere anonimo e partecipare a Vexl?",
      "byDefaultYouParticipateInTheNetwork":
        "Per impostazione predefinita, partecipate alla rete con il vostro nome Vexl e l'avatar Vexl che vi sono stati assegnati durante la registrazione. È possibile rivelare la propria identità solo per un determinato scambio nella nostra chat sicura e criptata end-to-end.",
      "howCanIMakeSure":
        "Come posso assicurarmi che la persona con cui sto parlando sia la persona con cui voglio parlare?",
      "oneChallenge":
        "Una sfida con i sistemi di comunicazione veramente anonimi come Vexl è che a volte è necessario verificare l'identità della persona con cui si sta parlando! In questi casi, è meglio utilizzare un canale di comunicazione secondario e sicuro per confermare all'altra persona che siete entrambi chi dite di essere.",
      "howCanIEnsure":
        "Come posso assicurarmi che le mie comunicazioni e le mie transazioni siano private e criptate?",
      "vexlIsOpensource":
        "Vexl è open source: chiunque può cercare eventuali backdoor o intenti malevoli. Inoltre, qui è possibile consultare il rapporto di un Security Audit indipendente.",
      "howCanYouEnsure":
        "Come potete garantire che i miei dati siano protetti?",
      "vexlIsDesigned":
        "Vexl è progettato per non raccogliere o memorizzare alcuna informazione sensibile. I messaggi e gli altri contenuti di Vexl non possono essere consultati da noi o da terzi perché sono sempre criptati end-to-end, privati e sicuri. I nostri Termini di servizio e l'Informativa sulla privacy sono disponibili di seguito.",
      "howDoIContactVexl": "Come posso contattare Vexl?",
      "youCanAlwaysReachOutToUs":
        "Potete sempre contattarci via e-mail: support@vexl.it. Per una comunicazione privata, potete anche inviarci un messaggio di posta elettronica. Oppure potete incontrarci durante il vostro prossimo scambio P2P! 😻"
    },
    "offerForm": {
      "myNewOffer": "Nuova offerta",
      "iWantTo": "Voglio",
      "sellBitcoin": "Vendere Bitcoin",
      "buyBitcoin": "Comprare Bitcoin",
      "amountOfTransaction": {
        "amountOfTransaction": "Importo",
        "pleaseSelectCurrencyFirst": "Selezionare prima la valuta",
        "pleaseSelectLocationFirst": "Selezionare prima la località"
      },
      "premiumOrDiscount": {
        "premiumOrDiscount": "Premio o sconto",
        "youBuyForTheActualMarketPrice":
          "Si acquista al prezzo di mercato effettivo. Giocate con il cursore per vendere più velocemente o guadagnare di più.",
        "theOptimalPositionForMostPeople":
          "La posizione ottimale per la maggior parte delle persone. Comprate un po' più velocemente, ma a un prezzo un po' eccessivo.",
        "youBuyReallyFast":
          "Acquisti rapidamente, ma a un prezzo molto superiore a quello di mercato.",
        "youBuyPrettyCheap":
          "Comprate a poco prezzo, ma ci vuole un po' più di tempo per trovare un venditore.",
        "youBuyVeryCheaply":
          "Si acquista a prezzi molto bassi, ma può essere necessario un po' di tempo per trovare un venditore.",
        "buyFaster": "Comprare rapidamente",
        "buyCheaply": "Comprare a poco prezzo",
        "youSellForTheActualMarketPrice":
          "Vendete al prezzo effettivo di mercato. Giocare con il cursore per vendere più velocemente o guadagnare di più.",
        "youEarnBitMore":
          "Si guadagna un po' di più, ma può essere necessario un po' più di tempo.",
        "youWantToEarnFortune":
          "Volete guadagnare una fortuna, ma possono volerci anni per trovare un acquirente.",
        "youSellSlightlyFaster":
          "Vendete un po' più velocemente, ma un po' al di sotto del prezzo di mercato.",
        "youSellMuchFaster":
          "Vendete molto più velocemente, ma molto al di sotto del prezzo di mercato.",
        "youBuyBtcFor": "Comprate BTC a",
        "youSellBtcFor": "Vendete BTC a",
        "marketPrice": "prezzo di mercato",
        "sellFaster": "Vendete più velocemente",
        "earnMore": "Guadagnate di più",
        "premiumOrDiscountExplained": "Premio o sconto spiegato",
        "influenceImpactOfYourSellOffer":
          "Influenzate l'impatto della vostra offerta. Vendete più velocemente aggiungendo uno sconto o guadagnate di più aggiungendo un premio al prezzo di mercato del Bitcoin.",
        "influenceImpactOfYourBuyOffer":
          "Influenza l'impatto della tua offerta. Acquistate a buon mercato aggiungendo uno sconto o acquistate più velocemente aggiungendo un premio al prezzo di mercato del Bitcoin.",
        "playWithItAndSee":
          "Giocate e vedete come influisce sull'interesse degli altri.",
        "plus": "+",
        "minus": "-"
      },
      "buyCheaperByUsingDiscount":
        "Acquistate più a buon mercato utilizzando uno sconto o acquistate più velocemente aggiungendo un premio al prezzo di mercato del bitcoin.",
      "sellFasterWithDiscount":
        "Vendete più velocemente con uno sconto o guadagnate di più aggiungendo un premio al prezzo di mercato dei bitcoin.",
      "location": {
        "location": "Posizione",
        "meetingInPerson":
          "Incontrarsi di persona è più sicuro. A cosa prestare attenzione online?",
        "checkItOut": "Controlla",
        "addCityOrDistrict": "Aggiungi città o distretto",
        "whatToWatchOutForOnline": "A cosa fare attenzione online?",
        "moneySentByRandomPerson":
          "Il denaro inviato da una persona a caso può essere di origine criminale e rintracciabile.",
        "neverSendCrypto":
          "Non inviate mai bitcoin prima di aver ricevuto il pagamento.",
        "alwaysVerifyTheName":
          "Verificate sempre il nome del titolare del conto da cui avete ricevuto il pagamento con l'identità dichiarata della controparte.",
        "forwardTheAddress":
          "Inoltrate l'indirizzo in modo sicuro e assicuratevi di verificarlo attraverso un altro canale sicuro."
      },
      "inPerson": "Di persona",
      "online": "Online",
      "paymentMethod": {
        "paymentMethod": "Metodo di pagamento",
        "cash": "In contanti",
        "bank": "Banca",
        "revolut": "Pagamento online"
      },
      "network": {
        "network": "Rete",
        "lightning": "Fulmine",
        "theBestOption":
          "L'opzione migliore per importi molto piccoli. Di solito è superveloce.",
        "onChain": "A catena",
        "theBestFor": "La migliore per importi maggiori. Più lento."
      },
      "description": {
        "description": "Descrizione",
        "writeWhyPeopleShouldTake":
          "Scrivi perché le persone dovrebbero accettare la tua offerta."
      },
      "friendLevel": {
        "friendLevel": "Livello di amicizia",
        "firstDegree": "1° grado",
        "secondDegree": "2° grado",
        "noVexlers": "Nessun vexler",
        "reachVexlers": "Raggiungi {{count}} vexler"
      },
      "publishOffer": "Pubblica offerta",
      "errorCreatingOffer": "Errore durante la creazione dell'offerta",
      "errorSearchingForAvailableLocation":
        "Errore durante la ricerca delle sedi disponibili",
      "offerEncryption": {
        "encryptingYourOffer": "Crittografia dell'offerta ...",
        "dontShutDownTheApp":
          "Non spegnere l'app durante la crittografia. Può richiedere diversi minuti.",
        "forVexlers": "per {{count}} vexler",
        "doneOfferPoster": "Fatto! Offerta pubblicata.",
        "yourFriendsAndFriendsOfFriends":
          "I tuoi amici e gli amici dei loro amici possono ora vedere la tua offerta.",
        "anonymouslyDeliveredToVexlers":
          "Consegnata anonimamente a {{count}} vexler"
      },
      "noVexlersFoundForYourOffer": "Nessun vexler trovato per la tua offerta",
      "errorLocationNotFilled": "Inserisci il luogo dell'offerta",
      "errorDescriptionNotFilled": "Inserisci la descrizione dell'offerta"
    },
    "notifications": {
      "permissionsNotGranted": {
        "title": "I permessi per le notifiche non sono stati concessi",
        "message": "Puoi attivarle nelle impostazioni",
        "openSettings": "Aprire le impostazioni"
      },
      "errorWhileOpening": "Errore durante l'apertura della notifica"
    },
    "myOffers": {
      "addNewOffer": "Aggiungi una nuova offerta",
      "activeOffers": "{{count}} Offerte attive",
      "filterOffers": "Filtrare le offerte",
      "errorWhileFetchingYourOffers": "Errore durante la ricerca delle offerte",
      "editOffer": "Modifica offerta",
      "myOffer": "La mia offerta",
      "offerAdded": "Aggiunte {{date}}",
      "sortedByNewest": "Ordinate per più recenti",
      "sortedByOldest": "Ordinata per più vecchia"
    },
    "editOffer": {
      "editOffer": "Modifica offerta",
      "active": "Attivo",
      "inactive": "Inattivo",
      "saveChanges": "Salva le modifiche",
      "offerUnableToChangeOfferActivation":
        "Impossibile modificare l'attivazione dell'offerta",
      "editingYourOffer": "Modifica dell'offerta ...",
      "pleaseWait": "Attendere prego",
      "offerEditSuccess": "Successo della modifica dell'offerta",
      "youCanCheckYourOffer":
        "Puoi controllare la tua offerta nella sezione offerte",
      "errorEditingOffer": "Errore durante la modifica dell'offerta",
      "errorOfferNotFound": "Offerta non trovata!",
      "deletingYourOffer": "Eliminazione dell'offerta ...",
      "offerDeleted": "Offerta cancellata",
      "errorDeletingOffer": "Errore durante la cancellazione dell'offerta",
      "deleteOffer": "Cancellare l'offerta?",
      "deleteOfferDescription":
        "Sei sicuro di voler cancellare questa offerta? Questa azione non può essere annullata"
    },
    "filterOffers": {
      "filterResults": "Filtrare i risultati",
      "sorting": "Ordinamento",
      "lowestFeeFirst": "Tariffa più bassa",
      "highestFee": "Tariffa più alta",
      "newestOffer": "Offerta più recente",
      "oldestOffer": "Offerta più vecchia",
      "lowestAmount": "Importo più basso",
      "highestAmount": "Importo più alto",
      "selectSortingMethod": "Selezionare il metodo di ordinamento"
    },
    "messages": {
      "yourOffer": "La tua offerta",
      "theirOffer": "La loro offerta",
      "listTitle": "Chat",
      "isBuying": "sta comprando",
      "isSelling": "sta vendendo",
      "thisWillBeYourFirstInteraction":
        "Questa sarà la vostra prima interazione con questa offerta.",
      "wellLetYouKnowOnceUserAccepts":
        "Richiesta inviata. Ti informeremo quando l'altra parte avrà risposto.",
      "messagePreviews": {
        "incoming": {
          "MESSAGE": "{{them}}: {{message}}",
          "REQUEST_REVEAL": "{{them}} Richiesta di rivelazione dell'identità",
          "APPROVE_REVEAL": "Identità rivelata",
          "DISAPPROVE_REVEAL": "Ha rifiutato la rivelazione dell'identità",
          "REQUEST_MESSAGING": "Ha reagito alla tua offerta",
          "APPROVE_MESSAGING": "La richiesta è stata accettata",
          "DISAPPROVE_MESSAGING": "La richiesta è stata rifiutata",
          "DELETE_CHAT": "{{them}} ha lasciato la chat",
          "BLOCK_CHAT": "{{them}} ti ha bloccato",
          "OFFER_DELETED": "{{them}} ha cancellato l'offerta",
          "INBOX_DELETED": "{{them}} Ha cancellato la chat.",
          "CANCEL_REQUEST_MESSAGING": "La richiesta è stata annullata"
        },
        "outgoing": {
          "MESSAGE": "Io: {{message}}",
          "REQUEST_REVEAL": "Hai richiesto la rivelazione dell'identità",
          "APPROVE_REVEAL": "Identità rivelata",
          "DISAPPROVE_REVEAL": "Rivelazione di identità rifiutata",
          "REQUEST_MESSAGING": "Richiesta inviata",
          "APPROVE_MESSAGING": "Hai approvato la messaggistica",
          "DISAPPROVE_MESSAGING": "Hai rifiutato la richiesta di messaggistica",
          "DELETE_CHAT": "L'utente ha lasciato la chat",
          "BLOCK_CHAT": "L'utente è stato bloccato",
          "OFFER_DELETED": "Hai cancellato la tua offerta",
          "INBOX_DELETED": "Hai cancellato questa casella di posta",
          "CANCEL_REQUEST_MESSAGING":
            "La richiesta di messaggistica è stata annullata"
        }
      },
      "deleteChat": "Cancellare la chat",
      "askToReveal": "Chiedete di rivelare l'identità",
      "blockUser": "Bloccare l'utente",
      "sending": "invio...",
      "unknownErrorWhileSending":
        "Errore sconosciuto durante l'invio del messaggio",
      "tapToResent": "Toccare per inviare nuovamente il messaggio.",
      "deniedByMe":
        "La richiesta di messaggistica è stata negata con {{name}}.",
      "deniedByThem": "{{name}} ha negato la richiesta di messaggistica.",
      "requestMessageWasDeleted":
        "L'utente non ha fornito alcun messaggio iniziale.",
      "typeSomething": "Digitare qualcosa ...",
      "offerDeleted": "Offerta cancellata",
      "leaveToo": "Lasciare anche tu?",
      "leaveChat": "Lasciare la chat?",
      "deleteChatQuestion": "Cancellare la chat?",
      "blockForewerQuestion": "Bloccare per sempre?",
      "yesBlock": "Sì, blocco",
      "deleteChatExplanation1":
        "Hai finito di scambiare? Chiudere la chat significa che la conversazione verrà eliminata in modo permanente.",
      "deleteChatExplanation2":
        "Si tratta di un passaggio definitivo; confermate ancora una volta questa azione per cancellare la chat.",
      "blockChatExplanation1":
        "Vuoi davvero bloccare questo utente? Non sarà mai possibile annullare questa azione. Scegliete con saggezza.",
      "blockChatExplanation2":
        "Volete davvero bloccare questo utente? Non sarà mai possibile annullare questa azione. Scegliete con saggezza.",
      "chatEmpty": "Non ci sono ancora chat",
      "chatEmptyExplanation":
        "Avviate una conversazione richiedendo un'offerta",
      "seeOffers": "Vedi le offerte",
      "identityRevealRequestModal": {
        "title": "Inviare la richiesta di rivelazione dell'identità?",
        "text":
          "Inviando la richiesta accetti di rivelare anche la tua identità.",
        "send": "Invia richiesta"
      },
      "identityRevealRespondModal": {
        "title": "Vuoi rivelare la tua identità?",
        "text":
          "Se riveli la tua identità, vedrai anche l'identità della tua controparte."
      },
      "identityAlreadyRequested":
        "La richiesta di identità è già stata inviata nella conversazione",
      "identityRevealRequest": "Richiesta di rivelazione dell'identità",
      "identityRevealed": "Identità rivelata",
      "identitySend": {
        "title": "Richiesta di rivelazione dell'identità inviata",
        "subtitle": "in attesa di risposta"
      },
      "tapToReveal": "Toccare per rivelare o rifiutare",
      "letsRevealIdentities": "Riveliamo le identità!",
      "reveal": "Rivela",
      "themDeclined": "{{name}} rifiutato",
      "youDeclined": "Hai rifiutato",
      "reportOffer": "Segnala l'offerta",
      "ended": "Conclusa",
      "textMessageTypes": {
        "REQUEST_MESSAGING": "Richiesta inviata: {{message}}",
        "CANCEL_REQUEST_MESSAGING": "Richiesta annullata",
        "DISAPPROVE_MESSAGING": "Richiesta negata",
        "APPROVE_MESSAGING": "Richiesta approvata"
      },
      "youHaveAlreadyTalked":
        "Hai una cronologia dei messaggi con questo utente. Premere per vedere di più",
      "requestPendingActionBar": {
        "top": "La chat è in attesa di approvazione",
        "bottom":
          "Qui sopra sono riportate le comunicazioni che avete avuto con l'utente fino ad ora"
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
      "ENCRYPTING_PRIVATE_PAYLOADS": "{{percentDone}} Fatto",
      "FETCHING_CONTACTS": "",
      "CONSTRUCTING_PRIVATE_PAYLOADS": "Costruire i payload privati",
      "CONSTRUCTING_PUBLIC_PAYLOAD": "Costruire e criptare il payload pubblico",
      "SENDING_OFFER_TO_NETWORK": "Caricamento dell'offerta",
      "DONE": "Fatto"
    },
    "commonFriends": {
      "commonFriends": "Amici comuni",
      "commonFriendsCount": "{{commonFriendsCount}} Amici comuni"
    },
    "reportIssue": {
      "openInEmail": "Aprire in un'e-mail",
      "somethingWentWrong": "Qualcosa è andato storto",
      "feelFreeToGetInTouch": "Non esitate a contattare il nostro supporto.",
      "predefinedBody": "Salve! Sto segnalando un problema..."
    },
    "AppLogs": {
      "title": "Nei registri dell'app",
      "clear": "Cancella i registri",
      "export": "Esportazione dei registri",
      "errorExporting": "Errore nell'esportazione dei registri",
      "warning":
        "L'abilitazione dei registri dell'app potrebbe rendere l'applicazione più lenta e richiedere più spazio di archiviazione.",
      "anonymizeAlert": {
        "title": "Si desidera anonimizzare i registri?",
        "text":
          "Possiamo provare a eliminare le chiavi private e le informazioni personali dai registri prima di esportarli. Assicurarsi sempre di verificare personalmente."
      }
    },
    "MaintenanceScreen": {
      "title": "Manutenzione del mercato",
      "text":
        "L'applicazione Vexl è in manutenzione. Tornate più tardi, per favore."
    },
    "ForceUpdateScreen": {
      "title": "Nuova versione disponibile",
      "text":
        "Scaricate l'ultima versione di Vexl per una corretta funzionalità dell'app.",
      "action": "Aggiornare ora"
    },
    "btcPriceChart": {
      "requestCouldNotBeProcessed":
        "Richiesta di ottenere il prezzo attuale del BTC non riuscita"
    },
    "deepLinks": {
      "importContacts": {
        "alert": {
          "title": "Importazione di un contatto",
          "text":
            "Vuoi importare {{contactName}} con il numero {{contactNumber}}?"
        },
        "successAlert": {
          "title": "Contatto importato"
        }
      }
    },
    "qrCode": {
      "joinVexl": "Unisciti a vexl"
    },
    "editName": {
      "editName": "Modifica nome",
      "errorUserNameNotValid": "Il nome utente non è valido"
    },
    "changeProfilePicture": {
      "changeProfilePicture": "Cambia la foto del profilo",
      "uploadNewPhoto": "Carica una nuova foto"
    },
    "suggestion": {
      "vexl": "Vexl",
      "suggests": "suggerisce",
      "yourAppGuide": "La guida dell'app",
      "addMoreContacts": "Aggiungi altri contatti",
      "noOffersFromOthersYet":
        "🤔 Non ci sono ancora offerte da altri? Prova ad aggiungere altri contatti e aspetta ✌️.",
      "createYourFirstOffer":
        "👋 Crea la tua prima offerta per comprare o vendere Bitcoin."
    }
  }
/* JSON ends */

export default otherIt
