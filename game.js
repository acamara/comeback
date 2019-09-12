(function (window, undefined) {
    'use strict';

    var KEY_ENTER = 13, KEY_LEFT = 37, KEY_UP = 38, KEY_RIGHT = 39, KEY_DOWN = 40, KEY_PAUSE = 80, KEY_M = 77, KEY_ESC = 27;

    var canvas = null;
    var ctx = null;
	
    var blockSize  = 32;
    
	var lastUpdate = 0;
    var FPS = 0;
    var frames = 0;
    var acumDelta = 0;
    var gTime = 0;
    var elapsedTime = 0;
    var timeLimit = 5;
    var speed = 240;
    var jump_speed = 22;
    var gravity = 120;

    var lastKeyPress = null;
    var pressing = [];
    var pause = true;
    var gameover = false;
    var start = true;
    var end = false;
    var hasKey = false;
    var moving = false;
	var onGround = false;
    var level = 0;
    var collectedFuel = 0;

    var player = null;
    var platforms = [];
    var fuels = [];
    var door = null;
    var key = null;
    var dir = 0;
	
	var iPlayer = new Image();
    var iTerrain = new Image();
    var iGrass = new Image();
    var iDecor = new Image();
    var iFuel = new Image();
    var iKey = new Image();
    var iExit = new Image();
    var iBackground = new Image();
    var stars = 500, colorrange = [0,60,240];
    
    var endTimePopUp = 0;
    var popUpTitle;
    var popUpMessage;
    var gameoverMsg;
    var endTimeInformation = 0;

    function convertTime(time){
        var seconds = Math.floor(time%60);
        var minutes = Math.floor((time/60)%60);
           
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        return minutes + ":" + seconds;
    }

    function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

    function fillTextMultiLine(ctx, text, x, y) {
        var lineHeight = 16;
        var lines = text.split("\n");
        
        for (var i = 0; i < lines.length; ++i) {
            ctx.fillText(lines[i], x, y);
            y += lineHeight;
        }
    }
    
    function Rect(x, y, width, height, createFromTopLeft, type) {
        this.width = (width === undefined) ? 0 : width;
        this.height = (height === undefined) ? this.width : height;
        if (createFromTopLeft) {
            this.left = (x === undefined) ? 0 : x;
            this.top = (y === undefined) ? 0 : y;
        } else {
            this.x = (x === undefined) ? 0 : x;
            this.y = (y === undefined) ? 0 : y;
        }
        this.t = (type === undefined) ? -1 : type;
    }
    
    Rect.prototype = {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        vx: 0,
        vy: 0,
        
        get x() {
            return this.left + this.width / 2;
        },
        set x(value) {
            this.left = value - this.width / 2;
        },
        
        get y() {
            return this.top + this.height / 2;
        },
        set y(value) {
            this.top = value - this.height / 2;
        },
        
        get right() {
            return this.left + this.width;
        },
        set right(value) {
            this.left = value - this.width;
        },
        
        get bottom() {
            return this.top + this.height;
        },
        set bottom(value) {
            this.top = value - this.height;
        },
        
        intersects: function (rect) {
            if (rect !== undefined) {
                return (this.left < rect.right &&
                    this.right > rect.left &&
                    this.top < rect.bottom &&
                    this.bottom > rect.top);
            }
        },

        intersectsX: function (rect) {
            if (rect !== undefined) {
                return (this.left < rect.right && this.right > rect.left);
            }
        },
    };

    function setMap(level){
        platforms = [];
        fuels = [];
        key = null;
        door = null;
        hasKey = false;

        level.platforms.forEach(function(element){
            platforms.push(new Rect(element.x, element.y, blockSize, blockSize, true));
        });

        level.coins.forEach(function(element){
            fuels.push(new Rect(element.x, element.y, blockSize, blockSize, true));
        });        
        
        key = new Rect(level.key.x, level.key.y, blockSize, blockSize, true);
        door = new Rect(level.door.x, level.door.y, blockSize, blockSize, true);
    }

    // A utility function to reset styles
    function resetStyles(){
        // Reset styles
        ctx.textAlign = 'left';
        ctx.font = "10px Verdana";
        ctx.fillStyle = '#FFF';
    }

    // A utility function to draw a rectangle with rounded corners.
    function roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.lineTo(x, y + height - radius);
        ctx.arcTo(x, y + height, x + radius, y + height, radius);
        ctx.lineTo(x + width - radius, y + height);
        ctx.arcTo(x + width, y + height, x + width, y + height-radius, radius);
        ctx.lineTo(x + width, y + radius);
        ctx.arcTo(x + width, y, x + width - radius, y, radius);
        ctx.lineTo(x + radius, y);
        ctx.arcTo(x, y, x, y + radius, radius);
        ctx.stroke();
    }
	
	function drawStart(){
        ctx.fillStyle = '#474747';
        ctx.fillRect(canvas.width/2-150, canvas.height/2-50, 290, 100);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.font = "32px Impact";
        ctx.fillText('COMEBACK', canvas.width/2, canvas.height/2); 
        if((~~(gTime*3)%2) === 1){
            ctx.font = "12px Verdana";
            ctx.fillText("Press 'Enter' to start the game", canvas.width/2, canvas.height/2+20); 
        }
        resetStyles();
    }

    function drawEnd(){
        ctx.fillStyle = '#A22C29';
        ctx.fillRect(canvas.width/2-150, canvas.height/2-60, 300, 120);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.font = "20px Impact";
        ctx.fillText('WIN', canvas.width/2, canvas.height/2-30);
        ctx.font = "10px Verdana";
        ctx.fillText("Congratulations, you have come back to the Earth!", canvas.width/2, canvas.height/2-10); 
        if((~~(gTime*3)%2) === 1){
            ctx.font = "12px Verdana";
            ctx.fillText("Press 'ESC' to restart the game", canvas.width/2, canvas.height/2+20); 
        }
        resetStyles();
    }

    function drawPause(){
        ctx.fillStyle = '#A22C29';
        ctx.fillRect(canvas.width/2-150, canvas.height/2-50, 290, 100);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.font = "20px Impact";
        ctx.fillText('PAUSE', canvas.width/2, canvas.height/2); 
        if((~~(gTime*3)%2) === 1){
            ctx.font = "12px Verdana";
            ctx.fillText("Press 'P' to pause/resume the game", canvas.width/2, canvas.height/2+20); 
        }
        resetStyles();
    }

    function drawGameOver(){
        ctx.fillStyle = '#A22C29';
        ctx.fillRect(canvas.width/2-150, canvas.height/2-60, 300, 120);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.font = "20px Impact";
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2-30);
        ctx.font = "10px Verdana";
        ctx.fillText(gameoverMsg, canvas.width/2, canvas.height/2-10); 
        if((~~(gTime*3)%2) === 1){
            ctx.font = "12px Verdana";
            ctx.fillText("Press 'ESC' to restart the game", canvas.width/2, canvas.height/2+20); 
        }
    }

    function drawPopUp(){
        ctx.fillStyle = '#80A1C1';
        ctx.fillRect(canvas.width/2-145, 75, 290, 45);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.font = "16px Verdana";
        ctx.fillText(popUpTitle, canvas.width/2, 100); 

        ctx.font = "12px Verdana";
        fillTextMultiLine(ctx, popUpMessage, canvas.width/2, 130);
        //ctx.fillText(popUpMessage, canvas.width/2, 130); 

        resetStyles();
    }

    function drawInformation(){
        ctx.fillStyle = '#80A1C1';
        ctx.fillRect(canvas.width/2-200, 75, 400, 350);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.font = "16px Verdana";
        ctx.fillText('Instrucctions', canvas.width/2, 100); 

        ctx.textAlign = 'left';
        ctx.font = "12px Verdana";
        ctx.fillText('To become an astronaut you should return to Earth,', canvas.width/2-185, 140); 
        ctx.fillText('but before you should search some objects that will help', canvas.width/2-185, 157);
        ctx.fillText('you to comeback from space.', canvas.width/2-185, 174); 

        ctx.fillText('Be careful! You are lost in a big space and have a limited', canvas.width/2-185, 208);
        ctx.fillText('time to return.', canvas.width/2-185, 225); 
       
        ctx.fillText("Use arrow keys to move around, and press 'P' to pause.", canvas.width/2-185, 260); 

        //ctx.fillText("To show/hide instrucctions press 'I'", canvas.width/2-190, 400); 

        ctx.textAlign = 'center';
        ctx.font = "10px Verdana";
        ctx.strokeStyle="#FFF";
        
        ctx.fillText('Up', canvas.width/2, 305); 
        roundedRect(ctx, canvas.width/2-22.5, 280, 45, 45, 10);

        ctx.fillText('Left', canvas.width/2-50, 356);
        roundedRect(ctx, canvas.width/2-72.5, 330, 45, 45, 10);
        
        ctx.fillText('Down', canvas.width/2, 356);
        roundedRect(ctx, canvas.width/2-22.5, 330, 45, 45, 10);

        ctx.fillText('Right', canvas.width/2+50, 356);        
        roundedRect(ctx, canvas.width/2+27.5, 330, 45, 45, 10);

        resetStyles();
    }

    function drawGrid(){

        // Vertical lines
        for (var x = 0; x < canvas.width; x += blockSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.strokeStyle = '#FFF';
            ctx.stroke();
        }

        // Horitzontal lines
        for (var y = 0; y < canvas.height; y += blockSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.strokeStyle = '#FFF';
            ctx.stroke();
        }
    }
	
    function drawElapsedTime(){
        ctx.fillStyle="black";
        ctx.fillRect(canvas.width/2-37, 5, 74, 42);
        ctx.fillStyle="white";
        ctx.fillRect(canvas.width/2-32, 10, 64, 32);
        ctx.fillStyle='black';
        ctx.textAlign='center';
        ctx.font='20px arial';
        ctx.fillText(convertTime(elapsedTime), canvas.width/2, 32);

        resetStyles();
    }

    function drawTerrain(terrain){
        for (var i = 0; i < canvas.width/blockSize; i++) {
             ctx.drawImage(iTerrain, i*blockSize, canvas.height-blockSize);
        }

        terrain.forEach(function(element){
            ctx.drawImage(iGrass, blockSize*element.frame, 0, blockSize, blockSize, element.x, element.y, blockSize, blockSize);
        }); 
    }

    function drawDecoration(decoration){
        decoration.forEach(function(element){
            ctx.drawImage(iDecor, blockSize*element.frame, 0, blockSize, blockSize, element.x, element.y, blockSize, blockSize);
        });        
    }

    function drawFuel(){
        fuels.forEach(function(element){
            ctx.drawImage(iFuel, (~~(elapsedTime*10)%4)*blockSize, 0, blockSize, blockSize, element.left, element.top, blockSize, blockSize);
        });        
    }

    function drawPoints(){
        // Draw FPS
        ctx.fillStyle = '#000';
        ctx.font='14px arial';

        ctx.fillText('LEVEL: ' + (level + 1), 10, 20);
        ctx.fillText('FUEL: ' + collectedFuel, 10, 40);
    }

    function drawBackground(){
        for (var i = 0; i < stars; i++) {
            var x = Math.random() * canvas.offsetWidth;
            var y = Math.random() * canvas.offsetHeight;
            var radius = Math.random() * 1.2;
            var hue = colorrange[getRandomInt(0,colorrange.length - 1)];
            var sat = getRandomInt(50,100);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 360);
            ctx.fillStyle = "hsl(" + hue + ", " + sat + "%, 88%)";
            ctx.fill();
        }
    }
	
	function draw() {
        // Draw background canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Background
        ctx.drawImage(iBackground, 0, 0);
        //drawBackground();
        
        if(!end){
            drawTerrain(levels[level].platforms);

            drawDecoration(levels[level].decoration);

            drawFuel();

            if(!hasKey){
                ctx.drawImage(iKey, 0, 0, blockSize, blockSize, key.left, key.top, blockSize, blockSize);
            }

            ctx.drawImage(iExit, 0, 0, blockSize, blockSize, door.left, door.top, blockSize+blockSize/2, blockSize+blockSize/2);

            // Draw Player
            if(moving){
                ctx.drawImage(iPlayer, (~~(elapsedTime*10)%4)*blockSize, blockSize*dir, blockSize, blockSize, player.left, player.top, blockSize, blockSize);
                //ctx.drawImage(iPlayer, (~~(elapsedTime*10)%4)*32), 0, blockSize, 32, player.left, player.top, blockSize, 32);
            }
            else{
                ctx.drawImage(iPlayer, 0, blockSize*dir, blockSize, blockSize, player.left, player.top, blockSize, blockSize);
                //ctx.drawImage(iPlayer, blockSize*dir, 96, blockSize, 48, player.left, player.top, blockSize, 48);
            }

            // Draw Information
            if(endTimeInformation > elapsedTime){
                drawInformation();
            }
            
            // Draw Pop Up Messages
            if(endTimePopUp > elapsedTime){
                drawPopUp();
            }

            // Draw Points
            drawPoints();
        }

        

        // Draw start/pause/gameover
        if (pause) {
            ctx.textAlign = 'center';
            if(start){
                drawStart();
            }
            else if(end){
                drawEnd();
            }
            else if (gameover) {
                drawGameOver();
            } else {
                drawPause();
            }
            ctx.textAlign = 'left';
        }

        drawElapsedTime();

        /*
        // FOR DEBUG
        // Draw FPS
        ctx.fillStyle = '#000';
        ctx.fillText('FPS: ' + FPS, 10, 15);

        // Draw lastKeyPress
        ctx.fillStyle = '#000';
        ctx.fillText('LastKeyPress: ' + lastKeyPress, 10, 30);

        // Draw player position
        ctx.fillText('Player: (' + player.left +", "+ player.top + ")", 10, 45);
            
        drawGrid();
        */   
    }
	
    function triggerInformation(time){
        endTimeInformation = elapsedTime + time;  //seconds
    }
	
	function triggerPopUp(title, message, time){
        endTimePopUp = elapsedTime + time;  //seconds
        popUpTitle = title;
        popUpMessage = message;
    }

    function intersectsPlatform(){
        for (var i = 0, l = platforms.length; i < l; i += 1) {
            if (player.intersects(platforms[i])) {
                return true;
            }
        }
    
        return false;
    }

    function intersectsFuel(){
        for (var i = fuels.length -1; i >= 0; i--) {
            if (player.intersects(fuels[i])) {
                fuels.splice(i,1);
                SoundFX.fuel();
                collectedFuel++;
            }
        }
    }

    function intersectsKey(){
        if(!hasKey && player.intersects(key)) {
            triggerPopUp("Well, you have get key!", '', 3);
            hasKey = true;
        }
    }

    function intersectsDoor(){
        if(hasKey &&player.intersects(door)) {
            changeLevel();
        }
    }

    function changeLevel(){
        level++;

        if(level < levels.length){
            triggerPopUp(levels[level].title, '', 3);
            setMap(levels[level]);
        }
        else{
            pause = true;
            end = true;
        }
        
    }
	
	function act(deltaTime) {
        var i = 0, l = 0;

        gTime += deltaTime;

        if (!pause) {
            if(elapsedTime > timeLimit * 60){
                gameover = true;
                gameoverMsg = "You have run out of time!";
                pause = true;
            }

            // Increment elapsedTime
            elapsedTime += deltaTime;
            
            // Set vectors
            if (pressing[KEY_RIGHT]) {
                dir = 0;
                moving = true;
                if(player.vx < blockSize){
                    player.vx += speed;
                }
            }else if(player.vx > 0){
                player.vx -= speed;
            }
            if (pressing[KEY_LEFT]) {
                dir = 1;
                moving = true;
                if (player.vx > -blockSize) {
                    player.vx -= speed;
                }
            } else if (player.vx < 0) {
                player.vx += speed;
            }

            // Set gravity
            player.vy += gravity*deltaTime;

            if (player.vy > blockSize) {
                player.vy = blockSize;
            }

            // Jump
            if (onGround && lastKeyPress === KEY_UP) {
                player.vy = -jump_speed;
                lastKeyPress = null;
            }

            // Move player in x
            player.x += player.vx*deltaTime;

            for (i = 0, l = platforms.length; i < l; i += 1) {
                if (player.intersects(platforms[i])) {
                    if (player.vx > 0) {
                        player.right = platforms[i].left;
                    } else {
                        player.left = platforms[i].right;
                    }
                    player.vx = 0;
                }
            }
            
            // Move player in y
            onGround = false;
            player.y += player.vy;

            for (i = 0, l = platforms.length; i < l; i += 1) {
                if (player.intersects(platforms[i])) {
                    if (player.vy > 0) {
                        player.bottom = platforms[i].top;
                        onGround = true;
                    } else {
                        player.top = platforms[i].bottom;
                    }
                    player.vy = 0;
                }
            }

            // Out Screen
            if (player.right > canvas.width) {
                player.right = canvas.width;
            }
            if (player.left < 0) {
                player.left = 0;
            }
            if (player.bottom > canvas.height-blockSize) {
                player.bottom = canvas.height-blockSize;
                onGround = true;
            }
            if (player.top < 0) {
                player.top = 0;
            }

            intersectsFuel();
            intersectsKey();
            intersectsDoor();
       }
        
        // Pause/Unpause
        if (!start && lastKeyPress === KEY_PAUSE) {
            pause = !pause;
            lastKeyPress = null;
        }

        // Start
        if (lastKeyPress === KEY_ENTER) {
            pause = false;
            start = false;
            triggerInformation(1);
        }

        // GameOver Reset
        if (lastKeyPress === KEY_ESC && (end || gameover)) {
            reset();
        }
    }

    function run() {
        window.requestAnimationFrame(run);

        var now = Date.now();
        var deltaTime = (now - lastUpdate) / 1000;
       
	   if (deltaTime > 1) {
            deltaTime = 0;
        }
      
        lastUpdate = now;

        frames += 1;
        acumDelta += deltaTime;
      
        if (acumDelta > 1) {
            FPS = frames;
            frames = 0;
            acumDelta -= 1;
        }

        act(deltaTime);
        draw(ctx);
    }

    function init() {
        // Get canvas and context
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');

        // Create player
        player = new Rect(16, canvas.height-blockSize*2, 32, 32, true);

        // Load assets
        iPlayer.src = 'assets/player.png';
        iBackground.src = 'assets/background.png';
        iTerrain.src = 'assets/terrain.png';
        iGrass.src = 'assets/grass.png';
        iDecor.src = 'assets/decor.png';
        iFuel.src = 'assets/coin.png';
        iKey.src = 'assets/key.png';
        iExit.src = 'assets/door.png';

        // Set initial map
        setMap(levels[level]);

        // Start game
        run();
    }
	
    function reset(){
        // Reset Variables
        lastUpdate = 0;
        FPS = 0;
        frames = 0;
        acumDelta = 0;
        gTime = 0;
        elapsedTime=0;

        lastKeyPress = null;
        pressing = [];
        pause = true;
        gameover = false;
        start = true;
        end = false;
        moving = false;
        hasKey = false;
    
        player = null;
        dir = 0;
        
        endTimePopUp = 0;
        popUpTitle  = '';
        popUpMessage = '';
        endTimeInformation = 0;

        level = 0;
        collectedFuel = 0;

        // Create player
        player = new Rect(16, canvas.height-blockSize*2, 32, 32, true);

        // Set initial map
        setMap(levels[level]);
    }

    window.addEventListener('load', init, false);

	window.requestAnimationFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 17);
            };
    }());
	
    document.addEventListener('keydown', function (evt) {
        if (!pressing[evt.which]) {
            lastKeyPress = evt.which;
        }
        pressing[evt.which] = true;
    }, false);

    document.addEventListener('keyup', function (evt) {
        pressing[evt.which] = false; moving = false;
    }, false);

}(window));