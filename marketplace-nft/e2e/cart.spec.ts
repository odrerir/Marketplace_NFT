import { expect, test } from '@playwright/test'

test('abre um NFT, adiciona ao carrinho e persiste o item na leitura', async ({ page }) => {
  await page.goto('/')
  await page.locator('article a').first().click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'COMPRAR', exact: true }).click()
  await expect(page).toHaveURL(/\/carrinho$/)

  const item = page.locator('li').filter({ has: page.locator('h2') }).first()
  await expect(item).toBeVisible()
  await page.reload()
  await expect(item).toBeVisible()
})
