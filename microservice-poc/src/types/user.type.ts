export interface User {
  id: number;
  username: string;
  email: string;
  needs_sync: boolean;
  created_at: Date;
  updated_at: Date;
  last_synced_at: Date | null;
  version: number;
  last_modified_by: string;
}

export type CreateUserResult = User;
export type UpdateUserResult = User;

export interface UserChangePayload {
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record: User;
  old_record: User | null;
  instance_id: string;
}
