function G3SSAO(c) {
    var kernel = [];

    var kernelSize = 16;
    for(var i=0; i<kernelSize; i++) {
        kernel.push(2.0 * (Math.random() - 0.5));
        kernel.push(2.0 * (Math.random() - 0.5));
        kernel.push(Math.random());
    }

    var depthFbo = new FBO(c, 1024, 512);
    var noiseTexture = new G3NoiseTexture(c, "noise", 4, 4)

    this.renderDepth = function(renderScene) {
        depthFbo.renderTo(renderScene, G3World.programs['ssao-depth']);
    }

    this.do = function(renderScene) {
        var p = G3World.programs['ssao-main'];
        p.use();
        p.set("depthTex", 0);
        p.set("noiseTex", 1);
        p.setUniform("aspectRatio", camera.aspectRatio);
        p.setUniform("noiseScale", [depthFbo.width/noiseTexture.width, depthFbo.height/noiseTexture.height]); //4 = noise texture width
        p.setUniform("kernel", kernel);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, depthFbo.colorBuffer);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, noiseTexture);

        ssaoFbo.renderTo(renderScene, p)
    }
}
