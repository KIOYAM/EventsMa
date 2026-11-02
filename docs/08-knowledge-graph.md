# 08 — Knowledge Graph

Built with the **graphify** method: one persistent graph of concepts and
dependencies, so a new session can ask "what depends on the quotation?" instead of
re-reading 647 KB of HTML.

**Status:** graph derived by inspection of the prototype, the research notes and this
document set. The graphify CLI is installed as a skill at
`.agents/skills/graphify/`; its Python runtime was **not** installed because
`pipx`/`uv` would write packages to `C:`. Section 6 gives the exact command to build
the machine-readable graph later, with the cache kept on `D:`.

---

## 1. Graph legend

```
[Actor]      person or role
{Entity}     stored record
(Flow)       sequence with state
<Rule>       invariant or policy
!            god node (many edges, high blast radius)
→            depends on / produces
⇒            constrains
```

---

## 2. Entity graph (the core)

```
[Actor: Owner] ──owns──▶ {Organisation}
[Actor: Manager] ──member of──▶ {Organisation}
[Actor: Employee] ──member of──▶ {Organisation}
[Actor: Customer] ──enquires──▶ {Organisation}

{Organisation} ! ──has──▶ {Business profile}
{Organisation} ! ──has──▶ {Membership} ──grants──▶ <Role policy>
{Organisation} ! ──owns──▶ {MenuItem} ──composed of──▶ {Recipe line} ──reads──▶ {InventoryItem}
{Organisation} ──owns──▶ {Package} ──includes──▶ {MenuItem}
{Organisation} ──owns──▶ {Client} ──has──▶ {Enquiry}
{Enquiry} ──converts to──▶ {Event}
{Event} ! ──quoted by──▶ {Quotation} ! ──has──▶ {QuotationLine}
{Quotation} ──snapshot of──▶ {Price at send time}
{Quotation} ──accepted by──▶ {Customer acceptance}
{Event} ──billed by──▶ {Invoice} ──settled by──▶ {Payment} !
{Event} ──planned by──▶ {Operations plan} ──has──▶ {Task}
{Operations plan} ──has──▶ {Vendor commitment}
{Operations plan} ──consumes──▶ {Stock movement} ──changes──▶ {InventoryItem}
{Event} ──staffed by──▶ {Staff assignment} ──refers──▶ {Employee}
{Event} ──reviewed by──▶ {Review}
{Organisation} ──billed by──▶ {Subscription} ──limits──▶ {Usage counter}
{Organisation} ──produces──▶ {Audit event}

{Service vertical} ──configures──▶ {Service workspace} ──extends──▶ {Package}, {Resource}, {Crew}, {Deliverable}
```

### God nodes

Nodes whose change breaks the most other things. Every one of these needs tests and a
reviewer who is not the author.

| God node | Why | Blast radius | Protection |
|---|---|---|---|
| **{Organisation}** | The tenancy key on every table | Every query, every policy | `org_id NOT NULL`, composite indexes, RLS tests |
| **{Quotation}** | The customer-facing truth and the legal record | Pricing, PDF, payments, margin, reports | Immutable versions, snapshot, hash, audit |
| **{Payment}** | Money and reconciliation | Ledger, dashboard, invoice, support | Append-only, idempotency, gateway reference |
| **{Event}** | Joins client, quote, ops, staff, stock | Almost every screen | State machine, explicit transitions |
| **{Package} / {MenuItem}** | Prices and units drive all maths | Every quote ever created | Version prices; never rewrite history |
| **<Unit rule>** (`per guest` / `per tray` / `per counter`) | A wrong unit multiplies the wrong number | Totals, margin | Pure function + property tests |

---

## 3. Communities (conceptual clusters)

Communities are groups of nodes that change together. Work that crosses two
communities needs a design doc; work inside one is usually a normal ticket.

| Community | Members | Owner | Changes with |
|---|---|---|---|
| **Identity & tenancy** | Organisation, Membership, Role policy, Auth, Invitation | Dev | Every feature (read path) |
| **Catalogue & pricing** | MenuItem, Recipe, Package, Unit rule, Tax rule | Dev + founder | Margin, quotes, imports |
| **Selling** | Enquiry, Quotation, QuotationVersion, Customer acceptance, Public page | Dev | WhatsApp, payments, SEO |
| **Money** | Invoice, Payment, Ledger, Subscription, Receipt | Dev | Gateway, reconciliation, GST |
| **Delivery** | Event, Operations plan, Task, Vendor, Staff assignment, Stock movement | Dev | Attendance, inventory, offline |
| **Trust** | Review, Audit event, Consent, Export, Deletion | Dev | Legal, support, incidents |
| **Platform** | Admin console, Usage counter, Suspension, Feature flag | Dev | Billing, abuse, cost |
| **Experience layer** | Design system, Navigation, Empty states, Offline queue, Performance budget | Dev | Every community |

**Cross-community edges that cause the most bugs**

1. Pricing ↔ Selling: a price change must not alter a sent quote.
2. Money ↔ Delivery: the final guest count changes the invoice after a deposit.
3. Identity ↔ Everything: a policy mistake is a data breach, not a UI bug.
4. Experience ↔ Selling: an optimistic UI edit on a quote must not race the server
   total.

---

## 4. Flow graph

Each flow is a path through the entity graph, with its failure exits.

```
(Onboarding)   Signup → Verify → Business → Package → Menu → Tax/Advance → First quote
                                                  ↘ skip allowed      ↘ required

(Enquiry)      Public page → Enquiry → Notify → Follow-up → Qualified → Quote
                     ↘ spam                ↘ bounce          ↘ lost

(Quote)        Draft → Sent → Viewed → Revised → Accepted → Deposit → Confirmed
                 ↘ abandoned   ↘ expired        ↘ declined            ↘ cancelled

(Delivery)     Confirmed → Plan → Assign → Purchase → Event day → Close-out → Review
                                  ↘ conflict       ↘ shortage      ↘ dispute

(Payment)      Link → Authorised → Captured → Receipt → Reconciled
                         ↘ failed → Retry → Grace → Read-only

(Support)      Ticket → Triage → Reproduce → Fix or Workaround → Post-mortem → Doc
```

---

## 5. Document graph

How this folder relates to itself and to the source material.

```
README ──indexes──▶ 00 audit ──feeds──▶ 01 business ──feeds──▶ 03 ideation
   │                    │                    │                    │
   │                    └──feeds──▶ 02 gaps ─┘                    │
   │                                                              ▼
   ├──indexes──▶ 04 architecture ──constrains──▶ 05 workflow ──▶ 06 flows
   │                    │                                       │
   │                    └──────────constrains───────────────────┘
   ├──indexes──▶ 07 roadmap ──derived from──▶ 01, 03, 04
   ├──indexes──▶ 08 graph ──summarises──▶ all
   └──indexes──▶ reviews/goldfish ──critiques──▶ all drafts

Source material (read-only, at repo root)
  FeastFlow_*.html ──audited by──▶ 00
  EVENTSMA_*research*.md ──evidence for──▶ 01, 02
  01–05 reverse-engineering ──reference only──▶ 01 (competitive table)
  Caterease guide ──reference only──▶ 04 (architecture options)
```

**Rule:** a change to 01, 03 or 04 that alters scope requires a matching edit to 07,
and a note in the decision log. Otherwise the roadmap silently drifts.

---

## 6. Building the machine-readable graph later

The installed skill provides `/graphify`. To run it without touching `C:`, create a
project-local Python environment and point every cache at the project:

```bash
cd /d/Kannan-Projects/EventsMa
python -m venv .cache/venv
export PIP_CACHE_DIR="D:/Kannan-Projects/EventsMa/.cache/pip"
export TMPDIR="D:/Kannan-Projects/EventsMa/.cache/tmp"
.cache/venv/Scripts/pip install graphifyy
.cache/venv/Scripts/graphify . --mode deep --svg
```

Expected outputs (written to `graphify-out/`):

- `graph.json` — nodes and edges for agent queries
- `GRAPH_REPORT.md` — communities, god nodes, anomalies
- `graph.html` — interactive view
- `graph.svg` — embeddable in Notion or GitHub

Run it after the first code milestone, not now: there is no code to analyse yet, and a
graph of four markdown files adds little beyond section 5 above.

**Query patterns to use once it exists**

```bash
graphify query "what depends on quotation totals"
graphify path "Quotation" "Payment"
graphify explain "Unit rule"
```

---

## 7. Anomalies and ambiguities worth flagging

Honest markers from building this graph by hand:

1. **"Business" vs "Organisation"** — the prototype uses both. The graph chooses
   Organisation as the tenant and Business profile as its attributes. Any future
   document must use those words consistently or the schema will drift.
2. **"Client" vs "Customer"** — the prototype uses Client for the caterer's customer and
   Customer for the portal user. Keep: `Client` is a business record; `Customer` is a
   login identity linked to a client. They are not the same row.
3. **"Event" vs "Booking"** — one event, one booking, one quotation set. Do not create a
   separate Booking table in MVP.
4. **"Invoice" vs "Quotation"** — a quotation becomes an invoice only after acceptance
   and (usually) a deposit. They must not share a table with a status flag, because
   invoices are financial documents with legal retention.
5. **"Service vertical" vs "Service workspace"** — vertical is the category; workspace
   is the configured instance. The prototype is right; keep it.
6. **Marketplace listing** — the prototype reuses the business profile as the listing.
   Split them later: a listing has publication state, ranking inputs and response SLAs
   that a profile does not.
