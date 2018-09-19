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
      attribute float side;

      uniform sampler2D vineState;
      uniform sampler2D people;

      varying float used;

      const float USED = 0.0;
      const float LIFE = 1.0;
      const float POINT_A = 2.0;
      const float POINT_B = 3.0;
      const float SEED = 4.0;
      const float PERSON = 5.0;

      float getProperty(float index, float property) {
        return texture2D(vineState, vec2(index/float(${MAX_VINES}), property/6.0)).a;
      }

      float jitter(float mixAmount) {
        float amount = 0.0;
        float offset = getProperty(index, SEED);
        float scale = 1.0;
        for (int power = 0; power < 5; power++) {
          amount += sin((offset + mixAmount) * scale) / scale;
          scale *= 2.0;
        }

        amount *= 0.1;

        // ramp down to 0 at 0 and 1
        amount *= -4.0 * mixAmount * (mixAmount - 1.0);

        return amount;
      }

      vec2 getPosition(float mixAmount) {
        vec2 pointA = texture2D(people, vec2(
          getProperty(index, POINT_A) / 17.0,
          getProperty(index, PERSON) / float(${MAX_PEOPLE})
        )).xy;
        vec2 pointB = texture2D(people, vec2(
          getProperty(index, POINT_B) / 17.0,
          getProperty(index, PERSON) / float(${MAX_PEOPLE})
        )).xy;

        vec2 direction = normalize(pointB - pointA);
        vec2 normal = vec2(direction.y, -direction.x);

        return mix(pointA, pointB, mixAmount) + jitter(mixAmount) * normal;
      }

      void main() {
        if (getProperty(index, USED) == 0.0 || getProperty(index, LIFE) < segment) {
          used = 0.0;
          gl_Position = vec4(0.0, 0.0, 1.0, 1.0);
          return;
        }

        used = 1.0;

        vec2 position = getPosition(segment);
        vec2 otherPosition;
        if (segment < 1.0) {
          otherPosition = getPosition(min(1.0, segment + 0.01));
        } else {
          otherPosition = getPosition(max(0.0, segment - 0.01));
        }
        vec2 slope = normalize(position - otherPosition);
        vec2 normal = vec2(slope.y, -slope.x);

        gl_Position = vec4(
          position + side * 0.01 * normal,
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
      index: range(MAX_VINES * SEGMENTS_PER_VINE * 2).map((i) =>
        Math.floor(i/(SEGMENTS_PER_VINE * 2))),
      segment: range(MAX_VINES * SEGMENTS_PER_VINE * 2).map((i) =>
        (Math.floor(i/2) % SEGMENTS_PER_VINE) / (SEGMENTS_PER_VINE - 1)),
      side: range(MAX_VINES * SEGMENTS_PER_VINE * 2).map((i) => (i % 2 === 0 ? -1 : 1))
    },

    elements: flatMap(range(MAX_VINES), (vine) =>
        flatMap(range(SEGMENTS_PER_VINE - 2), (i) => [
            vine * SEGMENTS_PER_VINE + i,
            vine * SEGMENTS_PER_VINE + i + 1,
            vine * SEGMENTS_PER_VINE + i + 2,
            vine * SEGMENTS_PER_VINE + i,
            vine * SEGMENTS_PER_VINE + i + 2,
            vine * SEGMENTS_PER_VINE + i + 3
        ])),

    uniforms: {
      vineState: regl.prop('vineState'),
      people: regl.prop('people'),
    },

    lineWidth: 1,

    primitive: 'triangles',
  });
}
