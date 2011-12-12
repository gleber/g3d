function endsWith(str, postfix) {
    var l = postfix.length;
    var x = str.slice(-l);
    return x == postfix;
}

function flatten(x, count, size) {
    count = count || x.length;
    size = size || x[0].length;
    var r = [];
    for (var i = 0; i < count; i++) {
        for (var j = 0; j < size; j++) {
            r.push(x[i][j]);
        }
    }
    return r;
};

function defaultColorsMatrix(color, size) {
    var r = [];
    for (var i = 0; i < size; i++) {
        r.push(color.slice());
    };
    return r;
}

function assert(cond, str) {
    if (!cond) {
        alert(str);
    }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}
