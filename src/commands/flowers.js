import { flatMap, range } from 'lodash';
import { jitter } from './utils';

export const MAX_PARTICLES = 500;
export const MAX_PEOPLE = 3;

export function generateFlowers(regl, flower) {
  return regl({
    vert: `
      precision mediump float;

      attribute float index;
      attribute vec2 offset;

      uniform sampler2D particleState;
      uniform sampler2D people;
      uniform float aspect;
      uniform float time;

      varying float used;
      varying vec2 textureCoord;
      varying float life;

      const float USED = 0.0;
      const float LIFE = 1.0;
      const float POINT_A = 2.0;
      const float POINT_B = 3.0;
      const float MIX = 4.0;
      const float PERSON = 5.0;
      const float SEED = 6.0;
      const float SCALE = 7.0;
      const float ROTATION = 8.0;

      float getProperty(float index, float property) {
        return texture2D(particleState, vec2(index/float(${MAX_PARTICLES}), property/9.0)).a;
      }

      ${jitter}

      vec2 getPosition() {
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

        float mixAmount = getProperty(index, MIX);
        return mix(pointA, pointB, mixAmount) + jitter(mixAmount) * normal;
      }

      vec2 getWindOffset(float t) {
        return vec2(
          pow(sin(t / 10000.0), 20.0) * (0.15*sin(t / 4000.0) + 0.05*sin(t / 300.0)),
          pow(sin(t / 9998.0), 20.0) * (0.15*sin(t / 4003.0) + 0.05*sin(t / 370.0))
        );
      }

      void main() {
        if (getProperty(index, USED) == 0.0) {
          used = 0.0;
          gl_Position = vec4(0.0, 0.0, 1.0, 1.0);
          textureCoord = vec2(0.0, 0.0);
          life = 0.0;
          return;
        }

        used = 1.0;
        textureCoord = offset;
        life = getProperty(index, LIFE);
        float scale = getProperty(index, SCALE);

        vec2 windOffset = getWindOffset(time + 1000.0 * scale);

        float angle = getProperty(index, ROTATION) + windOffset.x * 3.14;
        mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

        gl_Position = vec4(

          getPosition() +

            // Offset within the image
            (offset * -0.16 + 0.08) * rotation * vec2(1.0, aspect) * scale +

            // Offset from wind
            windOffset * vec2(1.0, aspect) * 0.1,

          0.5,
          1.0
        );
      }
    `,

    frag: `
      precision mediump float;

      uniform sampler2D flower;

      varying float used;
      varying vec2 textureCoord;
      varying float life;

      void main() {
        if (used == 0.0) {
          discard;
          return;
        }

        gl_FragColor = texture2D(
          flower,
          (textureCoord + vec2(0.0, life)) * vec2(1.0, 1.0/13.0)
        );

        if (gl_FragColor.a < 1.0) {
          discard;
        }
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
      particleState: regl.prop('particleState'),
      people: regl.prop('people'),
      flower: regl.texture({
        data: flower,
        min: 'linear',
        max: 'linear'
      }),
      aspect: (context) => context.viewportWidth/context.viewportHeight,
      time: regl.prop('time'),
    },

    primitive: 'triangles',

    count: MAX_PARTICLES * 6
  });
}
