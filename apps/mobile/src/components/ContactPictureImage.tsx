import {Option} from 'effect'
import {getContactByIdAsync} from 'expo-contacts'
import React, {useEffect, useState} from 'react'
import {Platform} from 'react-native'
import {Image} from 'tamagui'
import {type NonUniqueContactId} from '../state/contacts/domain'

type Props = React.ComponentProps<typeof Image> & {
  // undefined to make it easier to use with ContactInfo. TODO remove once nonUniqueContactId is required
  contactId: Option.Option<NonUniqueContactId>
  fallback?: React.ReactNode
}

interface ImageDetails {
  uri: string
  isABImageOnIos: boolean
}

export default function ContactPictureImage({
  contactId,
  fallback,
  ...props
}: Props): React.ReactElement | null {
  const [imageDetails, setImageDetails] = useState<ImageDetails | null>(null)

  useEffect(() => {
    if (Option.isNone(contactId)) return

    setImageDetails(null)

    void getContactByIdAsync(contactId.value)
      .then((contact) => {
        const contactImageUri = contact?.image?.uri

        if (contactImageUri) {
          setImageDetails({
            uri: contactImageUri,
            isABImageOnIos: !!(
              Platform.OS === 'ios' && contact.id?.includes(':ABPerson')
            ),
          })
        }
      })
      .catch((err) => {
        console.debug('Error loading image', err)
      })
  }, [contactId])

  // TODO: lets monitor this issue in https://github.com/vexl-it/vexl/issues/1984
  // and then change back to previous behaviour once fixed
  if (!imageDetails || imageDetails?.isABImageOnIos) {
    return fallback ? <>{fallback}</> : null
  }

  return <Image {...props} source={{uri: imageDetails.uri}} />
}
