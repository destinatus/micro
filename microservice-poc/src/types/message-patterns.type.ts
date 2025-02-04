/* eslint-disable prettier/prettier */
export enum UserMessagePattern {
  CREATE = 'user.create',
  UPDATE = 'user.update',
  GET_ONE = 'user.get',
  GET_ALL = 'user.get_all',
  DELETE = 'user.delete',
  GET_UNSYNCED = 'user.get_unsynced',
  MARK_SYNCED = 'user.mark_synced',
}

export interface CreateUserRequest {
  username: string;
  email: string;
}

export interface UpdateUserRequest {
  id: number;
  username?: string;
  email?: string;
}

export interface GetUserRequest {
  id: number;
}

export interface DeleteUserRequest {
  id: number;
}

export interface MarkSyncedRequest {
  id: number;
}
