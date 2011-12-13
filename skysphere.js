function Skysphere(c, url) {
    var program = G3World.programs["skysphere"]
    this.program = program;
    var skysphere_mesh = new G3Mesh(c, program);
    skysphere_mesh.setSphere(1);

    var skysphere_tex = new G3Texture(c, "uSampler", url, [1.0, 0.0, 0.0, 0.0]);

    var skysphere = new G3MeshModel(c, program);
    skysphere.setMesh(skysphere_mesh);
    skysphere.setTexture(skysphere_tex);

    this.render = function() {
        skysphere.render();
        gl.clear(gl.DEPTH_BUFFER_BIT);
    }
}
