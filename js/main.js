'use strict'
console.log('hello minesweeper')

var gBoard;
var gFirstClick;
var gMinesCount;
var gTimeInterval;

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3,
    safeClicks: 3,
    hints: 3,
    isHint: false,
    isManual: false
}

var gLevel = {
    SIZE: 4,
    MINES: 2
}

function init() {
    restartGame();
    gBoard = buildBoard();
    renderBoard(gBoard);

    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);
}

function restartGame() {
    gFirstClick = false;
    gGame.isOn = true;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.safeClicks = 3;
    gGame.hints = 3;
    gGame.isHint = false;
    gGame.lives = (gLevel.SIZE === 4) ? 2 : 3;
    gGame.secsPassed = 0;
    gGame.isManual = false;
    gMinesCount = gLevel.MINES;

    clearInterval(gTimeInterval);

    document.querySelector('.timer').innerText = '0:00';
    document.querySelector('.hint').classList.remove('btn-on');
    document.querySelector('.manual').classList.remove('btn-on');
    document.querySelector('.manual').innerText = 'Place Mines';

    changeIcon(NORMAL);
    displayCounters('.click-count', gGame.safeClicks, CIRCLE);
    displayCounters('.hint-count', gGame.hints, CIRCLE);
    displayCounters('.lives', gGame.lives, LIVES);
    displayScore();
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

    var cellCoord = getCellCoord(elCell.id);
    var cell = gBoard[cellCoord.i][cellCoord.j];

    if (gGame.isManual) {
        if (cell.isMine || gMinesCount < 1) return;

        cell.isMine = true;
        elCell.innerText = MINE;
        gMinesCount--;
        document.querySelector('.manual').innerText = gMinesCount;

        if (gMinesCount === 0) {
            setMinesNegsCount(gBoard);
            setTimeout(function () {
                renderBoard(gBoard);
                startTimer();
                document.querySelector('.manual').innerText = 'Place Mines';
                document.querySelector('.manual').classList.remove('btn-on');
                gGame.isManual = false;
            }, 1500);

        }
        console.log(gBoard);
        return;
    }
    if (!gFirstClick) {
        gFirstClick = true;
        createMines(elCell);
        startTimer();
    }
    if (gGame.isHint) {
        showHint(cellCoord);
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
        displayCounters('.lives', gGame.lives, LIVES)
        elCell.innerText = MINE;
        elCell.classList.add('mine');
        elCell.classList.remove('cell');
        setTimeout(function () {
            elCell.innerText = EMPTY;
            elCell.classList.add('cell');
            elCell.classList.remove('mine');
        }, 500)
    }
    else {
        expandShown(cellCoord);
    }
    checkGameOver();
}

function cellMarked(elCell) {
    if (!gGame.isOn) return;
    if (gGame.isManual) return;

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
    var cell = gBoard[pos.i][pos.j];
    if (cell.isMarked || cell.isShown) return;

    revealCell(pos);
    if (cell.minesAroundCount !== 0) return;

    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === pos.i && j === pos.j) continue;
            var currPos = { i: i, j: j };
            var currCell = gBoard[i][j];

            expandShown(currPos);
        }
    }
}

function revealCell(pos) {
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
    gTimeInterval = setInterval(function () {
        gGame.secsPassed++;
        document.querySelector('.timer').innerText = getTimeStr(gGame.secsPassed);
    }, 1000)
}

function getTimeStr(seconds) {
    var secs = Math.round(seconds % 60);
    var timeDiff = Math.floor(seconds / 60);
    var mins = Math.round(timeDiff % 60);

    return mins + ':' + (secs < 10 ? '0' + secs : secs);
}

function saveBestScoreToStorage() {
    if (typeof (Storage) !== "undefined") {
        var bestScore = localStorage.getItem(gLevel.SIZE);
        if (!bestScore || gGame.secsPassed < bestScore) {
            localStorage.setItem(gLevel.SIZE, gGame.secsPassed);
        }
    }
}

function displayScore() {
    var bestScore = localStorage.getItem(gLevel.SIZE);
    var bestScoreStr = getTimeStr(bestScore);
    document.querySelector('.score').innerText = bestScoreStr;
}

function chooseLevel(size, mines) {
    gLevel.SIZE = size;
    gLevel.MINES = mines;
    init();
}

function checkGameOver() {
    if (gGame.shownCount + gGame.markedCount !== gLevel.SIZE ** 2 || gGame.markedCount !== gLevel.MINES) return;

    saveBestScoreToStorage();
    console.log('victory');
    gGame.isOn = false;
    changeIcon(VICTORY);
    clearInterval(gTimeInterval);
}


function hintClicked() {
    if (!gFirstClick || gGame.hints < 1 || !gGame.isOn) return;
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
    var elHintBox = document.querySelector('.hint');
    setTimeout(function () { elHintBox.classList.remove('btn-on') }, 500);
    gGame.isHint = false;
    gGame.hints--;
    displayCounters('.hint-count', gGame.hints,CIRCLE);
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
}


function showSafeClick() {
    if (gGame.safeClicks < 1 || !gGame.isOn || !gFirstClick) return;
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
    displayCounters('.click-count', gGame.safeClicks, CIRCLE);
}

function displayCounters(className, counter, sign) {
    var clicksStr = '';
    for (var i = 0; i < counter; i++) {
        clicksStr += sign;
    }

    var elClicks = document.querySelector(className);
    elClicks.innerText = clicksStr;
}


function manualModeClicked() {
    if (gFirstClick) return;

    gGame.isManual = true;
    gFirstClick = true;
    document.querySelector('.manual').classList.add('btn-on');
    document.querySelector('.manual').innerText = gMinesCount;
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

