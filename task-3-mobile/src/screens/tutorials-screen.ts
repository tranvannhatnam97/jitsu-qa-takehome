import { BaseScreen } from '@core/base-screen';
import { ActiveAssignmentScreen } from './active-assignment-screen';

/**
 * Tutorials screen — three section rows accessed via content-desc:
 *   - `~Assigned Route`
 *   - `~Direct Booking`
 *   - `~Ticket Booking`
 *
 * The screen header is also `~Tutorials`, so we anchor `waitUntilReady`
 * on Assigned Route to avoid colliding with the Profile row.
 */
export class TutorialsScreen extends BaseScreen {
  static readonly SECTIONS = ['Assigned Route', 'Direct Booking', 'Ticket Booking'] as const;

  async waitUntilReady(): Promise<void> {
    await this.waitForDisplayed('~Assigned Route');
  }

  async assertAllSectionsVisible(): Promise<void> {
    for (const name of TutorialsScreen.SECTIONS) {
      await this.assertDisplayed(`~${name}`, `Tutorials section "${name}" is not visible`);
    }
  }

  async tapAssignedRoute(): Promise<ActiveAssignmentScreen> {
    await this.tap('~Assigned Route');
    const screen = new ActiveAssignmentScreen(this.driver);
    await screen.waitUntilReady();
    return screen;
  }
}
