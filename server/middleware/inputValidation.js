//input validation helpers
export { body, param, query } from "express-validator";
import { validationResult } from "express-validator";
import sanitize from "xss";

//helper middleware function to handle validation/input sanitation errors in controllers
export const catchValidationErrors = (req, res, next) => {
  const errors = validationResult(req).errors;
  if (errors.length) {
    const errorsString = errors
      .map((error) => `${error.msg} : ${error.location}.${error.param};`)
      .join(" ");
    const message = `invalid input: ${errorsString}`;
    return res.status(400).end(
      JSON.stringify({
        status: "failed",
        error: {
          name: "Invalid input",
          message,
        },
      })
    );
  }
  return next();
};

export const xssSanitize = sanitize;
