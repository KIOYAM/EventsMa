import type { DeepPartial } from '../en'
import { nav as enNav } from '../en/nav'

/** Sidebar labels in Tamil. SEED — unreviewed. */
export const nav: DeepPartial<typeof enNav> = {
  home: 'முதன்மை',
  dashboard: 'முகப்பு',
  clients: 'வாடிக்கையாளர்கள்',
  events: 'நிகழ்வுகள்',
  submissions: 'விண்ணப்பங்கள்',
  quotes: 'விலைப்புள்ளிகள்',
  invoices: 'விலைப்பட்டியல்கள்',
  catering: 'உணவு சேவை',
  decoration: 'அலங்காரம்',
  makeup: 'அழகு சேவை',
  photography: 'புகைப்படம்',
  inventory: 'சரக்கு',
  finance: 'பணம்',
  reports: 'அறிக்கைகள்',
  team: 'குழு',
  services: 'சேவைகள்',
  portfolio: 'படைப்புகள்',
  storefront: 'கடை',
  settings: 'அமைப்புகள்',

  recipes: 'சமையல் குறிப்புகள் & மூலப்பொருட்கள்',
  specialist: 'சிறப்பு சேவைகள்',
  myWork: 'எனது வேலை',

  groupSell: 'விற்பனை',
  groupCatalogue: 'பட்டியல்',
  groupBusiness: 'வணிகம்',

  language: 'மொழி',
  more: 'மேலும்',
  closeMenu: 'மெனுவை மூடு',

  shell: {
    workspace: 'பணியிடம்',
    business: 'வணிகம்',
    demoData: 'டெமோ தரவு',
    liveWorkspace: 'நேரடி பணியிடம்',
    signOut: 'வெளியேறு',
    primary: 'முதன்மை',
  },
}
