// Basic Appium smoke test for the SpendAgentMobile app.
//
// Scope is deliberately minimal: launch the built debug APK on an Android
// emulator and confirm the login screen renders with its expected
// automation ids (email-input, password-input, login-button). It does not
// attempt an actual login, since that would need a real registered test
// account against the live backend.
//
// Expects an Appium server already running on 127.0.0.1:4723 and the
// APK_PATH env var pointing at the built debug APK. See
// .github/workflows/appium-mobile.yml for how this is wired up in CI.

const { remote } = require('webdriverio');

const APK_PATH = process.env.APK_PATH;
const APP_PACKAGE = process.env.APP_PACKAGE || 'com.spendagent.mobile';

if (!APK_PATH) {
  console.error('FAIL: APK_PATH environment variable is not set.');
  process.exit(1);
}

// React Native's testID becomes the Android accessibility id on some RN
// versions and the raw (unprefixed or package-prefixed) resource-id on
// others. Try a few locator strategies in turn so the test isn't brittle
// to that difference.
async function findByTestId(driver, testId, timeoutMs = 60000) {
  const strategies = [
    () => driver.$(`~${testId}`),
    () => driver.$(`android=new UiSelector().resourceId("${testId}")`),
    () => driver.$(`android=new UiSelector().resourceIdMatches(".*:id/${testId}$")`),
  ];

  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    for (const strategy of strategies) {
      try {
        const el = await strategy();
        if (await el.isExisting()) {
          return el;
        }
      } catch (err) {
        lastError = err;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw lastError || new Error(`Could not locate element with testID "${testId}" using any known strategy`);
}

async function main() {
  const driver = await remote({
    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
    logLevel: 'warn',
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'Android Emulator',
      'appium:app': APK_PATH,
      'appium:appPackage': APP_PACKAGE,
      'appium:appWaitActivity': '*',
      'appium:newCommandTimeout': 180,
      'appium:autoGrantPermissions': true,
    },
  });

  try {
    console.log('App launched, waiting for the login screen...');

    const emailInput = await findByTestId(driver, 'email-input');
    if (!(await emailInput.isDisplayed())) {
      throw new Error('email-input was located but is not displayed');
    }

    const passwordInput = await findByTestId(driver, 'password-input');
    if (!(await passwordInput.isDisplayed())) {
      throw new Error('password-input was located but is not displayed');
    }

    const loginButton = await findByTestId(driver, 'login-button');
    if (!(await loginButton.isDisplayed())) {
      throw new Error('login-button was located but is not displayed');
    }

    console.log('PASS: Login screen rendered with email-input, password-input, and login-button all visible.');
  } finally {
    await driver.deleteSession();
  }
}

main().catch((err) => {
  console.error('FAIL:', err && err.message ? err.message : err);
  process.exit(1);
});
