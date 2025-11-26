# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.8] - 2025-11-26

### Changed

- Enhanced TypeScript strictness with additional compiler options:
  - `noUncheckedIndexedAccess: true` - Forces checking if array/object access might be undefined
  - `exactOptionalPropertyTypes: true` - Stricter handling of optional properties
  - `noImplicitReturns: true` - All code paths must explicitly return
  - `noFallthroughCasesInSwitch: true` - Prevents switch fallthrough bugs
  - `verbatimModuleSyntax: true` - Stricter import/export syntax
  - `noUncheckedSideEffectImports: true` - Requires explicit side-effect imports
  - `moduleDetection: "force"` - Treats all files as modules
- Fixed drawer component to comply with stricter TypeScript rules
- Removed unused `@ts-expect-error` directives in drawer component

## [0.2.7] - 2025-11-25

### Changed

- Added console logging to `useTheme` toggle function for debugging

## [0.2.6] - 2025-11-25

### Fixed

- Improved `useTheme` hook reliability with refs to prevent stale closures
  - Added `storeRef` to always access current state
  - Added `isInternalUpdateRef` to distinguish internal vs external updates
  - Fixed localStorage parsing to use correct `parsed.value` property
  - Prevents duplicate state updates from custom events

## [0.2.5] - 2025-11-25

### Fixed

- Fixed `useTheme` hook toggle function not updating `data-theme` attribute
  - Moved localStorage save logic to effect to avoid race condition with event listeners
  - State updates now properly trigger theme changes on HTML element

## [0.2.4] - 2025-11-24

### Changed

- Renamed `toggleTheme` to `toggle` in `useTheme` hook for cleaner API

## [0.2.3] - 2025-11-24

### Changed

- Updated `useTheme` hook to automatically set `data-theme` attribute on `document.documentElement`
- Renamed internal store property from `theme` to `value` for better clarity
- Code cleanup in theme utility functions

## [0.2.2] - 2025-11-24

### Added

- Added `useTheme` hook for managing light/dark theme
  - Syncs with localStorage and across components using events
  - Provides `theme`, `isManual` state and `toggleTheme`, `update` functions
  - Available in `qstd/react`

## [0.2.1] - 2025-11-24

### Added

- Added `Log` utility module with logging functions
  - `log()` - Pretty print values with JSON.stringify
  - `info()` - Log with [info] prefix
  - `warn()` - Log with [warn] prefix
  - `error()` - Log with [error] prefix
  - Available in both `qstd/client` and `qstd/server`

## [0.2.0] - 2025-11-22

### Added

- Enhanced `center` utility to support directional centering
  - `center` - centers both axes (placeContent + placeItems)
  - `center="x"` - centers horizontally (justifyContent)
  - `center="y"` - centers vertically (alignItems)
- Added `prepare:local` convenience script for local testing workflow
- Updated DEVELOPMENT.md with local testing workflow using playground symbolic link

## [0.1.6] - Previous

### Added

- Initial package structure
- Shared utilities: List, Dict, Int, Money, Str, Time, Flow, Random
- Client utilities placeholder: Dom, Storage, Browser
- Server utilities placeholder: Fs, Env, Path
- React hooks placeholder: useDebounce, useToggle, useLocalStorage
- Panda CSS preset placeholder
- Block component placeholder
