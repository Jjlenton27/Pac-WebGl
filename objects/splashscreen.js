import { AABB } from "../colliders/aabb.js";
import { RenderObject } from "./renderObject.js";

class SplashScreen extends RenderObject{
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
                uniform sampler2D uOverlayTexture;\n\
                \n\
                out vec4 outColor; \n\
                \n\
                //vec4 layer(vec4 foreground, vec4 background) {\n\
                    //return foreground * foreground.a + background * (1.0 - foreground.a);\n\
                //}\n\
                \n\
                void main() {\n\
                outColor = texture(uTexture, vTexCoord);\n\
                //outColor = layer(texture(uTexture, vTexCoord), texture(uOverlayTexture, vTexCoord));//vec4(vColor,1);\n\
            }"
        );

        this.size = 0.5;
        this.collider = new AABB([this.size*2, this.size*2]);
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

        this.texture = this.renderer.createTexture();
        this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.texture);
        this.renderer.texImage2D(this.renderer.TEXTURE_2D, 0, this.renderer.RGBA, 1, 1, 0, this.renderer.RGBA, this.renderer.UNSIGNED_BYTE,
            new Uint8Array([193, 84, 193, 255]));

        this.overlayTexture = this.renderer.createTexture();
        this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.overlayTexture);
        this.renderer.texImage2D(this.renderer.TEXTURE_2D, 0, this.renderer.RGBA, 1, 1, 0, this.renderer.RGBA, this.renderer.UNSIGNED_BYTE,
            new Uint8Array([193, 84, 193, 255]));

        let image = new Image();
        image.src = "resources/splashscreen_background.png";
        image.onload = () => {
            //Select texture and assign image
            this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.texture);
            this.renderer.texImage2D(this.renderer.TEXTURE_2D, 0, this.renderer.RGBA, this.renderer.RGBA,this.renderer.UNSIGNED_BYTE, image);
            this.renderer.texParameterf(this.renderer.TEXTURE_2D, this.renderer.TEXTURE_MAG_FILTER, this.renderer.NEAREST);
            this.renderer.generateMipmap(this.renderer.TEXTURE_2D);
        }

        this.SetSplash("start");
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

        //this.textureLocation = this.renderer.getUniformLocation(this.shaderProgram, "uTexture");
        //this.overlayTextureLocation = this.renderer.getUniformLocation(this.shaderProgram, "uOverlayTexture");

        //this.renderer.uniform1i(this.textureLocation, 0); //set main texture to texture unit 0
        //this.renderer.uniform1i(this.overlayTextureLocation, 1); //set overlay texture to texture unit 1

        //this.renderer.activeTexture(this.renderer.TEXTURE0);
        if(this.renderBase == true){
            this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.texture);
        }

        else if(this.renderBase == false)
            this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.overlayTexture);

        //this.renderer.activeTexture(this.renderer.TEXTURE1);

        this.renderer.vertexAttribPointer(this.vertColorPoint, 2, this.renderer.FLOAT, false, 4*this.vertexByteSize, 2*4);
        this.renderer.vertexAttribPointer(this.vertTexCoordPointer, 2, this.renderer.FLOAT, false, 4*this.vertexByteSize, 5*4);
    }

    Render(){
        this.renderBase = true;
        super.Render();
        this.renderBase = false;
        super.Render();
    }

    SetSplash(splash){
        let overlayImage = new Image();
        switch(splash){
            case "start":
                overlayImage.src = "resources/splashscreen_overlay_start.png";
                break;
                
            case "next level":
                    
                break;
                        
            case "die":
                overlayImage.src = "resources/splashscreen_overlay_death.png";
                break;
        }
            
        overlayImage.onload = () => {
            //Select texture and assign image
            this.renderer.bindTexture(this.renderer.TEXTURE_2D, this.overlayTexture);
            this.renderer.texImage2D(this.renderer.TEXTURE_2D, 0, this.renderer.RGBA, this.renderer.RGBA,this.renderer.UNSIGNED_BYTE, overlayImage);
            this.renderer.texParameterf(this.renderer.TEXTURE_2D, this.renderer.TEXTURE_MAG_FILTER, this.renderer.NEAREST);
            this.renderer.generateMipmap(this.renderer.TEXTURE_2D);
        }
    }
}

export {SplashScreen}