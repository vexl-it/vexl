import {type BlogArticlePreview} from '@vexl-next/rest-api/src/services/content/contracts'
import dayjs from 'dayjs'
import {Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {Dimensions, Linking} from 'react-native'
import {Image, ScrollView, Stack, Text, YStack} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Button from '../Button'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {blogsStateAtom, loadBlogsActionAtom} from './state'

function BlogItem({item}: {item: BlogArticlePreview}): React.ReactElement {
  const {t} = useTranslation()
  return (
    <YStack gap="$4">
      {Option.isSome(item.mainImage) && (
        <Image
          height={Dimensions.get('window').height / 3}
          width="100%"
          br="$5"
          source={{uri: item.mainImage.value}}
        />
      )}
      <Text fontFamily="$heading" fontSize={24}>
        {item.title}
      </Text>
      {Option.isSome(item.teaserText) && (
        <Text fontFamily="$body500" fontSize={16} color="$greyOnBlack">
          {item.teaserText.value}
        </Text>
      )}
      <Text color="$main" fontFamily="$body500">
        {dayjs(item.publishedOn).format('LL')}
      </Text>
      <Stack alignItems="flex-start">
        <Button
          variant="secondary"
          size="small"
          text={t('blog.readMore')}
          onPress={() => {
            void Linking.openURL(item.link)
          }}
        ></Button>
      </Stack>
    </YStack>
  )
}

export function BlogArticlesListScreen(): React.ReactElement {
  const loadBlogs = useSetAtom(loadBlogsActionAtom)
  const {data, error, loading} = useAtomValue(blogsStateAtom)
  const {t} = useTranslation()

  useEffect(() => {
    void loadBlogs()
  }, [loadBlogs])

  return (
    <Screen customHorizontalPadding={16}>
      <ScreenTitle text={t('blog.title')} withBackButton />
      <ScrollView>
        <Stack>
          {!!loading && <Text>Loading...</Text>}
          {Option.isSome(data) ? (
            <YStack gap="$9">
              {data.value.articles.map((item) => (
                <BlogItem key={item.id} item={item} />
              ))}
            </YStack>
          ) : (
            Option.isSome(error) && (
              <YStack gap="$4" alignContent="center" alignItems="center">
                <Text fontSize={20} textAlign="center">
                  {t('common.unknownError')}
                </Text>
                <Button
                  variant="secondary"
                  onPress={() => {
                    void loadBlogs()
                  }}
                  text={t('common.tryAgain')}
                ></Button>
              </YStack>
            )
          )}
        </Stack>
      </ScrollView>
    </Screen>
  )
}
