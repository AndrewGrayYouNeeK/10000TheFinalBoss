# Ten Thousand: The Final Boss — Design Briefing

*Captured October 17, 2026. This is a reminder doc, not a mandate. Everything below is something to look at, decide on, and either build or skip. Nothing here is locked.*

---

## 1. Power System — Verb Families (suggestion)

Five families came up. Use them, merge them, or throw them out:

- **Control** — ice, fire, wind. Change what the opponent's dice do.
- **Defense** — earth block, Ragnarok immunity. Stop something from landing.
- **Deception** — ghost, x-ray, Matrix. Hide or reveal truth.
- **Erase** — shark. Voids a roll outright. Once-per-trigger nuke, no counter.
- **Chain** — orca. Only fires after another ocean power already went off.

**Option:** build a matchup grid (skin vs skin, W/L/N cells) to see the counter system on one page before coding any of it.

**Option:** Matrix slots under Deception — falling numbers and "your time is now" read as perception/control, not dice-changing. Could also stand alone.

---

## 2. Skin Lanes — Classic vs Power

- **Option:** add a `lane` property to each skin (`classic` or `power`) and filter shop/matchmaking by it. Two lanes never mix mid-game.
- **Classic lane:** gemstones (labradorite and others), bug zapper, tornado, audio-reactive, battery-life, cut lines, raining. Visual-only. Zero verbs, zero counters. Dice face only — no portrait loop, no background animation, no power video. Low-maintenance catalog for players who don't want powers.
- **Power lane:** ice, fire, wind, earth, Ragnarok, ghost, x-ray, shark, orca, Matrix. Each locked to a verb and a level curve.
- **Ocean category:** shark, fish tank, orca share a water visual language across dice, portrait, background, and power video. Scuba diver portrait with rising-bubbles loop. Orca video swimming across screen is the payoff beat for the chain.
- **Reminder:** fix the broken shark bite video before showing anyone. Bite-across-screen is the best hook in the power lane.
- **Option:** rarity tiers — Common = one verb, Rare = verb + passive, Legendary = verb + passive + once-per-match ultimate.
- **Option:** group shop by verb first, rarity second.

---

## 3. Power Mechanics — Duration, Thaw, Stacking

- **Option:** split powers into instant (shark, x-ray — fire and die in one beat) and persistent (ice, fire, wind — last longer than one roll).
- **Open question:** how long should persistent powers last? Until the target busts? Until they roll a specific combo? Until a timer? This is undecided — do not assume a break-combo system. That was a suggestion only. You might have no combo mechanic at all.
- **Option:** thaw as a search problem — frozen player clicks dice one at a time to find scoring combos. Burns turns hunting for pairs.
- **Ice level curve (as discussed):**
  - Level 1: freezes 2 dice, one round, numbers hidden.
  - Level 5: freezes 4 dice, locks power slot.
  - Level 10: freezes all 6, locks slot, single-click probe with timer. Dice still roll — just blind. No skip-your-turn punishment.
  - **Alternative discussed:** level 10 freezes score and dice so they can't roll and lose a turn — but that conflicts with "do something right to thaw," so it was left open.
- Frozen dice still roll and still trigger hot dice — you bank the power but can't spend it while frozen (level 5+ locks the slot). Loaded gun in a cage.
- **Option:** busting does NOT lose a saved power. Bust resets score only. Keeps hands closed.
- One power per hot-dice trigger, no doubling. Two hot rolls = two separate uses.
- **Same-skin matchups:** fire vs fire still works — symmetric, power fires fine, nobody gains an edge, whoever times better wins. Not disabled, not "neutral."
- Ice blocks power use while active (level 5+). Early ice = scoring tax. Late ice = full lockdown.
- **Simultaneous powers:** resolve in roll order. True tie = higher skin level wins.
- **Defense = one verb only: block.** After opponent's roll resolves, spend block to negate their just-triggered power. No mid-roll intervention (that causes the shark bugs), no reflect, no counter-strike, no absorb-and-store.
- **Reminder:** hook all power resolution to the animation-complete event, not the roll-triggered event. That's the suspected cause of shark firing at the wrong time or wrong target.

---

## 4. Ghost — The Deception Crown

- Ghost is deception, not a verb. Sits above the element loop. Attacks information, not mechanics.
- **Level curve as discussed:**
  - Level 0: slightly transparent, no real effect. Looks like a gimmick. "Why would anybody want this?"
  - Level 5: fakes one common skin convincingly.
  - Level 10: completely invisible to opponent. Can impersonate anything short of Ragnarok. Retains access to any character's power moves while invisible.
- **Ghost can switch skins mid-match** — go from fire to ice in the same game. At level 10, cycle through the roster seamlessly. Opponent can't track which one you're wearing.
- Lower levels show pips — gives opponent something to read while hiding truth.
- **Ghost vs Ghost:** mirror cancels, real dice land. Ghost 2 = rarest skin, the anti-bluff. If you act like the toughest guy and the other is Ghost 2, they get the toughest guy's power. Act weak → they get weak.
- Ghost cannot fake Ragnarok (or copies look but not power — freeze still lands). Keeps counter-grid intact.
- **Reminder:** the GQ boss line about toilet paper is clean — "Those aren't dice. Those belong in a toilet somewhere." No ass-wiping humor, safe for any age.

---

## 5. X-Ray — The Consumable

- X-ray is a consumable, not a skin. One use, gone. Spend during a match.
- When burned: every die on the table flashes true skin for a beat, including yours if you're ghosting. Punishes careless use.
- Fails against level-10 ghost — creates the one skin with no counter. Burning it on a maxed ghost and seeing nothing = you paid to confirm the bluff is real.
- **Earn paths discussed:** GQs (~800 each) as the main path. Rare mystery-box drop as secondary.
- **Explicitly NOT awarded** for rolling a perfect 10,000 or completing the tutorial — too rare for something this situational. A hot-dice opener already leaks identity; x-ray earns its keep when the table goes quiet and everyone's playing cagey.
- Noticing someone skip power after hot dice tells you nothing — most players bank on purpose. Silence is the default.
- **Open question:** is x-ray powerful enough to matter given hot-dice openers leak identity? Worth playtesting before investing.

---

## 6. Story Mode — The Counter Chain

- Each boss fight is a live tutorial: you open against the skin that hard-counters yours. Ice meets fire. Fire meets Ragnarok. First fight unwinnable on power alone → forces base Farkle math before the verb helps.
- **Option:** one win per boss. Two-out-of-three was discussed as a middle ground. Ten matches per stage kills momentum.
- **Bet mechanic at match start:** best two out of three. You win → you get their dice. They win → you must use prison dice for the next fight.
- **Loadout screen:** only dice you've won are available in story mode. Switch option exists but everything else in your bag also loses to the next boss. Only real move = win without the verb.
- Beating a boss auto-equips their dice for the next fight.
- Story mode skins auto power-10 (showcase). Online skins start at 0.
- Prison dice never offered as a voluntary option in story mode — only forced by losing to the GQ boss three times. Involuntary entry = discovered, not selected.
- Early bosses trash-talk prison dice and kick your ass with them. Teaches that prison dice are weak. Final boss reveal lands harder because of the contrast.
- Rare prison-dice win against an early boss counts — makes player feel lucky, not smart. Luck doesn't transfer. Door stays cracked.
- **GQ boss AI:** greedy script — always max-risk, always chases 10,000, ignores busting. Against toilet paper this becomes overextension. ~30% bust rate (not auto-bust — feels winnable, not rigged). Normal dice: he never busts. That gap is the lesson.
- No desperation mode that switches him conservative. If it exists, it only makes him greedier.
- Prison dice = regular rolls, no powers, no hot-dice desire. Player banks small scores. Boss chases big ones and busts. Slow win.
- Beating GQ with prison dice = automatic win once you realize it. Easiest game you've played — you just have to actually roll 10,000.
- Final boss skin, perfect-10,000 skin, custom skins: NOT in mystery-box rotation. Earned through play only.
- Story-mode completion dice and 10,000 dice: straight rewards, milestones, not the crown. Crown stays behind the prison door.
- **Prison-entry screen hint (as agreed):** "The king flushes gold. Toilet paper ends the game." Small, easy to miss.

---

## 7. Prison Dice — The Filter

- Toilet-paper visual: dice look made of toilet paper. Description says so.
- No power, no levels. Pure arithmetic. The original game resurrected as a weapon.
- **Thaw/probe mechanic (if used):** click dice one at a time to find scoring combos. Burns turns hunting for pairs.
- Three-match timer against early bosses: extra-aggressive bosses, harder trash talk, clunky feel. Not unwinnable — miserable.
- Start with Classic dice. Prison dice only appear as punishment for losing to GQ three times.
- **Open question:** should prison dice have any thaw mechanic at all, or just be plain rolls?

---

## 8. Economy — GQs vs Cash

- Two currencies, clean split:
  - **GQs:** in-game, earned from matches. Buy Classic skins (tiered prices — cheap stones bottom, AI-made ones like bug zapper/audio higher), felts, coin boosts.
  - **Real cash:** mystery boxes ONLY, bought on domain landing page (not in-app — avoids Apple's 30%). Landing page ties purchase to account via token, drops box straight into app.
- Power skins: NOT purchasable at level 5 or 10. Everything starts at 1. Basic power set available to anyone at level 0.
- **Option:** special power skins (no levels, auto-topped-out) come from mystery boxes as rare drops — but boxes never promise a verb, just a picture. Floor on expensive box = real level-1 power skin (fire or wind), rare pull = mid-tier or passive skin.
- Block special/box power skins in story mode — preview in sandbox/shop only. Story fights locked to earned chain.
- **Option:** rotating featured skin — one legendary visual in box pool with boosted drop rate for 1–2 weeks, then swaps. Urgency without guaranteed pull.
- No $20 direct purchase for one specific skin — kills box economy.
- Mystery box tiers: cheap (50 coins — always pays back coins + Classic skin or cheap felt), mid (couple hundred — more return, mid-tier skin, decent felt, small chance at low-power skin), expensive (floor = real power skin, rare pull = mid-tier or passive).

---

## 9. XP and Leveling

- **XP curve (as discussed, total ~17,600 to max one skin ≈ 250 matches at 50 XP win / 10 XP loss):**
  - L2: 100 | L3: 300 | L4: 600 | L5: 1,000 | L6: 1,500 | L7: 2,200 | L8: 3,000 | L9: 4,000 | L10: 5,500
- XP from online matches only — no story mode, no offline farming.
- Each skin levels independently (Pokemon-style: pick skin type, play online, feed it XP).
- **Reminder:** per-level ice/fire visual variants — you'll hand-tune each of the 10 freeze intensities. Tedious but doable, one at a time.
- **Open question:** should power acquisition be story-mode-only (beat the ice boss → get ice), or should the shop unlock new powers after you've played with the current one?

---

## 10. Online Modes

- Two queues:
  - **Async (friends):** roll your turn, it waits in queue, they roll when back. Cap each async turn at one roll or one bank action — not a full round. Keeps pace snappy across a day-long match.
  - **Live (random):** whoever's in the lobby now.
- Async solves early population: five people online can still play across hours. "Waiting on opponent" spinner feels normal, not dead.
- **Visibility rules:** show opponent's skin and frost/power animations. Hide dice values and probe clicks. Information layer stays private or ghost/x-ray mean nothing.
- Offline pass-the-phone: fine as-is. Local, no sync issues, teaches before online.

---

## 11. Polish and Assets

- Felt graphics — the biggest visual gap. Invest here.
- GQ character assets: money-gun portrait loop, falling-money background, GQ guy as playable boss.
- Per-character story intros: Matrix waterfall numbers, aquarium scuba diver, etc. Template-ish layout going forward even though you're past retrofitting.
- Delete tmp-*.png files from repo root (tmp-die-bad-offsets, tmp-die-empty-url, tmp-die-power, tmp-die-webkit, tmp-tray-fixed) — debug artifacts, not shipping assets.
- Clean up artifacts/ — keep verify reports, archive old shop/sprite labs.

---

## 12. Suggested Ship Order (optional, rearrange freely)

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

*This briefing contains every major idea from the October 17 conversation. Items marked "option" or "open question" are yours to accept, modify, or reject. Items marked "reminder" are things you said you needed to not forget. The conversation transcript is the source of truth if anything here is unclear.*