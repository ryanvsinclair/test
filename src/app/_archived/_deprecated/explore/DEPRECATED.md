# DEPRECATED: /explore

**Date deprecated:** 2024
**Reason:** Architectural consolidation

## Why this was deprecated

The application originally had two marketplace surfaces:
- `/explore` - Public, non-authenticated browse
- `/buyer/browse` - Authenticated browse with personalization

This split created unnecessary complexity:
- Duplicate marketplace logic
- Confusing navigation for users
- Auth/routing complexity
- Two paths to maintain

## New architecture

`/browse` is now the SINGLE canonical marketplace page:
- Accessible to everyone (logged out and logged in)
- SEO-friendly and public
- Auth ONLY affects UI interactions and ranking, not visibility
- Personalization applied when authenticated
- Simpler navigation model

## Migration

All references to `/explore` have been replaced with `/browse`:
- Navigation links
- Redirects
- Post-login flows
- Documentation

The original implementation is preserved here for reference.
