import { expect, test } from '@playwright/test'

test('rejeita credenciais invalidas e permite login seguido de logout', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('ana@kurio.test')
  await page.getByRole('textbox', { name: 'Senha' }).fill('senha-incorreta')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')

  await page.getByRole('textbox', { name: 'Senha' }).fill('Kurio@123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/perfil')
  await expect(page.getByText('ana@kurio.test')).toBeVisible()

  await page.getByRole('button', { name: /sair/i }).click()
  await expect(page).toHaveURL(/\/$/)
})
