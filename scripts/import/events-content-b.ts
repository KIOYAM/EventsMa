/**
 * Corporate, club, church and cancelled bookings.
 *
 * Split from one list only to keep each file readable; combined in
 * `events-content.ts`.
 */
import type { EventSpec } from './types'

export const EVENTS_B: EventSpec[] = [
  {
    title: 'Coonoor Club Deepavali dinner',
    client: 'Coonoor Club',
    eventType: 'Club dinner',
    date: '2026-11-08',
    start: '19:00',
    end: '22:30',
    venue: 'Coonoor Club',
    address: 'Coonoor Club, Coonoor, Nilgiris 643101',
    guests: 220,
    status: 'completed',
    notes: 'Served dinner for members. Club kitchen handled the dessert; we did everything else.',
    services: ['catering', 'decor'],
    catering: [
      {
        name: 'Deepavali dinner', guests: 220, style: 'seated', status: 'served',
        menu: ['Nannari sarbath', 'Paneer 65', 'Mushroom pepper fry', 'Paneer butter masala', 'Chettinad chicken curry', 'Ghee rice', 'Malabar parotta', 'Semiya payasam'],
        diet: { veg: 140, non_veg: 80 },
      },
    ],
    decor: [
      { area: 'Dining hall', type: 'lighting', dimensions: '40ft × 24ft', notes: 'Fairy lights and brass lamps on each table.', crew: 'Arun Prasad + 3', status: 'completed' },
    ],
    quote: {
      status: 'accepted',
      acceptedBy: 'secretary@coonoorclub.in',
      sentDaysAgo: 34,
      lines: [
        { service: 'catering', package: 'Reception dinner buffet' },
        { service: 'catering', item: 'Mushroom pepper fry' },
        { service: 'decor', item: 'Fairy light canopy' },
        { service: 'decor', item: 'Table centrepieces', qty: 22 },
      ],
    },
    invoice: {
      issuedDaysAgo: 24, dueInDays: -10,
      notes: 'Settled on 12 November.',
      payments: [
        { pct: 40, mode: 'bank_transfer', status: 'captured', receivedDaysAgo: 30, ref: 'NEFT/HDFC/771002' },
        { pct: 60, mode: 'bank_transfer', status: 'captured', receivedDaysAgo: 11, ref: 'NEFT/HDFC/788441' },
      ],
    },
    expenses: [
      { category: 'groceries', amount: 5200000, note: 'Rice, vegetables and oil', date: '2026-11-06' },
      { category: 'staff', amount: 4800000, note: 'Crew wages for 14 people', date: '2026-11-08' },
    ],
  },
  {
    title: 'Ravi & Sindhu — Wedding',
    client: 'Ravi Chandran',
    eventType: 'Wedding',
    date: '2026-10-18',
    start: '05:00',
    end: '22:00',
    venue: 'Bethel Garden',
    address: 'Bethel Garden, Gudalur, Nilgiris 643211',
    guests: 380,
    status: 'completed',
    notes: 'Full-day coverage, same-day edit and a mandap built on the Friday. Album still with the designer.',
    services: ['catering', 'decor', 'photography', 'makeup'],
    catering: [
      {
        name: 'Wedding lunch', guests: 380, style: 'banana_leaf', status: 'served',
        menu: ['Spiced buttermilk', 'Gobi 65', 'Chicken 65', 'Vegetable kurma', 'Sambar', 'Rasam', 'Chicken biryani', 'Ghee rice', 'Semiya payasam', 'Filter coffee'],
        diet: { veg: 240, non_veg: 140 },
      },
    ],
    decor: [
      { area: 'Main stage', type: 'stage', dimensions: '24ft × 16ft', notes: 'Nilgiri flowers with a jasmine curtain.', crew: 'Arun Prasad + 5', status: 'completed' },
    ],
    photography: {
      coverage: 'Full-day wedding coverage', start: '05:00', end: '21:30',
      notes: 'Two cameras, drone and a same-day edit for the reception.',
      crew: ['Nithya Balan', 'Karthik Selvam'],
      deliverables: [
        { type: 'Edited photographs', qty: 1, status: 'delivered', date: '2026-11-16' },
        { type: 'Highlight film', qty: 1, status: 'delivered', date: '2026-11-04' },
        { type: 'Album, 60 pages', qty: 1, status: 'editing', date: '2026-12-10' },
      ],
    },
    makeup: [
      { client: 'Sindhu Devi', style: 'Airbrush bridal makeup', start: '03:00', end: '05:30', artist: 'Divya Shankar', travel: true },
    ],
    trials: [{ client: 'Sindhu Devi', style: 'Airbrush bridal makeup', date: '2026-09-26', approved: true }],
    quote: {
      status: 'accepted',
      acceptedBy: 'ravi.chandran@gmail.com',
      sentDaysAgo: 74,
      discountAmount: 700000,
      lines: [
        { service: 'catering', package: 'Wedding lunch — vegetarian' },
        { service: 'catering', item: 'Chicken 65' },
        { service: 'catering', item: 'Chicken biryani' },
        { service: 'decor', package: 'Classic mandap' },
        { service: 'decor', item: 'Chair covers and sashes', qty: 380 },
        { service: 'photography', package: 'Full weekend story' },
        { service: 'makeup', item: 'Airbrush bridal makeup' },
        { service: 'makeup', item: 'Bridal mehendi' },
      ],
    },
    invoice: {
      issuedDaysAgo: 52, dueInDays: -22,
      notes: 'Paid in two transfers.',
      payments: [
        { pct: 40, mode: 'bank_transfer', status: 'captured', receivedDaysAgo: 60, ref: 'NEFT/HDFC/702114' },
        { pct: 60, mode: 'upi', status: 'captured', receivedDaysAgo: 23, ref: 'UPI/401366820011' },
      ],
    },
    expenses: [
      { category: 'flowers', amount: 3800000, note: 'Jasmine curtain and stage flowers', date: '2026-10-16' },
      { category: 'staff', amount: 8800000, note: 'Crew wages for 20 people', date: '2026-10-18' },
      { category: 'transport', amount: 720000, note: 'Trucks and fuel', date: '2026-10-17' },
    ],
  },
  {
    title: 'Green Hills School annual day',
    client: 'Green Hills School',
    eventType: 'Corporate',
    date: '2026-09-25',
    start: '12:00',
    end: '15:00',
    venue: 'Green Hills School',
    address: 'Green Hills School, Ooty, Nilgiris 643002',
    guests: 260,
    status: 'completed',
    notes: 'Served in 45 minutes between the two programme halves.',
    services: ['catering'],
    catering: [
      {
        name: 'Working lunch', guests: 260, style: 'buffet', status: 'served',
        menu: ['Vegetable biryani', 'Paneer butter masala', 'Dal tadka', 'Lemon rice', 'Curd rice', 'Gulab jamun'],
        diet: { veg: 260 },
      },
    ],
    quote: {
      status: 'accepted',
      acceptedBy: 'office@greenhillsschool.in',
      sentDaysAgo: 40,
      lines: [
        { service: 'catering', package: 'Corporate working lunch' },
        { service: 'catering', item: 'Paneer butter masala' },
        { service: 'catering', item: 'Gulab jamun' },
      ],
    },
    invoice: {
      issuedDaysAgo: 34, dueInDays: -4,
      payments: [{ pct: 100, mode: 'bank_transfer', status: 'captured', receivedDaysAgo: 20, ref: 'NEFT/HDFC/690118' }],
    },
    expenses: [{ category: 'groceries', amount: 4600000, note: 'Vegetables, rice and ghee', date: '2026-09-24' }],
  },
  {
    title: 'Sathya & Vignesh — Wedding',
    client: 'Sathya Prakash',
    eventType: 'Wedding',
    date: '2026-12-12',
    start: '06:00',
    end: '21:00',
    venue: 'Bethel Garden',
    address: 'Bethel Garden, Gudalur, Nilgiris 643211',
    guests: 300,
    status: 'cancelled',
    notes: 'Family postponed to 2027 and asked us to hold the advance against the new date.',
    services: ['catering', 'decor'],
    catering: [
      {
        name: 'Wedding lunch', guests: 300, style: 'banana_leaf', status: 'cancelled',
        menu: ['Nannari sarbath', 'Gobi 65', 'Vegetable kurma', 'Sambar', 'Vegetable biryani', 'Semiya payasam'],
        diet: { veg: 300 },
      },
    ],
    quote: {
      status: 'declined',
      sentDaysAgo: 30,
      lines: [
        { service: 'catering', package: 'Traditional sadya on banana leaf' },
        { service: 'decor', package: 'Classic mandap' },
      ],
    },
  },
  {
    title: 'Pandalur church feast',
    client: 'Vignesh Kumar',
    eventType: 'Church feast',
    date: '2027-01-24',
    start: '11:00',
    end: '16:00',
    venue: 'St. Mary Church Ground',
    address: 'St. Mary Church, Pandalur, Nilgiris 643233',
    guests: 500,
    status: 'tentative',
    notes: 'Two service lines. The parish committee confirms the headcount in the first week of January.',
    services: ['catering', 'decor'],
    catering: [
      {
        name: 'Feast lunch', guests: 500, style: 'buffet', status: 'planned',
        menu: ['Spiced buttermilk', 'Gobi 65', 'Vegetable kurma', 'Sambar', 'Rasam', 'Vegetable biryani', 'Curd rice', 'Paal payasam'],
        diet: { veg: 500 },
      },
    ],
    decor: [
      { area: 'Church entrance', type: 'entrance', dimensions: '20ft arch', notes: 'Marigold arch and two flower pillars for the procession.', crew: 'Arun Prasad + 4' },
    ],
    quote: {
      status: 'sent',
      sentDaysAgo: 6,
      validDays: 21,
      lines: [
        { service: 'catering', package: 'Traditional sadya on banana leaf' },
        { service: 'catering', item: 'Serving team' },
        { service: 'decor', item: 'Entrance arch in marigold and jasmine' },
      ],
    },
  },
]
