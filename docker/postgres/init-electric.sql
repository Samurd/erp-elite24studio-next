-- ElectricSQL PostgreSQL Initialization Script
-- This script sets up the necessary permissions for Electric to work with PostgreSQL
-- Mode: Superuser (Development) - Electric manages everything automatically

-- For development, we're using the default postgres superuser
-- This is the simplest setup and Electric will automatically:
-- 1. Create publications
-- 2. Configure REPLICA IDENTITY FULL
-- 3. Manage everything for you

-- The postgres superuser already has all necessary permissions:
-- ✅ REPLICATION privilege
-- ✅ CREATE privilege on database
-- ✅ SELECT on all tables
-- ✅ Table ownership capabilities

-- No additional setup needed for development!
-- Electric will connect using the postgres superuser and handle everything.

-- For production, you should consider creating a dedicated electric_user
-- See the documentation at: https://electric-sql.com/docs/guides/permissions

-- Uncomment below for production setup with dedicated user:
/*
-- Create the Electric user with REPLICATION
CREATE ROLE electric_user WITH LOGIN PASSWORD 'secure_password' REPLICATION;

-- Grant database-level privileges
GRANT CONNECT ON DATABASE appweb TO electric_user;
GRANT USAGE ON SCHEMA public TO electric_user;
GRANT CREATE ON DATABASE appweb TO electric_user;

-- Grant SELECT on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO electric_user;

-- Grant SELECT on future tables automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO electric_user;

-- Transfer table ownership to Electric (required for Electric-managed publications)
-- For specific tables:
-- ALTER TABLE public.your_table OWNER TO electric_user;

-- Or for all tables in the schema:
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO electric_user';
  END LOOP;
END$$;
*/
