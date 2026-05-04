import { test, TestInfo } from '@playwright/test';
import type { Browser } from 'webdriverio';

/**
 * `test.step` wrapper that screenshots the current Appium frame after
 * each step. The screenshot is captured via WebdriverIO's
 * `takeScreenshot()` (returns a base64 PNG) and attached to the test
 * info — Allure picks it up automatically alongside the step.
 */
export async function stepWithSnap<T>(
  driver: Browser,
  name: string,
  body: () => Promise<T>,
): Promise<T> {
  return test.step(name, async () => {
    try {
      return await body();
    } finally {
      const info: TestInfo | undefined = test.info();
      const b64 = await driver.takeScreenshot().catch(() => null);
      if (b64 && info) {
        await info.attach(name, { body: Buffer.from(b64, 'base64'), contentType: 'image/png' });
      }
    }
  });
}
