import puppeteer from 'puppeteer';

export const URL = 'http://localhost:3000/';

export async function openPage() {
	let browser = await puppeteer.launch({
		headless: false, // true,
		slowMo: 30,

		// debug
		// headless: false,
		// slowMo: 30,
		// devtools: true,
	});
	let page = await browser.newPage();
	await page.goto(URL);
	return [browser, page];
}

export async function setTextInputValue(page: puppeteer.Page, selector: string, value: string | number) {
	await page.type(selector, value.toString());
}

// maybe user already exist, delete it first.
// export async function deleteTestUser() {
//     const testUserName = "Test";
//     await apiDelete(
//         this,
//         `/user/name/${testUserName}`,
//         async function (res) {
//         },
//         function (error, error_retry) {
//         },
//         function () {
//         }
//     );
// }
