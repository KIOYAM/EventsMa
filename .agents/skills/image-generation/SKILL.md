---
name: image-generation
description: "Banana / Gemini image generation: custom hero images / product visuals generated per page, saved into assets/, linked in code."
---

# Image Generation — Banana / Gemini

When building a page, generate custom visuals instead of stock placeholders:

- One hero image / product visual per page, prompted from page content + brand tokens.
- Save into assets/images/ (AVIF then WebP, optimized); link from code.
- Alt text always: descriptive, no keyword stuffing.
- Fallback: colored SVG placeholder with the correct aspect ratio until the generated image lands.
- No generated image contains money figures, PII, or fake quotes/reviews.
