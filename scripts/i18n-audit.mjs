#!/usr/bin/env node
/**
 * Localization audit.
 *
 * Counts the user-facing strings still written inline in components, so the
 * translation backlog is a number instead of a feeling. Run it before and after a
 * extraction pass; the count should fall and English output should not change.
 *
 *   node scripts/i18n-audit.mjs
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOTS = ['app', 'components']
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'coverage'])
const ATTRIBUTES = '(?:placeholder|title|label|description|aria-label|alt)'

// A JSX text node with real words in it: `>Save changes<`.
const TEXT = />\s*([A-Z][A-Za-z0-9 ,.'’&%:!?()/-]{4,})\s*</g
// A string attribute the user reads: `placeholder="Search clients"`.
const ATTR = new RegExp(`${ATTRIBUTES}\\s*=\\s*"([A-Z][^"]{4,})"`, 'g')

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(path))
    else if (/\.tsx$/.test(entry.name)) files.push(path)
  }
  return files
}

const files = ROOTS.flatMap((root) => {
  try {
    return walk(root)
  } catch {
    return []
  }
})

const perFile = []
let textTotal = 0
let attrTotal = 0

for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const text = [...source.matchAll(TEXT)].length
  const attrs = [...source.matchAll(ATTR)].length
  textTotal += text
  attrTotal += attrs
  if (text + attrs > 0) perFile.push({ file: relative(process.cwd(), file), text, attrs })
}

perFile.sort((a, b) => b.text + b.attrs - (a.text + a.attrs))

console.log(`Scanned ${files.length} .tsx files under ${ROOTS.join(', ')}`)
console.log(`Inline JSX text : ${textTotal}`)
console.log(`Readable attributes: ${attrTotal}`)
console.log(`Total candidates: ${textTotal + attrTotal}\n`)
console.log('Heaviest files:')
for (const row of perFile.slice(0, 15)) {
  console.log(`  ${String(row.text + row.attrs).padStart(4)}  ${row.file} (${row.text} text, ${row.attrs} attrs)`)
}
console.log('\nNote: this is a signal, not a ledger. Error maps, toast copy and PDF text are')
console.log('counted separately by hand; a string can be legitimately untranslatable here,')
console.log('such as a brand name or a currency symbol.')
