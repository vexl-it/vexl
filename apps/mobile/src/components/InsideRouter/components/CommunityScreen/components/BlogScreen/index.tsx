import {FlashList} from '@shopify/flash-list'
import {type BlogArticlePreview} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  BlogCard,
  Button,
  Image,
  Loader,
  Stack,
  tokens,
  Typography,
  YStack,
} from '@vexl-next/ui'
import dayjs from 'dayjs'
import {Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo} from 'react'
import {Linking} from 'react-native'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {blogsStateAtom, loadBlogsActionAtom} from './state'

const BlogImage = React.memo(function BlogImage({
  mainImage,
}: {
  readonly mainImage: BlogArticlePreview['mainImage']
}): React.JSX.Element {
  return Option.match(mainImage, {
    onNone: () => (
      <Stack width="100%" height={162} backgroundColor="$backgroundTertiary" />
    ),
    onSome: (uri) => (
      <Image source={{uri}} width="100%" height={162} objectFit="cover" />
    ),
  })
})

const BlogItem = React.memo(function BlogItem({
  item,
}: {
  readonly item: BlogArticlePreview
}): React.JSX.Element {
  const description = useMemo(
    () => Option.getOrElse(item.teaserText, () => ''),
    [item.teaserText]
  )
  const date = useMemo(
    () => dayjs(item.publishedOn).format('LL'),
    [item.publishedOn]
  )
  const handlePress = useCallback(() => {
    void Linking.openURL(item.link)
  }, [item.link])

  return (
    <BlogCard
      image={<BlogImage mainImage={item.mainImage} />}
      title={item.title}
      description={description}
      date={date}
      onPress={handlePress}
    />
  )
})

function Separator(): React.JSX.Element {
  return <Stack height="$5" />
}

function keyExtractor(item: BlogArticlePreview): string {
  return item.id
}

function BlogScreen(): React.JSX.Element {
  const loadBlogs = useSetAtom(loadBlogsActionAtom)
  const {data, error, loading} = useAtomValue(blogsStateAtom)
  const {t} = useTranslation()

  useEffect(() => {
    void loadBlogs()
  }, [loadBlogs])

  const renderItem = useCallback(
    ({item}: {readonly item: BlogArticlePreview}) => <BlogItem item={item} />,
    []
  )

  const articles = Option.match(data, {
    onNone: () => [],
    onSome: ({articles}) => articles,
  })

  if (Option.isNone(data)) {
    return (
      <YStack flex={1} paddingHorizontal="$5" paddingTop="$6" gap="$5">
        {!!loading && (
          <Stack paddingVertical="$5">
            <Loader size="large" />
          </Stack>
        )}

        {Option.isSome(error) && (
          <YStack gap="$4" alignItems="flex-start">
            <Typography variant="paragraphSmall" color="$foregroundPrimary">
              {t('common.somethingWentWrong')}
            </Typography>
            <Button
              size="small"
              variant="primary"
              onPress={() => {
                void loadBlogs()
              }}
            >
              {t('common.tryAgain')}
            </Button>
          </YStack>
        )}
      </YStack>
    )
  }

  return (
    <FlashList
      data={articles}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={Separator}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: 24,
        paddingHorizontal: tokens.space[5].val,
        paddingTop: tokens.space[6].val,
      }}
    />
  )
}

export default BlogScreen
