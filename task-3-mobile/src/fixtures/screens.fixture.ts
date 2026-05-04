import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { test as base } from '@playwright/test';
import type { Browser } from 'webdriverio';
import { createDriver } from '@core/driver';
import { LoginScreen } from '@screens/login-screen';
import { ProfileScreen } from '@screens/profile-screen';
import { TutorialsScreen } from '@screens/tutorials-screen';
import { ActiveAssignmentScreen } from '@screens/active-assignment-screen';

/**
 * Drives a single Appium session per test plus an `adb screenrecord`
 * lifecycle that captures the device screen for the entire test and
 * attaches the resulting MP4 to the test report (Allure / HTML).
 *
 * `screenrecord` is a built-in Android utility — no extra deps, no host
 * permissions to manage. Time-limit defaults to 180 s (the device max);
 * for a 25 s spec that headroom is plenty.
 */
type MobileFixtures = {
  driver: Browser;
  loginScreen: LoginScreen;
  profileScreen: ProfileScreen;
  tutorialsScreen: TutorialsScreen;
  activeAssignmentScreen: ActiveAssignmentScreen;
};

const DEVICE_RECORD_PATH = '/sdcard/jitsu-test-recording.mp4';

function startScreenRecord(): ChildProcess {
  return spawn(
    'adb',
    ['shell', 'screenrecord', '--bit-rate', '4000000', '--time-limit', '180', DEVICE_RECORD_PATH],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

async function stopScreenRecord(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (proc.exitCode !== null) return resolve();
    proc.once('exit', () => resolve());
    // SIGINT lets screenrecord flush its mp4 trailer; SIGKILL would corrupt it.
    spawn('adb', ['shell', 'pkill', '-SIGINT', 'screenrecord']);
    setTimeout(() => resolve(), 4_000);
  });
}

export const test = base.extend<MobileFixtures>({
  driver: async ({}, use, testInfo) => {
    const recordingProc = startScreenRecord();
    const driver = await createDriver();
    let testFailed = false;
    try {
      await use(driver);
    } catch (e) {
      testFailed = true;
      throw e;
    } finally {
      await driver.deleteSession().catch(() => {});
      await stopScreenRecord(recordingProc);

      // Pull the video off the device and attach.
      const outDir = path.resolve(__dirname, '..', '..', 'recordings');
      fs.mkdirSync(outDir, { recursive: true });
      const localPath = path.join(outDir, `${testInfo.title.replace(/[^\w-]+/g, '_')}.mp4`);
      try {
        await new Promise<void>((resolve, reject) => {
          const p = spawn('adb', ['pull', DEVICE_RECORD_PATH, localPath]);
          p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`adb pull exited ${code}`))));
        });
        if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
          await testInfo.attach('screen-recording', {
            path: localPath,
            contentType: 'video/mp4',
          });
        }
      } catch (e) {
        console.warn('  failed to retrieve screen recording:', (e as Error).message);
      }
      // Suppress unused-var warning when the test passed.
      void testFailed;
    }
  },
  loginScreen: async ({ driver }, use) => {
    await use(new LoginScreen(driver));
  },
  profileScreen: async ({ driver }, use) => {
    await use(new ProfileScreen(driver));
  },
  tutorialsScreen: async ({ driver }, use) => {
    await use(new TutorialsScreen(driver));
  },
  activeAssignmentScreen: async ({ driver }, use) => {
    await use(new ActiveAssignmentScreen(driver));
  },
});

export { expect } from '@playwright/test';
