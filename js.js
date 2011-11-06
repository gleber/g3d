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

function G3Object(c, vertices) { 
    this.pos = mat4.create();
    this.buffer = c.createBuffer();
    mat4.identity(this.pos);

    vCount = vertices.length;
    vSize = vertices[0].length;

    var vertices2 = [];
    for (var i = 0; i < vCount; i++) {
        for (var j = 0; j < vSize; j++) {
            vertices2.push(vertices[i][j]);
        }
    }

    console.log(vertices2);
    c.bindBuffer(c.ARRAY_BUFFER, this.buffer);
    c.bufferData(c.ARRAY_BUFFER, new Float32Array(vertices2), c.STATIC_DRAW);

    this.buffer.itemSize = vSize;
    this.buffer.numItems = vCount;

    this.render = function() {        
        c.bindBuffer(c.ARRAY_BUFFER, this.buffer);
        c.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.buffer.itemSize, c.FLOAT, false, 0, 0);
        c.ensureProjection();
        c.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, this.pos);
        c.drawArrays(c.TRIANGLE_STRIP, 0, this.buffer.numItems);
    };

    this.translate = function(v) {
        mat4.translate(this.pos, v);
    };

    this.rotate = function(v) {
        mat4.rotate(this.pos, v);
    };
}

function initBuffers() {
    triangle = new G3Object(gl, [ [ 0.0,  1.0,  0.0],
                                  [-1.0, -1.0,  0.0],
                                  [ 1.0, -1.0,  0.0] ]);

    triangle.translate([-1.5, 0.0, -7]);

    square = new G3Object(gl, [ [ 1.0,  1.0,  0.0],
                                [-1.0,  1.0,  0.0],
                                [ 1.0, -1.0,  0.0],
                                [-1.0, -1.0,  0.0] ]);

    square.translate([1.5, 0.0, -16]);
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

    drawScene();
}


