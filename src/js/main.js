/* The Game:

This is a 2 player turn-based, online multiplayer game

Theere are 3 types of cards (or units): soldier, horseman, canon
    • A soldier can beat a horseman, but can be beaten by a canon
    • A horseman can beat a canon, but can be beaten by a soldier
    • A canon can beat a soldier, but can be beaten by a horseman

A unit can only attack a unit of the type it can beat
A unit that attacs a unit of the same type will result in a tie, and therefore both units will be destroyed
A destroyed unit will be placed in the graveyard

Each player can have a maximum of 5 cards from the deck in their hand
Each player can have a maximum of 6 cards on the board
When the game starts, each player will be given 5 cards, and 6 cards will be placed on the board

The game will be played in turns
Each turn, a player can do one of 3 things:
    1. Attack with a card on the board
    2. Draw a card from the deck to their hand
    3. Add a card from their hand to the board

If a player attacks with a card, they must choose one of the opponent's cards on the board to attack

The game ends when one player has no cards left on the board

*/

/* Game logic: */
const socket = io();

const logsEl = document.getElementById('logs');
const player1HandEl = document.querySelector('[data-hand="player_1"]');
const player2HandEl = document.querySelector('[data-hand="player_2"]');
const player1BoardEl = document.querySelector('[data-board="player_1"]');
const player2BoardEl = document.querySelector('[data-board="player_2"]');

const units = {
    "soldier": {
        "can_beat": "horseman",
        "can_beat_by": "canon"
    },
    "horseman": {
        "can_beat": "canon",
        "can_beat_by": "soldier"
    },
    "canon": {
        "can_beat": "soldier",
        "can_beat_by": "horseman"
    }
};

const graveyard = [];

const player1 = {
    "name": "Player 1",
    "socketId": null,
    "hand": [],
    "board": []
};

const player2 = {
    "name": "Player 2",
    "socketId": null,
    "hand": [],
    "board": []
};

const deck = [
    ...Array(10).fill("soldier"),
    ...Array(10).fill("horseman"),
    ...Array(10).fill("canon")
];

// The game log is used to keep track of the game's history
const gameLog = [];
const log = (message) => {
    gameLog.push(message);

    const logEl = document.createElement("div");
    logEl.classList.add("log");
    logEl.innerHTML = message;
    logsEl.appendChild(logEl);
}

const shuffleDeck = () => {
    log("Shuffling the deck");

    for(let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // If the deck is empty, shuffle the graveyard and make it the new deck
    if (deck.length === 0) {
        deck.push(...graveyard);
        graveyard.length = 0;
        deck.sort(() => Math.random() - 0.5);
    }

    log(`Deck: ${deck}`);
}

// Setup the game
const setup = () => {
    log("Setting up the game");
    shuffleDeck();

    // Give each player 5 cards
    log("Giving each player 5 cards");
    for (let i = 0; i < 5; i++) {
        player1.hand.push(deck.pop());
        player2.hand.push(deck.pop());
    }

    // Place 6 cards on the board
    log("Placing 6 cards on the board");
    for (let i = 0; i < 6; i++) {
        player1.board.push(deck.pop());
        player2.board.push(deck.pop());
    }

    // Populate the player's hand and board
    log("Populating the player's hand and board");
    populateHand(player1, player1HandEl);
    populateHand(player2, player2HandEl);
    populateBoard(player1, player1BoardEl);
    populateBoard(player2, player2BoardEl);
}

// Draw a card from the deck to the player's hand
const drawCard = player => {
    log(`${player.name} is drawing a card`);

    // Shuffle the deck if it's empty
    shuffleDeck();

    // Add a card from the deck to the player's hand
    player.hand.push(deck.pop());

    log(`${player.name}'s hand: ${player.hand}`);
}

// Add a card from the player's hand to the board, there are only 6 spots on the board
const addCardToBoard = (player, card) => {
    log(`${player.name} is adding a card to the board`);

    if (player.board.length < 6) {
        player.board.push(player.hand.splice(player.hand.indexOf(card), 1)[0]);
    }

    log(`${player.name}'s board: ${player.board}`);
}

// Remove a card from the board and add it to the graveyard
const removeCardFromBoard = (player, card) => {
    log(`${player.name} is removing a card from the board`);
    graveyard.push(player.board.splice(player.board.indexOf(card), 1)[0]);
    log(`${player.name}'s board: ${player.board}`);
}

// Attack with a card on the board
const attack = (attacker, defender) => {
    // If the attacker and defender are the same type, it's a tie and both cards are destroyed
    if (attacker === defender) {
        log("It's a tie, both cards are destroyed");
        removeCardFromBoard(player1, attacker);
        removeCardFromBoard(player2, defender);
    }

    // If the attacker can beat the defender, the defender is destroyed
    if (units[attacker].can_beat === defender) {
        log(`${attacker} beats ${defender}`);
        removeCardFromBoard(player2, defender);
    }

    // A player is not allowed to attack with a card that can be beaten by the defender
    // If the attacker can be beaten by the defender, the player must choose another card to attack with
    if (units[attacker].can_beat_by === defender) {
        log(`${attacker} can't beat ${defender}! Try again`);
    }
}

// Check if the game is over
const isGameOver = () => {
    return player1.board.length === 0 || player2.board.length === 0;
}

// Get the winner
const getWinner = () => {
    return player1.board.length === 0 ? player2 : player1;
}

// Populate the player's hand
const populateHand = (player, handEl) => {
    handEl.innerHTML = "";

    player.hand.forEach(card => {
        const cardEl = document.createElement("div");
        cardEl.classList.add("card");
        cardEl.dataset.unit = card;
        handEl.appendChild(cardEl);
    });

    // if player is player2, flip the cards
    if (player.name === "Player 1") {
        handEl.querySelectorAll('.card').forEach(card => card.classList.add("flipped"));
    }
}

// Populate the player's board
const populateBoard = (player, boardEl) => {
    player.board.forEach((card, index) => {
        const cardEl = document.createElement("div");
        cardEl.classList.add("card");
        cardEl.dataset.unit = card;
        boardEl.querySelectorAll('.field')[index].appendChild(cardEl);
    });
}

// Play the game
const play = () => {
    // Setup the game
    setup();

    // Check if the game is over
    if (isGameOver()) {
        const winner = getWinner();
        log(`${winner.name} wins!`);
        return;
    }
}

play();

/* Multiplayer logic */
socket.on("connect", () => {
    console.log('socket.id:', socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on('startGame', (players) => {
    console.log(`Starting game between players ${players[0]} and ${players[1]}`);
});


/* UI logic */
const player1cards = player1HandEl.querySelectorAll(".card");
const player2cards = player2HandEl.querySelectorAll(".card");
const player1units = player1BoardEl.querySelectorAll(".card");
const player2units = player2BoardEl.querySelectorAll(".card");

// If a player selects one of their card on the board, it will select that card and deselect all other cards
// All cards that the selected card can beat will be highlighted
// Clicking on a highlighted card will attack with the selected card
// Clicking anywhere else will deselect the selected card and unhighlight all cards
player2BoardEl.addEventListener("click", event => {
    const targetIsCard = event.target.classList.contains("card");

    // Deselect all cards and unhighlight all cards
    if (!targetIsCard) {
        player2units.forEach(card => card.classList.remove("-selected"));
        player1units.forEach(card => card.classList.remove("-highlighted"));
        return;
    }

    // Select the card
    const card = event.target;
    const unit = card.dataset.unit;
    const isSelected = card.classList.contains("-selected");

    // If the card is already selected, deselect it and unhighlight all cards
    if (isSelected) {
        card.classList.remove("-selected");
        player1units.forEach(card => card.classList.remove("-highlighted"));
        return;
    }

    // Select card and check if it can beat any of the player1's cards
    // Deselect all other units first
    [...player2units, ...player1units].forEach(card => {
        card.classList.remove("-selected")
        card.classList.remove('-highlighted')
    });
    card.classList.add("-selected");
    player1units.forEach(card => {
        const opponentUnit = card.dataset.unit;

        if (units[unit].can_beat === opponentUnit || unit === opponentUnit) {
            card.classList.add("-highlighted");
        }
    });

});
