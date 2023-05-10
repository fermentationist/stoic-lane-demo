import {integerToEncodedString, encodedStringToInteger} from "./urlShortener.js";
import assert from "assert";

// unit tests for urlShortener.js
describe("urlShortener.js", () => { 
  const testInts = [0, 1, 10, 61, 62, 63, 64, 65, 100, 1000, 10000, 100000, 1000000];
  const encodedTestInts = ["0", "1", "a", "Z", "10", "11", "12", "13", "1C", "g8", "2Bi", "q0U", "4c92"];

  describe("integerToEncodedString()", () => {
    it("should convert integer to base62 uid", () => {
      testInts.forEach((testInt, index) => {
        const result = integerToEncodedString(testInt);
        assert.strictEqual(result, encodedTestInts[index]);
      });
    });
  });

  describe("encodedStringToInteger()", () => {
    it("should convert base62 uid to integer", () => {
      encodedTestInts.forEach((encodedTestInt, index) => {
        const result = encodedStringToInteger(encodedTestInt);
        assert.strictEqual(result, testInts[index]);
      });
    });
  });

  describe("integerToEncodedString() with encodedStringToInteger()", () => {
    it("should convert integer to base62 uid and back to same integer", () => {
      testInts.forEach((testInt) => {
        const result = encodedStringToInteger(integerToEncodedString(testInt));
        assert.strictEqual(result, testInt);
      });
    });
  });
});
