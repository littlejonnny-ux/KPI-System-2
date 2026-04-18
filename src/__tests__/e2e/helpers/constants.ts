export const TEST_URLS = {
  login: '/login',
  dashboard: '/',
  kpiCards: '/kpi-cards',
} as const;

export const TEST_CREDENTIALS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL ?? 'admin@kpi.local',
    password: process.env.TEST_ADMIN_PASSWORD ?? '',
  },
  approver: {
    email: process.env.TEST_APPROVER_EMAIL ?? '',
    password: process.env.TEST_APPROVER_PASSWORD ?? '',
  },
  participant: {
    email: process.env.TEST_PARTICIPANT_EMAIL ?? '',
    password: process.env.TEST_PARTICIPANT_PASSWORD ?? '',
  },
} as const;
