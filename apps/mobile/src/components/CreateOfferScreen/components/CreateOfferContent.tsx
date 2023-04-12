import {type CreateOfferContentProps} from '../useContent'
import Section from './Section'
import React from 'react'
import {ActivityIndicator, ScrollView, StyleSheet} from 'react-native'
import ChunkView from '../../ChunkView'
import {getTokens, Stack} from 'tamagui'
import ScreenTitle from '../../ScreenTitle'
import {useTranslation} from '../../../utils/localization/I18nProvider'

interface Props {
  content: CreateOfferContentProps[]
  onClosePress: () => void
}

const styles = StyleSheet.create({
  contentStyles: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})

function LoaderComponent(): JSX.Element {
  const tokens = getTokens()
  return (
    <Stack pt="$8">
      <ActivityIndicator size="large" color={tokens.color.main.val} />
    </Stack>
  )
}

function CreateOfferContent({content, onClosePress}: Props): JSX.Element {
  const {t} = useTranslation()
  return (
    <ScrollView contentContainerStyle={styles.contentStyles}>
      <ScreenTitle
        px="$4"
        onClosePress={onClosePress}
        text={t('createOffer.myNewOffer')}
        withBottomBorder
      />
      <ChunkView displayOnProgress={<LoaderComponent />}>
        {content.map(
          (item) =>
            item.customSection ?? (
              <Section
                key={item.title}
                image={item.image}
                title={item.title}
                mandatory={item.mandatory}
              >
                {item.children}
              </Section>
            )
        )}
      </ChunkView>
    </ScrollView>
  )
}

export default React.memo(CreateOfferContent)
