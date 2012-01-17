function G3MeshModel(c, program) {
    this.program = program;
    this.mesh = null;
    this.material = new G3Material(c);

    this.setTexture = function(t) {
        this.texture = t;
    }
    this.setMesh = function(m) {
        this.mesh = m;
    }
    this.prepare = function() {
        this.material.prepare();
        this.mesh.prepare();
        this.prepared = true;
    };
    this.render = function(p) {
        if (!this.prepared) {
            this.prepare();
        }
        p = p || program;
        p.use();
        this.material.set(p);
        this.mesh.render(p);
    }
}

function G3SimpleModel(c, program, vertices, colors) {
    this.buffer = c.createBuffer();
    this.colors = c.createBuffer();
    this.program = program;

    this.setColors = function(colors) {
        vCount = this.buffer.numItems;
        colors = colors || defaultColorsMatrix([1.0, 1.0, 1.0, 1.0], vCount);
        if (colors.length != vCount) {
            alert('Bad colors length!');
        }
        var colors2 = flatten(colors);
        this.colors.itemSize = 4;
        this.colors.numItems = vCount;
        fillBuffer(c, this.colors, colors2, Float32Array);
    };

    this.setColor = function(color) {
        vCount = this.buffer.numItems;
        var colors = defaultColorsMatrix(color, vCount);
        this.setColors(colors);
    };

    vCount = vertices.length;
    vSize = vertices[0].length;

    var vertices2 = flatten(vertices, vCount, vSize);

    this.buffer.itemSize = vSize;
    this.buffer.numItems = vCount;
    fillBuffer(c, this.buffer, vertices2, Float32Array);

    this.setColors(colors);

    this.render = function(p) {
        p = p || program;
        p.use();
        p.setAttribBuffer("aVertexPosition", this.buffer, this.buffer.itemSize, c.FLOAT);
        p.setAttribBuffer("aVertexColor", this.colors, this.colors.itemSize, c.FLOAT);

        c.drawArrays(c.TRIANGLE_STRIP, 0, this.buffer.numItems);
    }
}


function G3ComplexModel(c, program) {
    this.program = program;
    this.models = [];
    this.add = function(model) {
        this.models.push(model)
    };
    this.prepareBuffers = function() {
        for (var i = 0; i < this.models.length-1; i++) {
            this.models[i].prepareBuffers();
        }
    };
    this.render = function(p) {
        p = p || program
        p.use();
        for (var i = 0; i < this.models.length-1; i++) {
            this.models[i].render(p);
        }
    };
}
