import { BaseScreen } from '@core/base-screen';
import { ProfileScreen } from './profile-screen';

/**
 * Login screen for `com.axlehire.drive.staging`.
 *
 * Selectors verified live against the running APK:
 *   - 2 unlabeled `android.widget.EditText` (index-addressed; second has password=true)
 *   - `~Log In` button (Android `content-desc` → WebDriver "accessibility id")
 *
 * Note: this is a React Native screen. Programmatic `setValue` does NOT
 * fire React's onChangeText handler, so the form would submit empty. We
 * therefore tap-then-`addValue` to drive the IME path and sync state.
 *
 * After login the app shows an Instabug onboarding overlay; that is
 * dismissed by `ProfileScreen.dismissInstabugOverlay()` once during
 * post-login navigation.
 */
export class LoginScreen extends BaseScreen {
  private readonly fieldsXpath = '//android.widget.EditText';
  private readonly logInButton = '~Log In';

  async waitUntilReady(): Promise<void> {
    await this.waitForDisplayed(this.logInButton, 30_000);
  }

  async login(username: string, password: string): Promise<ProfileScreen> {
    const fields = await this.driver.$$(this.fieldsXpath).getElements();
    if (fields.length < 2) {
      throw new Error(`expected 2 EditText fields on login screen, found ${fields.length}`);
    }
    await fields[0].click();
    await fields[0].addValue(username);
    await fields[1].click();
    await fields[1].addValue(password);
    await this.driver.hideKeyboard().catch(() => {});
    await this.tap(this.logInButton);

    const profile = new ProfileScreen(this.driver);
    await profile.dismissInstabugOverlay();
    await profile.waitUntilReady();
    return profile;
  }
}
