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

        const [currentId, opponent] = getOpponentId(room);
        if (room.players[room.currentPlayerIndex] === socket &&
            isValidMove(room.board, cellIndex)) {
            // Update the board with the move
            room.board[cellIndex] = room.currentPlayerIndex === 0 ? 'X' : 'O';
            const res = { currentPLayerSocketId: opponent.id, boardData: room.board }
            io.in(room.id).emit('updateBoard', res);

            // Check if the current player wins or the game is a draw
            console.log(new Date(room.matchEndTime));
            if (checkWin(room.board, room.board[cellIndex]) || !room.board.includes('') || new Date() > room.matchEndTime) {
                resetGameRoom(room);
                if (!room.board.includes('') || new Date() > room.matchEndTime) {
                    socketResponseToId(socket.id, 'gameOver', 2); // 0 won,1 loss,2 draw
                    socketResponseToId(opponent.id, 'gameOver', 2);
                    return;
                }
                socketResponseToId(socket.id, 'gameOver', 0);
                socketResponseToId(opponent.id, 'gameOver', 1);
            } else {
                // Switch to the next player's turn
                room.currentPlayerIndex = 1 - room.currentPlayerIndex;
            }
        }
    });
    function socketResponseToId(socketId, eventName, data = '') {
        io.to(socketId).emit(eventName, data);
    }
    function getOpponentId(room) {
        const currentId = room.players[room.currentPlayerIndex].id;
        const [opponent] = room.players.filter((items) => items.id !== currentId);
        return [currentId, opponent];
    }
    socket.on('disconnect', () => {
        console.log('A user disconnected.');
        if (matchmakingQueue.length) {
            matchmakingQueue = [];
        }
        // console.log(matchmakingQueue);
        // Handle the player leaving a game room
        const room = getRoomBySocket(socket);
        if (room) {
            const [opponentSocket] = room.players.filter((items) => items.id !== socket.id);
            socketResponseToId(opponentSocket.id, 'gameOver', 0);
            resetGameRoom(room);
        }
    });
});

function tryMatchPlayers() {
    // Check if there are at least two players in the queue
    if (matchmakingQueue.length >= 2) {
        // Pair the first two players in the queue and create a match room
        var matchEndTime = new Date();
        matchEndTime.setMinutes(matchEndTime.getMinutes() + 1);
        const player1 = matchmakingQueue.shift();
        const player2 = matchmakingQueue.shift();
        const roomId = generateRoomId();

        // Create the game room
        gameRooms[roomId] = {
            id: roomId,
            board: Array(9).fill(''),
            players: [player1, player2],
            currentPlayerIndex: 0,
            matchEndTime
        };
        gameRooms[roomId].players.forEach(element => {
            element.join(roomId);
        });
        // Notify the players about the match and start the game
        io.in(roomId).emit('matchFound', roomId);
        const currentPLayerSocketId = gameRooms[roomId].players[0].id;
        const res = {
            boardData: gameRooms[roomId].board,
            currentPLayerSocketId,
            matchEndTime
        }
        io.to(roomId).emit('updateBoard', res);
    } else {
        io.to(matchmakingQueue[0].id).emit('searchUser', 'waiting for opponent');
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
        return combination.every(cellIndex =>
            board[cellIndex] === player
        );
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
