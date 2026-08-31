// Selenium E2E tests for the SpendAgent live site.
//
// The web frontend (frontend/) is a single-page vanilla HTML/CSS/JS app
// with no login screen, so these tests exercise the app's actual entry
// point (the Receipt Scanner screen) and its in-page navigation instead
// of a login flow: homepage load, navigation between screens, presence
// of the stable automation ids, and surviving a page refresh.
//
// Point SITE_URL at the deployed GitHub Pages URL (set automatically by
// the GitHub Actions workflow) or a local server for manual runs, e.g.:
//   npx http-server frontend -p 5500
//   SITE_URL=http://localhost:5500 npm run test:local

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

const SITE_URL = process.env.SITE_URL || 'http://localhost:5500';

describe('SpendAgent live site - E2E', function () {
  this.timeout(30000);
  let driver;

         before(async function () {
           const options = new chrome.Options();
           options.addArguments(
             '--headless=new',
             '--no-sandbox',
             '--disable-dev-shm-usage',
             '--window-size=1280,900'
             );
           driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
         });

         after(async function () {
           if (driver) await driver.quit();
         });

         async function isActive(elementId) {
           const el = await driver.findElement(By.id(elementId));
           const classes = await el.getAttribute('class');
           return classes.split(/\s+/).includes('active');
         }

         it('loads the homepage and shows the SpendAgent hero', async function () {
           await driver.get(SITE_URL);
           const title = await driver.getTitle();
           assert.strictEqual(title, 'SpendAgent');

            const hero = await driver.wait(until.elementLocated(By.css('.hero-logo')), 10000);
           assert.ok(await hero.isDisplayed(), 'hero logo should be visible');

            const scannerScreen = await driver.wait(until.elementLocated(By.id('screen-scanner')), 10000);
           await driver.wait(async () => (await scannerScreen.getAttribute('class')).includes('active'), 10000);
         });

         it('has stable automation ids on the primary nav and scanner controls', async function () {
           const requiredIds = [
             'nav-scanner',
             'nav-admin',
             'nav-tracker',
             'nav-ledger',
             'receipt-input',
             'submit-receipt-btn',
             ];
           for (const id of requiredIds) {
             const el = await driver.wait(until.elementLocated(By.id(id)), 10000);
             assert.ok(el, `expected #${id} to exist so Selenium can locate it reliably`);
           }
         });

         it('navigates Scanner -> Tracker and shows the tracker screen', async function () {
           await driver.findElement(By.id('nav-tracker')).click();
           await driver.wait(until.elementLocated(By.id('screen-tracker')), 10000);
           await driver.wait(async () => isActive('screen-tracker'), 10000);
           assert.ok(!(await isActive('screen-scanner')), 'scanner screen should no longer be active');
         });

         it('navigates Tracker -> Friend Ledger and shows the ledger screen', async function () {
           await driver.findElement(By.id('nav-ledger')).click();
           await driver.wait(until.elementLocated(By.id('screen-ledger')), 10000);
           await driver.wait(async () => isActive('screen-ledger'), 10000);
         });

         it('navigates Friend Ledger -> Admin Policy and shows the admin screen', async function () {
           await driver.findElement(By.id('nav-admin')).click();
           await driver.wait(until.elementLocated(By.id('screen-admin')), 10000);
           await driver.wait(async () => isActive('screen-admin'), 10000);
         });

         it('survives a page refresh and reloads back to the scanner screen', async function () {
           await driver.navigate().refresh();
           await driver.wait(until.elementLocated(By.id('screen-scanner')), 10000);
           await driver.wait(async () => isActive('screen-scanner'), 10000);
         });

         it('supports direct URL access (loading the site fresh in a new session)', async function () {
           await driver.get(SITE_URL);
           const scannerScreen = await driver.wait(until.elementLocated(By.id('screen-scanner')), 10000);
           assert.ok((await scannerScreen.getAttribute('class')).includes('active'));
         });
});
