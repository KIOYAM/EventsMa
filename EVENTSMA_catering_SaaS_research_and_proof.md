# EVENTSMA / FeastFlow — Discussion Summary, Evidence, Demo References & Technical Options

**Prepared:** 24 October 2026  
**Purpose:** Consolidate the discussion so far into a practical Markdown reference for the EVENTSMA/FeastFlow catering-and-events SaaS concept. This includes the current business workflow, the two-phase product direction, pricing and distance logic, online demos/references, potential stack choices, and evidence links.

> **Important accuracy note:** This document distinguishes (1) requirements and ideas discussed in the conversation, (2) claims published on third-party product websites, and (3) features that still need to be verified in the existing FeastFlow prototype/source code. A public product page is evidence that the vendor advertises a feature; it is not independent proof of the feature’s quality or proof that our application already implements it.

---

## 1. Product direction discussed

- The product is intended to be a SaaS platform for catering businesses and related event-service businesses.
- The initial target users are **business owners**, especially caterers who already receive enquiries and manage their own services.
- Examples of relevant events:
  - Weddings
  - Birthday functions
  - Ear-piercing ceremonies
  - Temple festivals and other local festivals
  - Other functions where catering and potentially photography or other event services are arranged
- Each business should represent its own actual services, menus, packages, pricing rules and service areas. Do not assume every caterer provides the same services.
- The business model needs to support different businesses having different menus, costs, prices and profit margins.

## 2. Two-phase product boundary

### Phase 1 — Business-side SaaS

The first phase focuses on helping existing businesses organise and manage their own information and workflow.

- Business profile and service details.
- Menu and menu-item entry.
- Menu packages and pricing.
- Event or enquiry details, where included in the current scope.
- Quotation/estimate creation, if supported by the prototype.
- Business-specific cost and price rules.
- Possible distance/transport surcharge calculation, subject to requirements and implementation.
- A simple interface that is usable by business owners who may not be technical.

**Critical pitch boundary:** Do not claim Phase 1 will automatically bring new public customers to a caterer if customer discovery is not implemented yet. In Phase 1, the value proposition should focus on the business workflow that the product actually supports.

### Phase 2 — Public discovery / people finder / people planner

The later phase may let people planning an event discover appropriate providers.

Potential future capabilities:
- Search for providers by event type, service, location or service area.
- Compare provider profiles and offerings.
- Send an enquiry or request a quotation.
- Combine providers for an event, such as catering and photography.
- Potentially build a cart/planner-like experience if that is part of the agreed product design.

These are future-scope ideas, not confirmed current functionality.

---

## 3. Current catering-business workflow (before using our application)

The following is a representative workflow, not a claim that every caterer follows the exact same process.

1. **A customer has an event.** They know the date, venue, approximate guest count, meal requirements and budget.
2. **The customer finds a caterer.** Common channels include referrals, Google Search/Maps, social media, event planners, existing contacts or direct recommendations.
3. **The customer contacts the caterer.** This may happen by phone, WhatsApp, email or an in-person visit.
4. **The caterer gathers requirements.** Typical questions include event date, venue, guest count, meals, vegetarian/non-vegetarian preferences, menu, budget, serving arrangements and other services.
5. **The caterer checks availability.** They decide whether they can serve the event on the requested date and at the venue.
6. **The caterer estimates the cost.** Depending on the business, this may involve a standard package, prior experience, a spreadsheet, a notebook, supplier rates or manual calculations.
7. **The caterer prepares a quotation.** It may include menu, guest count, per-plate rate, additional services, transport, taxes and total price as applicable.
8. **The quotation is shared.** WhatsApp, PDF, email or an in-person discussion may be used.
9. **The customer compares and negotiates.** They may change the menu, guest count, service requirements or budget.
10. **Booking is confirmed.** Advance payment, terms and event details are recorded according to the business’s process.
11. **The event is delivered.** The caterer arranges ingredients, staff, transport, cooking and serving.
12. **Payments and accounts are closed.** Final payment, invoice and cost/profit records are handled according to the business’s process.

### Simple flow

`Customer event need → Find caterer → Contact → Gather requirements → Check availability → Estimate price → Send quotation → Negotiate → Confirm booking → Deliver event → Close payments`

### Evidence/qualification

These are common-sense workflow steps for a catering service and were used as a working model in the discussion. They should be validated with actual caterers before being treated as universal market facts. Competitor feature pages linked below provide examples of how existing tools position similar workflow problems.

---

## 4. Problems to validate with real caterers

Do not assume every problem exists for every business. Ask caterers which of these actually happens and how often.

- Menu and price information is maintained in multiple places.
- A quotation must be rebuilt manually for each enquiry.
- Per-plate prices or package prices are hard to update when ingredient costs change.
- The same menu is repeatedly entered for similar events.
- Transport or venue distance changes the cost, but the rule is not written down.
- Staff, equipment, inventory or supplier requirements are difficult to coordinate.
- Customer advances and balances are hard to track.
- Event bookings, dates and follow-ups are scattered across a diary, phone, WhatsApp and spreadsheets.
- The owner cannot easily see which events are profitable.
- The business has no consistent format for quotations, menus or invoices.

**Recommended validation questions**
- “Can you show me how you prepared your last quotation?”
- “Which information do you enter more than once?”
- “How do you update your per-plate price when costs change?”
- “How do you calculate transport charges for a different venue?”
- “Which mistakes or delays happen most often?”
- “Which part would you pay to make easier?”
- “What software or spreadsheet do you already use?”

---

## 5. Pricing: business-specific, not one universal price

The discussion established that prices should vary by business.

- Each business may have its own menu, ingredient costs, labour costs, package prices, margins and policies.
- The system should not force every caterer to use the same price list.
- A possible design is to let a business maintain its own menu items, package prices and configurable pricing rules.
- Calculations should use that business’s saved rules and inputs.
- The application should show how the total was calculated so the owner can check it.
- The owner should be able to review/override a calculated amount where the product requirements allow it.
- Tax treatment should not be hard-coded as a universal assumption; it must follow the business’s applicable tax setup and the relevant legal/accounting requirements.

### Example (illustrative only)

A caterer sets a base vegetarian menu price of ₹250 per person. For 500 guests, the base menu subtotal is:

`500 × ₹250 = ₹1,25,000`

If the caterer separately configures transport, extra staff or other charges, those should be added according to that caterer’s own rules. The ₹250 price is only an example and is not a market-price claim.

---

## 6. Distance and transport charges

The user clarified that distance matters when the caterer is preparing a price for an event: the caterer asks the client where the event is, then may increase the price based on distance/transport cost. The desired idea is for the application to calculate that component.

### Suggested business flow

1. Business owner saves the business/base location.
2. The quotation/event form captures the event venue or address.
3. The system obtains the route distance (if route-based distance is required and a routing service is configured).
4. The business’s own pricing rule is applied.
5. The transport component and total quotation are shown separately.
6. The business owner reviews the calculation before sending the quotation.

### Possible pricing rules

- Fixed fee for a defined service zone.
- Fixed fee plus a per-kilometre amount after a configured threshold.
- Different rules for different vehicle types or event sizes.
- Manual override where the actual transport arrangement cannot be inferred from distance alone.

### Illustrative example only

A caterer could set:
- Up to 10 km: fixed transport fee.
- Beyond 10 km: fixed fee plus a configured rate per additional kilometre.

The actual numbers must be configured by the caterer; the product must not invent or impose a universal rate.

### Engineering note

- Straight-line distance between coordinates is not the same as road distance.
- If the business prices by road distance, use a routing API or a reliable routing provider.
- Google Maps Routes API supports route-distance and route-matrix calculations. Review its billing and usage limits before committing to it.
- Avoid sending API keys to the browser in an unsafe way. Use appropriate key restrictions and server-side controls.
- Cache or otherwise control repeat requests where appropriate, while respecting provider terms.
- Keep the distance result, pricing rule and calculated surcharge explainable/auditable.

Official reference:
- Google Maps Routes API usage and billing: https://developers.google.com/maps/documentation/routes/usage-and-billing
- Google Maps route matrix guide: https://developers.google.cn/maps/documentation/routes/compute_route_matrix?hl=en
- Google Maps Platform India pricing FAQ: https://developers.google.cn/maps/billing-and-pricing/india?hl=en

---

## 7. What to say when pitching Phase 1 to a caterer

### Short, honest pitch

“We’re building a tool to help catering businesses organise their own menus, prices and event-related information in one place. The aim is to reduce repetitive manual work and make common tasks such as preparing event pricing more consistent. You keep control of your own prices and business rules. We’re validating the workflow with caterers so we focus on the tasks that genuinely take them time.”

### If quotation and distance calculation are implemented and tested

“You can maintain your own menu and pricing rules. When you enter an event’s guest count and venue, the system can calculate the configured price components, including transport where you’ve set up a distance-based rule, and show you the total to review.”

### Avoid claiming without evidence

- “We will bring you more customers” — unless customer acquisition/discovery is actually provided.
- “The system calculates everything automatically” — unless each calculation is implemented and tested.
- “All tax is automatically correct” — tax setup and legal requirements need proper implementation and validation.
- “Distance pricing is already available” — only say this after verifying the feature in the current prototype.
- “Every caterer faces this problem” — validate with real users.

---

## 8. Online products and demos to study

The following links are research references, not endorsements. Use them to inspect workflows, screenshots, demo environments and product positioning. Do not copy branding, proprietary text, images or source code without permission/licence. Recreate the underlying interaction pattern in our own design.

### A. Catering-focused products

#### 1. CateringWaala — India-focused catering operations

- Official website: https://cateringwaala.com/
- Android listing: https://play.google.com/store/apps/details?id=com.cateringwaala.app
- Publicly described features include bookings/events, menu/packages, ingredient/purchase lists, vendors, staff, inventory, expenses, invoices and profit reports.
- The website describes a workflow in which a booking is entered, ingredient quantities are calculated from menu and guest count, vendor orders can be shared on WhatsApp, and invoices/profit tracking are handled.
- Useful references to inspect:
  - Booking/event entry
  - Menu and package setup
  - Guest-count-to-ingredient calculation
  - Vendor and customer ledger
  - Invoice sharing
  - Mobile-first onboarding
- Evidence: vendor’s public product page and Google Play listing. These establish the features the vendor advertises, not independent validation of performance.

#### 2. CateringMenu — quotation and invoice workflow

- Google Play listing: https://play.google.com/store/apps/details?id=app.cateringmenu.in
- Public listing describes menu packages, menu selection, quotations, invoices, WhatsApp/PDF sharing and payment tracking.
- Useful reference to inspect:
  - Menu selection
  - Quotation generation
  - Invoice flow
  - Advance and pending-payment tracking
- Evidence: public Google Play product listing. The listing reports an update dated 19 July 2026 and describes it as the first version at the time shown on the page; verify current app status directly before relying on it.

#### 3. MealPe — institutional food operations (adjacent, not a direct wedding-caterer equivalent)

- Official website: https://mealpe.app/
- Product page: https://mealpe.app/product
- Publicly described areas include digital cafeteria, mess management, QR ordering, vendor applications, admin dashboards, billing and analytics.
- Useful reference to inspect:
  - Vendor/admin role separation
  - Menu configuration
  - Live order and kitchen workflows
  - Billing/settlement
  - Dashboard analytics
- Important limitation: MealPe primarily positions itself for institutional food-service environments. Use it for operational patterns, not as proof that its workflow matches small event caterers.

#### 4. Cateringwaale / CW Partner — business onboarding and partner operations

- Official website: https://www.cateringwaale.com/
- Android partner app: https://play.google.com/store/apps/details?id=com.cateringwale.restaurant.android
- Public descriptions mention business onboarding, outlet setup, business details, address/location, photographs, operating information, documents, bank details and role-based operations.
- Useful reference to inspect:
  - Step-by-step business onboarding
  - Location and service details
  - Business approval/setup status
  - Partner role separation
- Limitation: its public platform description says features are being introduced in phases and availability may vary.

### B. Public code repositories and working demos

#### 5. Ziyafat — open-source catering-management reference

- GitHub repository: https://github.com/Mudassirkhan2/Ziyafat
- Live demo linked by the repository: https://getziyafat.vercel.app
- Repository describes leads/CRM, event bookings, customer profiles, menu/dish catalogue, quotations, invoices, staff scheduling and calendar functionality.
- Useful reference to inspect:
  - End-to-end catering workflow
  - Menu-to-quotation model
  - Booking status and event data
  - Backend/frontend separation
- Evidence: repository README and source code. Inspect the licence and dependency/security state before reusing any code. A public repository is not automatic permission to copy without respecting its licence.

#### 6. MySagra — open-source food/event operations reference

- GitHub repository: https://github.com/MySagra/mysagra
- Documentation: https://docs.mysagra.com/
- Publicly described features include event/food-vendor ordering, menus, orders, kitchen/bar printing, real-time dashboards and offline-friendly PWA behaviour.
- Useful reference to inspect:
  - Event-level menus
  - Order workflow
  - Kitchen and counter screens
  - Role separation
  - Offline-friendly design
- Limitation: it is oriented toward festivals/food markets and order operations, not necessarily the same business model as wedding catering quotations.

#### 7. Open-source event order system

- GitHub repository: https://github.com/mrckurz/order-system
- Public README describes configurable menus, multi-tenant roles, event admin screens, bar/kitchen views, live orders and CSV menu import/export.
- Useful reference to inspect:
  - Role-specific screens
  - Editable menus
  - Event configuration
  - Real-time kitchen/order status
- Limitation: it is an event ordering system, not a complete catering CRM or quote calculator.

---

## 9. UI references: small functions to preview and adapt

These are especially useful if the aim is to study a small function and implement a similar interaction rather than rebuilding an entire product.

### 8. Official shadcn/ui blocks

- Dashboard blocks: https://ui.shadcn.com/blocks?category=dashboard
- Charts: https://ui.shadcn.com/docs/components/base/chart
- Good for:
  - Sidebar and dashboard shell
  - KPI cards
  - Data tables
  - Chart layouts
  - Reusable form components
- Evidence: official documentation describes the blocks as copy-and-paste building blocks and provides previews/source instructions.
- Stack fit: React-based projects, typically using Tailwind CSS and shadcn/ui components.
- Licence/usage: check the licence and requirements for each component and dependency; use official documentation.

### 9. Spectrum UI — React/Tailwind copyable components

- Component library: https://ui.spectrumhq.in/docs
- Public docs describe React components and blocks built with Tailwind CSS, Motion, TypeScript and shadcn/ui, with source/dependency details.
- Good for:
  - Form controls
  - Dialogs/drawers
  - Cards
  - Alerts
  - Animated UI patterns
- Evidence: public component documentation. Confirm the licence and dependencies for each chosen component.

### 10. dashboardcn — data-heavy dashboard components

- Documentation: https://dashboardcn.com/docs
- Public docs describe KPI cards, time-series charts, funnels, ranked lists, calendar heatmaps and data tables, using shadcn/ui/Tailwind foundations.
- Good for:
  - Revenue/cost dashboard
  - Event summary cards
  - Booking tables
  - Reporting screens
- Evidence: project documentation. Check the current licence and version compatibility before adoption.

### 11. shadcn dashboard starter

- GitHub repository: https://github.com/towerneon/shadcndashboard-ui
- Repository describes a React/Vite dashboard using shadcn/ui, Tailwind CSS and TypeScript, with authentication pages, tables, charts and light/dark themes.
- Good for:
  - Login/signup baseline
  - Dashboard layout
  - Responsive admin UI
  - Tables and charts
- Evidence: repository README. Check licence, maintenance and dependency versions before using.

### 12. shadcn.io — third-party component registry

- Website: https://www.shadcn.io/
- Public site describes reusable blocks, components, examples and templates for multiple frameworks.
- Good for:
  - Exploring alternatives and design patterns
  - Comparing form, table, chart and navigation patterns
- Important: the site explicitly identifies itself as an independent project, not the official shadcn/ui project. Verify which components are free, what requires an account, and each component’s licence.

---

## 10. Suggested technical stack — choose based on the existing code

**Do not restart the prototype just because a reference uses a different stack.** First inspect the current HTML files and dependencies, then choose the smallest compatible path.

### If the existing prototype is plain HTML/CSS/JavaScript

- Keep it for the demo if the current goal is to prove the workflow quickly.
- Use reusable CSS/JS modules and clear separation between UI, pricing logic and sample data.
- Store demo data locally only for prototype purposes; do not mistake browser storage for a production multi-user database.
- Avoid a framework migration until there is a concrete need.

### If building a production SaaS with React

A reasonable candidate stack to evaluate:

- **Frontend:** React + TypeScript.
- **Styling/UI:** Tailwind CSS + shadcn/ui.
- **Forms/validation:** React Hook Form + Zod (or equivalent).
- **Tables:** TanStack Table where complex sorting/filtering/pagination is needed.
- **Charts:** Recharts through shadcn/ui’s chart components, if analytics are required.
- **Backend:** Python FastAPI or Django, depending on whether the existing team needs API-first services or a full batteries-included web framework.
- **Database:** PostgreSQL for multi-tenant business, menu, price-rule, event and quotation records.
- **Authentication:** established session/OAuth/identity approach; do not build insecure password handling from scratch.
- **File uploads:** validated image/document uploads with size/type limits and access controls.
- **Maps/distance:** Google Maps Routes API or another routing provider only if route-based distance is a confirmed requirement and the cost/terms fit.
- **Deployment/operations:** environment-specific secrets, backups, logging, error monitoring and database migrations.

This is a proposed stack, not a statement that the current prototype already uses it.

### Essential domain entities to consider

- `Business`
- `BusinessUser` / `Role`
- `Service`
- `Menu`
- `MenuItem`
- `MenuPackage`
- `PricingRule`
- `BusinessLocation`
- `ServiceArea`
- `Event` / `Enquiry`
- `Quotation`
- `QuotationLine`
- `TransportCharge`
- `Customer` (only if needed in the agreed phase)
- `Invoice` / `Payment` (only if included in scope)

Each business’s records must be isolated from other businesses. Multi-tenancy and authorization are production-critical; hiding another business’s data only in the frontend is not sufficient.

---

## 11. Small functions worth prototyping first

Choose a narrow function and test it with a real caterer before implementing a broad ERP.

1. **Menu item editor**
   - Add/edit dish name, category, unit, price and active status.
   - Validate required fields and numeric prices.
   - Import/export can be a later addition.

2. **Guest-count calculator**
   - Input guest count and per-person price.
   - Calculate subtotal transparently.
   - Test empty, zero, negative and very large inputs.

3. **Business-specific price rules**
   - Let each business set its own price and additional-charge rules.
   - Show the breakdown rather than only a final total.

4. **Distance surcharge calculator**
   - Input/resolve venue and business base location.
   - Obtain route distance if required.
   - Apply the caterer’s own configured rule.
   - Show the distance, rule and charge to the user for review.
   - Provide a safe manual fallback if routing fails.

5. **Quotation preview**
   - Display menu, guest count, price breakdown, optional charges, applicable taxes and total.
   - Print/export/share only after confirming the correct calculations and permissions.

6. **Event/booking calendar**
   - Start with date, event name, guest count and status.
   - Add conflict warnings only after defining what counts as a conflict.

7. **Business onboarding**
   - Guided steps for business profile, location, services, menu and pricing.
   - Save progress and make missing required fields visible.

8. **Dashboard**
   - Start with a few useful metrics that are backed by real data, such as upcoming events and quotations.
   - Avoid decorative charts with meaningless demo numbers in production.

---

## 12. Proof and evidence register

| Reference | What it supports | Evidence type | What it does not prove |
|---|---|---|---|
| CateringWaala website | Vendor-advertised bookings, menus, purchasing lists, vendors, invoices, expenses and reports | Public vendor product page | Independent quality, exact calculations, or our implementation |
| CateringWaala Google Play listing | Public description of catering app functions | App-store listing | That every feature works in all accounts/regions |
| CateringMenu Google Play listing | Public description of menus, quotations, invoices and payments | App-store listing | Product maturity or quality beyond the listing |
| MealPe website/product page | Institutional food operations, admin/vendor applications, billing and analytics | Public vendor product page | Fit for small wedding caterers |
| Cateringwaale/CW Partner | Business onboarding and partner-side operations | Public website and app listing | Availability of all features to every business |
| Ziyafat repository/demo | Code and demo reference for a catering workflow | Public repository/README and linked demo | Security, correctness, current deployment status or permission to reuse without licence review |
| MySagra repository/docs | Open-source event/food operations patterns | Public repository/docs | Direct equivalence to wedding catering quotations |
| shadcn/ui official blocks/docs | Copyable dashboard UI patterns and chart examples | Official docs/source | Fit without adapting to our existing stack |
| Spectrum UI docs | React/Tailwind component examples | Public docs | Licence/compatibility for every component |
| dashboardcn docs | Dashboard data visualisation patterns | Public docs | Production suitability without testing |
| Google Maps Routes API docs | Route distance/matrix capability and billing model | Official developer documentation | Final cost for our exact usage; calculate using current India pricing and projected request volume |

---

## 13. Recommended next steps

- [ ] Inspect the current FeastFlow HTML/prototype before choosing a stack or rewriting anything.
- [ ] Create a feature inventory: implemented, partially implemented, mock/demo-only, planned, missing.
- [ ] Compare each implemented feature against the requirements in this document.
- [ ] Select 3–5 real caterers and walk through their current quotation and transport-price workflow.
- [ ] Record their actual pricing rules; do not infer a universal per-kilometre rate.
- [ ] Build one narrow proof of concept: business-specific menu/pricing + quotation preview, then add distance surcharge only if validated.
- [ ] Use the linked products for workflow/UI reference; record the exact screen and interaction being studied.
- [ ] Verify licence and dependency terms before copying code.
- [ ] Keep Phase 1 claims separate from Phase 2 public discovery.

## 14. Quick links

- CateringWaala: https://cateringwaala.com/
- CateringWaala on Google Play: https://play.google.com/store/apps/details?id=com.cateringwaala.app
- CateringMenu on Google Play: https://play.google.com/store/apps/details?id=app.cateringmenu.in
- MealPe: https://mealpe.app/
- MealPe product: https://mealpe.app/product
- Cateringwaale: https://www.cateringwaale.com/
- CW Partner on Google Play: https://play.google.com/store/apps/details?id=com.cateringwale.restaurant.android
- Ziyafat GitHub: https://github.com/Mudassirkhan2/Ziyafat
- Ziyafat live demo: https://getziyafat.vercel.app
- MySagra GitHub: https://github.com/MySagra/mysagra
- MySagra docs: https://docs.mysagra.com/
- Event order system GitHub: https://github.com/mrckurz/order-system
- shadcn/ui dashboard blocks: https://ui.shadcn.com/blocks?category=dashboard
- shadcn/ui chart docs: https://ui.shadcn.com/docs/components/base/chart
- Spectrum UI docs: https://ui.spectrumhq.in/docs
- dashboardcn docs: https://dashboardcn.com/docs
- shadcn dashboard GitHub: https://github.com/towerneon/shadcndashboard-ui
- shadcn.io: https://www.shadcn.io/
- Google Maps Routes API billing: https://developers.google.com/maps/documentation/routes/usage-and-billing
- Google Maps route matrix guide: https://developers.google.cn/maps/documentation/routes/compute_route_matrix?hl=en
- Google Maps India pricing FAQ: https://developers.google.cn/maps/billing-and-pricing/india?hl=en
