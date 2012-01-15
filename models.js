function G3Texture(c, name, url, dummy_color) {
    this.name = name;
    this.texture = c.createTexture();
    this.loading = false;
    this.loaded = false;

    // c.bindTexture(c.TEXTURE_2D, this.texture);
    // var pixel = new Uint8Array(dummy_color);
    // c.texImage2D(c.TEXTURE_2D, 0, c.RGBA, 1, 1, 0, c.RGBA, pixel);

    var self = this;
    var image = new Image();
    image.onload = function () {
        self.handleLoadedTexture()
    }
    this.prepare = function(nurl) {
        nurl = nurl || url;
        if (this.loading) return;
        image.src = nurl;
    }
    if (url) {
        this.prepare(url);
    }
    this.handleLoadedTexture = function() {
        c.pixelStorei(c.UNPACK_FLIP_Y_WEBGL, true);
        c.bindTexture(c.TEXTURE_2D, this.texture);
        c.texImage2D(c.TEXTURE_2D, 0, c.RGBA, c.RGBA, c.UNSIGNED_BYTE, image);
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MAG_FILTER, c.LINEAR);
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MIN_FILTER, c.LINEAR_MIPMAP_NEAREST);
        c.generateMipmap(c.TEXTURE_2D);
        c.bindTexture(c.TEXTURE_2D, null);
    }
    this.activate = function(unit) {
        // if (!this.loaded) {
        //     alert('not loaded!')
        // }
        c.activeTexture(c.TEXTURE0 + unit);
        c.bindTexture(c.TEXTURE_2D, this.texture);
    }
}

function G3Model (c, program, vertices, colors) {
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

function G3FileModel(c, program) {
    this.program = program;
    this.loaded = false;
    this.prepared = false;

    this.vertexes = [];
    this.colors = [];
    this.normals = [];
    this.indexes = [];
    this.texture_coords = [];

    this.texture = undefined;

    this.load = function(url) {
        var request = new XMLHttpRequest();
        request.open("GET", url);
        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                handleLoadedTeapot(JSON.parse(request.responseText));
            }
        }
        request.send();
    }
    this.handleLoaded = function(data) {
        this.vertexes = data.vertexPositions;
        this.normals = data.vertexNormals;
        this.indexes = data.indices;
        this.texture_coords = data.vertexTextureCoords;
        this.loaded = true;
    }
    this.prepare = function() {
        if (this.prepared) alert('Prepare twice?!');
        if (!this.loaded) alert('Not yet loaded!');
        this.vertexes_buf = new G3Buffer(c, "aVertexPosition", Float32Array, this.vertexes, 3);
        this.normals_buf = new G3Buffer(c, "aVertexNormal", Float32Array, this.normals, 3);
        this.indexes_buf = new G3ElementBuffer(c, Uint16Array, this.indexes);

        if (!this.texture) {
            this.colors_buf = new G3Buffer(c, "aVertexColor", Float32Array, this.colors, 4);
            assert(this.vertexes_buf.numItems == this.colors_buf.numItems, "Incorrect number of colors!");
        } else {
            this.texture_coords_buf = new G3Buffer(c, "aTextureCoord", Float32Array, this.texture_coords, 2);
        }

        this.prepared = true;
    }
    this.render = function(p) {
        p = p || program;
        p.use();

        p.setAttribBuffer(this.vertexes_buf);
        p.setAttribBuffer(this.normals_buf);

        if (this.texture) {
            p.setAttribBuffer(this.texture);
            p.setAttribBuffer(this.texture_coords_buf);
        } else {
            p.setAttribBuffer(this.colors_buf);
        }

        p.render(this.indexes_buf);
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

function G3Mesh(c, program) {
    this.program = program;
    this.vertexes = [];
    this.normals = [];
    this.texture_coords = [];
    this.indexes = [];

    this.setSphere = function(radius) {
        this.vertexes = [];
        this.normals = [];
        this.texture_coords = [];
        this.indexes = [];
        var latitudeBands = 100;
        var longitudeBands = 100;
        var radius = radius;
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
                var u = 1 - (longNumber / longitudeBands);
                var v = 1 - (latNumber / latitudeBands);
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

        this.vertexes_buf = new G3Buffer(c, "aVertexPosition", Float32Array, this.vertexes, 3);
        this.normals_buf = new G3Buffer(c, "aVertexNormal", Float32Array, this.normals, 3);
        this.texture_coords_buf = new G3Buffer(c, "aTextureCoord", Float32Array, this.texture_coords, 2);
        this.indexes_buf = new G3ElementBuffer(c, Uint16Array, this.indexes, 1, c.STREAM_DRAW);
    };
    this.prepare = function() {
    };
    this.render = function(p) {
        p = p || program;
        p.use();
        p.setAttribBuffer(this.vertexes_buf);
        p.setAttribBuffer(this.normals_buf);
        p.setAttribBuffer(this.texture_coords_buf);
        p.render(this.indexes_buf);
    }
};

function G3MeshModel(c, program) {
    this.program = program;
    this.mesh = null;
    this.texture = null;

    this.setTexture = function(t) {
        this.texture = t;
    }
    this.setMesh = function(m) {
        this.mesh = m;
    }
    this.prepare = function() { this.mesh.prepare();
                                this.texture.prepare(); };

    this.render = function(p) {
        p = p || program;
        p.use();

        if (this.texture) {
            p.setTexture(this.texture);
        }
        this.mesh.render(p);
    }
}

function G3TriangleModel(c, program) {
    this.program = program;
    this.textures = [];
    this.vertexes = [];
    this.colors = [];
    this.normals = [];
    this.indexes = [];
    this.texture_coords = [];
    this.prepared = false;
    this.shininess = 0;

    this.addTexture = function(tex) {
        this.textures.push(tex);
        tex.prepare();
    }

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

    this.prepareBuffers = function() {
        this.vertexes_buf = new G3Buffer(c, "aVertexPosition", Float32Array, this.vertexes, 3);
        this.normals_buf = new G3Buffer(c, "aVertexNormal", Float32Array, this.normals, 3);
        if (this.textures) {
            this.texture_coords_buf = new G3Buffer(c, "aTextureCoord", Float32Array, this.texture_coords, 2);
        } else {
            this.colors_buf = new G3Buffer(c, "aVertexColor", Float32Array, this.colors, 4);
        }
        this.indexes_buf = new G3ElementBuffer(c, Uint16Array, this.indexes);
        this.prepared = true;
    }

    this.render = function(p) {
        if (!this.prepared) {
            this.prepareBuffers();
        }
        p = p || program;
        p.use()
        p.setUniform("uMaterialShininess", this.shininess);
        p.setAttribBuffer(this.vertexes_buf);
        p.setAttribBuffer(this.normals_buf);

        p.use();

        if (this.textures) {
            for (var i = 0; i < this.textures.length; i++) {
                p.setTexture(this.textures[i]);
            }
            p.setAttribBuffer(this.texture_coords_buf);
         } else {
            p.setAttribBuffer(this.colors_buf);
        }
        p.render(this.indexes_buf);
    }

    this.setColor = function() {
    }

    this.setColors = function() {
    }
}
