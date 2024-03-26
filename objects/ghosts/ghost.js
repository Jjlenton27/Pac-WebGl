import { Circle } from "../../colliders/circle.js";
import { DebugObject } from "../debugObject.js";
import {RenderObject} from "../renderObject.js";

class Ghost extends RenderObject {
    constructor(renderer, manager, world, targetPosFunc){
        super(renderer, 7, 
            "#version 300 es\n\
                //a = attribute, v = varying,  u = uniform\n\
                in vec2 aPosition; //the position of the point\n\
                in vec3 aColor;\n\
                in vec2 aTexCoord;\n\
                \n\
                out vec3 vColor;\n\
                out vec2 vTexCoord;\n\
                \n\
                void main() {\n\
                vTexCoord = aTexCoord;\n\
                gl_Position = vec4(aPosition, 0., 1.); //0. is the z, and 1 is w\n\
                vColor = aColor;\n\
            }",
            "#version 300 es\n\
                precision mediump float;\n\
                in vec3 vColor;\n\
                in vec2 vTexCoord;\n\
                \n\
                uniform sampler2D uTexture;\n\
                \n\
                out vec4 outColor; \n\
                \n\
                void main() {\n\
                outColor = texture(uTexture, vTexCoord);//vec4(vColor,1);\n\
            }"
        );
        
        //anonymous function for target finding
        this.findTargetPosition = targetPosFunc;
        this.manager = manager;
        this.world = world;
        this.aiState = 0;//0 chase, 1 flee
        this.moveSpeed = 0.2/2;//2;
        this.size = 0.045;
        this.moveTarget = [
            Math.round(((this.position[0]+1)*(28/2)-0.5)),
            Math.round(((this.position[1]+1)*(32/2)-0.5))
        ];

        this.lastNavPos = [
            (this.position[0]+1)*(28/2)-0.5,
            (this.position[1]+1)*(32/2)-0.5
        ];

        this.collider = new Circle(0.045);
    }

    Setup(imagePath){
        //Create verticies and indicies arrays
        let verticies = [
            -1,-1, //bL
            1,0,0, //color
            0,0, //tex Coord
        
            1,-1, //bR
            0,0,1,
            1,0,
        
            1,1, //tR
            0,1,0,
            1,1,
        
            -1,1, //tL
            0,1,0,
            0,1
        ];

        let indicies =[
            0,1,2,
            0,2,3
        ];
        super.Setup(verticies, indicies);

        this.texture = this.renderer.createTexture();
        
        this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.texture);
        this.renderer.texImage2D(this.renderer.TEXTURE_2D, 0, this.renderer.RGBA, 1, 1, 0, this.renderer.RGBA, this.renderer.UNSIGNED_BYTE,
            new Uint8Array([193, 84, 193, 255]));

        var image = new Image();
        image.src = imagePath;
        image.onload = () => {
            //Select texture and assign image
            this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.texture);
            this.renderer.texImage2D(this.renderer.TEXTURE_2D, 0, this.renderer.RGBA, this.renderer.RGBA,this.renderer.UNSIGNED_BYTE, image);
            this.renderer.texParameterf(this.renderer.TEXTURE_2D, this.renderer.TEXTURE_MAG_FILTER, this.renderer.NEAREST);
            this.renderer.generateMipmap(this.renderer.TEXTURE_2D);
        }
    }

    ExtractAttributes(){
        //Get and enable the attributes
        super.ExtractAttributes();
        this.vertColorPoint = this.renderer.getAttribLocation(this.shaderProgram, "aColor"); //link GLSL and js varible
        this.renderer.enableVertexAttribArray(this.vertColorPoint); //need to enable the variable
        this.vertTexCoordPointer = this.renderer.getAttribLocation(this.shaderProgram, "aTexCoord"); //link GLSL and js varible
        this.renderer.enableVertexAttribArray(this.vertTexCoordPointer); //need to enable the variable
    }

    BindAttributes(){
        //Assign the correct area of the vertex array to the attributes
        super.BindAttributes();
        this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.texture);
        this.renderer.vertexAttribPointer(this.vertColorPoint, 2, this.renderer.FLOAT, false, 4*this.vertexByteSize, 2*4);
        this.renderer.vertexAttribPointer(this.vertTexCoordPointer, 2, this.renderer.FLOAT, false, 4*this.vertexByteSize, 5*4);
    }

    Update(){
        if(this.aiState != -1){
            let navPos = [
                (this.position[0]+1)*(28/2)-0.5,
                (this.position[1]+1)*(32/2)-0.5
            ];
    
            navPos = [
                Math.abs(this.lastNavPos[0] - navPos[0]) > 0.75 ? navPos[0] : this.lastNavPos[0],
                Math.abs(this.lastNavPos[1] - navPos[1]) > 0.75 ? navPos[1] : this.lastNavPos[1]
            ];
    
            this.lastNavPos = [...navPos];
    
            navPos = [
                Math.round(navPos[0]),
                Math.round(navPos[1])
            ];
    
            if(navPos[0] == this.moveTarget[0] && navPos[1] == this.moveTarget[1]){
                this.GetMovementTarget(this.findTargetPosition(this));
            }
    
            let moveDir = [
                this.moveTarget[0] - navPos[0],
                this.moveTarget[1] - navPos[1]
            ];
    
            //Create a projection of the position, where will the position be next frame
            let projection = [...this.position];
            projection[0] += (moveDir[0] * this.moveSpeed) * this.deltaTime;
            projection[1] += (moveDir[1] * this.moveSpeed) * this.deltaTime;
    
            this.position[0] = projection[0];
            this.position[1] = projection[1];

            this.collider.position = this.position;

            if(this.collider.CheckColliderCircle(this.manager.player.collider)){
                this.manager.player.Die();
            }
        }
    }

    GetMovementTarget(target){
        //Use pathfinding  https://www.redblobgames.com/pathfinding/a-star/introduction.html

        //Convert from world space to grid space
        let pos = [
            Math.round(((this.position[0]+1)*(28/2)-0.5)),
            Math.round(((this.position[1]+1)*(32/2)-0.5))
        ];

        //Convert from world space to grid space
        let targetPos = [
            Math.round(((target[0]+1)*(28/2)-0.5)),
            Math.round(((target[1]+1)*(32/2)-0.5))
        ];

        //If we are not at the target position
        if(!(targetPos[0] == pos[0] && targetPos[1] == pos[1])){
            //Priority queue stand in
            let frontier = [[pos, 1]];

            let reached = [pos];
            let pathFrom = {};

            while(frontier.length > 0){
                //Get the current position from the front of the array
                let current = frontier[0][0];

                //Loop through the adjecent positions
                for(let xOffset = -1; xOffset <= 1; xOffset++){
                    for(let yOffset = -1; yOffset <= 1; yOffset++){
                        //Search all adjecent tiles, no diagonals
                        if(Math.abs(xOffset) + Math.abs(yOffset) < 2 && Math.abs(xOffset) + Math.abs(yOffset) > 0){
                            let next = [current[0]+xOffset, current[1]+yOffset]
                            //Is this position a wall or the player
                            if(this.world.navGraph[next[1]][next[0]] == 0 || (next[0] == targetPos[0] && next[1] == targetPos[1])){
                                //If we havent reached this position before
                                if(!reached.find(e => e[0] == next[0] && e[1] == next[1])){
                                    if(!(next in pathFrom)){
                                        //Add this position reached and frontier, as well as pathFrom with current as the from position
                                        pathFrom[next] = current;
                                        reached.push(next);
                                        
                                        //Add this position to frontier with the priority being the distance between the next and the target
                                        frontier.push([
                                            next,
                                            Math.abs(targetPos[0]-next[0]) + Math.abs(targetPos[1]-next[1])
                                        ]);

                                        //If this position is the target position, break from the while loop, no need to keep going
                                        if(next[0] == targetPos[0] && next[1] == targetPos[1]){
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                //Remove the value at the fornt of the array, and then sort based on the priority value
                frontier.shift();
                frontier.sort((a,b)=>a[1]-b[1]);
            }
            
            //Go backwards from the target position to the target following the path laid out by the pathFrom array
            let current = pathFrom[targetPos];
            let path = [targetPos];

            while(current != pos){
                path.push(current);

                if(pathFrom[current] == null){
                    console.log("path from " + current + " is undefined");
                    break;
                }

                current = pathFrom[current];
            }
            
            //Flip the path array
            path.reverse();

            //Set move target to the next position in the path
            this.moveTarget = [...path[0]];
        }
    }
}

export{Ghost}