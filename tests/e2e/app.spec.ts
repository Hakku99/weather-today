import { expect, test } from '@playwright/test'

test('loads the React entry without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveTitle("Today's Weather — Current Weather by City")
  await expect(page.getByRole('heading', { name: "Today's Weather", level: 1 })).toBeVisible()
  expect(errors).toEqual([])
})
