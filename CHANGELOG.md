# CHANGELOG

## [1.0.1] - Bug Fix

### Fixed

- **Retry handling**: Fixed a bug where test retries would be reported multiple times. Now only the final result (after all retries) is included in the XML report, properly ignoring failed attempts that were successfully retried.

## [1.0.0] - Major Conversion to Playwright

This is a major version update that converts the entire package from Cypress to Playwright.

### Breaking Changes

- **Complete rewrite**: The package has been converted from a Cypress/Mocha reporter to a Playwright reporter
- **Package renamed**: `cypress-circleci-reporter` → `playwright-circleci-reporter`
- **New peer dependency**: Now requires `@playwright/test` instead of `mocha`
- **API changes**: Reporter now implements Playwright's `Reporter` interface instead of extending Mocha's reporter
- **Configuration changes**: Reporter options are now passed through `playwright.config.ts` instead of CLI reporter options
- **Test directory changes**: Example tests moved from `cypress/integration/` to `tests/`

### Migration Guide

1. Uninstall the old package: `npm uninstall cypress-circleci-reporter`
2. Install the new package: `npm install playwright-circleci-reporter @playwright/test --save-dev`
3. Update your `playwright.config.ts` to use the new reporter:
   ```typescript
   reporter: [['playwright-circleci-reporter', { resultsDir: './test_results/playwright' }]]
   ```
4. Update your CircleCI configuration to use Playwright's test sharding

---

For older changelog entries (v0.x), see the [releases page](../../releases).
