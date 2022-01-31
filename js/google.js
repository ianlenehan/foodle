document.addEventListener("DOMContentLoaded", () => {
  // Array of API discovery doc URLs for APIs used by the quickstart
  const DISCOVERY_DOCS = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
  ];

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

  function start() {
    console.log("START?", gapi);
    // 2. Initialize the JavaScript client library.
    gapi.client
      .init({
        apiKey: "AIzaSyAbIkz58XtTRXtL6_pBulUCue9St-b0hcI",
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      })
      .then(function () {
        console.log("THEN");
        // 3. Initialize and make the API request.
        return gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: "1ALmX0M5ilqBBWinBWg-a_gMr7iFv6MSIcaQw-0shgGM",
          range: "food-words!A2:D26",
        });
      })
      .then(
        function (response) {
          console.log("RESPONSE");
          console.log(response.result);
        },
        function (reason) {
          console.log("Error: " + reason.result.error.message);
        }
      );
  }
  // 1. Load the JavaScript client library.
  gapi.load("client", start);
});
