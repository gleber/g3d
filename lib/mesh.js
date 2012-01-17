function G3TriangleMesh(c, program) {
    this.textures = [];
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
        p.setAttribBuffer(this.vertexes_buf);
        p.setAttribBuffer(this.normals_buf);

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

}




function G3SphereMesh(c, program) {
    this.program = program;
    this.vertexes = [];
    this.normals = [];
    this.texture_coords = [];
    this.indexes = [];

    this.init = function(radius, bands) {
        bands = bands || 30;
        this.vertexes = [];
        this.normals = [];
        this.texture_coords = [];
        this.indexes = [];
        var latitudeBands = bands;
        var longitudeBands = bands;
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




function G3FileMesh(c, program) {
    this.vertexes = [];
    this.normals = [];
    this.indexes = [];
    this.texture_coords = [];

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

       this.texture_coords_buf = new G3Buffer(c, "aTextureCoord", Float32Array, this.texture_coords, 2);

        this.prepared = true;
    }
    this.render = function(p) {
        p = p || program;
        p.use();

        p.setAttribBuffer(this.vertexes_buf);
        p.setAttribBuffer(this.normals_buf);

        p.setAttribBuffer(this.texture);
        p.setAttribBuffer(this.texture_coords_buf);

        p.render(this.indexes_buf);
    }
}
