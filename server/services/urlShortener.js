import "dotenv/config";
import db from "./db/index.js";
import { API_SERVER_PORT, PROD_URL } from "../../vite.config.js";

export const HOST_SITE = process.env.PROD_MODE === "true" ? PROD_URL : `http://localhost:${API_SERVER_PORT}`;

console.log("process.env:", process.env)

// given a url, check if it is already in the redirects table and if so, return corresponding shortened url (a uid generated from the integer id in the table). otherwise, create a new uid and use its integer equivalent as an id when inserting the url into the db; return new shortened url.
export const shortenURL = async urlToShorten => {
  const existingUID = await getExistingUID(urlToShorten);
  if (existingUID) {
    return `${HOST_SITE}/${existingUID}`;
  }
  const uid = generateUID();
  await addURLToDB(urlToShorten, uid);
  return `${HOST_SITE}/${uid}`;
}

// given a shortened url (uid), convert to integer id and return corresponding url from db
export const getFullURL = async shortenedURL => {
  const uid = shortenedURL.replace("/", "");
  const integerId = uidToIntegerId(uid);
  const selectQuery = `
    SELECT url FROM redirects WHERE id = ?
  `;
  const result = await db.get(selectQuery, [integerId]);
  return result?.url || null;
}

// this function will return an id that is unique, given that it is not called more than once per millisecond, as it is based on the current Unix timestamp
export const generateUID = () =>  Date.now().toString(36);

// convert base36 uid (used in shortened url) into integer id (used in db)
export const uidToIntegerId = uid => parseInt(uid, 36);

// convert integer id (used as id in db) to base36 uid (used in shortened url)
export const integerIdToUID = integerId => integerId.toString(36);

// insert url into redirects table, using Unix timestamp as integer id (primary key)
export const addURLToDB = (url, uid) => {
  const integerId = uidToIntegerId(uid);
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
  return existingResult ? integerIdToUID(existingResult.id) : null;
  
}