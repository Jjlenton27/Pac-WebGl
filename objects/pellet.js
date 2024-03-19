import { Circle } from "../colliders/circle.js";
import { RenderObject } from "./renderObject.js";

class Pellet extends RenderObject{
    constructor(renderer, position){
        super(renderer, 5, 
            "#version 300 es\n\
                //a = attribute, v = varying,  u = uniform\n\
                in vec2 aPosition; //the position of the point\n\
                in vec3 aColor;\n\
                \n\
                out vec3 vColor;\n\
                \n\
                void main() {\n\
                gl_Position = vec4(aPosition, 0., 1.); //0. is the z, and 1 is w\n\
                vColor = aColor;\n\
            }",
            "#version 300 es\n\
                precision mediump float;\n\
                in vec3 vColor;\n\
                \n\
                out vec4 outColor; \n\
                \n\
                void main() {\n\
                outColor = vec4(vColor, 1);\n\
            }"
        );
        
        this.position = position;
        this.size = 0.0075;
        this.collider = new Circle(this.size/2);
        this.collider.position = position;
        this.eaten = false;
    }

    Setup(isPowerUp, scorePoints){
        this.isPowerUp = isPowerUp;
        this.score = scorePoints;
        
        //this.vertexByteSize = 5;
        let verticies = [
            -1,-1, //bL
            1,1,0, //color
        
            1,-1, //bR
            1,1,0,
        
            1,1, //tR
            1,1,0,
        
            -1,1, //tL
            1,1,0,
        ];
        let indicies =[
            0,1,2,
            0,2,3
        ];

        super.Setup(verticies, indicies);
    }

    Eat(){
        this.eaten = true;
        //TODO add to score
    }

    ExtractAttributes(){
        super.ExtractAttributes();
        this.vertColorPoint = this.renderer.getAttribLocation(this.shaderProgram, "aColor"); //link GLSL and js varible
        this.renderer.enableVertexAttribArray(this.vertColorPoint); //need to enable the variable
    }

    BindAttributes(){
        super.BindAttributes();
        this.renderer.vertexAttribPointer(this.vertColorPoint, 3, this.renderer.FLOAT, false, 4*this.vertexByteSize, 2*4);
    }

    Render(){
        if(!this.eaten)
            super.Render();
    }
}

export{Pellet}