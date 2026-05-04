import path from 'path';
import { remote, Browser } from 'webdriverio';

/**
 * Build a WebdriverIO Browser session against a local Appium 2 server with
 * the UiAutomator2 driver. The APK is expected at `apps/jitsu-driver.apk`
 * unless `APP_PATH` is set in the env.
 *
 * Returns a `Browser` (the modern WebdriverIO type that replaces the
 * deprecated `Browser<'async'>`). The driver is closed by the fixture
 * that owns it.
 */
export async function createDriver(): Promise<Browser> {
  const appPath =
    process.env.APP_PATH ?? path.resolve(__dirname, '..', '..', 'apps', 'jitsu-driver.apk');

  return remote({
    hostname: process.env.APPIUM_HOST ?? '127.0.0.1',
    port: Number(process.env.APPIUM_PORT ?? 4723),
    path: process.env.APPIUM_PATH ?? '/wd/hub',
    logLevel: 'warn',
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': process.env.DEVICE_NAME ?? 'Android Emulator',
      'appium:app': appPath,
      'appium:autoGrantPermissions': true,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
    },
  });
}
