# Adding a game

A guide is one JSON file. This page covers how to research it, how to write it, and a prompt you can give an AI assistant to do the research and drafting for you.

## 1. Pin down the exact trophy list

Before writing anything, decide which list the guide covers:

- **Platform:** PS4 and PS5 versions often have separate lists, sometimes with different trophies.
- **Edition:** remasters, director's cuts and "complete" editions can change the list.
- **Region:** a few games have region-specific lists.
- **DLC:** which DLC packs have their own trophies.

Record your choice in `platforms`, `edition` and `listNote`. Never merge two lists into one guide.

## 2. Create the draft

```bash
node tools/new-game.mjs "Game Title" --platform PS5
```

This makes `data/games/game-title.json` with `"status": "draft"`. Drafts are checked but never published, so you can work on them without breaking the live site.

## 3. Research

For each guide, gather and record as `sources`:

1. **The official list** (names, descriptions, grades, counts), e.g. the game's PSNProfiles or Exophase trophy page. Fill in `officialCounts` from it.
2. **At least one established trophy guide or roadmap** (PowerPyx, PlayStationTrophies.org, Knoef, PSNProfiles guides) for missables, difficulty, time, playthroughs and the overall route.
3. **Specialist sources for detail:** game wikis, collectible maps, developer patch notes for trophy fixes or bugs.
4. **A second source for anything that's easy to get wrong:** missables, points of no return, collectible counts, difficulty-related trophies, known glitches.

When sources disagree, note it in the trophy's text and keep it unverified until you've resolved it.

## 4. Build the route

Order stages the way a well-planned playthrough goes:

1. Settings and preparation (difficulty choice, manual saves, anything that must be set before starting).
2. Story chapters or regions in play order, each holding the trophies best earned there.
3. Missables and collectibles in the stage **before** their point of no return, with the warning in that stage's `warning`.
4. Mutually exclusive choices with save-and-reload instructions.
5. Post-game cleanup: chapter select, free roam, New Game Plus, grinds, online.
6. The Platinum, alone in the final stage.
7. DLC stages last, marked with `dlc`.

Each stage's `steps` are the quick route; each trophy's `steps` are the detail. Link them with `[[trophy-id]]`.

## 5. Check and publish

```bash
node tools/check.mjs
```

Fix every error. Then work through the warnings: unsourced trophies, missing counts, placeholder images. When the guide is usable, set `"status": "in-progress"` (it shows a notice) or `"complete"`, commit and push.

Before marking a guide complete, confirm:

- [ ] The trophy count per grade matches `officialCounts` (the build checks this).
- [ ] Every missable trophy has `missable: true`, a `missableNote`, and a warning in the stage before its point of no return.
- [ ] Every collectible trophy lists every item, or links to a sourced map.
- [ ] Difficulty, ending, choice and online requirements are all covered.
- [ ] DLC trophies are in DLC stages only.
- [ ] Every trophy has at least one source.
- [ ] Every image has a full credit, or is a labelled placeholder.

---

## Research prompt for an AI assistant

Copy this, fill in the first three lines, and give it to an assistant that can browse the web. Attach `docs/DATA-SCHEMA.md` and `data/games/sample-game.json` so it can follow the format.

```text
Write an X3R0 TROPHIES guide file for:
  Game: [GAME TITLE]
  Platform and edition: [e.g. PS5, standard edition]
  DLC to include: [none / list the packs]

Output a single JSON file that follows the attached DATA-SCHEMA.md exactly,
using sample-game.json as the model. Set "status" to "in-progress".

Research rules:
- Browse the web. Do not rely on memory for any trophy detail.
- Take trophy names, descriptions, grades and counts from the official list
  for this exact platform and edition. Say in "listNote" whether other
  platforms or editions have a different list.
- Fill "officialCounts" from that list and make sure the trophies you write
  match it exactly.
- Verify missables, points of no return, collectible counts, difficulty
  requirements, online requirements and known trophy bugs against at least
  two sources. If they disagree, say so in the trophy text.
- Only give difficulty, hours and playthroughs from a source, and cite it.
- Add every source you actually read to "sources", with what it supports and
  today's date, and reference the relevant source ids from each trophy and
  stat. Never invent a source, URL, credit or licence.
- Leave "sources" empty on any trophy you couldn't verify; it will be labelled
  unverified. Never fill a gap with a guess.

Writing rules:
- Order the "route" for the fewest playthroughs: missables and collectibles
  before their point of no return, mutually exclusive choices with
  save-and-reload steps, story trophies where they unlock, grinds and
  repeatable tasks in post-game cleanup, the Platinum alone in the last stage.
- Give every trophy numbered steps. For collectibles and multi-part trophies,
  list every item and where it is. Use exact names for menus, items, quests
  and dialogue choices.
- Use **bold** for menu names and choices, and [[trophy-id]] to refer to
  another trophy.
- Write in plain, direct British/New Zealand English.
- Do not include images unless you can give their full licence details; add
  placeholders describing the images that would help most instead.

After the JSON, list anything you couldn't verify and which sources disagreed.
```

Save the result as `data/games/<slug>.json`, run `node tools/check.mjs`, and review the unverified items yourself before publishing.
