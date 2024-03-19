import {RenderObject} from "./renderObject.js";
import {Animation} from "../animation/animation.js";
import {Frame} from "../animation/frame.js";
import {Circle} from "../colliders/circle.js";

class Pacman extends RenderObject{
    constructor(renderer){
        //Call super constructor with fixed shader code
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

        this.dieEvent = new Event("die");
        this.scareEvent = new Event("scare");
        this.unScareEvent = new Event("unscare");

        //Intialise variables
        this.score = 0;

        this.frameRate = 5;
        this.nextFrameTime = 1/5;
        this.frameIndex = 0;

        this.size = 0.045;
        this.collider = new Circle(this.size);

        this.moveDirection = [1, 0];
        this.moveSpeed = 0.2;

        this.angle = 0;

        this.hitAnimation = new Animation([
            new Frame(1, [
                0,0, //bL
                0.5,0,  //bR
                0.5,0.5,    //tR
                0,0.5    //tL
            ]),
            new Frame(1, [
                0.5,0, //bL
                1,0,  //bR
                1,0.5,    //tR
                0.5,0.5    //tL
            ])
        ]);
        
        this.isHit = false;
        this.lives = 3;

        this.idleAnimation = new Animation([
            new Frame(0.25, [
                0,0, //bL
                0.5,0,  //bR
                0.5,0.5,    //tR
                0,0.5    //tL
            ]),
            new Frame(0.25, [
                0.5,0, //bL
                1,0,  //bR
                1,0.5,    //tR
                0.5,0.5    //tL
            ])
        ]);
        
        this.startPosition = [0, 0.225];

        //Start the animation
        this.idleAnimation.Start(this.time);
    }

    Setup(){
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

        //Intialise a texture variable
        this.texture = this.renderer.createTexture();
        this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.texture);

        // Fill the texture with a 1x1 error magenta pixel.
        this.renderer.texImage2D(this.renderer.TEXTURE_2D, 0, this.renderer.RGBA, 1, 1, 0, this.renderer.RGBA, this.renderer.UNSIGNED_BYTE,
            new Uint8Array([193, 84, 193, 255]));

        //Load the image and assign to the texture
        var image = new Image();
        image.src = "resources/pac.png";
        image.onload = () => {
            //Select texture and assign image
            this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.texture);
            this.renderer.texImage2D(this.renderer.TEXTURE_2D, 0, this.renderer.RGBA, this.renderer.RGBA,this.renderer.UNSIGNED_BYTE, image);
            this.renderer.texParameterf(this.renderer.TEXTURE_2D, this.renderer.TEXTURE_MAG_FILTER, this.renderer.NEAREST);
            this.renderer.generateMipmap(this.renderer.TEXTURE_2D);
        }

        //Set start position
        this.position = [...this.startPosition];
    }

    Update(){
        if(!this.isHit){
            //Create a projection of the position, where will the position be next frame
            let projection = [...this.position];
            projection[0] += (this.moveDirection[0] * this.moveSpeed) * this.deltaTime;
            projection[1] += (this.moveDirection[1] * this.moveSpeed) * this.deltaTime;
            //Set collider position to projection for testing
            this.collider.position = projection;
    
            //For each collider in the world, check if overlapping then break loop
            let isInCollider = false;
            for(let i = 0; i < this.world.colliders.length; i++){
                if(this.world.colliders[i].CheckCollider(this.collider) == true){
                    isInCollider = true;
                    break;
                }
            }
            
            //If not in collider update position to projection
            if(isInCollider == false){
                this.position[0] = projection[0];
                this.position[1] = projection[1];
            }
    
            //Reset collider position to current position
            this.collider.position = this.position;
    
            this.world.pellets.forEach(pellet => {
                if(this.collider.CheckCollider(pellet.collider))
                    if(!pellet.eaten){
                        this.hasEaten = true;
                        pellet.Eat();
                        this.score += pellet.score;
                    }
            });
    
            //If player uses warp tunnel and goes past canvas boundaries teleport to the other side
            if(this.position[0] > 1 + this.size)
                this.position[0] = -1 - this.size;
            else if(this.position[0] < -1 - this.size)
                this.position[0] = 1 + this.size
        }

        else{
            console.log(this.hitAnimation.nextFrameTime);
            if(this.hitAnimation.hasLooped){
                document.getElementById("pacmanCanvas").dispatchEvent(this.unScareEvent);
                this.isHit = false;
            }
        }
    }

    Die(){
        if(!this.isHit){
            this.isHit = true;
            this.hitAnimation.Start(this.time);
            
            this.position = [...this.startPosition];
            document.getElementById("pacmanCanvas").dispatchEvent(this.scareEvent);
            
            this.lives--;
            console.log("lives remaining: " + this.lives + "  " + this.time);
            if(this.lives <= 0)
                document.getElementById("pacmanCanvas").dispatchEvent(this.dieEvent);
        }
    }

    HandleInput(input){
        let inputDirection = [];
        //Set move direction according to input
        switch(input.key){
            case "w":
            case "ArrowUp":
                inputDirection[0] = 0;
                inputDirection[1] = 1;
                break;

            case "a":
            case "ArrowLeft":
                inputDirection[0] = -1;
                inputDirection[1] = 0;
                break;

            case "s":
            case "ArrowDown":
                inputDirection[0] = 0;
                inputDirection[1] = -1;
                break;

            case "d":
            case "ArrowRight":
                inputDirection[0] = 1;
                inputDirection[1] = 0;
                break;
        }

        //Create a projection of the position, where will the position be next frame
        let projection = [...this.position];
        projection[0] += (inputDirection[0] * this.moveSpeed) * this.deltaTime * 2;
        projection[1] += (inputDirection[1] * this.moveSpeed) * this.deltaTime * 2;

        //Set collider position to projection for testing
        this.collider.position = projection;

        //For each collider in the world, check if overlapping then break loop
        let isInCollider = false;
        for(let i = 0; i < this.world.colliders.length; i++){
            if(this.world.colliders[i].CheckCollider(this.collider) == true){
                isInCollider = true;
                break;
            }
        }

        if(!isInCollider)
            this.moveDirection = inputDirection;
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

    AdjustVerticies(){
        //Get verticies adjusted by parent, handles position
        let renderVerticies = super.AdjustVerticies(this.deltaTime);
        
        //Get the current frame of the animation
        let frame = null;
        if(this.isHit){
            frame = this.hitAnimation.FetchFrame(this.time);
        }

        else{
            frame = this.idleAnimation.FetchFrame(this.time);
        }

        //Get move direction as angle in degrees
        this.angle = Math.atan2(this.moveDirection[1], this.moveDirection[0])/(Math.PI / 180);

        //Get the tex coords from the frame, could be stored in array, named for readability
        let minX = frame.texCoords[0];
        let maxX = frame.texCoords[0];
        let minY = frame.texCoords[1];
        let maxY = frame.texCoords[1];
        
        //Sort tex coords into correct variables
        for(let i = 0; i < frame.texCoords.length; i += 2){
            if(frame.texCoords[i] > maxX)
                maxX = frame.texCoords[i];
            if(frame.texCoords[i] < minX)
                minX = frame.texCoords[i];
        }

        for(let i = 1; i < frame.texCoords.length; i += 2){
            if(frame.texCoords[i] > maxY)
                maxY = frame.texCoords[i];
            if(frame.texCoords[i] < minY)
                minY = frame.texCoords[i];
        }

        let center = [(minX + maxX)/2, (minY + maxY)/2];
        //Find where this tex coord will be when rotated by movement direction, repeat for all four corners
        let coord = this.RotateAroundPoint([frame.texCoords[0], frame.texCoords[1]], center, this.angle);
        renderVerticies[5] = coord[0];
        renderVerticies[6] = coord[1];

        coord = this.RotateAroundPoint([frame.texCoords[2], frame.texCoords[3]], center, this.angle);
        renderVerticies[12] = coord[0];
        renderVerticies[13] = coord[1];

        coord = this.RotateAroundPoint([frame.texCoords[4], frame.texCoords[5]], center, this.angle);
        renderVerticies[19] = coord[0];
        renderVerticies[20] = coord[1];

        coord = this.RotateAroundPoint([frame.texCoords[6], frame.texCoords[7]], center, this.angle);
        renderVerticies[26] = coord[0];
        renderVerticies[27] = coord[1];

        return renderVerticies;
    }

    //Maths for roatating around a point
    RotateAroundPoint(vector, center, angle){
        let radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (vector[0] - center[0])) + (sin * (vector[1] - center[1])) + center[0],
        ny = (cos * (vector[1] - center[1])) - (sin * (vector[0] - center[0])) + center[1];
        return [nx, ny];
    }
}

export{Pacman}
