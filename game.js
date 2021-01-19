const Sprites = {
    person: 'img/student.png',
    finish: 'img/finish.png'
    // finish: 'img/build.png'
}

var pMoves = 0;
var audio = new Audio("bg.mp3");

const rand = max => {return Math.floor(Math.random() * max)}


//Generăm aleatoriu un array (din array-ul nostru)
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Facem ca imaginea să fie mai bine vizibilă
function changeBrightness(factor, sprite) {
    var virtCanvas = document.createElement("canvas");
    virtCanvas.width = 500;
    virtCanvas.height = 500;
    var context = virtCanvas.getContext("2d");
    context.drawImage(sprite, 0, 0, 500, 500);

    var imgData = context.getImageData(0, 0, 500, 500);

    for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i] = imgData.data[i] * factor;
        imgData.data[i + 1] = imgData.data[i + 1] * factor;
        imgData.data[i + 2] = imgData.data[i + 2] * factor;
    }
    context.putImageData(imgData, 0, 0);

    var spriteOutput = new Image();
    spriteOutput.src = virtCanvas.toDataURL();
    virtCanvas.remove();
    return spriteOutput;
}

// Afișăm mesajul de victorie
function displayVictoryMess(moves) {
    confetti_show();
    $("#moves").html(`Ai făcut ${moves} de pași în timp de ${game_time_s} secunde`);
    $("#Message-Container").toggle();
    clearInterval(game_time);
}
function reload(){
    $("#Message-Container").toggle();
    document.location.reload();
}

/* ************ MAZE ************ */

function Maze(Width, Height) {
    var mazeMap;
    var width = Width;
    var height = Height;
    var startCoord, endCoord;
    var dirs = ["n", "s", "e", "w"];
    var modDir = {
        n: {
            y: -1,
            x: 0,
            o: "s"
        },
        s: {
            y: 1,
            x: 0,
            o: "n"
        },
        e: {
            y: 0,
            x: 1,
            o: "w"
        },
        w: {
            y: 0,
            x: -1,
            o: "e"
        }
    };

    this.map = function () {
        return mazeMap;
    };
    this.startCoord = function () {
        return startCoord;
    };
    this.endCoord = function () {
        return endCoord;
    };

    //Generăm mapa propriu-zisă
    function genMap() {
        mazeMap = new Array(height);
        for (y = 0; y < height; y++) {
            mazeMap[y] = new Array(width);
            for (x = 0; x < width; ++x) {
                mazeMap[y][x] = {
                    n: false,
                    s: false,
                    e: false,
                    w: false,
                    visited: false,
                    priorPos: null
                };
            }
        }
        console.log(mazeMap);
    }

    //Algoritmul de generare a labirintului
    function defineMaze() {
        var isComp = false;
        var move = false;
        var cellsVisited = 1;
        var numLoops = 0;
        var maxLoops = 0;
        var pos = {
            x: 0,
            y: 0
        };
        var numCells = width * height;
        while (!isComp) {
            move = false;
            mazeMap[pos.x][pos.y].visited = true;

            if (numLoops >= maxLoops) {
                shuffle(dirs);
                maxLoops = Math.round(rand(height / 8));
                numLoops = 0;
            }
            numLoops++;
            for (index = 0; index < dirs.length; index++) {
                var direction = dirs[index];
                var nx = pos.x + modDir[direction].x;
                var ny = pos.y + modDir[direction].y;

                // console.log(direction);
                // console.log(nx);
                // console.log(ny);
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    //Check if the tile is already visited
                    if (!mazeMap[nx][ny].visited) {
                        //Carve through walls from this tile to next
                        mazeMap[pos.x][pos.y][direction] = true;
                        mazeMap[nx][ny][modDir[direction].o] = true;

                        //Set Currentcell as next cells Prior visited
                        mazeMap[nx][ny].priorPos = pos;
                        //Update Cell position to newly visited location
                        pos = {
                            x: nx,
                            y: ny
                        };
                        cellsVisited++;
                        //Recursively call this method on the next tile
                        move = true;
                        break;
                    }
                }
            }

            if (!move) {
                //  If it failed to find a direction,
                //  move the current position back to the prior cell and Recall the method.
                pos = mazeMap[pos.x][pos.y].priorPos;
            }
            if (numCells == cellsVisited) {
                isComp = true;
            }
        }
    }

    function defineStartEnd() {
        switch (rand(4)) {
            case 0:
                startCoord = {
                    x: 0,
                    y: 0
                };
                endCoord = {
                    x: height - 1,
                    y: width - 1
                };
                break;
            case 1:
                startCoord = {
                    x: 0,
                    y: width - 1
                };
                endCoord = {
                    x: height - 1,
                    y: 0
                };
                break;
            case 2:
                startCoord = {
                    x: height - 1,
                    y: 0
                };
                endCoord = {
                    x: 0,
                    y: width - 1
                };
                break;
            case 3:
                startCoord = {
                    x: height - 1,
                    y: width - 1
                };
                endCoord = {
                    x: 0,
                    y: 0
                };
                break;
        }
    }

    genMap();
    defineStartEnd();
    defineMaze();
}

function DrawMaze(Maze, ctx, cellsize, endSprite = null) {
    var map = Maze.map();
    var cellSize = cellsize;
    var drawEndMethod;
    ctx.lineWidth = cellSize / 40;

    this.redrawMaze = function (size) {
        cellSize = size;
        ctx.lineWidth = cellSize / 50;
        drawMap();
        drawEndMethod();
    };

    //Desenăm pereții labirintului
    function drawCell(xCord, yCord, cell) {
        var x = xCord * cellSize;
        var y = yCord * cellSize;

        let diffVal = $("#diffSelect").val();
        if(diffVal == "10") ctx.strokeStyle = '#5AC9CF';
        else if(diffVal == "15") ctx.strokeStyle = '#F9ED70';
        else if(diffVal == "25") ctx.strokeStyle = '#C72D69';
        else if(diffVal == "38") ctx.strokeStyle = '#F35236';

        if (cell.n == false) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + cellSize, y);
            ctx.stroke();
        }
        if (cell.s === false) {
            ctx.beginPath();
            ctx.moveTo(x, y + cellSize);
            ctx.lineTo(x + cellSize, y + cellSize);
            ctx.stroke();
        }
        if (cell.e === false) {
            ctx.beginPath();
            ctx.moveTo(x + cellSize, y);
            ctx.lineTo(x + cellSize, y + cellSize);
            ctx.stroke();
        }
        if (cell.w === false) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + cellSize);
            ctx.stroke();
        }
    }


    //Desenăm mapa generată
    function drawMap() {
        // console.log(map);
        for (x = 0; x < map.length; x++) {
            for (y = 0; y < map[x].length; y++) {
                drawCell(x, y, map[x][y]);
            }
        }
    }

    //Finish
    function drawEndFlag() {
        var coord = Maze.endCoord();
        var gridSize = 4;
        var fraction = cellSize / gridSize - 2;
        var colorSwap = true;
        for (let y = 0; y < gridSize; y++) {
            if (gridSize % 2 == 0) {
                colorSwap = !colorSwap;
            }
            for (let x = 0; x < gridSize; x++) {
                ctx.beginPath();
                ctx.rect(
                    coord.x * cellSize + x * fraction + 4.5,
                    coord.y * cellSize + y * fraction + 4.5,
                    fraction,
                    fraction
                );
                if (colorSwap) {
                    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                } else {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                }
                ctx.fill();
                colorSwap = !colorSwap;
            }
        }
    }

    function drawEndSprite() {
        var offsetLeft = cellSize / 50;
        var offsetRight = cellSize / 25;
        var coord = Maze.endCoord();
        ctx.drawImage(
            endSprite,
            2,
            2,
            endSprite.width,
            endSprite.height,
            coord.x * cellSize + offsetLeft,
            coord.y * cellSize + offsetLeft,
            cellSize - offsetRight,
            cellSize - offsetRight
        );
    }

    function clear() {
        var canvasSize = cellSize * map.length;
        ctx.clearRect(0, 0, canvasSize, canvasSize);
    }

    if (endSprite != null) {
        drawEndMethod = drawEndSprite;
    } else {
        drawEndMethod = drawEndFlag;
    }
    clear();
    drawMap();
    drawEndMethod();
}

function Player(maze, c, _cellsize, onComplete, sprite = null) {
    var ctx = c.getContext("2d");
    var drawSprite;
    var moves = 0;
    drawSprite = drawSpriteCircle;
    if (sprite != null) {
        drawSprite = drawSpriteImg;
    }
    var player = this;
    var map = maze.map();
    var cellCoords = {
        x: maze.startCoord().x,
        y: maze.startCoord().y
    };
    var cellSize = _cellsize;
    var halfCellSize = cellSize / 2;

    this.redrawPlayer = function (_cellsize) {
        cellSize = _cellsize;
        drawSpriteImg(cellCoords);
    };

    function drawSpriteCircle(coord) {
        ctx.beginPath();
        ctx.fillStyle = "yellow";
        ctx.arc(
            (coord.x + 1) * cellSize - halfCellSize,
            (coord.y + 1) * cellSize - halfCellSize,
            halfCellSize - 2,
            0,
            2 * Math.PI
        );
        ctx.fill();
        if (coord.x === maze.endCoord().x && coord.y === maze.endCoord().y) {
            onComplete(moves);
            player.unbindKeyDown();
        }
    }

    //Plasăm personajul nostru pe canvas
    function drawSpriteImg(coord) {
        var offsetLeft = cellSize / 50;
        var offsetRight = cellSize / 25;
        ctx.drawImage(
            sprite,
            0,
            0,
            sprite.width,
            sprite.height,
            coord.x * cellSize + offsetLeft,
            coord.y * cellSize + offsetLeft,
            cellSize - offsetRight,
            cellSize - offsetRight
        );
        if (coord.x === maze.endCoord().x && coord.y === maze.endCoord().y) {
            onComplete(moves);
            player.unbindKeyDown();
        }
    }

    //Eliminăm sprite-ul făcut (pentru a nu obține copii la mișcare)
    function removeSprite(coord) {
        var offsetLeft = cellSize / 50;
        var offsetRight = cellSize / 25;
        ctx.clearRect(
            coord.x * cellSize + offsetLeft,
            coord.y * cellSize + offsetLeft,
            cellSize - offsetRight,
            cellSize - offsetRight
        );
    }

    //Mișcarea personajului
    function check(e) {
        var cell = map[cellCoords.x][cellCoords.y];
        switch (e.keyCode) {
            case 65:
            case 37: // west
                if (cell.w == true) {
                    moves++;
                    pMoves++;
                    $("#steps").html(pMoves);
                    removeSprite(cellCoords);
                    cellCoords = {
                        x: cellCoords.x - 1,
                        y: cellCoords.y
                    };
                    drawSprite(cellCoords);
                }
                break;
            case 87:
            case 38: // north
                if (cell.n == true) {
                    moves++;
                    pMoves++;
                    $("#steps").html(pMoves);
                    removeSprite(cellCoords);
                    cellCoords = {
                        x: cellCoords.x,
                        y: cellCoords.y - 1
                    };
                    drawSprite(cellCoords);
                }
                break;
            case 68:
            case 39: // east
                if (cell.e == true) {
                    moves++;
                    pMoves++;
                    $("#steps").html(pMoves);
                    removeSprite(cellCoords);
                    cellCoords = {
                        x: cellCoords.x + 1,
                        y: cellCoords.y
                    };
                    drawSprite(cellCoords);
                }
                break;
            case 83:
            case 40: // south
                if (cell.s == true) {
                    moves++;
                    pMoves++;
                    $("#steps").html(pMoves);
                    removeSprite(cellCoords);
                    cellCoords = {
                        x: cellCoords.x,
                        y: cellCoords.y + 1
                    };
                    drawSprite(cellCoords);
                }
                break;
        }
    }

    //Mișcarea personajul utilizând swipe
    this.bindKeyDown = function () {
        window.addEventListener("keydown", check, false);

        $("#view").swipe({
            swipe: function (
                event,
                direction,
                distance,
                duration,
                fingerCount,
                fingerData
            ) {
                // console.log(direction);
                switch (direction) {
                    case "up":
                        check({
                            keyCode: 38
                        });
                        break;
                    case "down":
                        check({
                            keyCode: 40
                        });
                        break;
                    case "left":
                        check({
                            keyCode: 37
                        });
                        break;
                    case "right":
                        check({
                            keyCode: 39
                        });
                        break;
                }
            },
            threshold: 0
        });
    };

    this.unbindKeyDown = function () {
        window.removeEventListener("keydown", check, false);
        $("#view").swipe("destroy");
    };

    drawSprite(maze.startCoord());

    this.bindKeyDown();
}

/* ************ MAZE END ************ */

var mazeCanvas = document.getElementById("mazeCanvas");
var ctx = mazeCanvas.getContext("2d");
var sprite;
var finishSprite;
var maze, draw, player;
var cellSize;
var difficulty;


function audioM(){
    audio.volume = 0.1;
    audio.loop = true;
    let playPromise = audio.play();
    // let playPromise = undefined;

    if (playPromise !== undefined) {
        playPromise.then(function() {
            $("#volume1").show();
            $("#volume0").hide();
        }).catch(function(error) {
            $("#volume0").show();
            $("#volume1").hide();
            setTimeout(audioM, 1000);
        });
    }
}

window.onload = function () {
    let viewWidth = $("#view").width();
    let viewHeight = $("#view").height();
    if (viewHeight < viewWidth) {
        ctx.canvas.width = viewHeight - viewHeight / 100;
        ctx.canvas.height = viewHeight - viewHeight / 100;
    } else {
        ctx.canvas.width = viewWidth - viewWidth / 100;
        ctx.canvas.height = viewWidth - viewWidth / 100;
    }

    //Load and edit sprites
    var completeOne = false;
    var completeTwo = false;
    var isComplete = () => {
        if (completeOne === true && completeTwo === true) {
            // console.log("Runs");
            setTimeout(function () {
                // makeMaze();
            }, 500);
        }
    };
    sprite = new Image();
    sprite.src = Sprites.person;
    sprite.setAttribute("crossOrigin", " ");
    sprite.onload = function () {
        sprite = changeBrightness(1.2, sprite);
        completeOne = true;
        isComplete();
    };

    finishSprite = new Image();
    finishSprite.src = Sprites.finish;
    finishSprite.setAttribute("crossOrigin", " ");
    finishSprite.onload = function () {
        finishSprite = changeBrightness(1.1, finishSprite);
        completeTwo = true;
        isComplete();
    };

    audioM();

};


function resize(){
    let viewWidth = $("#view").width();
    let viewHeight = $("#view").height() ;
    if (viewHeight < viewWidth) {
        ctx.canvas.width = viewHeight - viewHeight / 100;
        ctx.canvas.height = viewHeight - viewHeight / 100;
    } else {
        ctx.canvas.width = viewWidth - viewWidth / 100;
        ctx.canvas.height = viewWidth - viewWidth / 100;
    }
    cellSize = mazeCanvas.width / difficulty;
    if (player != null) {
        draw.redrawMaze(cellSize);
        player.redrawPlayer(cellSize);
    }
}

window.onresize = function(){
    resize();
};

function makeMaze() {
    if (player != undefined) {
        player.unbindKeyDown();
        player = null;
        pMoves = 0;
    }
    var e = document.getElementById("diffSelect");
    difficulty = e.options[e.selectedIndex].value;
    cellSize = mazeCanvas.width / difficulty;
    maze = new Maze(difficulty, difficulty);
    draw = new DrawMaze(maze, ctx, cellSize, finishSprite);
    player = new Player(maze, mazeCanvas, cellSize, displayVictoryMess, sprite);
    if (document.getElementById("mazeContainer").style.opacity < "100") {
        document.getElementById("mazeContainer").style.opacity = "100";
    }
    runTimer();
}

//Timpul de traversare
var game_time, game_time_s = 0;
function runTimer(){
    let startTime = Date.now();
    game_time = setInterval(function() {
        let elapsedTime = Date.now() - startTime;
        game_time_s = (elapsedTime / 1000).toFixed(2);
        document.getElementById("timer").innerText = game_time_s;
    }, 100);
}

function play(){
    $(".h1, .difficulty").toggleClass("active");
    $(".play, .by, .difficulty select, .info, .anim, .btns").hide();
    $("#view, #steps, #timer").show();
    makeMaze();
}

$(".play").click(play);

function cttx(){
    let ctx = document.getElementById("mazeCanvas").getContext("2d");
    console.log(ctx);

    let canvas = document.getElementById("mazeCanvas");
    let ctx1 = canvas.getContext("2d");
    console.log(ctx1);

    ctx.strokeStyle = '#ff0000';
    // ctx.shadowOffsetX = 2;
    // ctx.shadowOffsetY = 2;
    // ctx.shadowBlur    = 5;
    // ctx.shadowColor   = "rgba(98, 213, 218, 1)";
    ctx.stroke();
}

$(".h1").on("dblclick", function(){
    document.location.reload();
});

$("#diffSelect").on("input", function(){
    let val = $(this).val();
    if(val == "10") $(".bg").attr("class", "bg");
    else if(val == "15") $(".bg").attr("class", "bg bg1");
    else if(val == "25") $(".bg").attr("class", "bg bg2");
    else if(val == "38") $(".bg").attr("class", "bg bg3");
});

$(".right-a").click(function(){
    if(audio.paused){
        audio.play();
        $("#volume0").hide();
        $("#volume1").show();
    }
    else{
        audio.pause();
        $("#volume0").show();
        $("#volume1").hide();
    }
});