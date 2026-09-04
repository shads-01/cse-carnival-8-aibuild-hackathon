export const API_ROUTES = {
  HEALTH: '/health',
  AUTH: {
    ROOT: '/auth',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout'
  },
  USERS: {
    ROOT: '/users',
    BY_ID: (id: string) => `/users/${id}`
  }
} as const;
