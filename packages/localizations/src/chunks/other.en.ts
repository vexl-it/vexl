const otherEn =
  /* JSON starts */
  {
    "common": {
      "next": "Next",
      "skip": "Skip",
      "finish": "Finish",
      "confirm": "Confirm",
      "continue": "Continue",
      "save": "Save",
      "gotIt": "Got it",
      "search": "Search",
      "deselectAll": "Deselect All",
      "selectAll": "Select All",
      "cancel": "Cancel",
      "unknownError": "Unknown Error",
      "unexpectedServerResponse": "Unexpected Server Response",
      "networkErrors": {
        "errNetwork":
          "A network error has occurred. Are you connected to the internet?",
        "errCanceled": "Request was cancelled",
        "etimedout": "Request timed out",
        "econnaborted": "Connection aborted"
      },
      "submit": "Submit",
      "cryptoError": "Unexpected cryptography error",
      "secondsShort": "s",
      "ok": "ok",
      "request": "Request",
      "back": "Back",
      "goBack": "Go back",
      "close": "Close",
      "done": "Done",
      "errorCreatingInbox": "Error creating user inbox.",
      "accept": "Accept",
      "decline": "Decline",
      "youSure": "Are you sure?",
      "nope": "Nope",
      "yesDelete": "Yes, delete",
      "more": "More",
      "yes": "Yes",
      "no": "No",
      "myOffers": "My offers",
      "errorOpeningLink": {
        "message": "Error opening link",
        "text": "Copy to clipboard instead?",
        "copy": "Copy and close"
      },
      "nice": "Nice",
      "success": "Success!",
      "requested": "Requested",
      "now": "Now",
      "declined": "Declined",
      "reset": "Reset",
      "you": "You",
      "allow": "Allow",
      "currency": "Currency",
      "whatDoesThisMean": "What does '{{term}}' mean?",
      "learnMore": "Learn more",
      "unableToShareImage": "Unable to share the image",
      "requestAgain": "Request again",
      "seeDetail": "See details",
      "notNow": "Not now",
      "niceWithExclamationMark": "Nice!",
      "nothingFound": "Nothing found",
      "sendRequest": "Send request",
      "change": "Change",
      "errorWhileReadingQrCode": "Error while reading QR code",
      "copyErrorToClipboard": "Copy error to clipboard"
    },
    "loginFlow": {
      "anonymityNotice":
        "Nobody will see this until you allow it. Not even us.",
      "intro": {
        "title1": "Import your contacts anonymously.",
        "title2": "See their buy & sell offers.",
        "title3": "Request identity for the ones you like and trade."
      },
      "start": {
        "subtitle": "Welcome! Ready to get started?",
        "touLabel": "I agree to",
        "termsOfUse": "Terms of use"
      },
      "anonymizationNotice": {
        "title": "Your identity will be anonymized.",
        "text":
          "Nobody will see your real name and profile picture until you reveal it for particular trade. Not even us. Let’s set up your true identity first."
      },
      "name": {
        "prompt": "What do your friends call you?",
        "placeholder": "Name or nickname",
        "nameValidationError":
          "Your name should be long enough to beat a goldfish's memory, but short enough to fit in a fortune cookie – let's say somewhere between 1 and 25 characters."
      },
      "photo": {
        "title": "Hey {{name}}! What do you look like?",
        "selectSource": "Select the source of your image",
        "camera": "Camera",
        "gallery": "Gallery",
        "permissionsNotGranted": "Permission denied.",
        "nothingSelected": "No image was selected"
      },
      "anonymization": {
        "beforeTitle": "This is your private profile",
        "afterTitle": "Identity anonymized!",
        "action": "Anonymize",
        "afterDescription":
          "This is how other users will see you until you reveal your real identity."
      },
      "phoneNumber": {
        "title": "What’s your phone number?",
        "placeholder": "Phone number",
        "text":
          "In order to connect you with the Vexl community, enter your phone number",
        "errors": {
          "invalidPhoneNumber": "Invalid phone number. Please try again.",
          "previousCodeNotExpired":
            "Verification for this phone number is already in progress. Please wait until it expires."
        }
      },
      "verificationCode": {
        "title": "We just sent you the verification code",
        "text": "Enter it below to verify",
        "inputPlaceholder": "Your verification code",
        "retryCountdown": "Didn’t receive a code? Resend in",
        "retry": "Didn’t receive a code? Tap to resend",
        "errors": {
          "userAlreadyExists": "User with this phone number already exists",
          "challengeCouldNotBeGenerated":
            "Challenge could not be generated. Try again later",
          "verificationNotFound": "Invalid notification code.",
          "UserNotFound": "User not found. Try to resend the code.",
          "SignatureCouldNotBeGenerated":
            "Signature could not be generated. Try again later",
          "PublicKeyOrHashInvalid":
            "Public key or hash invalid. Try again later"
        },
        "success": {
          "title": "Phone number verified.\nLet’s setup your profile.",
          "errorWhileParsingSessionForInternalState": "Error while saving user"
        }
      },
      "importContacts": {
        "title": "Now, let’s find your friends!",
        "text":
          "Vexl is using your real-world social network - your friends and their friends. The more contacts you add, the more offers you’ll see.",
        "anonymityNotice": "Nobody can see your contacts. Not even us.",
        "action": "Import contacts"
      }
    },
    "postLoginFlow": {
      "contactsExplanation": {
        "title": "Now, let’s find your friends!",
        "text":
          "Vexl is using your real-world social network - your friends and their friends. The more contacts you add, the more offers you’ll see.",
        "anonymizationCaption": "Nobody can see your contacts. Not even us."
      },
      "importContactsButton": "Import contacts",
      "contactsList": {
        "addContactManually": "Add contact {{number}} manually",
        "inputPlaceholder": "Search or Add number",
        "nothingFound": {
          "title": "No contact found. ",
          "text":
            "To add phone number, type it into the search bar (with country code prefix)."
        },
        "toAddCustomContact":
          "To add phone number, type it into the search bar (with country code prefix).",
        "addContact": "Add contact",
        "addThisPhoneNumber":
          "Would you like to add this phone number to your Vexl contacts?",
        "addContactName": "Add contact name",
        "contactAdded": "Contact added.",
        "youHaveAddedContact":
          "You have added {{contactName}} to your Vexl contacts."
      },
      "allowNotifications": {
        "title": "Enable notifications",
        "text":
          "Enabling notifications allows you to find out when others accept your request or you receive a message.",
        "action": "Allow",
        "cancel": "Skip",
        "errors": {
          "permissionDenied":
            "Permission not granted. You can change this in the system settings later.",
          "unknownError": "Unknown error while requesting permissions",
          "notAvailableOnEmulator":
            "Notifications are not available on emulator"
        },
        "vexlCantBeUsedWithoutNotifications":
          "Vexl app can’t be used without this permission."
      }
    },
    "settings": {
      "yourReach": "Your reach: {{number}} vexlers",
      "items": {
        "changeProfilePicture": "Change profile picture",
        "editName": "Edit name",
        "contactsImported": "Contacts management",
        "xFriends": "{{number}} friends",
        "setPin": "Set PIN",
        "faceId": "Face ID",
        "allowScreenshots": "Allow Screenshots",
        "allowScreenshotsDescription":
          "Prevent users from taking screenshots of the chat",
        "termsAndPrivacy": "Terms and Privacy",
        "faqs": "FAQs",
        "reportIssue": "Contact support",
        "inAppLogs": "In-app logs",
        "requestKnownData": "Request known data",
        "followUsOn": "Follow us on",
        "twitter": "Twitter",
        "twitterUrl": "https://twitter.com/vexl",
        "readMoreOn": "Read more on",
        "medium": "Medium",
        "mediumUrl": "https://blog.vexl.it",
        "learnMoreOn": "Learn more on",
        "website": "Vexl.it",
        "websiteUrl": "https://vexl.it",
        "deleteAccount": "Delete account",
        "supportEmail": "support@vexl.it"
      },
      "noLogoutExplanation":
        "Can't find logout? There's no such thing.\nBut you can delete your account.",
      "support":
        "If you like Vexl, support it’s improvement by sending some bitcoin as donation!",
      "version": "Vexl App version: {{version}}",
      "logoutDialog": {
        "title": "Delete account?",
        "title2": "You sure?",
        "description":
          "Are you sure you want to delete your account? This action cannot be undone"
      }
    },
    "offer": {
      "title": "Offer",
      "cashOnly": "Cash only",
      "onlineOnly": "Online only",
      "upTo": "Up to",
      "forSeller": "For seller",
      "forBuyer": "For buyer",
      "bank": "Bank",
      "revolut": "Online payment",
      "isSelling": "is selling",
      "isBuying": "is buying",
      "directFriend": "Direct friend",
      "friendOfFriend": "Friend of a friend",
      "buy": "Buy",
      "sell": "Sell",
      "filterOffers": "Filter offers",
      "numberOfCommon": "{{number}} common",
      "offerNotFound":
        "Offer not found. It might have been deleted by the author",
      "inputPlaceholder": "Type your message here...",
      "sendRequest": "Send request",
      "report": {
        "areYouSureTitle": "Report offer?",
        "areYouSureText":
          "Are you certain about reporting this offer? Once reported, it cannot be undone. Choose wisely.",
        "yes": "Yes, report",
        "thankYou": "Thank you!",
        "inappropriateContentWasReported":
          "Inappropriate content was anonymously reported.",
        "reportLimitReached":
          "You have reached the maximum number of reports for today. Try again in 24 hours."
      },
      "goToChat": "Go to chat",
      "requestStatus": {
        "requested":
          "You've requested a trade. We'll notify you once it's accepted.",
        "accepted": "Your request was accepted.",
        "denied": "Your request was declined.",
        "initial": "This will be your first interaction with this offer.",
        "cancelled":
          "You previously cancelled the trade request for this offer.",
        "deleted":
          "You have already interacted with this user regarding this offer, but you deleted the chat.",
        "otherSideLeft":
          "You have already interacted with this offer, but the counterparty left the chat.",
        "leaved": "You have already interacted with this offer before."
      },
      "listEmpty":
        "Your marketplace is just warming up. Come back in a couple of minutes! ",
      "emptyAction": "Add new offer",
      "createOfferAndReachVexlers":
        "You reach {{reachNumber}} vexlers.\nAdd more contacts to increase the number of offers you see.",
      "filterActive": "Filter active",
      "totalOffers": "Total: {{totalCount}} offers",
      "notImportedAnyContacts":
        "You have not imported any contacts. Import contacts to see offers from your network!",
      "socialNetworkTooSmall":
        "You imported only a few contacts so you might not see any offers.",
      "noOffersToMatchFilter":
        "There are no offers to match your filter criteria. Try adjusting your filters for more results.",
      "offersAreLoadingAndShouldBeReady":
        "Offers are loading and should be ready for you in {{minutes}} minutes",
      "marketplaceEmpty": "Marketplace empty yet",
      "resetFilter": "Reset filter",
      "totalFilteredOffers":
        "Filtered: {{count}} offers (out of total {{totalCount}})",
      "offerFromDirectFriend": "Offer from a direct friend",
      "offerFromFriendOfFriend": "Offer from a friend of a friend",
      "youSeeThisOfferBecause":
        "You see this offer because the counterparty has your phone number saved in their contact list.",
      "beCautiousWeCannotVerify":
        "Be cautious, we cannot verify if you really know each other in the real life.",
      "dontForgetToVerifyTheIdentity":
        "Don't forget to verify their identity with a common contact.",
      "noDirectConnection":
        "This is a contact with whom you have no direct connection.",
      "rerequestTomorrow": "You can send another request tomorrow.",
      "rerequestDays": "You can send another request in {{days}} days.",
      "rerequest": "Send request again",
      "cancelRequest": "Cancel request",
      "requestWasCancelledByOtherSide":
        "Unable to approve. Other side has cancelled the request.",
      "requestNotFound":
        "Unable to approve. Other side has deleted their account.",
      "otherSideAccountDeleted": "Other side has deleted their account"
    },
    "termsOfUse": {
      "termsOfUse": "Terms of Use",
      "privacyPolicy": "Privacy Policy",
      "dontHaveTime":
        "Don’t have a time to read all this? Take a look on Frequently Asked Questions."
    },
    "faqs": {
      "faqs": "Frequently Asked Questions",
      "whatIsVexl": "What is Vexl?",
      "vexlIsPlatform":
        "Vexl is a platform where you can trade Bitcoin within your real world social network - your friends and friends of their friends - while staying completely anonymous - if you wish.",
      "whoCanSeeMyContacts": "Who can see my contacts?",
      "peopleWhomYouAllowToSee":
        "People whom you allow to see your identity can see the friends you have in common and that's all.",
      "howCanIRemainAnonymous":
        "How can I remain anonymous and still participate in Vexl? ",
      "byDefaultYouParticipateInTheNetwork":
        "By default, you participate in the network under your Vexl name and Vexl avatar that were given to you during the registration. You can only reveal your identity per a particular trade in our secure, end to end encrypted chat.",
      "howCanIMakeSure":
        "How can I make sure that the person I am talking to is the person I want to talk to?",
      "oneChallenge":
        "One challenge with truly anonymous communications systems like Vexl is that sometimes you do need to verify the identity of the person you’re talking to! In cases like these, it’s best to use a secure secondary channel of communication to confirm with the other person that you’re both who you say you are.",
      "howCanIEnsure":
        "How can I ensure that my communication and trades are private and encrypted? ",
      "vexlIsOpensource":
        "Vexl is open source - anyone can look for any backdoor or malicious intent. Also, here you can look at the report from an independent Security Audit .",
      "howCanYouEnsure": "How can you ensure that my data is protected?",
      "vexlIsDesigned":
        "Vexl is designed to never collect or store any sensitive information. Vexl messages and other content cannot be accessed by us or other third parties because they are always end-to-end encrypted, private, and secure. Our Terms of Service and Privacy Policy are available below.",
      "howDoIContactVexl": "How do I contact Vexl?",
      "youCanAlwaysReachOutToUs":
        "You can always reach out to us via email: support@vexl.it. For a private comms, you can also send us an e2ee mail. Or you can meet us during your next P2P trade! 😻"
    },
    "offerForm": {
      "myNewOffer": "New offer",
      "iWantTo": "I want to",
      "sellBitcoin": "Sell Bitcoin",
      "buyBitcoin": "Buy Bitcoin",
      "amountOfTransaction": {
        "amountOfTransaction": "Amount",
        "pleaseSelectCurrencyFirst": "Please select currency first",
        "pleaseSelectLocationFirst": "Please select location first"
      },
      "premiumOrDiscount": {
        "premiumOrDiscount": "Premium or discount",
        "youBuyForTheActualMarketPrice":
          "You buy for the actual market price. Play with the slider to buy cheaply or faster.",
        "theOptimalPositionForMostPeople":
          "The optimal position for most people. You buy slightly faster, but a bit overpriced.",
        "youBuyReallyFast":
          "You buy quickly, but so much above the market price.",
        "youBuyPrettyCheap":
          "You buy pretty cheap, but it can take slightly longer to find a seller.",
        "youBuyVeryCheaply":
          "You buy very cheaply, but it can take a while to find seller.",
        "buyFaster": "Buy quickly",
        "buyCheaply": "Buy cheaply",
        "youSellForTheActualMarketPrice":
          "You sell for the actual market price. Play with the slider to sell faster or earn more.",
        "youEarnBitMore":
          "You earn a bit more, but it can take slightly longer.",
        "youWantToEarnFortune":
          "You want to earn a fortune, but it can take years to find a buyer.",
        "youSellSlightlyFaster":
          "You sell slightly faster, but a bit below market price",
        "youSellMuchFaster": "You sell much faster, but far below market price",
        "youBuyBtcFor": "You buy BTC for",
        "youSellBtcFor": "You sell BTC for",
        "marketPrice": "market price",
        "sellFaster": "Sell faster",
        "earnMore": "Earn more",
        "premiumOrDiscountExplained": "Premium or discount explained",
        "influenceImpactOfYourSellOffer":
          "Influence the impact of your offer. Sell faster by adding a discount, or earn more by adding a premium to the Bitcoin market price.",
        "influenceImpactOfYourBuyOffer":
          "Influence the impact of your offer. Buy cheaply by adding a discount, or buy faster by adding a premium to the bitcoin market price.",
        "playWithItAndSee":
          "Play with it and see how it affects the interest of others.",
        "plus": "+",
        "minus": "-",
        "youEarnSoMuchMore": "You earn so much more, but it can take a while."
      },
      "buyCheaperByUsingDiscount":
        "Buy cheaper by using a discount or buy faster by adding a premium to the bitcoin market price",
      "sellFasterWithDiscount":
        "Sell faster with a discount or earn more by adding a premium to the bitcoin market price.",
      "location": {
        "location": "Location",
        "meetingInPerson":
          "Meeting in person is safer. What to watch out for online?",
        "checkItOut": "Check it out",
        "addCityOrDistrict": "Add city, or district",
        "whatToWatchOutForOnline": "What to watch out for online?",
        "moneySentByRandomPerson":
          "Money sent by a random person can be of criminal origin and traceable.",
        "neverSendCrypto": "Never send bitcoin before receiving payment.",
        "alwaysVerifyTheName":
          "Always verify the name of the account holder you received the payment from with the declared identity of the counterparty.",
        "forwardTheAddress":
          "Forward the address in a secure manner and be sure to verify it through another secure channel."
      },
      "inPerson": "In person",
      "online": "Online",
      "paymentMethod": {
        "paymentMethod": "Payment method",
        "cash": "Cash",
        "bank": "Bank",
        "revolut": "Online payment"
      },
      "network": {
        "network": "Network",
        "lightning": "Lightning",
        "theBestOption":
          "The best option for really small amounts. Usually super fast.",
        "onChain": "On chain",
        "theBestFor": "The best for larger amounts. Slower."
      },
      "description": {
        "description": "Description",
        "writeWhyPeopleShouldTake":
          "Write why people should accept your offer."
      },
      "friendLevel": {
        "friendLevel": "Friend level",
        "firstDegree": "1st degree",
        "secondDegree": "2nd degree",
        "noVexlers": "No vexlers",
        "reachVexlers": "Reach {{count}} vexlers"
      },
      "publishOffer": "Publish offer",
      "errorCreatingOffer": "Error while creating offer",
      "errorSearchingForAvailableLocation":
        "Error when searching for available locations",
      "offerEncryption": {
        "encryptingYourOffer": "Encrypting your offer ...",
        "dontShutDownTheApp":
          "Don’t shut down the app while encrypting. It can take several minutes.",
        "forVexlers": "for {{count}} vexlers",
        "doneOfferPoster": "Done! Offer posted.",
        "yourFriendsAndFriendsOfFriends":
          "Your friends and friends of their friends can now see your offer.",
        "anonymouslyDeliveredToVexlers":
          "Anonymously delivered to {{count}} vexlers"
      },
      "noVexlersFoundForYourOffer": "No vexlers found for your offer",
      "errorLocationNotFilled": "Please fill in offer location",
      "errorDescriptionNotFilled": "Please fill in offer description",
      "selectCurrency": "Select currency",
      "currencyYouWouldLikeToUse":
        "The currency you would like to use in your trade."
    },
    "notifications": {
      "permissionsNotGranted": {
        "title": "Permissions for notifications were not granted",
        "message": "You can enable them in the settings",
        "openSettings": "Open settings"
      },
      "errorWhileOpening": "Error while opening notification",
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
        "title": "Long time no see!",
        "body":
          "It's been a while since you've opened the app. Open the app now to keep your offers active."
      },
      "preferences": {
        "marketing": {
          "title": "Marketing notifications",
          "body": "Receive notifications about new features!"
        },
        "chat": {
          "title": "Chat notifications",
          "body": "Receive notifications about new requests and messages."
        },
        "inactivityWarnings": {
          "title": "Inactivity warnings",
          "body":
            "We will let you know when your offers are about to be deactivated due to innactivity."
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
        "body": "You have been requested to share your phone number."
      },
      "APPROVE_CONTACT_REVEAL": {
        "title": "Phone number shared!",
        "body": "Your request to exchange phone numbers was approved."
      },
      "DISAPPROVE_CONTACT_REVEAL": {
        "title": "Request denied!",
        "body": "Your request to exchange phone numbers was denied."
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
      "addNewOffer": "Add new offer",
      "activeOffers": "{{count}} active offers",
      "filterOffers": "Filter offers",
      "errorWhileFetchingYourOffers": "Error while fetching offers",
      "editOffer": "Edit offer",
      "myOffer": "My Offer",
      "offerAdded": "Added {{date}}",
      "sortedByNewest": "Sorted by newest",
      "sortedByOldest": "Sorted by oldest"
    },
    "editOffer": {
      "editOffer": "Edit offer",
      "active": "Active",
      "inactive": "Inactive",
      "saveChanges": "Save changes",
      "offerUnableToChangeOfferActivation": "Unable to change offer activation",
      "editingYourOffer": "Editing your offer ...",
      "pleaseWait": "Please wait",
      "offerEditSuccess": "Offer edit success",
      "youCanCheckYourOffer": "You can check your offer in your offers section",
      "errorEditingOffer": "Error while editing offer",
      "errorOfferNotFound": "Offer not found!",
      "deletingYourOffer": "Deleting your offer ...",
      "offerDeleted": "Offer deleted",
      "errorDeletingOffer": "Error while deleting offer",
      "deleteOffer": "Delete offer?",
      "deleteOfferDescription":
        "Are you sure you want to delete this offer? This action cannot be undone"
    },
    "filterOffers": {
      "filterResults": "Filter results",
      "sorting": "Sorting",
      "lowestFeeFirst": "Lowest fee ",
      "highestFee": "Highest fee",
      "newestOffer": "Newest offer",
      "oldestOffer": "Oldest offer",
      "lowestAmount": "Lowest amount",
      "highestAmount": "Highest amount",
      "selectSortingMethod": "Select sorting method"
    },
    "messages": {
      "yourOffer": "Your offer",
      "theirOffer": "Their offer",
      "listTitle": "Chats",
      "isBuying": "is buying",
      "isSelling": "is selling",
      "thisWillBeYourFirstInteraction":
        "This will be your first interaction with this user regarding this offer.",
      "wellLetYouKnowOnceUserAccepts":
        "Your request is pending. We will let you know once the other side has responded.",
      "messagePreviews": {
        "incoming": {
          "MESSAGE": "{{them}}: {{message}}",
          "REQUEST_REVEAL": "{{them}} requested identity reveal",
          "APPROVE_REVEAL": "Identity revealed",
          "DISAPPROVE_REVEAL": "Declined identity reveal",
          "REQUEST_MESSAGING": "Reacted to your offer",
          "APPROVE_MESSAGING": "Request was accepted",
          "DISAPPROVE_MESSAGING": "Request was declined",
          "DELETE_CHAT": "{{them}} left the chat",
          "BLOCK_CHAT": "{{them}} has blocked you",
          "OFFER_DELETED": "{{them}} has deleted the offer",
          "INBOX_DELETED": "{{them}} has deleted the chat.",
          "CANCEL_REQUEST_MESSAGING": "Request was cancelled",
          "ONLY_IMAGE": "{{them}} sent an image",
          "REQUEST_CONTACT_REVEAL": "{{them}} has requested your phone number.",
          "APPROVE_CONTACT_REVEAL": "Phone number revealed",
          "DISAPPROVE_CONTACT_REVEAL":
            "Request to share phone number was declined."
        },
        "outgoing": {
          "MESSAGE": "Me: {{message}}",
          "REQUEST_REVEAL": "You have requested identity reveal",
          "APPROVE_REVEAL": "Identity was revealed",
          "DISAPPROVE_REVEAL": "Identity reveal was declined",
          "REQUEST_MESSAGING": "Your request was sent",
          "APPROVE_MESSAGING": "You have approved messaging",
          "DISAPPROVE_MESSAGING": "You have declined messaging request",
          "DELETE_CHAT": "You have left the chat",
          "BLOCK_CHAT": "User has been blocked",
          "OFFER_DELETED": "You have deleted your offer",
          "INBOX_DELETED": "You have deleted this inbox",
          "CANCEL_REQUEST_MESSAGING": "You have cancelled the request.",
          "ONLY_IMAGE": "You have sent an image",
          "REQUEST_CONTACT_REVEAL": "You've have requested their phone number",
          "APPROVE_CONTACT_REVEAL": "Phone number was shared",
          "DISAPPROVE_CONTACT_REVEAL":
            "They declined to share their phone number"
        }
      },
      "deleteChat": "Delete chat",
      "askToReveal": "Ask to reveal identity",
      "blockUser": "Block user",
      "sending": "sending...",
      "unknownErrorWhileSending": "Unknown error while sending message",
      "tapToResent": "Tap to resend.",
      "deniedByMe": "You denied messaging request request with {{name}}.",
      "deniedByThem": "{{name}} denied your messaging request.",
      "requestMessageWasDeleted": "User didn't provide any initial message.",
      "typeSomething": "Type something ...",
      "offerDeleted": "Offer deleted",
      "leaveToo": "Leave too?",
      "leaveChat": "Leave chat?",
      "deleteChatQuestion": "Delete chat?",
      "blockForewerQuestion": "Block forever?",
      "yesBlock": "Yes, block",
      "deleteChatExplanation1":
        "Are you done trading? Closing chat means that your conversation will be permanently deleted.",
      "deleteChatExplanation2":
        "This is irreversible. Do you want to delete this chat?",
      "blockChatExplanation1":
        "Do you really want to block this user? You will never be able to undo this action. Choose wisely.",
      "blockChatExplanation2":
        "Do you really want to block this user? You will never be able to undo this action. Choose wisely.",
      "chatEmpty": "No chats yet",
      "chatEmptyExplanation": "Start a conversation by requesting an offer",
      "seeOffers": "See offers",
      "identityRevealRequestModal": {
        "title": "Send a request to reveal identities?",
        "text":
          "By sending a request you agree to reveal your own identity too.",
        "send": "Send request"
      },
      "identityRevealRespondModal": {
        "title": "Do you want to reveal your identity?",
        "text":
          "If you reveal your identity, you will see the identity of your counterparty too."
      },
      "identityAlreadyRequested":
        "Identity request was already sent in the conversation",
      "identityRevealRequest": "Identity requested",
      "identityRevealed": "Identity revealed",
      "identitySend": {
        "title": "Identity request sent",
        "subtitle": "waiting for response"
      },
      "tapToReveal": "Tap to reveal or decline",
      "letsRevealIdentities": "Let's reveal identities!",
      "reveal": "Reveal",
      "themDeclined": "{{name}} declined",
      "youDeclined": "You have declined",
      "reportOffer": "Report offer",
      "ended": "Ended",
      "textMessageTypes": {
        "REQUEST_MESSAGING": "Your request: {{message}}",
        "CANCEL_REQUEST_MESSAGING": "This request was cancelled.",
        "DISAPPROVE_MESSAGING": "This request was denied.",
        "APPROVE_MESSAGING":
          "Request approved, you can now discuss the details."
      },
      "youHaveAlreadyTalked":
        "You have a message history with this user. Press to see more",
      "requestPendingActionBar": {
        "top": "Chat is waiting for your approval",
        "bottom": "Above is communication you had with the user so far"
      },
      "showFullChatHistory":
        "You have already interacted with this user regarding this offer. Tap to see chat history.",
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
      },
      "cancelRequestDialog": {
        "title": "Are you sure?",
        "description":
          "If you cancel the messaging request other side will be unable to accept it",
        "yes": "Yes, cancel"
      },
      "contactRevealRespondModal": {
        "title": "Are you sure you want to share your phone number?",
        "text": "This will reveal your phone number to the counterparty."
      },
      "contactRevealRequestModal": {
        "title": "Request phone number",
        "text":
          "By requesting a phone number, you agree to share yours as well."
      },
      "contactAlreadyRequested": "A phone number request was already sent.",
      "contactRevealRequest": "Request to share phone number",
      "contactRevealSent": {
        "title": "Request to share phone number sent",
        "subtitle": "Waiting for response"
      },
      "letsExchangeContacts": "Let’s exchange contacts!",
      "phoneNumberRevealed": "Phone numbers shared!",
      "phoneNumberReveal": "Phone number reveal",
      "phoneNumberRevealDeclined": "They declined to share their phone number",
      "contactIsAlreadyInYourContactList":
        "Contact is already in your contact list.",
      "addUserToYourContacts": "Add {{name}} to your contacts?",
      "tapToAddToYourVexlContacts": "Tap to add to your Vexl contacts."
    },
    "progressBar": {
      "ENCRYPTING_PRIVATE_PAYLOADS": "{{percentDone}}% done",
      "FETCHING_CONTACTS": "",
      "CONSTRUCTING_PRIVATE_PAYLOADS": "Constructing private payloads",
      "CONSTRUCTING_PUBLIC_PAYLOAD":
        "Constructing and encrypting public payload",
      "SENDING_OFFER_TO_NETWORK": "Uploading offer",
      "DONE": "Done"
    },
    "commonFriends": {
      "commonFriends": "Common friends",
      "commonFriendsCount": "{{commonFriendsCount}} common friends"
    },
    "reportIssue": {
      "openInEmail": "Open in e-mail",
      "somethingWentWrong": "Something went wrong",
      "feelFreeToGetInTouch": "Feel free to get in touch with our support.",
      "predefinedBody": "Hi! I am reporting an issue..."
    },
    "AppLogs": {
      "title": "In app logs",
      "clear": "Clear logs",
      "export": "Export logs",
      "errorExporting": "Error exporting logs",
      "warning":
        "Enabling app logs may cause app to be slower and will require more storage space.",
      "anonymizeAlert": {
        "title": "Would you like to anonymize logs?",
        "text":
          "We can try to strip private keys and personal information from logs before exporting them. Always make sure to verify by yourself."
      }
    },
    "MaintenanceScreen": {
      "title": "Marketplace maintenance",
      "text": "Vexl app is performing maintenance. Come back later, please."
    },
    "ForceUpdateScreen": {
      "title": "New version available",
      "text":
        "Download the latest version of Vexl for proper app functionality.",
      "action": "Update now"
    },
    "btcPriceChart": {
      "requestCouldNotBeProcessed":
        "Request to obtain current BTC price failed"
    },
    "deepLinks": {
      "importContacts": {
        "alert": {
          "title": "Import contact",
          "text":
            "Do you want to import {{contactName}} with number {{contactNumber}}?"
        },
        "successAlert": {
          "title": "Contact imported"
        }
      }
    },
    "qrCode": {
      "joinVexl": "Join vexl"
    },
    "editName": {
      "editName": "Edit name",
      "errorUserNameNotValid": "User name is not valid"
    },
    "changeProfilePicture": {
      "changeProfilePicture": "Change profile picture",
      "uploadNewPhoto": "Upload new photo"
    },
    "suggestion": {
      "vexl": "Vexl",
      "suggests": "suggests",
      "yourAppGuide": "Your app guide",
      "addMoreContacts": "Add more contacts",
      "noOffersFromOthersYet":
        "🤔 No offers from others yet? Try to add more contacts, and wait ✌️",
      "createYourFirstOffer":
        "👋 Create your first offer to buy or sell Bitcoin."
    },
    "addContactDialog": {
      "addContact": "Add contact",
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
    "": ""
  }
/* JSON ends */

export default otherEn
