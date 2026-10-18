# Ten Thousand: The Final Boss — Design Roadmap

*Captured from design session, October 17, 2026. Check items off as you build them. Order matters — dependencies are noted.*

---

## Phase 1: Foundation — Power System Taxonomy

- [ ] **Define five verb families** (no new code, just a design doc in `docs/`):
  - **Control** — ice, fire, wind (change what opponent's dice do)
  - **Defense** — earth block, Ragnarok immunity (stop something from landing)
  - **Deception** — ghost, x-ray, Matrix (hide or reveal truth)
  - **Erase** — shark (voids a roll outright, once-per-trigger nuke)
  - **Chain** — orca (only fires after another ocean power already went off)
- [ ] **Build the matchup grid**: every skin as row and column, W / L / N cells. Ice W vs normal, L vs fire, N vs wind. Fire W vs ice, L vs Ragnarok. Ragnarok W vs ice and fire. Earth block W vs one incoming power then spent. Ghost W vs everything except Ragnarok. X-ray W vs ghost below level 10, L vs level 10. Shark W vs all (single exception, justified as nuke not passive).
- [ ] **Matrix slots under Deception** — falling numbers and "your time is now" are perception/control, not dice-changing.

## Phase 2: Skin Lanes — Classic vs Power

- [ ] **Add a `lane` property** to each skin: `classic` or `power`. Filter shop and matchmaking by it. Two lanes never mix mid-game.
- [ ] **Classic lane**: gemstones (labradorite etc.), bug zapper, tornado, audio-reactive, battery-life, cut lines, raining — visual-only, zero verbs, zero counters. Dice face only, no portrait loop, no background animation, no power video. Low-maintenance catalog.
- [ ] **Power lane**: ice, fire, wind, earth, Ragnarok, ghost, x-ray, shark, orca, Matrix — each locked to a verb and a level curve.
- [ ] **Ocean category visual language**: shark, fish tank, orca share water theme across dice, portrait, background, power video. Scuba diver portrait with rising bubbles loop. Orca video swimming across screen = payoff beat for the chain.
- [ ] **Fix the broken shark bite video** before showing anyone — bite-across-screen is the best hook in the power lane.
- [ ] **Tag each skin with rarity**: Common = one verb. Rare = verb + passive. Legendary = verb + passive + once-per-match ultimate.
- [ ] **Group by verb first, rarity second** in the shop so players always know what they're buying.

## Phase 3: Power Mechanics — Duration, Thaw, Stacking

- [ ] **Split powers into two buckets**:
  - Instant: shark, x-ray — fire and die in one beat.
  - Persistent: ice, fire, wind — last until target busts or rolls their break combo.
- [ ] **Break combos per verb**: Ice thaws on three-of-a-kind. Fire goes out on a straight. Wind scatters on a full house. Each verb gets one specific key.
- [ ] **Thaw is a search problem, not a dice event**: frozen player clicks dice one at a time to find the key. Level 5 lets them click two at a time. Level 10 forces single clicks with a shorter probe window.
- [ ] **Ice level curve**:
  - Level 1: freezes 2 dice, one round, numbers hidden.
  - Level 5: freezes 4 dice, locks power slot.
  - Level 10: freezes all 6, locks slot, single-click probe with timer. Dice still roll — just blind. No skip-your-turn punishment.
- [ ] **Frozen dice still roll and still trigger hot dice** — you bank the power but can't spend it while frozen (level 5+ locks the slot). Loaded gun in a cage.
- [ ] **Busting does NOT lose a saved power** — bust resets score only, power carries over. Keeps hands closed, keeps the game tense.
- [ ] **One power per hot-dice trigger, no doubling**. Two hot rolls in a row = two separate uses. Avoids the shark bug class.
- [ ] **Same-skin matchups are symmetric, not neutral-disabled**: fire vs fire both freeze each other. Power fires fine, nobody gains an edge, whoever times better wins.
- [ ] **Ice blocks power use while active** (level 5+). Early ice = scoring tax. Late ice = full lockdown.
- [ ] **Simultaneous powers**: resolve in roll order. True tie = higher skin level wins. Deterministic, no new system.
- [ ] **Defense = one verb only: block**. After opponent's roll resolves, spend block to negate their just-triggered power. No mid-roll intervention, no reflect, no counter-strike, no absorb-and-store. One clean hook.
- [ ] **Hook all power resolution to animation-complete event**, not roll-triggered event. Fixes shark firing at wrong time / wrong target.

## Phase 4: Ghost — The Deception Crown

- [ ] **Ghost is deception, not a verb** — sits above the element loop. Attacks information, not mechanics.
- [ ] **Level curve**:
  - Level 0: slightly transparent, no real effect. Looks like a gimmick.
  - Level 5: fakes one common skin convincingly.
  - Level 10: completely invisible to opponent. Can impersonate anything short of Ragnarok. Retains access to any character's power moves while invisible.
- [ ] **Ghost can switch skins mid-match** — cycle through the roster seamlessly at level 10. Opponent can't track which one you're wearing.
- [ ] **Lower levels show pips** — gives opponent something to read while hiding truth. Creepier than total blindness.
- [ ] **Ghost vs Ghost**: mirror cancels, real dice land. Ghost 2 = rarest skin, the anti-bluff. If you act like the toughest guy and the other is Ghost 2, they get the toughest guy's power. Act weak → they get weak.
- [ ] **Ghost cannot fake Ragnarok** (or copies look but not power — freeze still lands). Keeps counter-grid intact.

## Phase 5: X-Ray — The Consumable

- [ ] **X-ray is a consumable, not a skin**. One use, gone. Spend during a match.
- [ ] **When burned**: every die on the table flashes true skin for a beat, including yours if you're ghosting. Punishes careless use.
- [ ] **Fails against level-10 ghost** — creates the one skin with no counter. Burning it on a maxed ghost and seeing nothing = you paid to confirm the bluff is real.
- [ ] **Earn paths**: GQs (~800 each), rare mystery-box drop. NOT awarded for perfect 10,000 or tutorial completion — too rare for something this situational. A hot-dice opener already leaks identity; x-ray earns its keep when the table goes quiet and everyone's playing cagey.
- [ ] **Noticing someone skip power after hot dice tells you nothing** — most players bank on purpose. Silence is the default.

## Phase 6: Story Mode — The Counter Chain

- [ ] **Each boss fight is a live tutorial**: you open against the skin that hard-counters yours. Ice meets fire. Fire meets Ragnarok. First fight unwinnable on power alone → forces base Farkle math before the verb helps.
- [ ] **One win per boss** (not 2-of-3, not 10). Ten matches per stage kills momentum.
- [ ] **Bet mechanic at match start**: best two out of three. You win → you get their dice. They win → you must use prison dice for the next fight.
- [ ] **Loadout screen**: only dice you've won are available in story mode. Switch option exists but everything else in your bag also loses to the next boss. Only real move = win without the verb.
- [ ] **Beating a boss auto-equips their dice** for the next fight.
- [ ] **Story mode skins auto power-10** (showcase). Online skins start at 0.
- [ ] **Prison dice never offered as a voluntary option in story mode** — only forced by losing to the GQ boss three times. Involuntary entry = discovered, not selected.
- [ ] **Early bosses trash-talk prison dice** ("Those aren't dice, those belong in a toilet somewhere") and kick your ass with them. Teaches that prison dice are weak. Final boss reveal lands harder because of the contrast.
- [ ] **Rare prison-dice win against an early boss counts** — makes player feel lucky, not smart. Luck doesn't transfer. Door stays cracked.
- [ ] **GQ boss line (clean, no toilet humor)**: "Those aren't dice. Those belong in a toilet somewhere."
- [ ] **Prison-entry screen hint**: "The king flushes gold. Toilet paper ends the game." Small, easy to miss. Points anger somewhere useful instead of at your rating.
- [ ] **GQ boss AI**: greedy script — always max-risk, always chases 10,000, ignores busting. Against toilet paper this becomes overextension. ~30% bust rate (not auto-bust — feels winnable, not rigged). Normal dice: he never busts. That gap is the lesson.
- [ ] **No desperation mode** that switches him conservative. If it exists, it only makes him greedier.
- [ ] **Prison dice = regular rolls, no powers, no hot-dice desire** (no reason to roll all six except to roll again). Player banks small scores. Boss chases big ones and busts. Slow win.
- [ ] **Beating GQ with prison dice = automatic win** once you realize it. Easiest game you've played — you just have to actually roll 10,000, however long that takes.
- [ ] **Final boss skin, perfect-10,000 skin, custom skins**: NOT in mystery-box rotation. Earned through play only.
- [ ] **Story-mode completion dice and 10,000 dice**: straight rewards, milestones, not the crown. Crown stays behind the prison door.

## Phase 7: Prison Dice — The Filter

- [ ] **Toilet-paper visual**: dice look made of toilet paper. Description says so.
- [ ] **No power, no levels**. Pure arithmetic. The original game resurrected as a weapon.
- [ ] **Thaw/probe mechanic**: click dice one at a time to find scoring combos. Burns turns hunting for pairs.
- [ ] **Three-match timer** against early bosses: extra-aggressive bosses, harder trash talk, clunky feel. Not unwinnable — miserable. Player thinks "why did I pick these" and switches back when timer clears.
- [ ] **Start with Classic dice**. Prison dice only appear as punishment for losing to GQ three times.

## Phase 8: Economy — GQs vs Cash

- [ ] **Two currencies, clean split**:
  - **GQs**: in-game, earned from matches. Buy Classic skins (tiered prices — cheap stones bottom, AI-made ones like bug zapper/audio higher), felts, coin boosts.
  - **Real cash**: mystery boxes ONLY, bought on domain landing page (not in-app — avoids Apple's 30%). Landing page ties purchase to account via token, drops box straight into app.
- [ ] **Power skins: NOT purchasable at level 5 or 10**. Everything starts at 1. Basic power set available to anyone at level 0. Special power skins (no levels, auto-topped-out) come from mystery boxes as rare drops — but boxes never promise a verb, just a picture. Floor on expensive box = real level-1 power skin (fire or wind), rare pull = mid-tier or passive skin.
- [ ] **Block special/box power skins in story mode** — preview in sandbox/shop only. Story fights locked to earned chain.
- [ ] **Rotating featured skin**: one legendary visual in box pool with boosted drop rate for 1–2 weeks, then swaps. Urgency without guaranteed pull.
- [ ] **No $20 direct purchase for one specific skin** — kills box economy.

## Phase 9: XP and Leveling

- [ ] **XP curve** (total ~17,600 to max one skin ≈ 250 matches at 50 XP win / 10 XP loss):
  - L2: 100 | L3: 300 | L4: 600 | L5: 1,000 | L6: 1,500 | L7: 2,200 | L8: 3,000 | L9: 4,000 | L10: 5,500
- [ ] **XP from online matches only** — no story mode, no offline farming. Populates the queues you're trying to fill.
- [ ] **Each skin levels independently** (Pokemon-style: pick skin type, play online, feed it XP).
- [ ] **Per-level ice/fire/etc. visual variants**: you'll hand-tune each of the 10 freeze intensities. Tedious but doable — one at a time.

## Phase 10: Online Modes

- [ ] **Two queues**:
  - **Async (friends)**: roll your turn, it waits in queue, they roll when back. Cap each async turn at one roll or one bank action — not a full round. Keeps pace snappy across a day-long match.
  - **Live (random)**: whoever's in the lobby now.
- [ ] **Async solves early population**: five people online can still play across hours. "Waiting on opponent" spinner feels normal, not dead.
- [ ] **Visibility rules**: show opponent's skin and frost/power animations. Hide dice values and probe clicks. Information layer stays private or ghost/x-ray mean nothing.
- [ ] **Offline pass-the-phone**: fine as-is. Local, no sync issues, teaches before online.

## Phase 11: Polish and Assets

- [ ] **Felt graphics** — the biggest visual gap. Invest here.
- [ ] **GQ character assets**: money-gun portrait loop, falling-money background, "GQ guy" as playable boss.
- [ ] **Per-character story intros**: Matrix waterfall numbers, aquarium scuba diver, etc. Template-ish layout (same structure, swap footage) going forward even though you're past retrofitting.
- [ ] **Delete tmp-*.png files** from repo root (tmp-die-bad-offsets, tmp-die-empty-url, tmp-die-power, tmp-die-webkit, tmp-tray-fixed) — debug artifacts, not shipping assets.
- [ ] **Clean up artifacts/** — keep verify reports, archive old shop/sprite labs.

## Phase 12: Ship Order (suggested)

1. Fix shark bite video + hook power resolution to animation-complete.
2. Lane property + Classic/Power split in shop.
3. Ice level curve + thaw probe mechanic (the hardest single system).
4. Ghost level curve + mid-match skin switching.
5. X-ray consumable + level-10 immunity.
6. Story mode counter-chain + bet mechanic + prison dice.
7. GQ boss greedy AI + prison exploit.
8. Mystery boxes + landing page + GQ currency.
9. XP curve + online async/live queues.
10. Felts + final asset pass.

---

*Every checkbox above came out of this conversation. Nothing invented after the fact. When in doubt, the conversation transcript is the spec.*