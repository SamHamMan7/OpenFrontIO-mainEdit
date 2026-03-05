const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const logs = [];
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            logs.push(`[${msg.type()}] ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        logs.push(`[pageerror] ${error.message}`);
    });

    page.on('worker', worker => {
        worker.on('console', msg => {
            logs.push(`[worker-${msg.type()}] ${msg.text()}`);
        });
    });

    try {
        await page.goto('http://localhost:9000/', { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Click Single Player
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Single Player'));
            if (btn) btn.click();
        });

        await page.waitForTimeout(1000);

        // Click Play Now
        await page.evaluate(() => {
            const modal = document.querySelector('single-player-modal');
            if (modal) {
                const btn = modal.querySelector('.primary_btn') || modal.querySelector('button');
                if (btn) btn.click();
            }
        });

        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'page-state.png' });
        const content = await page.content();
        fs.writeFileSync('page-content.html', content);

    } catch (e) {
        logs.push(`[script-catch] ${e.message}`);
    }

    fs.writeFileSync('browser-errors.log', logs.join('\n'));
    await browser.close();
})();
