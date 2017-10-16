import {Color} from '../Color';
import fragmentShader from './shaders/Standard.frag';
import vertexShader from './shaders/Standard.vert';

class StandardMaterial {
	constructor({color = new Color(255, 255, 255, 1),
		map = null, isDoubleSided = false, useDepthTest = true}) {
		this.defines = new Map();

		if (map !== null) {
			this.defines.set('USE_MAP', true);
			this.map = map;
		}
		this.depthTest = useDepthTest;
		this.isDoubleSided = isDoubleSided;
		this.color = color.toRGBA();
		this.program = null;
	}
	
	createMaterial(gl) {
		this.program = gl.initProgram(vertexShader, fragmentShader, this.defines);
		return this.program;
	}
}
export {StandardMaterial};
