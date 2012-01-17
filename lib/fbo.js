function FBO(gl, width, height) {
    var self = this;
    var c = gl;
    this.width = width;
    this.height = height;
    this.fbo = c.createFramebuffer();
    this.depthBuffer = c.createRenderbuffer();
    this.colorBuffer = c.createTexture();

    c.activeTexture(c.TEXTURE0);
    c.bindTexture(c.TEXTURE_2D, this.colorBuffer);
    c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MAG_FILTER, c.LINEAR);
    c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MIN_FILTER, c.LINEAR); //LINEAR_MIPMAP_LINEAR
    c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_S, c.CLAMP_TO_EDGE);
    c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_T, c.CLAMP_TO_EDGE);
    //c.generateMipmap(c.TEXTURE_2D)
    c.texImage2D(c.TEXTURE_2D, 0, c.RGBA,
                  width, height, 0,
                  c.RGBA, c.UNSIGNED_BYTE, null);
    c.bindFramebuffer(c.FRAMEBUFFER, this.fbo);
    c.bindRenderbuffer(c.RENDERBUFFER, this.depthBuffer);
    c.renderbufferStorage(c.RENDERBUFFER, c.DEPTH_COMPONENT16, width, height);
    c.framebufferRenderbuffer(c.FRAMEBUFFER, c.DEPTH_ATTACHMENT, c.RENDERBUFFER, this.depthBuffer);
    c.framebufferTexture2D(c.FRAMEBUFFER, c.COLOR_ATTACHMENT0, c.TEXTURE_2D, this.colorBuffer, 0);
    if (c.checkFramebufferStatus(c.FRAMEBUFFER) !== c.FRAMEBUFFER_COMPLETE) {
        throw "Incomplete frame buffer object.";
    }

    c.bindFramebuffer(c.FRAMEBUFFER, null);

    this.bind = function() {
        c.bindFramebuffer(c.FRAMEBUFFER, self.fbo);
    }

    this.unbind = function() {
        c.bindFramebuffer(c.FRAMEBUFFER, null);
    }

    this.renderTo = function(renderScene, program) {
        this.bind();
        c.clearColor(0, 0, 0, 1);
        c.clear(c.COLOR_BUFFER_BIT | c.DEPTH_BUFFER_BIT);
        c.viewport(0, 0, width, height);
        renderScene(program);
        this.unbind();
    }
}
