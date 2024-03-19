import { AABB } from "./colliders/aabb.js";
import {DebugObject} from "./objects/debugObject.js";
import {GhostManager} from "./objects/ghosts/ghostManager.js";
import {Pacman} from "./objects/pacman.js";
import { SplashScreen } from "./objects/splashscreen.js";
import {World} from "./objects/world.js";

//DEBUG/DEV FUNCTION
function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = (event.clientX - rect.left)/600;
    let y = (event.clientY - rect.top)/600;
    x = (x - 0.5)*2;
    y = -(y - 0.5)*2;

    let gridX = Math.round(((x+1)*(28/2)-0.5));
    let gridY = Math.round(((y+1)*(32/2)-0.5));
}

let canvas = document.getElementById("pacmanCanvas"); //get canvas element
let gameState = 0;
/*
0 = start
1 = game
2 = restart
3 = next level
*/

//get webgl2
let render = canvas.getContext("webgl2");
if(!render) throw "wbgl2 not supported"
//Flips textures to the right way round 
render.pixelStorei(render.UNPACK_FLIP_Y_WEBGL, true);

//enable alpha blending, lets transparent textures work properly
render.enable(render.BLEND);
render.blendFunc(render.SRC_ALPHA, render.ONE_MINUS_SRC_ALPHA);

//wipe background
render.clearColor(0,0,0,1);
render.clear(render.COLOR_BUFFER_BIT);

//Intialise game objects
let splashScreen = new SplashScreen(render);
splashScreen.Setup();

let pac = new Pacman(render);
pac.Setup();

let world = new World(render);
world.Setup();
world.GenerateWorld();

let ghostManager = new GhostManager(pac, world, render);

pac.world = world;

let stopGhost = false;
let movementKeys = ["w", "a", "s", "d", "ArrowUp", "ArrowLeft", "ArrowRight", "ArrowDown"];

//Initialise events
canvas.addEventListener("keydown", (e) => {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }
    
    if(movementKeys.includes(e.key)){
        pac.HandleInput(e);
    }

    if(e.key == " "){
        stopGhost = !stopGhost;
    }

    if(e.key == "Enter"){
        if(gameState == 0 || gameState == 2 || gameState == 3){
            SetState(1);
        }
    }
});

canvas.addEventListener("mousedown", function (e) {
    let rect = canvas.getBoundingClientRect();
    let x = (e.x - rect.left)/600;
    let y = (e.y - rect.top)/600;
    x = (x - 0.5)*2;
    y = -(y - 0.5)*2;

    if(gameState == 0 || gameState == 2 || gameState == 3){
        if(splashScreen.collider.CheckPoint([x, y])){
            SetState(1);
        }
    }
}); 

canvas.addEventListener("mousemove", function (e) {
    getMousePosition(canvas, e);
}); 

canvas.addEventListener("die", function(){
    splashScreen.SetSplash("die");
    gameState = 2;
});

canvas.addEventListener("scare", function(){
    ghostManager.ScareGhosts(); 
});

canvas.addEventListener("unscare", function(){
    ghostManager.UnScareGhosts(); 
})

let SetState = function(targetState){
    if(gameState == 0){
        gameState = targetState;
    }

    else if(gameState == 2){
        if(targetState == 1){
            prompt("Enter your name for the leaderboard:");
            world.GenerateWorld();
            pac.score = 0;
            pac.lives = 3;
            gameState = targetState;
        }
    }

    else if(gameState == 3){
        if(targetState == 1){
            world.GenerateWorld();
            gameState = targetState;
        }
    }
}

let time = 0;
let draw = function(now){
    //time differnce between last frame and this frame in seconds
    let deltaTime = (now/1000) - time;
    
    render.viewport(0,0,canvas.width, canvas.height); //set draw area
    render.clearColor(0,0,0,1);
    render.clear(render.COLOR_BUFFER_BIT); //wipe draw area

    //Start Screen
    if(gameState == 0){
        world.MasterUpdate(deltaTime);
        ghostManager.ghosts.forEach(ghost => {
            ghost.Render();
        });

        pac.Render();
        splashScreen.Render();
    }

    //Game Running
    else if(gameState == 1){
        //Call update and render on objects
        world.MasterUpdate(deltaTime);
        if(!stopGhost)
            ghostManager.Update(deltaTime);
    
        pac.MasterUpdate(deltaTime);
    }

    //Restart Screen
    else if(gameState == 2){
        world.MasterUpdate(deltaTime);
        ghostManager.ghosts.forEach(ghost => {
            ghost.Render();
        });

        pac.Render();
        splashScreen.Render();
    }

    render.flush(); //send render to screen
    time = now/1000;
    window.requestAnimationFrame(draw); //render again when reder
}

draw(0); //start render