# Ten Thousand — To-Do List

*Built from the Oct 17 design session. Check items off as you finish them. Open questions stay open until you decide.*

---

## Priority 1 — Fix what's broken

- [ ] Fix shark bite video (bite-across-screen is the best power-lane hook)
- [ ] Hook all power resolution to animation-complete event (not roll-triggered) — stops shark firing at wrong time/target
- [ ] Delete tmp-*.png files from repo root (tmp-die-bad-offsets, tmp-die-empty-url, tmp-die-power, tmp-die-webkit, tmp-tray-fixed)
- [ ] Clean up artifacts/ — keep verify reports, archive old shop/sprite labs

---

## Priority 2 — Core structure

- [ ] Add `lane` property to every skin: `classic` or `power`
- [ ] Filter shop and matchmaking by lane (two lanes never mix mid-game)
- [ ] Classic lane skins: gemstones, bug zapper, tornado, audio-reactive, battery-life, cut lines, raining — visual only, zero verbs
- [ ] Power lane skins: ice, fire, wind, earth, Ragnarok, ghost, shark, orca, Matrix — each locked to a verb
- [ ] Ocean visual language: shark, fish tank, orca share water theme across dice/portrait/background/power video
- [ ] Scuba diver portrait with rising-bubbles loop for ocean skins

---

## Priority 3 — Power mechanics

- [ ] Ice level curve:
  - L1: freeze 2 dice, 1 round, numbers hidden
  - L5: freeze 4 dice, lock power slot
  - L10: freeze all 6, lock slot, single-click probe with timer
- [ ] Frozen dice still roll and still trigger hot dice (bank power, can't spend at L5+)
- [ ] Bust does NOT clear a saved power
- [ ] One power per hot-dice trigger (no doubling)
- [ ] Same-skin matchups stay symmetric (fire vs fire both work)
- [ ] Simultaneous powers: resolve in roll order, higher level wins ties
- [ ] Defense = one verb only: block (reactive, after roll resolves — no mid-roll intervention)
- [ ] **Open:** how long do persistent powers last? (bust / timer / combo — undecided, no break-combo assumed)
- [ ] **Open:** thaw as search problem? (click dice one at a time to find scoring combos)

---

## Priority 4 — Ghost & X-Ray

- [ ] Ghost level curve:
  - L0: slightly transparent, no real effect
  - L5: fakes one common skin convincingly
  - L10: fully invisible, mid-match skin switching, keeps power access
- [ ] Ghost cannot fake Ragnarok (or copies look but not power)
- [ ] Ghost vs Ghost: mirror cancels, real dice land
- [ ] X-ray is a consumable (one use, gone)
- [ ] X-ray flashes every true skin for one beat (including yours if ghosting)
- [ ] X-ray fails against level-10 ghost
- [ ] X-ray earn path: cheap GQs (~200) as main, rare box drop as secondary
- [ ] **Open:** is x-ray strong enough to matter given hot-dice openers leak identity?

---

## Priority 5 — Story Mode

- [ ] Each boss hard-counters your current skin (first fight unwinnable on power alone)
- [ ] One win per boss (or 2-of-3 — decide)
- [ ] Bet at match start: win → get their dice; lose → prison dice next fight
- [ ] Loadout screen: only won dice available in story mode
- [ ] Beating a boss auto-equips their dice for next fight
- [ ] Story skins auto power-10; online skins start at 0
- [ ] Prison dice only forced by losing to GQ boss 3 times (never voluntary)
- [ ] GQ boss AI: greedy, always max-risk, ~30% bust rate vs prison dice
- [ ] GQ boss line: "Those aren't dice. Those belong in a toilet somewhere."
- [ ] Prison-entry hint: "The king flushes gold. Toilet paper ends the game."
- [ ] Early bosses trash-talk prison dice and kick your ass with them
- [ ] Final boss skin + perfect-10,000 skin: earned through play only, never in boxes

---

## Priority 6 — Prison Dice

- [ ] Toilet-paper visual + description
- [ ] No power, no levels — pure Farkle math
- [ ] 3-match timer vs early bosses (miserable, not unwinnable)
- [ ] **Open:** any thaw/probe mechanic on prison dice, or plain rolls only?

---

## Priority 7 — Economy

- [ ] Two currencies:
  - GQs (in-game) → Classic skins, felts, coin boosts
  - Cash (landing page only, not in-app) → mystery boxes
- [ ] Power skins NOT purchasable at L5/L10 — everything starts at L1
- [ ] Mystery box tiers:
  - Cheap (~50 coins): always returns coins + Classic skin or felt
  - Mid: more return, mid-tier skin, small chance at low-power skin
  - Expensive: floor = L1 power skin; rare pull = mid-tier/passive OR custom (maxed, no levels)
- [ ] Customs only in expensive box as rarest pull, ship maxed
- [ ] Special box power skins blocked in story mode
- [ ] Rotating featured skin (boosted drop rate 1–2 weeks)
- [ ] No $20 direct purchase of a specific skin

---

## Priority 8 — XP & Online

- [ ] XP curve: L2:100 → L3:300 → L4:600 → L5:1k → L6:1.5k → L7:2.2k → L8:3k → L9:4k → L10:5.5k (~17.6k total)
- [ ] XP from online matches only (no story/offline farming)
- [ ] Each skin levels independently
- [ ] Per-level ice/fire visual variants (hand-tune each intensity)
- [ ] Async friend queue: one roll or one bank action per turn
- [ ] Live random queue
- [ ] Visibility: show opponent skin + power animations; hide dice values + probe clicks

---

## Priority 9 — Polish

- [ ] Felt graphics (biggest visual gap)
- [ ] GQ character assets: money-gun portrait loop, falling-money background
- [ ] Per-character story intros (Matrix waterfall, aquarium scuba, etc.)

---

## Suggested build order

1. Shark video + animation-complete hook
2. Lane property + Classic/Power split
3. Ice curve + thaw probe
4. Ghost curve + mid-match switching
5. X-ray consumable
6. Story mode counter-chain + prison dice
7. GQ boss AI
8. Mystery boxes + landing page + GQs
9. XP curve + online queues
10. Felts + final asset pass

---

*Full design notes live in `docs/ROADMAP.md`. This file is the checkbox board.*
