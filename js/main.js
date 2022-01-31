document.addEventListener("DOMContentLoaded", () => {
  initHelpModal();
  initStatsModal();
  gapi.load("client", start);

  let wordObject;
  let currentWord;

  // also in local storage
  let guessedWordCount = 0;
  let availableSpace = 1;
  let guessedWords = [[]];

  const DISCOVERY_DOCS = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
  ];

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

  function start() {
    gapi.client
      .init({
        apiKey: "<GOOGLE_API_KEY_HERE>",
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      })
      .then(function () {
        console.log("THEN");
        return gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: "1ALmX0M5ilqBBWinBWg-a_gMr7iFv6MSIcaQw-0shgGM",
          range: "food-words!A2:D26",
        });
      })
      .then(
        function (response) {
          const data = response.result.values.map((arr) => {
            const [id, date, word, sponsor] = arr;
            return { id, date, word, sponsor };
          });

          const currentDate = new Date();
          wordObject = data.find((w) => new Date(w.date) > currentDate);
          currentWord = wordObject.word;
          loadLocalStorage();
        },
        function (reason) {
          console.log("Error: " + reason.result.error.message);
        }
      );
  }

  function loadLocalStorage() {
    if (currentWord !== window.localStorage.getItem("currentWord")) {
      window.localStorage.removeItem("availableSpace");
      window.localStorage.removeItem("guessedWordCount");
      window.localStorage.removeItem("guessedWords");
      window.localStorage.removeItem("keyboardContainer");
      window.localStorage.removeItem("boardContainer");
      localStorage.setItem("currentWord", currentWord);
      createSquares();
      addKeyboardClicks();
      return;
    }

    guessedWordCount =
      Number(window.localStorage.getItem("guessedWordCount")) || 0;
    availableSpace = Number(window.localStorage.getItem("availableSpace")) || 1;

    const storedGuessedWords = window.localStorage.getItem("guessedWords");
    if (storedGuessedWords) {
      guessedWords = JSON.parse(storedGuessedWords);
    }

    const storedKeyboardContainer =
      window.localStorage.getItem("keyboardContainer");

    if (storedKeyboardContainer) {
      const keyboardContainerEl = document.getElementById("keyboard-container");
      keyboardContainerEl.innerHTML = storedKeyboardContainer;
      addKeyboardClicks();
    }

    const storedBoardContainer = window.localStorage.getItem("boardContainer");

    if (storedBoardContainer) {
      const boardContainerEl = document.getElementById("board-container");
      boardContainerEl.innerHTML = storedBoardContainer;
    } else {
      createSquares();
      addKeyboardClicks();
    }
  }

  function updateLocalStorage() {
    window.localStorage.setItem("guessedWords", JSON.stringify(guessedWords));

    const keyboardContainer = document.getElementById("keyboard-container");
    window.localStorage.setItem(
      "keyboardContainer",
      keyboardContainer.innerHTML
    );

    const boardContainer = document.getElementById("board-container");
    window.localStorage.setItem("boardContainer", boardContainer.innerHTML);
  }

  function createSquares() {
    const gameBoard = document.getElementById("board");

    for (let i = 0; i < 30; i++) {
      let square = document.createElement("div");
      square.classList.add("animate__animated");
      square.classList.add("square");
      square.setAttribute("id", i + 1);
      gameBoard.appendChild(square);
    }
  }

  function getCurrentWordArr() {
    const numberOfGuessedWords = guessedWords.length;
    return guessedWords[numberOfGuessedWords - 1];
  }

  function getTileClass(letter, index) {
    const isCorrectLetter = currentWord
      .toUpperCase()
      .includes(letter.toUpperCase());

    if (!isCorrectLetter) {
      return "incorrect-letter";
    }

    const letterInThatPosition = currentWord.charAt(index);
    const isCorrectPosition =
      letter.toLowerCase() === letterInThatPosition.toLowerCase();

    if (isCorrectPosition) {
      return "correct-letter-in-place";
    }

    return "correct-letter";
  }

  function updateGuessedLetters(letter) {
    const currentWordArr = getCurrentWordArr();

    if (currentWordArr && currentWordArr.length < 5) {
      currentWordArr.push(letter);

      const availableSpaceEl = document.getElementById(availableSpace);

      availableSpaceEl.textContent = letter;
      availableSpace = availableSpace + 1;
    }
  }

  function showSponsor() {
    const keyboardContainerEl = document.getElementById("keyboard-container");
    keyboardContainerEl.classList.add("hidden");

    const sponsorEl = document.getElementById("sponsor");
    sponsorEl.classList.remove("hidden");
    sponsorEl.classList.add("animate__backInDown");
  }

  function showResult() {
    const finalResultEl = document.getElementById("final-score");
    finalResultEl.textContent = `Foodle ${wordObject.id} ${guessedWordCount}/6`;

    showSponsor();

    const currentStreak = window.localStorage.getItem("currentStreak") || 0;
    window.localStorage.setItem("currentStreak", Number(currentStreak) + 1);

    const totalWins = window.localStorage.getItem("totalWins") || 0;
    window.localStorage.setItem("totalWins", Number(totalWins) + 1);
  }

  function showLosingResult() {
    const finalResultEl = document.getElementById("final-score");
    finalResultEl.textContent = `Foodle ${wordObject.id} - Unsuccessful Today!`;

    showSponsor();

    window.localStorage.setItem("currentStreak", 0);
  }

  function clearBoard() {
    for (let i = 0; i < 30; i++) {
      let square = document.getElementById(i + 1);
      square.textContent = "";
    }

    const keys = document.getElementsByClassName("keyboard-button");

    for (var key of keys) {
      key.disabled = true;
    }

    const totalPlayed = window.localStorage.getItem("totalPlayed") || 0;
    window.localStorage.setItem("totalPlayed", Number(totalPlayed) + 1);
  }

  async function handleSubmitWord() {
    const currentWordArr = getCurrentWordArr();
    const guessedWord = currentWordArr.join("");

    if (guessedWord.length !== 5) {
      return;
    }

    try {
      const res = await fetch(
        `https://wordsapiv1.p.rapidapi.com/words/${guessedWord.toLowerCase()}`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
            "x-rapidapi-key": "<YOU_KEY_HERE>",
          },
        }
      );

      if (!res.ok) {
        throw Error();
      }

      localStorage.setItem("availableSpace", availableSpace);

      const firstLetterId = guessedWordCount * 5 + 1;

      const interval = 200;
      currentWordArr.forEach((letter, index) => {
        setTimeout(() => {
          const tileClass = getTileClass(letter, index);
          if (tileClass) {
            const letterId = firstLetterId + index;
            const letterEl = document.getElementById(letterId);
            letterEl.classList.add("animate__flipInX");
            letterEl.classList.add(tileClass);

            const keyboardEl = document.querySelector(`[data-key=${letter}]`);
            keyboardEl.classList.add(tileClass);
          }

          if (index === 4) {
            updateLocalStorage();
          }
        }, index * interval);
      });

      guessedWordCount += 1;
      localStorage.setItem("guessedWordCount", guessedWordCount);

      if (guessedWord === currentWord) {
        setTimeout(() => {
          const okSelected = window.confirm("Well done!");
          if (okSelected) {
            clearBoard();
            showResult();
          }
          return;
        }, 1200);
      }

      if (guessedWords.length === 6) {
        setTimeout(() => {
          const okSelected = window.confirm(
            `Sorry, you have no more guesses! The word is "${currentWord.toUpperCase()}".`
          );
          if (okSelected) {
            clearBoard();
            showLosingResult();
          }
          return;
        }, 1200);
      }

      guessedWords.push([]);
    } catch (_error) {
      window.alert("Word is not recognised!");
    }
  }

  function handleDelete() {
    const currentWordArr = getCurrentWordArr();

    if (!currentWordArr.length) {
      return;
    }

    currentWordArr.pop();

    guessedWords[guessedWords.length - 1] = currentWordArr;

    const lastLetterEl = document.getElementById(availableSpace - 1);

    lastLetterEl.innerHTML = "";
    availableSpace = availableSpace - 1;
  }

  function addKeyboardClicks() {
    const keys = document.querySelectorAll(".keyboard-row button");
    for (let i = 0; i < keys.length; i++) {
      keys[i].onclick = ({ target }) => {
        const key = target.getAttribute("data-key");

        if (key === "enter") {
          handleSubmitWord();
          return;
        }

        if (key === "del") {
          handleDelete();
          return;
        }

        updateGuessedLetters(key);
      };
    }
  }

  function initHelpModal() {
    const modal = document.getElementById("help-modal");

    // Get the button that opens the modal
    const btn = document.getElementById("help");

    // Get the <span> element that closes the modal
    const span = document.getElementById("close-help");

    // When the user clicks on the button, open the modal
    btn.onclick = function () {
      modal.style.display = "block";
    };

    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
      modal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  }

  function updateStatsModal() {
    const currentStreak = Number(window.localStorage.getItem("currentStreak"));
    const totalWins = Number(window.localStorage.getItem("totalWins"));
    const totalPlayed = Number(window.localStorage.getItem("totalPlayed"));

    document.getElementById("current-streak").textContent = currentStreak || 0;
    document.getElementById("total-wins").textContent = totalWins || 0;
    document.getElementById("total-played").textContent = totalPlayed || 0;
    document.getElementById("win-pct").textContent = `${
      Math.round((totalWins / totalPlayed) * 100) || 0
    }`;
  }

  function initStatsModal() {
    const modal = document.getElementById("stats-modal");

    // Get the button that opens the modal
    const btn = document.getElementById("stats");

    // Get the <span> element that closes the modal
    const span = document.getElementById("close-stats");

    // When the user clicks on the button, open the modal
    btn.onclick = function () {
      updateStatsModal();
      modal.style.display = "block";
    };

    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
      modal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  }
});
