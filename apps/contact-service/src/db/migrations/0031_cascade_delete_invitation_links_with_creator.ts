import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE club_invitation_link
    DROP CONSTRAINT fk_club_invitation_link_user,
    ADD CONSTRAINT fk_club_invitation_link_user FOREIGN KEY (created_by_member_id) REFERENCES club_member (id) ON DELETE CASCADE;
  `
)
