function G3AbstractTexture(c, dst, name, w, h) {
    dst.name = name;
    dst.width = w;
    dst.height = h;
    if (!dst.texture) dst.texture = c.createTexture();
    dst.prepare = function() {};
    dst.activate = function(unit) {
        c.activeTexture(c.TEXTURE0 + unit);
        c.bindTexture(c.TEXTURE_2D, dst.texture);
    }
}

function G3RemoteTexture(c, name, w, h, texture) {
    this.texture = texture;
    G3AbstractTexture(c, this, name, w, h);
}

function G3Texture(c, name, url, dummy_color) {
    G3AbstractTexture(c, this, name);

    this.loading = false;
    this.loaded = false;

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
        self.width = image.width;
        self.height = image.height;

        c.pixelStorei(c.UNPACK_FLIP_Y_WEBGL, true);
        c.bindTexture(c.TEXTURE_2D, this.texture);
        c.texImage2D(c.TEXTURE_2D, 0, c.RGBA, c.RGBA, c.UNSIGNED_BYTE, image);
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MAG_FILTER, c.LINEAR);
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MIN_FILTER, c.LINEAR_MIPMAP_NEAREST);
        c.generateMipmap(c.TEXTURE_2D);
        c.bindTexture(c.TEXTURE_2D, null);
    }
}


function G3NoiseTexture(c, name, w, h) {
    G3AbstractTexture(c, this, name, w, h);

    var self = this;
    this.prepare = function() {
        c.activeTexture(c.TEXTURE0);
        c.bindTexture(c.TEXTURE_2D, self.texture);
        var b = new ArrayBuffer(w*h*4);
        var pixels = new Uint8Array(b);
        for(var y=0; y<h; y++) {
            for(var x=0; x<w; x++) {
                pixels[(y*w + x)*4+0] = Math.floor(255 * Math.random());
                pixels[(y*w + x)*4+1] = Math.floor(255 * Math.random());
                pixels[(y*w + x)*4+2] = Math.floor(255 * Math.random());
                pixels[(y*w + x)*4+3] = Math.floor(255 * Math.random());
            }
        }
        c.texImage2D(
            c.TEXTURE_2D, 0, c.RGBA, w, h, 0, c.RGBA, c.UNSIGNED_BYTE, pixels
        );
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MAG_FILTER, c.LINEAR);
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MIN_FILTER, c.LINEAR);
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_S, c.REPEAT);
        c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_T, c.REPEAT);
        c.bindTexture(c.TEXTURE_2D, null);
    }
}
