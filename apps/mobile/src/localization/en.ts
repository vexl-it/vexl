export default {
  'common': {
    'next': 'Next',
    'skip': 'Skip',
    'finish': 'Finish',
    'continue': 'Continue',
    'save': 'Save',
    'search': 'Search',
    'deselectAll': 'Deselect All',
    'cancel': 'Cancel',
    'unknownError': 'Unknown Error',
    'unexpectedServerResposne': 'Unexpected Server Response',
    'cryptoError': 'Unexpected cryptography error',
    'secondsShort': 's',
    'ok': 'ok',
  },
  'loginFlow': {
    'anonymityNotice': 'Nobody will see this until you allow it. Even us.',
    'intro': {
      'title1': 'Import your contacs anonymously.',
      'title2': 'See their buy & sell offers.',
      'title3': 'Request identity for the ones you like and trade.',
    },
    'start': {
      'subtitle': 'Welcome! Ready to get started?',
      'touLabel': 'I agree to',
      'termsOfUse': 'Terms of use',
    },
    'anonymizationNotice': {
      'title': 'Your identity will be anonymized',
      'text':
        'Nobody will see your real name and profile picture until you reveal it for particular trade. Even us. Let’s set up your true identity first.',
    },
    'name': {
      'prompt': 'What do your friends call you?',
      'placeholder': 'Full name or nickname',
      'nameValidationError':
        'Name should be at least 1 characters long and maximum 50 characters long',
    },
    'photo': {
      'title': 'Hey {{name}}! What do you look like?',
      'selectSource': 'Select the source of your image',
      'camera': 'Camera',
      'gallery': 'Gallery',
      'permissionsNotGranted': 'Permissions not granted.',
      'nothingSelected': 'No image was selected',
    },
    'anonymization': {
      'beforeTitle': 'This is your identity',
      'afterTitle': 'Identity anonymized',
      'action': 'Anonymize',
      'afterDescription':
        'This is how other users will see you until you reveal your real identity.',
    },
    'phoneNumber': {
      'title': 'What’s your phone number?',
      'placeholder': 'Phone number',
      'text':
        'In order to connect you with the Vexl community, enter your phone number',
      'errors': {
        'invalidPhoneNumber':
          'Invalid phone number. Please try a different one',
        'previousCodeNotExpired':
          'Verification for this phone number is already in progress. Please wait until it expires',
      },
    },
    'verificationCode': {
      'title': 'We just sent you the code',
      'text': 'Enter it bellow to verify',
      'inputPlaceholder': 'Your verification code',
      'retryCountdown': 'Didn’t receive a code? Resend in',
      'retry': 'Didn’t receive a code? Tap to resend',
      'errors': {
        'userAlreadyExists': 'User with this phone number already exists',
        'challengeCouldNotBeGenerated':
          'Challenge could not be generated. Try again later',
        'verificationNotFound': 'Verification code wrong.',
        'UserNotFound': 'User not found. Try to resend the code.',
        'SignatureCouldNotBeGenerated':
          'Signature could not be generated. Try again later',
        'PublicKeyOrHashInvalid': 'Public key or hash invalid. Try again later',
      },
      'success': {
        'title': 'Phone verified.\nLet’s setup your profile.',
        'errorWhileParsingSessionForInternalState': 'Error while saving user',
      },
    },
    'importContacts': {
      'title': 'Let’s find your friends now!',
      'text':
        'Vexl is using your real-world social network - your friends and their friends. The more contacts you add, the more offers you’ll see.',
      'anonymityNotice': 'Nobody can see your contacts. Even us.',
      'action': 'Import contacts',
    },
    'permissions': {
      'title': 'Allow notification permissions',
      'text':
        'Enabling notifications lets you know when others accept your offers or when messages arrive. Vexl app can’t be used without this permission.',
      'action': 'Allow permissions',
    },
  },
  'postLoginFlow': {
    'contactsExplanation': {
      'title': 'Let’s find your friends now!',
      'text':
        'Vexl is using your real-world social network - your friends and their friends. The more contacts you add, the more offers you’ll see.',
      'anonymizationCaption': 'Nobody can see your contacts. Even us.',
    },
    'importContactsButton': 'Import contacts',
    'contactsList': {
      'deselectAll': 'Deselect all',
      'selectAll': 'Select all',
      'addContact': 'Add contact {{number}} manually',
      'inputPlaceholder': 'Search or Add number',
      'nothingFound': {
        'title': 'No contact found. ',
        'text':
          'To add phone number directly, type it into a search bar (with country code prefix).',
      },
      'toAddCustomContact':
        'To add phone number directly type it into a search bar (with country code)',
    },
    'allowNotifications': {
      'title': 'Allow notification permissions',
      'text':
        'Enabling notifications lets you know when others accept your offers or when messages arrive. Vexl app can’t be used without this permission.',
      'action': 'Allow permissions',
      'errors': {
        'permissionDenied':
          'Permissions not granted. You can allow them later in the system settings.',
        'unknownError': 'Unknown error while requesting permissions',
        'notAvailableOnEmulator': 'Notifications are not available on emulator',
      },
    },
  },
}
