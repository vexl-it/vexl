import type en from "./other.en"

const otherPt: typeof en =
  /* JSON starts */
  {
    "common": {
      "next": "Seguinte",
      "skip": "Saltar",
      "finish": "Terminar",
      "confirm": "Confirmar",
      "continue": "Continuar",
      "save": "Guardar",
      "gotIt": "Já está",
      "search": "Pesquisar",
      "deselectAll": "Desmarcar tudo",
      "selectAll": "Selecionar tudo",
      "cancel": "Cancelar",
      "unknownError": "Erro desconhecido",
      "unexpectedServerResponse": "Resposta inesperada do servidor",
      "networkErrors": {
        "errNetwork": "Ocorreu um erro de rede. Está ligado à Internet?",
        "errCanceled": "O pedido foi cancelado",
        "etimedout": "O pedido expirou",
        "econnaborted": "Ligação abortada"
      },
      "submit": "Enviar",
      "cryptoError": "Erro de criptografia inesperado",
      "secondsShort": "s",
      "ok": "ok",
      "request": "Solicitar",
      "back": "Voltar atrás",
      "goBack": "Voltar atrás",
      "close": "Fechar",
      "done": "Concluído",
      "errorCreatingInbox": "Erro ao criar a caixa de entrada do utilizador.",
      "accept": "Aceitar",
      "decline": "Recusar",
      "youSure": "Tem a certeza?",
      "nope": "Não",
      "yesDelete": "Sim, apagar",
      "more": "Mais",
      "yes": "Sim",
      "no": "Não",
      "myOffers": "As minhas ofertas",
      "errorOpeningLink": {
        "message": "Erro ao abrir a ligação",
        "text": "Copiar para a área de transferência?",
        "copy": "Copiar e fechar"
      },
      "nice": "Boa",
      "success": "Sucesso!",
      "requested": "Solicitado",
      "now": "Agora",
      "declined": "Recusado",
      "reset": "Reiniciar",
      "you": "Você",
      "allow": "Permitir",
      "currency": "Moeda",
      "whatDoesThisMean": "O que é que isto significa?",
      "learnMore": "Saiba mais",
      "unableToShareImage": "Unable to share the image",
      "requestAgain": "Request again",
      "seeDetail": "See detail"
    },
    "loginFlow": {
      "anonymityNotice": "Ninguém verá isto até que o autorize. Nem mesmo nós.",
      "intro": {
        "title1": "Importe os seus contactos de forma anónima.",
        "title2": "Veja as suas ofertas de compra e venda.",
        "title3": "Solicite a identidade dos que lhe agradam e negoceie."
      },
      "start": {
        "subtitle": "Bem-vindo! Pronto para começar?",
        "touLabel": "Eu concordo com",
        "termsOfUse": "Termos de utilização"
      },
      "anonymizationNotice": {
        "title": "A sua identidade será anónima.",
        "text":
          "Ninguém verá o seu nome verdadeiro e a sua fotografia de perfil até que o revele para um determinado negócio. Nem mesmo nós. Primeiro, vamos definir a sua verdadeira identidade."
      },
      "name": {
        "prompt": "O que é que os seus amigos lhe chamam?",
        "placeholder": "Nome ou alcunha",
        "nameValidationError":
          "O nome deve ter, no mínimo, 1 carácter e, no máximo, 50 caracteres"
      },
      "photo": {
        "title": "Olá {{name}}! Qual é o teu aspeto?",
        "selectSource": "Selecciona a fonte da tua imagem",
        "camera": "Câmara",
        "gallery": "Galeria",
        "permissionsNotGranted": "Permissões não concedidas.",
        "nothingSelected": "Não foi selecionada nenhuma imagem"
      },
      "anonymization": {
        "beforeTitle": "Este é o seu perfil privado",
        "afterTitle": "Identidade anónima!",
        "action": "Anonimizar",
        "afterDescription":
          "É assim que os outros utilizadores o verão até que revele a sua verdadeira identidade."
      },
      "phoneNumber": {
        "title": "Qual é o seu número de telefone?",
        "placeholder": "Número de telefone",
        "text":
          "Para o ligar à comunidade Vexl, introduza o seu número de telefone",
        "errors": {
          "invalidPhoneNumber":
            "Número de telefone inválido. Por favor, tente novamente.",
          "previousCodeNotExpired":
            "A verificação para este número de telefone já está a decorrer. Aguarde até que expire"
        }
      },
      "verificationCode": {
        "title": "Acabámos de lhe enviar o código de verificação",
        "text": "Introduza-o abaixo para verificar",
        "inputPlaceholder": "O seu código de verificação",
        "retryCountdown": "Não recebeu o código? Reenviar em",
        "retry": "Não recebeu um código? Toque para reenviar",
        "errors": {
          "userAlreadyExists":
            "Já existe um utilizador com este número de telefone",
          "challengeCouldNotBeGenerated":
            "Não foi possível gerar o desafio. Tentar novamente mais tarde",
          "verificationNotFound": "Código de verificação incorreto.",
          "UserNotFound": "Utilizador não encontrado. Tente reenviar o código.",
          "SignatureCouldNotBeGenerated":
            "Não foi possível gerar a assinatura. Tente novamente mais tarde",
          "PublicKeyOrHashInvalid":
            "Chave pública ou hash inválido. Tente novamente mais tarde"
        },
        "success": {
          "title":
            "Número de telefone verificado.\nVamos configurar o seu perfil.",
          "errorWhileParsingSessionForInternalState":
            "Erro ao guardar o utilizador"
        }
      },
      "importContacts": {
        "title": "Agora, vamos encontrar os teus amigos!",
        "text":
          "O Vexl está a utilizar a sua rede social real - os seus amigos e os amigos deles. Quanto mais contactos adicionares, mais ofertas verás.",
        "anonymityNotice": "Ninguém pode ver os seus contactos. Nem mesmo nós.",
        "action": "Importar contactos"
      }
    },
    "postLoginFlow": {
      "contactsExplanation": {
        "title": "Agora, vamos encontrar os teus amigos!",
        "text":
          "O Vexl está a usar a sua rede social do mundo real - os seus amigos e os amigos deles. Quanto mais contactos adicionar, mais ofertas verá.",
        "anonymizationCaption":
          "Ninguém pode ver os seus contactos. Nem mesmo nós."
      },
      "importContactsButton": "Importar contactos",
      "contactsList": {
        "addContact": "Adicionar contacto {{number}} manualmente",
        "inputPlaceholder": "Procurar ou Adicionar número",
        "nothingFound": {
          "title": "Nenhum contacto encontrado.",
          "text":
            "Para adicionar o número de telefone diretamente, escreva-o numa barra de pesquisa (com o prefixo do código do país)."
        },
        "toAddCustomContact":
          "Para adicionar diretamente o número de telefone, escreva-o numa barra de pesquisa (com o indicativo do país)"
      },
      "allowNotifications": {
        "title": "Permitir permissões de notificação",
        "text":
          "A ativação das notificações permite-lhe saber quando outras pessoas aceitam as suas ofertas ou quando chegam mensagens.",
        "action": "Permitir",
        "cancel": "Saltar",
        "errors": {
          "permissionDenied":
            "Permissões não concedidas. Pode autorizá-las mais tarde nas definições do sistema.",
          "unknownError": "Erro desconhecido ao pedir permissões",
          "notAvailableOnEmulator":
            "As notificações não estão disponíveis no emulador"
        },
        "vexlCantBeUsedWithoutNotifications":
          "A aplicação Vexl não pode ser utilizada sem esta permissão."
      }
    },
    "settings": {
      "yourReach": "O teu alcance: {{number}} vexlers",
      "items": {
        "changeProfilePicture": "Alterar a imagem de perfil",
        "editName": "Editar nome",
        "contactsImported": "Gestão de contactos",
        "xFriends": "{{number}} Amigos",
        "setPin": "Definir PIN",
        "faceId": "Identificação facial",
        "allowScreenshots": "Permitir capturas de ecrã",
        "allowScreenshotsDescription":
          "Impedir que os utilizadores façam capturas de ecrã do chat",
        "termsAndPrivacy": "Termos e privacidade",
        "faqs": "Perguntas frequentes",
        "reportIssue": "Comunicar problema",
        "inAppLogs": "Registos na aplicação",
        "requestKnownData": "Solicitar dados conhecidos",
        "followUsOn": "Siga-nos no",
        "twitter": "Twitter",
        "twitterUrl": "https://twitter.com/vexl",
        "readMoreOn": "Leia mais em",
        "medium": "Médio",
        "mediumUrl": "https://blog.vexl.it",
        "learnMoreOn": "Saiba mais em",
        "website": "Vexl.it",
        "websiteUrl": "https://vexl.it",
        "deleteAccount": "Eliminar conta",
        "supportEmail": "support@vexl.it"
      },
      "noLogoutExplanation":
        "Não consegue encontrar o logout? Não existe tal coisa.\nMas podes apagar a tua conta.",
      "support":
        "Se gostas do Vexl, apoia a sua melhoria enviando algum bitcoin como donativo!",
      "version": "Versão da aplicação Vexl: {{version}}",
      "logoutDialog": {
        "title": "Apagar conta?",
        "title2": "Tens a certeza?",
        "description":
          "Tens a certeza que queres apagar a tua conta? Esta ação não pode ser anulada"
      }
    },
    "offer": {
      "title": "Oferta",
      "cashOnly": "Apenas em dinheiro",
      "onlineOnly": "Apenas online",
      "upTo": "Até",
      "forSeller": "Para o vendedor",
      "forBuyer": "Para o comprador",
      "bank": "Banco",
      "revolut": "Pagamento online",
      "isSelling": "está a vender",
      "isBuying": "está a comprar",
      "directFriend": "Amigo direto",
      "friendOfFriend": "Amigo de um amigo",
      "buy": "Comprar",
      "sell": "Vender",
      "filterOffers": "Filtrar ofertas",
      "numberOfCommon": "{{number}} Comum",
      "offerNotFound":
        "Oferta não encontrada. Pode ter sido apagada pelo autor",
      "inputPlaceholder": "por exemplo, vamos trocar o meu amigo...",
      "sendRequest": "Enviar pedido",
      "report": {
        "areYouSureTitle": "Comunicar oferta?",
        "areYouSureText":
          "Tem a certeza de que quer denunciar esta oferta? Uma vez denunciada, ela não pode ser desfeita. Escolha sabiamente.",
        "yes": "Sim, comunicar",
        "thankYou": "Obrigado!",
        "inappropriateContentWasReported":
          "O conteúdo inadequado foi comunicado anonimamente."
      },
      "goToChat": "Ir para o chat",
      "requestStatus": {
        "requested": "Pediu uma troca. Iremos notificá-lo quando for aceite.",
        "accepted": "O seu pedido foi aceite.",
        "denied": "O seu pedido foi recusado.",
        "initial": "Esta será a sua primeira interação com esta oferta.",
        "cancelled": "Cancelou o pedido de troca para esta oferta.",
        "deleted":
          "You have already interacted with this offer before, but you have deleted the chat",
        "otherSideLeft":
          "You have already interacted with this offer before, but other side has left the chat."
      },
      "listEmpty":
        "O seu mercado está a aquecer. Volte dentro de alguns minutos!",
      "emptyAction": "Adicionar nova oferta",
      "createOfferAndReachVexlers":
        "Chegou a {{reachNumber}} vexlers.\nAdicione mais contactos para aumentar o número de ofertas que vê.",
      "filterActive": "Filtro ativo",
      "totalOffers": "Total: {{totalCount}} ofertas",
      "notImportedAnyContacts":
        "Não importou quaisquer contactos. Importar contactos para ver ofertas da sua rede",
      "socialNetworkTooSmall":
        "Importou apenas alguns contactos, pelo que poderá não ver quaisquer ofertas",
      "noOffersToMatchFilter":
        "Não existem ofertas que correspondam aos seus critérios de filtragem",
      "offersAreLoadingAndShouldBeReady":
        "As ofertas estão a carregar e devem estar prontas para si em {{minutes}} minutos",
      "marketplaceEmpty": "Mercado vazio, ainda",
      "resetFilter": "Redefinir filtro",
      "totalFilteredOffers":
        "Filtrado: {{count}} ofertas (de um total de {{totalCount}})",
      "offerFromDirectFriend": "Oferta de um amigo direto",
      "offerFromFriendOfFriend": "Oferta de um amigo de um amigo",
      "youSeeThisOfferBecause":
        "Vê esta oferta porque a contraparte tem o seu número de telefone guardado na sua lista de contactos.",
      "beCautiousWeCannotVerify":
        "Tenha cuidado, pois não podemos verificar se se conhecem realmente na vida real.",
      "dontForgetToVerifyTheIdentity":
        "Não se esqueça de verificar a sua identidade com um contacto comum.",
      "noDirectConnection":
        "Este é um contacto com o qual não tem qualquer ligação direta.",
      "rerequestTomorrow": "Pode enviar outro pedido amanhã",
      "rerequestDays": "Pode enviar outro pedido dentro de {{days}} dias",
      "rerequest": "Enviar pedido novamente",
      "cancelRequest": "Cancelar pedido",
      "requestWasCancelledByOtherSide":
        "Não é possível aprovar. A outra parte cancelou o pedido",
      "requestNotFound":
        "Não é possível aprovar. A outra parte eliminou a sua conta"
    },
    "termsOfUse": {
      "termsOfUse": "Termos de utilização",
      "privacyPolicy": "Política de privacidade",
      "dontHaveTime":
        "Não tem tempo para ler tudo isto? Dê uma vista de olhos nas Perguntas Frequentes."
    },
    "faqs": {
      "faqs": "Perguntas frequentes",
      "whatIsVexl": "O que é Vexl?",
      "vexlIsPlatform":
        "Vexl é uma plataforma onde pode negociar Bitcoin na sua rede social do mundo real - os seus amigos e os amigos dos seus amigos - mantendo-se completamente anónimo - se assim o desejar.",
      "whoCanSeeMyContacts": "Quem pode ver os meus contactos?",
      "peopleWhomYouAllowToSee":
        "As pessoas a quem autorizas a ver a tua identidade podem ver os amigos que tens em comum e é tudo.",
      "howCanIRemainAnonymous":
        "Como posso manter o anonimato e continuar a participar no Vexl?",
      "byDefaultYouParticipateInTheNetwork":
        "Por defeito, participas na rede com o teu nome Vexl e o teu avatar Vexl que te foram atribuídos durante o registo. Só podes revelar a tua identidade numa determinada transação no nosso chat seguro e encriptado de ponta a ponta.",
      "howCanIMakeSure":
        "Como posso ter a certeza de que a pessoa com quem estou a falar é a pessoa com quem quero falar?",
      "oneChallenge":
        "Um dos desafios dos sistemas de comunicação verdadeiramente anónimos como o Vexl é que, por vezes, é necessário verificar a identidade da pessoa com quem se está a falar! Nestes casos, é melhor utilizar um canal de comunicação secundário seguro para confirmar com a outra pessoa que ambos são quem dizem ser.",
      "howCanIEnsure":
        "Como posso garantir que a minha comunicação e as minhas transacções são privadas e encriptadas?",
      "vexlIsOpensource":
        "O Vexl é de código aberto - qualquer pessoa pode procurar por qualquer backdoor ou intenção maliciosa. Além disso, aqui pode consultar o relatório de uma auditoria de segurança independente.",
      "howCanYouEnsure":
        "Como é que podem garantir que os meus dados estão protegidos?",
      "vexlIsDesigned":
        "O Vexl foi concebido para nunca recolher ou armazenar qualquer informação sensível. As mensagens Vexl e outros conteúdos não podem ser acedidos por nós ou por terceiros porque são sempre encriptados de ponta a ponta, privados e seguros. Os nossos Termos de Serviço e Política de Privacidade estão disponíveis abaixo.",
      "howDoIContactVexl": "Como posso contactar a Vexl?",
      "youCanAlwaysReachOutToUs":
        "Pode sempre contactar-nos através do e-mail: support@vexl.it. Para uma comunicação privada, pode também enviar-nos um e2ee mail. Ou pode encontrar-nos durante a sua próxima negociação P2P! 😻"
    },
    "offerForm": {
      "myNewOffer": "Nova oferta",
      "iWantTo": "Eu quero",
      "sellBitcoin": "Vender Bitcoin",
      "buyBitcoin": "Comprar Bitcoin",
      "amountOfTransaction": {
        "amountOfTransaction": "Valor",
        "pleaseSelectCurrencyFirst": "Por favor, seleccione primeiro a moeda",
        "pleaseSelectLocationFirst":
          "Por favor, seleccione primeiro a localização"
      },
      "premiumOrDiscount": {
        "premiumOrDiscount": "Prémio ou desconto",
        "youBuyForTheActualMarketPrice":
          "Compra pelo preço real de mercado. Use a barra deslizante para vender mais rapidamente ou ganhar mais.",
        "theOptimalPositionForMostPeople":
          "A posição óptima para a maioria das pessoas. Compra ligeiramente mais rápido, mas um pouco acima do preço de mercado",
        "youBuyReallyFast":
          "Compra rapidamente, mas a um preço muito superior ao preço de mercado",
        "youBuyPrettyCheap":
          "Compra muito barato, mas pode demorar um pouco mais a encontrar um vendedor",
        "youBuyVeryCheaply":
          "Compra muito barato, mas pode demorar algum tempo a encontrar um vendedor",
        "buyFaster": "Comprar rapidamente",
        "buyCheaply": "Comprar barato",
        "youSellForTheActualMarketPrice":
          "Vende pelo preço real de mercado. Use a barra deslizante para vender mais depressa ou ganhar mais.",
        "youEarnBitMore":
          "Ganha um pouco mais, mas pode demorar um pouco mais.",
        "youWantToEarnFortune":
          "Quer ganhar uma fortuna, mas pode demorar anos a encontrar um comprador.",
        "youSellSlightlyFaster":
          "Vende um pouco mais depressa, mas um pouco abaixo do preço de mercado",
        "youSellMuchFaster":
          "Vende muito mais depressa, mas muito abaixo do preço de mercado",
        "youBuyBtcFor": "Compra BTC por",
        "youSellBtcFor": "Vende BTC por",
        "marketPrice": "preço de mercado",
        "sellFaster": "Vender mais depressa",
        "earnMore": "Ganha mais",
        "premiumOrDiscountExplained": "Explicação do prémio ou desconto",
        "influenceImpactOfYourSellOffer":
          "Influencie o impacto da sua oferta. Venda mais rapidamente adicionando um desconto, ou ganhe mais adicionando um prémio ao preço de mercado da Bitcoin.",
        "influenceImpactOfYourBuyOffer":
          "Influencie o impacto da sua oferta. Compre mais barato adicionando um desconto, ou compre mais rápido adicionando um prémio ao preço de mercado da Bitcoin.",
        "playWithItAndSee":
          "Jogue com isso e veja como afecta o interesse dos outros.",
        "plus": "+",
        "minus": "-"
      },
      "buyCheaperByUsingDiscount":
        "Comprar mais barato com um desconto ou comprar mais depressa adicionando um prémio ao preço de mercado da bitcoin",
      "sellFasterWithDiscount":
        "Vender mais depressa com um desconto ou ganhar mais dinheiro adicionando um prémio ao preço de mercado da bitcoin.",
      "location": {
        "location": "Localização",
        "meetingInPerson":
          "Encontrar-se pessoalmente é mais seguro. O que deve ter em atenção online?",
        "checkItOut": "Verificar",
        "addCityOrDistrict": "Adicionar cidade ou distrito",
        "whatToWatchOutForOnline":
          "A que é que devemos estar atentos na Internet?",
        "moneySentByRandomPerson":
          "O dinheiro enviado por uma pessoa aleatória pode ser de origem criminosa e ser rastreável.",
        "neverSendCrypto": "Nunca envie bitcoin antes de receber o pagamento.",
        "alwaysVerifyTheName":
          "Verifica sempre o nome do titular da conta de quem recebeste o pagamento com a identidade declarada da contraparte.",
        "forwardTheAddress":
          "Envie o endereço de forma segura e certifique-se de que o verifica através de outro canal seguro."
      },
      "inPerson": "Pessoalmente",
      "online": "Online",
      "paymentMethod": {
        "paymentMethod": "Método de pagamento",
        "cash": "Em numerário",
        "bank": "Banco",
        "revolut": "Pagamento em linha"
      },
      "network": {
        "network": "Rede",
        "lightning": "Relâmpago",
        "theBestOption":
          "A melhor opção para montantes muito pequenos. Normalmente muito rápido.",
        "onChain": "Em cadeia",
        "theBestFor": "A melhor opção para quantias maiores. Mais lento."
      },
      "description": {
        "description": "Descrição",
        "writeWhyPeopleShouldTake":
          "Escreve porque é que as pessoas devem aceitar a tua oferta."
      },
      "friendLevel": {
        "friendLevel": "Nível de amizade",
        "firstDegree": "1º grau",
        "secondDegree": "2º grau",
        "noVexlers": "Sem vexlers",
        "reachVexlers": "Alcançar {{count}} vexadores"
      },
      "publishOffer": "Publicar oferta",
      "errorCreatingOffer": "Erro ao criar a oferta",
      "errorSearchingForAvailableLocation":
        "Erro ao procurar locais disponíveis",
      "offerEncryption": {
        "encryptingYourOffer": "Encriptar a sua oferta ...",
        "dontShutDownTheApp":
          "Não desligue a aplicação durante a encriptação. Pode demorar vários minutos.",
        "forVexlers": "para {{count}} vexlers",
        "doneOfferPoster": "Já está! Oferta publicada.",
        "yourFriendsAndFriendsOfFriends":
          "Os seus amigos e os amigos dos amigos deles podem agora ver a sua oferta.",
        "anonymouslyDeliveredToVexlers":
          "Entregue anonimamente a {{count}} vexlers"
      },
      "noVexlersFoundForYourOffer":
        "Não foram encontrados vexlers para a sua oferta",
      "errorLocationNotFilled": "Por favor, preencha a localização da oferta",
      "errorDescriptionNotFilled": "Por favor, preencha a descrição da oferta"
    },
    "notifications": {
      "permissionsNotGranted": {
        "title": "As permissões para notificações não foram concedidas",
        "message": "Pode activá-las nas definições",
        "openSettings": "Abrir definições"
      },
      "errorWhileOpening": "Erro ao abrir a notificação"
    },
    "myOffers": {
      "addNewOffer": "Adicionar nova oferta",
      "activeOffers": "{{count}} Ofertas activas",
      "filterOffers": "Filtrar ofertas",
      "errorWhileFetchingYourOffers": "Erro ao procurar ofertas",
      "editOffer": "Editar oferta",
      "myOffer": "A minha oferta",
      "offerAdded": "Adicionado {{date}}",
      "sortedByNewest": "Ordenado por mais recente",
      "sortedByOldest": "Ordenado pelo mais antigo"
    },
    "editOffer": {
      "editOffer": "Editar oferta",
      "active": "Ativo",
      "inactive": "Inativo",
      "saveChanges": "Guardar alterações",
      "offerUnableToChangeOfferActivation":
        "Não é possível alterar a ativação da oferta",
      "editingYourOffer": "Editar a sua oferta ...",
      "pleaseWait": "Aguardar",
      "offerEditSuccess": "Sucesso na edição da oferta",
      "youCanCheckYourOffer":
        "Pode verificar a sua oferta na sua secção de ofertas",
      "errorEditingOffer": "Erro ao editar a oferta",
      "errorOfferNotFound": "Oferta não encontrada!",
      "deletingYourOffer": "Eliminar a sua oferta ...",
      "offerDeleted": "Oferta eliminada",
      "errorDeletingOffer": "Erro ao eliminar a oferta",
      "deleteOffer": "Eliminar oferta?",
      "deleteOfferDescription":
        "Tem a certeza de que pretende eliminar esta oferta? Esta ação não pode ser anulada"
    },
    "filterOffers": {
      "filterResults": "Filtrar resultados",
      "sorting": "Ordenar",
      "lowestFeeFirst": "Taxa mais baixa",
      "highestFee": "Taxa mais elevada",
      "newestOffer": "Oferta mais recente",
      "oldestOffer": "Oferta mais antiga",
      "lowestAmount": "Montante mais baixo",
      "highestAmount": "Montante mais elevado",
      "selectSortingMethod": "Selecionar método de ordenação"
    },
    "messages": {
      "yourOffer": "A sua oferta",
      "theirOffer": "A oferta deles",
      "listTitle": "Conversas",
      "isBuying": "está a comprar",
      "isSelling": "está a vender",
      "thisWillBeYourFirstInteraction":
        "Esta será a sua primeira interação com esta oferta.",
      "wellLetYouKnowOnceUserAccepts":
        "Pedido enviado. Informá-lo-emos quando a outra parte tiver respondido.",
      "messagePreviews": {
        "incoming": {
          "MESSAGE": "{{them}}: {{message}}",
          "REQUEST_REVEAL": "{{them}} solicitou revelação de identidade",
          "APPROVE_REVEAL": "Identidade revelada",
          "DISAPPROVE_REVEAL": "Recusou a revelação da identidade",
          "REQUEST_MESSAGING": "Reagiu à sua oferta",
          "APPROVE_MESSAGING": "O pedido foi aceite",
          "DISAPPROVE_MESSAGING": "O pedido foi recusado",
          "DELETE_CHAT": "{{them}} deixou o chat",
          "BLOCK_CHAT": "{{them}} bloqueou-o",
          "OFFER_DELETED": "{{them}} Eliminou a oferta",
          "INBOX_DELETED": "{{them}} Apagou a conversa.",
          "CANCEL_REQUEST_MESSAGING": "O pedido foi cancelado"
        },
        "outgoing": {
          "MESSAGE": "Eu: {{message}}",
          "REQUEST_REVEAL": "Pediste para revelar a tua identidade",
          "APPROVE_REVEAL": "Identidade revelada",
          "DISAPPROVE_REVEAL": "Revelação de identidade recusada",
          "REQUEST_MESSAGING": "Pedido enviado",
          "APPROVE_MESSAGING": "Aprovou o envio de mensagens",
          "DISAPPROVE_MESSAGING": "Recusou o pedido de envio de mensagens",
          "DELETE_CHAT": "Saiu do chat",
          "BLOCK_CHAT": "O utilizador foi bloqueado",
          "OFFER_DELETED": "Apagou a sua oferta",
          "INBOX_DELETED": "Apagou esta caixa de entrada",
          "CANCEL_REQUEST_MESSAGING": "Cancelou o pedido de envio de mensagens"
        }
      },
      "deleteChat": "Apagar chat",
      "askToReveal": "Pedir para revelar a identidade",
      "blockUser": "Bloquear utilizador",
      "sending": "a enviar...",
      "unknownErrorWhileSending": "Erro desconhecido ao enviar a mensagem",
      "tapToResent": "Toque para reenviar.",
      "deniedByMe": "Negou o pedido de envio de mensagens com {{name}}.",
      "deniedByThem": "{{name}} negou o seu pedido de envio de mensagens.",
      "requestMessageWasDeleted":
        "O utilizador não forneceu qualquer mensagem inicial.",
      "typeSomething": "Escreva algo ...",
      "offerDeleted": "Oferta eliminada",
      "leaveToo": "Sair também?",
      "leaveChat": "Deixar o chat?",
      "deleteChatQuestion": "Apagar a conversa?",
      "blockForewerQuestion": "Bloquear para sempre?",
      "yesBlock": "Sim, bloquear",
      "deleteChatExplanation1":
        "Já terminou a negociação? Fechar o chat significa que a sua conversa será permanentemente apagada.",
      "deleteChatExplanation2":
        "Este é o passo definitivo. Confirme esta ação mais uma vez para apagar a conversa.",
      "blockChatExplanation1":
        "Quer mesmo bloquear este utilizador? Nunca poderá anular esta ação. Escolha sabiamente.",
      "blockChatExplanation2":
        "Quer mesmo bloquear este utilizador? Nunca poderá anular esta ação. Escolha sabiamente.",
      "chatEmpty": "Ainda não há conversas",
      "chatEmptyExplanation": "Iniciar uma conversa solicitando uma oferta",
      "seeOffers": "Ver ofertas",
      "identityRevealRequestModal": {
        "title": "Enviar pedido de revelação de identidade?",
        "text":
          "Ao enviar o pedido, também concorda com a revelação da sua própria identidade.",
        "send": "Enviar pedido"
      },
      "identityRevealRespondModal": {
        "title": "Deseja revelar a sua identidade?",
        "text":
          "Se revelar a sua identidade, verá também a identidade da sua contraparte."
      },
      "identityAlreadyRequested":
        "O pedido de identidade já foi enviado na conversa",
      "identityRevealRequest": "Pedido de revelação de identidade",
      "identityRevealed": "Identidade revelada",
      "identitySend": {
        "title": "Pedido de revelação de identidade enviado",
        "subtitle": "à espera de resposta"
      },
      "tapToReveal": "Tocar para revelar ou recusar",
      "letsRevealIdentities": "Vamos revelar identidades!",
      "reveal": "Revelar",
      "themDeclined": "{{name}} Recusado",
      "youDeclined": "Recusou",
      "reportOffer": "Comunicar oferta",
      "ended": "Terminado",
      "textMessageTypes": {
        "REQUEST_MESSAGING": "Pedido enviado: {{message}}",
        "CANCEL_REQUEST_MESSAGING": "Pedido cancelado",
        "DISAPPROVE_MESSAGING": "Pedido recusado",
        "APPROVE_MESSAGING": "Pedido aprovado"
      },
      "youHaveAlreadyTalked":
        "Tem um histórico de mensagens com este utilizador. Prima para ver mais",
      "requestPendingActionBar": {
        "top": "O chat está à espera da sua aprovação",
        "bottom":
          "Acima está a comunicação que teve com o utilizador até ao momento"
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
      "ENCRYPTING_PRIVATE_PAYLOADS": "{{percentDone}} Concluído",
      "FETCHING_CONTACTS": "",
      "CONSTRUCTING_PRIVATE_PAYLOADS": "Construir cargas úteis privadas",
      "CONSTRUCTING_PUBLIC_PAYLOAD":
        "Construir e encriptar a carga útil pública",
      "SENDING_OFFER_TO_NETWORK": "Carregar oferta",
      "DONE": "Concluído"
    },
    "commonFriends": {
      "commonFriends": "Amigos comuns",
      "commonFriendsCount": "{{commonFriendsCount}} Amigos comuns"
    },
    "reportIssue": {
      "openInEmail": "Abrir no correio eletrónico",
      "somethingWentWrong": "Algo correu mal",
      "feelFreeToGetInTouch": "Não hesite em contactar o nosso apoio.",
      "predefinedBody": "Olá! Estou a comunicar um problema..."
    },
    "AppLogs": {
      "title": "Nos registos da aplicação",
      "clear": "Limpar registos",
      "export": "Exportar registos",
      "errorExporting": "Erro ao exportar registos",
      "warning":
        "A ativação dos registos da aplicação pode tornar a aplicação mais lenta e requerer mais espaço de armazenamento.",
      "anonymizeAlert": {
        "title": "Gostaria de tornar os registos anónimos?",
        "text":
          "Podemos tentar retirar as chaves privadas e as informações pessoais dos registos antes de os exportar. Certifique-se sempre de que verifica por si próprio."
      }
    },
    "MaintenanceScreen": {
      "title": "Manutenção do mercado",
      "text":
        "A aplicação Vexl está em manutenção. Volte mais tarde, por favor."
    },
    "ForceUpdateScreen": {
      "title": "Nova versão disponível",
      "text":
        "Descarregue a versão mais recente do Vexl para uma funcionalidade adequada da aplicação.",
      "action": "Atualizar agora"
    },
    "btcPriceChart": {
      "requestCouldNotBeProcessed":
        "O pedido para obter o preço atual do BTC falhou"
    },
    "deepLinks": {
      "importContacts": {
        "alert": {
          "title": "Importar contacto",
          "text":
            "Pretende importar {{contactName}} com o número {{contactNumber}}?"
        },
        "successAlert": {
          "title": "Contacto importado"
        }
      }
    },
    "qrCode": {
      "joinVexl": "Juntar-se a vexl"
    },
    "editName": {
      "editName": "Editar nome",
      "errorUserNameNotValid": "O nome de utilizador não é válido"
    },
    "changeProfilePicture": {
      "changeProfilePicture": "Alterar fotografia de perfil",
      "uploadNewPhoto": "Carregar nova foto"
    },
    "suggestion": {
      "vexl": "Vexl",
      "suggests": "sugere",
      "yourAppGuide": "O seu guia de aplicações",
      "addMoreContacts": "Adicionar mais contactos",
      "noOffersFromOthersYet":
        "🤔 Ainda não há ofertas de outros? Tente adicionar mais contactos e aguarde ✌️",
      "createYourFirstOffer":
        "Cria a tua primeira oferta para comprar ou vender Bitcoin."
    }
  }
/* JSON ends */

export default otherPt
