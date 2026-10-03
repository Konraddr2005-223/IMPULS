export const DEMO_PASSWORD = 'SasiedzkiDemo2026!'

export const demoAccounts = [
  {
    key: 'autor' as const,
    email: 'autor@example.com',
    displayName: 'Jan Kowalski (Autor)',
    label: 'Zaloguj jako autor',
  },
  {
    key: 'sasiad' as const,
    email: 'sasiad@example.com',
    displayName: 'Piotr Nowak (Sąsiad)',
    label: 'Zaloguj jako sąsiad',
  },
  {
    key: 'anna' as const,
    email: 'anna.wisniewska@example.com',
    displayName: 'Anna Wiśniewska',
    label: 'Anna Wiśniewska',
  },
  {
    key: 'tomasz' as const,
    email: 'tomasz.wojcik@example.com',
    displayName: 'Tomasz Wójcik',
    label: 'Tomasz Wójcik',
  },
  {
    key: 'katarzyna' as const,
    email: 'katarzyna.kaminska@example.com',
    displayName: 'Katarzyna Kamińska',
    label: 'Katarzyna Kamińska',
  },
  {
    key: 'michal' as const,
    email: 'michal.lewandowski@example.com',
    displayName: 'Michał Lewandowski',
    label: 'Michał Lewandowski',
  },
  {
    key: 'magdalena' as const,
    email: 'magdalena.zielinska@example.com',
    displayName: 'Magdalena Zielińska',
    label: 'Magdalena Zielińska',
  },
  {
    key: 'pawel' as const,
    email: 'pawel.szymanski@example.com',
    displayName: 'Paweł Szymański',
    label: 'Paweł Szymański',
  },
  {
    key: 'agnieszka' as const,
    email: 'agnieszka.wozniak@example.com',
    displayName: 'Agnieszka Woźniak',
    label: 'Agnieszka Woźniak',
  },
  {
    key: 'jakub' as const,
    email: 'jakub.dabrowski@example.com',
    displayName: 'Jakub Dąbrowski',
    label: 'Jakub Dąbrowski',
  },
]

export type DemoAccountKey = (typeof demoAccounts)[number]['key']

