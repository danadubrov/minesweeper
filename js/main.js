'use strict'
console.log('hello minesweeper')

const MINE = '💥';
const FLAG = '🏴';
const EMPTY = '';
const VICTORY = '👑';
const LOSE = '💩';
const NORMAL = '😸';
const LIVES = '♥';

var gBoard;
var gFirstClick = false;
var gTimeInterval;

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3,
    safeClicks: 3,
    isHint: false
}

var gLevel = {
    SIZE: 4,
    MINES: 2
}

function init() {
    restartGame();
    gBoard = buildBoard();
    renderBoard(gBoard);
}

function restartGame() {
    gFirstClick = false;
    gGame.isOn = true;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.safeClicks = 3;
    gGame.isHint = false;
    gGame.lives = (gLevel.SIZE === 4) ? 2 : 3;

    clearInterval(gTimeInterval);

    var elTimer = document.querySelector('.timer');
    elTimer.innerText = '0:0';

    var elHintBox = document.querySelector('.hint');
    elHintBox.classList.remove('btn-on');

    changeIcon(NORMAL);
    displayLives();
    displaySafeClicksLeft();
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
        gFirstClick = true;
        createMines(elCell);
        startTimer();
    }

    var cellCoord = getCellCoord(elCell.id);
    var cell = gBoard[cellCoord.i][cellCoord.j];

    if (gGame.isHint) {
        showHint(cellCoord);
        var elHintBox = document.querySelector('.hint');
        setTimeout(function () { elHintBox.classList.remove('btn-on') }, 500);
        gGame.isHint = false;
        return;
    }
    if (cell.isMarked || cell.isShown) return;
    if (cell.isMine && gGame.lives === 1) {
        gGame.isOn = false;
        revealMines();
        clearInterval(gTimeInterval);
        changeIcon(LOSE);
    }
    else if (cell.isMine) {
        gGame.lives--;
        displayLives();
        // renderCell(cellCoord);
        // console.log(gGame.lives + ' lives left');
        // gGame.markedCount++;
        elCell.innerText = MINE;
        elCell.classList.add('mine');
        elCell.classList.remove('cell');
        setTimeout(function(){
            elCell.innerText = EMPTY;
            elCell.classList.add('cell');
            elCell.classList.remove('mine');
        },500)

    }
    else {
        expandCell(cellCoord);
        if (cell.minesAroundCount === 0) expandShown(cellCoord);
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

function expandShown(pos) {
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === pos.i && j === pos.j) continue;
            var currPos = { i: i, j: j };
            var cell = gBoard[i][j];
            if (!cell.isShown && !cell.isMarked) expandCell(currPos);
        }
    }
    return;
}

function expandCell(pos) {
    var cell = gBoard[pos.i][pos.j];
    var elCell = document.querySelector('#cell-' + pos.i + '-' + pos.j);

    if (cell.isMine) {
        elCell.innerText = MINE;
        elCell.classList.add('mine');
        elCell.classList.remove('cell');
        elCell.classList.remove('hint');
        cell.isShown = true;
        cell.isMarked = true;
        return;
    }
    else if (cell.minesAroundCount === 0) {
        elCell.innerText = EMPTY;
    }
    else elCell.innerText = cell.minesAroundCount;

    elCell.classList.add('clicked');
    elCell.classList.remove('cell');
    elCell.classList.remove('hint');
    
    gGame.shownCount++;
    console.log(gGame.shownCount + 'cells shown');
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

function chooseLevel(elBtn) {
    if (elBtn.id === 'level1') {
        gLevel.SIZE = 4;
        gLevel.MINES = 2;
    }
    else if (elBtn.id === 'level2') {
        gLevel.SIZE = 8;
        gLevel.MINES = 12;
    }
    else if (elBtn.id === 'level3') {
        gLevel.SIZE = 12;
        gLevel.MINES = 30;
    }
    init();
}

function displayLives() {
    var livesStr = '';
    for (var i = 0; i < gGame.lives; i++) {
        livesStr += ' ' + LIVES;
    }

    var elLives = document.querySelector('.lives');
    elLives.innerText = livesStr;
}

function checkGameOver() {
    if (gGame.shownCount + gGame.markedCount !== gLevel.SIZE ** 2 || gGame.markedCount !== gLevel.MINES) return;
    console.log('victory');
    gGame.isOn = false;
    changeIcon(VICTORY);
    clearInterval(gTimeInterval);
}


function hintClicked() {
    if (!gFirstClick) return;
    gGame.isHint = true;

    var elHintBox = document.querySelector('.hint');
    elHintBox.classList.add('btn-on');
}

function showHint(pos) {
    console.log('showing hint');
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;

            var cell = gBoard[i][j];
            if (cell.isShown || cell.isMarked) continue;

            var elCell = document.querySelector('#cell-' + i + '-' + j);
            elCell.classList.remove('cell');
            elCell.classList.add('hint');
            if (cell.isMine) {
                elCell.innerText = MINE;
                elCell.classList.add('mine');
                continue;
            }
            else if (cell.minesAroundCount === 0) {
                elCell.innerText = EMPTY;
            }
            else elCell.innerText = cell.minesAroundCount;

            elCell.classList.add('clicked');
        }
        setTimeout(function () { hideHint(pos) }, 500);
    }
    return;
}

function hideHint(pos) {
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;

            var cell = gBoard[i][j];
            if (cell.isShown || cell.isMarked) continue;

            var elCell = document.querySelector('#cell-' + i + '-' + j);

            elCell.innerText = EMPTY;
            elCell.classList.remove('clicked');
            elCell.classList.remove('mine');
            elCell.classList.remove('hint');
            elCell.classList.add('cell');
        }
    }
    
    return;
}



function showSafeClick() {
    if (gGame.safeClicks < 1) return;
    var safeClicks = [];

    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j];
            if (!cell.isShown && !cell.isMine && !cell.isMarked) {
                safeClicks.push({ i: i, j: j });
            }
        }
    }
    if (typeof safeClicks[0] === 'undefined') return;

    var randomIdx = getRandomIntInclusive(0, safeClicks.length - 1);
    var safeCellPos = safeClicks[randomIdx];

    console.log(safeCellPos);
    var elCell = document.querySelector('#cell-' + safeCellPos.i + '-' + safeCellPos.j);
    elCell.classList.add('safe');
    setTimeout(function () { elCell.classList.remove('safe') }, 500)

    gGame.safeClicks--;
    displaySafeClicksLeft();
}

function displaySafeClicksLeft() {
    var clicksStr = '';
    for (var i = 0; i < gGame.safeClicks; i++) {
        clicksStr += ' ●';
    }

    var elClicks = document.querySelector('.bullets');
    elClicks.innerText = clicksStr;
}

function changeIcon(icon) {
    var elIcon = document.querySelector('.icon');
    elIcon.innerText = icon;
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

