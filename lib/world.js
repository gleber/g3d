var G3World = {};
var g3w = G3World;
G3World.viewport = {};
G3World.programs = {};
G3World.setUniform = function(name, value) {
    for (var n in G3World.programs) {
        var set = false;
        var prog = G3World.programs[n];
        if (prog.uniformLocs[name]) {
            if (!set) {
                prog.use();
                set = true;
            }
            prog.setUniform(name, value);
        }
    }
}

G3World.setUniforms = function(uns) {
    for (var n in G3World.programs) {
        var prog = G3World.programs[n];
        var set = false;
        for (var name in uns) {
            var value = uns[name];
            if (prog.uniformLocs[name]) {
                if (!set) {
                    prog.use();
                    set = true;
                }
                prog.setUniform(name, value);
            }
        }
    }
}

G3World.statics = [];
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
                  'ySpeed': 0
                 };

G3World.setContext = function(gl, width, height) {
    G3World.c = gl;
    G3World.viewport.width = width;
    G3World.viewport.height = height;
}

G3World.initProjection = function(width, height, near, far, fov) {
    var c = g3w.c;
    g3w.viewport.near = near = near || g3w.viewport.near || 0.1;
    g3w.viewport.far  = far  = far  || g3w.viewport.far  || 2000.0;
    g3w.viewport.width  = width  = width  || g3w.viewport.width;
    g3w.viewport.height = height = height || g3w.viewport.height;
    g3w.viewport.fov = fov = 45;

    var pMatrix = mat4.create();
    mat4.perspective(fov, width / height, near, far, pMatrix);
    G3World.setUniform("uPMatrix", pMatrix);
}

G3World.setMVPVectors = function(program, mv) {
    mv = mv || G3World.mv.current;
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mv, normalMatrix);
    mat3.transpose(normalMatrix);
    program.use();
    program.setUniform("uNMatrix", normalMatrix);
    program.setUniform("uMVMatrix", mv);
}

G3World.renderScene = function(program) {
    var c = g3w.c;
    c.viewport(0, 0, g3w.viewport.width, g3w.viewport.height);
    c.clear(c.COLOR_BUFFER_BIT | c.DEPTH_BUFFER_BIT);

    G3World.mv.push();

    mat4.rotate(G3World.mv.current, degToRad(-G3World.camera.pitch), [1, 0, 0]);
    mat4.rotate(G3World.mv.current, degToRad(-G3World.camera.yaw), [0, 1, 0]);

    var camRotation = mat4.create();
    mat4.set(G3World.mv.current, camRotation);

    mat4.translate(G3World.mv.current, [-G3World.camera.x, -G3World.camera.y, -G3World.camera.z]);

    G3World.renderObjects(program, camRotation);

    G3World.mv.pop();
}

G3World.renderObjects = function(program, camRotation) {
    G3World.setUniforms({"uCamMatrix": G3World.mv.current,
                         "far": g3w.viewport.far,
                         "near": g3w.viewport.near,
                         "fov": g3w.viewport.fov,
                         "uFogStart": 80.0,
                         "uFogEnd": 100.0,
                         "uFogColor": [0.0, 0.0, 0.0, 1.0],
                         "uAmbientColor": [0.2, 0.2, 0.2],
                         "uPointLightingLocation": [0, 1, 0],
                         "uPointLightingDiffuseColor": [ 1, 1, 1],
                         "uPointLightingSpecularColor": [ 2, 2, 2]});

    for (var i = 0; i < G3World.statics.length; i++) {
        o = G3World.statics[i];
        mat4.multiply(camRotation, o.pos);
        G3World.setMVPVectors(program || o.program, camRotation);
        o.render(program);
    }

    for (var i = 0; i < G3World.objects.length; i++) {
        o = G3World.objects[i];
        G3World.mv.push();
        mat4.multiply(G3World.mv.current, o.pos);
        G3World.setMVPVectors(program || o.program);
        o.render(program);
        G3World.mv.pop();
    }
}

G3World.animate = function(elapsed) {
    for (var i = 0; i < G3World.statics.length; i++) {
        o = G3World.statics[i];
        o.animate(elapsed);
    }

    for (var i = 0; i < G3World.objects.length; i++) {
        o = G3World.objects[i];
        o.animate(elapsed);
    }
}
