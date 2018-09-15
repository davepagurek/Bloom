import { ParticleManager } from './particles';
import { generateFlowers } from './commands/flowers';

import REGL from 'regl';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { range } from 'lodash';

const regl = REGL({ extensions: ['OES_texture_float'] });

const flower = new Image();
flower.addEventListener('load', () => {
  console.log(flower);
  const flowers = generateFlowers(regl, flower);
  const particles = new ParticleManager(regl);

  range(20).forEach(() => {
    const index = particles.addParticle();
    particles.update(index, { x: Math.random()*2 - 1, y: Math.random() * 2 - 1, life: 0 });
  });

  let tick = 0;
  regl.frame(() => {
    tick = (tick + 1) % 5;

    particles.eachParticle((index) => {
      if (tick !== 0) return;

      const life = particles.value(index, 'life');
      if (life < 12) {
        particles.update(index, {
          life: life + 1
        });
      }
    });

    flowers({
      particleState: particles.getTexture()
    });
  });
});
flower.src = 'img/flower.png';
