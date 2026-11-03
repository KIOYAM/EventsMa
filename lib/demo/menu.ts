import type { MenuBoard } from '@/lib/domain/menu'

/**
 * Demo board. Labelled demo data only — the UI says so, and every write is
 * refused while the workspace runs without a database.
 *
 * Prices are paise, matching the engine.
 */
export const demoMenu: MenuBoard = {
  imageBytes: 612_000,
  sections: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Breakfast',
      windowStart: '07:00',
      windowEnd: '10:30',
      groups: [
        {
          id: '21111111-1111-4111-8111-111111111111',
          name: 'South Indian hot',
          description: 'Served from the live counter, refilled every 15 minutes.',
          items: [
            {
              id: '31111111-1111-4111-8111-111111111111',
              name: 'Idli with coconut chutney',
              description: 'Steamed rice cakes, two chutneys, sambar on the side.',
              pricePaise: 4500,
              unitClass: 'PER_GUEST',
              dietary: 'veg',
              imagePath: null,
              imageBytes: 92_000,
            },
            {
              id: '31111111-1111-4111-8111-111111111112',
              name: 'Mini ghee dosa',
              description: 'Made to order on the dosa station.',
              pricePaise: 6000,
              unitClass: 'PER_GUEST',
              dietary: 'veg',
              imagePath: null,
              imageBytes: 104_000,
            },
            {
              id: '31111111-1111-4111-8111-111111111113',
              name: 'Ven pongal',
              description: 'Rice and moong dal with pepper, cashew and ghee.',
              pricePaise: 5000,
              unitClass: 'PER_GUEST',
              dietary: 'veg',
              imagePath: null,
              imageBytes: 0,
            },
          ],
        },
        {
          id: '21111111-1111-4111-8111-111111111112',
          name: 'English counter',
          description: 'For corporate mornings and mixed guest groups.',
          items: [
            {
              id: '31111111-1111-4111-8111-111111111114',
              name: 'Masala scrambled eggs',
              description: 'Eggs, onion, tomato, coriander; served with toast.',
              pricePaise: 7500,
              unitClass: 'PER_GUEST',
              dietary: 'egg',
              imagePath: null,
              imageBytes: 0,
            },
            {
              id: '31111111-1111-4111-8111-111111111115',
              name: 'Filter coffee',
              description: 'Chicory blend, decoction brewed the previous evening.',
              pricePaise: 3000,
              unitClass: 'PER_GUEST',
              dietary: 'veg',
              imagePath: null,
              imageBytes: 88_000,
            },
          ],
        },
      ],
    },
    {
      id: '11111111-1111-4111-8111-111111111112',
      name: 'Lunch',
      windowStart: '12:30',
      windowEnd: '15:00',
      groups: [
        {
          id: '21111111-1111-4111-8111-111111111113',
          name: 'Banana leaf service',
          description: 'Traditional full meal, served in three rounds.',
          items: [
            {
              id: '31111111-1111-4111-8111-111111111116',
              name: 'Traditional wedding meal',
              description: 'Rice, sambar, rasam, three poriyals, appalam, payasam.',
              pricePaise: 45_000,
              unitClass: 'PER_GUEST',
              dietary: 'veg',
              imagePath: null,
              imageBytes: 210_000,
            },
            {
              id: '31111111-1111-4111-8111-111111111117',
              name: 'Andhra chicken biryani',
              description: 'Seeraga samba rice, cooked on site in a sealed handi.',
              pricePaise: 62_000,
              unitClass: 'PER_GUEST',
              dietary: 'non_veg',
              imagePath: null,
              imageBytes: 118_000,
            },
          ],
        },
      ],
    },
    {
      id: '11111111-1111-4111-8111-111111111113',
      name: 'Dinner',
      windowStart: '19:30',
      windowEnd: '22:30',
      groups: [
        {
          id: '21111111-1111-4111-8111-111111111114',
          name: 'North Indian mains',
          description: 'Buffet chafing dishes, two live tandoors.',
          items: [
            {
              id: '31111111-1111-4111-8111-111111111118',
              name: 'Paneer butter masala',
              description: 'Tomato-cashew gravy, finished with cream.',
              pricePaise: 52_000,
              unitClass: 'PER_GUEST',
              dietary: 'veg',
              imagePath: null,
              imageBytes: 0,
            },
            {
              id: '31111111-1111-4111-8111-111111111119',
              name: 'Mutton rogan josh',
              description: 'Slow-cooked shoulder, Kashmiri chilli.',
              pricePaise: 78_000,
              unitClass: 'PER_GUEST',
              dietary: 'non_veg',
              imagePath: null,
              imageBytes: 0,
            },
          ],
        },
      ],
    },
    {
      id: '11111111-1111-4111-8111-111111111114',
      name: 'Live counters',
      windowStart: '18:00',
      windowEnd: '23:00',
      groups: [
        {
          id: '21111111-1111-4111-8111-111111111115',
          name: 'Chaat & street',
          description: 'Priced per counter for four hours, minimum 100 guests.',
          items: [
            {
              id: '31111111-1111-4111-8111-111111111120',
              name: 'Pani puri counter',
              description: 'Two waters, three fillings, one attendant.',
              pricePaise: 1_200_000,
              unitClass: 'PER_UNIT',
              dietary: 'veg',
              imagePath: null,
              imageBytes: 0,
            },
            {
              id: '31111111-1111-4111-8111-111111111121',
              name: 'Live pasta station',
              description: 'Two pasta shapes, three sauces, chef-attended.',
              pricePaise: 1_450_000,
              unitClass: 'PER_UNIT',
              dietary: 'veg',
              imagePath: null,
              imageBytes: 0,
            },
          ],
        },
      ],
    },
  ],
}
