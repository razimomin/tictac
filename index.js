const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { v4: uuidv4 } = require('uuid');
// Serve the front-end
app.use(express.static(__dirname));
app.get('/', (req, res) => {

    res.sendFile(__dirname + '/index.html');
    res.sendFile(__dirname + '/game.html');
});

// Game state
const gameRooms = {};
let matchmakingQueue = [];
io.on('connection', (socket) => {
    console.log('A user connected.');

    socket.on('joinMatchmaking', () => {
        // Add the player to the matchmaking queue
        // console.log('match making start');
        const [existSocketIdCheck] = matchmakingQueue.filter((items) => {
            return items.id === socket.id
        })
        if (!existSocketIdCheck) {
            matchmakingQueue.push(socket);
            tryMatchPlayers();
        }

    });

    socket.on('move', (cellIndex) => {
        // Get the current game room of the player
        const room = getRoomBySocket(socket);
        if (!room) {
            return;
        }

        // Check if it's the player's turn and the move is valid
        console.log(room);
        if (room.players[room.currentPlayerIndex] === socket &&
            isValidMove(room.board, cellIndex)) {
            // Update the board with the move
            room.board[cellIndex] = room.currentPlayerIndex === 0 ? 'X' : 'O';
            io.to(room.id).emit('updateBoard', room.board);

            // Check if the current player wins or the game is a draw
            // console.log(room.board[cellIndex]);
            // console.log(room.board);
            // console.log('win', checkWin(room.board, room.currentPlayerIndex));
            if (checkWin(room.board, room.board[cellIndex]) ||
                !room.board.includes('')) {
                io.to(room.id).emit('gameOver', 'win');
                io.to(room.opponent(socket)).emit('gameOver', 'lose');
                resetGameRoom(room);
            } else {
                // Switch to the next player's turn
                room.currentPlayerIndex = 1 - room.currentPlayerIndex;
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected.');

        // Remove the player from the matchmaking queue
        const index = matchmakingQueue.indexOf(socket);
        if (index !== -1) {
            matchmakingQueue.splice(index, 1);
        }

        // Handle the player leaving a game room
        const room = getRoomBySocket(socket);
        if (room) {
            io.to(room.id).emit('gameOver', 'win'); // The opponent wins by default
            resetGameRoom(room);
        }
    });
});

function tryMatchPlayers() {
    // Check if there are at least two players in the queue
    if (matchmakingQueue.length >= 2) {
        // Pair the first two players in the queue and create a match room
        const player1 = matchmakingQueue.shift();
        const player2 = matchmakingQueue.shift();
        const roomId = generateRoomId();

        // Create the game room
        gameRooms[roomId] = {
            id: roomId,
            board: Array(9).fill(''),
            players: [player1, player2],
            currentPlayerIndex: 0,
            opponent(socket) {
                return this.players[1 - this.players.indexOf(socket)];
            }
        };

        // Notify the players about the match and start the game
        player1.join(roomId);
        player2.join(roomId);
        player1.emit('matchFound', roomId);
        player2.emit('matchFound', roomId);
        io.to(roomId).emit('updateBoard', gameRooms[roomId].board);
    }
}

function getRoomBySocket(socket) {
    for (const roomId in gameRooms) {
        if (gameRooms[roomId].players.includes(socket)) {
            return gameRooms[roomId];
        }
    }
    return null;
}

function isValidMove(board, cellIndex) {
    return board[cellIndex] === '';
}

function checkWin(board, player) {

    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    return winningCombinations.some(combination => {
        console.log(player);
        return combination.every(cellIndex => board[cellIndex] === player);
    });
}

function resetGameRoom(room) {
    room.board = Array(9).fill('');
    room.currentPlayerIndex = 0;
}

function generateRoomId() {
    return uuidv4();
}

const port = 3000;
http.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
