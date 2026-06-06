// Detects skins with similar base names and assigns each duplicate group a color.
// Returns: { [skinId]: { color, label } }

const GROUP_COLORS = [
  { bg: "bg-pink-500", text: "text-white" },
  { bg: "bg-cyan-500", text: "text-black" },
  { bg: "bg-lime-400", text: "text-black" },
  { bg: "bg-orange-500", text: "text-white" },
  { bg: "bg-fuchsia-500", text: "text-white" },
  { bg: "bg-yellow-400", text: "text-black" },
  { bg: "bg-red-500", text: "text-white" },
  { bg: "bg-emerald-400", text: "text-black" },
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-purple-500", text: "text-white" },
];

function baseKey(name) {
  return name
    .toLowerCase()
    .replace(/\b(polished|faceted|glow|ice|plush|v2|loop|cut|light|pearl|crackle)\b/g, "")
    .replace(/[^a-z]/g, "")
    .trim();
}

export function getDuplicateGroups(skins) {
  const buckets = {};
  for (const s of skins) {
    const k = baseKey(s.name);
    if (!k) continue;
    (buckets[k] ||= []).push(s);
  }
  const result = {};
  let colorIdx = 0;
  for (const k of Object.keys(buckets)) {
    const group = buckets[k];
    if (group.length < 2) continue;
    const color = GROUP_COLORS[colorIdx % GROUP_COLORS.length];
    colorIdx++;
    for (const s of group) {
      result[s.id] = { ...color, label: k.toUpperCase() };
    }
  }
  return result;
}