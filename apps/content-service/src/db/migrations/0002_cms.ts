import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    CREATE TABLE blog_posts (
      id varchar PRIMARY KEY,
      slug varchar NOT NULL UNIQUE,
      status varchar NOT NULL CHECK (status IN ('draft', 'published')),
      featured boolean NOT NULL,
      image_url varchar,
      published_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      title_en varchar NOT NULL,
      summary_en varchar,
      body_en text NOT NULL,
      title_cs varchar,
      summary_cs varchar,
      body_cs text,
      CHECK ((title_cs IS NULL) = (body_cs IS NULL)),
      CHECK (
        title_cs IS NOT NULL
        OR summary_cs IS NULL
      )
    );

    CREATE TABLE events (
      id varchar PRIMARY KEY,
      status varchar NOT NULL CHECK (status IN ('draft', 'published')),
      name varchar NOT NULL,
      venue varchar NOT NULL,
      link varchar NOT NULL,
      start_date timestamptz NOT NULL,
      end_date timestamptz,
      golden_glasses boolean NOT NULL,
      speakers jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `
)
