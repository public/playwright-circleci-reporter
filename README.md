# playwright-circleci-reporter

![CircleCI](https://img.shields.io/circleci/build/github/ksocha/playwright-circleci-reporter?style=flat-square)
![npm](https://img.shields.io/npm/v/playwright-circleci-reporter?style=flat-square)
![GitHub](https://img.shields.io/github/license/ksocha/playwright-circleci-reporter?style=flat-square)

Playwright test reporter for CircleCI that generates JUnit XML reports. Helps with test parallelization.

## Requirements

- Playwright 1.0.0 or newer

## Installation

```shell
$ npm install playwright-circleci-reporter @playwright/test --save-dev
```

```shell
$ yarn add playwright-circleci-reporter @playwright/test --dev
```

## Usage

After installing the reporter, you'll need to configure it in your `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['playwright-circleci-reporter', {
      resultsDir: './test_results/playwright',
      resultFileName: 'playwright-[hash]'
    }]
  ],
  // ... other config
});
```

### CircleCI config example

```yaml
run_playwright_tests:
  parallelism: 3        # or any other number that suits your needs
  steps:
    # some previous steps

    - run:
        name: Run playwright tests
        command: yarn playwright test --shard=$(expr $CIRCLE_NODE_INDEX + 1)/$CIRCLE_NODE_TOTAL

    - store_test_results:
        path: test_results
    - store_artifacts:
        path: test_results
```

First test run with this config should create and store reports for each test file. These will be used during next runs to determine timings of each test. CircleCI will then split the test files between available containers to speed up the process.

### Configuration options

Options can be passed to the reporter through the reporter configuration in `playwright.config.ts`.

Example:
```typescript
reporter: [
  ['playwright-circleci-reporter', {
    resultsDir: './results/playwright',
    resultFileName: 'result-[hash]'
  }]
]
```

| Parameter      | Default                      | Effect                                                                                                                                                                          |
| -------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| project        | `undefined`                  | If you use a custom project path, this should be set to the same value.                                                                                                        |
| resultsDir     | `./test_results/playwright`  | Name of the directory that reports will be saved into.                                                                                                                          |
| resultFileName | `playwright-[hash]`          | Name of the file that will be created for each test run. Must include `[hash]` string as each spec file is processed completely separately during each test run.               |
