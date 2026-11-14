/** Sidebar and page-title labels. One key per destination, not per screen. */
export const nav = {
  home: 'Home',
  dashboard: 'Dashboard',
  clients: 'Clients',
  events: 'Events',
  submissions: 'Submissions',
  quotes: 'Quotes',
  invoices: 'Invoices',
  catering: 'Catering',
  decoration: 'Decoration',
  makeup: 'Makeup',
  photography: 'Photography',
  inventory: 'Inventory',
  finance: 'Money',
  reports: 'Reports',
  team: 'Team',
  services: 'Services',
  portfolio: 'Portfolio',
  storefront: 'Storefront',
  settings: 'Settings',

  // Destinations resolved from a vertical descriptor rather than the fixed list.
  recipes: 'Recipes & ingredients',
  specialist: 'Specialist services',
  myWork: 'My work',

  // Sidebar section headings.
  groupSell: 'Sell',
  groupCatalogue: 'Catalogue',
  groupBusiness: 'Business',

  /** Language switch label: the word for "language", not the language name. */
  language: 'Language',
  /** Fifth mobile tab: opens every module the desktop rail shows. */
  more: 'More',
  closeMenu: 'Close menu',

  /** The signed-in shell: rail, mobile header and business card. */
  shell: {
    workspace: 'Workspace',
    business: 'Business',
    demoData: 'Demo data',
    liveWorkspace: 'Live workspace',
    signOut: 'Sign out',
    primary: 'Primary',
  },
} as const
