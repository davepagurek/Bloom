import REGL from 'regl';
import { mat4, vec3, vec4 } from 'gl-matrix';

import { generateFlowers } from './commands/flowers';

const regl = REGL();
const flowers = generateFlowers(regl);

regl.frame(() => {
  flowers();
});
