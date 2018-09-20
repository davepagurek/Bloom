export const jitter = `
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
`;
