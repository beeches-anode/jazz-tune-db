# Phase B parse instructions

You are parsing jazz tune key descriptions into a strict schema. For each tune in your batch file, the `standard_key` string mixes a canonical key with narrative about alternate keys. Emit a JSON array, one object per tune:

```json
{ "id": "<copy the id exactly>", "standard_key": "<canonical>", "alternate_keys": [{"key": "<canonical>", "context": "<short reason>"}], "curator_notes_append": "<string or null>" }
```

Rules:

1. Canonical key format is exactly `<root> <quality>` where root is A-G with optional `b`/`#`, and quality is one of: major, minor, blues, dorian, mixolydian, lydian, phrygian, locrian. Lowercase qualities. Examples: "C major", "Eb minor", "F blues", "D dorian".
2. The primary `standard_key` is the most common concert-pitch instrumental/bandstand call key per the narrative. Phrases like "(concert)", "(instrumental call key)", "most common on bandstands" mark the primary.
3. A bare root like "F" on a blues head (12-bar blues form, Parker/Monk blues, etc.) means `"F blues"`. A bare root on a non-blues tune means its conventional major or minor key — use your jazz knowledge, and note low confidence in curator_notes_append if unsure.
4. Every other key mentioned becomes an alternate_keys entry with a SHORT context (a few words): "common vocal call key", "Getz/Gilberto recording", "earlier fake books", etc. Keep the reason from the narrative; do not invent reasons.
5. If the tune genuinely has no single canonical key (the narrative says so), use `"standard_key": ""` and put every mentioned key in alternate_keys.
6. Narrative content that does not fit key+context (history, performance practice) goes into curator_notes_append as one or two sentences. Otherwise set curator_notes_append to null. Never fabricate facts not present in the input.
7. Preferred enharmonic spellings: use Bb, Eb, Ab, Db, F#, C#, Gb as roots — never A#, D#, G#.
8. No exact duplicate {key, context} pairs within one tune's alternate_keys. Context must be non-empty for every entry.
9. Include EVERY tune from your batch file, in the same order, ids copied exactly.

Process: Read your batch file (path given in your dispatch), produce the JSON array, and Write it to your output file (path given in your dispatch). Output file content is ONLY the JSON array — no commentary, no markdown fences. Do not run any git commands, do not modify any other file, do not touch data/jazz-tunes.json.

Your final chat reply: just "<N> tunes parsed, <M> with empty standard_key, <K> with curator_notes_append" plus anything you were genuinely unsure about (tune name + one line).
