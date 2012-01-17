var gl;

var UI = {};
UI.keys = {};

function handleKeyDown(event) {
    UI.keys[event.keyCode] = true;
}

function handleKeyUp(event) {
    UI.keys[event.keyCode] = false;
}


function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    assert(gl, "Could not initialise WebGL, sorry :-(");
}


function initShaders() {
    // new G3Program(gl, "colored", "colored-shader-vs", "colored-shader-fs");
    new G3Program(gl, "solid-color", "solid-color-shader-vs", "solid-color-shader-fs");
    // new G3Program(gl, "multitextured", "multitextured-shader-vs", "multitextured-shader-fs");
    // new G3Program(gl, "textured", "textured-shader-vs", "textured-shader-fs");
    // new G3Program(gl, "skysphere", "skysphere-vs", "skysphere-fs");
}


var pMatrix = mat4.create();

// -4 18 14
// -17 -48

var field_model;
var field_tex;
var field2_tex;
var marking_tex;

function initBuffers() {
    var red   = [1,0,0,1];
    var green = [0,1,0,1];
    var blue  = [0,0,1,1];

    var spm = new G3Mesh(gl);
    spm.setSphere(10);
    var spmm = new G3MeshModel(gl, G3World.programs["solid-color"]);
    spmm.setMesh(spm);
    for (var i = 0; i < 1; i++) {
        var x = (Math.random() - 0.5) * 2.0;
        var y = (Math.random() - 0.5) * 2.0;
        var z = (Math.random() - 0.5) * 2.0;
        var spo = new G3Object(gl);
        spo.setModel(spmm);
        spo.translate(x, y, z);
        G3World.objects.push(spo);
    }

    // var bramka = new G3TriangleModel(gl, G3World.programs["colored"]);

    // bramka.addSquare([ [-1.0,  1.0, -1.0],
    //                    [-1.0,  1.0,  1.0],
    //                    [ 1.0,  1.0,  1.0],
    //                    [ 1.0,  1.0, -1.0] ], blue, [0, 1, 0]);
    // bramka.addSquare([ [ 1.0, -1.0, -1.0],
    //                    [ 1.0,  1.0, -1.0],
    //                    [ 1.0,  1.0,  1.0],
    //                    [ 1.0, -1.0,  1.0] ], blue, [1, 0, 0]);
    // bramka.addSquare([ [-1.0, -1.0, -1.0],
    //                    [-1.0, -1.0,  1.0],
    //                    [-1.0,  1.0,  1.0],
    //                    [-1.0,  1.0, -1.0] ], blue, [-1, 0, 0]);

    // bramka.prepareBuffers();

    // var bramka1 = new G3Object(gl);
    // bramka1.setModel(bramka);
    // bramka1.translate([10.65, 1, 0]);
    // bramka1.rotate(0, 90, 0);
    // bramka1.scale(2, 1, 0.1);

    // var bramka2 = new G3Object(gl);
    // bramka2.setModel(bramka);
    // bramka2.translate([-10.65, 1, 0]);
    // bramka2.rotate(0, 90, 0);
    // bramka2.scale(2, 1, 0.1);

    // G3World.objects.push(bramka1);
    // G3World.objects.push(bramka2);
}

function ensureProjection(program, mv) {
    mv = mv || G3World.mv.current;
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mv, normalMatrix);
    mat3.transpose(normalMatrix);
    G3World.setUniform("uNMatrix", normalMatrix);
}

function drawScene(width, height, f) {
    width = width || gl.viewportWidth;
    height = height || gl.viewportHeight;
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, width / height, 0.1, 2000.0, pMatrix);

    G3World.mv.push();

    mat4.rotate(G3World.mv.current, degToRad(-G3World.camera.pitch), [1, 0, 0]);
    mat4.rotate(G3World.mv.current, degToRad(-G3World.camera.yaw), [0, 1, 0]);

    var lightingDirection = [-0.25, -0.25, -1];
    var adjustedLD = vec3.create();
    vec3.normalize(lightingDirection, adjustedLD);
    vec3.scale(adjustedLD, -1);

    var camRotation = mat4.create();
    mat4.set(G3World.mv.current, camRotation);

    mat4.translate(G3World.mv.current, [-G3World.camera.x, -G3World.camera.y, -G3World.camera.z]);

    G3World.setUniform("uPMatrix", pMatrix);

    G3World.render(camRotation);

    G3World.mv.pop();

    if (f) {
        f();
    }
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

        // G3World.objects[2].rotate(0.1 * elapsed, 0.05 * elapsed, 0);

        camera.yaw += camera.yawSpeed * elapsed;
        camera.pitch += camera.pitchSpeed * elapsed;
    }
    lastTime = timeNow;
}
