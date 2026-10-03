/** Presentation accounts from specification §7 (fictional demo users). */
export const DEMO_PASSWORD = 'SasiedzkiDemo2026!'

export const demoAccounts = [
  {
    key: 'autor' as const,
    email: 'autor@example.com',
    displayName: 'Autor demo',
    label: 'Zaloguj jako autor',
  },
  {
    key: 'sasiad' as const,
    email: 'sasiad@example.com',
    displayName: 'Sąsiad demo',
    label: 'Zaloguj jako sąsiad',
  },
]

export type DemoAccountKey = (typeof demoAccounts)[number]['key']
