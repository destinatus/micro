-- Create sequence for user ID
CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

-- Create user table
CREATE TABLE users (
    id NUMBER DEFAULT user_id_seq.NEXTVAL PRIMARY KEY,
    username VARCHAR2(255) NOT NULL UNIQUE,
    email VARCHAR2(255) NOT NULL UNIQUE,
    needs_sync NUMBER(1) DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    last_synced_at TIMESTAMP,
    version NUMBER DEFAULT 1 NOT NULL,
    last_modified_by VARCHAR2(255) NOT NULL
);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE TRIGGER users_update_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
BEGIN
    :NEW.updated_at := SYSTIMESTAMP;
END;
/

-- Add comments
COMMENT ON TABLE users IS 'Stores user information with sync status tracking';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.username IS 'Unique username for the user';
COMMENT ON COLUMN users.email IS 'Unique email address for the user';
COMMENT ON COLUMN users.needs_sync IS 'Flag indicating if the record needs synchronization (1=true, 0=false)';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN users.last_synced_at IS 'Timestamp when the record was last synchronized';
COMMENT ON COLUMN users.version IS 'Version number for optimistic locking';
COMMENT ON COLUMN users.last_modified_by IS 'Identifier of the user or system that last modified the record';

-- Create indexes
CREATE INDEX idx_users_needs_sync ON users(needs_sync);
CREATE INDEX idx_users_last_synced_at ON users(last_synced_at);
