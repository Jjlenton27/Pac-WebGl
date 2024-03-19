import {Ghost} from "./ghost.js"

class GhostManager{
    constructor(player, world, renderer){
        this.player = player;
        this.ghosts = [];

        //Blinky
        this.ghosts.push(new Ghost(renderer, this, world, function(ghost){
            if(this.aiState == 0){
                //console.log(this.manager.player.position + " player pos");
                return this.manager.player.position;
            }

            else if(this.aiState == 1){
                return [0.8, 0.84];
            }
        }));

        this.ghosts[0].Setup("resources/greencircle32.png");
        this.ghosts[0].aiState = 0;
        this.ghosts[0].position = [0, 0.1];

        //Pinky
        this.ghosts.push(new Ghost(renderer, this, world, function(ghost){
            if(this.aiState == 0){
                //console.log(this.manager.player.position + " player pos");
                return this.manager.player.position;
            }

            else if(this.aiState == 1){
                return [0.8, 0.84];
            }
        }));

        this.ghosts[1].Setup("resources/greencircle32.png");
        this.ghosts[1].aiState = 0;
        this.ghosts[1].position = [0, 0.1];

        //Inky
        this.ghosts.push(new Ghost(renderer, this, world, function(ghost){
            if(this.aiState == 0){
                //console.log(this.manager.player.position + " player pos");
                return this.manager.player.position;
            }

            else if(this.aiState == 1){
                return [0.8, 0.84];
            }
        }));

        this.ghosts[2].Setup("resources/greencircle32.png");
        this.ghosts[2].aiState = 0;
        this.ghosts[2].position = [0, 0.1];
        
        //Clyde
        this.ghosts.push(new Ghost(renderer, this, world, function(ghost){
            if(this.aiState == 0){
                return this.manager.player.position;
            }

            else if(this.aiState == 1){
                return [0.8, 0.84];
            }
        }));

        this.ghosts[3].Setup("resources/greencircle32.png");
        this.ghosts[3].aiState = 0;
        this.ghosts[3].position = [0, 0.1];
    }

    ResetGhosts(ghostPositions){
        for (let i = 0; i < this.ghosts.length-1; i++) {
            this.ghosts[i].position = ghostPositions[i];
            this.ghost[i].aiState = 0;
        }
    }

    Update(deltaTime){
        this.time = this.time + deltaTime;

        this.ghosts.forEach(ghost => {
            ghost.MasterUpdate(deltaTime);
        });
    }

    ScareGhosts(){
        this.ghosts.forEach(ghost => {
            ghost.aiState = 1;
        });
    }

    UnScareGhosts(){
        this.ghosts.forEach(ghost => {
            ghost.aiState = 0;
        });
    }
}

export{GhostManager}