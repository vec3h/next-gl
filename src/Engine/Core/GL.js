import {Color} from './Color';

class GL {
	constructor({domElement, clearColor = new Color(), transparent = true, pixelRatio = window.devicePixelRatio || 1, antialias = true }) {
		this._domElement = domElement;
		this._clearColor = clearColor.toVec4();
		this._transparent = transparent ? 0.0 : 1.0;
		this._antialias = antialias;

		this.glContext = this._initWebGL();

		if (!this.glContext) return;

		this.realPixels = pixelRatio;

		this._programs = new Map();
	}

	initProgram(vertexShader, fragmentShader, defines) {
		if (defines.size !== 0) {
			const insertAt = (src, index, str) => {
				return src.substr(0, index) + str + src.substr(index);
			};

			defines = new Map([...defines.entries()].sort()); // sorting
			let programDefines = '';

			for (const [key, value] of defines) {
				programDefines += `#define ${key} = ${value};\n`;
			}

			const firstLine = vertexShader.split('\n')[0];
			const indexWhereDefinesWillInjected = firstLine.length + 1;

			vertexShader = insertAt(vertexShader, indexWhereDefinesWillInjected, programDefines);
			fragmentShader = insertAt(fragmentShader, indexWhereDefinesWillInjected, programDefines);
		}

		const programHash = this._computeHash(vertexShader + fragmentShader);

		if (this._programs.has(programHash)) {
			return this._programs.get(programHash);
		}

		const program = this._createProgram(
			this._loadShader(this.glContext.VERTEX_SHADER, vertexShader),
			this._loadShader(this.glContext.FRAGMENT_SHADER, fragmentShader),
			programHash
		);

		this._programs.set(programHash, program);

		return program;
	}

	checkAndResize() {
		const canvas = this.glContext.canvas;

		const displayWidth = Math.floor(canvas.clientWidth * this.realPixels);
		const displayHeight = Math.floor(canvas.clientHeight * this.realPixels);

		if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
			canvas.width  = displayWidth;
			canvas.height = displayHeight;

			this.glContext.viewport(0, 0, this.glContext.drawingBufferWidth, this.glContext.drawingBufferHeight);

			return true;
		}
		return false;
	}

	loadTexture(gl, url) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		const level = 0;
		const internalFormat = gl.RGBA;
		const width = 1;
		const height = 1;
		const border = 0;
		const srcFormat = gl.RGBA;
		const srcType = gl.UNSIGNED_BYTE;
		const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
			width, height, border, srcFormat, srcType,
			pixel);

		const image = new Image();
		image.onload = () => {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
				srcFormat, srcType, image);
			gl.generateMipmap(gl.TEXTURE_2D);

		};

		image.src = url;

		return texture;
	}

	_initWebGL() {
		const gl = this._domElement.getContext('webgl2', { antialias: this._antialias});

		if (!gl) {
			alert('Unable to initialize WebGL. Your browser may not support it.');
			return null;
		}

		gl.clearColor(this._clearColor.x, this._clearColor.y, this._clearColor.z, this._transparent);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.depthFunc(gl.LEQUAL);

		return gl;
	}


	_loadShader(type, source) {
		const shader = this.glContext.createShader(type);
		this.glContext.shaderSource(shader, source);
		this.glContext.compileShader(shader);
		if (!this.glContext.getShaderParameter(shader, this.glContext.COMPILE_STATUS)) {
			console.error('An error occurred compiling the shaders: ' + this.glContext.getShaderInfoLog(shader));
			this.glContext.deleteShader(shader);
			return null;
		}
		return shader;
	}

	_createProgram(vertexShader, fragmentShader, name) {
		const shaderProgram = this.glContext.createProgram();
		shaderProgram.name = name;

		this.glContext.attachShader(shaderProgram, vertexShader);
		this.glContext.attachShader(shaderProgram, fragmentShader);
		this.glContext.linkProgram(shaderProgram);

		if (!this.glContext.getProgramParameter(shaderProgram, this.glContext.LINK_STATUS)) {
			console.error(`Unable to initialize the shader program: ${this.glContext.getProgramInfoLog(shaderProgram)}`);
			return null;
		}

		return shaderProgram;
	}

	_computeHash(str) {
		let hash = 0, i, chr;
		if (str === 0) return hash;
		for (i = 0; i < str.length; i++) {
			chr   = str.charCodeAt(i);
			hash  = ((hash << 5) - hash) + chr;
			hash |= 0;
		}
		return hash;
	}
}
export {GL};
