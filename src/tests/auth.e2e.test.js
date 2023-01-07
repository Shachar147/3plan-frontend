import puppeteer from 'puppeteer';
import { deleteTestUser, openPage, setTextInputValue } from './test.utils';
import { sleep } from '../utils/utils';

let browser, page;

const userSelector = '[data-testid="username"]';
const passwordSelector = '[data-testid="password"]';
const passwordAgainSelector = '[data-testid="passwordAgain"]';
const buttonSelector = '[data-testid="submit"]';
const registerSelector = '[data-testid="register"]';
const guestSelector = '[data-testid="guest"]';

// const errorSelector = '[data-testid="error"]';
// const messageSelector = '[data-testid="message"]';

// const MESSAGES = {
//     USER_EMPTY: "Username can't be empty",
//     PASS_EMPTY: "Password can't be empty",
//     INCORRECT: "Username or Password are incorrect.",
//     SUCCESS: "Logged in successfully!",
// };

const testUserName = 'Test';
const testUserPass = 'Test123456';

describe('Auth E2E test suite', () => {
	jest.setTimeout(60000);

	beforeAll(async () => {
		[browser, page] = await openPage();
	});

	test('login page loads correctly', async () => {
		const userLoaded = !!(await page.$(userSelector));
		const passLoaded = !!(await page.$(passwordSelector));
		const buttonLoaded = !!(await page.$(buttonSelector));
		const guestLoaded = !!(await page.$(guestSelector));

		const buttonText = await page.$eval(buttonSelector, (el) => el.textContent);

		expect(userLoaded).toBe(true);
		expect(passLoaded).toBe(true);
		expect(buttonLoaded).toBe(true);
		expect(guestLoaded).toBe(true);
		const isButtonTextOk = buttonText === 'Login' || buttonText === 'התחבר';
		expect(isButtonTextOk).toBe(true);
	});

	test('register page loads correctly', async () => {
		// maybe user already exist, delete it first.
		// await apiDelete(
		//     this,
		//     `/user/name/${testUserName}`,
		//     async function (res) {},
		//     function (error, error_retry) {},
		//     function () {}
		// );

		const registerLoaded = !!(await page.$(registerSelector));
		expect(registerLoaded).toBe(true);

		// navigate to register page
		await page.click(registerSelector);
		const passwordAgainLoaded = !!(await page.$(passwordAgainSelector));
		expect(passwordAgainLoaded).toBe(true);

		// fill in values
		await setTextInputValue(page, userSelector, testUserName);
		await setTextInputValue(page, passwordSelector, testUserPass);
		await setTextInputValue(page, passwordAgainSelector, testUserPass);
		await sleep(100);
		await page.click(buttonSelector);

		// make sure we're redirected to login page
		const buttonText = await page.$eval(buttonSelector, (el) => el.textContent);
		const isButtonTextOk = buttonText === 'Login' || buttonText === 'התחבר';

		expect(isButtonTextOk).toBe(true);
	});

	afterAll(async () => {
		// browser.close();
	});
});
