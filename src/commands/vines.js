import { flatMap, range } from 'lodash';

import { MAX_PEOPLE } from './flowers';

export const MAX_VINES = 500;
export const SEGMENTS_PER_VINE = 50;

export function generateVines(regl) {
  return regl({
    vert: `
      precision mediump float;

      attribute float index;
      attribute float segment;

      uniform sampler2D vineState;
      uniform sampler2D people;

      varying float used;

      const float USED = 0.0;
      const float LIFE = 1.0;
      const float POINT_A = 2.0;
      const float POINT_B = 3.0;
      const float PERSON = 5.0;

      float getProperty(float index, float property) {
        return texture2D(vineState, vec2(index/float(${MAX_VINES}), property/6.0)).a;
      }

      vec2 getPosition() {
        vec2 pointA = texture2D(people, vec2(
          getProperty(index, POINT_A) / 17.0,
          getProperty(index, PERSON) / float(${MAX_PEOPLE})
        )).xy;
        vec2 pointB = texture2D(people, vec2(
          getProperty(index, POINT_B) / 17.0,
          getProperty(index, PERSON) / float(${MAX_PEOPLE})
        )).xy;

        return mix(pointA, pointB, segment);
      }

      void main() {
        if (getProperty(index, USED) == 0.0 || getProperty(index, LIFE) < segment) {
          used = 0.0;
          gl_Position = vec4(0.0, 0.0, 1.0, 1.0);
          return;
        }

        used = 1.0;
        gl_Position = vec4(
          getPosition(),
          0.6,
          1.0
        );
      }
    `,

    frag: `
      precision mediump float;

      uniform sampler2D flower;

      varying float used;

      void main() {
        if (used < 1.0) {
          discard;
          return;
        }

        gl_FragColor = vec4(0.1, 0.5, 0.1, 1.0);
      }
    `,

    attributes: {
      index: range(MAX_VINES * SEGMENTS_PER_VINE).map((i) =>
        Math.floor(i/SEGMENTS_PER_VINE)),
      segment: range(MAX_VINES * SEGMENTS_PER_VINE).map((i) =>
        (i % SEGMENTS_PER_VINE) / (SEGMENTS_PER_VINE - 1))
    },

    elements: flatMap(range(MAX_VINES), (vine) =>
        flatMap(range(SEGMENTS_PER_VINE - 1), (i) =>
          [vine * SEGMENTS_PER_VINE + i, vine * SEGMENTS_PER_VINE + i + 1])),

    uniforms: {
      vineState: regl.prop('vineState'),
      people: regl.prop('people'),
    },

    lineWidth: 1,

    primitive: 'lines',
  });
}
