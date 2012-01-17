function G3Program(c, name, vs, fs) {
    G3World.programs[name] = this;
    this.name = name;
    var self = this;
    var fragmentShader = getShader(gl, fs);
    var vertexShader = getShader(gl, vs);
    vertexShader.name = vs;
    fragmentShader.name = fs;

    var program = c.createProgram();
    this.program = program;
    c.attachShader(program, vertexShader);
    c.attachShader(program, fragmentShader);
    c.linkProgram(program);

    assert(c.getProgramParameter(program, c.LINK_STATUS), "Could not initialise shaders");

    this.attribs = {};
    this.attribLocs = {};
    this.uniforms = {};
    this.uniformLocs = {};
    this.textures = {};

    function createAttribSetter(info, index) {
        if (info.size != 1) {
            throw("arrays of attribs not handled");
        }
        // return function(b) {
        //     c.bindBuffer(c.ARRAY_BUFFER, b.buffer());
        //     c.enableVertexAttribArray(index);
        //     c.vertexAttribPointer(
        //         index, b.numComponents(), b.type(), b.normalize(), b.stride(), b.offset());
        // };
    }

    var numAttribs = c.getProgramParameter(program, c.ACTIVE_ATTRIBUTES);
    for (var ii = 0; ii < numAttribs; ++ii) {
        var info = c.getActiveAttrib(program, ii);
        if (!info) {
            break;
        }
        var name = info.name;
        if (endsWith(name, "[0]")) {
            name = name.substr(0, name.length - 3);
        }
        var index = c.getAttribLocation(program, info.name);
        this.attribLocs[name] = c.getAttribLocation(program, name);
        this.attribs[name] = createAttribSetter(info, index);
    }

    var textureUnit = 0;
    function createUniformSetter(info) {
        var loc = c.getUniformLocation(program, info.name);
        var type = info.type;
        if (info.size > 1 && endsWith(info.name, "[0]")) {
            // It's an array.
            if (type == c.FLOAT)
                return function(v) { c.uniform1fv(loc, v); };
            if (type == c.FLOAT_VEC2)
                return function(v) { c.uniform2fv(loc, v); };
            if (type == c.FLOAT_VEC3)
                return function(v) { c.uniform3fv(loc, v); };
            if (type == c.FLOAT_VEC4)
                return function(v) { c.uniform4fv(loc, v); };
            if (type == c.INT)
                return function(v) { c.uniform1iv(loc, v); };
            if (type == c.INT_VEC2)
                return function(v) { c.uniform2iv(loc, v); };
            if (type == c.INT_VEC3)
                return function(v) { c.uniform3iv(loc, v); };
            if (type == c.INT_VEC4)
                return function(v) { c.uniform4iv(loc, v); };
            if (type == c.BOOL)
                return function(v) { c.uniform1iv(loc, v); };
            if (type == c.BOOL_VEC2)
                return function(v) { c.uniform2iv(loc, v); };
            if (type == c.BOOL_VEC3)
                return function(v) { c.uniform3iv(loc, v); };
            if (type == c.BOOL_VEC4)
                return function(v) { c.uniform4iv(loc, v); };
            if (type == c.FLOAT_MAT2)
                return function(v) { c.uniformMatrix2fv(loc, false, v); };
            if (type == c.FLOAT_MAT3)
                return function(v) { c.uniformMatrix3fv(loc, false, v); };
            if (type == c.FLOAT_MAT4)
                return function(v) { c.uniformMatrix4fv(loc, false, v); };
            if (type == c.SAMPLER_2D || type == c.SAMPLER_CUBE) {
                var units = [];
                for (var ii = 0; ii < info.size; ++ii) {
                    units.push(textureUnit++);
                }
                return function(units) {
                    return function(v) {
                        c.uniform1iv(loc, units);
                        v.activate(units);
                    };
                }(units);
            }
            throw ("unknown type: 0x" + type.toString(16));
        }
        else
        {
            if (type == c.FLOAT)
                return function(v) { c.uniform1f(loc, v); };
            if (type == c.FLOAT_VEC2)
                return function(v) { c.uniform2fv(loc, v); };
            if (type == c.FLOAT_VEC3)
                return function(v) { c.uniform3fv(loc, v); };
            if (type == c.FLOAT_VEC4)
                return function(v) { c.uniform4fv(loc, v); };
            if (type == c.INT)
                return function(v) { c.uniform1i(loc, v); };
            if (type == c.INT_VEC2)
                return function(v) { c.uniform2iv(loc, v); };
            if (type == c.INT_VEC3)
                return function(v) { c.uniform3iv(loc, v); };
            if (type == c.INT_VEC4)
                return function(v) { c.uniform4iv(loc, v); };
            if (type == c.BOOL)
                return function(v) { c.uniform1i(loc, v); };
            if (type == c.BOOL_VEC2)
                return function(v) { c.uniform2iv(loc, v); };
            if (type == c.BOOL_VEC3)
                return function(v) { c.uniform3iv(loc, v); };
            if (type == c.BOOL_VEC4)
                return function(v) { c.uniform4iv(loc, v); };
            if (type == c.FLOAT_MAT2)
                return function(v) { c.uniformMatrix2fv(loc, false, v); };
            if (type == c.FLOAT_MAT3)
                return function(v) { c.uniformMatrix3fv(loc, false, v); };
            if (type == c.FLOAT_MAT4)
                return function(v) { c.uniformMatrix4fv(loc, false, v); };
            if (type == c.SAMPLER_2D || type == c.SAMPLER_CUBE) {
                return function(unit) {
                    return function(v) {
                        c.uniform1i(loc, unit);
                        v.activate(unit);
                    };
                }(textureUnit++);
            }
            throw ("unknown type: 0x" + type.toString(16));
        }
    }

    var validate = function() {
        assert(c.getParameter(c.CURRENT_PROGRAM) == program, "wrong program!");
    };

    var numUniforms = c.getProgramParameter(program, c.ACTIVE_UNIFORMS);
    for (var ii = 0; ii < numUniforms; ++ii) {
        var info = c.getActiveUniform(program, ii);
        if (!info) {
            break;
        }
        var name = info.name;
        if (endsWith(name, "[0]")) {
            name = name.substr(0, name.length - 3);
        }
        var settr = createUniformSetter(info);
        // settr = function(settrx) {
        //     return function(xx) {
        //         validate();
        //         return settrx(xx);
        //     }
        // }(settr);
        this.uniformLocs[name] = c.getUniformLocation(program, name);
        this.uniforms[name] = settr;
        if (info.type == c.SAMPLER_2D || info.type == c.SAMPLER_CUBE) {
            this.textures[name] = settr;
        }
    }

    this.setUniform = function(name, value) {
        var settr = this.uniforms[name];
        if (settr) {
            settr(value);
        }
    }

    this.setTexture = function(tex, name) {
        name = name || tex.name;
        var settr = this.textures[name];
        if (settr) {
            settr(tex);
        }
    }

    this.setAttribBuffer = function(b, name) {
        name = b.name || name;
        var index = this.attribLocs[name];
        if (index !== undefined) {
            c.enableVertexAttribArray(index);
            c.bindBuffer(b.buffer_type, b.buffer);
            c.vertexAttribPointer(index, b.isize, b.element_type, false, 0, 0);
        }
    }

    this.render = function(b, primitive_type) {
        primitive_type = primitive_type || c.TRIANGLES;
        c.bindBuffer(b.buffer_type, b.buffer);
        c.drawElements(primitive_type, b.length, b.element_type, 0);
    }

    this.use = function() {
        if (c.__currentProgram != this) {
            c.useProgram(this.program);
            c.__currentProgram = this;
        }
    }
}
