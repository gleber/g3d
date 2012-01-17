function fillBuffer(c, buffer, values, at, draw_type) {
    fillAnyBuffer(c, c.ARRAY_BUFFER, buffer, values, at, draw_type);
}

function fillElementBuffer(c, buffer, values, at, draw_type) {
    fillAnyBuffer(c, c.ELEMENT_ARRAY_BUFFER, buffer, values, at, draw_type);
}

function fillAnyBuffer(c, buffer_type, buffer, values, at, draw_type) {
    c.bindBuffer(buffer_type, buffer);
    c.bufferData(buffer_type, new at(values), draw_type || c.STATIC_DRAW);
}

function inferElementType(at) {
    var t;
    var n;
    if (at == Float32Array) {
        t = gl.FLOAT;
        n = false;
    } else if (at == Uint8Array) {
        t = gl.UNSIGNED_BYTE;
        n = true;
    } else if (at == Int8Array) {
        t = gl.BYTE;
        n = true;
    } else if (at == Uint16Array) {
        t = gl.UNSIGNED_SHORT;
        n = true;
    } else if (at == Int16Array) {
        t = gl.SHORT;
        n = true;
    } else {
        throw("unhandled type:" + (at));
    }
    return t;
}

function G3Buffer(c, name, at, values, isize) {
    this.name = name;
    this.buffer = c.createBuffer();
    this.buffer_type = c.ARRAY_BUFFER;
    this.element_type = inferElementType(at);

    this.isize = isize;
    this.length = values.length / isize;

    c.bindBuffer(this.buffer_type, this.buffer);
    c.bufferData(this.buffer_type, new at(values), c.STATIC_DRAW);
}

function G3ElementBuffer(c, at, values, isize, draw_type) {
    isize = isize || 1;
    this.buffer = c.createBuffer();
    this.buffer_type = c.ELEMENT_ARRAY_BUFFER;
    this.element_type = inferElementType(at);

    this.isize = isize;
    this.length = values.length / isize;

    c.bindBuffer(this.buffer_type, this.buffer);
    c.bufferData(this.buffer_type, new at(values), draw_type || c.STATIC_DRAW);
}
