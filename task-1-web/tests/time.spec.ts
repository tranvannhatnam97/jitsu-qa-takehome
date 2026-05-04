import { test, expect } from '@fixtures/pages.fixture';

const CITIES = [
  { query: 'Los Angeles', expectedInHeading: 'Los Angeles' },
  // Add more entries here — the test below is data-driven.
];

test.describe('time.is — city search', () => {
  for (const { query, expectedInHeading } of CITIES) {
    test(`shows current date and ticking clock for ${query}`, async ({ homePage }) => {
      await homePage.open();
      const result = await homePage.searchCity(query);

      await test.step('city name appears in heading', async () => {
        await result.assertHeadingContains(expectedInHeading);
      });

      await test.step('current date is rendered', async () => {
        await result.assertDateVisible();
        const date = await result.dateText();
        expect(date.length, 'date string should not be empty').toBeGreaterThan(0);
      });

      await test.step('clock is HH:MM:SS and advancing', async () => {
        await result.assertClockTicks(3_000);
      });
    });
  }
});
