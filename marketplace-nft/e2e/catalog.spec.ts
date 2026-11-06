import { expect, test } from '@playwright/test'

test('busca, atualiza a URL e limpa filtros sem resultados', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir busca' }).click()
  await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' }).first()).toBeVisible()

  const search = page.getByRole('searchbox', { name: 'Buscar NFTs' }).first()
  await search.fill('Emerald Ape')
  await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('Emerald Ape')
  await expect(page.getByRole('heading', { name: /Emerald Ape/i }).first()).toBeVisible()

  await search.fill('item-inexistente')
  await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()

  await page.getByRole('button', { name: 'Limpar busca e filtros' }).click()
  await expect(search).toHaveValue('')
  await expect(page.locator('article').first()).toBeVisible()
})
