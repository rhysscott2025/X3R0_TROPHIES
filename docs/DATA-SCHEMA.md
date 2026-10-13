# Guide data schema (version 1)

Each guide is one JSON file in `data/games/`, named after its slug: `data/games/<slug>.json`. Files starting with `_` (like `_template.json`) are ignored by the build.

`data/games/sample-game.json` is a complete worked example of every field.

Run `node tools/check.mjs` after any edit. It reports errors (which stop the build) and warnings (gaps to fill).

---

## Text formatting

Any free-text field (intro, route steps, summaries, unlock text, steps, tips, mistakes, notes) supports three small markups. Everything else is plain text and is escaped safely.

| Write | Shows as |
| --- | --- |
| `**Settings > Saves**` | **bold** (use for menu names, buttons and dialogue choices) |
| `[PowerPyx guide](https://example.com/page)` | an external link that opens in a new tab |
| `[[trophy-id]]` | a link to that trophy's entry, showing its name |

The build fails if a `[[trophy-id]]` doesn't match a trophy.

---

## Top level

| Field | Required | Description |
| --- | --- | --- |
| `schemaVersion` | yes | Always `1`. |
| `slug` | yes | Lowercase words joined by hyphens. Must match the file name. Used in the page URL (`games/<slug>.html`) and as the progress storage key, so don't change it after publishing. |
| `status` | yes | `"draft"` (not published), `"in-progress"` (published with a "still being written" notice) or `"complete"`. |
| `demo` | no | `true` only for the fictional demo. Demo guides skip source checks, get `noindex`, and are hidden by `"showDemo": false`. |
| `title` | yes | The game's title as shown on the trophy list. |
| `edition` | no | Edition or version covered, e.g. `"Director's Cut"`, `"PS5 version"`. |
| `platforms` | yes | List, e.g. `["PS5"]` or `["PS5", "PS4"]`. Known values: PS5, PS4, PS3, PS Vita, PS VR, PS VR2. |
| `listNote` | no | Which trophy list this covers and how it differs from other versions (shown as a notice at the top). Strongly recommended when PS4/PS5 or remaster lists differ. |
| `releaseYear` | no | Four-digit year, or `null`. |
| `developer`, `publisher` | no | Names, or `""`. |
| `genres` | no | List of genres; these feed the library's genre filter. Keep spellings consistent across guides. |
| `summary` | yes | One or two sentences for the library card (under 240 characters). |
| `intro` | no | List of paragraphs introducing the game and what to expect. |
| `lastUpdated` | yes | `"YYYY-MM-DD"`. Shown on the page and used for "Recently updated". |
| `stats` | no | See [Stats](#stats). |
| `officialCounts` | recommended | See [Official counts](#official-counts). |
| `theme` | yes | See [Theme](#theme). |
| `dlc` | no | See [DLC](#dlc). |
| `route` | yes | Ordered list of stages. See [Route stages](#route-stages). |
| `trophies` | yes | Every trophy. See [Trophies](#trophies). |
| `images` | no | See [Images](#images). |
| `sources` | recommended | See [Sources](#sources). |

---

## Stats

Every stat is optional. A missing value or `null` shows as "Not yet researched". A value with an empty `sources` list shows as "Unverified". Only fill these in from a source.

```json
"stats": {
  "difficulty":   { "value": 4, "sources": ["powerpyx"] },
  "hours":        { "min": 25, "max": 30, "sources": ["powerpyx"] },
  "playthroughs": { "value": 1, "note": "Chapter select after the credits.", "sources": ["powerpyx"] },
  "online":       { "value": false, "note": "No online trophies.", "sources": ["psnprofiles"] }
}
```

| Stat | Value |
| --- | --- |
| `difficulty.value` | Whole number 1–10 (the usual community Platinum difficulty scale). Library filter bands: 1–3 easy, 4–6 moderate, 7–8 hard, 9–10 very hard. |
| `hours.min`, `hours.max` | Estimated hours to Platinum. `max` may be left out. |
| `playthroughs.value` | Minimum playthroughs needed. `note` explains why. |
| `online.value` | `true` if any trophy needs online play, `false` if none. `note` adds detail. |

---

## Official counts

The number of trophies of each grade on the official list. The build compares these with the trophies you've entered and fails if they differ, which catches a missing or duplicated trophy.

```json
"officialCounts": {
  "base": { "platinum": 1, "gold": 3, "silver": 10, "bronze": 38 },
  "dlc": {
    "frostbound": { "platinum": 0, "gold": 1, "silver": 0, "bronze": 1 }
  },
  "sources": ["psnprofiles"]
}
```

---

## Theme

Each guide gets its own atmosphere while keeping the shared layout.

| Field | Description |
| --- | --- |
| `accent` | Hex colour for links, highlights and progress. Must have at least 4.5:1 contrast on `base` (the build checks). |
| `glow` | Hex colour for the atmospheric glow behind the hero. Can be darker and more saturated. |
| `base` | Near-black hex colour for the page background, tinted to suit the game (e.g. `#120d0c` warm, `#0a1018` cold). Must stay very dark. |
| `pattern` | `"embers"` (warm sparks), `"grid"` (sci-fi floor), `"mist"` (fog for horror or dark fantasy), `"rays"` (shafts of light) or `"none"`. |
| `heroImage` | Image id shown faintly behind the hero, or `null`. |
| `coverImage` | Image id for the library card and social preview, or `null`. Without one, the card uses a typographic cover in the theme colours. |

---

## DLC

```json
"dlc": [
  { "id": "frostbound", "title": "Frostbound", "note": "Separate purchase. Not needed for the Platinum." }
]
```

DLC trophies set `"dlc": "frostbound"` and go in route stages that also set `"dlc": "frostbound"`. They appear in their own section after the base walkthrough, are counted separately, and never count towards the Platinum.

---

## Route stages

The route is the order to play. Stages without `dlc` form the Platinum Route; stages with `dlc` form each DLC's section.

```json
{
  "id": "chapter-1",
  "title": "Chapter 1: The Flooded Valley",
  "summary": "One or two sentences on what this stage covers.",
  "steps": [
    "Ordered, concise instructions. Mention trophies with [[trophy-id]]."
  ],
  "warning": "Point of no return: ... (shown in red; leave empty if none)",
  "trophies": ["lamplighter", "ferrymans-fare", "stowaway"]
}
```

| Field | Description |
| --- | --- |
| `id` | Unique, lowercase-with-hyphens. Used for the `#s-<id>` anchor. |
| `title` | Stage name, usually the chapter, mission or phase. |
| `dlc` | DLC id, for DLC stages only. |
| `summary` | What the player does here and why it's in this position. |
| `steps` | The route itself: short ordered steps. |
| `warning` | Any point of no return, mutually exclusive choice or permanently missable content in this stage. |
| `trophies` | Trophy ids in the order they're earned in this stage. Every trophy must be in exactly one stage. |

Put the Platinum in the last base-game stage.

---

## Trophies

```json
{
  "id": "ferrymans-fare",
  "name": "Ferryman's Fare",
  "grade": "bronze",
  "description": "Pay the ferryman.",
  "hidden": false,
  "dlc": null,
  "tags": ["choice"],
  "missable": true,
  "missableNote": "Mutually exclusive with [[stowaway]] unless you reload a manual save.",
  "afterStory": false,
  "where": "Chapter 1: the jetty",
  "when": "Before boarding the ferry",
  "prerequisites": ["At least 1 coin."],
  "unlock": "Talk to the ferryman and choose **Pay the fare**.",
  "steps": [
    "Make a manual save on the jetty.",
    { "text": "Talk to the ferryman.", "image": "jetty-shot" }
  ],
  "tips": ["..."],
  "mistakes": ["..."],
  "images": [],
  "icon": null,
  "sources": ["powerpyx", "psnprofiles"]
}
```

| Field | Required | Description |
| --- | --- | --- |
| `id` | yes | Unique, lowercase-with-hyphens, usually from the name. Anchor `#t-<id>` and the saved-progress key, so keep it stable. |
| `name` | yes | Official trophy name, exactly as on the list. |
| `grade` | yes | `platinum`, `gold`, `silver` or `bronze`. |
| `description` | yes | Official in-game description, exactly as on the list. |
| `hidden` | no | `true` for hidden trophies: the description sits behind a "show" control and stays out of search. |
| `dlc` | no | DLC id, or `null` for the base game. |
| `tags` | no | Any of `story`, `choice`, `collectible`, `exploration`, `side-quest`, `combat`, `challenge`, `difficulty`, `online`, `multiplayer`, `grind`, `misc`. |
| `missable` | yes | `true` if it can be permanently missed in a playthrough. Only set this with evidence. |
| `missableNote` | if missable | Exactly when and how it's lost, and how to avoid that. |
| `afterStory` | no | `true` if it can still be earned after the credits (chapter select, free roam, post-game), `false` if it can't, `null` if unknown. |
| `where` | no | Chapter, mission, area or activity. |
| `when` | no | The recommended moment to earn it. |
| `prerequisites` | no | List of requirements: items, upgrades, settings, earlier trophies. |
| `unlock` | recommended | Plain explanation of the unlock condition, including anything the official description leaves out. |
| `steps` | recommended | Numbered steps. A step is text, or `{ "text": "...", "image": "image-id" }` to show an image right under that step. For collectibles and multi-part trophies, list every item. |
| `tips` | no | Tactics and shortcuts. |
| `mistakes` | no | Common mistakes and how to avoid them. |
| `images` | no | Extra image ids shown after the steps. |
| `icon` | no | Image id of the trophy icon, if you have permission to use it. |
| `sources` | recommended | Source ids that back up this entry. Without any, the entry is labelled **Unverified**. |

---

## Images

Real image:

```json
{
  "id": "mill-map",
  "src": "assets/games/sample-game/mill-map.webp",
  "width": 1600,
  "height": 900,
  "alt": "Map of the mill with the five ledger pages numbered in pickup order.",
  "caption": "Optional caption under the image.",
  "credit": {
    "holder": "Who owns the image",
    "sourceName": "Where it came from, e.g. Publisher press kit",
    "sourceUrl": "https://example.com/press",
    "license": "The licence or permission, e.g. CC BY 4.0, or Press kit terms",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "attribution": "Any exact wording the licence requires, or null"
  }
}
```

`src` is relative to `src/static/`. `width` and `height` are the file's pixel size. `credit.holder`, `credit.sourceName` and `credit.license` are required. Don't invent any credit detail: if you don't know it, don't use the image.

Placeholder (when no usable image exists yet):

```json
{ "id": "boss-arena", "placeholder": true, "needed": "What the image should show", "aspect": "16/9" }
```

---

## Sources

```json
{
  "id": "psnprofiles",
  "title": "Game Title Trophies - PSNProfiles",
  "url": "https://psnprofiles.com/trophies/...",
  "supports": "Trophy names, descriptions, grades and counts",
  "checked": "2026-10-13"
}
```

Only list sources you actually read. `supports` says what the source backs up; `checked` is the date you last verified it. Sources are listed at the bottom of the guide.

---

## Site settings (`data/site.json`)

| Field | Description |
| --- | --- |
| `name`, `tagline`, `description` | Branding and the default meta description. |
| `language` | Page language code, e.g. `"en-NZ"`. |
| `url` | Full live address ending in `/`, e.g. `"https://yourname.github.io/x3r0-trophies/"`. Enables canonical links, the sitemap, social images and correct 404 links. |
| `repository` | GitHub repository URL. Adds a "Report a problem" link. |
| `showDemo` | `false` hides the fictional demo guide. |
