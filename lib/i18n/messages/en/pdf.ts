/**
 * Quotation PDF copy.
 *
 * Separate from the interface catalogue because a document is not a screen: it is
 * printed, filed and compared, and its wording has to stand on its own for years.
 * These are the only strings that appear in a PDF.
 */
export const pdf = {
  quotation: 'QUOTATION',
  validFor: 'Valid 7 days',
  guests: '{count} guests',
  subtotal: 'Subtotal',
  discount: 'Discount',
  tax: 'Tax',
  roundOff: 'Round-off',
  total: 'Total',
  included: 'Included',
  includedSuffix: 'included',
  terms:
    'Guest counts and service timings are reconfirmed before the event. Changes to the guest count, menu or venue timing may change the final amount. This quotation is valid for seven days from issue.',
  footer: 'Prepared with EventsMa.',
  unitPerGuest: 'per guest',
  unitPerUnit: 'per item',
  unitFlat: 'fixed amount',
  unitPerHour: 'per hour',
  unitPerDay: 'per day',
  serviceCatering: 'Catering',
  serviceDecoration: 'Decoration',
  serviceMakeup: 'Makeup',
  servicePhotography: 'Photography',
} as const
