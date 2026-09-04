export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  MODERATOR: 'MODERATOR'
} as const;

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  READ_USERS: 'read_users',
  MANAGE_SETTINGS: 'manage_settings'
} as const;
