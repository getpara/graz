---
"graz": patch
---

Updated Para wallet integration with clearer error messages for missing packages. Removed dynamic connector imports and related configs. Added bundler configuration guidance to docs for non-Para wallet users. Cleaned up package.json by removing Para packages as optional peer dependencies to prevent bundlers from auto-installing them. Improved disable() call to be less aggressive—absence of connector now implies disabled state.
