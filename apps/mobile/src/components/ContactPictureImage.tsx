import {getContactByIdAsync} from 'expo-contacts'
import {useEffect, useState} from 'react'
import {Image} from 'tamagui'
import {type NonUniqueContactId} from '../state/contacts/domain'

type Props = React.ComponentProps<typeof Image> & {
  // undefined to make it easier to use with ContactInfo. TODO remove once nonUniqueContactId is required
  contactId?: NonUniqueContactId
  fallback?: React.ReactNode
}

export default function ContactPictureImage({
  contactId,
  fallback,
  ...props
}: Props): JSX.Element | null {
  const [imageUri, setImageUri] = useState<string | null>(null)
  useEffect(() => {
    if (!contactId) return

    void getContactByIdAsync(contactId)
      .then((contact) => {
        const contactImageUri = contact?.image?.uri
        if (contactImageUri) {
          setImageUri(contactImageUri)
        }
      })
      .catch((err) => {
        console.debug('Error loading image', err)
      })
  }, [contactId])

  if (imageUri) {
    return <Image {...props} source={{uri: imageUri}} />
  }
  return fallback ? <>{fallback}</> : null
}
