
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
    gl.shaderProgram = shaderProgram;

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

    shaderProgram.texturedUniform = gl.getUniformLocation(shaderProgram, "uTextured");
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

G3World.camera = {'x': 0,
                  'y': 28,
                  'z': 0,
                  'yaw': 0,
                  'pitch': -90,

                  'yawSpeed': 0,
                  'pitchSpeed': 0,
                  'speed': 0,

                  'xSpeed': 0,
                  'zSpeed': 0,
                  'ySpeed': 0};
var triangle;


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
                            [ 1.0, -1.0,  0.0] ], green, [0, 0, 1]);

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

    gl.uniform3f(shaderProgram.pointLightingLocationUniform, 0, 1, 0);
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
            camera.x -= Math.cos(degToRad(camera.pitch)) * Math.sin(degToRad(camera.yaw)) * camera.speed * elapsed;
            camera.y += Math.sin(degToRad(camera.pitch)) * camera.speed * elapsed;
            camera.z -= Math.cos(degToRad(camera.pitch)) * Math.cos(degToRad(camera.yaw)) * camera.speed * elapsed;
        }

        G3World.objects[2].rotate(0.1 * elapsed, 0.05 * elapsed, 0);

        camera.yaw += camera.yawSpeed * elapsed;
        camera.pitch += camera.pitchSpeed * elapsed;
    }
    lastTime = timeNow;
}
