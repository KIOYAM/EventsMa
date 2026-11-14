/**
 * Catering: the session planner, category rules, dish recipes and the event
 * catering sheet owned by the workspace.
 *
 * Session names, category names, dish names and dietary labels are tenant
 * content, so they are rendered as stored. Everything around them — headings,
 * limits, table columns, empty states — is interface copy.
 */
export const catering = {
  title: 'Catering',
  eyebrow: 'Catering engine',
  heading: 'Your sessions, your categories, your rules',
  intro:
    'Nothing on this page is a fixed list. Breakfast, lunch and dinner are starter rows you can rename, reorder or switch off; the selection limits are yours to set.',
  recipesLink: 'Dishes, categories and recipes',
  errorFallback: 'That change was not saved.',
  savedFallback: 'Saved.',

  stats: {
    sessions: 'Sessions',
    categories: 'Categories',
    rules: 'Selection rules',
    diets: 'Dietary labels',
  },

  enable: {
    title: 'Turn on catering',
    body: 'This workspace does not offer catering yet. Turning it on unlocks the menu sections in the sidebar and seeds four sessions, seven categories and the dietary labels for you to edit — not a fixed list you are stuck with.',
    action: 'Turn on catering',
    locked: 'An owner or manager can turn this on. Demo mode cannot write configuration.',
  },

  seed: {
    title: 'Start from the starter set',
    body: 'Catering is on but there is no configuration yet. Add four sessions, seven categories and the default selection limits, then rename anything that does not fit.',
    action: 'Add starter configuration',
  },

  sessions: {
    title: 'Meal sessions',
    intro:
      'Each session is booked and priced separately, with its own guest count. Rename them, reorder them, or switch off the ones this business does not serve.',
    emptyTitle: 'No sessions yet',
    emptyBody: 'Add the first one below.',
    off: 'Off',
    timeRange: '{start}–{end}',
    noTime: 'No time set',
    noGuestLimits: 'No guest limits',
    guestsFrom: '{min}+ guests',
    guestsUpTo: 'Up to {max} guests',
    guestsRange: '{min}–{max} guests',
    cutoff: 'count frozen {hours}h before',
    moveUp: 'Move {name} up',
    moveDown: 'Move {name} down',
    switchOff: 'Switch off',
    switchOn: 'Switch on',
    name: 'Session name',
    namePlaceholder: 'Reception dinner',
    starts: 'Starts',
    startsPlaceholder: '19:00',
    ends: 'Ends',
    endsPlaceholder: '22:00',
    minGuests: 'Min guests',
    minGuestsPlaceholder: '50',
    maxGuests: 'Max guests',
    maxGuestsPlaceholder: '600',
    add: 'Add session',
  },

  rules: {
    title: 'Selection rules',
    intro:
      'How many dishes a guest may pick from each category, in each session. An empty maximum means unlimited.',
    emptyTitle: 'Add a session first',
    emptyBody: 'Rules belong to a session.',
    countOne: '{count} rule in this session',
    countMany: '{count} rules in this session',
    category: 'Category',
    rule: 'Rule',
    minimum: 'Minimum {category}',
    maximum: 'Maximum {category}',
    pricing: 'Pricing for {category}',
    required: 'Required',
    save: 'Save',
    savedLine: '{pricing} · rule saved',
    noRule: 'No rule yet',
    summaryAny: 'Any number',
    summaryAtLeast: 'At least {min}',
    summaryExactly: 'Exactly {count}',
    summaryRange: '{min}–{max}',
  },

  pricingMode: {
    perGuest: 'per guest',
    perUnit: 'per unit',
    flat: 'flat',
  },

  pricingOption: {
    perGuest: 'Per guest',
    perUnit: 'Per unit',
    flat: 'Fixed',
  },

  categories: {
    title: 'Food categories',
    intro: 'The headings a guest chooses from. Two businesses can have entirely different lists.',
    empty: 'No categories yet.',
    off: '(off)',
    hide: 'hide',
    show: 'show',
    name: 'Category name',
    namePlaceholder: 'Live counters',
    description: 'Description (optional)',
    descriptionPlaceholder: 'Made to order at the venue',
    add: 'Add category',
  },

  diets: {
    title: 'Dietary and allergen labels',
    intro:
      'Preferences your guest counts are recorded against. Allergens are kept separate from preferences because one is a safety fact.',
    empty: 'No labels yet.',
    newLabel: 'New label',
    newLabelPlaceholder: 'No dairy',
    allergen: 'This is an allergen',
    add: 'Add label',
  },

  nextStep:
    "Next step for this engine: an event can be given several of these sessions, each with its own guest count, and dishes are chosen inside the limits above. Recipes entered against a dish will then produce the kitchen's ingredient demand.",

  /** The per-event catering plan. */
  event: {
    title: 'Event catering',
    back: 'Back to the event',
    eyebrow: 'Catering plan',
    intro:
      'Each session carries its own guest count and its own menu. A wedding can serve 500 at lunch and 300 at dinner without the bill counting 500 twice.',
    stats: {
      sessions: 'Sessions',
      guests: 'Guests across sessions',
      subtotal: 'Menu subtotal',
      lines: 'Production lines',
    },
    addTitle: 'Add a session',
    addIntro: 'Copy one of your configured sessions, or add a one-off with no template rules.',
    noTemplates: 'No sessions configured yet. Add them on the {link}, or type a name below.',
    cateringPageLink: 'Catering page',
    recipesPageLink: 'recipes page',
    fromTemplate: 'From a session',
    noneOption: '— none —',
    orName: 'Or a name',
    namePlaceholder: 'Reception dinner',
    date: 'Date',
    guests: 'Guests',
    add: 'Add session',
    emptyTitle: 'No catering sessions yet',
    emptyBody: 'Add breakfast, lunch or dinner above; each one is priced on its own guest count.',
    productionTitle: 'Kitchen production sheet',
    productionIntro:
      'Recipes multiplied by each session’s own guest count, with wastage shown separately.',
    lines: '{count} lines',
    productionEmpty:
      'No recipes yet. Enter ingredient quantities against a dish on the {link} and this sheet fills itself.',
    ingredient: 'Ingredient',
    required: 'Required',
    wastage: 'Wastage',
    buy: 'Buy',
  },

  /** One session inside the event plan. */
  session: {
    noTemplateRules: 'No template rules',
    meta: '{date} · {start}–{end} · {guests} guests · {amount} before tax',
    noDate: 'No date',
    remove: 'Remove {name}',
    guests: 'Guests',
    date: 'Date',
    starts: 'Starts',
    ends: 'Ends',
    status: 'Status',
    save: 'Save',
    noDishes: 'No dishes chosen yet.',
    itemMeta: '{price} · {unit}',
    quantity: 'Quantity for {name}',
    set: 'Set',
    noCategories: 'No categories are configured yet. Add them on the Catering page.',
    categoryMeta: '{rule} · {count} chosen · {pricing}',
    noDishesInCategory: 'No dishes assigned to this category yet.',
    removeDish: 'remove',
    addDish: 'add',
  },

  /** Recipes and dish-to-category assignment. */
  recipes: {
    title: 'Recipes',
    back: 'Back to catering',
    eyebrow: 'Recipes',
    heading: 'What one portion consumes',
    intro:
      'A recipe row turns a dish into an ingredient demand: quantity per serving, the unit, and the trim loss you allow. The event sheet multiplies it by each session’s own guest count.',
    saved: 'Saved.',
    emptyTitle: 'No dishes yet',
    emptyBody: 'Add dishes on the Menu page first; recipes hang off them.',
    pickDish: 'Pick a dish',
    dishCount: '{count} dishes in the catalogue. Use the menu below to switch.',
    priceLine: '{price} · {unit}',
    ingredientsCount: '{count} ingredients',
    noRows: 'No recipe rows yet.',
    ingredient: 'Ingredient',
    perServing: 'Per serving',
    wastage: 'Wastage',
    removeIngredient: 'Remove {name}',
    ingredientPlaceholder: 'Sona masoori rice',
    perServingPlaceholder: '180',
    unit: 'Unit',
    wastagePct: 'Wastage %',
    addIngredient: 'Add ingredient',
    categories: 'Categories',
    categoriesIntro:
      'A dish can sit in more than one category. Only assigned dishes appear when choosing a menu for an event.',
    addToCategory: 'add',
    removeFromCategory: 'remove',
  },

  unit: {
    g: 'grams',
    ml: 'millilitres',
    piece: 'pieces',
  },

  /**
   * Lower-case display form of a stored unit class, exactly as the screens
   * printed it before translation (`PER_UNIT` → `per unit`). The key is the enum.
   */
  unitClass: {
    PER_GUEST: 'per guest',
    PER_UNIT: 'per unit',
    FLAT: 'flat',
    PER_HOUR: 'per hour',
    PER_DAY: 'per day / shift',
  },

  errors: {
    name: 'A name is required.',
    duplicate: 'That name is already used in this business.',
    time: 'Times must be written as 07:00 or 19:30.',
    guests: 'The maximum guest count cannot be below the minimum.',
    rule: 'A rule needs a minimum of 0 or more, and a maximum that is not below the minimum.',
    permission: 'Only an owner or manager can change catering configuration.',
    demo: 'Demo mode: connect a database before changing configuration.',
    recipe: 'A recipe row needs a name and a quantity above zero.',
    assign: 'Choose a dish and a category.',
    recipePermission: 'Only an owner or manager can edit recipes.',
    recipeDemo: 'Demo mode: connect a database first.',
    eventRule: 'That dish would break the selection rule for its category. Remove one first.',
    session: 'That session no longer exists.',
    template: 'That session template no longer exists.',
    item: 'That dish no longer exists.',
    sessionName: 'Choose a session or type a name.',
    status: 'That status is not allowed.',
    diet: 'Choose a dietary label.',
    event: 'That event no longer exists.',
    eventPermission: 'Only an owner or manager can plan catering.',
    eventDemo: 'Demo mode: connect a database before planning catering.',
  },

  saved: {
    adopted: 'Catering is on. The starter sessions, categories and rules are ready to edit.',
    seeded: 'Starter configuration added.',
    session: 'Session saved.',
    category: 'Category saved.',
    rule: 'Selection rule saved.',
    diet: 'Dietary label saved.',
    item: 'Menu updated.',
    quantity: 'Quantity saved.',
    dietCount: 'Dietary counts saved.',
    removed: 'Session removed.',
  },
} as const
