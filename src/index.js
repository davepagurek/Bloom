import { ParticleManager } from './particles';
import { generateFlowers } from './commands/flowers';

import REGL from 'regl';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { range } from 'lodash';

const regl = REGL();
const flowers = generateFlowers(regl);
const particles = new ParticleManager();

range(3).forEach(() => {
  const index = particles.addParticle();
  particles.update(index, { x: Math.random()*2 - 1, y: Math.random() * 2 - 1, life: 0 });
});

regl.frame(() => {
  flowers({
    particleUsed: particles.particleUsed,
    particleLocation: particles.particleLocation
  });
});
