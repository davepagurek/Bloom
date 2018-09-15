import { flatMap, range } from 'lodash';

export const MAX_PARTICLES = 500;

export function generateFlowers(regl) {
  return regl({
    vert: `
      precision mediump float;

      attribute float index;
      attribute vec2 offset;

      uniform sampler2D particleState;

      varying float used;
      //varying vec2 textureCoord;

      const float USED = 0.0;
      const float LIFE = 1.0;
      const float X = 2.0;
      const float Y = 3.0;

      float getProperty(float index, float property) {
        return texture2D(particleState, vec2(index/float(${MAX_PARTICLES}), property/4.0)).a;
      }

      void main() {
        if (getProperty(index, USED) == 0.0) {
          used = 0.0;
          gl_Position = vec4(0.0, 0.0, 1.0, 1.0);
          //textureCoord = vec2(0.0, 0.0);
          return;
        }

        used = 1.0;
        //textureCoord = offset[corner];
        gl_Position = vec4(
          vec2(getProperty(index, X), getProperty(index, Y)) + (offset * 0.2 - 0.1),
          0.5,
          1.0
        );
      }
    `,

    frag: `
      precision mediump float;

      varying float used;

      void main() {
        if (used == 0.0) {
          discard;
          gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
          return;
        }

        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `,

    attributes: {
      index: range(MAX_PARTICLES * 6).map((i) => Math.floor(i/6)),
      offset: flatMap(range(MAX_PARTICLES), () => [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 1],
        [1, 0],
        [0, 0]
      ])
    },

    uniforms: {
      particleState: regl.prop('particleState')
    },

    primitive: 'triangles',

    count: MAX_PARTICLES * 6
  });
}
