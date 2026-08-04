# Monorepo Migration

This package is planned for consolidation into the sathergate-toolkit Turborepo monorepo.

## Planned Changes
- Package will live under packages/{npm-name}/ in the monorepo
- tsconfig.json will extend the monorepo's shared base config
- Build orchestration will move to Turborepo (`turbo run build`)
- Shared devDependencies will be hoisted to the monorepo root

## Monorepo Structure
packages/
  shutterbox/      (darkroom)
  flagpost/        (flagpost)
  ratelimit-next/  (floodgate)
  notifykit/       (herald)
  croncall/        (clocktower)
  vaultbox/        (lockbox)
  sifter-next/     (Sifter)
