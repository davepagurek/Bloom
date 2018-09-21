import { MAX_PEOPLE } from './commands/flowers';

import { flatMap, minBy, range } from 'lodash';

const padArray = (array) => {
  while (array.length < MAX_PEOPLE * 17 * 3) {
    array.push(0);
  }

  while (array.length > MAX_PEOPLE * 17 * 3) {
    array.pop();
  }

  return array;
}

export const NOSE = 0;
export const LEFT_EYE = 1;
export const RIGHT_EYE = 2;
export const LEFT_EAR = 3;
export const RIGHT_EAR = 4;
export const LEFT_SHOULDER = 5;
export const RIGHT_SHOULDER = 6;
export const LEFT_ELBOW = 7;
export const RIGHT_ELBOW = 8;
export const LEFT_WRIST = 9;
export const RIGHT_WRIST = 10;
export const LEFT_HIP = 11;
export const RIGHT_HIP = 12;
export const LEFT_KNEE = 13;
export const RIGHT_KNEE = 14;
export const LEFT_ANKLE = 15;
export const RIGHT_ANKLE = 16;

export class PoseManager {
  static textureProps = {
    width: 17,
    height: MAX_PEOPLE,
    channels: 3,
    format: 'rgb',
    type: 'float'
  };

  people = range(MAX_PEOPLE).map(() => null);

  constructor(regl, minPoseConfidence) {
    this.regl = regl;
    this.texture = regl.texture(PoseManager.textureProps);
    this.minPoseConfidence = minPoseConfidence;
  }

  update(data, callback) {
    this.people.forEach((person) => {
      if (person !== null) {
        person.age++;
      }
    });

    const newPeople = [];
    const removedPeople = [];

    data.forEach((person) => {
      if (person.score < this.minPoseConfidence) {
        return;
      }

      let prevPerson = null;
      let minDistance = Infinity;
      this.people.filter((other) => other !== null && other.age > 0).forEach((other) => {
        const dx = other.keypoints[NOSE].position.x - person.keypoints[NOSE].position.x;
        const dy = other.keypoints[NOSE].position.y - person.keypoints[NOSE].position.y;
        const distance = dx*dx + dy*dy;

        if (distance < minDistance) {
          minDistance = distance;
          prevPerson = other;
        }
      });

      if (prevPerson !== null) {
        prevPerson.keypoints = person.keypoints;
        prevPerson.age = 0;
      } else {
        // Find first empty slot
        let newIndex = 0;
        while (newIndex < this.people.length && this.people[newIndex]) newIndex++;

        if (newIndex < this.people.length) {
          newPeople.push(newIndex);
          this.people[newIndex] = { ...person, age: 0 };
        }
      }
    });

    this.people.forEach((person, i) => {
      if (person !== null && person.age > 3) {
        this.people[i] = null;
        removedPeople.push(i);
      }
    });

    this.texture({
      ...PoseManager.textureProps,
      data: flatMap(this.people, (person) =>
        person === null ?
          range(17 * 3).map(() => 0) :
          flatMap(person.keypoints, (point) => [
            point.position.x / window.innerWidth * 2 - 1,
            (1 - point.position.y / window.innerHeight) * 2 - 1,
            0
          ])
        )
    });

    callback(newPeople, removedPeople);
  }

  getTexture() {
    return this.texture;
  }
}
