// @ts-check

const R_MAJ = 10
const R_MIN = 4

const SCREEN_HEIGHT = 30;
const SCREEN_WIDTH = 70;

const K1 = 2;
const K2 = 60;

/**
 * 
 * @param {HTMLPreElement} pre 
 */
function updateDonut(pre) {
  let points = [];
  let zbuffer = Array.from({ length: SCREEN_HEIGHT }, () =>
    Array(SCREEN_WIDTH).fill(-Infinity)
  );
  let A = Math.PI * 2 / 8000 * (Date.now() * 3 % 8000);
  let B = Math.PI * 2 / 8000 * (Date.now() % 8000);
  const NUM_POINTS_MAJOR = 90;
  const NUM_POINTS_MINOR = 20;
  const COS_A = Math.cos(A);
  const COS_B = Math.cos(B);
  const SIN_A = Math.sin(A);
  const SIN_B = Math.sin(B);

  for (let i = 0; i < NUM_POINTS_MAJOR; ++i) {
    const THETA = Math.PI * 2 / NUM_POINTS_MAJOR * i;
    const COS_THETA = Math.cos(THETA);
    const SIN_THETA = Math.sin(THETA);

    for (let j = 0; j < NUM_POINTS_MINOR; ++j) {
      const RHO = Math.PI * 2 / NUM_POINTS_MINOR * j;
      const COS_RHO = Math.cos(RHO);
      const SIN_RHO = Math.sin(RHO);
      const R_MAJ_PLUS_R_MIN_COS_RHO = R_MAJ + R_MIN * COS_RHO;

      const x = R_MAJ_PLUS_R_MIN_COS_RHO * (COS_B * COS_THETA + SIN_A * SIN_B * SIN_THETA) - R_MIN * COS_A * SIN_RHO;
      const y = R_MAJ_PLUS_R_MIN_COS_RHO * (COS_THETA * SIN_B - COS_B * SIN_A * SIN_THETA) + R_MIN * COS_A * COS_B * SIN_RHO;
      const z = COS_A * R_MAJ_PLUS_R_MIN_COS_RHO * SIN_THETA + R_MIN * SIN_A * SIN_RHO;
      const L = COS_THETA * COS_RHO * SIN_B - COS_A * COS_RHO * SIN_THETA - SIN_A * SIN_RHO + COS_B * (COS_A * SIN_RHO - COS_RHO * SIN_A * SIN_THETA);
      points.push({ x, y, z, L });
    }
  }
  let output = Array.from({ length: SCREEN_HEIGHT }, () => ' '.repeat(SCREEN_WIDTH));
  for (let point of points) {
    const scalar = K1 / (point.z + K2);
    const xp = Math.floor(point.x * scalar * SCREEN_WIDTH) + SCREEN_WIDTH / 2;
    const yp = Math.floor(point.y * scalar * SCREEN_HEIGHT) + SCREEN_HEIGHT / 2;
    const luminance_index = Math.floor((point.L + 1) * 6);
    const char = ".,-~:;=!*#$@"[
      Math.max(0, Math.min(11, luminance_index))
    ];
    if (yp >= 0 && yp < SCREEN_HEIGHT && xp >= 0 && xp < SCREEN_WIDTH) {
      if (scalar > zbuffer[yp][xp]) {
        zbuffer[yp][xp] = scalar;
        output[yp] =
          output[yp].substring(0, xp) +
          char +
          output[yp].substring(xp + 1);
      }
    }
  }
  pre.textContent = output.join("\n");
}

const pre = document.getElementById("donut");
if (pre instanceof HTMLPreElement) {
  setInterval(() => updateDonut(pre), 1000 / 60);
}