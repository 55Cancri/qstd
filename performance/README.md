# TypeScript Performance Testing

This directory contains tools and documentation for testing and monitoring TypeScript compilation and editor performance in qstd.

## Files

- **TYPESCRIPT_PERFORMANCE.md** - Comprehensive testing guide and procedures
- **PERFORMANCE_TEST_SUMMARY.md** - Initial baseline test results and summary
- **analyze-tsserver.sh** - Automated script for analyzing TSServer logs
- **ts-trace/** - Generated trace files (gitignored)

## Quick Start

```bash
# Run performance diagnostics
pnpm typecheck:perf

# Generate trace for Perfetto viewer
pnpm typecheck:trace

# Analyze TSServer editor logs
pnpm analyze:tsserver
```

## When to Use

- After adding new Block variants or props
- After significant type refactoring
- Before npm publish (recommended)
- If users report editor slowness
- After upgrading TypeScript version

## Current Status

**Last Test:** October 3, 2025  
**Status:** ✅ EXCELLENT

- Compiler: ~3.3s
- Memory: 564 MB
- Types: 88,787
- Hover: 12ms avg

See [TYPESCRIPT_PERFORMANCE.md](./TYPESCRIPT_PERFORMANCE.md) for full documentation.
