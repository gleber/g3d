var gl;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;

        gl.ensureProjection = function() {
            gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        }

    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}


var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


var square;
var triangle;

function flatten(x, count, size) {
    count = count || x.length;
    size = size || x[0].length;
    var r = [];
    for (var i = 0; i < count; i++) {
        for (var j = 0; j < size; j++) {
            r.push(x[i][j]);
        }
    }
    return r;
};

function defaultColorsMatrix(color, size) {
    var r = [];
    for (var i = 0; i < size; i++) {
        r.push(color.slice());
    };
    return r;
}

function G3Object(c, vertices, colors) { 
    this.pos = mat4.create();
    this.buffer = c.createBuffer();
    this.colors = c.createBuffer();

    this.setColors = function(colors) {
        vCount = this.buffer.numItems;
        colors = colors || defaultColorsMatrix([1.0, 1.0, 1.0, 1.0], vCount);
        if (colors.length != vCount) {
            alert('Bad colors length!');
        }
        var colors2 = flatten(colors);
        c.bindBuffer(c.ARRAY_BUFFER, this.colors);
        c.bufferData(c.ARRAY_BUFFER, new Float32Array(colors2), c.STATIC_DRAW);
        this.colors.itemSize = 4;
        this.colors.numItems = vCount;
    };

    this.setColor = function(color) {
        vCount = this.buffer.numItems;
        var colors = defaultColorsMatrix(color, vCount);
        this.setColors(colors);
    };

    mat4.identity(this.pos);

    vCount = vertices.length;
    vSize = vertices[0].length;

    var vertices2 = flatten(vertices, vCount, vSize);

    c.bindBuffer(c.ARRAY_BUFFER, this.buffer);
    c.bufferData(c.ARRAY_BUFFER, new Float32Array(vertices2), c.STATIC_DRAW);

    this.buffer.itemSize = vSize;
    this.buffer.numItems = vCount;

    this.setColors(colors);
    
    this.render = function() {        

        c.bindBuffer(c.ARRAY_BUFFER, this.buffer);
        c.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.buffer.itemSize, c.FLOAT, false, 0, 0);

        c.bindBuffer(c.ARRAY_BUFFER, this.colors);
        c.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colors.itemSize, c.FLOAT, false, 0, 0);

        c.ensureProjection();
        c.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, this.pos);
        c.drawArrays(c.TRIANGLE_STRIP, 0, this.buffer.numItems);
    };

    this.translate = function(v) {
        mat4.translate(this.pos, v);
    };

    this.rotate = function(xRot, yRot, zRot) {
        mat4.rotate(this.pos, degToRad(xRot), [1, 0, 0]);
        mat4.rotate(this.pos, degToRad(yRot), [0, 1, 0]);
        mat4.rotate(this.pos, degToRad(zRot), [0, 0, 1]);
    };

    this.scale = function(xScale, yScale, zScale) {
        mat4.scale(this.pos, [xScale, yScale, zScale]);
    };
}

function initBuffers() {
    triangle = new G3Object(gl, [ [ 0.0,  1.0,  0.0],
                                  [-1.0, -1.0,  0.0],
                                  [ 1.0, -1.0,  0.0] ]);
    triangle.setColors([ [1.0, 0.0, 0.0, 1.0],
                         [0.0, 1.0, 0.0, 1.0],
                         [0.0, 0.0, 1.0, 1.0] ]);

    triangle.translate([-1.5, 0.0, -7]);
    triangle.rotate(0, 0, 0);

    square = new G3Object(gl, [ [ 1.0,  1.0,  0.0],
                                [-1.0,  1.0,  0.0],
                                [ 1.0, -1.0,  0.0],
                                [-1.0, -1.0,  0.0] ]);
    square.translate([0, -0.001, 0]);
    square.rotate(90, 0, 0);
    square.scale(106.5, 71.5, 1);
    square.setColor([0, 1, 0, 1]);
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    triangle.render();
    square.render();
}



function webGLStart() {
    var canvas = document.getElementById("lesson01-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}


function tick() {
    requestAnimFrame(tick);
    drawScene();
    animate();
};

var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        
        // if (speed != 0) {
        //     xPos -= Math.sin(degToRad(yaw)) * speed * elapsed;
        //     zPos -= Math.cos(degToRad(yaw)) * speed * elapsed;
        //     yPos = Math.sin(degToRad(joggingAngle)) / 20 + 0.4
        // }
        
        // yaw += yawRate * elapsed;
        // pitch += pitchRate * elapsed;
        triangle.rotate(0.1 * elapsed, 0, 0);
    }
    lastTime = timeNow;
}
