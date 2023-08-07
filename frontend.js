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
    timeDifference(matchEndTime, 'counter');
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
    var countDownDate = new Date(date).getTime();

    // Update the count down every 1 second
    var x = setInterval(function () {

        // Get today's date and time
        var now = new Date().getTime();

        // Find the distance between now and the count down date
        var distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Output the result in an element with id="demo"
        days = (days > 0) ? days + "d " : ''
        hours = (hours > 0) ? hours + "h " : ''
        minutes = (minutes > 0) ? minutes + "m " : ''
        seconds = (seconds > 0) ? seconds + "s " : ''
        document.getElementById(match_id).innerHTML = days + hours
            + minutes + seconds;

        // If the count down is over, write some text 
        if (distance < 0) {
            clearInterval(x);
            document.getElementById(match_id).innerHTML = "EXPIRED";
        }
    }, 1000);
}
function pad2(number) {

    return (number < 10 ? '0' : '') + number
}

