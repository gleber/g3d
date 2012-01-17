function G3SSAO(c) {
    var kernel = [];

    var kernelSize = 16;
    for(var i=0; i<kernelSize; i++) {
        kernel.push(2.0 * (Math.random() - 0.5));
        kernel.push(2.0 * (Math.random() - 0.5));
        kernel.push(Math.random());
    }

    var depthFbo = new FBO(c, 1024, 512);
    var ssaoFbo = new FBO(c, 1024, 512);
    var depthTex = new G3RemoteTexture(c, "depthTex", 1024, 512, depthFbo.colorBuffer)
    var noiseTexture = new G3NoiseTexture(c, "noiseTex", 4, 4);

    this.renderDepth = function(renderScene) {
        depthFbo.renderTo(renderScene, G3World.programs['ssao-depth']);
    }

    this.perform = function(renderScene) {
        var p = G3World.programs['ssao-main'];
        p.use();
        p.setUniform("noiseScale", [depthFbo.width / noiseTexture.width,
                                    depthFbo.height / noiseTexture.height]);
        p.setUniform("kernel", kernel);

        p.setTexture(depthTex);
        p.setTexture(noiseTexture);

        // ssaoFbo.renderTo(renderScene, p)
        renderScene(p);
     }
}
