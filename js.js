function assert(cond, str) {
    if (!cond) {
        alert(str);
    }
}

var gl;

var UI = {};
UI.keys = {};

function handleKeyDown(event) {
    UI.keys[event.keyCode] = true;
    console.log(event.keyCode);
}

function handleKeyUp(event) {
    UI.keys[event.keyCode] = false;
}


function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;

        gl.ensureProjection = function() {
            var normalMatrix = mat3.create();
            mat4.toInverseMat3(G3World.mv.current, normalMatrix);
            mat3.transpose(normalMatrix);
            gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
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

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.camMatrixUniform = gl.getUniformLocation(shaderProgram, "uCamMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");

    shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shaderProgram, "uPointLightingLocation");
    shaderProgram.pointLightingColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingColor");

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
G3World.mv = {'current': mat4.create(),
              'stack': []};
mat4.identity(G3World.mv.current);
G3World.mv.push = function() {
    var copy = mat4.create();
    mat4.set(G3World.mv.current, copy);
    G3World.mv.stack.push(copy);
};
G3World.mv.pop = function() {
    if (G3World.mv.stack.length == 0) {
        throw "Invalid popMatrix!";
    }
    G3World.mv.current = G3World.mv.stack.pop();
};

// -4 18 14
// -17 -48

G3World.camera = {'x': -4,
                  'y': 18,
                  'z': 14,
                  'yaw': -17,
                  'pitch': -48,

                  'yawSpeed': 0,
                  'pitchSpeed': 0,
                  'speed': 0,

                  'xSpeed': 0,
                  'zSpeed': 0,
                  'ySpeed': 0};
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

function G3ComplexModel(c) {
    this.models = [];
    this.add = function(model) {
        this.models.push(model)
    };
    this.prepareBuffers = function() {
        for (var i = 0; i < this.models.length-1; i++) {
            this.models[i].prepareBuffers();
        }
    };
    this.render = function() {
        for (var i = 0; i < this.models.length-1; i++) {
            this.models[i].render();
        }
    };
}

function G3TriangleModel(c) {
    this.vertexes = [];
    this.colors = [];
    this.normals = [];
    this.indexes = [];
    this.texture_coords = [];
    this.prepared = false;

    this.addTriangle = function(vs, color, normal) {
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
            if (normal) {
                for (var j = 0; j < 3; j++){
                    this.normals[ind * 3 + j] = normal[j];
                }
            }
        }
        var m = [0, 1, 2];
        for (var x in m) {
            this.indexes.push(fi + m[x]);
        }
    }

    this.addSquare = function(vs, color, normal) {
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
            if (normal) {
                for (var j = 0; j < 3; j++){
                    this.normals[ind * 3 + j] = normal[j];
                }
            }
        }
        var m = [0, 1, 2, 0, 2, 3];
        for (var x in m) {
            this.indexes.push(fi + m[x]);
        }
    }

    this.addSphere = function() {
        var latitudeBands = 30;
        var longitudeBands = 30;
        var radius = 2;

        for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
                var u = 1- (longNumber / longitudeBands);
                var v = latNumber / latitudeBands;

                this.normals.push(x);
                this.normals.push(y);
                this.normals.push(z);
                this.texture_coords.push(u);
                this.texture_coords.push(v);
                this.vertexes.push(radius * x);
                this.vertexes.push(radius * y);
                this.vertexes.push(radius * z);
            }
        }

       for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                this.indexes.push(first);
                this.indexes.push(second);
                this.indexes.push(first + 1);

                this.indexes.push(second);
                this.indexes.push(second + 1);
                this.indexes.push(first + 1);
            }
        }
    }

    this.prepareBuffers = function() {
        this.vertexes_buf = c.createBuffer();
        this.normals_buf = c.createBuffer();
        this.colors_buf = c.createBuffer();
        this.indexes_buf = c.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexes_buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexes), gl.STATIC_DRAW);
        this.vertexes_buf.itemSize = 3;
        this.vertexes_buf.numItems = Math.floor(this.vertexes.length / 3);


        gl.bindBuffer(gl.ARRAY_BUFFER, this.normals_buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
        this.normals_buf.itemSize = 3;
        this.normals_buf.numItems = Math.floor(this.normals.length / 3);

        this.colors_buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colors_buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
        this.colors_buf.itemSize = 4;
        this.colors_buf.numItems = Math.floor(this.colors.length / 4);

        assert(this.vertexes_buf.numItems == this.colors_buf.numItems, "Incorrect number of colors!");
        assert(this.vertexes_buf.numItems == this.normals_buf.numItems, "Incorrect number of normals!");

        this.indexes_buf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexes_buf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexes), gl.STATIC_DRAW);
        this.indexes_buf.itemSize = 1;
        this.indexes_buf.numItems = this.indexes.length;

        this.prepared = true;

        console.log(this.normals);
    }


    this.render = function() {
        if (!this.prepared) {
            this.prepareBuffers();
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexes_buf);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexes_buf.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colors_buf);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colors_buf.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normals_buf);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.normals_buf.itemSize, gl.FLOAT, false, 0, 0);

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
        mat4.multiply(G3World.mv.current, this.pos);
        c.ensureProjection();
        c.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, G3World.mv.current);

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

    triangle.translate([0, 0, 0]);
    triangle.scale(0.3, 0.3, 0.3);
    G3World.objects.push(triangle);

    var field_model = new G3TriangleModel(gl);
    field_model.addSquare([ [ 1.0,  1.0,  0.0],
                            [-1.0,  1.0,  0.0],
                            [-1.0, -1.0,  0.0],
                            [ 1.0, -1.0,  0.0] ], green, [0, 1, 0]);

    var field = new G3Object(gl);
    field.setModel(field_model);
    //field.translate([0, 0, 0]);
    field.rotate(90, 0, 0);
    field.scale(10.65, 7.15, 1);

    G3World.objects.push(field);

    var square_model2 = new G3TriangleModel(gl);
    // front
    square_model2.addSquare([ [-1.0,  1.0,  1.0],
                              [-1.0, -1.0,  1.0],
                              [ 1.0, -1.0,  1.0],
                              [ 1.0,  1.0,  1.0] ], red, [0, 0, 1]);

    // top
    square_model2.addSquare([ [-1.0,  1.0, -1.0],
                              [-1.0,  1.0,  1.0],
                              [ 1.0,  1.0,  1.0],
                              [ 1.0,  1.0, -1.0] ], green, [0, 1, 0]);

    // Back face
    square_model2.addSquare([ [-1.0, -1.0, -1.0],
                              [-1.0,  1.0, -1.0],
                              [1.0,  1.0, -1.0],
                              [1.0, -1.0, -1.0] ], green, [0, 0, -1]);

    // Bottom face
    square_model2.addSquare([ [ -1.0, -1.0, -1.0],
                              [ 1.0, -1.0, -1.0],
                              [ 1.0, -1.0,  1.0],
                              [ -1.0, -1.0,  1.0] ], red, [0, -1, 0]);

    // Right face
    square_model2.addSquare([ [ 1.0, -1.0, -1.0],
                              [ 1.0,  1.0, -1.0],
                              [ 1.0,  1.0,  1.0],
                              [ 1.0, -1.0,  1.0] ], green, [1, 0, 0]);

    // Left face
    square_model2.addSquare([ [ -1.0, -1.0, -1.0],
                              [ -1.0, -1.0,  1.0],
                              [ -1.0,  1.0,  1.0],
                              [ -1.0,  1.0, -1.0] ], red, [-1, 0, 0]);

    square_model2.addTriangle([ [  1,   1, 1],
                                [ -1,  -1, 1],
                                [  0,   0, 2] ], blue, [1, -1, 0]);

    square_model2.prepareBuffers();


    var bramka = new G3TriangleModel(gl);

    // top
    bramka.addSquare([ [-1.0,  1.0, -1.0],
                              [-1.0,  1.0,  1.0],
                              [ 1.0,  1.0,  1.0],
                              [ 1.0,  1.0, -1.0] ], blue, [0, 1, 0]);

    // Right face
    bramka.addSquare([ [ 1.0, -1.0, -1.0],
                              [ 1.0,  1.0, -1.0],
                              [ 1.0,  1.0,  1.0],
                              [ 1.0, -1.0,  1.0] ], blue, [1, 0, 0]);

    // Left face
    bramka.addSquare([ [ -1.0, -1.0, -1.0],
                              [ -1.0, -1.0,  1.0],
                              [ -1.0,  1.0,  1.0],
                              [ -1.0,  1.0, -1.0] ], blue, [-1, 0, 0]);

    bramka.prepareBuffers();


    var square2 = new G3Object(gl);
    square2.setModel(square_model2);
    square2.translate([3, 3, -10]);

    G3World.objects.push(square2);

    var bramka1 = new G3Object(gl);
    bramka1.setModel(bramka);
    bramka1.translate([10.65, 1, 0]);
    bramka1.rotate(0, 90, 0);
    bramka1.scale(2, 1, 0.1);

    var bramka2 = new G3Object(gl);
    bramka2.setModel(bramka);
    bramka2.translate([-10.65, 1, 0]);
    bramka2.rotate(0, 90, 0);
    bramka2.scale(2, 1, 0.1);

    G3World.objects.push(bramka1);
    G3World.objects.push(bramka2);
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    G3World.mv.push();

    mat4.rotate(G3World.mv.current, degToRad(-G3World.camera.pitch), [1, 0, 0]);
    mat4.rotate(G3World.mv.current, degToRad(-G3World.camera.yaw), [0, 1, 0]);
    mat4.translate(G3World.mv.current, [-G3World.camera.x, -G3World.camera.y, -G3World.camera.z]);

    gl.uniformMatrix4fv(shaderProgram.camMatrixUniform, false, G3World.mv.current);

    gl.uniform3f(shaderProgram.ambientColorUniform, 0.2, 0.2, 0.2);

    var lightingDirection = [-0.25, -0.25, -1];
    var adjustedLD = vec3.create();
    vec3.normalize(lightingDirection, adjustedLD);
    vec3.scale(adjustedLD, -1);
    gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);

    gl.uniform3f(shaderProgram.directionalColorUniform, 0.4, 0.4, 0.4);

    gl.uniform3f(shaderProgram.pointLightingLocationUniform, 3, 0, 0);
    gl.uniform3f(shaderProgram.pointLightingColorUniform, 0.8, 0.1, 0.1);

    for (var i = 0; i < G3World.objects.length; i++) {
        o = G3World.objects[i];
        G3World.mv.push();
        o.render();
        G3World.mv.pop();
    }

    G3World.mv.pop();
}



function webGLStart() {
    var canvas = document.getElementById("lesson01-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}


function tick() {
    requestAnimFrame(tick);
    drawScene();
    handleKeys();
    animate();

    document.getElementById('xpos').innerHTML = -G3World.camera.x + '';
    document.getElementById('ypos').innerHTML = -G3World.camera.y + '';
    document.getElementById('zpos').innerHTML = -G3World.camera.z + '';

    document.getElementById('yaw').innerHTML = -G3World.camera.yaw + '';
    document.getElementById('pitch').innerHTML = -G3World.camera.pitch + '';
};

function handleKeys() {
    var camera = G3World.camera;
    if (UI.keys[33]) {
        // Page Up
        camera.pitchSpeed = 0.1;
    } else if (UI.keys[34]) {
        // Page Down
        camera.pitchSpeed = -0.1;
    } else {
        camera.pitchSpeed = 0;
    }

    if (UI.keys[37] || UI.keys[65]) { // Left cursor key or A
        camera.yawSpeed = 0.1;
    } else if (UI.keys[39] || UI.keys[68]) { // Right cursor key or D
        camera.yawSpeed= -0.1;
    } else {
        camera.yawSpeed = 0;
    }

    if (UI.keys[38] || UI.keys[87]) { // Up cursor key or W
        camera.speed = 0.03;
    } else if (UI.keys[40] || UI.keys[83]) { // Down cursor key
        camera.speed = -0.03;
    } else {
        camera.speed = 0;
    }

}

var lastTime = 0;

function animate() {
    var camera = G3World.camera;
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        if (camera.speed != 0) {

            camera.x -= Math.sin(degToRad(camera.yaw)) * camera.speed * elapsed;
            camera.y += Math.sin(degToRad(camera.pitch)) * camera.speed * elapsed;
            camera.z -= Math.cos(degToRad(camera.pitch)) * Math.cos(degToRad(camera.yaw)) * camera.speed * elapsed;
        }

        G3World.objects[2].rotate(0.1 * elapsed, 0.05 * elapsed, 0);

        camera.yaw += camera.yawSpeed * elapsed;
        camera.pitch += camera.pitchSpeed * elapsed;
    }
    lastTime = timeNow;
}
