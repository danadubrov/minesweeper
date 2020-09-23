'use strict'
console.log('hello minesweeper')

const MINE = '💥';
const FLAG = '🏳️';
const EMPTY = '';
var gBoard;
var gFirstClick = false;
var gTimeInterval;

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

var gLevel = {
    SIZE: 4,
    MINES: 2
}

function init() {
    gGame.isOn = true;
    gBoard = buildBoard();
    renderBoard(gBoard);
}


function buildBoard() {
    var board = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            board[i][j] = cell;
        }
    }
    // board[2][2].isMine = true;
    // board[0][1].isMine = true;
    return board;
}



function renderBoard(board) {
    var strHtml = '';
    for (var i = 0; i < board.length; i++) {
        var row = board[i];
        strHtml += '<tr>';
        for (var j = 0; j < board.length; j++) {
            var cell = row[j];
            var tdId = 'cell-' + i + '-' + j;
            strHtml += '<td id="' + tdId + '" class="cell" onclick="cellClicked(this)" oncontextmenu="cellMarked(this)"></td>';
        }
        strHtml += '</tr>';
    }
    var elBoard = document.querySelector('.board');
    console.log(elBoard);
    elBoard.innerHTML = strHtml;
}

function setMinesNegsCount() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var cell = gBoard[i][j];
            cell.minesAroundCount = countNegs({ i: i, j: j });
        }
    }

}

function countNegs(pos) {
    var count = 0;
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === pos.i && j === pos.j) continue;
            if (gBoard[i][j].isMine) count++;
        }
    }
    return count;
}

function cellClicked(elCell) {
    if (!gGame.isOn) return;
    if (!gFirstClick) {
        createMines(elCell);
        startTimer();
    }

    var cellCoord = getCellCoord(elCell.id);
    var cell = gBoard[cellCoord.i][cellCoord.j];

    if (cell.isMarked|| cell.isShown) return;
    if (cell.isMine) {
        gGame.isOn = false;
        revealMines();
        clearInterval(gTimeInterval);
    }
    else {
        renderCell(cellCoord);
        if (cell.minesAroundCount === 0) revealNegs(cellCoord);
    }
    checkGameOver();
}

function cellMarked(elCell) {
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);

    if (!gGame.isOn) return;

    var cellCoord = getCellCoord(elCell.id);
    var cell = gBoard[cellCoord.i][cellCoord.j];

    if (cell.isShown) return;
    if (cell.isMarked) {
        elCell.innerText = EMPTY;
        cell.isMarked = false;
        gGame.markedCount--;
    }
    else {
        elCell.innerText = FLAG;
        cell.isMarked = true;
        gGame.markedCount++;
        checkGameOver();
    }

    // console.log(elCell);
}



function createMines(elCell) {
    gFirstClick = true;
    var cellCoord = getCellCoord(elCell.id);
    var clickedCell = gBoard[cellCoord.i][cellCoord.j];

    var mines = 0;
    while (mines < gLevel.MINES) {
        var i = getRandomIntInclusive(0, gLevel.SIZE - 1);
        var j = getRandomIntInclusive(0, gLevel.SIZE - 1);
        var cell = gBoard[i][j];
        if (!cell.isMine && cell !== clickedCell) {
            cell.isMine = true;
            mines++;
        }
    }
    setMinesNegsCount(gBoard);
}

function revealMines() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j];
            if (cell.isMine) {
                var elCell = document.querySelector('#cell-' + i + '-' + j);
                elCell.innerText = MINE;
                elCell.classList.add('mine');
                elCell.classList.remove('cell');
            }
        }
    }
}

function revealNegs(pos) {
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === pos.i && j === pos.j) continue;
            var currPos = { i: i, j: j };
            var cell = gBoard[i][j];
            if (!cell.isShown && !cell.isMarked) renderCell(currPos);
        }
    }
    return;
}

function renderCell(pos) {
    var cell = gBoard[pos.i][pos.j];
    var elCell = document.querySelector('#cell-' + pos.i + '-' + pos.j);
    if (cell.minesAroundCount === 0) {
        elCell.innerText = '';
    }
    else elCell.innerText = cell.minesAroundCount;

    elCell.classList.add('clicked');
    elCell.classList.remove('cell');
    gGame.shownCount++;
    console.log(gGame.shownCount);
    cell.isShown = true;
}


function startTimer() {
    var startTime = new Date();

    gTimeInterval = setInterval(function () {
        var endTime = new Date();
        var timeDiff = ((endTime - startTime) / 1000);
        var secs = Math.round(timeDiff % 60);
        timeDiff = Math.floor(timeDiff / 60);
        var mins = Math.round(timeDiff % 60);
        // console.log(mins + ':' + secs);
        var elTimer = document.querySelector('.timer');
        elTimer.innerText = mins + ':' + secs;
    }, 1000)
}


function checkGameOver() {
    if (gGame.shownCount + gGame.markedCount !== gLevel.SIZE ** 2 || gGame.markedCount !== gLevel.MINES) return;
    console.log('victory');
    gGame.isOn = false;
    var elMessage = document.querySelector('.message');
    elMessage.innerText = 'VICTORY!'
    clearInterval(gTimeInterval);
}



function getCellCoord(elCellId) {
    var coord = {};
    var parts = elCellId.split('-');
    coord.i = +parts[1]
    coord.j = +parts[2];
    return coord;
}


function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}