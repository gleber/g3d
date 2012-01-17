var G3World = {};
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
                  'ySpeed': 0};

G3World.render = function(camRotation) {
    G3World.setUniforms({"uCamMatrix": G3World.mv.current,
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
        ensureProjection(o.program, camRotation);
        G3World.setUniform("uMVMatrix", camRotation);
        o.render();
    }

    for (var i = 0; i < G3World.objects.length; i++) {
        o = G3World.objects[i];
        G3World.mv.push();
        mat4.multiply(G3World.mv.current, o.pos);
        ensureProjection(o.program);
        G3World.setUniform("uMVMatrix", G3World.mv.current);
        o.render();
        G3World.mv.pop();
    }
}
