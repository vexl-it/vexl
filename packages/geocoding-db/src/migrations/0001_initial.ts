import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    CREATE EXTENSION IF NOT EXISTS cube;

    CREATE EXTENSION IF NOT EXISTS earthdistance;

    CREATE TABLE IF NOT EXISTS places (
      id bigint CONSTRAINT "PK_places" PRIMARY KEY,
      place_type varchar NOT NULL,
      name varchar NOT NULL,
      names jsonb NOT NULL DEFAULT '{}'::jsonb,
      country_code varchar,
      population bigint,
      importance real NOT NULL,
      latitude double precision NOT NULL,
      longitude double precision NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "places_settlement_earth_IX" ON places USING gist (ll_to_earth (latitude, longitude))
    WHERE
      place_type IN (
        'city',
        'town',
        'municipality',
        'borough',
        'village',
        'suburb',
        'quarter',
        'neighbourhood',
        'hamlet',
        'city_block'
      );

    CREATE INDEX IF NOT EXISTS "places_type_IX" ON places (place_type);

    CREATE INDEX IF NOT EXISTS "places_city_earth_IX" ON places USING gist (ll_to_earth (latitude, longitude))
    WHERE
      place_type IN ('city', 'town');

    CREATE TABLE IF NOT EXISTS place_names (
      place_id bigint NOT NULL REFERENCES places (id) ON DELETE CASCADE,
      norm_name varchar NOT NULL,
      importance real NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "place_names_place_id_IX" ON place_names (place_id);

    CREATE INDEX IF NOT EXISTS "place_names_prefix_IX" ON place_names (norm_name text_pattern_ops) INCLUDE (place_id, importance);

    CREATE INDEX IF NOT EXISTS "place_names_trgm_IX" ON place_names USING gin (norm_name gin_trgm_ops)
    WHERE
      importance >= 0.55;

    CREATE INDEX IF NOT EXISTS "place_names_important_prefix_IX" ON place_names (norm_name text_pattern_ops) INCLUDE (place_id, importance)
    WHERE
      importance >= 0.55;
  `
)
