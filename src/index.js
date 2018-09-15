import { ParticleManager } from './particles';
import { generateFlowers } from './commands/flowers';

import REGL from 'regl';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { range } from 'lodash';

const regl = REGL({ extensions: ['OES_texture_float'] });
const flowers = generateFlowers(regl);
const particles = new ParticleManager(regl);

range(3).forEach(() => {
  const index = particles.addParticle();
  particles.update(index, { x: Math.random()*2 - 1, y: Math.random() * 2 - 1, life: 0 });
});

regl.frame(() => {
  particles.eachParticle((index) => {
    particles.update(index, {
      x: particles.value(index, 'x') + 0.01,
      y: particles.value(index, 'y') + 0.01,
      life: particles.value(index, 'life') + 1
    });
  });

  flowers({
    particleState: particles.getTexture()
  });
});
