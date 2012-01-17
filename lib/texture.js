function G3Texture(c, name, url, dummy_color) {
    this.name = name;
    this.texture = c.createTexture();
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
