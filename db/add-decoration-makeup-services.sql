-- =============================================================================
-- Add Decoration and Makeup Services for EventsMa
-- Owner: run these in Supabase SQL Editor (or via db/setup.mjs)
-- org_id: kannan-events = 247a8ded-810d-4b4f-9f11-97c823b61396
-- =============================================================================

-- 1. ADD MENU CATEGORIES (decoration + makeup)
-- Run this to add the category vocabulary for both service types

-- ===============================================
-- DECORATION CATEGORIES
-- ===============================================
INSERT INTO menu_categories (org_id, name, description, sortOrder, active)
VALUES
  -- Decoration categories
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Backdrop & Lighting', 'Backdrops, drapes, lighting rigs', 1, true),
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Floral & Centerpieces', 'Fresh flowers, arrangements, centerpieces', 2, true),
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Props & Accessories', 'Supplementary decor items, signage', 3, true);

-- ===============================================
-- MAKEUP CATEGORIES
-- ===============================================
INSERT INTO menu_categories (org_id, name, description, sortOrder, active)
VALUES
  -- Makeup categories
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Bridal Makeup', 'Bride\'s makeup trial and day-of', 1, true),
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Bridal Party', 'Hair/styling for bridal party members', 2, true),
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Hair Styling', 'General hair styling services', 3, true);

-- 2. ADD SERVICE ITEMS (the actual offerings)
-- These are the specific decoration/makeup services with pricing
-- Run this to add the service inventory

-- ===============================================
-- DECORATION SERVICE ITEMS
-- ===============================================
INSERT INTO service_items (org_id, name, price_paise, unit_class, active, sortOrder)
VALUES
  -- Backdrop & Lighting
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Gold backdrop 3×5 ft', 500000, 'PER_UNIT', true, 1), -- ₹5,000
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'White backdrop 3×5 ft', 400000, 'PER_UNIT', true, 2), -- ₹4,000
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'LED string lights (per string)', 150000, 'PER_UNIT', true, 3), -- ₹1,500
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Chandelier rental', 800000, 'PER_UNIT', true, 4), -- ₹8,000
  -- Floral & Centerpieces
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'White floral arch', 800000, 'PER_UNIT', true, 5), -- ₹8,000
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Rose centerpiece (per table)', 250000, 'PER_PLATE', true, 6), -- ₹2,500
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Mixed flower bouquet', 400000, 'PER_UNIT', true, 7), -- ₹4,000
  -- Props & Accessories
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Easel with signage', 100000, 'PER_UNIT', true, 8), -- ₹1,000
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'VIP rope stanchion set', 200000, 'PER_UNIT', true, 9), -- ₹2,000

-- ===============================================
-- MAKEUP SERVICE ITEMS
-- ===============================================
INSERT INTO service_items (org_id, name, price_paise, unit_class, active, sortOrder)
VALUES
  -- Bridal Makeup
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Bridal makeup trial', 350000, 'PER_GUEST', true, 1), -- ₹3,500
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Bridal makeup day-of', 600000, 'PER_GUEST', true, 2), -- ₹6,000
  -- Bridal Party
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Party hair styling', 200000, 'PER_GUEST', true, 3), -- ₹2,000
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Bridal party makeup', 300000, 'PER_GUEST', true, 4), -- ₹3,000
  -- Hair Styling
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Updo styling', 250000, 'PER_GUEST', true, 5), -- ₹2,500
  ('247a8ded-810d-4b4f-9f11-97c823b61396', 'Hair trial session', 350000, 'PER_GUEST', true, 6); -- ₹3,500

-- 3. CREATE CATEGORY SELECTION RULES
-- These link sessions to categories with min/max selection limits
-- Run this AFTER the above items are inserted

-- ===============================================
-- DECORATION SELECTION RULES
-- ===============================================
-- Note: You need the session IDs and category IDs from steps 1 & 2
-- Example pattern (replace IDs with actual DB-generated IDs):

-- Session "Pre-ceremony" × "Backdrop & Lighting": min 1, max 1
-- INSERT INTO category_selection_rules (org_id, session_id, category_id, minSelections, maxSelections, required, pricingMode)
-- VALUES
--   ('247a8ded-810d-4b4f-9f11-97c823b61396', '<pre-ceremony-session-id>', '<backdrop-category-id>', 1, 1, true, 'per_unit'),
--   ('247a8ded-810d-4b4f-9f11-97c823b61396', '<pre-ceremony-session-id>', '<floral-category-id>', 2, 5, true, 'per_unit'),
--   ('247a8ded-810d-4b4f-9f11-97c823b61396', '<reception-session-id>', '<props-category-id>', 0, 3, false, 'per_unit');

-- ===============================================
-- MAKEUP SELECTION RULES
-- ===============================================
-- Example pattern (replace IDs with actual DB-generated IDs):

-- Session "Trial" × "Bridal Makeup": min 1, max 1
-- INSERT INTO category_selection_rules (org_id, session_id, category_id, minSelections, maxSelections, required, pricingMode)
-- VALUES
--   ('247a8ded-810d-4b4f-9f11-97c823b61396', '<trial-session-id>', '<bridal-makeup-category-id>', 1, 1, true, 'per_guest'),
--   ('247a8ded-810d-4b4f-9f11-97c823b61396', '<day-of-session-id>', '<bridal-party-category-id>', 0, 5, false, 'per_guest');

-- =============================================================================
-- NEXT STEPS FOR OWNER:
-- 1. Run steps 1 & 2 in Supabase SQL Editor
-- 2. Query the new IDs: SELECT id, name FROM menu_categories WHERE org_id='247a8ded-810d-4b4f-9f11-97c823b61396';
--    SELECT id, name, price_paise FROM service_items WHERE org_id='247a8ded-810d-4b4f-9f11-97c823b61396';
-- 3. Replace the placeholder IDs in step 3 with actual DB IDs
-- 4. The /share/[slug] page will automatically show these categories with average pricing
-- 5. Clients can submit choices → owner reviews → generates quotation
-- =============================================================================