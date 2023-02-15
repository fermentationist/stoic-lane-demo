import { Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import CustomTextField from "../../components/CustomTextField";
import Page from "../../components/Page";
import withLoadingSpinner from "../../hoc/withLoadingSpinner";
import useAlert from "../../hooks/useAlert";
import APIRequest from "../../utils/APIRequest";

const InputRow = styled.div`
  display: flex;
  flex-direction: row;
  place-items: center;
  place-content: center;
  max-width: 100vw;
  margin-left: 14px;
  @media (max-width: 600px) {
    place-content: unset;
    margin-left: unset;
  }
`;

const OutputRow = styled.div`
  display: flex;
  flex-direction: row;
  place-items: center;
  place-content: center;
  max-width: 100vw;
  @media (max-width: 600px) {
    place-content: unset;
  }
`;

const Button = styled.button`
  margin: 0.5em;
`;

const TextField = styled(CustomTextField)`
  margin: 1em 0.5em 1em 1em;
  align-self: center;
  min-width: 40vw !important;
  @media (max-width: 600px) {
    align-self: unset;
    margin: 0.5em !important;
    min-width: unset !important;
  }
`;

const StyledPage = styled(Page)`
  display: flex;
  flex-direction: column;
  place-items: center;
  min-width: 100vw;
`;

const Home = ({ startLoading, doneLoading }) => {
  const [output, setOutput] = useState("");
  const { callAlert, alertError } = useAlert();
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    doneLoading();
  }, []);

  const validateURL = (url) => {
    const regex =
      /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
    if (!url || !regex.test(url)) {
      return null;
    }
    if (url.slice(0, 4).toLowerCase() !== "http") {
      url = `https://${url}`;
    }
    try {
      const newURL = new URL(url);
      return newURL.href;
    } catch (error) {
      console.log(error);
      console.log("invalid URL");
      return null;
    }
  };

  const submit = async event => {
    event.preventDefault();
    const userInput = inputRef.current.value.trim();
    const validURL = validateURL(userInput);
    if (!validURL) {
      return callAlert("Invalid URL");
    }
    const getShortenedURL = new APIRequest({
      url: "/api/shorten-url",
      method: "post",
      body: { url: validURL },
      headers: { "Content-Type": "application/json" },
    });
    startLoading();
    const response = await getShortenedURL.request().catch((error) => {
      alertError(error);
      return null;
    });
    doneLoading(250);
    setOutput(response?.shortenedURL || null);
  };

  const copyToClipboard = async () => {
    if ("writeText" in navigator?.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(output);
    } else {
      // execCommand is deprecated, only use if Clipboard API is not available
      outputRef.current.select();
      document.execCommand("copy");
    }
    callAlert("Shortened URL copied to clipboard");
  };

  const onKeyDown = event => {
    if (event.key === "Enter" && inputRef.current.value) {
      submit(event);
    }
  }

  return (
    <StyledPage>
      <Stack>
        <InputRow>
          <TextField
            internalLabel="URL to be shortened"
            name="url"
            ref={inputRef}
            margin="1em"
            width="250px"
            onKeyDown={onKeyDown}
          />
          <Button onClick={submit}>submit</Button>
        </InputRow>
        {output ? (
          <OutputRow>
            <TextField
              disabled
              internalLabel="shortened URL"
              name="output"
              ref={outputRef}
              value={output}
              margin="1em"
              width="250px"
            />
            <Button onClick={copyToClipboard}>copy</Button>
          </OutputRow>
        ) : null}
      </Stack>
    </StyledPage>
  );
};

export default withLoadingSpinner(Home);
