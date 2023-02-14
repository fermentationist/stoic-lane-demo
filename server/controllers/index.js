import * as urlShortener from "../services/urlShortener.js";
import * as validate from "../middleware/inputValidation.js";

// used in controllers tests, will be a random integer (1 through 1000)
const randomTestNumber = Math.floor(Math.random() * 999) + 1;

export const testController = (req, res) => {
  const testResponse = {
    randomTestNumber,
    testQueryParam: req.query?.test || null,
  };
  return res.status(200).send(testResponse);
};

const shortenURLValidation = [
  validate
    .body("url")
    .exists()
    .isURL({ require_tld: false, require_protocol: true })
    .isLength({ max: 2048 })
    .customSanitizer(validate.xssSanitize),
  validate.catchValidationErrors,
];

const shortenURLController = async (req, res) => {
  try {
    const { url } = req.body;
    const shortenedURL = await urlShortener.shortenURL(url);
    return res.status(200).send({
      status: "ok",
      shortenedURL,
    });
  } catch (error) {
    return res.status(400).send({
      status: "failed",
      error,
    });
  }
};

export const shortenURL = [shortenURLValidation, shortenURLController];

const redirectToFullURLValidation = [
  validate.param("redirectID").exists().isLength({ min: 7, max: 8 }),
  validate.catchValidationErrors,
];

const redirectToFullURLController = async (req, res) => {
  const fullURL = await urlShortener.getFullURL(req.params.redirectID);
  if (!fullURL) {
    return res.status(404).send({
      status: "failed",
      error: {
        name: "Not found",
        message: "The requested URL was not found.",
      },
    });
  }
  return res.status(301).redirect(fullURL);
};

export const redirectToFullURL = [
  redirectToFullURLValidation,
  redirectToFullURLController,
];
