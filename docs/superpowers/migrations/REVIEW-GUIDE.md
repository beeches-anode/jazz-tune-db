# Phase B patch — review guide for Trent

Patch: `2026-08-22-standard-key-split.patch.json` — 233 entries, every one shows `before` (old narrative) and `after` (canonical + alternates). All 233 passed the strict validators. 278 alternate-key entries total.

## Numbers at a glance

- 232 tunes get a non-empty canonical `standard_key`; 1 gets empty (see below)
- 23 blues heads → `<root> blues` (All Blues, Bag's Groove, Billie's Bounce, Blue Monk, Now's the Time, Tenor Madness, Freddie Freeloader, Watermelon Man, …)
- 15 tunes carry a `curator_notes_append` (low-confidence flags and preserved narrative)

## Things the parse agents explicitly flagged — check these first

1. **DUPLICATE RECORDS DISCOVERED: "Straight, No Chaser" AND "Straight No Chaser"** are two separate records (like the How Deep Is the Ocean pair you merged in May). The comma one had bare `F` → patched to `F blues`; the comma-less one had `F major (standard key)` → kept as `F major` per its source text. Recommend: review whether to merge/archive the duplicate separately after this migration; if both stay, the comma-less one should probably also be `F blues`.
2. **Soft Winds** — source was `G, F, Bb` with no markers; agent chose empty `standard_key` with all three as alternates, contexts are placeholder "no distinguishing context given". You may prefer to pick one primary (G major is the common call) — edit the patch entry if so.
3. **Bare-root quality guesses (low confidence, noted in curator_notes_append):** Hullo Bolinas → E major; Manteca → Bb minor; El Gaucho → C major; Bemsha Swing → D major; Basin Street Blues → F major (not blues — form isn't 12-bar); Maiden Voyage → D minor (arguably D dorian — your call as the modal-tunes decision-maker).
4. **Blues-by-analogy calls:** Chippie, United, Gingerbread Boy, Nostalgia in Times Square, Watermelon Man (16-bar), Blues in the Closet (C blues primary from `C, Ab`) — all flagged in their curator notes.
5. **First-listed-as-primary convention** applied where the narrative had no explicit marker: Sophisticated Lady (Db), Invitation (D minor), On Green Dolphin Street, Just Friends, I'm Getting Sentimental Over You, St. James Infirmary (D minor), You Don't Know What Love Is (D minor), Lover Come Back to Me (C), Mack the Knife (C), Speak No Evil (C minor).
6. **Generic contexts** ("also common", "alternate key") were used where the narrative listed a key with no stated reason — agents were instructed never to invent reasons.

## How to review

Open the patch file and skim `before` → `after` per entry; the flagged ones above are the only judgment calls. Everything else is mechanical extraction. Edit any `after` you disagree with directly in the patch file — the apply step re-validates every entry.
