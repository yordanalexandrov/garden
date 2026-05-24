-- Local Docker Compose password bridge.
--
-- The supabase/postgres image owns the internal role, schema, extension, Auth,
-- and Storage bootstrap. The sibling Auth, Storage, and PostgREST containers
-- connect to Postgres over TCP in this local Compose setup, so their login
-- roles need passwords matching POSTGRES_PASSWORD.

\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
