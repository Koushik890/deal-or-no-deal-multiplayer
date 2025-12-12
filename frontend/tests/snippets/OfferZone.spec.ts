
import { test, expect } from '@playwright/test';

test.describe('OfferZone Component', () => {
    /**
     * Test: Buttons are disabled when amount/expiresAt are undefined
     * Prevents regression where buttons might become clickable in waiting state
     */
    test('should verify disabled state when amount/expiresAt are undefined', async ({ page }) => {
        // Navigate to inactive state and wait for network to settle
        await page.goto('/test/offer-zone?active=false', { waitUntil: 'networkidle' });

        // Verify waiting state text: "Awaiting Banker" and "Open boxes to reveal the next offer"
        await expect(page.getByText(/awaiting banker/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/open boxes to reveal/i)).toBeVisible();

        // In waiting state, there are no Deal/No Deal buttons visible
        // The waiting state shows a briefcase icon and waiting message instead
        const dealBtn = page.getByRole('button', { name: 'Accept the deal' });
        const noDealBtn = page.getByRole('button', { name: 'Reject the deal' });
        
        await expect(dealBtn).not.toBeVisible();
        await expect(noDealBtn).not.toBeVisible();
    });

    /**
     * Test: Buttons are enabled during active offer window
     * Prevents regression where buttons might not become clickable when offer is active
     */
    test('should verify enabled state during active window', async ({ page }) => {
        // Navigate to active state and wait for network to settle
        await page.goto('/test/offer-zone?amount=10000&active=true', { waitUntil: 'networkidle' });

        // Wait for the component to hydrate and show the dialog role (active offer)
        await expect(page.getByRole('dialog', { name: 'The Banker Offers' })).toBeVisible({ timeout: 5000 });

        // Verify amount is visible (use first() since it may match sr-only and visible text)
        await expect(page.getByText('£10,000').first()).toBeVisible();

        // Verify Deal and No Deal buttons are visible and ENABLED via accessible names
        const dealBtn = page.getByRole('button', { name: 'Accept the deal' });
        const noDealBtn = page.getByRole('button', { name: 'Reject the deal' });

        await expect(dealBtn).toBeVisible();
        await expect(dealBtn).toBeEnabled();

        await expect(noDealBtn).toBeVisible();
        await expect(noDealBtn).toBeEnabled();
    });
});
