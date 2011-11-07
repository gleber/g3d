function assert(cond, str) {
    if (!cond) {
        alert(str);
    }
}

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
    assert(gl, "Could not initialise WebGL, sorry :-(");
}

var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    assert(gl.getProgramParameter(shaderProgram, gl.LINK_STATUS), "Could not initialise shaders");

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}


var pMatrix = mat4.create();

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

var G3World = {};
G3World.objects = [];
var triangle;

function G3Model (c, vertices, colors) {
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
        c.drawArrays(c.TRIANGLE_STRIP, 0, this.buffer.numItems);
    }
}

function G3TriangleModel(c) {
    this.vertexes = [];
    this.colors = [];
    this.indexes = [];
    this.prepared = false;

    this.addTriangle = function(vs, color) {
        var fi = this.vertexes.length / 3;
        for (var i = 0; i<3; i++) {
            var v = vs[i];
            var ind = Math.floor(this.vertexes.length / 3);
            for (var j = 0; j < 3; j++){
                this.vertexes.push(v[j]);
            }
            for (var j = 0; j < 4; j++){
                this.colors[ind * 4 + j] = color[j];
            }
        }
        var m = [0, 1, 2];
        for (var x in m) {
            this.indexes.push(fi + m[x]);
        }
    }

    this.addSquare = function(vs, color) {
        var fi = this.vertexes.length / 3;
        for (var i = 0; i<4; i++) {
            var v = vs[i];
            var ind = Math.floor(this.vertexes.length / 3);
            for (var j = 0; j < 3; j++){
                this.vertexes.push(v[j]);
            }
            for (var j = 0; j < 4; j++){
                this.colors[ind * 4 + j] = color[j];
            }
        }
        var m = [0, 1, 2, 0, 2, 3];
        for (var x in m) {
            this.indexes.push(fi + m[x]);
        }
    }

    this.prepareBuffers = function() {
        this.vertexes_buf = c.createBuffer();
        this.colors_buf = c.createBuffer();
        this.indexes_buf = c.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexes_buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexes), gl.STATIC_DRAW);
        this.vertexes_buf.itemSize = 3;
        this.vertexes_buf.numItems = Math.floor(this.vertexes.length / 3);


        this.colors_buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colors_buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
        this.colors_buf.itemSize = 4;
        this.colors_buf.numItems = Math.floor(this.vertexes.length / 3);

        assert(this.vertexes_buf.numItems == this.colors_buf.numItems, "Incorrect number of colors!");


        this.indexes_buf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexes_buf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexes), gl.STATIC_DRAW);
        this.indexes_buf.itemSize = 1;
        this.indexes_buf.numItems = this.indexes.length;
        this.prepared = true;

        console.log(this.vertexes);
        console.log(this.colors);
        console.log(this.indexes);
    }


    this.render = function() {
        if (!this.prepared) {
            this.prepareBuffers();
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexes_buf);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexes_buf.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colors_buf);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colors_buf.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexes_buf);
        gl.drawElements(gl.TRIANGLES, this.indexes_buf.numItems, gl.UNSIGNED_SHORT, 0);
    }

    this.setColor = function() {
    }

    this.setColors = function() {
    }
}

function G3Object(c, vertices, colors) {
    this.pos = mat4.create();

    this.setModel = function(model) {
        this.model = model;
    }

    if (vertices || colors) {
        this.setModel(new G3Model(c, vertices, colors));
    }
    mat4.identity(this.pos);

    this.render = function() {
        c.ensureProjection();
        c.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, this.pos);

        this.model.render();
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
    this.setColor = function(color) {
        this.model.setColor(color);
    }
    this.setColors = function(colors) {
        this.model.setColors(colors);
    }
}

function initBuffers() {
    var red   = [1,0,0,1];
    var green = [0,1,0,1];
    var blue  = [0,0,1,1];
    triangle = new G3Object(gl, [ [ 0.0,  1.0,  0.0],
                                  [-1.0, -1.0,  0.0],
                                  [ 1.0, -1.0,  0.0] ]);
    triangle.setColors([ [1.0, 0.0, 0.0, 1.0],
                         [0.0, 1.0, 0.0, 1.0],
                         [0.0, 0.0, 1.0, 1.0] ]);

    triangle.translate([-1.5, 0.0, -7]);
    triangle.rotate(0, 0, 0);
    G3World.objects.push(triangle);

    var square_model = new G3Model(gl, [ [ 1.0,  1.0,  0.0],
                                         [-1.0,  1.0,  0.0],
                                         [ 1.0, -1.0,  0.0],
                                         [-1.0, -1.0,  0.0] ]);
    square_model.setColor([0, 1, 0, 1]);

    var square = new G3Object(gl);
    square.setModel(square_model);
    square.translate([0, -3, -10]);
    square.rotate(90, 0, 0);

    G3World.objects.push(square);

    var square_model2 = new G3TriangleModel(gl);
    // front
    square_model2.addSquare([ [-1.0, -1.0,  1.0],
                              [ 1.0, -1.0,  1.0],
                              [ 1.0,  1.0,  1.0],
                              [-1.0,  1.0,  1.0]], red);

    // top
    square_model2.addSquare([ [-1.0,  1.0, -1.0],
                              [-1.0,  1.0,  1.0],
                              [ 1.0,  1.0,  1.0],
                              [ 1.0,  1.0, -1.0] ], red);


    // Back face
    square_model2.addSquare([ [-1.0, -1.0, -1.0],
                              [-1.0,  1.0, -1.0],
                              [1.0,  1.0, -1.0],
                              [1.0, -1.0, -1.0] ], green);

    // Top face
    square_model2.addSquare([ [-1.0,  1.0, -1.0],
                              [-1.0,  1.0,  1.0],
                              [1.0,  1.0,  1.0],
                              [ 1.0,  1.0, -1.0] ], green);

    // Bottom face
    square_model2.addSquare([ [ -1.0, -1.0, -1.0],
                              [ 1.0, -1.0, -1.0],
                              [ 1.0, -1.0,  1.0],
                              [ -1.0, -1.0,  1.0] ], green);

    // Right face
    square_model2.addSquare([ [ 1.0, -1.0, -1.0],
                              [ 1.0,  1.0, -1.0],
                              [ 1.0,  1.0,  1.0],
                              [ 1.0, -1.0,  1.0] ], green);

    // Left face
    square_model2.addSquare([ [ -1.0, -1.0, -1.0],
                              [ -1.0, -1.0,  1.0],
                              [ -1.0,  1.0,  1.0],
                              [ -1.0,  1.0, -1.0] ], red);

    square_model2.addTriangle([ [  1,   1, 1],
                                [ -1,  -1, 1],
                                [  0,   0, 2] ], blue);

    square_model2.prepareBuffers();

    var square2 = new G3Object(gl);
    square2.setModel(square_model2);
    square2.translate([3, 3, -10]);

    G3World.objects.push(square2);
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    for (var i = 0; i < G3World.objects.length; i++) {
        o = G3World.objects[i];
        o.render();
    }
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
        G3World.objects[2].rotate(0.1 * elapsed, 0.05 * elapsed, 0);
    }
    lastTime = timeNow;
}
