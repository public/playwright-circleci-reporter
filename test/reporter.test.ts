import 'jest-xml-matcher';
import { advanceTo, advanceBy } from 'jest-date-mock';
import type { TestCase, TestResult, FullConfig, Suite } from '@playwright/test/reporter';
import fs from 'fs';

import PlaywrightCircleCIReporter from '../src';

function formatDuration(duration: number) {
  return (duration / 1000).toFixed(4);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, -5);
}

// Mock objects for Playwright reporter
function createMockConfig(): FullConfig {
  return {
    rootDir: '/test',
    forbidOnly: false,
    fullyParallel: false,
    globalSetup: null,
    globalTeardown: null,
    globalTimeout: 0,
    grep: /.*/,
    grepInvert: null,
    maxFailures: 0,
    metadata: {},
    preserveOutput: 'always',
    projects: [],
    reporter: [],
    reportSlowTests: null,
    quiet: false,
    shard: null,
    updateSnapshots: 'missing',
    updateSourceMethod: 'overwrite',
    version: '1.0.0',
    workers: 1,
    webServer: null,
  } as FullConfig;
}

function createMockTestCase(
  title: string,
  titlePath: string[],
  file: string
): TestCase {
  return {
    title,
    titlePath: () => titlePath,
    location: { file, line: 1, column: 1 },
    parent: {} as Suite,
    ok: () => true,
    outcome: () => 'expected',
    expectedStatus: 'passed',
    id: '',
    repeatEachIndex: 0,
    retries: 0,
    results: [],
    annotations: [],
    tags: [],
    timeout: 30000,
    type: 'test',
  } as TestCase;
}

function createMockTestResult(
  status: 'passed' | 'failed' | 'skipped' | 'timedOut',
  duration: number,
  error?: { message: string; stack?: string; name?: string }
): TestResult {
  return {
    status,
    duration,
    error,
    attachments: [],
    annotations: [],
    errors: error ? [error] : [],
    retry: 0,
    parallelIndex: 0,
    startTime: new Date(),
    steps: [],
    stdout: [],
    stderr: [],
    workerIndex: 0,
  } as TestResult;
}

function createMockSuite(): Suite {
  return {
    title: '',
    allTests: () => [],
    entries: () => [],
    location: undefined,
    parent: undefined,
    project: () => undefined,
    suites: [],
    tests: [],
    titlePath: () => [],
    type: 'project',
  } as Suite;
}

describe('reporter', () => {
  beforeEach(() => {
    const directory = `./test_results/playwright`;
    if (fs.existsSync(directory)) {
      fs.rmdirSync(directory, { recursive: true });
    }
  });

  it('creates proper xml for test run', () => {
    const startDate = new Date();
    const startDateISO = formatDate(startDate);
    advanceTo(startDate);

    const testDuration = 200;
    const testFile = 'path/to/file.spec.ts';

    const reporter = new PlaywrightCircleCIReporter();
    const config = createMockConfig();
    const suite = createMockSuite();

    reporter.onBegin(config, suite);

    // Test 1: Pass
    const test1 = createMockTestCase('test1', ['root', 'test1'], testFile);
    const result1 = createMockTestResult('passed', 1200);
    reporter.onTestEnd(test1, result1);

    // Test 2: Fail with message
    const test2 = createMockTestCase('test2', ['root', 'test2'], testFile);
    const result2 = createMockTestResult('failed', 2500, {
      name: 'TestError',
      message: 'some test message',
    });
    reporter.onTestEnd(test2, result2);

    // Test 3: Fail with stack
    const test3 = createMockTestCase('test3', ['root', 'test3'], testFile);
    const result3 = createMockTestResult('failed', 3500, {
      stack: 'some test stack',
      message: '',
      name: '',
    });
    reporter.onTestEnd(test3, result3);

    // Test 4: Skipped
    const test4 = createMockTestCase('test4', ['root', 'test4'], testFile);
    const result4 = createMockTestResult('skipped', 1500);
    reporter.onTestEnd(test4, result4);

    // Test 5: Nested suite
    const test5 = createMockTestCase('test5', ['root', 'nested', 'test5'], testFile);
    const result5 = createMockTestResult('passed', 1200);
    reporter.onTestEnd(test5, result5);

    advanceBy(testDuration);

    reporter.onEnd({ 
      status: 'passed',
      startTime: startDate,
      duration: testDuration
    });

    const testRunDurationFormatted = formatDuration(testDuration);
    const test1DurationFormatted = formatDuration(result1.duration);
    const test2DurationFormatted = formatDuration(result2.duration);
    const test3DurationFormatted = formatDuration(result3.duration);
    const test4DurationFormatted = formatDuration(result4.duration);
    const test5DurationFormatted = formatDuration(result5.duration);

    const files = fs.readdirSync('./test_results/playwright');
    const actualXML = fs.readFileSync(
      `./test_results/playwright/${files[0]}`,
      'utf-8'
    );
    const expectedXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <testsuite name="playwright" timestamp="${startDateISO}" time="${testRunDurationFormatted}" tests="5" failures="2" skipped="1">
        <testcase name="${test1.title}" file="${testFile}" time="${test1DurationFormatted}" classname="root"/>
        <testcase name="${test2.title}" file="${testFile}" time="${test2DurationFormatted}" classname="root">
          <failure message="some test message" type="TestError">
            <![CDATA[some test message]]>
          </failure>
        </testcase>
        <testcase name="${test3.title}" file="${testFile}" time="${test3DurationFormatted}" classname="root">
          <failure message="" type="">
            <![CDATA[some test stack]]>
          </failure>
        </testcase>
        <testcase name="${test4.title}" file="${testFile}" time="${test4DurationFormatted}" classname="root"/>
        <testcase name="${test5.title}" file="${testFile}" time="${test5DurationFormatted}" classname="root.nested"/>
      </testsuite>`;

    expect(actualXML).toEqualXML(expectedXML);
  });

  it('creates proper xml with project path passed', () => {
    const startDate = new Date();
    const startDateISO = formatDate(startDate);
    advanceTo(startDate);

    const testDuration = 200;
    const testFile = 'path/to/file.spec.ts';

    const reporter = new PlaywrightCircleCIReporter({
      project: 'spec',
    });
    const config = createMockConfig();
    const suite = createMockSuite();

    reporter.onBegin(config, suite);

    const test1 = createMockTestCase('test1', ['root', 'test1'], testFile);
    const result1 = createMockTestResult('passed', 1200);
    reporter.onTestEnd(test1, result1);

    advanceBy(testDuration);

    reporter.onEnd({ 
      status: 'passed',
      startTime: startDate,
      duration: testDuration
    });

    const testRunDurationFormatted = formatDuration(testDuration);
    const test1DurationFormatted = formatDuration(result1.duration);

    const files = fs.readdirSync('./test_results/playwright');
    const actualXML = fs.readFileSync(
      `./test_results/playwright/${files[0]}`,
      'utf-8'
    );
    const expectedXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <testsuite name="playwright" timestamp="${startDateISO}" time="${testRunDurationFormatted}" tests="1" failures="0" skipped="0">
        <testcase name="${test1.title}" file="spec/${testFile}" time="${test1DurationFormatted}" classname="root"/>
      </testsuite>`;

    expect(actualXML).toEqualXML(expectedXML);
  });

  it(`throws error if 'resultFileName' does not contain '[hash]'`, () => {
    expect(() => {
      const reporter = new PlaywrightCircleCIReporter({
        resultFileName: 'playwright',
      });
      const config = createMockConfig();
      const suite = createMockSuite();
      reporter.onBegin(config, suite);
    }).toThrow();
  });

  it('only reports final result after retries, ignoring failed attempts', () => {
    const startDate = new Date();
    const startDateISO = formatDate(startDate);
    advanceTo(startDate);

    const testDuration = 200;
    const testFile = 'path/to/file.spec.ts';

    const reporter = new PlaywrightCircleCIReporter();
    const config = createMockConfig();
    const suite = createMockSuite();

    reporter.onBegin(config, suite);

    // Test 1: Fails first, then passes on retry
    const test1 = createMockTestCase('test1', ['root', 'test1'], testFile);
    
    // First attempt - failed
    const result1Failed = createMockTestResult('failed', 1200, {
      name: 'Error',
      message: 'first attempt failed',
      stack: 'Error: first attempt failed',
    });
    reporter.onTestEnd(test1, result1Failed);
    
    // Retry - passed (this should overwrite the failed result)
    const result1Passed = createMockTestResult('passed', 1000);
    reporter.onTestEnd(test1, result1Passed);

    // Test 2: Passes on first attempt
    const test2 = createMockTestCase('test2', ['root', 'test2'], testFile);
    const result2 = createMockTestResult('passed', 2000);
    reporter.onTestEnd(test2, result2);

    advanceBy(testDuration);

    reporter.onEnd({ 
      status: 'passed',
      startTime: startDate,
      duration: testDuration
    });

    const testRunDurationFormatted = formatDuration(testDuration);
    const test1DurationFormatted = formatDuration(result1Passed.duration);
    const test2DurationFormatted = formatDuration(result2.duration);

    const files = fs.readdirSync('./test_results/playwright');
    const actualXML = fs.readFileSync(
      `./test_results/playwright/${files[0]}`,
      'utf-8'
    );
    
    // Should only have 2 tests, both passed, 0 failures
    const expectedXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <testsuite name="playwright" timestamp="${startDateISO}" time="${testRunDurationFormatted}" tests="2" failures="0" skipped="0">
        <testcase name="${test1.title}" file="${testFile}" time="${test1DurationFormatted}" classname="root"/>
        <testcase name="${test2.title}" file="${testFile}" time="${test2DurationFormatted}" classname="root"/>
      </testsuite>`;

    expect(actualXML).toEqualXML(expectedXML);
  });
});
