var gl;

var UI = {};
UI.keys = {};

function handleKeyDown(event) {
    UI.keys[event.keyCode] = true;
    //console.log(event.keyCode);
    if (event.keyCode == 32) {
        tick();
    }
}

function handleKeyUp(event) {
    UI.keys[event.keyCode] = false;
}


function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        G3World.setContext(gl, canvas.width, canvas.height);
    } catch (e) {
    }
    assert(gl, "Could not initialise WebGL, sorry :-(");
}


function initShaders() {
    // new G3Program(gl, "colored", "colored-shader-vs", "colored-shader-fs");
    new G3Program(gl, "ssao-depth", "showDepth.vert", "showDepth.frag");
    new G3Program(gl, "ssao-main", "ssao.vert", "ssao.frag");
    new G3Program(gl, "blur", "baseTexture.vert", "blur.frag");
    new G3Program(gl, "solid-color", "solid-color-shader-vs", "solid-color-shader-fs");
    new G3Program(gl, "solid-blue-color", "solid-color-shader-vs", "solid-blue-color-shader-fs");
    // new G3Program(gl, "multitextured", "multitextured-shader-vs", "multitextured-shader-fs");
    // new G3Program(gl, "textured", "textured-shader-vs", "textured-shader-fs");
    // new G3Program(gl, "skysphere", "skysphere-vs", "skysphere-fs");
}



// -4 18 14
// -17 -48

var field_model;
var field_tex;
var field2_tex;
var marking_tex;

function initScene() {
    var red   = [1,0,0,1];
    var green = [0,1,0,1];
    var blue  = [0,0,1,1];
    var white  = [1,1,1,1];

    var spm = new G3SphereMesh(gl);
    spm.init(1);
    var spmm = new G3MeshModel(gl, G3World.programs["solid-color"]);
    spmm.material.uniforms["uColor"] = green;
    spmm.setMesh(spm);
    for (var i = 0; i < 10; i++) {
        var x = (Math.random() - 0.5) * 5.0;
        var y = (Math.random() - 0.5) * 5.0;
        var z = (Math.random() - 0.5) * 5.0;
        var spo = new G3Object(gl);
        spo.setModel(spmm);
        spo.animation = new G3WaveAnimation(gl);
        spo.animation.setPhase(Math.random() * 3);
        spo.animation.setScale(0.3);
        spo.translate([x, y, z]);
        spo.scale([Math.random() * 1.0 + 1.0]);
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


function drawScene(program) {
    //G3World.renderScene(program || G3World.programs['solid-blue-color'])
    G3World.renderScene(program)
}

var ssao;

function webGLStart() {
    var canvas = document.getElementById("lesson01-canvas");
    initGL(canvas);
    initShaders();
    initScene();
    ssao = new G3SSAO(gl);
    G3World.initProjection();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}


function tick() {
    requestAnimFrame(tick);

    ssao.renderDepth(drawScene);
    ssao.perform(drawScene);
    // drawScene();
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

        G3World.animate(elapsed);

        camera.yaw += camera.yawSpeed * elapsed;
        camera.pitch += camera.pitchSpeed * elapsed;
    }
    lastTime = timeNow;
}
