import type { DeepPartial } from '../en'
import { inventory as enInventory } from '../en/inventory'

/**
 * Inventory in Tamil. SEED — not native-reviewed.
 *
 * English fallback is used throughout; a native reviewer should replace these
 * strings with clean Tamil.
 */
export const inventory: DeepPartial<typeof enInventory> = {
  title: 'Inventory',
  eyebrow: 'Inventory',
  heading: 'Stock that reconciles, because it is only ever a sum',
  intro:
    'There is no editable on-hand number. Every receipt, issue and wastage is an append-only movement; a mistake is fixed with a reversing entry.',
  stats: {
    items: 'Items tracked',
    belowReorder: 'Below reorder level',
    stockValue: 'Stock value at cost',
  },
  empty: 'No stock items yet. Add rice, oil or gas to start the ledger.',
  table: {
    item: 'Item',
    onHand: 'On hand',
    reorderAt: 'Reorder at',
    value: 'Value',
    noSupplier: 'No supplier set',
  },
  movement: {
    title: 'Record a movement',
    item: 'Item',
    itemHint: 'In the item unit.',
    quantity: 'Quantity',
    quantityPlaceholder: '25',
    reason: 'Reason',
    note: 'Note',
    notePlaceholder: 'Invoice 4821, Balaji Stores',
    record: 'Record movement',
  },
  add: {
    title: 'Add an item',
    item: 'Item',
    itemPlaceholder: 'Sona masoori rice',
    unit: 'Unit',
    openingStock: 'Opening stock',
    openingPlaceholder: '0',
    reorderAt: 'Reorder at',
    reorderPlaceholder: '25',
    costUnit: 'Cost / unit (₹)',
    costPlaceholder: '72',
    supplier: 'Supplier',
    supplierPlaceholder: 'Balaji Stores',
    add: 'Add item',
  },
  note:
    'Stock is not yet deducted automatically when a quotation is sent. The prep sheet will do that once event sessions exist — until then, record consumption manually.',
  errors: {
    invalid: 'Check the name and quantities — they must be numbers.',
    permission: 'Only an owner or manager can change stock.',
    missing: 'That item no longer exists.',
    demo: 'Demo mode: connect a database before recording stock.',
  },
  saved: {
    movement: 'Movement recorded.',
    item: 'Item added.',
  },
}
