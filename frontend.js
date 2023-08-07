const socket = io();
const board = document.getElementById('board');

socket.on('connect', () => {
    console.log('Connected to the server.');

    // Initialize the game board

});

socket.on('gameOver', (result) => {
    // Display the game result (win, draw, or lose)
    console.log({ result });
    const winningObj = {
        0: 'You won',
        1: 'You Loss',
        2: 'Match Draw'
    }
    document.getElementById('turnText').innerHTML = winningObj[result]

});
socket.on('matchFound', (data) => {
    console.log('match found', data);
    document.getElementById('waitingTime').innerHTML = '';
    if (document.getElementById('matchStartBtn')) {
        document.getElementById('matchStartBtn').remove();
    }

})
socket.on('updateBoard', (data) => {
    const { currentPLayerSocketId, boardData, matchEndTime } = data;
    timeDifference(matchEndTime, counter);
    let turnText = 'Opponent turn'
    if (currentPLayerSocketId === socket.id) {
        turnText = 'Your Turn'
    }
    document.getElementById('turnText').innerHTML = turnText;
    console.log(data);
    // const cells = [];
    let html = '';
    for (let i = 0; i < boardData.length; i++) {
        html += `<div class="cell" dataset="${i}" onclick="moveCall(${i})">${boardData[i]}</div>`;
    }
    if (board) {
        board.innerHTML = html;
    }
})
const startGame = () => {
    socket.emit('joinMatchmaking');
}
const moveCall = (value) => {
    socket.emit('move', value);
}
socket.on('searchUser', (text) => {
    document.querySelector('#waitingTime').innerHTML = text;
    document.querySelector('#matchStartBtn').remove();
})
// socket.on('gameOver', (data) => {
//     console.log(data);
// })

function timeDifference(date, match_id) {

}
function pad2(number) {

    return (number < 10 ? '0' : '') + number
}

