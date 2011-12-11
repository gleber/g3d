function G3Texture(c, url) {
    this.texture = gl.createTexture();
    this.loading = false;
    this.loaded = false;
    var self = this;
    var image = new Image();
    image.onload = function () {
        self.handleLoadedTexture()
    }
    this.load = function(url) {
        if (this.loading) return;
        image.src = url;
    }
    if (url) {
        this.load(url);
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
    this.activate = function() {
        if (!this.loaded) {
            alert('not loaded!')
        }
        c.activeTexture(gl.TEXTURE0);
        c.bindTexture(gl.TEXTURE_2D, this.texture);
    }
}

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
        c.uniform1i(shaderProgram.texturedUniform, false);
        c.bindBuffer(c.ARRAY_BUFFER, this.buffer);
        c.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.buffer.itemSize, c.FLOAT, false, 0, 0);

        c.bindBuffer(c.ARRAY_BUFFER, this.colors);
        c.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colors.itemSize, c.FLOAT, false, 0, 0);
        c.drawArrays(c.TRIANGLE_STRIP, 0, this.buffer.numItems);
    }
}

function G3FileModel(c) {
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
        this.vertexes_buf = c.createBuffer();
        this.normals_buf = c.createBuffer();
        this.texture_coords_buf = c.createBuffer();
        this.indexes_buf = c.createBuffer();

        if (!this.texture) {
            this.colors_buf = c.createBuffer();
            c.bindBuffer(c.ARRAY_BUFFER, this.colors_buf);
            c.bufferData(c.ARRAY_BUFFER, new Float32Array(this.colors), c.STATIC_DRAW);
            this.colors_buf.itemSize = 4;
            this.colors_buf.numItems = Math.floor(this.colors.length / 4);
            assert(this.vertexes_buf.numItems == this.colors_buf.numItems, "Incorrect number of colors!");
        }

        c.bindBuffer(c.ARRAY_BUFFER, this.vertexes_buf);
        c.bufferData(c.ARRAY_BUFFER, new Float32Array(this.vertexes), c.STATIC_DRAW);
        this.vertexes_buf.itemSize = 3;
        this.vertexes_buf.numItems = this.vertexes.length / 3;

        c.bindBuffer(c.ARRAY_BUFFER, this.normals_buf);
        c.bufferData(c.ARRAY_BUFFER, new Float32Array(this.normals), c.STATIC_DRAW);
        this.normals_buf.itemSize = 3;
        this.normals_buf.numItems = this.normals.length / 3;

        c.bindBuffer(c.ELEMENT_ARRAY_BUFFER, this.indexes_buf);
        c.bufferData(c.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexes), c.STATIC_DRAW);
        this.indexes_buf.itemSize = 1;
        this.indexes_buf.numItems = this.indexes.length;

        if (this.texture) {
            c.bindBuffer(c.ARRAY_BUFFER, this.texture_coords_buf);
            c.bufferData(c.ARRAY_BUFFER, new Float32Array(this.texture_coords), c.STATIC_DRAW);
            this.texture_coords_buf.itemSize = 2;
            this.texture_coords_buf.numItems = this.texture_coords.length / 2;
        }

        this.prepared = true;
    }
    this.render = function() {
        c.uniform1i(shaderProgram.texturedUniform, !!this.texture);

        c.bindBuffer(c.ARRAY_BUFFER, this.vertexes_buf);
        c.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                              this.vertexes_buf.itemSize, c.FLOAT, false, 0, 0);

        if (this.texture) {
            this.texture.activate(c);

            c.bindBuffer(c.ARRAY_BUFFER, this.texture_coords_buf);
            c.vertexAttribPointer(shaderProgram.textureCoordAttribute,
                                  this.texture_coords_buf.itemSize, c.FLOAT, false, 0, 0);
        } else {
            c.bindBuffer(c.ARRAY_BUFFER, this.colors_buf);
            c.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colors_buf.itemSize, c.FLOAT, false, 0, 0);
        }

        c.bindBuffer(c.ARRAY_BUFFER, this.normals_buf);
        c.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
                              this.normals_buf.itemSize, c.FLOAT, false, 0, 0);

        c.bindBuffer(c.ELEMENT_ARRAY_BUFFER, this.indexes_buf);
        c.drawElements(c.TRIANGLES,
                       this.indexes_buf.numItems, c.UNSIGNED_SHORT, 0);
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

        c.bindBuffer(c.ARRAY_BUFFER, this.vertexes_buf);
        c.bufferData(c.ARRAY_BUFFER, new Float32Array(this.vertexes), c.STATIC_DRAW);
        this.vertexes_buf.itemSize = 3;
        this.vertexes_buf.numItems = Math.floor(this.vertexes.length / 3);


        c.bindBuffer(c.ARRAY_BUFFER, this.normals_buf);
        c.bufferData(c.ARRAY_BUFFER, new Float32Array(this.normals), c.STATIC_DRAW);
        this.normals_buf.itemSize = 3;
        this.normals_buf.numItems = Math.floor(this.normals.length / 3);

        this.colors_buf = c.createBuffer();
        c.bindBuffer(c.ARRAY_BUFFER, this.colors_buf);
        c.bufferData(c.ARRAY_BUFFER, new Float32Array(this.colors), c.STATIC_DRAW);
        this.colors_buf.itemSize = 4;
        this.colors_buf.numItems = Math.floor(this.colors.length / 4);

        assert(this.vertexes_buf.numItems == this.colors_buf.numItems, "Incorrect number of colors!");
        assert(this.vertexes_buf.numItems == this.normals_buf.numItems, "Incorrect number of normals!");

        this.indexes_buf = c.createBuffer();
        c.bindBuffer(c.ELEMENT_ARRAY_BUFFER, this.indexes_buf);
        c.bufferData(c.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexes), c.STATIC_DRAW);
        this.indexes_buf.itemSize = 1;
        this.indexes_buf.numItems = this.indexes.length;

        this.prepared = true;
   }


    this.render = function() {
        c.uniform1i(shaderProgram.texturedUniform, false);
        if (!this.prepared) {
            this.prepareBuffers();
        }

        c.bindBuffer(c.ARRAY_BUFFER, this.vertexes_buf);
        c.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexes_buf.itemSize, c.FLOAT, false, 0, 0);

        c.bindBuffer(c.ARRAY_BUFFER, this.colors_buf);
        c.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colors_buf.itemSize, c.FLOAT, false, 0, 0);

        c.bindBuffer(c.ARRAY_BUFFER, this.normals_buf);
        c.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.normals_buf.itemSize, c.FLOAT, false, 0, 0);

        c.bindBuffer(c.ELEMENT_ARRAY_BUFFER, this.indexes_buf);
        c.drawElements(c.TRIANGLES, this.indexes_buf.numItems, c.UNSIGNED_SHORT, 0);
    }

    this.setColor = function() {
    }

    this.setColors = function() {
    }
}
