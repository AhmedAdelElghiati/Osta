const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');

// Deterministic API fixtures exercise the real Angular templates without changing database records.
const id = '00000000000000000054fa08';
const user = { id: '000000000000000000000001', name: 'Responsive Test', email: 'qa@example.com', role: 'customer', phone: '01000000000' };
const request = { _id: id, title: 'اختبار الفاتورة', description: 'وصف الطلب للاختبار', status: 'COMPLETED', budget: { min: 2000, max: 5000 }, acceptedPrice: 3000, jobId: '000000000000000000000002', paymentStatus: 'RELEASED', location: { city: 'القاهرة', area: 'مدينة نصر' }, craftId: { _id: '000000000000000000000003', name: 'سباكة', slug: 'plumbing' }, artisanId: { name: 'أسطى الاختبار' } };

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    fs.mkdirSync('responsive-qa', { recursive: true });
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport });
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname;
        let data = [];
        if (path.endsWith('/auth/me')) data = user;
        else if (path.endsWith('/requests/me')) data = { items: [request], pagination: { totalPages: 1 } };
        else if (path.endsWith(`/requests/${id}`)) data = request;
        else if (path.endsWith('/jobs/000000000000000000000002')) data = { _id: request.jobId, requestId: request, status: 'COMPLETED', dispute: { status: 'NONE' } };
        else if (path.endsWith('/wallet')) data = { availableBalance: 0, escrowBalance: 0, transactions: [] };
        return route.fulfill({ json: { success: true, data } });
      });
      await page.goto('http://127.0.0.1:4201/customer-dashboard');
      if (viewport.width < 992) await page.locator('.mobile-menu-btn').click();
      await page.locator('.sidebar .nav-item').filter({ hasText: 'طلباتي' }).click();
      await page.getByText('عرض التفاصيل', { exact: true }).first().click();
      for (const [button, title] of [['عرض الفاتورة', 'الفاتورة'], ['قيّم الأسطى', 'تقييم الأسطى']]) {
        await page.getByRole('button', { name: new RegExp(button) }).click();
        const overlay = page.locator('app-dashboard-requests .modal-backdrop-custom');
        await overlay.waitFor();
        const geometry = await overlay.evaluate(element => {
          const box = element.querySelector('.modal-content').getBoundingClientRect();
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, box: { x: box.x, y: box.y, width: box.width, height: box.height }, overflow: getComputedStyle(document.body).overflow, documentWidth: document.documentElement.scrollWidth };
        });
        assert.equal(geometry.x, 0);
        assert.equal(geometry.y, 0);
        assert.equal(geometry.width, viewport.width);
        assert.equal(geometry.height, viewport.height);
        assert(geometry.box.y >= 0 && geometry.box.y + geometry.box.height <= viewport.height + 1);
        assert(geometry.box.x >= 0 && geometry.box.x + geometry.box.width <= viewport.width + 1);
        assert.equal(geometry.overflow, 'hidden');
        assert(geometry.documentWidth <= viewport.width);
        await page.screenshot({ path: `responsive-qa/${title === 'الفاتورة' ? 'invoice' : 'rating'}-${viewport.width}x${viewport.height}.png` });
        await overlay.getByRole('button', { name: 'إغلاق', exact: true }).first().click();
        await overlay.waitFor({ state: 'detached' });
        assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden');
      }
      console.log(`PASS ${viewport.width}x${viewport.height}: centered invoice/rating, bounded dialog, scroll lock restored`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
