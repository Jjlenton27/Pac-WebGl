import {RenderObject} from "./renderObject.js";

class DebugObject extends RenderObject{
    constructor(renderer){
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

        this.size = 0.0075;
    }

    Setup(){
        this.vertexByteSize = 5;
        let verticies = [
            -1,-1, //bL
            1,1,1, //color
        
            1,-1, //bR
            1,1,1,
        
            1,1, //tR
            1,1,1,
        
            -1,1, //tL
            1,1,1
        ];
        let indicies =[
            0,1,2,
            0,2,3
        ];

        super.Setup(verticies, indicies);
    }

    SetColor(color){
        this.verticies[2] = color[0];
        this.verticies[3] = color[1];
        this.verticies[4] = color[2];

        this.verticies[7] = color[0];
        this.verticies[8] = color[1];
        this.verticies[9] = color[2];

        this.verticies[12] = color[0];
        this.verticies[13] = color[1];
        this.verticies[14] = color[2];

        this.verticies[17] = color[0];
        this.verticies[18] = color[1];
        this.verticies[19] = color[2];
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
}

export{DebugObject}
