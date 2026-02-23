// @ts-check

const NUM_PLANETS = 4;
const MAX_MASS = 10;
const MIN_MASS = 9;
const MAX_RADIUS = 0.1;
const G = 0.005; // handpicked to look decent

let planets = Array.from({ length: NUM_PLANETS }, () => {
  return {
    mass: MIN_MASS + Math.random() * (MAX_MASS - MIN_MASS),
    radius: Math.random() * MAX_RADIUS,
    position: { x: Math.random(), y: Math.random(), z: Math.random() },
    velocity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },
  };
});

/**
 *
 * @param {Number} delta
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} screen_width
 * @param {Number} screen_height
 */
function renderPlanets(delta, ctx, screen_width, screen_height) {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const light = { x: 0.5, y: 0.5, z: 0.5 };
  ctx.clearRect(0, 0, screen_width, screen_height);
  for (let i = 0; i < planets.length; i++) {
    let p = planets[i];
    ctx.strokeStyle = isDarkMode ? "white" : "black";
    ctx.beginPath();
    ctx.arc(
      p.position.x * screen_width,
      p.position.y * screen_height,
      // for now, make it a function of mass
      // looks a lot better
      Math.max(2 * p.mass * p.position.z, 1),
      0,
      2 * Math.PI,
    );
    ctx.stroke();
  }
  for (let i = 0; i < planets.length; i++) {
    planets[i].acceleration = { x: 0, y: 0, z: 0 };
  }
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let p1 = planets[i];
      let p2 = planets[j];
      const dx = p2.position.x - p1.position.x;
      const dy = p2.position.y - p1.position.y;
      const dz = p2.position.z - p1.position.z;

      const distanceSquared = dx * dx + dy * dy + dz * dz + 0.01;
      const distance = Math.sqrt(distanceSquared);

      if (distance === 0) return;

      const forceMagnitude = (G * p1.mass * p2.mass) / distanceSquared;

      // 1 on 2
      const fx = forceMagnitude * (dx / distance);
      const fy = forceMagnitude * (dy / distance);
      const fz = forceMagnitude * (dz / distance);

      p1.acceleration.x += fx / p1.mass;
      p1.acceleration.y += fy / p1.mass;
      p1.acceleration.z += fz / p1.mass;

      p2.acceleration.x -= fx / p2.mass;
      p2.acceleration.y -= fy / p2.mass;
      p2.acceleration.z -= fz / p2.mass;
    }
  }
  let totalX = 0,
    totalY = 0,
    totalZ = 0;
  for (let i = 0; i < planets.length; i++) {
    planets[i].velocity.x += planets[i].acceleration.x * delta;
    planets[i].velocity.y += planets[i].acceleration.y * delta;
    planets[i].velocity.z += planets[i].acceleration.z * delta;

    planets[i].position.x += planets[i].velocity.x * delta;
    planets[i].position.y += planets[i].velocity.y * delta;
    planets[i].position.z += planets[i].velocity.z * delta;
    totalX += planets[i].position.x;
    totalY += planets[i].position.y;
    totalZ += planets[i].position.z;
  }
  let center_dx = 0.5 - totalX / planets.length;
  let center_dy = 0.5 - totalY / planets.length;
  let center_dz = 0.5 - totalZ / planets.length;

  for (let i = 0; i < planets.length; i++) {
    planets[i].position.x += center_dx;
    planets[i].position.y += center_dy;
    planets[i].position.z += center_dz;
  }
}

const physicsCanvas = document.getElementById("physics-canvas");
if (physicsCanvas instanceof HTMLCanvasElement) {
  const ctx = physicsCanvas.getContext("2d");
  if (ctx) {
    const deltaMs = 1000 / 60;
    setInterval(
      () =>
        renderPlanets(
          deltaMs / 1000,
          ctx,
          physicsCanvas.width,
          physicsCanvas.height,
        ),
      deltaMs,
    );
  }
}

const numBodiesInput = document.getElementById("num-bodies");
const resetButton = document.getElementById("reset-physics");
if (
  resetButton instanceof HTMLButtonElement &&
  numBodiesInput instanceof HTMLInputElement
) {
  resetButton.addEventListener("click", () => {
    let value = numBodiesInput.value;
    let num = Number(value);
    let numPlanets = NUM_PLANETS;
    if (value !== "" && !Number.isNaN(num)) numPlanets = num;
    planets = Array.from({ length: numPlanets }, () => {
      return {
        mass: MIN_MASS + Math.random() * (MAX_MASS - MIN_MASS),
        radius: Math.random() * MAX_RADIUS,
        position: { x: Math.random(), y: Math.random(), z: Math.random() },
        velocity: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
      };
    });
  });
}
