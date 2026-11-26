/**
 * Weddings and family functions in progression.
 *
 * Split from one list only to keep each file readable; combined in
 * `events-content.ts`.
 */
import type { EventSpec } from './types'

export const EVENTS_A: EventSpec[] = [
  {
    title: 'Divya & Naveen — Wedding',
    client: 'Divya Raghavan',
    eventType: 'Wedding',
    date: '2026-12-06',
    start: '06:00',
    end: '21:30',
    venue: 'St. Antony Hall',
    address: 'St. Antony Hall, Gudalur, Nilgiris 643211',
    guests: 420,
    status: 'confirmed',
    notes: 'Muhurtham at 7:40am. Venue opens at 6pm the previous evening for the mandap. Halal line not required.',
    services: ['catering', 'decor', 'photography', 'makeup'],
    catering: [
      {
        name: 'Wedding lunch', guests: 420, style: 'banana_leaf', status: 'confirmed',
        menu: ['Nannari sarbath', 'Gobi 65', 'Paneer 65', 'Vegetable kurma', 'Chettinad chicken curry', 'Sambar', 'Rasam', 'Chicken biryani', 'Ghee rice', 'Semiya payasam', 'Filter coffee'],
        diet: { veg: 260, non_veg: 160 },
      },
    ],
    decor: [
      { area: 'Mandap', type: 'stage', dimensions: '24ft × 16ft', notes: 'Bamboo frame with jasmine and marigold; two brass kuthuvilakku at the steps.', crew: 'Arun Prasad + 5' },
      { area: 'Entrance', type: 'entrance', dimensions: '14ft arch', notes: 'Marigold arch, kolam at the threshold.', crew: 'Arun Prasad + 2' },
    ],
    photography: {
      coverage: 'Full-day wedding coverage', start: '05:30', end: '21:30',
      notes: 'Two cameras and one drone. Same-day edit for the evening reception.',
      crew: ['Nithya Balan', 'Karthik Selvam'],
      deliverables: [
        { type: 'Edited photographs', qty: 1, status: 'pending', date: '2027-01-05' },
        { type: 'Highlight film', qty: 1, status: 'pending', date: '2026-12-27' },
        { type: 'Album, 60 pages', qty: 1, status: 'pending', date: '2027-01-20' },
      ],
    },
    makeup: [
      { client: 'Divya Raghavan', style: 'Traditional Tamil bridal set', start: '03:45', end: '06:30', artist: 'Divya Shankar', travel: true },
      { client: 'Family members', style: 'Family member makeup', start: '05:00', end: '08:00', artist: 'Reshma Thomas', travel: true },
    ],
    trials: [{ client: 'Divya Raghavan', style: 'Traditional Tamil bridal set', date: '2026-11-12', approved: true }],
    tasks: [
      { title: 'Confirm final guest count with the family', due: '2026-12-03', status: 'done' },
      { title: 'Flower order to Mettupalayam market', due: '2026-11-29', status: 'doing' },
      { title: 'Collect venue keys for the Friday setup', due: '2026-12-04', status: 'todo' },
      { title: 'Print banana leaves and serving checklist', due: '2026-12-05', status: 'todo' },
      { title: 'Charge drone batteries and format cards', due: '2026-12-05', status: 'todo' },
    ],
    vendors: [
      { name: 'Highland Tent House', category: 'Chairs and lighting', amount: 1850000, status: 'confirmed' },
      { name: 'Nithya Balan', category: 'Second camera', amount: 750000, status: 'booked' },
    ],
    staff: [
      { member: 'Ramesh Kumar', role: 'Kitchen lead', start: '02:00', end: '16:00' },
      { member: 'Murugan Thangavel', role: 'Service captain', start: '08:00', end: '17:00' },
      { member: 'Arun Prasad', role: 'Decor lead', start: '14:00', end: '06:00' },
    ],
    quote: {
      status: 'accepted',
      acceptedBy: 'divya.raghavan@gmail.com',
      sentDaysAgo: 38,
      discountAmount: 500000,
      lines: [
        { service: 'catering', package: 'Wedding lunch — vegetarian' },
        { service: 'catering', item: 'Chettinad chicken curry' },
        { service: 'catering', item: 'Chicken biryani' },
        { service: 'catering', item: 'Serving team' },
        { service: 'decor', package: 'Classic mandap' },
        { service: 'decor', item: 'Table centrepieces', qty: 24 },
        { service: 'decor', item: 'Chair covers and sashes', qty: 420 },
        { service: 'photography', package: 'Wedding day essentials' },
        { service: 'makeup', package: 'Bridal complete' },
        { service: 'makeup', item: 'Family member makeup', qty: 6 },
      ],
    },
    invoice: {
      issuedDaysAgo: 24, dueInDays: 2,
      notes: 'Advance received; balance due on the morning of the wedding.',
      payments: [
        { pct: 40, mode: 'upi', status: 'captured', receivedDaysAgo: 22, ref: 'UPI/402612345678' },
        { pct: 20, mode: 'bank_transfer', status: 'captured', receivedDaysAgo: 5, ref: 'NEFT/HDFC/884120' },
      ],
    },
    expenses: [
      { category: 'flowers', amount: 4200000, note: 'Marigold and jasmine for the mandap', date: '2026-12-05' },
      { category: 'staff', amount: 9800000, note: 'Crew wages for 22 people', date: '2026-12-06' },
      { category: 'transport', amount: 650000, note: 'Two trucks, Gudalur to the venue', date: '2026-12-05' },
    ],
  },
  {
    title: 'Karthik & Meera — Reception',
    client: 'Karthik Menon',
    eventType: 'Reception',
    date: '2026-12-19',
    start: '18:00',
    end: '22:30',
    venue: 'Gypsy Hall',
    address: 'Gypsy Hall, Ooty, Nilgiris 643001',
    guests: 280,
    status: 'confirmed',
    notes: 'Setup from 10am. Lawn is soft after rain; the canopy needs extra pegging.',
    services: ['catering', 'decor', 'photography'],
    catering: [
      {
        name: 'Reception dinner', guests: 280, style: 'buffet', status: 'confirmed',
        menu: ['Rose milk', 'Paneer 65', 'Gobi 65', 'Nethili fish fry', 'Paneer butter masala', 'Mutton pepper masala', 'Vegetable biryani', 'Malabar parotta', 'Gulab jamun', 'Chaat counter'],
        diet: { veg: 170, non_veg: 110 },
      },
    ],
    decor: [
      { area: 'Lawn stage', type: 'stage', dimensions: '30ft × 18ft', notes: 'Fairy lights over the lawn, ivory drape backdrop, photo booth near the entrance.', crew: 'Arun Prasad + 6' },
    ],
    photography: {
      coverage: 'Reception coverage', start: '17:00', end: '22:30',
      notes: 'Stage moments and family groups; short film for the family abroad.',
      crew: ['Nithya Balan'],
      deliverables: [
        { type: 'Edited photographs', qty: 1, status: 'pending', date: '2027-01-18' },
        { type: 'Highlight film', qty: 1, status: 'pending', date: '2027-01-09' },
      ],
    },
    tasks: [
      { title: 'Walk the lawn with the decor crew', due: '2026-12-12', status: 'done' },
      { title: 'Confirm the chaat counter vendor', due: '2026-12-15', status: 'doing' },
      { title: 'Share the shot list with the family', due: '2026-12-17', status: 'todo' },
    ],
    vendors: [
      { name: 'Highland Tent House', category: 'Fairy lights and canopy', amount: 2400000, status: 'confirmed' },
    ],
    staff: [
      { member: 'Ramesh Kumar', role: 'Kitchen lead', start: '12:00', end: '22:00' },
      { member: 'Murugan Thangavel', role: 'Buffet captain', start: '15:00', end: '23:00' },
    ],
    quote: {
      status: 'accepted',
      acceptedBy: 'karthik.menon@outlook.com',
      sentDaysAgo: 21,
      lines: [
        { service: 'catering', package: 'Reception dinner buffet' },
        { service: 'catering', item: 'Mutton pepper masala' },
        { service: 'decor', package: 'Garden reception' },
        { service: 'photography', package: 'Reception only' },
      ],
    },
    invoice: {
      issuedDaysAgo: 12, dueInDays: 4,
      payments: [{ pct: 40, mode: 'upi', status: 'captured', receivedDaysAgo: 10, ref: 'UPI/411822945501' }],
    },
    expenses: [
      { category: 'flowers', amount: 1800000, note: 'Ivory drape and seasonal flowers', date: '2026-12-18' },
      { category: 'equipment', amount: 2400000, note: 'Canopy and light hire', date: '2026-12-18' },
    ],
  },
  {
    title: 'Sundaram housewarming',
    client: 'Sundaram Pillai',
    eventType: 'Housewarming',
    date: '2026-11-30',
    start: '07:00',
    end: '11:00',
    venue: 'Sundaram residence',
    address: 'Kottapalli Road, Gudalur, Nilgiris 643212',
    guests: 120,
    status: 'confirmed',
    notes: 'Breakfast at home. The family wants the serving area cleared by 11am for the pooja.',
    services: ['catering', 'decor'],
    catering: [
      {
        name: 'Breakfast', guests: 120, style: 'seated', status: 'confirmed',
        menu: ['Idli and sambar', 'Ven pongal with chutney', 'Ghee dosai', 'Poori masala', 'Rava kesari and vadai', 'Filter coffee'],
        diet: { veg: 120 },
      },
    ],
    decor: [
      { area: 'Pooja corner', type: 'traditional', dimensions: '8ft × 6ft', notes: 'Jasmine garlands, brass lamps and a kolam at the entrance.', crew: 'Arun Prasad + 2', status: 'in_progress' },
    ],
    tasks: [
      { title: 'Deliver serving tables the previous evening', due: '2026-11-29', status: 'done' },
      { title: 'Confirm the no-onion menu with the cook', due: '2026-11-28', status: 'done' },
    ],
    staff: [
      { member: 'Selvi Murugan', role: 'Breakfast cook', start: '04:30', end: '10:30' },
      { member: 'Murugan Thangavel', role: 'Service captain', start: '07:00', end: '11:30' },
    ],
    quote: {
      status: 'accepted',
      acceptedBy: 'sundaram.pillai@gmail.com',
      sentDaysAgo: 15,
      lines: [
        { service: 'catering', package: 'Housewarming breakfast' },
        { service: 'catering', item: 'Filter coffee' },
        { service: 'decor', package: 'Intimate home function' },
      ],
    },
    invoice: {
      issuedDaysAgo: 9, dueInDays: 1,
      notes: 'Balance on the morning of the function.',
      payments: [{ pct: 50, mode: 'cash', status: 'captured', receivedDaysAgo: 7, ref: 'Cash receipt 2114' }],
    },
    expenses: [
      { category: 'groceries', amount: 620000, note: 'Rice, dal and ghee for breakfast', date: '2026-11-28' },
      { category: 'flowers', amount: 340000, note: 'Jasmine and marigold', date: '2026-11-29' },
    ],
  },
  {
    title: 'Ayesha & Imran — Nikah lunch',
    client: 'Ayesha Fathima',
    eventType: 'Nikah',
    date: '2026-12-27',
    start: '11:00',
    end: '16:00',
    venue: 'Masjid Ground',
    address: 'Masjid Ground, Gudalur, Nilgiris 643211',
    guests: 320,
    status: 'confirmed',
    notes: 'Halal kitchen line required. The bride wants a soft, natural look for the photographs.',
    services: ['catering', 'photography', 'makeup'],
    catering: [
      {
        name: 'Nikah lunch', guests: 320, style: 'seated', status: 'confirmed',
        menu: ['Tender coconut', 'Chicken 65', 'Paneer 65', 'Chettinad chicken curry', 'Vegetable kurma', 'Mutton biryani', 'Vegetable biryani', 'Curd rice', 'Paal payasam', 'Filter coffee'],
        diet: { veg: 150, non_veg: 170 },
      },
    ],
    photography: {
      coverage: 'Candid photography', start: '10:00', end: '16:00',
      notes: 'Documentary style; no staged portraits during the prayer.',
      crew: ['Nithya Balan', 'Karthik Selvam'],
      deliverables: [
        { type: 'Edited photographs', qty: 1, status: 'pending', date: '2027-01-26' },
        { type: 'Album, 60 pages', qty: 1, status: 'pending', date: '2027-02-10' },
      ],
    },
    makeup: [
      { client: 'Ayesha Fathima', style: 'Bridal HD makeup', start: '06:30', end: '09:00', artist: 'Reshma Thomas', travel: true },
    ],
    trials: [{ client: 'Ayesha Fathima', style: 'Bridal HD makeup', date: '2026-12-05', approved: true }],
    tasks: [
      { title: 'Separate halal utensils and label the line', due: '2026-12-24', status: 'doing' },
      { title: "Confirm the make-up artist's arrival time", due: '2026-12-25', status: 'todo' },
    ],
    staff: [
      { member: 'Ramesh Kumar', role: 'Kitchen lead', start: '06:00', end: '16:00' },
      { member: 'Divya Shankar', role: 'Bridal artist', start: '06:00', end: '10:00' },
    ],
    quote: {
      status: 'accepted',
      acceptedBy: 'ayesha.fathima@gmail.com',
      sentDaysAgo: 16,
      lines: [
        { service: 'catering', package: 'Wedding lunch — non-vegetarian' },
        { service: 'catering', item: 'Mutton biryani' },
        { service: 'catering', item: 'Tender coconut' },
        { service: 'photography', item: 'Candid photography' },
        { service: 'makeup', item: 'Bridal HD makeup' },
      ],
    },
    invoice: {
      issuedDaysAgo: 8, dueInDays: 6,
      payments: [{ pct: 40, mode: 'upi', status: 'captured', receivedDaysAgo: 6, ref: 'UPI/422018764430' }],
    },
    expenses: [
      { category: 'meat', amount: 7400000, note: 'Mutton and chicken, halal supplier', date: '2026-12-26' },
      { category: 'groceries', amount: 1900000, note: 'Rice, ghee and dry fruit', date: '2026-12-24' },
    ],
  },
  {
    title: 'Nilgiris Estates annual day',
    client: 'Nilgiris Estates',
    eventType: 'Corporate',
    date: '2027-01-10',
    start: '12:30',
    end: '15:30',
    venue: 'Pandalur Estate Bungalow',
    address: 'Pandalur Estate, Pandalur, Nilgiris 643233',
    guests: 180,
    status: 'tentative',
    notes: 'Waiting on the estate manager to confirm the headcount; the quote has two weeks left.',
    services: ['catering'],
    catering: [
      {
        name: 'Working lunch', guests: 180, style: 'buffet', status: 'planned',
        menu: ['Vegetable biryani', 'Paneer butter masala', 'Dal tadka', 'Lemon rice', 'Curd rice', 'Gulab jamun'],
        diet: { veg: 180 },
      },
    ],
    tasks: [{ title: 'Chase the estate manager for the headcount', due: '2026-12-08', status: 'doing' }],
    quote: {
      status: 'sent',
      sentDaysAgo: 5,
      validDays: 14,
      lines: [
        { service: 'catering', package: 'Corporate working lunch' },
        { service: 'catering', item: 'Gulab jamun' },
        { service: 'catering', item: 'Serving team' },
      ],
    },
    expenses: [],
  },
  {
    title: 'Mohan & Lakshmi — Engagement',
    client: 'Mohan Raj',
    eventType: 'Engagement',
    date: '2027-02-07',
    start: '10:00',
    end: '14:00',
    venue: 'Mohan residence',
    address: 'Devala Road, Gudalur, Nilgiris 643212',
    guests: 160,
    status: 'tentative',
    notes: 'Draft quote; the family is deciding between two decor packages.',
    services: ['decor', 'makeup'],
    decor: [
      { area: 'Home stage', type: 'stage', dimensions: '16ft × 10ft', notes: 'Flower wall with a low platform and two chairs.', crew: 'Arun Prasad + 3' },
    ],
    makeup: [
      { client: 'Lakshmi', style: 'Engagement look', start: '07:00', end: '09:30', artist: 'Reshma Thomas', travel: true },
    ],
    quote: {
      status: 'draft',
      lines: [
        { service: 'decor', item: 'Nilgiri flower wall' },
        { service: 'decor', item: 'Table centrepieces', qty: 12 },
        { service: 'makeup', package: 'Engagement fresh look' },
        { service: 'makeup', item: 'Mehendi for guests', qty: 25 },
      ],
    },
  },
]
