const socket = io();
const board = document.getElementById('board');

socket.on('connect', () => {
    console.log('Connected to the server.');

    // Initialize the game board
    const cells = [];
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => {
            socket.emit('move', i);
        });
        if (board) {
            board.appendChild(cell);
        }
        cells.push(cell);
    }
});

socket.on('updateBoard', (boardState) => {
    // Update the UI with the new board state
    if (board) {
        const cells = board.getElementsByClassName('cell');
        for (let i = 0; i < cells.length; i++) {
            cells[i].textContent = boardState[i];
        }
    }
});

socket.on('gameOver', (result) => {
    // Display the game result (win, draw, or lose)
    if (result === 'win') {
        alert('You win!');
    } else if (result === 'draw') {
        alert('It\'s a draw!');
    } else if (result === 'lose') {
        alert('You lose!');
    }
});
socket.on('matchFound', () => {
    console.log('match found');
})
socket.on('updateBoard', (data) => {
    console.log({ data });
})
const startGame = () => {
    socket.emit('joinMatchmaking');
}
