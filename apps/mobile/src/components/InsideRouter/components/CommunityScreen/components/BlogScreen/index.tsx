import {FlashList} from '@shopify/flash-list'
import {type BlogArticlePreview} from '@vexl-next/rest-api/src/services/content/contracts'
import {BlogCard, getTokens, LoadErrorState, Stack} from '@vexl-next/ui'
import {Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo} from 'react'
import {Linking} from 'react-native'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {formatDate} from '../../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../../utils/localization/formattingLocaleAtom'
import {blogsStateAtom, loadBlogsActionAtom} from './state'

const BlogItem = React.memo(function BlogItem({
  item,
}: {
  readonly item: BlogArticlePreview
}): React.JSX.Element {
  const description = useMemo(
    () => Option.getOrElse(item.teaserText, () => ''),
    [item.teaserText]
  )
  const locale = useAtomValue(formattingLocaleAtom)
  const date = useMemo(
    () => formatDate(new Date(item.publishedOn), locale, {dateStyle: 'long'}),
    [item.publishedOn, locale]
  )
  const handlePress = useCallback(() => {
    void Linking.openURL(item.link)
  }, [item.link])

  return (
    <BlogCard
      imageUri={Option.getOrUndefined(item.mainImage)}
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
      <LoadErrorState
        paddingHorizontal="$5"
        loading={loading}
        errorMessage={
          Option.isSome(error) ? t('common.somethingWentWrong') : undefined
        }
        retryLabel={t('common.tryAgain')}
        onRetry={() => {
          void loadBlogs()
        }}
      />
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
        paddingBottom: getTokens().space.$7.val,
        paddingHorizontal: getTokens().space.$5.val,
        paddingTop: getTokens().space.$6.val,
      }}
    />
  )
}

export default BlogScreen
