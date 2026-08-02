import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const { glitchDiceCountForLevel } = await server.ssrLoadModule("/src/lib/matrixGlitch.js");
  const { buildSharkBiteQueueForAvailability } = await server.ssrLoadModule(
    "/src/lib/blueGelPowerVideo.js"
  );

  const expectedMatrixCounts = [1, 2, 2, 3, 3, 4, 4, 5, 5, 6];
  const actualMatrixCounts = expectedMatrixCounts.map((_, index) =>
    glitchDiceCountForLevel(index + 1)
  );
  assert(
    actualMatrixCounts.every((count, index) => count === expectedMatrixCounts[index]),
    `Matrix level scaling changed: ${actualMatrixCounts.join(", ")}`
  );

  const shippedQueue = buildSharkBiteQueueForAvailability(false, false);
  assert(shippedQueue.length === 2, "shipped Shark Bite must have two beats");
  assert(
    shippedQueue[0].syncChomp && shippedQueue[0].presentationSlot === "chomp",
    "first Shark Bite beat must be the sideways dice-eating chomp"
  );
  assert(
    !shippedQueue[1].syncChomp &&
      shippedQueue[1].presentationSlot === "intro" &&
      shippedQueue[1].source === "catalog",
    "second Shark Bite beat must be the forward screen swallow"
  );

  const uploadedQueue = buildSharkBiteQueueForAvailability(true, true);
  assert(
    uploadedQueue[0].id === "chomp" && uploadedQueue[1].id === "forward",
    "uploaded Shark Bite clips must play chomp before forward approach"
  );

  console.log(`Matrix levels 1–10: ${actualMatrixCounts.join(", ")}`);
  console.log(
    `Shark Bite beats: ${shippedQueue.map((beat) => `${beat.id}:${beat.presentationSlot}`).join(" → ")}`
  );
} finally {
  await server.close();
}
