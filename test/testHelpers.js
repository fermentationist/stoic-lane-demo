import assert from "assert";

export const expectError = function (p, errorName, testDescription, debug = false) {
  let msg;
  if (errorName) {
    msg = `${
      testDescription ? testDescription + " - " : ""
    }The error "${errorName}" should have been thrown.`;
  } else {
    msg = `${
      testDescription ? testDescription + " - " : ""
    }An error should have been thrown.`;
  }
  const namedError = new Error(msg);
  return p
    .then((data) => {
      debug && console.log("data:", data)
      if (!data.error) {
        namedError.name = "no_error_thrown";
        return Promise.reject(namedError);
      } else {
        return Promise.reject(data.error);
      }
    })
    .catch((error) => {
      if (errorName && error.name !== errorName) {
        return Promise.reject(namedError);
      } else if (error.name == "no_error_thrown") {
        return Promise.reject(error);
      } else {
        return Promise.resolve();
      }
    });
};

export const expectInvalidInput = (promise, message) =>
  expectError(promise, "Invalid input", message);

/* runDataValidationTests
will run data validation tests against a series of request params, given an object (invalidFieldsObj) containing invalid values for each field to be tested.

invalidFieldsObj example:
  {
    name: [<invalid value 1>, <invalid value 2>...],
    address: {
      street: [<invalid value 1>, <invalid value 2>...]
    }
  }
*/
export const runDataValidationTests = async (
  invalidFieldsObj,
  validTestData,
  { url, method }
) => {
  const testInvalidValues = async (field, fieldData, prevKeys = []) => {
    if (!Array.isArray(fieldData)) {
      for (const key in fieldData) {
        await testInvalidValues(key, fieldData[key], [...prevKeys, field]);
      }
    } else {
      for (const invalidValue of fieldData) {
        let targetField = validTestData;
        for (const prevKey of prevKeys) {
          targetField = targetField[prevKey];
        }
        const originalValue = targetField[field];
        targetField[field] = invalidValue;
        await expectInvalidInput(
          fetch(url, {method, body: JSON.stringify(validTestData)}).then(responseStream => responseStream.json()),
          `invalid ${field}: ${invalidValue}`
        );
        targetField[field] = originalValue;
      }
    }
  };
  for (const key in invalidFieldsObj) {
    await testInvalidValues(key, invalidFieldsObj[key]);
  }
};

export const assertEqualIfExists = (expected, actual) => {
  if (expected) {
    assert.strictEqual(actual, expected);
  }
};

export const assertEqualOrNull = (actual, expected) => {
  if (actual !== null) {
    assert.strictEqual(actual, expected);
  }
};

export const assertEqualIfCondition = (condition, actual, expected) => {
  if (condition) {
    assert.strictEqual(actual, expected);
  }
};
