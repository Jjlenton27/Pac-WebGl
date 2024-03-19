class RenderObject{
    //create variables
    constructor(renderer, vertexSize, vertexShaderSource, fragmentShaderSource){
        this.renderer = renderer
        this.vertexShaderSource = vertexShaderSource;
        this.fragmentShaderSource = fragmentShaderSource;

        this.position = [0,0];
        this.rotation = 0;
        this.size = 1;
        this.vertexByteSize = vertexSize;

        this.time = 0;
    }

    //intialise systems and get ready for rendering
    Setup(verticies, indicies){
        this.verticies = verticies;
        this.indicies = indicies;

        //compile vertex and fragment shaders
        this.vertexShader = this.#ComipleShader(this.vertexShaderSource, 
            this.renderer.VERTEX_SHADER,
            "VERTEX");

        this.fragmentShader = this.#ComipleShader(this.fragmentShaderSource, 
            this.renderer.FRAGMENT_SHADER,
            "FRAGMENT");

        //attach shaders and link the shader program
        this.shaderProgram = this.renderer.createProgram();
        this.renderer.attachShader(this.shaderProgram, this.vertexShader);
        this.renderer.attachShader(this.shaderProgram, this.fragmentShader);
        this.renderer.linkProgram(this.shaderProgram);

        this.ExtractAttributes();

        this.renderer.useProgram(this.shaderProgram);

        this.vertexBuffer = this.renderer.createBuffer();
            this.renderer.bindBuffer(this.renderer.ARRAY_BUFFER, this.vertexBuffer);
            this.renderer.bufferData(this.renderer.ARRAY_BUFFER,
            new Float32Array(this.verticies),
            this.renderer.STATIC_DRAW);

        this.indexBuffer = this.renderer.createBuffer();
        this.renderer.bindBuffer(this.renderer.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.renderer.bufferData(this.renderer.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(this.indicies),
            this.renderer.STATIC_DRAW);
    }

    ExtractAttributes(){
        this.vertPositionPointer = this.renderer.getAttribLocation(this.shaderProgram, "aPosition"); //link GLSL and js varible
        this.renderer.enableVertexAttribArray(this.vertPositionPointer); //need to enable the variable
    }

    MasterUpdate(deltaTime){
        this.UpdateTime(deltaTime);
        this.Update();
        this.Render();
    }

    UpdateTime(deltaTime){
        this.time = this.time + deltaTime;
        this.deltaTime = deltaTime;
    }

    Update(){}

    Render(){
        this.renderer.useProgram(this.shaderProgram);
        let renderVertexes = this.AdjustVerticies();//this.verticies);

        this.renderer.bindBuffer(this.renderer.ARRAY_BUFFER, this.vertexBuffer); //set target to vertex buffer
            this.renderer.bufferData(this.renderer.ARRAY_BUFFER,
            new Float32Array(renderVertexes),
            this.renderer.STATIC_DRAW); //send updates to vertex array buffer

        this.BindAttributes();
        this.renderer.bindBuffer(this.renderer.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.renderer.drawElements(this.renderer.TRIANGLES, this.indicies.length, this.renderer.UNSIGNED_SHORT, 0);
    }

    AdjustVerticies(){
        let renderVerticies = [...this.verticies];
        for (let i = 0; i < 4; i++) {
            let vertexOffset = (i*this.vertexByteSize)
            renderVerticies[0+vertexOffset] = (renderVerticies[0+vertexOffset] * this.size) + this.position[0];
            renderVerticies[1+vertexOffset] = (renderVerticies[1+vertexOffset] * this.size) + this.position[1];
        }

        return renderVerticies;
    }

    BindAttributes(){
        this.renderer.vertexAttribPointer(this.vertPositionPointer, 2, this.renderer.FLOAT, false, 4*this.vertexByteSize, 0); //varible, variable size/count, type, normalise, vertex size in bytes, position of variable in array in bytes
    }

    #ComipleShader(source, type, typeString) {
        let shader = this.renderer.createShader(type);
        this.renderer.shaderSource(shader, source);
        this.renderer.compileShader(shader);
        if (!this.renderer.getShaderParameter(shader, this.renderer.COMPILE_STATUS)) {
            alert("ERROR IN " + typeString + " SHADER: " + this.renderer.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    }
}

export{RenderObject}