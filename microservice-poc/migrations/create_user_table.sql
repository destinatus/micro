-- Create user table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    needs_sync BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_synced_at TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL,
    last_modified_by VARCHAR(255) NOT NULL
);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create notification function and trigger for sync
CREATE OR REPLACE FUNCTION notify_user_change()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify(
        'user_changes',
        json_build_object(
            'operation', TG_OP,
            'record', row_to_json(NEW),
            'old_record', row_to_json(OLD),
            'instance_id', NEW.last_modified_by
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_changes_trigger ON users;

CREATE TRIGGER user_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION notify_user_change();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_needs_sync ON users(needs_sync);
CREATE INDEX IF NOT EXISTS idx_users_last_synced_at ON users(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_users_version ON users(version);

-- Add comments
COMMENT ON TABLE users IS 'Stores user information with sync status tracking';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.username IS 'Unique username for the user';
COMMENT ON COLUMN users.email IS 'Unique email address for the user';
COMMENT ON COLUMN users.needs_sync IS 'Flag indicating if the record needs synchronization';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN users.last_synced_at IS 'Timestamp when the record was last synchronized';
COMMENT ON COLUMN users.version IS 'Version number for optimistic locking';
COMMENT ON COLUMN users.last_modified_by IS 'Identifier of the user or system that last modified the record';
