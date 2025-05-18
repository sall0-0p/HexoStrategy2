/*  hexGenerator.js
    ----------------------------------------------------------
    Generates:
      • nations.json – static nation definitions
      • hexes.json   –  hex map with organic borders + water
    ----------------------------------------------------------
    Axial coordinates (q, r) are used.  The algorithm:

    1.  Pseudo-noise → marks hexes as land or water.
    2.  Random land hexes become “seeds” for each nation.
    3.  Breadth-first expansion lets nations grow until
        every land hex is owned, producing contiguous blobs.
    4.  Water hexes keep owner = undefined.
*/

const fs = require('fs');

/* ----------  CONFIGURABLE PARAMETERS  ---------- */

const GRID_W = 60;            // q-axis size
const GRID_H = 30;            // r-axis size
const WATER_RATIO = 0.1;     // 0-1, higher ⇒ more water
const NATIONS = {
  // PNL: { name: 'Ponylandia', color: [30, 180, 180] },
  // BRD: { name: 'Birdlands',  color: [30, 180,  30] },
  FNG: { name: 'Fungaria',   color: [180, 90,  30] },
  // AQT: { name: 'Aquatopia',  color: [ 30,  90, 180] }
};
/* ----------------------------------------------- */


/* ----------  DETERMINISTIC PSEUDO-NOISE  --------
   Cheap hash → float in [0,1).  Tweaked for hex coords.
-------------------------------------------------- */
function noise(q, r, seed = 1337) {
  let n = q * 374761 + r * 668265 + seed * 982451;
  n = (n << 13) ^ n;
  return Math.abs(
    1.0 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0
  );
}

/* ----------  NEIGHBOUR OFFSETS (axial)  -------- */
const NEIGHBOURS = [
  [+1,  0], [+1, -1], [ 0, -1],
  [-1,  0], [-1, +1], [ 0, +1]
];

/* ----------  BUILD GRID + WATER MASK  ---------- */
const hexes = {};
for (let r = 1; r <= GRID_H; r++) {
  for (let q = 1; q <= GRID_W; q++) {
    const id = `H${((r - 1) * GRID_W + q).toString().padStart(3, '0')}`;
    const isWater = noise(q, r) < WATER_RATIO;
    hexes[id] = {
      name: `Hex_${id}`,
      q,
      r,
      hexType: isWater ? 'water' : 'hex',
      owner: undefined               // filled later for land
    };
  }
}

/* ----------  PICK SEEDS ON LAND  --------------- */
function randomLandHex() {
  const landIDs = Object.keys(hexes).filter(id => hexes[id].hexType === 'hex' && !hexes[id].owner);
  return landIDs[Math.floor(Math.random() * landIDs.length)];
}

const nationQueues = {};
for (const code of Object.keys(NATIONS)) {
  const seedID = randomLandHex();
  hexes[seedID].owner = code;
  nationQueues[code] = [seedID];
}

/* ----------  EXPAND NATIONS  ------------------- */
let unclaimedLand = Object.values(hexes).filter(h => h.hexType === 'hex' && !h.owner).length;

while (unclaimedLand > 0) {
  for (const code of Object.keys(NATIONS)) {
    const queue = nationQueues[code];
    if (!queue.length) continue;
    const currentID = queue.shift();
    const { q, r } = hexes[currentID];
    for (const [dq, dr] of NEIGHBOURS) {
      const nq = q + dq, nr = r + dr;
      if (nq < 1 || nq > GRID_W || nr < 1 || nr > GRID_H) continue;
      const nid = `H${((nr - 1) * GRID_W + nq).toString().padStart(3, '0')}`;
      const target = hexes[nid];
      if (target.hexType === 'hex' && !target.owner) {
        target.owner = code;
        queue.push(nid);
        unclaimedLand--;
      }
    }
  }
}

/* ----------  OUTPUT FILES  --------------------- */
// fs.writeFileSync('nations.json', JSON.stringify(NATIONS, null, 2));
fs.writeFileSync('hexes.json',   JSON.stringify(hexes,   null, 2));

console.log('Generated nations.json and hexes.json');
