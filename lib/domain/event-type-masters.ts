/**
 * The starter master list of occasions an Indian caterer is actually asked for.
 *
 * These are rows the owner can rename, hide or delete — never an enum. The list
 * exists so a new business does not start from a blank "Occasion" box, and so
 * that a dish catalogue can be attached to an occasion ("what we serve at a
 * seemantham") instead of to nothing.
 *
 * Sourced from how Indian caterers and wedding planners describe their work:
 * the wedding functions (roka → reception), the samskaras that carry a feast
 * (naming, first rice, first haircut, sacred thread, housewarming, 60th/80th),
 * the devotional gatherings, the corporate formats, and the festival days that
 * have a fixed menu in most households.
 */

export const EVENT_TYPE_GROUPS = [
  'Wedding',
  'Traditional',
  'Corporate',
  'Social',
  'Festival',
] as const

export type EventTypeGroup = (typeof EVENT_TYPE_GROUPS)[number]

export interface EventTypeMaster {
  name: string
  groupName: EventTypeGroup
  /** What the owner is likely to serve or plan for this occasion. */
  description?: string
}

export const EVENT_TYPE_MASTERS: readonly EventTypeMaster[] = [
  // ---- Wedding ----
  { name: 'Roka', groupName: 'Wedding', description: 'Families meet and fix the match; tea, snacks and a light meal.' },
  { name: 'Engagement', groupName: 'Wedding', description: 'Ring exchange, usually lunch or dinner for close family.' },
  { name: 'Nischayathartham', groupName: 'Wedding', description: 'South Indian formal engagement with a seated meal.' },
  { name: 'Mehendi', groupName: 'Wedding', description: 'Afternoon henna function; chaat, coolers, live counters.' },
  { name: 'Haldi', groupName: 'Wedding', description: 'Morning turmeric ritual; light breakfast and snacks.' },
  { name: 'Sangeet', groupName: 'Wedding', description: 'Evening music and dance; dinner with live counters.' },
  { name: 'Baraat', groupName: 'Wedding', description: "Groom's procession; move-around snacks and drinks." },
  { name: 'Wedding ceremony', groupName: 'Wedding', description: 'Muhurtham or pheras followed by a full meal.' },
  { name: 'Reception', groupName: 'Wedding', description: 'The largest guest count of the week; buffet or seated dinner.' },
  { name: 'Cocktail dinner', groupName: 'Wedding', description: 'Pre-reception evening; canapes, bar snacks, dessert.' },
  { name: 'Bidaai meal', groupName: 'Wedding', description: 'Farewell meal hosted by the bride’s family.' },
  { name: 'Destination wedding', groupName: 'Wedding', description: 'Multi-day, multi-venue; needs per-session guest counts.' },

  // ---- Traditional ----
  { name: 'Naming ceremony', groupName: 'Traditional', description: 'Namakaranam, around the 11th day; family lunch.' },
  { name: 'First rice ceremony', groupName: 'Traditional', description: 'Annaprasanam, around the sixth month; kheer and a full meal.' },
  { name: 'First haircut', groupName: 'Traditional', description: 'Mundan or choulam; temple or home, simple vegetarian meal.' },
  { name: 'Ear piercing', groupName: 'Traditional', description: 'Karnavedha; small family gathering.' },
  { name: 'Sacred thread ceremony', groupName: 'Traditional', description: 'Upanayanam; strictly vegetarian, often temple-based.' },
  { name: 'Puberty ceremony', groupName: 'Traditional', description: 'Coming-of-age function; sweets and a family meal.' },
  { name: 'Baby shower', groupName: 'Traditional', description: 'Seemantham or valaikappu; women-led, sweets and lunch.' },
  { name: 'Housewarming', groupName: 'Traditional', description: 'Grihapravesham with pooja; vegetarian lunch, no onion or garlic on request.' },
  { name: 'House pooja', groupName: 'Traditional', description: 'Satyanarayana or general pooja; prasadam and lunch.' },
  { name: '60th birthday', groupName: 'Traditional', description: 'Shashtiapthapoorthi; large family lunch, often banana leaf.' },
  { name: '80th birthday', groupName: 'Traditional', description: 'Sathabhishekam; seated traditional meal.' },
  { name: 'Temple festival', groupName: 'Traditional', description: 'Utsavam with annadanam; fixed vegetarian menu, high volume.' },
  { name: 'Kumbhabhishekam', groupName: 'Traditional', description: 'Temple consecration; multi-day annadanam.' },
  { name: 'Bhajan or satsang', groupName: 'Traditional', description: 'Mata ki chowki, kirtan or bhajan sandhya; prasadam and tea.' },
  { name: 'Iftar', groupName: 'Traditional', description: 'Ramadan evening meal; dates, haleem, biryani.' },
  { name: 'Funeral meal', groupName: 'Traditional', description: 'Post-funeral and tehrvi meals; simple, sober menu.' },
  { name: 'Shraddha', groupName: 'Traditional', description: 'Ancestral rites with a strict vegetarian meal.' },

  // ---- Corporate ----
  { name: 'Conference', groupName: 'Corporate', description: 'Full-day; morning tea, lunch, afternoon tea.' },
  { name: 'Seminar or workshop', groupName: 'Corporate', description: 'Half-day; working lunch and breaks.' },
  { name: 'Product launch', groupName: 'Corporate', description: 'Reception format; canapes, mocktails, dessert.' },
  { name: 'Annual day', groupName: 'Corporate', description: 'Employee and family event; dinner and snacks.' },
  { name: 'Award night', groupName: 'Corporate', description: 'Gala dinner with a plated or buffet service.' },
  { name: 'AGM or board meeting', groupName: 'Corporate', description: 'Executive lunch, minimal service, strict timings.' },
  { name: 'Training or offsite', groupName: 'Corporate', description: 'Multi-day; all meals and constant tea service.' },
  { name: 'Town hall', groupName: 'Corporate', description: 'All-hands meeting; breakfast or high tea.' },
  { name: 'Team lunch', groupName: 'Corporate', description: 'Small headcount, restaurant-style or buffet.' },
  { name: 'Exhibition or trade show', groupName: 'Corporate', description: 'Multi-day stall catering; packed meals and tea.' },
  { name: 'Client dinner', groupName: 'Corporate', description: 'Small, premium, plated.' },
  { name: 'Inauguration', groupName: 'Corporate', description: 'Office or showroom opening, bhoomi pooja and lunch.' },
  { name: 'CSR event', groupName: 'Corporate', description: 'Community or charity function with packed meals.' },
  { name: 'College or school function', groupName: 'Corporate', description: 'Annual day, convocation or sports day; bulk packed meals.' },
  { name: 'Government function', groupName: 'Corporate', description: 'Official ceremony; fixed menu, fixed per-plate rate.' },

  // ---- Social ----
  { name: 'Birthday party', groupName: 'Social', description: 'Cake, snacks and dinner; children’s menu.' },
  { name: 'Anniversary', groupName: 'Social', description: 'Family dinner, often a seated menu.' },
  { name: 'Graduation party', groupName: 'Social', description: 'Buffet dinner with desserts.' },
  { name: 'Farewell', groupName: 'Social', description: 'Office or school farewell; high tea or dinner.' },
  { name: 'Reunion', groupName: 'Social', description: 'Batch or family reunion; long, relaxed meal.' },
  { name: 'Private dinner', groupName: 'Social', description: 'Home party with a plated or chef-attended service.' },

  // ---- Festival ----
  { name: 'Diwali', groupName: 'Festival', description: 'Sweets, savouries and a festive dinner.' },
  { name: 'Pongal or Sankranti', groupName: 'Festival', description: 'Harvest festival; sakkarai pongal and a village-style meal.' },
  { name: 'Onam', groupName: 'Festival', description: 'Onam sadya on a banana leaf, fixed count of dishes.' },
  { name: 'Navratri or Golu', groupName: 'Festival', description: 'Nine nights of sundal, prasadam and evening visits.' },
  { name: 'Christmas', groupName: 'Festival', description: 'Cake, biryani or a roast lunch.' },
  { name: 'Eid', groupName: 'Festival', description: 'Biryani, haleem and sweets for a large family gathering.' },
  { name: 'Ugadi or Vishu', groupName: 'Festival', description: 'New year feast with a fixed traditional menu.' },
] as const

/** Groups in display order, plus any group the owner has invented. */
export function groupEventTypes<T extends { groupName: string }>(
  rows: readonly T[],
): { groupName: string; rows: T[] }[] {
  const byGroup = new Map<string, T[]>()
  for (const row of rows) {
    const list = byGroup.get(row.groupName) ?? []
    list.push(row)
    byGroup.set(row.groupName, list)
  }

  const known = EVENT_TYPE_GROUPS as readonly string[]
  return [...byGroup.entries()]
    .sort(([a], [b]) => {
      const ai = known.indexOf(a)
      const bi = known.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    .map(([groupName, groupRows]) => ({ groupName, rows: groupRows }))
}
