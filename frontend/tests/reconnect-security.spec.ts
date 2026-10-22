import { test, expect } from '@playwright/test';

test('refresh restores the private player session and legacy sessions reset without disabling play', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await expect(page.getByText('Server Online')).toBeVisible({ timeout: 30000 });
    await page.getByPlaceholder('e.g. The Banker').fill('ReconnectHost');
    await page.getByRole('button', { name: /create room/i }).click();
    await expect(page).toHaveURL(/\/room\/[A-Z0-9]+\/lobby/);
    const session = await page.evaluate(() => ({
        id: sessionStorage.getItem('dond_player_id'),
        token: sessionStorage.getItem('dond_reconnect_token'),
    }));
    expect(session.token).toMatch(/^[a-f0-9]{64}$/);
    const lobby = page.url();
    await page.reload();
    await expect(page.locator('.player-panel').getByText('ReconnectHost')).toBeVisible();
    await expect(page).toHaveURL(lobby);
    expect(await page.evaluate(() => sessionStorage.getItem('dond_player_id'))).toBe(session.id);
    expect(await page.evaluate(() => sessionStorage.getItem('dond_reconnect_token'))).toBe(session.token);

    await page.evaluate(() => sessionStorage.removeItem('dond_reconnect_token'));
    await page.reload();
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    await expect(page.getByText('Server Online')).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('dond_player_id'))).toBeNull();
    await page.getByPlaceholder('e.g. The Banker').fill('FreshHost');
    await page.getByRole('button', { name: /create room/i }).click();
    await expect(page).toHaveURL(/\/room\/[A-Z0-9]+\/lobby/);
    await expect(page.locator('.player-panel').getByText('FreshHost')).toBeVisible();
});
