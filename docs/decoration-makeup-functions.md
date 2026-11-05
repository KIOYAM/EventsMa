# Decoration Service Functions

Complete list of functions required for the independent Decoration service module in EventsMa.

## A. Service Registry & Configuration

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `enableDecorationService(orgId)` | Register decoration as an enabled service for an organisation | orgId | businessServices row |
| `disableDecorationService(orgId)` | Turn off decoration service | orgId | Updated businessServices row |
| `getDecorationConfig(orgId)` | Read decoration configuration (setup window, teardown policy, site requirements, flower policy) | orgId | config JSONB |
| `updateDecorationConfig(orgId, config)` | Save decoration-specific settings | orgId, config fields | Updated config JSONB |

## B. Decoration Catalogue

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `createDecorationItem(orgId, item)` | Add a decoration catalogue item (backdrop, lighting, floral, prop) | orgId, name, category, unitClass, price, unitLabel, attrs, imagePath | serviceItems row |
| `updateDecorationItem(itemId, updates)` | Edit an existing decoration item | itemId, updates | Updated serviceItems row |
| `deleteDecorationItem(itemId)` | Remove a decoration item (soft delete via active flag) | itemId | Updated serviceItems row |
| `listDecorationItems(orgId, activeOnly)` | List all decoration items for an org | orgId, activeOnly | serviceItems[] |
| `createDecorationCategory(orgId, category)` | Add a decoration category (Stage, Mandap, Floral, Lighting, Entrance, etc.) | orgId, name, description | menuCategories row |
| `listDecorationCategories(orgId)` | List all decoration categories | orgId | menuCategories[] |
| `assignItemToCategory(itemId, categoryId)` | Link a decoration item to a category | itemId, categoryId | menuItemCategories row |

## C. Decoration Design Planner

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `createDecorationArea(orgId, eventId, area)` | Create a decoration area for an event (stage, entrance, dining, outdoor) | orgId, eventId, name, areaType, dimensions, setupNotes | decorationAreas row |
| `updateDecorationArea(areaId, updates)` | Edit area details | areaId, updates | Updated decorationAreas row |
| `deleteDecorationArea(areaId)` | Remove an area | areaId | Deleted decorationAreas row |
| `listDecorationAreas(orgId, eventId)` | List all areas for an event | orgId, eventId | decorationAreas[] |
| `createDecorationSetup(orgId, eventId, setup)` | Schedule installation/dismantling for an area | orgId, eventId, areaId, setupStart, setupEnd, teardownStart, teardownEnd, crewAssigned | decorationSetups row |
| `updateDecorationSetup(setupId, updates)` | Edit setup timing or crew | setupId, updates | Updated decorationSetups row |
| `listDecorationSetups(orgId, eventId)` | List all setups for an event | orgId, eventId | decorationSetups[] |
| `markDecorationSetupComplete(setupId)` | Mark setup/dismantling as complete | setupId | Updated decorationSetups row |

## D. Decoration Materials Inventory

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `createDecorationMaterial(orgId, material)` | Add reusable/consumable decoration material | orgId, name, category, unit, quantity, costPerUnit, supplier | decorationMaterials row |
| `updateDecorationMaterial(materialId, updates)` | Edit material details or stock | materialId, updates | Updated decorationMaterials row |
| `listDecorationMaterials(orgId, category)` | List materials, optionally filtered by category | orgId, category | decorationMaterials[] |
| `reserveDecorationMaterial(materialId, quantity)` | Reserve material for an event (reduce available stock) | materialId, quantity | Updated decorationMaterials row |
| `releaseDecorationMaterial(materialId, quantity)` | Release reserved material back to stock | materialId, quantity | Updated decorationMaterials row |

## E. Decoration Customer-Facing (Share Link)

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `getDecorationShareData(eventId)` | Get decoration areas and items for public share page | eventId | decorationAreas[], serviceItems[] |
| `submitDecorationSelection(enquiryId, selections)` | Save customer's decoration choices | enquiryId, selections (area selections, item quantities) | shareSubmissionServices row |

## F. Decoration Financials

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `calculateDecorationQuote(orgId, eventId, selections)` | Compute decoration subtotal with tax | orgId, eventId, item selections | subtotalPaise, taxPaise, totalPaise |
| `getDecorationMargin(orgId, eventId)` | Compute decoration profit margin | orgId, eventId | marginPaise, marginBp |
| `createDecorationInvoiceLine(quoteVersionId, item)` | Add decoration line to a quotation version | quoteVersionId, item details | quotationLines row |

## G. Decoration Operations

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `assignDecorationCrew(eventId, crewMember, role)` | Assign decorator/technician to event | eventId, membershipId, roleLabel | eventStaff row |
| `getDecorationSetupSchedule(orgId, dateRange)` | List all setup/dismantling schedules | orgId, dateRange | decorationSetups[] |
| `checkDecorationAvailability(orgId, date)` | Check if decoration crew is available on a date | orgId, date | boolean, availableSlots |
| `uploadDecorationSetupPhoto(setupId, imagePath)` | Upload before/after setup photo | setupId, imagePath | documents row |
| `getDecorationApprovalStatus(eventId)` | Check if customer approved decoration design | eventId | boolean (approved/pending) |
| `approveDecorationDesign(eventId)` | Mark decoration design as customer-approved | eventId | Updated event record |

---

# Makeup & Beauty Service Functions

Complete list of functions required for the independent Makeup & Beauty service module in EventsMa.

## A. Service Registry & Configuration

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `enableMakeupService(orgId)` | Register makeup as an enabled service | orgId | businessServices row |
| `disableMakeupService(orgId)` | Turn off makeup service | orgId | Updated businessServices row |
| `getMakeupConfig(orgId)` | Read makeup configuration (makeup styles, trial duration, travel fee, service locations) | orgId | config JSONB |
| `updateMakeupConfig(orgId, config)` | Save makeup-specific settings | orgId, config fields | Updated config JSONB |

## B. Makeup Artist Management

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `createMakeupArtist(orgId, artist)` | Add a makeup artist profile | orgId, name, phone, email, skills, specializations, portfolioPath, ratePerHour, travelFee | makeupArtists row |
| `updateMakeupArtist(artistId, updates)` | Edit artist profile or rates | artistId, updates | Updated makeupArtists row |
| `deactivateMakeupArtist(artistId)` | Deactivate an artist (soft delete) | artistId | Updated makeupArtists row |
| `listMakeupArtists(orgId, activeOnly)` | List makeup artists for an org | orgId, activeOnly | makeupArtists[] |
| `getMakeupArtistAvailability(artistId, dateRange)` | Check artist availability for appointments | artistId, dateRange | Available time slots |
| `checkMakeupArtistConflict(artistId, startTime, endTime)` | Prevent double-booking an artist | artistId, startTime, endTime | boolean (conflict) |

## C. Makeup Catalogue & Packages

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `createMakeupPackage(orgId, package)` | Add a makeup package (bridal, party, engagement, custom) | orgId, name, style, images, inclusions, duration, price, taxRate | serviceItems row with attrs |
| `updateMakeupPackage(packageId, updates)` | Edit a makeup package | packageId, updates | Updated serviceItems row |
| `deleteMakeupPackage(packageId)` | Remove a makeup package | packageId | Updated serviceItems row (active=false) |
| `listMakeupPackages(orgId)` | List all makeup packages | orgId | serviceItems[] (verticalKey=makeup) |

## D. Makeup Trials & Appointments

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `scheduleMakeupAppointment(orgId, appointment)` | Book a makeup appointment (bridal, party, trial, day-of) | orgId, artistId, clientName, serviceType, start, end, location, travelRequired | makeupAppointments row |
| `updateMakeupAppointment(appointmentId, updates)` | Edit appointment time, artist, or status | appointmentId, updates | Updated makeupAppointments row |
| `cancelMakeupAppointment(appointmentId)` | Cancel an appointment | appointmentId | Updated makeupAppointments row |
| `listMakeupAppointments(orgId, dateRange)` | List appointments for an org | orgId, dateRange | makeupAppointments[] |
| `getMakeupAppointmentConflicts(artistId, startTime, endTime)` | Check for overlapping appointments | artistId, startTime, endTime | makeupAppointments[] (conflicts) |
| `scheduleMakeupTrial(orgId, trial)` | Book a pre-event makeup trial | orgId, artistId, clientName, trialDate, style | makeupTrials row |
| `approveMakeupTrial(trialId)` | Mark a trial as approved by customer | trialId | Updated makeupTrials row |
| `rejectMakeupTrial(trialId)` | Mark a trial as rejected | trialId | Updated makeupTrials row |
| `listMakeupTrials(orgId, eventId)` | List trials for an org or event | orgId, eventId | makeupTrials[] |

## E. Makeup Customer-Facing (Share Link)

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `getMakeupShareData(eventId)` | Get makeup packages and artist info for public share page | eventId | serviceItems[] (makeup), makeupArtists[] |
| `submitMakeupSelection(enquiryId, selections)` | Save customer's makeup choices | enquiryId, selections (package, artist preference, trial date, number of people) | shareSubmissionServices row |
| `selectMakeupArtist(enquiryId, artistId, appointmentTime)` | Customer selects preferred artist and time | enquiryId, artistId, appointmentTime | Updated shareSubmissionServices row |

## F. Makeup Financials

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `calculateMakeupQuote(orgId, eventId, selections)` | Compute makeup subtotal (package prices + travel fees + artist fees) | orgId, eventId, selections | subtotalPaise, taxPaise, totalPaise |
| `getMakeupMargin(orgId, eventId)` | Compute makeup profit margin (revenue - artist commissions - product costs) | orgId, eventId | marginPaise, marginBp |
| `calculateMakeupArtistCommission(appointmentId, commissionRate)` | Compute artist commission for an appointment | appointmentId, commissionRate | commissionPaise |
| `createMakeupInvoiceLine(quoteVersionId, item)` | Add makeup line to a quotation version | quoteVersionId, item details | quotationLines row |

## H. Makeup Operations

| Function | Purpose | Inputs | Output |
|----------|---------|--------|--------|
| `assignMakeupArtist(eventId, artistId, clientName, serviceType)` | Assign a specific artist to a client for an event | eventId, artistId, clientName, serviceType | makeupAppointments row |
| `getMakeupCalendar(orgId, dateRange)` | List all makeup appointments across artists | orgId, dateRange | makeupAppointments[] |
| `getMakeupArtistSchedule(artistId, dateRange)` | Get one artist's appointments | artistId, dateRange | makeupAppointments[] |
| `checkInMakeupArtist(appointmentId)` | Mark artist as arrived for appointment | appointmentId | Updated makeupAppointments row |
| `completeMakeupAppointment(appointmentId)` | Mark appointment as completed | appointmentId | Updated makeupAppointments row |
| `uploadMakeupReferencePhoto(trialId, imagePath)` | Upload customer reference photo for trial | trialId, imagePath | documents row |
| `getMakeupProductPreferences(orgId)` | List preferred makeup brands/products | orgId | config JSONB (from makeup config) |

## I. Shared with Other Services (Reused Infrastructure)

| Function | Purpose | Shared With |
|----------|---------|-------------|
| `createQuotation(orgId, eventId, serviceLines)` | Create a quotation with makeup lines alongside catering/decor/photography | All services |
| `createInvoiceFromQuotation(quotationId)` | Raise an invoice from an accepted makeup quotation | All services |
| `recordMakeupPayment(eventId, amount, mode, reference)` | Record manual payment for makeup services | All services |
| `sendMakeupQuoteNotification(orgId, quoteId, customerEmail)` | Send quote share notification via email | All services (uses Resend) |
| `getMakeupAuditTrail(orgId, dateRange)` | View all makeup configuration changes | All services (audit_events table) |

## J. Key Constraints & Business Rules

| Rule | Description |
|----------|-------------|
| **No double-booking** | One artist cannot have overlapping appointments. The system checks `appointmentStart`/`appointmentEnd` overlaps before inserting. |
| **Artist capacity** | An artist can only handle one client at a time unless configured as a team-based arrangement. |
| **Trial before day-of** | Bridal makeup day-of typically requires a prior trial; the system can enforce this as a business rule. |
| **Travel fee** | Configurable flat travel fee per artist, applied when `travelRequired = true`. |
| **Service location** | Makeup can be at home, venue, studio, or custom location - stored as text, not constrained. |
| **Customer approval** | Makeup style must be approved by customer before day-of appointment is finalised. |

---
