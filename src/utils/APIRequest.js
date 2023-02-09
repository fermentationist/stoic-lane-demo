import { opError } from "./errors.js";

export default class APIRequest {
  constructor(config) {
    this.config = config;
    this.config.body = config.body || config.data || null;
    this.config.headers = config.headers || { Accept: "application/json", "Content-Type": "application/json" };
    this.url = config.url;
    this.abortController = new AbortController();
    this.config.signal = this.abortController.signal;

    // so methods still work if passed as higher-order functions
    this.request = this.request.bind(this);
    this.abort = this.abort.bind(this);
  }

  fetchWithTimeout(url, options = {}) {
    const { timeout = 20000 } = options;
    const timeoutId = setTimeout(() => {
      this.abort();
      console.log(`Request timed out at ${timeout / 1000} seconds`);
    }, timeout);
    return fetch(url, options).then((response) => {
      clearTimeout(timeoutId);
      return response;
    });
  }

  async request(additionalConfig = {}) {
    const requestConfig = {
      ...this.config,
      ...additionalConfig,
    };

    // log request
    console.log("REQUEST: ");
    console.log(requestConfig);

    // stringifying body after logging, so it will log an object instead of a string
    requestConfig.body = JSON.stringify(requestConfig.body);

    // return promise
    return this.fetchWithTimeout(this.url || requestConfig.url, requestConfig)
      .then((responseStream) => responseStream.json())
      .then((response) => {
        // log response
        console.log("RESPONSE:");
        console.log(response);
        return response;
      })
      .catch((error) => {
        if (requestConfig?.signal?.aborted) {
          // ignore "CanceledError"
          console.log("pending request aborted by client:", requestConfig);
        } else {
          let errorOutput = opError("Request failed", { name: "bad request" });
          /* 
          
          May need further adjustments because I replaced axios with fetch.

          */
          const realError = error.response?.data?.error;
          if (realError) {
            errorOutput = opError(realError.message, {
              name: realError.name,
              status: error.response.status,
            });
          } else if (error.message && error.response) {
            errorOutput = opError(error.message, {
              name: error.response.statusText,
              status: error.response.status,
            });
          } else if (error.message || error.code) {
            if (error.message.includes("timeout")) {
              errorOutput = opError("The server took too long to respond", {
                name: "Network error",
                status: 500,
              });
            } else {
              errorOutput = opError(error.message || "Request failed", {
                name: error.name || error.code || "bad request",
              });
            }
          } else {
            errorOutput = opError(JSON.stringify(error));
          }

          // log error
          console.log("ERROR:");
          console.log(errorOutput);
          return Promise.reject(errorOutput);
        }
      });
  }

  abort() {
    this.abortController.abort();
  }
}
