function G3Animation(c) {
    this.animate = function(obj, elapsed) {
    }
}

function G3WaveAnimation(c) {
    var self = this;
    var t = 0;
    var x = 0;
    var y = 0;
    var z = 0;
    this.xScale = 1;
    this.yScale = 1;
    this.zScale = 1
    this.setPhase = function(phase) {
        t = phase;
    }
    this.setScale = function(scale) {
        self.yScale = self.zScale = self.xScale = scale;
    };
    this.animate = function(obj, elapsed) {
        t = t + elapsed / 1000;
        var nx = Math.cos(t);
        var ny = Math.sin(t);
        var nz = Math.sin(t);
        var dx = (x - nx) * self.xScale;
        var dy = (y - ny) * self.yScale;
        var dz = (z - nz) * self.zScale;
        obj.translate([dx, dy, dz]);
        x = nx;
        y = ny;
        z = nz;
    }
}
