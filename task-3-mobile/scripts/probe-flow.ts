/**
 * Drive the app from Login → Profile → Tutorials → Active Assignment,
 * dumping the UiAutomator hierarchy at each step.
 */
import path from 'path';
import fs from 'fs';
import { remote } from 'webdriverio';

const APP = path.resolve(__dirname, '..', 'apps', 'jitsu-driver.apk');
const OUT = path.resolve(__dirname, '..', 'tmp', 'probe');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const driver = await remote({
    hostname: '127.0.0.1',
    port: 4723,
    path: '/wd/hub',
    logLevel: 'warn',
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'Android Emulator',
      'appium:app': APP,
      'appium:autoGrantPermissions': true,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
      'appium:fullReset': false,
    },
  });

  async function dump(name: string) {
    const xml = await driver.getPageSource();
    const f = path.join(OUT, `${name}.xml`);
    fs.writeFileSync(f, xml);
    console.log(`[${name}] ${xml.length} chars → ${f}`);
  }

  try {
    await driver.$('~Log In').waitForDisplayed({ timeout: 30_000 });
    await dump('01-login');

    const fields = await driver.$$('//android.widget.EditText');
    console.log('  EditText count:', fields.length);
    // React-Native fields ignore programmatic setValue (no onChangeText fires).
    // Tap → addValue replays the IME path so React's controlled state syncs.
    await fields[0].click();
    await fields[0].addValue('auto_244332');
    await fields[1].click();
    await fields[1].addValue('Testing1!');
    await driver.hideKeyboard().catch(() => {});
    await dump('02-filled');

    await driver.$('~Log In').click();
    console.log('  tapped Log In, waiting...');
    await driver.pause(8000);
    await dump('03-after-login');

    // Probe Instabug or post-login state. Try multiple dismissal strategies.
    const probe = async (name: string, fn: () => Promise<void>) => {
      try {
        await fn();
        await driver.pause(1500);
        await dump(name);
      } catch (e) {
        console.log(`  ${name} failed:`, (e as Error).message);
      }
    };

    // Strategy 1: tap outside the centred dialog (top of screen)
    await probe('04-tap-top', async () => {
      const { width, height } = await driver.getWindowSize();
      await driver.action('pointer').move({ x: width / 2, y: 100 }).down().up().perform();
    });

    // Strategy 2: swipe up to dismiss bottom sheet behaviour
    await probe('05-swipe-up', async () => {
      const { width, height } = await driver.getWindowSize();
      await driver
        .action('pointer')
        .move({ x: width / 2, y: (height * 3) / 4 })
        .down()
        .move({ x: width / 2, y: height / 4, duration: 400 })
        .up()
        .perform();
    });

    // Strategy 3: look for any element whose desc/text suggests dismissal
    await probe('06-find-dismiss', async () => {
      const candidates = ['~Got it', '~Skip', '~Done', '~Close', '~Continue', '~OK'];
      for (const sel of candidates) {
        const el = driver.$(sel);
        if (await el.isExisting()) {
          console.log(`  found dismiss candidate: ${sel}`);
          await el.click();
          return;
        }
      }
      console.log('  no dismiss candidate found');
    });

    // Tap top of screen dismisses Instabug; we are now on the home with
    // bottom-nav. Navigate to Profile tab.
    await probe('07-profile-tab', async () => {
      const tab = driver.$('//*[contains(@content-desc, "Profile") and contains(@content-desc, "Tab")]');
      await tab.waitForDisplayed({ timeout: 10_000 });
      await tab.click();
    });

    await probe('08-profile-screen', async () => {
      // Look for the Tutorials row
      const t = driver.$('//*[@text="Tutorials" or @content-desc="Tutorials"]');
      if (await t.isExisting()) {
        console.log('  Tutorials row found');
      }
    });

    await probe('09-tutorials-screen', async () => {
      // Scroll Tutorials into a non-overlapping position first
      await driver.$(
        'android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().description("Tutorials"))',
      ).catch(() => {});
      const t = driver.$('//*[@content-desc="Tutorials"]');
      await t.waitForDisplayed({ timeout: 10_000 });
      // Tap upper portion to avoid Messenger tab overlap at bottom-nav
      const loc = await t.getLocation();
      const size = await t.getSize();
      await driver.action('pointer')
        .move({ x: Math.round(loc.x + size.width / 2), y: Math.round(loc.y + size.height / 4) })
        .down().pause(50).up().perform();
    });

    await probe('10-tap-assigned-route', async () => {
      const ar = driver.$('//*[@text="Assigned Route" or @content-desc="Assigned Route"]');
      await ar.waitForDisplayed({ timeout: 10_000 });
      await ar.click();
    });
  } catch (e) {
    console.error('PROBE FAILED:', (e as Error).message);
    await dump('99-error').catch(() => {});
  } finally {
    await driver.deleteSession().catch(() => {});
  }
})();
