function G3Object(c, program, vertices, colors) {
    this.program = program;
    this.pos = mat4.create();

    this.setModel = function(model) {
        this.model = model;
        if (!program && model.program) {
            this.program = model.program;
        }
    }

    if (program && vertices) {
        this.setModel(new G3Model(c, program, vertices, colors));
    }
    mat4.identity(this.pos);

    this.render = function() {
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
        yScale = yScale || xScale;
        zScale = zScale || xScale;
        mat4.scale(this.pos, [xScale, yScale, zScale]);
    };
}
