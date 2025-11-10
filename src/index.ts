import { create } from 'xmlbuilder2';
import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import stripAnsi from 'strip-ansi';

// A subset of invalid characters as defined in http://www.w3.org/TR/xml/#charsets that can occur in e.g. stacktraces
// regex lifted from https://github.com/MylesBorins/xml-sanitizer/ (licensed MIT)
const INVALID_CHARACTERS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007f-\u0084\u0086-\u009f\uD800-\uDFFF\uFDD0-\uFDFF\uFFFF\uC008]/g; // eslint-disable-line no-control-regex, max-len

function removeInvalidCharacters(input: string) {
  return input ? input.replace(INVALID_CHARACTERS_REGEX, '') : input;
}

function getClassname(test: TestCase): string {
  const titlePath = test.titlePath();
  // Remove the first element (file name) and join the rest
  return titlePath.slice(0, -1).join('.');
}

interface ReporterOptions {
  project?: string;
  resultsDir?: string;
  resultFileName?: string;
}

class PlaywrightCircleCIReporter implements Reporter {
  private startTime!: Date;
  private options: ReporterOptions;
  private root: any;
  private totalTests = 0;
  private totalFailures = 0;
  private totalSkipped = 0;
  private testResults: Map<TestCase, TestResult> = new Map();

  constructor(options: ReporterOptions = {}) {
    this.options = options;
  }

  onBegin(_config: FullConfig, _suite: Suite) {
    this.startTime = new Date();

    const resultFileName: string =
      this.options.resultFileName || 'playwright-[hash]';

    if (resultFileName.indexOf('[hash]') < 0) {
      throw new Error(`resultFileName must contain '[hash]'`);
    }

    this.root = create({ version: '1.0', encoding: 'UTF-8' }).ele(
      'testsuite',
      {
        name: 'playwright',
        timestamp: this.startTime.toISOString().slice(0, -5),
      }
    );
  }

  onTestBegin(_test: TestCase, _result: TestResult) {
    // Test is beginning, we'll handle it in onTestEnd
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.testResults.set(test, result);
    this.totalTests++;

    const testcaseAttrs = this.getTestcaseAttributes(test, result);

    if (result.status === 'passed') {
      this.root.ele('testcase', testcaseAttrs);
    } else if (result.status === 'failed') {
      this.totalFailures++;
      const testcaseEl = this.root.ele('testcase', testcaseAttrs);

      const error = result.error;
      let message = '';
      let stack = '';
      let errorType = '';

      if (error) {
        message = error.message || '';
        stack = error.stack || message;
        // Check for name property in error (may not be in the type definition but exists at runtime)
        errorType = (error as any).name || '';
      }

      testcaseEl
        .ele('failure', {
          message: removeInvalidCharacters(message) || '',
          type: errorType,
        })
        .ele({ $: removeInvalidCharacters(stack) });
    } else if (result.status === 'skipped') {
      this.totalSkipped++;
      this.root.ele('testcase', testcaseAttrs);
    } else if (result.status === 'timedOut') {
      this.totalFailures++;
      const testcaseEl = this.root.ele('testcase', testcaseAttrs);
      testcaseEl
        .ele('failure', {
          message: 'Test timeout',
          type: 'Timeout',
        })
        .ele({ $: 'Test exceeded timeout' });
    }
  }

  onEnd(_result: FullResult) {
    const duration = Date.now() - this.startTime.getTime();

    this.root.att('time', (duration / 1000).toFixed(4));
    this.root.att('tests', String(this.totalTests));
    this.root.att('failures', String(this.totalFailures));
    this.root.att('skipped', String(this.totalSkipped));

    const xmlText = this.root.end({ prettyPrint: true }).toString();

    const resultsDir: string =
      this.options.resultsDir || './test_results/playwright';
    const resultFileName: string =
      this.options.resultFileName || 'playwright-[hash]';

    const resultFilePath = path.join(resultsDir, `${resultFileName}.xml`);

    const finalPath = resultFilePath.replace(
      '[hash]',
      crypto.createHash('md5').update(xmlText).digest('hex')
    );

    const finalPathDir = path.dirname(finalPath);

    if (!fs.existsSync(finalPathDir)) {
      fs.mkdirSync(finalPathDir, { recursive: true });
    }
    fs.writeFileSync(finalPath, xmlText, 'utf-8');
  }

  private getTestcaseAttributes(test: TestCase, result: TestResult) {
    const projectPath = this.options.project || '';
    const filePath = test.location.file;
    const file = projectPath ? path.join(projectPath, filePath) : filePath;

    return {
      name: stripAnsi(test.title),
      file: file,
      time: (result.duration / 1000).toFixed(4),
      classname: stripAnsi(getClassname(test)),
    };
  }
}

export default PlaywrightCircleCIReporter;
module.exports = PlaywrightCircleCIReporter;
