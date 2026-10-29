# Rubi: Rebana Ubi Chatbot

Rubi (short for **r**ebana **ubi**) is a rule-based expert system and chatbot that guides general users through the rebana ubi, the traditional Malay drum. It is built in plain HTML, CSS and JavaScript, with no frameworks, no Python and no external APIs.

> **Status:** the program is complete. All 18 answers in `knowledge.js` are written from the sources in `Source Links.txt` and list their APA 7th references. Source 5 (Jurnal Arkeologi) could not be read because the site was down, and the drum recordings are still to come (see [What you must add](#what-you-must-add)).

---

## How to run

**Option 1: open the file**

1. Open the `rubi-chatbot` folder.
2. Double-click `index.html` (Chrome or Edge recommended).

**Option 2: local server**

```bash
npx http-server -c-1
```

Then open the address it prints (usually http://127.0.0.1:8080). `-c-1` turns caching off so your edits show after a refresh.

**Voice:** browsers only allow speech after you interact with the page. Rubi's greeting is spoken after your first click or key press.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Page layout: a **Chat** tab (avatar panel with spoken caption and voice toggle, beside the chat window) and a **Play the drum** tab (one drum with an inner circle and an outer ring) |
| `style.css` | Styling, including dark mode and a stacked layout for phones |
| `knowledge.js` | Knowledge base: `SYNONYM_GROUPS`, `KNOWLEDGE_BASE` (topics) and `SOURCES` |
| `bot.js` | Chat logic: NLP pipeline, intents, replies, speech, drum audio, rendering |
| `assets/avatar.png` | Rubi's avatar (the team's own image) |
| `audio/` | Drum recordings go here (see `audio/PUT_AUDIO_HERE.txt`) |

`knowledge.js` and `bot.js` are loaded with `<script>` tags, not `fetch()`, so the site works straight from `file://`.

---

## Features and where they are in the code

| Requirement | Where |
|---|---|
| Bot name `const BOT_NAME = "Rubi"`, used in the title, headers, greeting and speech | `bot.js` §1, `bindUi()`, `startConversation()` |
| Rubi speaks first on load | `window.addEventListener("load", startConversation)` |
| Greeting by computer time (morning / afternoon / evening) | `timeGreeting()` |
| Asks for the name and validates it (empty, digits only, over 30 characters, symbols) | `handleNameAnswer()`, `validateName()` |
| Text menu of topics; free-text conversation, no buttons | `showMenu()` |
| Lowercasing and tokenising, plus contraction expansion ("whats" → "what is") | `normalise()` |
| 19 synonym groups (including some Malay words) | `SYNONYM_GROUPS` in `knowledge.js` |
| Spelling correction with Levenshtein distance | `levenshtein()`, `correctSpelling()` |
| Keyword scoring (keyword 3, synonym 2, phrase 5, semantic-network context +1) | `scoreTopics()` |
| Fallback replies for unknown input (rotating, shows the menu after 3 misses) | `replyFallback()` |
| "rubi" as an alias for the drum | `SYNONYM_GROUPS.rebanaubi` |
| Off-topic handling: ruby gemstone, Ruby programming language, other subjects | `replyRuby()`, `OFF_TOPIC_WORDS` |
| Remembers the name and last topic, and uses them in replies | `state`, `answerTopic()`, "what's my name?", "what were we talking about?" |
| One playable drum on a separate **Play the drum** tab: the inner circle and outer ring play different tones, plus a rhythm button (click, or keys S / A / D). Typed commands work in the chat ("hit the drum", "hit the outer drum", "play a rhythm", "open the drum tab") | `switchTab()`, `playDrum()`, `detectDrumCommand()` |
| Speech with a mute toggle, caption shown in the avatar panel | §7 Speech in `bot.js` |
| Follow-up suggestions from each topic's `related` field | `suggestionText()`, `replyMore()` ("tell me more") |
| try/catch around audio and speech, with messages when unsupported | `playDrum()`, `playSynth()`, `speak()`, `initSpeech()` |
| Asking a question before giving a name: Rubi remembers it and answers after | `state.pendingQuestion` |

### Things to try (useful for Chapter 3 screenshots and Chapter 4 testing)

| Type this | Shows |
|---|---|
| *(empty)*, `12345`, a 31+ character name, `@@@` | Name validation messages |
| `what is rebana ubi?` before giving a name | Question remembered and answered after the name |
| `menu` | Topic menu |
| `how is it made`, `what is it made of` | Phrase synonyms ("made of" → Materials, "made" → Making) |
| `tell me the histroy of the rebanna` | Spelling correction with a note showing what was corrected |
| `tell me more` | Moves to the next linked topic in the semantic network |
| `what is my name?`, `what were we talking about?` | Memory |
| `what are you made of?`, `how big are you?` vs `who are you?` | Questions to "you" answered as a rebana ubi; only the bare identity question gets the chatbot intro |
| `tell me about rubies`, `ruby programming` | Off-topic handling |
| `hit the drum`, `hit the outer drum`, `play a rhythm` | Typed drum commands (sound plays without leaving the chat) |
| `open the drum tab` | Switches to the Play the drum tab |
| `sources` | Source list |
| `mute` / `unmute` | Typed voice control |

---

## What you must add

### 1. Check the facts (`knowledge.js` → `KNOWLEDGE_BASE`)

Every answer was written on 29 October 2026 from these sources:

| # | Source | Used for |
|---|---|---|
| 1 | Kraftangan Malaysia: Mat Yaacob bin Awang Besar | Materials, making, craftsmen, decoration, learning |
| 2 | Kraftangan Malaysia: Tuan Haji Mahmood bin Abdul Latif | History, making, craftsmen, sound, playing |
| 3, 4 | Siti Hajar Abdul Halim (2024), UMK thesis | Most topics, especially parts, materials, making and tuning |
| 5 | Jurnal Arkeologi Malaysia | **Not used.** The site returned a server error. Try again later and add it if it is useful |
| 6 | JKKN Kelantan portal | Not used: the page has no rebana ubi content. Consider dropping it |
| 7 | JKKN media release 15/2024 | Performances and festivals, preservation |
| 8 | PUSAKA | Most topics |
| 9 | PRPM DBP ("ubi") | Name and meaning, overview, decoration, playing |
| 10 | Muzium Kraf collection | Size, museums |
| 11 | PMBK Qiadah magazine, p. 58 | History, region, playing, rhythms, performances, significance |

Things the team should know:

- **Sizes disagree.** PUSAKA and Qiadah say almost 1 m high and about 70 cm across. The museum drum is 78 cm × 60 cm. The thesis says one foot high in one place and 76.2 cm across in another. Kraftangan's Mahmood page says "almost 2 feet" and "528 kg", which looks like an error. The answer gives the consistent figures and does not state a weight.
- **Hide:** three sources say buffalo hide; Qiadah says "bull leather". The answers use buffalo hide.
- **Why "ubi"?** No source says why the drum is called "ubi". The answer gives the dictionary meaning (tuber) and says the reason is not explained. Do not add a reason without a source.
- **Rhythm names:** no source names individual rhythm patterns.
- Answers are paraphrased into English from Malay sources. Have a Malay speaker in the team check the meaning.

You can rename, add or delete topics. If you do, update every `related` list that mentions them. Rubi warns in the browser console (F12) about broken links.

### 2. Semantic network (`knowledge.js` → `related`)

The `related` links are a first draft. Change them so they match the nodes and links in your **Chapter 2 semantic network** exactly. Suggestions and "tell me more" follow these links.

### 3. Sources

- [ ] Check the APA 7th references in each topic's `source` and in `SOURCES` against your module's referencing guide (Malay names are written in full, e.g. "Siti Hajar Abdul Halim").
- [ ] Add source 5 if the site comes back, or remove it.

### 4. Audio (`audio/`)

- [ ] `audio/inner.mp3` (centre hit), `audio/outer.mp3` (edge hit), `audio/rhythm.mp3` (see `audio/PUT_AUDIO_HERE.txt`)
- [ ] Credit the recordings (yours, or licensed with a reference).
- [ ] Optional: if your recordings use real stroke names, rename the zones. Change the labels and `data-sound` in `index.html` and the keys in `DRUM_SOUNDS` in `bot.js`.

The inner/outer split follows how drums generally behave (the centre sounds deeper, the edge higher). None of the sources describe rebana ubi strokes this way, so don't present it as a fact about the rebana ubi unless you find a source.

Until these files exist, Rubi plays a synthesised stand-in and says so. The stand-in rhythm is not a real rebana ubi pattern.

The UMK thesis recommends digital games and simulations to interest young people in the rebana ubi. That supports the Play the drum tab, and is worth mentioning in Chapter 3.

### 5. Avatar (`assets/avatar.png`)

- [x] Added from `Rubi (Rebana Ubi Avatar).png`. To swap it, replace the file and keep the name.
- [ ] Credit how the avatar was made in the AI responsible use report (Appendix).

---

## Referencing note

As requested, borrowed code is cited in **APA 7th** at the top of `bot.js` (references R1–R7) and at each place it is used. The assignment brief and marking scheme ask for the **Harvard Name** convention for code references, so check with your lecturer which style they want before submission.

## Known limitations (ideas for Chapter 5)

- Matching is keyword based, so a question can match the wrong topic if it uses words from several topics.
- Only the user's name and last topic are remembered, and only until the page is refreshed.
- Speech uses the browser's built-in voices, so Malay words may be mispronounced.
- No speech recognition (voice input) yet.
