import "dotenv/config";
import db from "./db/index.js";
import { API_SERVER_PORT, PROD_URL } from "../../vite.config.js";

export const HOST_SITE = process.env.PROD_MODE === "true" ? PROD_URL : `http://localhost:${API_SERVER_PORT}`;

const ENCODED_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// given a url, check if it is already in the redirects table and if so, return corresponding shortened url (a uid generated from the integer id in the table). otherwise, create a new uid and use its integer equivalent as an id when inserting the url into the db; return new shortened url.
export const shortenURL = async urlToShorten => {
  const existingUID = await getExistingUID(urlToShorten);
  if (existingUID) {
    return `${HOST_SITE}/${existingUID}`;
  }
  const timestamp = Date.now();
  // uid is unique, as long as this function is not called more than once per millisecond, as it is based on the current Unix timestamp
  const uid = integerToEncodedString(timestamp);
  await addURLToDB(urlToShorten, timestamp);
  return `${HOST_SITE}/${uid}`;
}

// given a shortened url (uid), convert to integer id and return corresponding url from db
export const getFullURL = async shortenedURL => {
  const uid = shortenedURL.replace("/", "");
  const integerId = encodedStringToInteger(uid);
  const selectQuery = `
    SELECT url FROM redirects WHERE id = ?
  `;
  const result = await db.get(selectQuery, [integerId]);
  return result?.url || null;
}

// convert base62 uid (used in shortened url) into integer id (used in db)
export const encodedStringToInteger = uid => {
  let multiplier = 1;
  const base = ENCODED_CHARS.length;
  const integer = uid.split("").reverse().reduce((accum, digit) => {
    const integerEquivalent = ENCODED_CHARS.indexOf(digit) * multiplier;
    multiplier *= base;
    return accum + integerEquivalent;
  }, 0);
  return integer;
}

// convert integer id (used as id in db) to base62 uid (used in shortened url)
export const integerToEncodedString = integer => {
  const base = ENCODED_CHARS.length;
  const output = [];
  while(integer) {
    const remainder = integer % base;
    integer = Math.floor(integer / base);
    output.unshift(ENCODED_CHARS[remainder]);
  }
  return output.join("");
};

// insert url into redirects table, using Unix timestamp as integer id (primary key)
export const addURLToDB = (url, integerId) => {
  const insertQuery = `
    INSERT INTO redirects (id, url)
    VALUES (?, ?);
  `;
  return db.run(insertQuery, [integerId, url]);
}

// lookup url and return integer id (converted to uid) if it is already in db, else return null
export const getExistingUID = async url => {
  const selectQuery = `
    SELECT id FROM redirects WHERE url = ?;
  `;
  const existingResult = await db.get(selectQuery, [url]);
  return existingResult ? integerToEncodedString(existingResult.id) : null;
  
}