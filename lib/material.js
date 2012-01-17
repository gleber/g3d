function G3Material(c) {
    this.uniforms = {};
    this.textures = [];
    this.prepare = function() {
        for (var i = 0; i < this.textures.length; i++) {
            this.textures[i].prepare();
        }
    }
    this.set = function(p) {
        p.use();
        for (var k in this.uniforms) {
            p.setUniform(k, this.uniforms[k]);
        }
        for (var i = 0; i < this.textures.length; i++) {
            p.setTexture(this.textures[i]);
        }
    }
}
