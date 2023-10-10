import type en from "./other.en"

const otherFr: typeof en =
  /* JSON starts */
  {
    "common": {
      "next": "Suivant",
      "skip": "Sauter",
      "finish": "Terminer",
      "confirm": "Confirmer",
      "continue": "Continuer",
      "save": "Sauvegarder",
      "gotIt": "Okay",
      "search": "Rechercher",
      "deselectAll": "Désélectionner tout",
      "selectAll": "Sélectionner tout",
      "cancel": "Annuler",
      "unknownError": "Erreur inconnue",
      "unexpectedServerResponse": "Réponse inattendue du serveur",
      "networkErrors": {
        "errNetwork":
          "Une erreur de réseau s'est produite. Êtes-vous connecté à l'internet ?",
        "errCanceled": "La demande a été annulée",
        "etimedout": "La demande a expiré",
        "econnaborted": "Connexion interrompue"
      },
      "submit": "Soumettre",
      "cryptoError": "Erreur de cryptographie inattendue",
      "secondsShort": "s",
      "ok": "ok",
      "request": "Demande d'information",
      "back": "Retour",
      "goBack": "Retourner",
      "close": "Fermer",
      "done": "Terminé",
      "errorCreatingInbox":
        "Erreur lors de la création de la boîte de réception de l'utilisateur.",
      "accept": "Accepter",
      "decline": "Refuser",
      "youSure": "Etes-vous sûr ?",
      "nope": "Non",
      "yesDelete": "Oui, supprimer",
      "more": "Plus de",
      "yes": "Oui",
      "no": "Non",
      "myOffers": "Mes offres",
      "errorOpeningLink": {
        "message": "Erreur lors de l'ouverture du lien",
        "text": "Copier dans le presse-papiers à la place ?",
        "copy": "Copier et fermer"
      },
      "nice": "Bien",
      "success": "Succès !",
      "requested": "Demandé",
      "now": "Maintenant",
      "declined": "Refusé",
      "reset": "Réinitialiser",
      "you": "Vous",
      "allow": "Autoriser",
      "currency": "Monnaie",
      "whatDoesThisMean": "Qu'est-ce que cela signifie ?",
      "learnMore": "En savoir plus",
      "unableToShareImage": "Impossible de partage l'image",
      "requestAgain": "Réitérer la demande",
      "seeDetail": "See details",
      "notNow": "Not now",
      "niceWithExclamationMark": "Nice!",
      "nothingFound": "Nothing found",
      "sendRequest": "Send request",
      "change": "Change",
      "errorWhileReadingQrCode": "Error while reading QR code",
      "copyErrorToClipboard": "Copy error to clipboard",
      "me": "Me",
      "error": "Error",
      "chatNotFoundError": "Chat not found!"
    },
    "loginFlow": {
      "anonymityNotice":
        "Personne ne verra ceci tant que vous ne l'aurez pas autorisé. Pas même nous.",
      "intro": {
        "title1": "Importez vos contacts de manière anonyme.",
        "title2": "Consultez leurs offres d'achat et de vente.",
        "title3": "Demandez l'identité de ceux qui vous plaisent et échangez."
      },
      "start": {
        "subtitle": "Bienvenue sur le site ! Prêt à commencer ?",
        "touLabel": "J'accepte les",
        "termsOfUse": "Conditions d'utilisation"
      },
      "anonymizationNotice": {
        "title": "Votre identité sera anonymisée.",
        "text":
          "Personne ne verra votre vrai nom et votre photo de profil jusqu'à ce que vous les révéliez vous mêmes lors d'une transaction précise. Pas même nous. Commençons par définir votre véritable identité."
      },
      "name": {
        "prompt": "Comment vos amis vous appellent-ils ?",
        "placeholder": "Nom ou surnom",
        "nameValidationError": "Le nom doit comporter entre 1 et 50 caractères"
      },
      "photo": {
        "title": "Salut {{name}} ! À quoi ressemblez-vous ?",
        "selectSource": "Sélectionnez la source de votre image",
        "camera": "Appareil photo",
        "gallery": "Galerie",
        "permissionsNotGranted": "Permissions non accordées.",
        "nothingSelected": "Aucune image n'a été sélectionnée"
      },
      "anonymization": {
        "beforeTitle": "Ceci est votre profil privé",
        "afterTitle": "Identité anonymisée !",
        "action": "Anonymiser",
        "afterDescription":
          "C'est ainsi que les autres utilisateurs vous verront jusqu'à ce que vous révéliez votre véritable identité."
      },
      "phoneNumber": {
        "title": "Quel est votre numéro de téléphone ?",
        "placeholder": "Numéro de téléphone",
        "text":
          "Afin de vous mettre en relation avec la communauté Vexl, entrez votre numéro de téléphone",
        "errors": {
          "invalidPhoneNumber":
            "Numéro de téléphone non valide. Veuillez réessayer.",
          "previousCodeNotExpired":
            "La vérification de ce numéro de téléphone est déjà en cours. Veuillez patienter jusqu'à son expiration"
        }
      },
      "verificationCode": {
        "title": "Nous venons de vous envoyer le code de vérification",
        "text": "Saisissez-le ci-dessous pour vérifier",
        "inputPlaceholder": "Votre code de vérification",
        "retryCountdown": "Vous n'avez pas reçu de code ? Envoyer à nouveau",
        "retry": "Vous n'avez pas reçu de code ? Tapez pour renvoyer",
        "errors": {
          "userAlreadyExists":
            "L'utilisateur ayant ce numéro de téléphone existe déjà",
          "challengeCouldNotBeGenerated":
            "Le défi n'a pas pu être généré. Réessayez plus tard",
          "verificationNotFound": "Code de vérification erroné.",
          "UserNotFound":
            "L'utilisateur n'a pas été trouvé. Essayez de renvoyer le code.",
          "SignatureCouldNotBeGenerated":
            "La signature n'a pas pu être générée. Réessayer plus tard",
          "PublicKeyOrHashInvalid":
            "La clé publique ou le hachage n'est pas valide. Réessayer plus tard"
        },
        "success": {
          "title": "Numéro de téléphone vérifié.\nConfigurons votre profil.",
          "errorWhileParsingSessionForInternalState":
            "Erreur lors de l'enregistrement de l'utilisateur"
        }
      },
      "importContacts": {
        "title": "Maintenant, trouvons vos amis !",
        "text":
          "Vexl utilise votre réseau social réel - vos amis et leurs amis. Plus vous ajoutez de contacts, plus vous recevrez d'offres.",
        "anonymityNotice": "Personne ne peut voir vos contacts. Même pas nous.",
        "action": "Importer des contacts"
      }
    },
    "postLoginFlow": {
      "contactsExplanation": {
        "title": "Maintenant, trouvons vos amis !",
        "text":
          "Vexl vous connecte de manière anonyme avec vos amis et les amis de vos amis. Vous pouvez ensuite gérer vos contacts et choisir ceux que vous souhaitez inclure dans votre réseau social.",
        "anonymizationCaption":
          "Personne ne peut voir vos contacts. Même pas nous."
      },
      "importContactsButton": "Importer des contacts",
      "contactsList": {
        "addContactManually": "Ajouter un contact {{number}} manuellement",
        "inputPlaceholder": "Rechercher ou ajouter un numéro",
        "nothingFound": {
          "title": "Aucun contact n'a été trouvé.",
          "text":
            "Pour ajouter un numéro de téléphone directement, saisissez-le dans la barre de recherche (avec le préfixe du code pays)."
        },
        "toAddCustomContact":
          "Pour ajouter un numéro de téléphone directement, tapez-le dans la barre de recherche (avec le préfixe du pays).",
        "addContact": "Ajouter un contact",
        "addThisPhoneNumber":
          "Would you like to add this phone number to your Vexl contacts?",
        "addContactName": "Add contact name",
        "contactAdded": "Contact added.",
        "youHaveAddedContact":
          "You have added {{contactName}} to your Vexl contacts.",
        "submitted": "Submitted",
        "new": "New",
        "nonSubmitted": "Non-submitted"
      },
      "allowNotifications": {
        "title": "Autoriser les notifications",
        "text":
          "L'activation des notifications vous permet de savoir quand d'autres personnes acceptent vos offres ou quand des messages arrivent.",
        "action": "Autoriser",
        "cancel": "Sauter",
        "errors": {
          "permissionDenied":
            "Permissions non accordées. Vous pouvez les autoriser ultérieurement dans les paramètres du système.",
          "unknownError": "Erreur inconnue lors de la demande d'autorisations",
          "notAvailableOnEmulator":
            "Les notifications ne sont pas disponibles sur l'émulateur"
        },
        "vexlCantBeUsedWithoutNotifications":
          "L'application Vexl ne peut être utilisée sans cette autorisation."
      }
    },
    "settings": {
      "yourReach": "Votre portée : {{number}} vexlers",
      "items": {
        "changeProfilePicture": "Modifier ma photo de profil",
        "editName": "Modifier mon pseudo",
        "contactsImported": "Gestion des contacts",
        "xFriends": "{{number}} amis",
        "setPin": "Définir le code PIN",
        "faceId": "Reconnaissance faciale",
        "allowScreenshots": "Autoriser les captures d'écran",
        "allowScreenshotsDescription":
          "Empêcher les utilisateurs de prendre des captures d'écran de la discussion.",
        "termsAndPrivacy": "Conditions d'utilisation et confidentialité",
        "faqs": "FAQ",
        "reportIssue": "Signaler un problème",
        "inAppLogs": "Journaux in-app",
        "requestKnownData": "Demander des données connues",
        "followUsOn": "Suivez-nous sur",
        "twitter": "sur Twitter",
        "twitterUrl": "https://twitter.com/vexl",
        "readMoreOn": "En savoir plus sur",
        "medium": "Médium",
        "mediumUrl": "https://blog.vexl.it",
        "learnMoreOn": "En savoir plus sur",
        "website": "Vexl.it",
        "websiteUrl": "https://vexl.it",
        "deleteAccount": "Supprimer le compte",
        "supportEmail": "support@vexl.it"
      },
      "noLogoutExplanation":
        "Vous ne trouvez pas la déconnexion ? Cela n'existe pas.\nMais vous pouvez supprimer votre compte.",
      "support":
        "Si vous aimez Vexl, soutenez son développement en envoyant quelques bitcoins en guise de don !",
      "version": "Version de l'application Vexl : {{version}}",
      "logoutDialog": {
        "title": "Supprimer le compte ?",
        "title2": "Vous êtes sûr ?",
        "description":
          "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action ne peut pas être annulée"
      }
    },
    "offer": {
      "title": "Offre",
      "cashOnly": "En espèces uniquement",
      "onlineOnly": "En ligne uniquement",
      "upTo": "Jusqu'à",
      "forSeller": "Pour le vendeur",
      "forBuyer": "Pour l'acheteur",
      "bank": "Banque",
      "revolut": "Paiement en ligne",
      "isSelling": "vend",
      "isBuying": "achète",
      "directFriend": "Ami direct",
      "friendOfFriend": "Ami d'un ami",
      "buy": "Acheter",
      "sell": "Vendre",
      "filterOffers": "Filtrer les offres",
      "numberOfCommon": "{{number}} commun",
      "offerNotFound":
        "Offre non trouvée. Elle a peut-être été supprimée par l'auteur",
      "inputPlaceholder": "Tape ton message ici...",
      "sendRequest": "Envoyer une demande",
      "report": {
        "areYouSureTitle": "Signaler l'offre ?",
        "areYouSureText":
          "Êtes-vous certain de vouloir signaler cette offre ? Une fois signalée, vous ne pourrez pas revenir en arrière. Choisissez judicieusement.",
        "yes": "Oui, signaler",
        "thankYou": "Merci pour ton aide!",
        "inappropriateContentWasReported":
          "Un contenu inapproprié a été signalé de manière anonyme.",
        "reportLimitReached":
          "You have reached the maximum number of reports for today. Try again in 24 hours."
      },
      "goToChat": "Aller au chat",
      "requestStatus": {
        "requested":
          "Vous avez sollicité une transaction. Nous vous informerons dès que votre demande sera acceptée.",
        "accepted": "Votre demande a été acceptée.",
        "denied": "Votre demande a été refusée.",
        "initial": "Il s'agit de votre première interaction avec cette offre.",
        "cancelled":
          "Vous avez annulé une demande de transaction pour cette offre.",
        "deleted":
          "Vous avez déjà interagi avec cette offre auparavant mais vous avez supprimé la conversation",
        "otherSideLeft":
          "Vous avez déjà interagi avec cette offre auparavant mais l'autre partie a quitté le chat",
        "leaved": "Avete già interagito con questa offerta in precedenza"
      },
      "listEmpty":
        "Votre place de marché est en train de chauffer. Revenez dans quelques minutes !",
      "emptyAction": "Ajouter une nouvelle offre",
      "createOfferAndReachVexlers":
        "Vous atteignez {{reachNumber}} vexlers.\nAjoutez d'autres contacts pour augmenter le nombre d'offres que vous voyez.",
      "filterActive": "Filtre actif",
      "totalOffers": "Total : {{totalCount}} offres",
      "notImportedAnyContacts":
        "Vous n'avez pas importé de contacts. Importer des contacts pour voir les offres de votre réseau",
      "socialNetworkTooSmall":
        "Vous n'avez importé que quelques contacts, il est donc possible que vous ne voyiez pas d'offres.",
      "noOffersToMatchFilter":
        "Aucune offre ne correspond à vos critères de filtrage",
      "offersAreLoadingAndShouldBeReady":
        "Les offres sont en cours de chargement et devraient être prêtes dans {{minutes}} minutes.",
      "marketplaceEmpty": "Place de marché vide, pour l'instant",
      "resetFilter": "Réinitialiser le filtre",
      "totalFilteredOffers":
        "Filtré : Offres {{count}} (sur un total de {{totalCount}})",
      "offerFromDirectFriend": "Offre d'un ami direct",
      "offerFromFriendOfFriend": "Offre d'un ami d'ami",
      "youSeeThisOfferBecause":
        "Vous voyez cette offre parce que l'autre partie a enregistré votre numéro de téléphone dans sa liste de contacts.",
      "beCautiousWeCannotVerify":
        "Soyez prudent, nous ne pouvons pas vérifier si vous vous connaissez vraiment dans la vie réelle.",
      "dontForgetToVerifyTheIdentity":
        "N'oubliez pas de vérifier son identité auprès d'un contact commun.",
      "noDirectConnection":
        "Il s'agit d'un contact avec lequel vous n'avez pas de lien direct.",
      "rerequestTomorrow": "Vous pourrez envoyer une nouvelle demande demain",
      "rerequestDays":
        "Vous pourrez envoyer une nouvelle demande dans {{days}} jours",
      "rerequest": "Envoyer une nouvelle demande",
      "cancelRequest": "Annuler la demande",
      "requestWasCancelledByOtherSide":
        "Impossible d'approuver. L'autre partie a annulé la demande",
      "requestNotFound":
        "Impossible d'approuver. L'autre partie a supprimé son compte",
      "otherSideAccountDeleted": "Other side has deleted their account",
      "createOfferNudge":
        "Expand your reach within the social network and be the first one to create an offer for this criteria.",
      "offerAuthorSpeaks": "{{name}} speaks {{spokenLanguages}}"
    },
    "termsOfUse": {
      "termsOfUse": "Conditions d'utilisation",
      "privacyPolicy": "Politique de confidentialité",
      "dontHaveTime":
        "Vous n'avez pas le temps de tout lire ? Jetez un coup d'œil à la Foire aux questions !",
      "cautiousNoticeAboutMachineTranslation":
        "Cautious Notice: The following text has undergone machine translation for your convenience, to access the original English version, proceed to the web."
    },
    "faqs": {
      "faqs": "Foire aux questions",
      "whatIsVexl": "Qu'est-ce que Vexl ?",
      "vexlIsPlatform":
        "Vexl est une plateforme qui vous permet d'échanger des bitcoins au sein de votre sphère sociale réelle - vos amis et les amis de leurs amis - tout en restant complètement anonyme, si vous le souhaitez.",
      "whoCanSeeMyContacts": "Qui peut voir mes contacts ?",
      "peopleWhomYouAllowToSee":
        "Les personnes que vous autorisez à voir votre identité peuvent voir les amis que vous avez en commun et c'est tout.",
      "howCanIRemainAnonymous":
        "Comment rester anonyme tout en participant à Vexl ?",
      "byDefaultYouParticipateInTheNetwork":
        "Par défaut, vous participez au réseau sous le nom et l'avatar Vexl qui vous ont été attribués lors de votre inscription. Vous ne pouvez révéler votre identité que pour un échange précis au sein de notre chat sécurisé et crypté de bout en bout.",
      "howCanIMakeSure":
        "Comment puis-je m'assurer que la personne à qui je parle est bien celle à qui je veux parler ?",
      "oneChallenge":
        "L'un des défis des systèmes de communication véritablement anonymes comme Vexl est qu'il est parfois nécessaire de vérifier l'identité de la personne à qui l'on parle ! Dans ce cas, il est préférable d'utiliser un canal de communication secondaire sécurisé pour confirmer à l'autre personne que vous êtes bien tous les deux ce que vous prétendez être.",
      "howCanIEnsure":
        "Comment puis-je m'assurer que mes communications et mes transactions sont privées et cryptées ?",
      "vexlIsOpensource":
        "Vexl est un logiciel libre - tout le monde peut chercher une porte dérobée ou une intention malveillante. Vous pouvez également consulter le rapport d'un audit de sécurité indépendant.",
      "howCanYouEnsure":
        "Comment pouvez-vous garantir la protection de mes données ?",
      "vexlIsDesigned":
        "Vexl est conçu pour ne jamais collecter ou stocker d'informations sensibles. Les messages et autres contenus de Vexl ne sont accessibles ni par nous ni par des tiers, car ils sont toujours cryptés de bout en bout, privés et sécurisés. Nos conditions d'utilisation et notre politique de confidentialité sont disponibles ci-dessous.",
      "howDoIContactVexl": "Comment puis-je contacter Vexl ?",
      "youCanAlwaysReachOutToUs":
        "Vous pouvez toujours nous contacter par e-mail : support@vexl.it. Pour une communication privée, vous pouvez également nous envoyer un message E2EE. Vous pouvez également nous rencontrer lors de votre prochain échange P2P ! 😻"
    },
    "offerForm": {
      "myNewOffer": "Nouvelle offre",
      "iWantTo": "Je souhaite",
      "sellBitcoin": "Vendre des bitcoins",
      "buyBitcoin": "Acheter des bitcoins",
      "amountOfTransaction": {
        "amountOfTransaction": "Montant",
        "pleaseSelectCurrencyFirst": "Veuillez d'abord sélectionner la devise",
        "pleaseSelectLocationFirst": "Veuillez d'abord sélectionner le lieu"
      },
      "premiumOrDiscount": {
        "premiumOrDiscount": "Prime ou remise",
        "youBuyForTheActualMarketPrice":
          "Vous achetez au prix réel du marché. Jouez avec le curseur pour vendre plus vite ou gagner plus.",
        "theOptimalPositionForMostPeople":
          "C'est la position optimale pour la plupart des gens. Vous achetez un peu plus vite, mais à un prix un peu plus élevé que celui du marché.",
        "youBuyReallyFast":
          "Vous achetez rapidement, mais à un prix nettement supérieur à celui du marché.",
        "youBuyPrettyCheap":
          "Vous achetez à bas prix, mais cela peut prendre un peu plus de temps pour trouver un vendeur.",
        "youBuyVeryCheaply":
          "Vous achetez à un prix très bas, mais cela peut prendre un certain temps pour trouver un vendeur",
        "buyFaster": "Acheter rapidement",
        "buyCheaply": "Acheter à bas prix",
        "youSellForTheActualMarketPrice":
          "Vous vendez au prix réel du marché. Jouez avec le curseur pour vendre plus vite ou gagner plus.",
        "youEarnBitMore":
          "Vous gagnez un peu plus, mais cela peut prendre un peu plus de temps.",
        "youWantToEarnFortune":
          "Vous voulez gagner une fortune, mais cela peut prendre des années pour trouver un acheteur.",
        "youSellSlightlyFaster":
          "Vous vendez un peu plus vite, mais un peu en dessous du prix du marché",
        "youSellMuchFaster":
          "Vous vendez beaucoup plus vite, mais bien en dessous du prix du marché",
        "youBuyBtcFor": "Vous achetez des BTC pour",
        "youSellBtcFor": "Vous vendez des BTC pour",
        "marketPrice": "le prix du marché",
        "sellFaster": "Vendre plus vite",
        "earnMore": "Gagner plus",
        "premiumOrDiscountExplained": "Explication de la prime ou de la remise",
        "influenceImpactOfYourSellOffer":
          "Influencez l'impact de votre offre. Vendez plus rapidement en ajoutant une remise, ou gagnez plus en ajoutant une prime au prix du marché du bitcoin.",
        "influenceImpactOfYourBuyOffer":
          "Influencez l'impact de votre offre. Achetez à bas prix en ajoutant une remise, ou achetez plus rapidement en ajoutant une prime au prix du marché du bitcoin.",
        "playWithItAndSee":
          "Jouez avec et voyez comment cela affecte l'intérêt des autres.",
        "plus": "+",
        "minus": "-",
        "youEarnSoMuchMore": "You earn so much more, but it can take a while."
      },
      "buyCheaperByUsingDiscount":
        "Achetez moins cher en utilisant une remise ou achetez plus rapidement en ajoutant une prime au prix du marché du bitcoin.",
      "sellFasterWithDiscount":
        "Vendez plus rapidement avec une remise ou gagnez plus en ajoutant une prime au prix du marché du bitcoin.",
      "location": {
        "location": "Lieu de rencontre",
        "meetingInPerson":
          "Il est plus sûr de se rencontrer en personne. À quoi faut-il faire attention en ligne ?",
        "checkItOut": "Vérifier",
        "addCityOrDistrict": "Ajouter une ville ou un quartier",
        "whatToWatchOutForOnline": "De quoi faut-il se méfier en ligne ?",
        "moneySentByRandomPerson":
          "L'argent envoyé par une personne inconnue peut être d'origine criminelle et peut être traçable.",
        "neverSendCrypto":
          "N'envoyez jamais de bitcoins avant d'avoir reçu un paiement.",
        "alwaysVerifyTheName":
          "Vérifiez toujours le nom du titulaire du compte dont vous avez reçu le paiement avec l'identité déclarée de la contrepartie.",
        "forwardTheAddress":
          "Transmettez l'adresse de manière sécurisée et assurez-vous de la vérifier par un autre canal sécurisé."
      },
      "inPerson": "En personne",
      "online": "En ligne",
      "paymentMethod": {
        "paymentMethod": "Mode de paiement",
        "cash": "Espèces",
        "bank": "Banque",
        "revolut": "Paiement en ligne"
      },
      "network": {
        "network": "Réseau",
        "lightning": "L'éclair",
        "theBestOption":
          "La meilleure option pour les très petits montants. Généralement très rapide.",
        "onChain": "On chain",
        "theBestFor":
          "La meilleure option pour les montants plus importants. Plus lent."
      },
      "description": {
        "description": "Description",
        "writeWhyPeopleShouldTake":
          "Expliquez pourquoi les gens devraient accepter votre offre."
      },
      "friendLevel": {
        "friendLevel": "Niveau d'amitié",
        "firstDegree": "1er degré",
        "secondDegree": "2ème degré",
        "noVexlers": "Pas de vexlers",
        "reachVexlers": "Atteindre {{count}} vexlers"
      },
      "publishOffer": "Publier l'offre",
      "errorCreatingOffer": "Erreur lors de la création de l'offre",
      "errorSearchingForAvailableLocation":
        "Erreur lors de la recherche de lieux disponibles",
      "offerEncryption": {
        "encryptingYourOffer": "Cryptage de votre offre ...",
        "dontShutDownTheApp":
          "Ne fermez pas l'application pendant le cryptage. Cela peut prendre plusieurs minutes.",
        "forVexlers": "pour {{count}} vexlers",
        "doneOfferPoster": "C'est fait ! L'offre a été publiée.",
        "yourFriendsAndFriendsOfFriends":
          "Vos amis et les amis de leurs amis peuvent maintenant voir votre offre.",
        "anonymouslyDeliveredToVexlers":
          "Livraison anonyme à {{count}} vexlers"
      },
      "noVexlersFoundForYourOffer":
        "Aucun vexler n'a été trouvée pour votre offre.",
      "errorLocationNotFilled": "Veuillez indiquer le lieu de l'offre",
      "errorDescriptionNotFilled": "Veuillez remplir la description de l'offre",
      "selectCurrency": "Select currency",
      "currencyYouWouldLikeToUse":
        "The currency you would like to use in your trade.",
      "spokenLanguages": {
        "indicatePreferredLanguage": "Indicate preferred language",
        "ENG": "English",
        "DEU": "German",
        "CZE": "Czech",
        "SVK": "Slovak",
        "PRT": "Portuguese",
        "FRA": "French",
        "ITA": "Italian",
        "ESP": "Spanish",
        "language": "Language",
        "preferredLanguages": "Preferred languages"
      }
    },
    "notifications": {
      "permissionsNotGranted": {
        "title":
          "Les autorisations pour les notifications n'ont pas été accordées",
        "message": "Vous pouvez les activer dans les paramètres",
        "openSettings": "Ouvrir les paramètres"
      },
      "errorWhileOpening": "Erreur lors de l'ouverture d'une notification",
      "MESSAGE": {
        "title": "New message",
        "body": "You have received a new message."
      },
      "REQUEST_REVEAL": {
        "title": "Identity request received",
        "body": "You have been requested to reveal your identity."
      },
      "APPROVE_REVEAL": {
        "title": "Identity revealed!",
        "body": "Your request to reveal identities was approved."
      },
      "DISAPPROVE_REVEAL": {
        "title": "Identity request denied",
        "body": "Your request to reveal identities was denied."
      },
      "REQUEST_MESSAGING": {
        "title": "New request!",
        "body": "You have received a new request."
      },
      "APPROVE_MESSAGING": {
        "title": "Request approved!",
        "body": "Your request was approved."
      },
      "DISAPPROVE_MESSAGING": {
        "title": "Request denied",
        "body": "Your request was denied."
      },
      "DELETE_CHAT": {
        "title": "Chat deleted",
        "body": "One of your chats has been deleted."
      },
      "BLOCK_CHAT": {
        "title": "You've been blocked",
        "body": "Someone has just blocked you."
      },
      "INACTIVITY_REMINDER": {
        "title": "Login to prevent deactivation of your offers.",
        "body":
          "You have not logged in for a long time. Login to prevent deactivation of your offers."
      },
      "preferences": {
        "marketing": {
          "title": "Marketing notification",
          "body": "Notification about new features etc..."
        },
        "chat": {
          "title": "Chat notifications",
          "body":
            "Notifications about new chat messages, requests, identity reveals etc..."
        },
        "inactivityWarnings": {
          "title": "Inactivity warnings",
          "body":
            "We will let you know when your offers are about to be deactivated due to innactivity"
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
        "screenTitle": "Notifications Settings"
      },
      "REQUEST_CONTACT_REVEAL": {
        "title": "Phone number requested",
        "body": "You have been requested to reveal your phone number."
      },
      "APPROVE_CONTACT_REVEAL": {
        "title": "Phone number revealed!",
        "body": "Your request to reveal phone numbers was approved."
      },
      "DISAPPROVE_CONTACT_REVEAL": {
        "title": "Request denied!",
        "body": "Your request to reveal phone numbers was denied."
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
      "addNewOffer": "Ajouter une nouvelle offre",
      "activeOffers": "{{count}} offres actives",
      "filterOffers": "Filtrer les offres",
      "errorWhileFetchingYourOffers": "Erreur lors de la recherche d'offres",
      "editOffer": "Modifier l'offre",
      "myOffer": "Mon offre",
      "offerAdded": "Ajouté {{date}}",
      "sortedByNewest": "Classé par le plus récent",
      "sortedByOldest": "Classé par le plus ancien",
      "offerToSell": "You are selling",
      "offerToBuy": "You are buying"
    },
    "editOffer": {
      "editOffer": "Modifier l'offre",
      "active": "Actif",
      "inactive": "Inactif",
      "saveChanges": "Enregistrer les modifications",
      "offerUnableToChangeOfferActivation":
        "Impossible de modifier l'activation de l'offre",
      "editingYourOffer": "Modifier votre offre ...",
      "pleaseWait": "Veuillez patienter",
      "offerEditSuccess": "Réussite de l'édition de l'offre",
      "youCanCheckYourOffer":
        "Vous pouvez vérifier votre offre dans la section 'Mes offres'",
      "errorEditingOffer": "Erreur lors de la modification de l'offre",
      "errorOfferNotFound": "L'offre n'a pas été trouvée !",
      "deletingYourOffer": "Supprimer votre offre ...",
      "offerDeleted": "Offre supprimée",
      "errorDeletingOffer": "Erreur lors de la suppression de l'offre",
      "deleteOffer": "Supprimer l'offre ?",
      "deleteOfferDescription":
        "Êtes-vous sûr de vouloir supprimer cette offre ? Cette action ne peut être annulée"
    },
    "filterOffers": {
      "filterResults": "Filtrer les résultats",
      "sorting": "Trier",
      "lowestFeeFirst": "Tarif le plus bas",
      "highestFee": "Tarif le plus élevé",
      "newestOffer": "Offre la plus récente",
      "oldestOffer": "Offre la plus ancienne",
      "lowestAmount": "Montant le plus bas",
      "highestAmount": "Montant le plus élevé",
      "selectSortingMethod": "Sélectionner la méthode de tri",
      "searchByText": "Search by text",
      "noTextFilter": "No text filter selected",
      "chooseCurrency": "Choose currency"
    },
    "messages": {
      "yourOffer": "Votre offre",
      "theirOffer": "Leur offre",
      "listTitle": "Chats",
      "isBuying": "achète",
      "isSelling": "vend",
      "thisWillBeYourFirstInteraction":
        "Il s'agit de votre première interaction avec cette offre.",
      "wellLetYouKnowOnceUserAccepts":
        "Demande envoyée. Nous vous informerons dès que l'autre partie aura répondu.",
      "messagePreviews": {
        "incoming": {
          "MESSAGE": "{{them}} : {{message}}",
          "REQUEST_REVEAL": "{{them}} demande de révélation d'identité",
          "APPROVE_REVEAL": "Identité révélée",
          "DISAPPROVE_REVEAL": "Refusé la révélation de l'identité",
          "REQUEST_MESSAGING": "A réagi à votre offre",
          "APPROVE_MESSAGING": "La demande a été acceptée",
          "DISAPPROVE_MESSAGING": "La demande a été refusée",
          "DELETE_CHAT": "{{them}} a quitté la discussion",
          "BLOCK_CHAT": "{{them}} vous a bloqué",
          "OFFER_DELETED": "{{them}} a supprimé l'offre",
          "INBOX_DELETED": "{{them}} a supprimé la discussion.",
          "CANCEL_REQUEST_MESSAGING": "La demande a été annulée",
          "ONLY_IMAGE": "{{them}} sent an image",
          "REQUEST_CONTACT_REVEAL": "{{them}} requested phone number reveal",
          "APPROVE_CONTACT_REVEAL": "Phone number revealed",
          "DISAPPROVE_CONTACT_REVEAL": "Declined phone number reveal"
        },
        "outgoing": {
          "MESSAGE": "Moi : {{message}}",
          "REQUEST_REVEAL": "Vous avez demandé la révélation d'identité",
          "APPROVE_REVEAL": "Identité révélée",
          "DISAPPROVE_REVEAL": "Révélation d'identité refusée",
          "REQUEST_MESSAGING": "Demande envoyée",
          "APPROVE_MESSAGING": "Vous avez approuvé l'envoi de messages",
          "DISAPPROVE_MESSAGING": "Vous avez refusé la demande de messagerie",
          "DELETE_CHAT": "Vous avez quitté le chat",
          "BLOCK_CHAT": "L'utilisateur a été bloqué",
          "OFFER_DELETED": "Vous avez supprimé votre offre",
          "INBOX_DELETED": "Vous avez supprimé cette boîte de réception",
          "CANCEL_REQUEST_MESSAGING":
            "Vous avez annulé la demande de messagerie",
          "ONLY_IMAGE": "You have sent an image",
          "REQUEST_CONTACT_REVEAL": "You have requested phone number reveal",
          "APPROVE_CONTACT_REVEAL": "Phone number was revealed",
          "DISAPPROVE_CONTACT_REVEAL": "Phone number reveal was declined"
        }
      },
      "deleteChat": "Supprimer le chat",
      "askToReveal": "Demander à révéler son identité",
      "blockUser": "Bloquer l'utilisateur",
      "sending": "envoyer...",
      "unknownErrorWhileSending": "Erreur inconnue lors de l'envoi du message",
      "tapToResent": "Tapez pour renvoyer le message.",
      "deniedByMe": "Vous avez refusé la demande de messagerie avec {{name}}.",
      "deniedByThem": "{{name}} a rejeté votre demande de messagerie.",
      "requestMessageWasDeleted":
        "L'utilisateur n'a pas fourni de message initial.",
      "typeSomething": "Tapez quelque chose ...",
      "offerDeleted": "Offre supprimée",
      "leaveToo": "Quitter l'offre ?",
      "leaveChat": "Quitter le chat ?",
      "deleteChatQuestion": "Supprimer le chat ?",
      "blockForewerQuestion": "Bloquer pour toujours ?",
      "yesBlock": "Oui, bloquer",
      "deleteChatExplanation1":
        "Avez-vous fini de négocier ? Fermer le chat signifie que votre conversation sera définitivement supprimée.",
      "deleteChatExplanation2":
        "Il s'agit d'une étape définitive, veuillez confirmer cette action une nouvelle fois pour supprimer le chat.",
      "blockChatExplanation1":
        "Voulez-vous vraiment bloquer cet utilisateur ? Vous ne pourrez jamais annuler cette action. Choisissez judicieusement.",
      "blockChatExplanation2":
        "Voulez-vous vraiment bloquer cet utilisateur ? Vous ne pourrez jamais annuler cette action. Choisissez judicieusement.",
      "chatEmpty": "Pas encore de chat",
      "chatEmptyExplanation": "Entamer une conversation en demandant une offre",
      "seeOffers": "Voir les offres",
      "identityRevealRequestModal": {
        "title": "Envoyer une demande de révélation d'identité ?",
        "text":
          "En envoyant une demande, vous acceptez que votre identité soit également révélée.",
        "send": "Envoyer une demande"
      },
      "identityRevealRespondModal": {
        "title": "Voulez-vous révéler votre identité ?",
        "text":
          "Si vous révélez votre identité, vous verrez également l'identité de votre contrepartie."
      },
      "identityAlreadyRequested":
        "Une demande d'identité a déjà été envoyée dans la conversation",
      "identityRevealRequest": "Demande de révélation d'identité",
      "identityRevealed": "Identité révélée",
      "identitySend": {
        "title": "Demande de révélation d'identité envoyée",
        "subtitle": "en attente de réponse"
      },
      "tapToReveal": "Tapez pour révéler ou refuser",
      "letsRevealIdentities": "Révélons les identités !",
      "reveal": "Révéler",
      "themDeclined": "{{name}} a refusé",
      "youDeclined": "Vous avez refusé",
      "reportOffer": "Signaler une offre",
      "ended": "Terminé",
      "textMessageTypes": {
        "REQUEST_MESSAGING": "Demande envoyée : {{message}}",
        "CANCEL_REQUEST_MESSAGING": "Demande annulée",
        "DISAPPROVE_MESSAGING": "Demande refusée",
        "APPROVE_MESSAGING": "Demande approuvée"
      },
      "youHaveAlreadyTalked":
        "Vous avez un historique de conversation avec cet utilisateur. Appuyez sur pour en savoir plus",
      "requestPendingActionBar": {
        "top": "Le chat attend votre approbation",
        "bottom":
          "Ci-dessus, la communication que vous avez eue avec l'utilisateur jusqu'à présent."
      },
      "showFullChatHistory":
        "Vous avez d'anciennes conversations avec cet utilisateur. Cliquez pour afficher l'historique du chat l'historique complet.",
      "unableToRespondOfferRemoved": {
        "title": "L'offre a été retirée",
        "text":
          "Impossible d'envoyer une réponse. L'auteur a retiré son offre. Voulez-vous supprimer le chat ?"
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
        "title": "Are you sure?",
        "description":
          "If you cancel the messaging request other side will be unable to accept it",
        "yes": "Yes, cancel"
      },
      "contactRevealRespondModal": {
        "title": "Are you sure you want to reveal your phone number?",
        "text": "This will reveal your phone number to the counterparty."
      },
      "contactRevealRequestModal": {
        "title": "Request phone number",
        "text":
          "By requesting a phone number, you agree to share yours as well."
      },
      "contactAlreadyRequested": "A phone number request was already sent.",
      "contactRevealRequest": "Request to reveal phone",
      "contactRevealSent": {
        "title": "Request to reveal phone number sent",
        "subtitle": "Waiting for response"
      },
      "letsExchangeContacts": "Let’s exchange contacts!",
      "phoneNumberRevealed": "Phone number revealed!",
      "phoneNumberReveal": "Phone number reveal.",
      "phoneNumberRevealDeclined": "Phone number reveal declined.",
      "contactIsAlreadyInYourContactList":
        "Contact is already in your contact list.",
      "addUserToYourContacts": "Add {{name}} to your contacts?",
      "tapToAddToYourVexlContacts": "Tap to add to your Vexl contacts."
    },
    "progressBar": {
      "ENCRYPTING_PRIVATE_PAYLOADS": "{{percentDone}}% fait",
      "FETCHING_CONTACTS": "",
      "CONSTRUCTING_PRIVATE_PAYLOADS": "Construire des charges utiles privées",
      "CONSTRUCTING_PUBLIC_PAYLOAD":
        "Construire et crypter la charge utile publique",
      "SENDING_OFFER_TO_NETWORK": "Téléchargement de l'offre",
      "DONE": "Terminé"
    },
    "commonFriends": {
      "commonFriends": "Amis communs",
      "commonFriendsCount": "{{commonFriendsCount}} Amis communs",
      "call": "Call"
    },
    "reportIssue": {
      "openInEmail": "Ouvrir dans un e-mail",
      "somethingWentWrong": "Un problème s'est produit",
      "feelFreeToGetInTouch":
        "N'hésitez pas à contacter notre service d'assistance.",
      "predefinedBody": "Bonjour, je signale un problème..."
    },
    "AppLogs": {
      "title": "Dans les journaux de l'application",
      "clear": "Effacer les journaux",
      "export": "Exporter les journaux",
      "errorExporting": "Erreur lors de l'exportation des journaux",
      "warning":
        "L'activation des journaux d'application peut ralentir l'application et nécessiter plus d'espace de stockage.",
      "anonymizeAlert": {
        "title": "Souhaitez-vous rendre les journaux anonymes ?",
        "text":
          "Nous pouvons essayer de supprimer les clés privées et les informations personnelles des journaux avant de les exporter. Toutefois, nous vous conseillons de toujours vérifier par vous mêmes que les informations ont bien été anonymisées."
      },
      "noLogs": "No logs"
    },
    "MaintenanceScreen": {
      "title": "Maintenance de la place de marché",
      "text":
        "L'application Vexl est en cours de maintenance. Revenez plus tard, s'il vous plaît."
    },
    "ForceUpdateScreen": {
      "title": "Nouvelle version disponible",
      "text":
        "Téléchargez la dernière version de Vexl afin que l'application fonctionne correctement.",
      "action": "Mise à jour en cours"
    },
    "btcPriceChart": {
      "requestCouldNotBeProcessed":
        "La demande d'obtention du prix actuel du BTC a échoué"
    },
    "deepLinks": {
      "importContacts": {
        "alert": {
          "title": "Importer un contact",
          "text":
            "Voulez-vous importer {{contactName}} avec le numéro {{contactNumber}} ?"
        },
        "successAlert": {
          "title": "Contact importé"
        }
      }
    },
    "qrCode": {
      "joinVexl": "Rejoindre vexl"
    },
    "editName": {
      "editName": "Modifier le nom",
      "errorUserNameNotValid": "Le nom d'utilisateur n'est pas valide"
    },
    "changeProfilePicture": {
      "changeProfilePicture": "Modifier la photo de profil",
      "uploadNewPhoto": "Télécharger une nouvelle photo"
    },
    "suggestion": {
      "vexl": "Vexl",
      "suggests": "propose",
      "yourAppGuide": "Guide de l'application",
      "addMoreContacts": "Ajouter d'autres contacts",
      "noOffersFromOthersYet":
        "🤔 Pas encore d'offres d'autres personnes ? Essayez d'ajouter d'autres contacts, et attendez ✌️",
      "createYourFirstOffer":
        "👋 Créez votre première offre d'achat ou de vente de bitcoins.",
      "importNewlyAddedContacts":
        "👋 Looks like you've got some new contacts. Want to import them now?",
      "importNow": "Import now"
    },
    "addContactDialog": {
      "addContact": "Aggiungi un contatto",
      "addThisPhoneNumber":
        "Would you like to add this phone number to your Vexl contacts?",
      "addContactName": "Add contact name",
      "contactAdded": "Contact added.",
      "youHaveAddedContact":
        "You have added {{contactName}} to your Vexl contacts.",
      "contactAlreadyInContactList": "Contact is already in your contact list.",
      "wouldYouLikeToChangeTheName":
        "Would you like to change the name for {{name}} for this phone number?",
      "keepCurrent": "Keep current",
      "contactUpdated": "Contact updated",
      "youHaveSuccessfullyUpdatedContact":
        "You have successfully updated your Vexl contacts."
    },
    "": "",
    "qrScanner": {
      "title": "Scan other user's qrcode",
      "invalidQrCodeScanned": "Invalid qrcode scanned",
      "missingCameraPermissions": "Missing camera permissions",
      "grantPermissions": "Grant permissions",
      "grantPermissionsInSettings":
        "Unable to ask for permissions. To use QR scanner open settings and allow Vexl to use camera.",
      "openSettings": "Open settings"
    }
  }
/* JSON ends */

export default otherFr
