import fetch from "node-fetch";
import app from "../server.js"; // importing to start server
import { HOST_SITE, encodedStringToInteger } from "../services/urlShortener.js";
import { randomInt, randomString } from "../../src/utils/helpers.js";
import {
  expectError,
  expectInvalidInput,
  runDataValidationTests,
} from "../../test/testHelpers.js";
import assert from "assert";

const sleep = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// helper functions
const makeFetchRequest = (url) => {
  return fetch(url, {
    method: "get",
    headers: { Accept: "text/html" },
  }).then((responseStream) => responseStream.json());
};

const makeShortenURLRequest = async (url) => {
  const result = await fetch(`${HOST_SITE}/api/shorten-url`, {
    method: "post",
    body: JSON.stringify({ url }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then((responseStream) => responseStream.json());
  await sleep(2);
  return result;
};

const testWithURL = async (url) => {
  const firstResponse = await makeShortenURLRequest(url);
  console.log("firstResponse:", firstResponse)
  assert.strictEqual(firstResponse.status, "ok");
  assert(firstResponse.shortenedURL.includes(HOST_SITE));
  const secondResponse = await makeShortenURLRequest(url);
  console.log("secondResponse:", secondResponse);
  assert.strictEqual(secondResponse.status, "ok");
  assert.strictEqual(secondResponse.shortenedURL, firstResponse.shortenedURL);
};

const testRedirectWithURL = async (url) => {
  // get test data from url
  const initialDataResponse = await makeFetchRequest(url);
  assert.strictEqual(typeof initialDataResponse.randomTestNumber, "number");

  // shorten url
  const getShortenedURLResponse = await makeShortenURLRequest(url);
  const shortenedURL = getShortenedURLResponse.shortenedURL;
  assert.strictEqual(getShortenedURLResponse.status, "ok");

  // get test data from new shortened url
  const testResponse = await makeFetchRequest(shortenedURL);
  console.log("testResponse:", testResponse)
  assert.strictEqual(typeof testResponse.randomTestNumber, "number");
  // shortened url should return same data as original url (because it is a redirect to the original)
  assert.strictEqual(
    testResponse.randomTestNumber,
    initialDataResponse.randomTestNumber
  );
  // query params included with the url to be shortened work when the short url is visited
  assert.strictEqual(
    testResponse.testQueryParam,
    initialDataResponse.testQueryParam
  );
};

// TESTS

describe("controllers", () => {
  it("/api/shorten-url POST - basic tests (same url always returns same short url)", async function () {
    this.timeout(5000);
    const urlsToTest = [
      "https://hotdogisasandwich.com",
      "http://hotdogisasandwich.com",
      "https://dennis-hodges.com",
    ];
    for (const url of urlsToTest) {
      console.log("testing with url:", url);
      await testWithURL(url);
    }
  });

  it("/api/shorten-url POST - redirects function as expected", async function () {
    this.timeout(5000);
    const testDataURL = `${HOST_SITE}/api/test`;
    const queryParamValue = randomInt(1, 1000);
    const urlWithQueryParams = `${testDataURL}?test=${queryParamValue}`;
    const urlsToTest = [testDataURL, urlWithQueryParams];
    for (const url of urlsToTest) {
      await testRedirectWithURL(url);
    }
  });

  it("/api/shorten-url POST - input validation", async function () {
    this.timeout(5000);
    const invalidFields = {
      url: [
        "noprotocol.com",
        `https://too-long.${randomString(2048)}.com`,
        "badprotocol://google.com",
        "https://no-tld",
      ],
    };
    const validTestData = { url: "https://dennis-hodges.com" };
    await runDataValidationTests(invalidFields, validTestData, {
      url: `${HOST_SITE}/api/shorten-url`,
      method: "post",
    });
  });

  it("/:redirectID GET - attempted redirect of invalid short url returns 404 error", async function () {
    this.timeout(5000);
    const badURL = `${HOST_SITE}/badurl1`;
    await expectError(makeFetchRequest(badURL), "Not found", null, true);
  });

  it("/:redirectID GET - input validation", async function () {
    this.timeout(5000);
    let invalidURL = `${HOST_SITE}/${randomString(6)}`;
    await expectInvalidInput(makeFetchRequest(invalidURL));
    invalidURL = `${HOST_SITE}/${randomString(9)}`;
    await expectInvalidInput(makeFetchRequest(invalidURL));
  });

  // it("rate limiting", async function () {
  //   this.timeout(10000);
  //   const testURL = "https://google.com/";
  //   for (let i = 0; i < 21; i++) { // limit is 30 requests/user/minute - endpoint is called 8 times previously in these tests, so it should allow 21 more tries before rate limit kicks in
  //     const response = await makeShortenURLRequest(testURL);
  //   }
  //   await expectError(makeShortenURLRequest(testURL), "Rate limit exceeded");
  // });
});
