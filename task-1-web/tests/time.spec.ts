import { test, expect } from '@fixtures/pages.fixture';
import { stepWithSnap } from '@core/step';

const CITIES = [
  { query: 'Los Angeles', expectedInHeading: 'Los Angeles' },
  // Add more entries here — the test below is data-driven.
];

test.describe('time.is — city search', () => {
  for (const { query, expectedInHeading } of CITIES) {
    test(`shows current date and ticking clock for ${query}`, async ({ page, homePage }) => {
      await stepWithSnap(page, '1. open time.is and search city', async () => {
        await homePage.open();
      });

      const result = await stepWithSnap(page, `2. submit search for "${query}"`, async () => {
        return homePage.searchCity(query);
      });

      await stepWithSnap(page, '3. city name appears in heading', async () => {
        await result.assertHeadingContains(expectedInHeading);
      });

      await stepWithSnap(page, '4. current date is rendered', async () => {
        await result.assertDateVisible();
        const date = await result.dateText();
        expect(date.length, 'date string should not be empty').toBeGreaterThan(0);
      });

      await stepWithSnap(page, '5. clock is HH:MM:SS and advancing', async () => {
        await result.assertClockTicks(3_000);
      });
    });
  }
});
