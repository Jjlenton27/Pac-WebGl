import { RenderObject } from "./renderObject.js";
import { AABB } from "../colliders/aabb.js";
import { DebugObject } from "./debugObject.js";
import { Circle } from "../colliders/circle.js";
import { Pellet } from "./pellet.js";
import { WallTile } from "./wallTile.js";

class World extends RenderObject{
    constructor(renderer){
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

        this.levelMap = [];
        this.pellets = [];
        this.colliders = [];
        this.navGraph = [];
    }

    Setup(){
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
        this.worldTexture = this.renderer.createTexture();
        
        this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.worldTexture);
        this.renderer.texImage2D(this.renderer.TEXTURE_2D, 0, this.renderer.RGBA, 1, 1, 0, this.renderer.RGBA, this.renderer.UNSIGNED_BYTE,
            new Uint8Array([193, 84, 193, 255]));

        var image = new Image();
        image.src = "resources/maze.png";
        image.onload = () => {
            //Select texture and assign image
            this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.worldTexture);
            this.renderer.texImage2D(this.renderer.TEXTURE_2D, 0, this.renderer.RGBA, this.renderer.RGBA,this.renderer.UNSIGNED_BYTE, image);
            this.renderer.texParameterf(this.renderer.TEXTURE_2D, this.renderer.TEXTURE_MAG_FILTER, this.renderer.NEAREST);
            this.renderer.generateMipmap(this.renderer.TEXTURE_2D);
        }
        fetch('https://jjlenton27.github.io/Pac-WebGl/resources/colliderMap')
        //fetch('http://127.0.0.1:5500/resources/colliderMap')
        .then(response => response.text())
        .then((data) => {
            this.SetupColliders(data);
        })

        fetch('https://jjlenton27.github.io/Pac-WebGl/resources/navGraph')
        //fetch('http://127.0.0.1:5500/resources/navGraph')
        .then(response => response.text())
        .then((data) => {
            this.SetupNavMap(data);
        })

        this.wallTile = new WallTile(this.renderer);
        this.wallTile.Setup([(3/(28/2))-1,(3/(32/2))-1]);
    }

    GenerateWorld(){
        let returnValues = [];
        //0 = player pos
        //1 = blinky
        //2 = pinky
        //3 = inky
        //4 = clyde

        //https://joeiddon.github.io/projects/javascript/perlin.html

        let gradients = [];
        for (let x = -1; x < 28+1; x++) {
            let row = [];
            for (let y = -1; y < 32+1; y++) {
                row.push(this.RandomUnitVector());
            }
            
            gradients.push(row);
        }

        let possibleLevel = [];
        let emptyCount = 0;
        for (let x = 0; x < 28; x++) {
            let row = [];
            for (let y = 0; y < 32; y++) {
                let cellGrads = [
                    gradients[x+2][y+2],
                    gradients[x][y+2],
                    gradients[x][y],
                    gradients[x+2][y]
                ];

                if(this.GetPerlinValue(cellGrads) > 0.5){
                    row.push(new WallTile(this.renderer));//Math.random());
                    row[row.length-1].Setup([(x/(28/2))-1,(y/(32/2))-1]);
                }

                else
                emptyCount++;
            }

            possibleLevel.push(row);
        }
    }

    RandomUnitVector(){
        let theta = Math.random() * 2 * Math.PI;
        return [Math.cos(theta), Math.sin(theta)];
    }

    DotProduct(vectorOne, vectorTwo){
        return(vectorOne[0] + vectorTwo[0] * vectorOne[1] + vectorTwo[1]);
    }

    Interpolate(valueOne, valueTwo, weight){
        return (valueTwo - valueOne) * weight + valueOne;
    }

    GetPerlinValue(gradients){
        let offsetVector = [0, 0];
        let dotOne, dotTwo, interpOne, interpTwo;

        offsetVector = [1, 1];
        dotOne = this.DotProduct(offsetVector, gradients[0]);
        offsetVector = [-1, 1];
        dotTwo = this.DotProduct(offsetVector, gradients[1]);

        interpOne = this.Interpolate(dotOne, dotTwo, 0.5);

        offsetVector = [-1, -1];
        dotOne = this.DotProduct(offsetVector, gradients[2]);
        offsetVector = [1, -1];
        dotTwo = this.DotProduct(offsetVector, gradients[3]);

        interpTwo = this.Interpolate(dotOne, dotTwo, 0.5);

        return this.Interpolate(interpOne, interpTwo, 0.5);
    }

    SetupColliders(file){
        let lines = file.split(/\r\n|\n/);
    
        this.colliders = [];
        let i = 0;
        lines.forEach(line => {
            let splitLine = line.split(",");
            if(splitLine[0] != "//"){
                let vertOne = [parseFloat(splitLine[0]), parseFloat(splitLine[1])];
                let vertTwo = [parseFloat(splitLine[2]), parseFloat(splitLine[3])];
                let colliderSize = [Math.abs(vertOne[0] - vertTwo[0]), Math.abs(vertOne[1] - vertTwo[1])];
        
                this.colliders[i] = new AABB(colliderSize);
                
                this.colliders[i].position = vertOne;
                this.colliders[i].position[0] += colliderSize[0]/2;
                this.colliders[i].position[1] += colliderSize[1]/2;
                i++;
            }

        });

        this.SetupPellets();
    }

    SetupPellets(){
        let powerUpChance = 5;
        //Create pellets
        this.pellets = [];
        let pelletTestCollider = new Circle(0.0075/2);
        for (let x = 4; x < 224; x+=8) {
            for (let y = 4; y < 256; y+=8) {
                let isInCollider = false;
                pelletTestCollider.position = [(x/112)-1,(y/128)-1];
                for(let i = 0; i < this.colliders.length; i++){
                    if(this.colliders[i].CheckCollider(pelletTestCollider) == true){
                        isInCollider = true;
                        break;
                    }
                }

                if(isInCollider == false){
                    this.pellets.push(new Pellet(this.renderer, pelletTestCollider.position));
                    let isPowerUp = Math.random()> 100/powerUpChance? false : true;
                    this.pellets[this.pellets.length-1].Setup(isPowerUp, isPowerUp? 50 : 10);
                }
            }   
        }
    }

    SetupNavMap(file){
        let lines = file.split(/\r\n|\n/);
        for (let line = 0; line < lines.length; line++) {
            let row = [];
            for (let i = 0; i < lines[line].length; i++) {
                row.push(parseInt(lines[line][i]));
            }
            this.navGraph.push(row);
        }
    }

    ExtractAttributes(){
        super.ExtractAttributes();
        this.vertColorPoint = this.renderer.getAttribLocation(this.shaderProgram, "aColor"); //link GLSL and js varible
        this.renderer.enableVertexAttribArray(this.vertColorPoint); //need to enable the variable
        this.vertTexCoordPointer = this.renderer.getAttribLocation(this.shaderProgram, "aTexCoord"); //link GLSL and js varible
        this.renderer.enableVertexAttribArray(this.vertTexCoordPointer); //need to enable the variable
    }

    BindAttributes(){
        super.BindAttributes();
        this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.worldTexture);
        this.renderer.vertexAttribPointer(this.vertColorPoint, 2, this.renderer.FLOAT, false, 4*this.vertexByteSize, 2*4);
        this.renderer.vertexAttribPointer(this.vertTexCoordPointer, 2, this.renderer.FLOAT, false, 4*this.vertexByteSize, 5*4);
    }

    MasterUpdate(deltaTime){
        super.MasterUpdate(deltaTime);
        this.pellets.forEach(pellet => {
            pellet.MasterUpdate(this.deltaTime);
        });

        this.levelMap.forEach(row => {
            row.forEach(tile => {
                console.log("tile");
                tile.MasterUpdate(deltaTime);
            });
        });

        //this.wallTile.MasterUpdate(deltaTime);
    }

    //USES DEPRECIATED FEATURES
    // loadFile(filePath) {
    //     var result = null;
    //     var xmlhttp = new XMLHttpRequest();
    //     xmlhttp.open("GET", filePath, false);
    //     xmlhttp.send();
    //     if (xmlhttp.status==200) {
    //       result = xmlhttp.responseText;
    //     }
    //     return result;
    // }
}


export {World}