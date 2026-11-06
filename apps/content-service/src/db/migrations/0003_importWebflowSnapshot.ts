import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'
import webflowSnapshot from '../../cmsImport/webflowSnapshot.json'

// Plain SQL over the encoded snapshot so later changes to the app's mappers
// or schemas can't break this migration. Idempotent: existing ids are kept.
export default Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)
  const snapshot = JSON.stringify(webflowSnapshot)

  yield* _(sql`
    INSERT INTO
      blog_posts (
        id,
        slug,
        status,
        featured,
        image_url,
        published_at,
        created_at,
        title_en,
        summary_en,
        body_en,
        title_cs,
        summary_cs,
        body_cs
      )
    SELECT
      p ->> 'id',
      p ->> 'slug',
      p ->> 'status',
      (p ->> 'featured')::boolean,
      p ->> 'imageUrl',
      (p ->> 'publishedAt')::timestamptz,
      (p ->> 'createdAt')::timestamptz,
      p -> 'en' ->> 'title',
      p -> 'en' ->> 'summary',
      p -> 'en' ->> 'body',
      p -> 'cs' ->> 'title',
      p -> 'cs' ->> 'summary',
      p -> 'cs' ->> 'body'
    FROM
      jsonb_array_elements(
        ${snapshot}::jsonb -> 'blogPosts'
      ) AS p
    ON CONFLICT (id) DO NOTHING
  `)

  yield* _(sql`
    INSERT INTO
      events (
        id,
        status,
        name,
        venue,
        link,
        start_date,
        end_date,
        golden_glasses,
        speakers
      )
    SELECT
      e ->> 'id',
      e ->> 'status',
      e ->> 'name',
      e ->> 'venue',
      e ->> 'link',
      (e ->> 'startDate')::timestamptz,
      (e ->> 'endDate')::timestamptz,
      (e ->> 'goldenGlasses')::boolean,
      e -> 'speakers'
    FROM
      jsonb_array_elements(
        ${snapshot}::jsonb -> 'events'
      ) AS e
    ON CONFLICT (id) DO NOTHING
  `)
})
