import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    CREATE EXTENSION IF NOT EXISTS postgis;

    -- Boundary polygons for reverse geocoding by containment: administrative
    -- relations (admin_level 6-11), Czech cadastral areas and place=* polygons.
    -- Their city/sub-city role is resolved at query time from country_code +
    -- admin_level + place_tag (see common.ts#boundaryRole).
    CREATE TABLE IF NOT EXISTS place_boundaries (
      id bigint CONSTRAINT "PK_place_boundaries" PRIMARY KEY,
      name varchar NOT NULL,
      names jsonb NOT NULL DEFAULT '{}'::jsonb,
      country_code varchar,
      boundary_type varchar NOT NULL,
      admin_level smallint,
      place_tag varchar,
      area_meters double precision NOT NULL
    );

    -- Simplified (~10 m) and subdivided (<= 256 vertices) polygon parts, so
    -- containment checks stay cheap on huge boundaries.
    CREATE TABLE IF NOT EXISTS place_boundary_geometries (
      boundary_id bigint NOT NULL REFERENCES place_boundaries (id) ON DELETE CASCADE,
      part_index integer NOT NULL,
      geometry geometry (Polygon, 4326) NOT NULL,
      CONSTRAINT "PK_place_boundary_geometries" PRIMARY KEY (boundary_id, part_index)
    );

    CREATE INDEX IF NOT EXISTS "place_boundary_geometries_geometry_IX" ON place_boundary_geometries USING gist (geometry);
  `
)
