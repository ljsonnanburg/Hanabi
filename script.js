//TODO (after MVP) add multiplayer connectivity, optional sixth color, colorblind mode, additional play options

// global variables
var players = []; // stores player name, objects, hint tracker state
var stacks = {
  red: 0,
  green: 0,
  blue: 0,
  yellow: 0,
  white: 0
};
var discard = [];
var deck = [];
var clueTokensMax = 8;
var clueTokens = 8;
var fuseTokens = 3;
var score = 0;
var countdown; // turn countdown to game end, triggers when deck is empty
var handLimit = 5; // normal hand limit for two players, hard coded until more players allowed
var colors = ["red", "green", "blue", "yellow", "white"]; // possible colors of cards, referenced for building deck and giving clues
var cardValues = [1,2,3,4,5]; // possible card values, referenced for giving clues
var playmats = document.getElementById("playmats");
var activePlayer; // variable indicating whose turn it is

function cloneValue(object) {
  return Object.assign({}, object);
}

/////////////////////
// Card Management //
/////////////////////

function systemMessage(message) {
  var newMessage = document.createElement("p")
  newMessage.classList.add("chat-message")
  newMessage.classList.add("system-message")
  newMessage.innerHTML = message
  displayMessage(newMessage);
}


function makeCardButton(newCardPanel, player, cardSlot, mechanic) {
  var newPlayButton = document.createElement("button");
  newPlayButton.classList.add("hand-button")
  
  if (mechanic == "play") {
    newPlayButton.innerText = "Play";
    newPlayButton.addEventListener('click', function() {
      playCard(player, cardSlot+1);
    })
  }
  else {
    newPlayButton.innerText = "Discard";
    newPlayButton.addEventListener('click', function() {
      discardCard(player, cardSlot+1);
    })
  }
  newCardPanel.appendChild(newPlayButton);
}   



function displayCard(container, card) {
  // var newCardPanel = document.createElement("div");
  // newCardPanel.classList.add("card-panel");
  // handDiv.appendChild(newCardPanel);
  var newCard = document.createElement("div");
  newCard.classList.add("card");
  newCard.textContent = card.cardValue;
  newCard.style.color = card.color;
  // console.log(player.hand[i][0]);
  container.appendChild(newCard);
}

function addHintTrackerBubble(rowDiv, pipContent) {
  var newHintPip = document.createElement("div");
  newHintPip.classList.add("hint-pip");
  if (typeof(pipContent) === "string") {
    newHintPip.style.backgroundColor = pipContent;
  }
  else {
    newHintPip.innerText = pipContent;
    newHintPip.style.backgroundColor = "white";
  }
  // newHintPip.innerHTML = "a"
  rowDiv.appendChild(newHintPip);
}

function displayHintTracker(cardPanel, card) {
  var hintTrackerTopRow = document.createElement("div");
  hintTrackerTopRow.classList.add("hint-row")
  var hintTrackerBottomRow = document.createElement("div");
  hintTrackerBottomRow.classList.add("hint-row")
  console.log(card.hintTrackerColor)
  // for (const colorHint in card.hintTrackerColor) {
  for (var i=0; i<card.hintTrackerColor.length; i++) {
    console.log(card.hintTrackerColor[i])
    addHintTrackerBubble(hintTrackerTopRow, card.hintTrackerColor[i])
  }
  for (var i=0; i<card.hintTrackerValues.length; i++) {
    console.log(card.hintTrackerValues[i])
    addHintTrackerBubble(hintTrackerBottomRow, card.hintTrackerValues[i])
  }
  // hintTrackerTopRow.innerHTML="asfas"
  cardPanel.appendChild(hintTrackerTopRow)
  cardPanel.appendChild(hintTrackerBottomRow)
}

function refreshCardDisplay(player) {
  console.log(player.name)
  var handDiv = document.getElementById(player.name + "-hand")
  // var handDiv = document.getElementById("player-hand")
  console.log(handDiv)
  handDiv.innerHTML = " "
  for (i = 0; i < player.hand.length; i++) {
    var newCardPanel = document.createElement("div")
    newCardPanel.classList.add("card-panel")
    handDiv.appendChild(newCardPanel)
    displayCard(newCardPanel, player.hand[i])
    makeCardButton(newCardPanel, player, i, "play")
    makeCardButton(newCardPanel, player, i, "discard")
    
    displayHintTracker(newCardPanel, player.hand[i]) 
  }
}

function drawCard(player, log = true) {
  console.log('drawing')
  let newCard = deck.pop()
  player.hand.push(newCard)
  if (deck.length == 0 && countdown == false) {
    alert("Only " + players.length + " turns remain!")
    countdown = players.length;
  }
  document.getElementById("deck-size").innerText = deck.length;
  
}

function discardCard(player, cardSlot) {
  let playedCard = player.hand[cardSlot-1];
  let color = playedCard.color;
  let cardValue = playedCard.cardValue;
  console.log(playedCard);
  systemMessage("<span class = system-message>"+ player.name + " discarded " + color  + " " + cardValue);
  player.hand.splice(cardSlot-1, 1);
  drawCard(player);
  refreshCardDisplay(player);
  addClueToken();
  var discardDiv = document.getElementById("discard")
  displayCard(discardDiv, playedCard)
}

function playCard(player, cardSlot) {
  let playedCard = player.hand[cardSlot-1];
  let color = playedCard.color;
  let cardValue = playedCard.cardValue;
  let resultMessage;
  console.log(playedCard)
  if (stacks[color] == cardValue - 1){
    stacks[color] ++;
    score ++;
    resultMessage = ". Everyone clapped.";
    console.log('good play')
    document.getElementById(color + "-stack").innerText = stacks[color];
  }
  else {
    fuseTokens --;
    resultMessage = ". This was ill-advised."
    document.getElementById("fuse-length").innerText = fuseTokens;
    if (fuseTokens == 0) {
      alert("You lose. This was a mistake. You should not have been trusted to play with fireworks.")
    }
  }
  systemMessage("<span class = system-message>"+ player.name + " played " + color  + " " + cardValue + resultMessage)
  player.hand.splice(cardSlot-1, 1);
  drawCard(player)
  refreshCardDisplay(player)
}

////////////////
// Game Setup //
////////////////

// randomizes order of array to simulate shuffling deck
function shuffle(deck) {
  deck.sort(() => Math.random() - 0.5);
}

// Generates a 2D array representing shuffled deck
// Each card is 2-element array e.g.: ["red", 1]
function generateDeck(sixColors = false) {
  // uses sixth color if players want a more challenging game
  if (sixColors) { 
    colors.push("purple")
  }
  let colorNums = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5];

  for (const color of colors) {
    for (const num of colorNums) {
      var newCard = {
        color:color,
        cardValue:num,
        hintTrackerColor:colors,
        hintTrackerValues:cardValues
      }
      deck.push(newCard)
    }
  }
  shuffle(deck);
  console.log(deck)
  return deck;
}

function addPlayerMat(playerName) {
  var playmatsDiv = document.getElementById("playmats");
  var newPlaymat = document.createElement("div");
  newPlaymat.classList.add("playmat");
  newPlaymat.id = playerName + "-playmat";
  
  var playerNamePlate = document.createElement("h3")
  playerNamePlate.classList.add("player-name-plate")
  playerNamePlate.innerText = playerName
  
  var newHand = document.createElement("div")
  newHand.classList.add("hand")
  newHand.id = playerName + "-hand"
  newPlaymat.appendChild(newHand)
  playmatsDiv.appendChild(playerNamePlate)
  playmatsDiv.appendChild(newPlaymat)
}

// initializes a player object
function initializePlayer(playerName) {
  // if player did not provide a name, they are named Player X
  // for MVP this will always be true
  var player = {
    name: playerName,
    hand: [],
    hintTracker: [],
  }
  addPlayerMat(playerName)
  for (var i=0; i<handLimit; i++) {
    drawCard(player, false)
    // player.hintTracker[i] = [[1,2,3,4,5],cloneValue(colors)]
  }
  players.push(player)
  console.log(players)

  refreshCardDisplay(player);
}

function initiatlizeGame() {
  generateDeck();
  clueTokens = 8;
  fuseTokens = 3;
  document.getElementById("clue-tokens").innerText = clueTokens;
  document.getElementById("fuse-length").innerText = fuseTokens;
  document.getElementById("score").innerText = score;
  initializePlayer("player");
  initializePlayer("ai");
  activePlayer = 0;
}

/////////////////////////////
// Game Loop & Maintenance //
/////////////////////////////

function addClueToken(){
  if (clueTokens < clueTokensMax) {
    clueTokens++;
  }
}

function updateCounters(){
  // document.getElementById("deck-size").innerText = deck.length;
  document.getElementById("clue-tokens").innerText = clueTokens;
  document.getElementById("fuse-length").innerText = fuseTokens;
  document.getElementById("score").innerText = score;
}

initiatlizeGame();
console.log(activePlayer)

////////////////////////
// Chat Box Functions //
////////////////////////

// function for when player types in chat box and presses enter or clicks send
// populates chat log with a new line showing their message
function sendMessage(speaker = "Player 1") {
  var chatInput = document.getElementById("chat-input");
  var chatLogElement = document.getElementById("chat-log");
  var message = chatInput.value;
  var newMessage = document.createElement("p")
  newMessage.classList.add("chat-message")
  newMessage.innerHTML = '<span class="player-name">' + speaker + ':</span> ' + message
  // ignores empty messages
  if (message !== "") {
    displayMessage(newMessage);
  }
  chatInput.value = ""
  // Scroll to the bottom of the chat log on send
  
}

// if user presses enter in chat input field, sends current message string
function chatKeypress(event) {
  if (event.keyCode == 13) {
    sendMessage()
  }
}

function displayMessage(messageHTML) {
  var chatLogElement = document.getElementById("chat-log");
  var messageSeparator = document.createElement("hr")
  messageSeparator.classList.add("message-separator")
  chatLogElement.append(messageSeparator)
  chatLogElement.append(messageHTML);
  chatLogElement.scrollTop = chatLogElement.scrollHeight;
}
