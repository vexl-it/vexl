import type en from "./other.en"

const otherSp: typeof en =
  /* JSON starts */
  {
    "common": {
      "next": "Siguiente",
      "skip": "Saltar",
      "finish": "Finalizar",
      "confirm": "Confirmar",
      "continue": "Continuar",
      "save": "Guardar",
      "gotIt": "Recibido",
      "search": "Buscar en",
      "deselectAll": "Deseleccionar todo",
      "selectAll": "Seleccionar todo",
      "cancel": "Cancelar",
      "unknownError": "Error desconocido",
      "unexpectedServerResponse": "Respuesta inesperada del servidor",
      "networkErrors": {
        "errNetwork":
          "Se ha producido un error de red. ¿Está conectado a Internet?",
        "errCanceled": "Solicitud cancelada",
        "etimedout": "Se ha agotado el tiempo de espera",
        "econnaborted": "Conexión abortada"
      },
      "submit": "Enviar",
      "cryptoError": "Error inesperado de criptografía",
      "secondsShort": "s",
      "ok": "ok",
      "request": "Solicitud",
      "back": "Volver",
      "goBack": "Volver atrás",
      "close": "Cerrar",
      "done": "Hecho",
      "errorCreatingInbox": "Error al crear la bandeja de entrada del usuario.",
      "accept": "Aceptar",
      "decline": "Rechazar",
      "youSure": "¿Está seguro?",
      "nope": "Nope",
      "yesDelete": "Sí, eliminar",
      "more": "Más",
      "yes": "Sí",
      "no": "No",
      "myOffers": "Mis ofertas",
      "errorOpeningLink": {
        "message": "Error al abrir enlace",
        "text": "¿Copiar al portapapeles?",
        "copy": "Copiar y cerrar"
      },
      "nice": "Bonito",
      "success": "Exito",
      "requested": "Solicitado",
      "now": "Ahora",
      "declined": "Rechazada",
      "reset": "Restablecer",
      "you": "Usted",
      "allow": "Permitir",
      "currency": "Moneda",
      "whatDoesThisMean": "¿Qué significa?",
      "learnMore": "Más información",
      "unableToShareImage": "Unable to share the image",
      "requestAgain": "Request again",
      "seeDetail": "See detail"
    },
    "loginFlow": {
      "anonymityNotice":
        "Nadie verá esto hasta que tú lo permitas. Ni siquiera nosotros.",
      "intro": {
        "title1": "Importa tus contactos de forma anónima.",
        "title2": "Mira sus ofertas de compra y venta.",
        "title3": "Solicita la identidad de los que te gusten e intercambia."
      },
      "start": {
        "subtitle": "Bienvenido. ¿Listo para empezar?",
        "touLabel": "Acepto las",
        "termsOfUse": "Condiciones de uso"
      },
      "anonymizationNotice": {
        "title": "Tu identidad será anónima.",
        "text":
          "Nadie verá tu nombre real ni tu foto de perfil hasta que lo reveles para una operación concreta. Ni siquiera nosotros. Configuremos primero tu verdadera identidad."
      },
      "name": {
        "prompt": "¿Cómo te llaman tus amigos?",
        "placeholder": "Nombre o apodo",
        "nameValidationError":
          "El nombre debe tener al menos 1 carácter y un máximo de 50 caracteres"
      },
      "photo": {
        "title": "Hola {{name}} ¿Qué aspecto tienes?",
        "selectSource": "Selecciona la fuente de tu imagen",
        "camera": "Cámara",
        "gallery": "Galería",
        "permissionsNotGranted": "Permisos no concedidos.",
        "nothingSelected": "No se ha seleccionado ninguna imagen"
      },
      "anonymization": {
        "beforeTitle": "Este es tu perfil privado",
        "afterTitle": "¡Identidad anonimizada!",
        "action": "Anonimizar",
        "afterDescription":
          "Así es como te verán los demás usuarios hasta que reveles tu identidad real."
      },
      "phoneNumber": {
        "title": "¿Cuál es tu número de teléfono?",
        "placeholder": "Número de teléfono",
        "text":
          "Para conectarte con la comunidad Vexl, introduce tu número de teléfono",
        "errors": {
          "invalidPhoneNumber":
            "Número de teléfono no válido. Inténtalo de nuevo.",
          "previousCodeNotExpired":
            "La verificación de este número de teléfono ya está en curso. Por favor, espere hasta que expire"
        }
      },
      "verificationCode": {
        "title": "Acabamos de enviarte el código de verificación",
        "text": "Introdúcelo a continuación para verificar",
        "inputPlaceholder": "Tu código de verificación",
        "retryCountdown": "¿No has recibido el código? Vuelva a enviarlo",
        "retry": "¿No has recibido el código? Pulse para reenviar",
        "errors": {
          "userAlreadyExists":
            "Ya existe un usuario con este número de teléfono",
          "challengeCouldNotBeGenerated":
            "No se ha podido generar el reto. Vuelva a intentarlo más tarde",
          "verificationNotFound": "Código de verificación incorrecto.",
          "UserNotFound":
            "Usuario no encontrado. Intente volver a enviar el código.",
          "SignatureCouldNotBeGenerated":
            "No se ha podido generar la firma. Vuelva a intentarlo más tarde",
          "PublicKeyOrHashInvalid":
            "Clave pública o hash no válidos. Vuelva a intentarlo más tarde"
        },
        "success": {
          "title":
            "Número de teléfono verificado.\nVamos a configurar tu perfil.",
          "errorWhileParsingSessionForInternalState":
            "Error al guardar usuario"
        }
      },
      "importContacts": {
        "title": "Ahora, ¡vamos a encontrar a tus amigos!",
        "text":
          "Vexl utiliza tu red social del mundo real: tus amigos y sus amigos. Cuantos más contactos añadas, más ofertas verás.",
        "anonymityNotice":
          "Nadie puede ver tus contactos. Ni siquiera nosotros.",
        "action": "Importar contactos"
      }
    },
    "postLoginFlow": {
      "contactsExplanation": {
        "title": "Ahora, ¡vamos a encontrar a tus amigos!",
        "text":
          "Vexl utiliza tu red social del mundo real: tus amigos y sus amigos. Cuantos más contactos añadas, más ofertas verás.",
        "anonymizationCaption":
          "Nadie puede ver tus contactos. Ni siquiera nosotros."
      },
      "importContactsButton": "Importar contactos",
      "contactsList": {
        "addContact": "Añadir contacto {{number}} manualmente",
        "inputPlaceholder": "Buscar o Añadir número",
        "nothingFound": {
          "title": "No se ha encontrado ningún contacto.",
          "text":
            "Para añadir un número de teléfono directamente, escríbalo en la barra de búsqueda (con el prefijo del país)."
        },
        "toAddCustomContact":
          "Para añadir un número de teléfono directamente, escríbalo en la barra de búsqueda (con el prefijo del país)."
      },
      "allowNotifications": {
        "title": "Permitir permisos de notificación",
        "text":
          "Activar las notificaciones te permite saber cuándo otros aceptan tus ofertas o cuándo llegan mensajes.",
        "action": "Permitir",
        "cancel": "Omitir",
        "errors": {
          "permissionDenied":
            "Permisos no concedidos. Puedes permitirlos más tarde en la configuración del sistema.",
          "unknownError": "Error desconocido al solicitar permisos",
          "notAvailableOnEmulator":
            "Las notificaciones no están disponibles en el emulador"
        },
        "vexlCantBeUsedWithoutNotifications":
          "Vexl app no se puede usar sin este permiso."
      }
    },
    "settings": {
      "yourReach": "Tu alcance: {{number}} vexlers",
      "items": {
        "changeProfilePicture": "Cambiar foto de perfil",
        "editName": "Editar nombre",
        "contactsImported": "Gestión de contactos",
        "xFriends": "{{number}} amigos",
        "setPin": "Establecer PIN",
        "faceId": "Face ID",
        "allowScreenshots": "Permitir capturas de pantalla",
        "allowScreenshotsDescription":
          "Evitar que los usuarios tomen capturas de pantalla del chat",
        "termsAndPrivacy": "Condiciones y privacidad",
        "faqs": "Preguntas frecuentes",
        "reportIssue": "Informar de un problema",
        "inAppLogs": "Registros en la aplicación",
        "requestKnownData": "Solicitar datos conocidos",
        "followUsOn": "Síguenos en",
        "twitter": "Twitter",
        "twitterUrl": "https://twitter.com/vexl",
        "readMoreOn": "Más información en",
        "medium": "Medio",
        "mediumUrl": "https://blog.vexl.it",
        "learnMoreOn": "Más información en",
        "website": "Vexl.it",
        "websiteUrl": "https://vexl.it",
        "deleteAccount": "Eliminar cuenta",
        "supportEmail": "support@vexl.it"
      },
      "noLogoutExplanation":
        "¿No encuentras cómo cerrar sesión? No existe.\nPero puedes borrar tu cuenta.",
      "support":
        "Si te gusta Vexl, ¡apoya su mejora enviando algún bitcoin como donación!",
      "version": "Versión de Vexl App: {{version}}",
      "logoutDialog": {
        "title": "¿Borrar cuenta?",
        "title2": "¿Seguro?",
        "description":
          "¿Está seguro de que desea eliminar su cuenta? Esta acción no se puede deshacer"
      }
    },
    "offer": {
      "title": "Oferta",
      "cashOnly": "Sólo en efectivo",
      "onlineOnly": "Sólo en línea",
      "upTo": "Hasta",
      "forSeller": "Para el vendedor",
      "forBuyer": "Para el comprador",
      "bank": "Banco",
      "revolut": "Pago en línea",
      "isSelling": "está vendiendo",
      "isBuying": "está comprando",
      "directFriend": "Amigo directo",
      "friendOfFriend": "Amigo de amigo",
      "buy": "Comprar",
      "sell": "Vender",
      "filterOffers": "Filtrar ofertas",
      "numberOfCommon": "{{number}} común",
      "offerNotFound":
        "Oferta no encontrada. Puede que haya sido borrada por el autor",
      "inputPlaceholder": "p.e. intercambiemos mi amigo...",
      "sendRequest": "Enviar solicitud",
      "report": {
        "areYouSureTitle": "¿Reportar oferta?",
        "areYouSureText":
          "¿Estás seguro de que quieres denunciar esta oferta? Una vez denunciada, no se puede deshacer. Elige bien.",
        "yes": "Sí, informar",
        "thankYou": "Gracias a ti",
        "inappropriateContentWasReported":
          "El contenido inapropiado fue reportado anónimamente."
      },
      "goToChat": "Ir al chat",
      "requestStatus": {
        "requested":
          "Has solicitado un intercambio. Te avisaremos cuando sea aceptado.",
        "accepted": "Tu solicitud ha sido aceptada.",
        "denied": "Tu solicitud ha sido rechazada.",
        "initial": "Esta será su primera interacción con esta oferta.",
        "cancelled":
          "Has cancelado la solicitud de intercambio de esta oferta.",
        "deleted":
          "You have already interacted with this offer before, but you have deleted the chat",
        "otherSideLeft":
          "You have already interacted with this offer before, but other side has left the chat."
      },
      "listEmpty": "Tu mercado se está calentando. Vuelve en unos minutos.",
      "emptyAction": "Añadir nueva oferta",
      "createOfferAndReachVexlers":
        "Llegas a {{reachNumber}} vexlers.\nAñade más contactos para aumentar el número de ofertas que ves.",
      "filterActive": "Filtro activo",
      "totalOffers": "Total: {{totalCount}} ofertas",
      "notImportedAnyContacts":
        "No has importado ningún contacto. Importar contactos para ver ofertas de tu red",
      "socialNetworkTooSmall":
        "Sólo has importado unos pocos contactos, por lo que es posible que no veas ninguna oferta",
      "noOffersToMatchFilter":
        "No hay ofertas que coincidan con tus criterios de filtrado",
      "offersAreLoadingAndShouldBeReady":
        "Las ofertas se están cargando y deberían estar listas para ti en {{minutes}} minutos",
      "marketplaceEmpty": "Mercado vacío, todavía",
      "resetFilter": "Restablecer filtro",
      "totalFilteredOffers":
        "Filtrado: {{count}} ofertas (de un total de {{totalCount}})",
      "offerFromDirectFriend": "Oferta de un amigo directo",
      "offerFromFriendOfFriend": "Oferta de un amigo de un amigo",
      "youSeeThisOfferBecause":
        "Ves esta oferta porque la contraparte tiene tu número de teléfono guardado en su lista de contactos.",
      "beCautiousWeCannotVerify":
        "Ten cuidado, no podemos verificar si realmente os conocéis en la vida real.",
      "dontForgetToVerifyTheIdentity":
        "No olvides verificar su identidad con un contacto común.",
      "noDirectConnection":
        "Se trata de un contacto con el que no tienes conexión directa.",
      "rerequestTomorrow": "Puede enviar otra solicitud mañana",
      "rerequestDays": "Puede enviar otra solicitud en {{days}} días",
      "rerequest": "Enviar solicitud de nuevo",
      "cancelRequest": "Cancelar solicitud",
      "requestWasCancelledByOtherSide":
        "No se puede aprobar. La otra parte ha cancelado la solicitud",
      "requestNotFound":
        "No se puede aprobar. La otra parte ha eliminado su cuenta"
    },
    "termsOfUse": {
      "termsOfUse": "Condiciones de uso",
      "privacyPolicy": "Política de privacidad",
      "dontHaveTime":
        "¿No tienes tiempo para leer todo esto? Eche un vistazo a Preguntas frecuentes."
    },
    "faqs": {
      "faqs": "Preguntas frecuentes",
      "whatIsVexl": "¿Qué es Vexl?",
      "vexlIsPlatform":
        "Vexl es una plataforma donde puedes intercambiar Bitcoin dentro de tu red social del mundo real - tus amigos y los amigos de sus amigos - mientras permaneces completamente anónimo - si así lo deseas.",
      "whoCanSeeMyContacts": "¿Quién puede ver mis contactos?",
      "peopleWhomYouAllowToSee":
        "Las personas a las que permitas ver tu identidad podrán ver los amigos que tenéis en común y eso es todo.",
      "howCanIRemainAnonymous":
        "¿Cómo puedo permanecer en el anonimato y seguir participando en Vexl?",
      "byDefaultYouParticipateInTheNetwork":
        "Por defecto, participas en la red bajo tu nombre Vexl y el avatar Vexl que se te dieron durante el registro. Sólo puedes revelar tu identidad en una operación concreta en nuestro chat seguro y encriptado de extremo a extremo.",
      "howCanIMakeSure":
        "¿Cómo puedo asegurarme de que la persona con la que hablo es la persona con la que quiero hablar?",
      "oneChallenge":
        "Uno de los retos de los sistemas de comunicación verdaderamente anónimos como Vexl es que a veces es necesario verificar la identidad de la persona con la que se está hablando. En estos casos, lo mejor es utilizar un canal de comunicación secundario seguro para confirmar con la otra persona que ambos son quienes dicen ser.",
      "howCanIEnsure":
        "¿Cómo puedo asegurarme de que mis comunicaciones y operaciones son privadas y están encriptadas?",
      "vexlIsOpensource":
        "Vexl es de código abierto - cualquiera puede buscar cualquier puerta trasera o intención maliciosa. Además, aquí puede consultar el informe de una auditoría de seguridad independiente.",
      "howCanYouEnsure": "¿Cómo pueden garantizar la protección de mis datos?",
      "vexlIsDesigned":
        "Vexl está diseñado para no recopilar ni almacenar nunca información confidencial. Ni nosotros ni terceros podemos acceder a los mensajes de Vexl ni a otros contenidos, ya que siempre están cifrados de extremo a extremo y son privados y seguros. Nuestras Condiciones de servicio y Política de privacidad están disponibles más abajo.",
      "howDoIContactVexl": "¿Cómo puedo ponerme en contacto con Vexl?",
      "youCanAlwaysReachOutToUs":
        "Siempre puede ponerse en contacto con nosotros por correo electrónico: support@vexl.it. Para una comunicación privada, también puede enviarnos un correo electrónico. ¡O puedes conocernos durante tu próxima operación P2P! 😻"
    },
    "offerForm": {
      "myNewOffer": "Nueva oferta",
      "iWantTo": "Quiero",
      "sellBitcoin": "Vender Bitcoin",
      "buyBitcoin": "Comprar Bitcoin",
      "amountOfTransaction": {
        "amountOfTransaction": "Cantidad",
        "pleaseSelectCurrencyFirst": "Seleccione primero la moneda",
        "pleaseSelectLocationFirst": "Seleccione primero la ubicación"
      },
      "premiumOrDiscount": {
        "premiumOrDiscount": "Prima o descuento",
        "youBuyForTheActualMarketPrice":
          "Usted compra por el precio real de mercado. Juegue con el control deslizante para vender más rápido o ganar más.",
        "theOptimalPositionForMostPeople":
          "La posición óptima para la mayoría de la gente. Compras un poco más rápido, pero un poco por encima del precio de mercado",
        "youBuyReallyFast":
          "Compras rápido, pero a un precio muy superior al de mercado",
        "youBuyPrettyCheap":
          "Compras bastante barato, pero puede llevar algo más de tiempo encontrar un vendedor",
        "youBuyVeryCheaply":
          "Compras muy barato, pero puedes tardar un poco en encontrar vendedor",
        "buyFaster": "Compra rápido",
        "buyCheaply": "Compra barato",
        "youSellForTheActualMarketPrice":
          "Vendes por el precio real de mercado. Juega con el control deslizante para vender más rápido o ganar más.",
        "youEarnBitMore": "Gana un poco más, pero puede tardar un poco más.",
        "youWantToEarnFortune":
          "Quieres ganar una fortuna, pero puedes tardar años en encontrar un comprador.",
        "youSellSlightlyFaster":
          "Vendes un poco más rápido, pero un poco por debajo del precio de mercado.",
        "youSellMuchFaster":
          "Vendes mucho más rápido, pero muy por debajo del precio de mercado",
        "youBuyBtcFor": "Compras BTC por",
        "youSellBtcFor": "Usted vende BTC por",
        "marketPrice": "precio de mercado",
        "sellFaster": "Vende más rápido",
        "earnMore": "Gana más",
        "premiumOrDiscountExplained": "Prima o descuento explicados",
        "influenceImpactOfYourSellOffer":
          "Influya en el impacto de su oferta. Venda más rápido añadiendo un descuento, o gane más añadiendo una prima al precio de mercado de Bitcoin.",
        "influenceImpactOfYourBuyOffer":
          "Influya en el impacto de su oferta. Compre más barato añadiendo un descuento, o compre más rápido añadiendo una prima al precio de mercado de Bitcoin.",
        "playWithItAndSee":
          "Juegue con ello y vea cómo afecta al interés de los demás.",
        "plus": "+",
        "minus": "-"
      },
      "buyCheaperByUsingDiscount":
        "Compra más barato utilizando un descuento o compra más rápido añadiendo una prima al precio de mercado del bitcoin",
      "sellFasterWithDiscount":
        "Vende más rápido con un descuento o gana más añadiendo una prima al precio de mercado del bitcoin.",
      "location": {
        "location": "Ubicación",
        "meetingInPerson":
          "Reunirse en persona es más seguro. ¿Qué hay que tener en cuenta en Internet?",
        "checkItOut": "Compruébalo",
        "addCityOrDistrict": "Añadir ciudad o distrito",
        "whatToWatchOutForOnline": "¿Qué hay que tener en cuenta en Internet?",
        "moneySentByRandomPerson":
          "El dinero enviado por una persona cualquiera puede ser de origen delictivo y rastreable.",
        "neverSendCrypto": "Nunca envíes bitcoin antes de recibir el pago.",
        "alwaysVerifyTheName":
          "Verifique siempre el nombre del titular de la cuenta de la que ha recibido el pago con la identidad declarada de la contraparte.",
        "forwardTheAddress":
          "Reenvía la dirección de forma segura y asegúrate de verificarla a través de otro canal seguro."
      },
      "inPerson": "En persona",
      "online": "En línea",
      "paymentMethod": {
        "paymentMethod": "Forma de pago",
        "cash": "En efectivo",
        "bank": "Banco",
        "revolut": "Pago en línea"
      },
      "network": {
        "network": "Red",
        "lightning": "Relámpago",
        "theBestOption":
          "La mejor opción para importes realmente pequeños. Suele ser súper rápida.",
        "onChain": "En cadena",
        "theBestFor": "La mejor para cantidades mayores. Más lento."
      },
      "description": {
        "description": "Descripción",
        "writeWhyPeopleShouldTake":
          "Escribe por qué la gente debería aceptar tu oferta."
      },
      "friendLevel": {
        "friendLevel": "Nivel de amistad",
        "firstDegree": "1er grado",
        "secondDegree": "2º grado",
        "noVexlers": "No vexlers",
        "reachVexlers": "Llegar a {{count}} vexlers"
      },
      "publishOffer": "Publicar oferta",
      "errorCreatingOffer": "Error al crear oferta",
      "errorSearchingForAvailableLocation":
        "Error al buscar localidades disponibles",
      "offerEncryption": {
        "encryptingYourOffer": "Cifrando su oferta ...",
        "dontShutDownTheApp":
          "No cierres la aplicación mientras se encripta. Puede tardar varios minutos.",
        "forVexlers": "para {{count}} vexlers",
        "doneOfferPoster": "Listo. Oferta publicada.",
        "yourFriendsAndFriendsOfFriends":
          "Tus amigos y los amigos de sus amigos ya pueden ver tu oferta.",
        "anonymouslyDeliveredToVexlers":
          "Enviado anónimamente a {{count}} vexlers"
      },
      "noVexlersFoundForYourOffer":
        "No se han encontrado vexlers para tu oferta",
      "errorLocationNotFilled": "Por favor, rellena la ubicación de la oferta",
      "errorDescriptionNotFilled": "Rellena la descripción de la oferta"
    },
    "notifications": {
      "permissionsNotGranted": {
        "title": "No se han concedido los permisos para las notificaciones",
        "message": "Puede activarlos en la configuración",
        "openSettings": "Abrir configuración"
      },
      "errorWhileOpening": "Error al abrir la notificación"
    },
    "myOffers": {
      "addNewOffer": "Añadir nueva oferta",
      "activeOffers": "{{count}} Ofertas activas",
      "filterOffers": "Filtrar ofertas",
      "errorWhileFetchingYourOffers": "Error al buscar ofertas",
      "editOffer": "Editar oferta",
      "myOffer": "Mi oferta",
      "offerAdded": "Añadido {{date}}",
      "sortedByNewest": "Ordenado por más reciente",
      "sortedByOldest": "Ordenada por más antigua"
    },
    "editOffer": {
      "editOffer": "Editar oferta",
      "active": "Activo",
      "inactive": "Inactivo",
      "saveChanges": "Guardar cambios",
      "offerUnableToChangeOfferActivation":
        "No se puede modificar la activación de la oferta",
      "editingYourOffer": "Editar su oferta ...",
      "pleaseWait": "Espere por favor",
      "offerEditSuccess": "Oferta editada con éxito",
      "youCanCheckYourOffer":
        "Puede comprobar su oferta en la sección de ofertas",
      "errorEditingOffer": "Error al editar la oferta",
      "errorOfferNotFound": "Oferta no encontrada",
      "deletingYourOffer": "Eliminando tu oferta ...",
      "offerDeleted": "Oferta eliminada",
      "errorDeletingOffer": "Error al borrar la oferta",
      "deleteOffer": "¿Borrar oferta?",
      "deleteOfferDescription":
        "¿Estás seguro de que quieres eliminar esta oferta? Esta acción no se puede deshacer"
    },
    "filterOffers": {
      "filterResults": "Filtrar resultados",
      "sorting": "Ordenar",
      "lowestFeeFirst": "Tarifa más baja",
      "highestFee": "Tarifa más alta",
      "newestOffer": "Oferta más reciente",
      "oldestOffer": "Oferta más antigua",
      "lowestAmount": "Importe más bajo",
      "highestAmount": "Importe más alto",
      "selectSortingMethod": "Seleccione el método de clasificación"
    },
    "messages": {
      "yourOffer": "Su oferta",
      "theirOffer": "Su oferta",
      "listTitle": "Chats",
      "isBuying": "está comprando",
      "isSelling": "está vendiendo",
      "thisWillBeYourFirstInteraction":
        "Esta será tu primera interacción con esta oferta.",
      "wellLetYouKnowOnceUserAccepts":
        "Solicitud enviada. Te avisaremos cuando la otra parte haya respondido.",
      "messagePreviews": {
        "incoming": {
          "MESSAGE": "{{them}}: {{message}}",
          "REQUEST_REVEAL": "{{them}} identidad solicitada revelar",
          "APPROVE_REVEAL": "Identidad revelada",
          "DISAPPROVE_REVEAL": "Identidad rechazada",
          "REQUEST_MESSAGING": "Reaccionó a su oferta",
          "APPROVE_MESSAGING": "Solicitud aceptada",
          "DISAPPROVE_MESSAGING": "Solicitud rechazada",
          "DELETE_CHAT": "{{them}} ha abandonado el chat",
          "BLOCK_CHAT": "{{them}} te ha bloqueado",
          "OFFER_DELETED": "{{them}} ha eliminado la oferta",
          "INBOX_DELETED": "{{them}} ha borrado el chat.",
          "CANCEL_REQUEST_MESSAGING": "Solicitud cancelada"
        },
        "outgoing": {
          "MESSAGE": "Yo: {{message}}",
          "REQUEST_REVEAL": "Has solicitado revelar identidad",
          "APPROVE_REVEAL": "Identidad revelada",
          "DISAPPROVE_REVEAL": "Identidad rechazada",
          "REQUEST_MESSAGING": "Solicitud enviada",
          "APPROVE_MESSAGING": "Has aprobado la mensajería",
          "DISAPPROVE_MESSAGING": "Has rechazado la solicitud de mensajería",
          "DELETE_CHAT": "Has abandonado el chat",
          "BLOCK_CHAT": "Usuario bloqueado",
          "OFFER_DELETED": "Has eliminado tu oferta",
          "INBOX_DELETED": "Has borrado esta bandeja de entrada",
          "CANCEL_REQUEST_MESSAGING": "Ha cancelado la solicitud de mensajería"
        }
      },
      "deleteChat": "Borrar chat",
      "askToReveal": "Pedir que se revele la identidad",
      "blockUser": "Bloquear usuario",
      "sending": "Enviando...",
      "unknownErrorWhileSending": "Error desconocido al enviar el mensaje",
      "tapToResent": "Pulse para volver a enviar.",
      "deniedByMe": "Ha denegado la solicitud de mensajería con {{name}}.",
      "deniedByThem": "{{name}} ha rechazado su solicitud de mensajería.",
      "requestMessageWasDeleted":
        "El usuario no proporcionó ningún mensaje inicial.",
      "typeSomething": "Escriba algo ...",
      "offerDeleted": "Oferta eliminada",
      "leaveToo": "¿Dejar también?",
      "leaveChat": "¿Dejar chat?",
      "deleteChatQuestion": "¿Borrar chat?",
      "blockForewerQuestion": "¿Bloquear para siempre?",
      "yesBlock": "Sí, bloquear",
      "deleteChatExplanation1":
        "¿Has terminado de negociar? Cerrar el chat significa que tu conversación se borrará definitivamente.",
      "deleteChatExplanation2":
        "Este es el paso definitivo, por favor confirma esta acción una vez más para borrar el chat.",
      "blockChatExplanation1":
        "¿De verdad quieres bloquear a este usuario? Nunca podrás deshacer esta acción. Elige sabiamente.",
      "blockChatExplanation2":
        "¿Realmente quieres bloquear a este usuario? Nunca podrás deshacer esta acción. Elige sabiamente.",
      "chatEmpty": "Aún no hay chats",
      "chatEmptyExplanation": "Inicia una conversación solicitando una oferta",
      "seeOffers": "Ver ofertas",
      "identityRevealRequestModal": {
        "title": "¿Enviar solicitud de revelación de identidad?",
        "text":
          "Al enviar una solicitud, también aceptas que se revele tu identidad.",
        "send": "Enviar solicitud"
      },
      "identityRevealRespondModal": {
        "title": "¿Desea revelar su identidad?",
        "text":
          "Si revela su identidad, verá también la identidad de su contraparte."
      },
      "identityAlreadyRequested":
        "La solicitud de identidad ya se ha enviado en la conversación",
      "identityRevealRequest": "Solicitud de revelación de identidad",
      "identityRevealed": "Identidad revelada",
      "identitySend": {
        "title": "Solicitud de revelación de identidad enviada",
        "subtitle": "Esperando respuesta"
      },
      "tapToReveal": "Toque para revelar o rechazar",
      "letsRevealIdentities": "Revelemos identidades",
      "reveal": "Revelar",
      "themDeclined": "{{name}} Rechazada",
      "youDeclined": "Ha rechazado",
      "reportOffer": "Denunciar oferta",
      "ended": "Finalizado",
      "textMessageTypes": {
        "REQUEST_MESSAGING": "Solicitud enviada: {{message}}",
        "CANCEL_REQUEST_MESSAGING": "Solicitud cancelada",
        "DISAPPROVE_MESSAGING": "Solicitud denegada",
        "APPROVE_MESSAGING": "Solicitud aprobada"
      },
      "youHaveAlreadyTalked":
        "Tienes un historial de mensajes con este usuario. Pulsa para ver más",
      "requestPendingActionBar": {
        "top": "El chat está esperando tu aprobación",
        "bottom":
          "Arriba está la comunicación que has tenido con el usuario hasta ahora"
      },
      "showFullChatHistory":
        "You have some previous communication with this user. Tap to see full chat history.",
      "unableToRespondOfferRemoved": {
        "title": "Offer was removed",
        "text":
          "Unable to send response. Author has removed the offer. Do you want to delete the chat?"
      }
    },
    "progressBar": {
      "ENCRYPTING_PRIVATE_PAYLOADS": "{{percentDone}} Hecho",
      "FETCHING_CONTACTS": "",
      "CONSTRUCTING_PRIVATE_PAYLOADS": "Construyendo payloads privados",
      "CONSTRUCTING_PUBLIC_PAYLOAD": "Construir y cifrar la carga útil pública",
      "SENDING_OFFER_TO_NETWORK": "Carga de la oferta",
      "DONE": "Hecho"
    },
    "commonFriends": {
      "commonFriends": "Amigos comunes",
      "commonFriendsCount": "{{commonFriendsCount}} amigos comunes"
    },
    "reportIssue": {
      "openInEmail": "Abrir en e-mail",
      "somethingWentWrong": "Algo ha ido mal",
      "feelFreeToGetInTouch":
        "No dude en ponerse en contacto con nuestro servicio de asistencia.",
      "predefinedBody": "Hola, estoy informando de un problema..."
    },
    "AppLogs": {
      "title": "Registros de la aplicación",
      "clear": "Borrar registros",
      "export": "Exportar registros",
      "errorExporting": "Error al exportar registros",
      "warning":
        "Habilitar los registros de la aplicación puede ralentizar la aplicación y requerir más espacio de almacenamiento.",
      "anonymizeAlert": {
        "title": "¿Quieres anonimizar los registros?",
        "text":
          "Podemos intentar eliminar las claves privadas y la información personal de los registros antes de exportarlos. Asegúrate siempre de verificarlo por ti mismo."
      }
    },
    "MaintenanceScreen": {
      "title": "Mantenimiento del mercado",
      "text":
        "La aplicación Vexl está realizando tareas de mantenimiento. Vuelve más tarde, por favor."
    },
    "ForceUpdateScreen": {
      "title": "Nueva versión disponible",
      "text":
        "Descarga la última versión de Vexl para que la aplicación funcione correctamente.",
      "action": "Actualizar ahora"
    },
    "btcPriceChart": {
      "requestCouldNotBeProcessed":
        "La solicitud para obtener el precio actual de BTC falló"
    },
    "deepLinks": {
      "importContacts": {
        "alert": {
          "title": "Importar contacto",
          "text":
            "¿Desea importar {{contactName}} con el número {{contactNumber}}?"
        },
        "successAlert": {
          "title": "Contacto importado"
        }
      }
    },
    "qrCode": {
      "joinVexl": "Unirse a vexl"
    },
    "editName": {
      "editName": "Editar nombre",
      "errorUserNameNotValid": "El nombre de usuario no es válido"
    },
    "changeProfilePicture": {
      "changeProfilePicture": "Cambiar foto de perfil",
      "uploadNewPhoto": "Subir nueva foto"
    },
    "suggestion": {
      "vexl": "Vexl",
      "suggests": "sugiere",
      "yourAppGuide": "Guía de tu aplicación",
      "addMoreContacts": "Añade más contactos",
      "noOffersFromOthersYet":
        "🤔 ¿Aún no hay ofertas de otros? Intenta añadir más contactos, y espera ✌️",
      "createYourFirstOffer":
        "👋 Crea tu primera oferta para comprar o vender Bitcoin."
    }
  }
/* JSON ends */

export default otherSp
