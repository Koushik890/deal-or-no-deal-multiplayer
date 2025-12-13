import { test, expect } from '@playwright/test';

test.describe('App Integration Tests', () => {

    test('should allow creating a room, joining with a second player, and starting the game', async ({ browser }) => {
        test.slow(); // Increase timeout for multiplayer interactions

        // --- Player 1 (Host) ---
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();

        // --- Player 2 (Joiner) ---
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();

        try {
            // Next.js dev server + websocket traffic can make `networkidle` flaky; prefer DOM readiness + explicit UI waits.
            await page1.goto('/', { waitUntil: 'domcontentloaded' });
            await expect(page1.getByText('Server Online')).toBeVisible({ timeout: 30000 });

            // Verify Landing Page
            await expect(page1.getByRole('heading', { name: /deal or no deal/i })).toBeVisible();

            // Create Room
            await page1.getByPlaceholder('e.g. The Banker').fill('HostPlayer');
            await page1.getByRole('button', { name: /create room/i }).click();

            // Verify Redirection to Lobby
            await expect(page1).toHaveURL(/\/room\/[A-Z0-9]+\/lobby/, { timeout: 15000 });

            const url = page1.url();
            const roomCode = url.split('/room/')[1].split('/')[0];
            console.log(`Created room: ${roomCode}`);

            // Verify Lobby Elements (Host)
            // Scoped to player panel to avoid header ambiguity
            await expect(page1.getByText('Room Lobby')).toBeVisible();
            await expect(page1.locator('.player-panel').getByText('HostPlayer')).toBeVisible();

            await page2.goto('/', { waitUntil: 'domcontentloaded' });
            await expect(page2.getByText('Server Online')).toBeVisible({ timeout: 30000 });

            // Navigate to Join Form
            await page2.getByRole('button', { name: /Join a Room/i }).click();

            // Fill Join Details
            await page2.getByPlaceholder('e.g. The Banker').fill('JoinPlayer');
            await page2.getByPlaceholder('ABCD12').fill(roomCode);

            // Click Join
            await page2.getByRole('button', { name: 'JOIN ROOM' }).click();

            // Verify Redirection to Lobby (P2)
            await expect(page2).toHaveURL(/\/room\/[A-Z0-9]+\/lobby/, { timeout: 15000 });
            await expect(page2.getByText('Room Lobby')).toBeVisible();
            await expect(page2.locator('.player-panel').getByText('JoinPlayer')).toBeVisible();

            // --- Interaction & Game Start ---

            // Verify Host sees Joiner in panel
            await expect(page1.locator('.player-panel').getByText('JoinPlayer')).toBeVisible({ timeout: 10000 });

            // Select Boxes

            // Wait for box grid to be ready
            await expect(page1.locator('.box-grid')).toBeVisible();

            // P1 selects Box 1
            await page1.locator('.box-item').first().click();
            await expect(page1.getByText(/your lucky box: #1/i)).toBeVisible();

            // P1 clicks Ready
            await page1.getByRole('button', { name: /i'm ready/i }).click();
            await expect(page1.getByText(/locked in/i)).toBeVisible();

            // P2 selects Box 2
            await page2.locator('.box-item').nth(1).click();
            await expect(page2.getByText(/your lucky box: #2/i)).toBeVisible();

            // P2 clicks Ready
            await page2.getByRole('button', { name: /i'm ready/i }).click();
            await expect(page2.getByText(/locked in/i)).toBeVisible();

            // Start Game (Host only)
            // Wait for button text to change from "Waiting..." to "START THE GAME"
            const readyStartBtn = page1.getByRole('button', { name: /start the game/i });
            await expect(readyStartBtn).toBeVisible({ timeout: 15000 });
            await expect(readyStartBtn).toBeEnabled();

            await readyStartBtn.click();

            // Verify Navigation to Play Page
            // First visit can trigger Next.js compilation; allow more time.
            await expect(page1).toHaveURL(/\/room\/[A-Z0-9]+\/play/, { timeout: 60000 });
            await expect(page2).toHaveURL(/\/room\/[A-Z0-9]+\/play/, { timeout: 60000 });
            await expect(page1.getByText(/Round 1/i)).toBeVisible({ timeout: 60000 });
            await expect(page2.getByText(/Round 1/i)).toBeVisible({ timeout: 60000 });
        } finally {
            await context1.close();
            await context2.close();
        }
    });

    test('banker offer should wait for all active players to respond (independent Deal/No Deal)', async ({ browser }) => {
        test.slow();

        // --- Player 1 (Host) ---
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();

        // --- Player 2 (Joiner) ---
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        try {
            await page1.goto('/', { waitUntil: 'domcontentloaded' });
            await expect(page1.getByText('Server Online')).toBeVisible({ timeout: 30000 });
            await page1.getByPlaceholder('e.g. The Banker').fill('HostPlayer');
            await page1.getByRole('button', { name: /create room/i }).click();
            await expect(page1).toHaveURL(/\/room\/[A-Z0-9]+\/lobby/, { timeout: 15000 });

            const roomCode = page1.url().split('/room/')[1].split('/')[0];

            await page2.goto('/', { waitUntil: 'domcontentloaded' });
            await expect(page2.getByText('Server Online')).toBeVisible({ timeout: 30000 });
            await page2.getByRole('button', { name: /Join a Room/i }).click();
            await page2.getByPlaceholder('e.g. The Banker').fill('JoinPlayer');
            await page2.getByPlaceholder('ABCD12').fill(roomCode);
            await page2.getByRole('button', { name: 'JOIN ROOM' }).click();
            await expect(page2).toHaveURL(/\/room\/[A-Z0-9]+\/lobby/, { timeout: 15000 });

            // Lobby: select boxes and ready
            await expect(page1.locator('.box-grid')).toBeVisible();
            await page1.locator('.box-item').first().click();
            await page1.getByRole('button', { name: /i'm ready/i }).click();

            await page2.locator('.box-item').nth(1).click();
            await page2.getByRole('button', { name: /i'm ready/i }).click();

            // Start game
            const readyStartBtn = page1.getByRole('button', { name: /start the game/i });
            await expect(readyStartBtn).toBeEnabled({ timeout: 15000 });
            await readyStartBtn.click();

            await expect(page1).toHaveURL(/\/room\/[A-Z0-9]+\/play/, { timeout: 60000 });
            await expect(page2).toHaveURL(/\/room\/[A-Z0-9]+\/play/, { timeout: 60000 });
            await expect(page1.getByText(/Round 1/i)).toBeVisible({ timeout: 60000 });
            await expect(page2.getByText(/Round 1/i)).toBeVisible({ timeout: 60000 });

            // Helper: open one box on whichever page currently has enabled boxes
            async function openOneTurnBox() {
                const openable1 = page1.locator('.box-item:not([disabled])');
                const openable2 = page2.locator('.box-item:not([disabled])');

                for (let attempt = 0; attempt < 3; attempt++) {
                    // Wait for either page to have an enabled box
                    await Promise.race([
                        openable1.first().waitFor({ state: 'visible' }),
                        openable2.first().waitFor({ state: 'visible' }),
                    ]);

                    const openedSelector = '.box-item[aria-label*=", opened"]';

                    if (await openable1.count()) {
                        const openedBefore = await page1.locator(openedSelector).count();
                        await openable1.first().click();
                        try {
                            await expect(page1.locator(openedSelector)).toHaveCount(openedBefore + 1, { timeout: 8000 });
                            return;
                        } catch {
                            continue;
                        }
                    }

                    if (await openable2.count()) {
                        const openedBefore = await page2.locator(openedSelector).count();
                        await openable2.first().click();
                        try {
                            await expect(page2.locator(openedSelector)).toHaveCount(openedBefore + 1, { timeout: 8000 });
                            return;
                        } catch {
                            continue;
                        }
                    }
                }

                throw new Error('Could not open a box after several attempts');
            }

            // Round 1 requires 5 boxes opened → offer should appear
            for (let i = 0; i < 5; i++) {
                await openOneTurnBox();
            }

            // Offer should appear for both pages
            const offerDialog1 = page1.getByRole('dialog');
            const offerDialog2 = page2.getByRole('dialog');

            await expect(page1.getByRole('button', { name: 'Accept the deal' })).toBeVisible({ timeout: 20000 });
            await expect(page2.getByRole('button', { name: 'Accept the deal' })).toBeVisible({ timeout: 20000 });

            // Player 1 responds first (No Deal)
            await page1.getByRole('button', { name: 'Reject the deal' }).click();

            // Offer must still be active for Player 2 until they respond
            await expect(page2.getByRole('button', { name: 'Accept the deal' })).toBeVisible();
            await expect(page2.getByRole('button', { name: 'Accept the deal' })).toBeVisible();

            // Player 2 responds (No Deal) → offer resolves and next round starts
            await page2.getByRole('button', { name: 'Reject the deal' }).click();

            // After both respond, offer should disappear and Round 2 banner should be shown
            await expect(offerDialog1).toBeHidden({ timeout: 20000 });
            await expect(offerDialog2).toBeHidden({ timeout: 20000 });

            await expect(page1.getByText(/Round 2/i)).toBeVisible({ timeout: 20000 });
            await expect(page2.getByText(/Round 2/i)).toBeVisible({ timeout: 20000 });
        } finally {
            await context1.close();
            await context2.close();
        }
    });

    test('game should finish when all active players accept a deal', async ({ browser }) => {
        test.slow();

        // --- Player 1 (Host) ---
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();

        // --- Player 2 (Joiner) ---
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        try {
            await page1.goto('/', { waitUntil: 'domcontentloaded' });
            await expect(page1.getByText('Server Online')).toBeVisible({ timeout: 30000 });
            await page1.getByPlaceholder('e.g. The Banker').fill('HostPlayer');
            await page1.getByRole('button', { name: /create room/i }).click();
            await expect(page1).toHaveURL(/\/room\/[A-Z0-9]+\/lobby/, { timeout: 15000 });

            const roomCode = page1.url().split('/room/')[1].split('/')[0];

            await page2.goto('/', { waitUntil: 'domcontentloaded' });
            await expect(page2.getByText('Server Online')).toBeVisible({ timeout: 30000 });
            await page2.getByRole('button', { name: /Join a Room/i }).click();
            await page2.getByPlaceholder('e.g. The Banker').fill('JoinPlayer');
            await page2.getByPlaceholder('ABCD12').fill(roomCode);
            await page2.getByRole('button', { name: 'JOIN ROOM' }).click();
            await expect(page2).toHaveURL(/\/room\/[A-Z0-9]+\/lobby/, { timeout: 15000 });

            // Lobby: select boxes and ready
            await expect(page1.locator('.box-grid')).toBeVisible();
            await page1.locator('.box-item').first().click();
            await page1.getByRole('button', { name: /i'm ready/i }).click();

            await page2.locator('.box-item').nth(1).click();
            await page2.getByRole('button', { name: /i'm ready/i }).click();

            // Start game
            const readyStartBtn = page1.getByRole('button', { name: /start the game/i });
            await expect(readyStartBtn).toBeEnabled({ timeout: 15000 });
            await readyStartBtn.click();

            await expect(page1).toHaveURL(/\/room\/[A-Z0-9]+\/play/, { timeout: 60000 });
            await expect(page2).toHaveURL(/\/room\/[A-Z0-9]+\/play/, { timeout: 60000 });
            await expect(page1.getByText(/Round 1/i)).toBeVisible({ timeout: 60000 });
            await expect(page2.getByText(/Round 1/i)).toBeVisible({ timeout: 60000 });

            // Helper: open one box on whichever page currently has enabled boxes
            const openable1 = page1.locator('.box-item:not([disabled])');
            const openable2 = page2.locator('.box-item:not([disabled])');
            const openedSelector = '.box-item[aria-label*=", opened"]';

            async function openOneTurnBox() {
                for (let attempt = 0; attempt < 3; attempt++) {
                    await Promise.race([
                        openable1.first().waitFor({ state: 'visible' }),
                        openable2.first().waitFor({ state: 'visible' }),
                    ]);

                    if (await openable1.count()) {
                        const openedBefore = await page1.locator(openedSelector).count();
                        await openable1.first().click();
                        await expect(page1.locator(openedSelector)).toHaveCount(openedBefore + 1, { timeout: 8000 });
                        return;
                    }

                    if (await openable2.count()) {
                        const openedBefore = await page2.locator(openedSelector).count();
                        await openable2.first().click();
                        await expect(page2.locator(openedSelector)).toHaveCount(openedBefore + 1, { timeout: 8000 });
                        return;
                    }
                }
                throw new Error('Could not open a box after several attempts');
            }

            // Round 1 requires 5 boxes opened → offer should appear
            for (let i = 0; i < 5; i++) {
                await openOneTurnBox();
            }

            // Offer appears and BOTH players accept → game finishes
            await expect(page1.getByRole('button', { name: 'Accept the deal' })).toBeVisible({ timeout: 20000 });
            await expect(page2.getByRole('button', { name: 'Accept the deal' })).toBeVisible({ timeout: 20000 });

            await page1.getByRole('button', { name: 'Accept the deal' }).click();
            await page2.getByRole('button', { name: 'Accept the deal' }).click();

            // End-of-game overlay should appear for both
            await expect(page1.getByText('Game Finished')).toBeVisible({ timeout: 20000 });
            await expect(page2.getByText('Game Finished')).toBeVisible({ timeout: 20000 });

            // Both names should appear in final results (scope to overlay to avoid strict-mode collisions)
            const overlay = page1.locator('.leaderboard-overlay-content');
            await expect(overlay.getByText(/HostPlayer/i)).toBeVisible();
            await expect(overlay.getByText(/JoinPlayer/i)).toBeVisible();
        } finally {
            await context1.close();
            await context2.close();
        }
    });

    test('test harness: OfferZone shows Deal/No Deal buttons when active', async ({ page }) => {
        test.slow();
        await page.goto('/test/offer-zone?amount=50000&active=true', { waitUntil: 'domcontentloaded' });

        // Check amount is displayed
        await expect(page.getByText('£50,000').first()).toBeVisible({ timeout: 10000 });

        // Check buttons using correct accessible names from ARIA labels
        const dealBtn = page.getByRole('button', { name: 'Accept the deal' });
        const noDealBtn = page.getByRole('button', { name: 'Reject the deal' });

        await expect(dealBtn).toBeVisible();
        await expect(noDealBtn).toBeVisible();
    });

});
