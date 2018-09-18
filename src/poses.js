import { MAX_PEOPLE } from './commands/flowers';

import { flatMap } from 'lodash';

const padArray = (array) => {
  while (array.length < MAX_PEOPLE * 17 * 3) {
    array.push(0);
  }

  while (array.length > MAX_PEOPLE * 17 * 3) {
    array.pop();
  }

  return array;
}

export class PoseManager {
  static textureProps = {
    width: 17,
    height: MAX_PEOPLE,
    channels: 3,
    format: 'rgb',
    type: 'float'
  };

  constructor(regl, minPoseConfidence) {
    this.regl = regl;
    this.texture = regl.texture(PoseManager.textureProps);
    this.minPoseConfidence = minPoseConfidence;
  }

  update(data) {
    this.texture({
      ...PoseManager.textureProps,
      data: padArray(flatMap(data, (person) =>
        person.score >= this.minPoseConfidence ?
          flatMap(person.keypoints, (point) => [
            point.position.x / window.innerWidth * 2 - 1,
            (1 - point.position.y / window.innerHeight) * 2 - 1,
            0
          ])
          :
          []
        ))
    });
  }

  getTexture() {
    return this.texture;
  }
}
