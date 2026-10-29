/* =====================================================================
 * bot.js — Rubi, a rule-based chatbot about the rebana ubi
 * ---------------------------------------------------------------------
 * Needs knowledge.js to be loaded first (SYNONYM_GROUPS, KNOWLEDGE_BASE,
 * SOURCES). Plain JavaScript, no frameworks, no external APIs.
 *
 * How a message flows through the bot
 *   user text
 *     -> normalise()          lowercase, strip symbols, expand contractions
 *     -> correctSpelling()    Levenshtein distance against the vocabulary
 *     -> intent rules         name, menu, sources, drum commands, small talk
 *     -> canonicalise()       rewrite synonyms to one canonical word
 *     -> scoreTopics()        keyword scoring against the knowledge base
 *     -> reply                answer + source + follow-ups from `related`
 *     -> fallback             polite reply when nothing matches
 *
 * File layout
 *   1. Configuration          6. Replies (topics, menu, fallbacks)
 *   2. Word lists             7. Speech (speechSynthesis + mute)
 *   3. Conversation state     8. Drum audio (samples + synth fallback)
 *   4. NLP pipeline           9. Chat window rendering
 *   5. Message handling      10. Start-up
 *
 * References for borrowed or adapted code (APA 7th edition)
 *   [R1] Levenshtein, V. I. (1966). Binary codes capable of correcting
 *        deletions, insertions, and reversals. Soviet Physics Doklady,
 *        10(8), 707–710.
 *   [R2] Wikipedia contributors. (n.d.). Levenshtein distance. In
 *        Wikipedia. Retrieved October 29, 2026, from
 *        https://en.wikipedia.org/wiki/Levenshtein_distance
 *   [R3] MDN contributors. (n.d.). SpeechSynthesis. MDN Web Docs.
 *        Retrieved October 29, 2026, from
 *        https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
 *   [R4] MDN contributors. (n.d.). HTMLMediaElement: play() method. MDN Web
 *        Docs. Retrieved October 29, 2026, from
 *        https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
 *   [R5] MDN contributors. (n.d.). Using the Web Audio API. MDN Web Docs.
 *        Retrieved October 29, 2026, from
 *        https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
 *   [R6] MDN contributors. (n.d.). Navigator: userActivation property. MDN
 *        Web Docs. Retrieved October 29, 2026, from
 *        https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userActivation
 *   [R7] Beaufort, F. (2017). Autoplay policy in Chrome. Chrome for
 *        Developers. https://developer.chrome.com/blog/autoplay
 * ===================================================================== */

"use strict";

/* =====================================================================
 * 1. CONFIGURATION
 * ===================================================================== */
const BOT_NAME = "Rubi";                 // short for "rebana ubi"
const NAME_MAX_LENGTH = 30;              // longest name we accept
const MIN_MATCH_SCORE = 2;               // lowest score that counts as a topic match
const WEIGHT = { keyword: 3, synonym: 2, phrase: 5, context: 1 };

// The one drum on the Drum tab, and typed drum commands.
//   inner  = a hit on the centre of the skin (deeper stand-in tone)
//   outer  = a hit near the edge of the skin (higher stand-in tone)
//   rhythm = a short pattern that mixes both
// `file` is the real recording (supplied by the team). `synth` is a stand-in
// played with the Web Audio API when the file is missing:
// { t: start time in seconds, f: pitch in Hz }. The stand-in pitches and
// pattern are NOT real rebana ubi strokes or rhythms.
const DRUM_SOUNDS = {
  inner:  { file: "audio/inner.mp3",  label: "inner drum",  synth: [{ t: 0, f: 85 }] },
  outer:  { file: "audio/outer.mp3",  label: "outer drum",  synth: [{ t: 0, f: 210 }] },
  rhythm: { file: "audio/rhythm.mp3", label: "rhythm demo", synth: [
    { t: 0, f: 85 }, { t: 0.3, f: 210 }, { t: 0.45, f: 210 }, { t: 0.6, f: 85 }, { t: 0.9, f: 210 }, { t: 1.2, f: 85 }
  ] }
};

/* =====================================================================
 * 2. WORD LISTS
 * ===================================================================== */

// Informal spellings and contractions, expanded before anything else.
// This is the bot's light "grammar correction" step.
const CONTRACTIONS = {
  "what's": "what is", "whats": "what is", "wat": "what", "wut": "what",
  "how's": "how is", "hows": "how is", "where's": "where is", "wheres": "where is",
  "who's": "who is", "whos": "who is", "that's": "that is", "thats": "that is",
  "it's": "it is", "i'm": "i am", "you're": "you are", "youre": "you are",
  "don't": "do not", "dont": "do not", "doesn't": "does not", "doesnt": "does not",
  "can't": "cannot", "cant": "cannot", "won't": "will not", "isn't": "is not", "isnt": "is not",
  "let's": "let us", "wanna": "want to", "gonna": "going to", "gimme": "give me",
  "u": "you", "ur": "your", "r": "are", "pls": "please", "plz": "please",
  "abt": "about", "thx": "thanks", "ty": "thanks", "tq": "thanks", "bcoz": "because", "coz": "because"
};

// Words that carry little meaning on their own.
const STOPWORDS = new Set(("a an the is are was were be been am of to in on at for and or but it its this that these those " +
  "i me my you your we us our do does did can could would will shall should please tell about what how why who when " +
  "which so some any with by as there their they them he she his her have has had know want like just really very " +
  "give show let get go also too not no yes").split(" "));

// Common English words that must never be "corrected" into a topic word.
const COMMON_WORDS = ("hello hi hey good morning afternoon evening night thanks thank bye goodbye okay sure great nice cool " +
  "wow interesting best most more less many much well fine name call called same other another thing things something " +
  "anything everything people person time year years long first last next again here where everyone someone today " +
  "really maybe think feel love need help tell said says look looks seem great awesome right wrong true false then than " +
  "only even ever never always often again sound like using used use world fact facts question questions answer answers " +
  "about above after before because between could would should might must still while from into onto over under quite " +
  "rather every each such both either neither whose whom whole part start stop talk talking speak speaking quiet mute unmute " +
  "voice menu topics topic list options sources source references reference continue else what were last previous " +
  "main kind kinds type types different difference way ways look find made does done went come comes").split(" ");

// Typed drum commands: a verb plus an object, with no question word.
const DRUM_VERBS = new Set(["hit", "play", "strike", "beat", "bang", "tap", "drum", "pound", "whack", "thump", "pukul", "palu"]);
const DRUM_OBJECTS = new Set(["drum", "drums", "rebana", "rubi", "ubi", "pad", "pads", "it", "something", "sound", "sounds",
  "inner", "outer", "centre", "center", "middle", "edge", "rim", "side", "low", "high", "bass", "deep",
  "rhythm", "beat", "pattern", "sample", "music", "song", "tune", "again"]);
const QUESTION_WORDS = new Set(["how", "what", "why", "who", "when", "where", "which", "explain", "describe", "teach",
  "learn", "technique", "history", "tell"]);

// Off-topic detection. "ruby" is one letter away from "rubi", so it is
// checked BEFORE spelling correction, otherwise it would be "fixed".
const RUBY_WORDS = new Set(["ruby", "rubies", "rubys"]);
const GEM_WORDS = new Set(["gem", "gems", "gemstone", "gemstones", "jewel", "jewels", "jewellery", "jewelry", "birthstone",
  "stone", "stones", "ring", "necklace", "crystal", "carat", "sapphire", "diamond", "emerald", "mineral", "corundum"]);
const CODE_WORDS = new Set(["rails", "programming", "programmer", "code", "coding", "script", "language", "python", "javascript", "gemfile"]);
const OFF_TOPIC_WORDS = new Set(["weather", "rain", "football", "soccer", "movie", "movies", "film", "food", "eat", "hungry",
  "politics", "election", "homework", "exam", "math", "maths", "money", "stock", "crypto", "bitcoin", "girlfriend",
  "boyfriend", "car", "cars", "phone", "game", "games", "guitar", "piano", "violin", "kpop", "anime"]);

/* =====================================================================
 * 3. CONVERSATION STATE (the bot's short-term memory)
 * ===================================================================== */
const state = {
  stage: "askName",        // "askName" -> "chat"
  userName: null,          // remembered after validation
  lastTopic: null,         // last knowledge-base entry discussed
  visited: new Set(),      // topics already discussed (for fresh suggestions)
  fallbackCount: 0,        // consecutive replies Rubi did not understand
  pendingQuestion: null    // a question typed before the user gave a name
};

/* =====================================================================
 * 4. NLP PIPELINE
 * ===================================================================== */

/**
 * Lowercase, remove punctuation and expand contractions.
 * Returns an array of word tokens.
 */
function normalise(text) {
  const cleaned = String(text)
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/-/g, " ")
    .replace(/[^a-z0-9'\s]/g, " ");

  const tokens = [];
  cleaned.split(/\s+/).forEach(word => {
    if (!word) return;
    const expanded = CONTRACTIONS[word] || word.replace(/'/g, "");
    expanded.split(" ").forEach(w => { if (w) tokens.push(w); });
  });
  return tokens;
}

/**
 * Levenshtein edit distance between two words: the number of single-letter
 * insertions, deletions or substitutions needed to turn one into the other.
 * Adapted from the "two matrix rows" version described in [R2], based on
 * Levenshtein (1966) [R1]. Added: an early exit once every value in the
 * current row is above `maxDistance`, because longer distances are ignored.
 */
function levenshtein(a, b, maxDistance) {
  let previous = new Array(b.length + 1);
  let current = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) previous[j] = j;

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,        // deletion
        current[j - 1] + 1,     // insertion
        previous[j - 1] + cost  // substitution
      );
      if (current[j] < rowMin) rowMin = current[j];
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    [previous, current] = [current, previous];
  }
  return previous[b.length];
}

// Vocabulary = every word the bot knows. Filled in buildIndexes().
const VOCAB = new Set();

/**
 * Replace unknown words with the closest vocabulary word.
 * Short words (under 4 letters) are left alone because a single typo
 * changes them too much. Allowed distance: 1 for 4–5 letters, 2 for longer.
 */
function correctSpelling(tokens) {
  const corrections = [];
  const corrected = tokens.map(token => {
    if (token.length < 4 || /\d/.test(token) || VOCAB.has(token)) return token;

    const maxDistance = token.length <= 5 ? 1 : 2;
    let best = null;
    let bestDistance = maxDistance + 1;
    VOCAB.forEach(word => {
      if (word.length < 3 || Math.abs(word.length - token.length) > maxDistance) return;
      const distance = levenshtein(token, word, maxDistance);
      if (distance < bestDistance) { best = word; bestDistance = distance; }
    });

    if (best) { corrections.push({ from: token, to: best }); return best; }
    return token;
  });
  return { tokens: corrected, corrections };
}

// Synonym lookup tables. Filled in buildIndexes().
let PHRASE_RULES = [];   // [{ regex, canonical }] for multi-word variants, longest first
const WORD_MAP = {};     // single-word variant -> canonical word

/**
 * Rewrite synonyms to their canonical word, e.g.
 * "what is the rebana ubi made of" -> ["what","is","rebanaubi","material"].
 * Phrases are replaced before single words.
 */
function canonicalise(tokens) {
  let text = " " + tokens.join(" ") + " ";
  PHRASE_RULES.forEach(rule => { text = text.replace(rule.regex, " " + rule.canonical + " "); });
  return text.trim().split(/\s+/).filter(Boolean).map(word => WORD_MAP[word] || word);
}

// Pre-processed version of each knowledge-base entry. Filled in buildIndexes().
let TOPIC_INDEX = [];

/**
 * Score every topic against the user's (canonical) words.
 *   keyword match  +3   synonym match +2   phrase match +5
 *   +1 if the topic is linked to the last topic in the semantic network
 *      (only added when the topic already matched something).
 * Returns the topics sorted best first.
 */
function scoreTopics(canonTokens) {
  const words = new Set(canonTokens);
  const text = " " + canonTokens.join(" ") + " ";

  return TOPIC_INDEX.map(item => {
    let score = 0;
    item.keywords.forEach(w => { if (words.has(w)) score += WEIGHT.keyword; });
    item.synonyms.forEach(w => { if (words.has(w) && !item.keywords.has(w)) score += WEIGHT.synonym; });
    item.phrases.forEach(p => { if (text.includes(" " + p + " ")) score += WEIGHT.phrase; });

    if (score > 0 && state.lastTopic && state.lastTopic.related.includes(item.entry.topic)) {
      score += WEIGHT.context;
    }
    return { entry: item.entry, score };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Build the vocabulary, synonym tables and topic index from knowledge.js.
 * Also checks that every `related` link points at a real topic.
 */
function buildIndexes() {
  const addWords = text => normalise(text).forEach(w => VOCAB.add(w));

  // Synonym groups
  const phrases = [];
  Object.keys(SYNONYM_GROUPS).forEach(canonical => {
    VOCAB.add(canonical);
    WORD_MAP[canonical] = canonical;
    SYNONYM_GROUPS[canonical].forEach(variant => {
      addWords(variant);
      const words = normalise(variant);
      if (words.length > 1) phrases.push({ phrase: words.join(" "), canonical });
      else if (words.length === 1) WORD_MAP[words[0]] = canonical;
    });
  });
  PHRASE_RULES = phrases
    .sort((a, b) => b.phrase.length - a.phrase.length)
    .map(p => ({ regex: new RegExp(" " + p.phrase + " ", "g"), canonical: p.canonical }));

  // Topics: keywords and synonyms go through the same canonical mapping as
  // user input, so "making" in the knowledge base matches "made" typed by a user.
  TOPIC_INDEX = KNOWLEDGE_BASE.map(entry => {
    const item = { entry, keywords: new Set(), synonyms: new Set(), phrases: [] };
    const addTerm = (term, target) => {
      addWords(term);
      const canon = canonicalise(normalise(term));
      if (canon.length > 1) item.phrases.push(canon.join(" "));
      else if (canon.length === 1) target.add(canon[0]);
    };
    entry.keywords.forEach(k => addTerm(k, item.keywords));
    entry.synonyms.forEach(s => addTerm(s, item.synonyms));
    return item;
  });

  // Every other word list the bot reacts to
  [STOPWORDS, DRUM_VERBS, DRUM_OBJECTS, QUESTION_WORDS, GEM_WORDS, CODE_WORDS, OFF_TOPIC_WORDS]
    .forEach(set => set.forEach(w => VOCAB.add(w)));
  COMMON_WORDS.forEach(w => VOCAB.add(w));
  Object.keys(CONTRACTIONS).forEach(addWords);

  // Semantic-network check: warn the team about broken links
  const topicNames = new Set(KNOWLEDGE_BASE.map(e => e.topic));
  KNOWLEDGE_BASE.forEach(entry => {
    entry.related.forEach(link => {
      if (!topicNames.has(link)) console.warn(`knowledge.js: "${entry.topic}" links to unknown topic "${link}".`);
    });
  });
}

/* =====================================================================
 * 5. MESSAGE HANDLING
 * ===================================================================== */

/** Entry point for everything the user types. */
function handleUserMessage(rawText) {
  // ---- Stage 1: we still need the user's name ----
  if (state.stage === "askName") {
    handleNameAnswer(rawText);
    return;
  }

  const rawTokens = normalise(rawText);
  if (rawTokens.length === 0) {
    botSay([{ type: "text", text: `I only see symbols there, ${state.userName}. Try asking me a question in words, like "How is the rebana ubi played?"` }]);
    return;
  }

  // ---- Off-topic "ruby" (must run before spelling correction) ----
  if (rawTokens.some(w => RUBY_WORDS.has(w))) {
    replyRuby(rawTokens);
    return;
  }

  // ---- Name change ("my name is ...", "call me ...") ----
  const nameChange = String(rawText).match(/\b(?:my name is|my name's|call me)\s+(.+)/i);
  if (nameChange) {
    const result = validateName(nameChange[1]);
    if (result.ok) {
      const oldName = state.userName;
      state.userName = result.name;
      botSay([{ type: "text", text: oldName === result.name
        ? `I already know you as ${result.name}! What would you like to learn about the rebana ubi?`
        : `Got it. I'll call you ${result.name} from now on instead of ${oldName}.` }]);
    } else {
      botSay([{ type: "text", text: result.message + ` I'll keep calling you ${state.userName} for now.` }]);
    }
    return;
  }

  // ---- Spelling correction, then rule-based intents ----
  const { tokens, corrections } = correctSpelling(rawTokens);
  const clean = tokens.join(" ");
  const words = new Set(tokens);
  const note = correctionNote(corrections);

  if (/\b(what is my name|who am i|do you (know|remember) my name|remember my name|say my name)\b/.test(clean)) {
    botSay([{ type: "text", text: `Of course! You're ${state.userName}. I never forget a friend of the drum.` }]);
    return;
  }

  if (/\b(what were we (talking|discussing)|what did we (talk|discuss)|last topic|previous topic|where were we)\b/.test(clean)) {
    replyLastTopic();
    return;
  }

  // Only the bare question ("what are you?") is about the chatbot. Longer ones
  // such as "what are you made of?" fall through to the knowledge base, where
  // Rubi answers as a rebana ubi.
  if (/^(who|what) (are|r) you( really| exactly)?$|\byour name\b|\bwho is rubi\b|\bare you (a |an )?(bot|robot|human|ai|real|person)\b/.test(clean)) {
    botSay([{ type: "text", text: `I'm ${BOT_NAME}, a rule-based chatbot. My name is short for "rebana ubi", and I'm here as your guide to this traditional Malay drum. I'm not a person, but I know my drums!` }]);
    return;
  }

  if (/\bwho (made|built|created|programmed|designed) you\b/.test(clean)) {
    botSay([
      { type: "text", text: `As a chatbot, I was built by a student team for an Introduction to AI assignment, as an expert system about the rebana ubi.` },
      { type: "suggest", text: `If you meant who makes real rebana ubi drums, ask me about the craftsmen.` }
    ]);
    return;
  }

  if (/\b(what do you mean|i do not understand|i am confused|confusing|huh)\b/.test(clean)) {
    botSay([{ type: "text", text: `Sorry for the confusion, ${state.userName}! Ask me about one part of the drum at a time, such as its history, its parts or how it's played. Type "menu" to see every topic.` }]);
    return;
  }

  if (/\b(menu|topics)\b/.test(clean) || (/\b(help|options|list)\b/.test(clean) && tokens.length <= 4) ||
      /\bwhat (can|do) you (do|know|talk about|tell me)\b/.test(clean)) {
    showMenu(`Here's everything I can tell you about, ${state.userName}:`);
    return;
  }

  if (/\bwhere did you (get|find) (that|this|it)\b|\bsource (for|of) (that|this)\b/.test(clean) && state.lastTopic) {
    botSay([
      { type: "text", text: `My answer about ${state.lastTopic.topic} comes from:` },
      { type: "source", text: state.lastTopic.source }
    ]);
    return;
  }

  if (/\b(sources|source|references|reference|citations|bibliography)\b/.test(clean)) {
    replySources();
    return;
  }

  if (/^(mute|be quiet|stop talking|shush|shh+|voice off|sound off|silence)( please)?$/.test(clean)) {
    setMuted(true);
    botSay([{ type: "text", text: `Okay, ${state.userName}, I'll stay quiet. Type "unmute" or use the voice button to hear me again.` }]);
    return;
  }
  if (/^(unmute|voice on|sound on|speak|talk|speak again|talk to me)( please)?$/.test(clean)) {
    setMuted(false);
    botSay([{ type: "text", text: `My voice is back on, ${state.userName}!` }]);
    return;
  }

  if (/\b(drum tab|drum pads?|open (the )?drum)\b/.test(clean)) {
    switchTab("drum");
    return;
  }

  const drumKind = detectDrumCommand(tokens);
  if (drumKind) {
    replyDrum(drumKind);
    return;
  }

  if (/^(more|tell me more|tell me more about (it|that)|go on|continue|what else|next|then what|keep going|more please|and|yes|yeah|yep|ya|sure)$/.test(clean)) {
    replyMore();
    return;
  }

  // ---- Knowledge-base matching ----
  const canon = canonicalise(tokens);
  const ranked = scoreTopics(canon);
  const best = ranked[0];

  // Off-topic words win over a weak match ("what's the weather like?")
  const offTopic = tokens.some(w => OFF_TOPIC_WORDS.has(w));

  if (best.score >= MIN_MATCH_SCORE && !(offTopic && best.score <= WEIGHT.keyword)) {
    const runnerUp = ranked[1].score === best.score ? ranked[1].entry : null;
    // "you"/"your" without naming the drum means the question is about Rubi as a drum
    const aboutMe = tokens.some(w => ["you", "your", "yourself"].includes(w)) && !canon.includes("rebanaubi");
    answerTopic(best.entry, { note, alsoMatched: runnerUp, aboutMe });
    return;
  }

  // Only the drum itself was mentioned ("what is rebana ubi?", "tell me about rubi")
  if (canon.includes("rebanaubi") && !offTopic) {
    const aliasNote = rawTokens.includes("rubi") ? `(Rubi is also my name. It's short for rebana ubi!)` : null;
    answerTopic(findTopic("Overview") || KNOWLEDGE_BASE[0], { note: aliasNote || note });
    return;
  }

  // ---- Small talk ----
  if (/^(hi+|hello+|hey+|hai|hallo|helo|yo|salam|assalamualaikum|good (morning|afternoon|evening|day))\b/.test(clean)) {
    botSay([{ type: "text", text: `${timeGreeting()}, ${state.userName}! What would you like to know about the rebana ubi?` }]);
    return;
  }
  if (/\bhow are you\b|\bhow is it going\b|\bapa khabar\b/.test(clean)) {
    botSay([{ type: "text", text: `I'm in great rhythm, thanks for asking, ${state.userName}! What shall we explore about the rebana ubi?` }]);
    return;
  }
  if (/\b(thanks|thank you|terima kasih|cheers|appreciate)\b/.test(clean)) {
    botSay([{ type: "text", text: `You're welcome, ${state.userName}! ${state.lastTopic ? suggestionText(state.lastTopic) : "Ask me anything else about the rebana ubi."}` }]);
    return;
  }
  if (/\b(bye|goodbye|see you|see ya|farewell|good night|selamat tinggal|exit|quit)\b/.test(clean)) {
    botSay([{ type: "text", text: `Goodbye, ${state.userName}! Thanks for learning about the rebana ubi with me${state.lastTopic ? `. I enjoyed our chat about ${state.lastTopic.topic.toLowerCase()}` : ""}. Come back any time!` }]);
    return;
  }
  if (/^(ok|okay|cool|nice|great|wow|interesting|i see|alright|awesome|got it|oh|hmm+|noted)$/.test(clean)) {
    botSay([{ type: "text", text: state.lastTopic
      ? `Glad you like it, ${state.userName}! Type "tell me more" and I'll move on to ${unvisitedRelated(state.lastTopic)[0]}, or ask me something else.`
      : `What would you like to explore, ${state.userName}? Type "menu" to see my topics.` }]);
    return;
  }
  if (/^(no|nope|nah|not really|no thanks)$/.test(clean)) {
    botSay([{ type: "text", text: `No problem, ${state.userName}. Ask me anything else about the rebana ubi whenever you're ready.` }]);
    return;
  }

  // ---- Clearly off-topic ----
  if (offTopic) {
    botSay([{ type: "text", text: `That sounds interesting, ${state.userName}, but it's outside my drum circle! I'm only an expert on the rebana ubi. You could ask me how it's made or where it's played.` }]);
    state.fallbackCount++;
    return;
  }

  replyFallback(note);
}

/**
 * Check a name. Rejects empty input, digits only, more than 30 characters
 * and symbols. Also pulls the name out of "my name is ...", "I'm ..." etc.
 */
function validateName(input) {
  let name = String(input).trim().replace(/\s+/g, " ");
  const intro = name.match(/^(?:(?:hi|hello|hey)[,!.\s]+)?(?:my name is|my name's|i am|i'm|im|call me|it's|its|this is)\s+(.+)$/i);
  if (intro) name = intro[1];
  name = name.replace(/[.!,]+$/, "").trim();

  if (name === "") {
    return { ok: false, message: "I didn't catch a name there. The message was empty. What should I call you?" };
  }
  if (/^[\d\s]+$/.test(name)) {
    return { ok: false, message: "That looks like a number rather than a name. Please type your name using letters, for example Aisyah." };
  }
  if (name.length > NAME_MAX_LENGTH) {
    return { ok: false, message: `That name is ${name.length} characters long. Please keep it to ${NAME_MAX_LENGTH} characters or fewer. A nickname is fine!` };
  }
  if (!/^\p{L}[\p{L}\s'.-]*$/u.test(name)) {
    return { ok: false, message: "Names can only contain letters, spaces, hyphens (-), apostrophes (') and full stops. Please try again." };
  }

  // Capitalise the first letter of each word, keep the rest as typed
  name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { ok: true, name };
}

/** Stage 1: the reply to "what's your name?" */
function handleNameAnswer(rawText) {
  const trimmed = String(rawText).trim();
  const tokens = normalise(trimmed);

  // A greeting instead of a name
  if (/^(hi+|hello+|hey+|hai|hallo|salam|assalamualaikum|good (morning|afternoon|evening))$/.test(tokens.join(" "))) {
    botSay([{ type: "text", text: "Hello to you too! What should I call you?" }]);
    return;
  }

  // A question instead of a name: keep it and answer after the name
  const mentionsDrum = tokens.some(w => ["rebana", "ubi", "rubi", "drum", "drums"].includes(w));
  if (/\?$/.test(trimmed) || (QUESTION_WORDS.has(tokens[0]) && tokens.length > 2) || mentionsDrum) {
    state.pendingQuestion = trimmed;
    botSay([{ type: "text", text: "That sounds like a question! I'll answer it as soon as I know who I'm talking to. What's your name?" }]);
    return;
  }

  const result = validateName(trimmed);
  if (!result.ok) {
    botSay([{ type: "text", text: result.message }]);
    return;
  }

  state.userName = result.name;
  state.stage = "chat";
  showMenu(`Nice to meet you, ${state.userName}! Here's what I can tell you about:`);

  if (state.pendingQuestion) {
    const question = state.pendingQuestion;
    state.pendingQuestion = null;
    botSay([{ type: "text", text: `Now, back to your question: "${question}"` }]);
    handleUserMessage(question);
  }
}

/** Typed drum command? Returns "inner" | "outer" | "rhythm" | null. */
function detectDrumCommand(tokens) {
  if (tokens.some(w => QUESTION_WORDS.has(w))) return null;      // "how do you play the drum?" is a question
  const hasVerb = tokens.some(w => DRUM_VERBS.has(w));
  const hasObject = tokens.some(w => DRUM_OBJECTS.has(w));
  if (!hasVerb || !(hasObject || tokens.length <= 2)) return null;

  if (tokens.some(w => ["rhythm", "pattern", "song", "music", "tune", "groove"].includes(w))) return "rhythm";
  if (tokens.some(w => ["outer", "edge", "rim", "side", "high", "sharp", "treble"].includes(w))) return "outer";
  return "inner";      // "hit the drum", "inner", "centre", "middle", "low"…
}

/* =====================================================================
 * 6. REPLIES
 * ===================================================================== */

function findTopic(name) {
  return KNOWLEDGE_BASE.find(e => e.topic === name);
}

function pick(options) {
  return options[Math.floor(Math.random() * options.length)];
}

/** "A", "A or B", "A, B or C" */
function joinOr(items) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + " or " + items[items.length - 1];
}

function isPlaceholder(text) {
  return /^PLACEHOLDER/i.test(String(text));
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Related topics not yet visited (falls back to all related topics). */
function unvisitedRelated(entry) {
  const fresh = entry.related.filter(t => !state.visited.has(t));
  return fresh.length ? fresh : entry.related.slice();
}

/** Follow-up line built from the topic's `related` links (semantic network). */
function suggestionText(entry, extra) {
  let options = unvisitedRelated(entry);
  if (extra && !options.includes(extra.topic)) options = [extra.topic].concat(options);
  return `You could ask me next about ${joinOr(options.slice(0, 3))}, or type "tell me more".`;
}

function correctionNote(corrections) {
  if (!corrections.length) return null;
  const list = corrections.map(c => `"${c.from}" as "${c.to}"`).join(", ");
  return `(I read ${list}.)`;
}

/** Topic name for use inside a sentence: "History" -> "history". */
function topicPhrase(entry) {
  if (entry === KNOWLEDGE_BASE[0]) return "the rebana ubi";   // the Overview topic
  return entry.topic.charAt(0).toLowerCase() + entry.topic.slice(1);
}

/** Answer one knowledge-base topic, personalised with the name and last topic. */
function answerTopic(entry, options = {}) {
  const name = state.userName;
  const previous = state.lastTopic;
  const about = topicPhrase(entry);
  let lead;

  if (options.viaMore && previous) {
    lead = `Since we just covered ${topicPhrase(previous)}, let's move on to ${about}, ${name}.`;
  } else if (options.aboutMe) {
    // The user asked Rubi about itself ("what are you made of?"): Rubi is a rebana ubi
    lead = `I'm a rebana ubi myself, ${name}, so here's what I can tell you about ${about}.`;
  } else if (previous === entry) {
    lead = `We just looked at ${about}, ${name}, but here it is again.`;
  } else if (previous && previous.related.includes(entry.topic)) {
    lead = `Nice link from ${topicPhrase(previous)}, ${name}! Here's what I know about ${about}.`;
  } else {
    lead = pick([
      `Good question, ${name}! Here's what I know about ${about}.`,
      `Sure, ${name}. Let's talk about ${about}.`,
      `Great choice, ${name}. Here's what I know about ${about}.`
    ]);
  }

  const parts = [];
  if (options.note) parts.push({ type: "note", text: options.note });
  parts.push({ type: "text", text: lead });
  parts.push({
    type: "answer",
    text: entry.answer,
    placeholder: isPlaceholder(entry.answer),
    speech: isPlaceholder(entry.answer)
      ? `My team is still researching the verified answer about ${entry.topic}.`
      : entry.answer
  });
  parts.push({ type: "source", text: entry.source });

  state.lastTopic = entry;
  state.visited.add(entry.topic);
  state.fallbackCount = 0;

  parts.push({ type: "suggest", text: suggestionText(entry, options.alsoMatched) });
  botSay(parts);
}

/** "tell me more": walk to the next linked topic in the semantic network. */
function replyMore() {
  if (!state.lastTopic) {
    showMenu(`Happy to, ${state.userName}! Pick any topic and ask about it in your own words:`);
    return;
  }
  const next = findTopic(unvisitedRelated(state.lastTopic)[0]);
  if (!next) {
    showMenu(`Here are all my topics, ${state.userName}:`);
    return;
  }
  answerTopic(next, { viaMore: true });
}

function replyLastTopic() {
  if (!state.lastTopic) {
    botSay([{ type: "text", text: `We haven't picked a topic yet, ${state.userName}. Type "menu" to see what I know.` }]);
    return;
  }
  botSay([{ type: "text", text: `We were talking about ${state.lastTopic.topic}, ${state.userName}. ${suggestionText(state.lastTopic)}` }]);
}

function showMenu(intro) {
  botSay([
    { type: "text", text: intro },
    { type: "list", items: KNOWLEDGE_BASE.map(e => e.topic), speech: "" },
    { type: "text", text: `Just ask in your own words, for example "How is the rebana ubi made?" or "Why is it called ubi?". To play the drum, open the "Play the drum" tab or type "hit the drum".` }
  ]);
}

function replySources() {
  const anyPlaceholder = SOURCES.some(s => isPlaceholder(s.apa));
  botSay([
    { type: "text", text: `These are the sources my team is using, ${state.userName}:` },
    { type: "list", items: SOURCES.map(s => `[${s.id}] ${s.apa.replace(/^PLACEHOLDER \((.*)\)$/, "$1")}: ${s.url}`), speech: "" },
    anyPlaceholder
      ? { type: "note", text: "(Full APA 7th references are still being added.)" }
      : { type: "text", text: "Ask me about any topic and I'll show the source for that answer." }
  ]);
}

function replyRuby(tokens) {
  const name = state.userName;
  let text;
  if (tokens.some(w => CODE_WORDS.has(w))) {
    text = `I think you mean Ruby the programming language, ${name}! I'm ${BOT_NAME} with an "i", short for rebana ubi, so coding is outside my expertise. I'm happy to talk drums, though: try asking how the rebana ubi is played.`;
  } else if (tokens.includes("rubies") || tokens.some(w => GEM_WORDS.has(w))) {
    text = `Ah, the ruby gemstone! It's a lovely jewel, ${name}, but I'm ${BOT_NAME} with an "i", short for rebana ubi, so gems are outside my expertise. I can tell you about the drum instead: try asking about its history or how it's made.`;
  } else {
    text = `Did you mean me? I'm ${BOT_NAME}, spelled with an "i", short for rebana ubi. If you meant the ruby gemstone, that's outside my expertise, ${name}, but ask me anything about the drum!`;
  }
  state.fallbackCount = 0;
  botSay([{ type: "text", text }]);
}

/** Typed drum command: play the sound, then report what actually happened. */
function replyDrum(kind) {
  const sound = DRUM_SOUNDS[kind];
  playDrum(kind).then(result => {
    let text;
    if (result === "sample") {
      text = `Here's the ${sound.label}! For more, open the "Play the drum" tab, ${state.userName}.`;
    } else if (result === "synth") {
      text = `Here's the ${sound.label}, ${state.userName}! My real recordings aren't loaded yet, so that was a synthesised stand-in.`;
    } else {
      text = `Sorry ${state.userName}, I can't play sounds in this browser. You can still ask me all about the drum, though!`;
    }
    botSay([{ type: "text", text }, { type: "suggest", text: `Curious how it's really played? Ask me about playing technique.` }]);
  });
}

const FALLBACKS = [
  name => `Sorry ${name}, I didn't quite catch that. I'm best at questions about the rebana ubi, such as how it's made or how it's played.`,
  name => `Hmm, I'm not sure how to answer that, ${name}. Could you ask it another way? For example: "What is it made of?"`,
  name => `That one's beyond my drumsticks, ${name}! I only know about the rebana ubi.`
];

/** Nothing matched: rotate fallbacks, use the last topic, show the menu after repeats. */
function replyFallback(note) {
  const name = state.userName;
  const parts = [];
  if (note) parts.push({ type: "note", text: note });
  parts.push({ type: "text", text: FALLBACKS[state.fallbackCount % FALLBACKS.length](name) });
  if (state.lastTopic) {
    parts.push({ type: "suggest", text: `We were just talking about ${state.lastTopic.topic}. ${suggestionText(state.lastTopic)}` });
  }
  state.fallbackCount++;
  botSay(parts);

  if (state.fallbackCount >= 3) {
    state.fallbackCount = 0;
    showMenu("Here's my topic list again in case it helps:");
  }
}

/* =====================================================================
 * 7. SPEECH — speechSynthesis with mute toggle
 *    Adapted from the examples in [R3]. Browsers may block speech until the
 *    user has clicked or pressed a key [R6][R7], so early messages are
 *    queued and spoken on the first interaction.
 * ===================================================================== */
const speech = {
  supported: false,
  muted: false,
  unlocked: true,
  voice: null,
  pending: [],
  idleTimer: null
};

function initSpeech() {
  speech.supported = "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
  try {
    speech.muted = localStorage.getItem("rubi-muted") === "true";
  } catch (err) {
    speech.muted = false;    // storage blocked (private window); not important
  }
  updateMuteButton();

  if (!speech.supported) {
    ui.muteBtn.disabled = true;
    setVoiceStatus("Voice isn't supported in this browser, so I'll reply in text only.");
    return;
  }

  try {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;   // voices load asynchronously in Chrome
  } catch (err) {
    console.warn("Could not load speech voices:", err);
  }

  // Before the first click/key press, Chrome refuses to speak [R6][R7]
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) speech.unlocked = false;
  ["pointerdown", "keydown"].forEach(evt => document.addEventListener(evt, unlockSpeech));
}

/** Prefer an English voice; keep the browser default otherwise. */
function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  speech.voice = voices.find(v => /^en-GB/i.test(v.lang)) ||
                 voices.find(v => /^en/i.test(v.lang)) || null;
}

function unlockSpeech() {
  if (speech.unlocked) return;
  speech.unlocked = true;
  setVoiceStatus("");
  const queued = speech.pending.splice(0).slice(-3);   // only the latest few, not a long backlog
  queued.forEach(speak);
}

/** Strip emoji and URLs that sound odd when read aloud. */
function cleanForSpeech(text) {
  return String(text)
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function speak(text) {
  if (!speech.supported || speech.muted) return;
  const clean = cleanForSpeech(text);
  if (!clean) return;

  if (!speech.unlocked) {
    speech.pending.push(clean);
    setVoiceStatus("Click anywhere or press a key to hear my voice.");
    return;
  }

  try {
    // Speak sentence by sentence: Chrome can cut off long utterances
    const sentences = clean.match(/[^.!?]+[.!?]*/g) || [clean];
    sentences.forEach(sentence => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());
      if (speech.voice) utterance.voice = speech.voice;
      utterance.lang = speech.voice ? speech.voice.lang : "en-GB";
      utterance.rate = 1;
      utterance.pitch = 1.1;
      utterance.onstart = () => setSpeaking(true, sentence.trim());
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = event => {
        setSpeaking(false);
        if (event.error === "not-allowed") {
          speech.unlocked = false;
          speech.pending.push(sentence.trim());
          setVoiceStatus("Click anywhere or press a key to hear my voice.");
        } else if (event.error !== "interrupted" && event.error !== "canceled") {
          console.warn("Speech error:", event.error);
        }
      };
      window.speechSynthesis.speak(utterance);
    });
  } catch (err) {
    console.warn("Speech failed:", err);
    setVoiceStatus("Sorry, my voice isn't working right now. My text replies still work.");
  }
}

function stopSpeaking() {
  if (!speech.supported) return;
  try {
    window.speechSynthesis.cancel();
  } catch (err) {
    console.warn("Could not stop speech:", err);
  }
  setSpeaking(false);
}

function setMuted(muted) {
  speech.muted = muted;
  if (muted) {
    speech.pending = [];
    stopSpeaking();
  }
  try {
    localStorage.setItem("rubi-muted", String(muted));
  } catch (err) { /* storage blocked; the setting just won't be remembered */ }
  updateMuteButton();
}

function updateMuteButton() {
  ui.muteBtn.setAttribute("aria-pressed", String(speech.muted));
  ui.muteBtn.textContent = speech.muted ? "🔇 Voice off" : "🔊 Voice on";
  ui.muteBtn.title = speech.muted ? "Turn Rubi's voice on" : "Mute Rubi's voice";
}

/** Avatar animation + caption while speaking. */
function setSpeaking(isSpeaking, sentence) {
  clearTimeout(speech.idleTimer);
  if (isSpeaking) {
    ui.avatarPanel.classList.add("is-speaking");
    if (sentence) ui.caption.textContent = sentence;
  } else {
    // short delay so the animation doesn't flicker between sentences
    speech.idleTimer = setTimeout(() => {
      if (!speech.supported || !window.speechSynthesis.speaking) ui.avatarPanel.classList.remove("is-speaking");
    }, 200);
  }
}

function setVoiceStatus(text) {
  ui.voiceStatus.textContent = text;
}

/* =====================================================================
 * 8. DRUM AUDIO — recorded samples, with a synthesised stand-in
 *    Sample playback follows the play() promise pattern in [R4].
 *    The stand-in drum hit is adapted from the oscillator/gain examples
 *    in [R5].
 * ===================================================================== */
let audioCtx = null;

/**
 * Play a drum sound. Resolves to "sample" (recording played),
 * "synth" (stand-in played) or "none" (no audio support).
 */
function playDrum(kind) {
  const sound = DRUM_SOUNDS[kind] || DRUM_SOUNDS.inner;
  flashPad(kind);

  return new Promise(resolve => {
    let settled = false;
    const useFallback = reason => {
      if (settled) return;
      settled = true;
      console.warn(`Drum sample "${sound.file}" could not play:`, reason);
      try {
        playSynth(sound);
        setPadStatus(`Playing a synthesised stand-in: ${sound.file} isn't available yet.`);
        resolve("synth");
      } catch (err) {
        console.warn("Web Audio fallback failed:", err);
        setPadStatus("Sorry, this browser can't play sounds.");
        resolve("none");
      }
    };

    try {
      if (typeof Audio === "undefined") throw new Error("HTML audio is not supported");
      const audio = new Audio(sound.file);
      audio.addEventListener("error", () => useFallback("file missing or unreadable"));
      const playing = audio.play();
      if (playing && typeof playing.then === "function") {
        playing.then(() => {
          if (settled) return;
          settled = true;
          setPadStatus("");
          resolve("sample");
        }).catch(useFallback);
      } else {
        settled = true;           // very old browsers: play() returns nothing
        resolve("sample");
      }
    } catch (err) {
      useFallback(err);
    }
  });
}

/** Stand-in drum hits made with the Web Audio API. Throws if unsupported. */
function playSynth(sound) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("Web Audio API is not supported");
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === "suspended") audioCtx.resume();

  const start = audioCtx.currentTime + 0.02;
  sound.synth.forEach(hit => synthHit(start + hit.t, hit.f));
}

/** One drum hit: a sine wave that drops in pitch and fades out quickly. */
function synthHit(time, freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const decay = freq < 150 ? 0.7 : 0.35;

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 1.6, time);
  osc.frequency.exponentialRampToValueAtTime(freq, time + 0.08);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.9, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + decay + 0.05);
}

function flashPad(kind) {
  const pad = document.querySelector(`#panelDrum [data-sound="${kind}"]`);
  [pad, ui.avatarPanel].forEach(el => {
    if (!el) return;
    el.classList.remove("is-hit");
    void el.offsetWidth;             // restart the CSS animation
    el.classList.add("is-hit");
  });
}

function setPadStatus(text) {
  ui.padStatus.textContent = text;
}

/* =====================================================================
 * 9. CHAT WINDOW RENDERING
 *    Messages are built with textContent (never innerHTML), so anything
 *    the user types is shown as plain text.
 * ===================================================================== */
const ui = {};
let botQueue = Promise.resolve();      // keeps bot messages in order

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Text with clickable links for any http(s) URLs. */
function linkify(text) {
  const fragment = document.createDocumentFragment();
  String(text).split(/(https?:\/\/\S+)/g).forEach(piece => {
    if (/^https?:\/\//.test(piece)) {
      const a = el("a", null, piece);
      a.href = piece;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      fragment.append(a);
    } else if (piece) {
      fragment.append(document.createTextNode(piece));
    }
  });
  return fragment;
}

function timeStamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function scrollToBottom() {
  ui.chatLog.scrollTop = ui.chatLog.scrollHeight;
}

function addUserMessage(text) {
  const row = el("div", "msg msg--user");
  const bubble = el("div", "bubble");
  bubble.append(el("p", null, text));
  bubble.append(el("span", "msg-time", timeStamp()));
  row.append(bubble);
  ui.chatLog.append(row);
  scrollToBottom();
}

/** Draw one bot message made of parts: text, answer, list, source, suggest, note. */
function renderBotMessage(parts) {
  const row = el("div", "msg msg--bot");
  const avatar = el("img", "msg-avatar");
  avatar.src = "assets/avatar.png";
  avatar.alt = "";
  avatar.onerror = () => avatar.remove();
  row.append(avatar);

  const bubble = el("div", "bubble");
  bubble.append(el("span", "msg-name", BOT_NAME));

  parts.forEach(part => {
    if (part.type === "list") {
      const ul = el("ul", "topic-list");
      part.items.forEach(item => {
        const li = el("li");
        li.append(linkify(item));
        ul.append(li);
      });
      bubble.append(ul);
    } else if (part.type === "answer") {
      const p = el("p", "answer" + (part.placeholder ? " answer--placeholder" : ""));
      if (part.placeholder) p.append(el("span", "badge", "Placeholder"));
      p.append(document.createTextNode(part.placeholder ? part.text.replace(/^PLACEHOLDER:?\s*/i, "") : part.text));
      bubble.append(p);
    } else if (part.type === "source") {
      // Several references are separated by " | " in knowledge.js
      const refs = String(part.text).split(" | ");
      const box = el("div", "source" + (isPlaceholder(part.text) ? " source--placeholder" : ""));
      box.append(el("strong", null, refs.length > 1 ? "Sources:" : "Source:"));
      const ul = el("ul", "source-list");
      refs.forEach(ref => {
        const li = el("li");
        li.append(linkify(ref));
        ul.append(li);
      });
      box.append(ul);
      bubble.append(box);
    } else {
      // "text", "suggest" and "note"
      const p = el("p", part.type === "text" ? null : part.type);
      p.append(linkify(part.text));
      bubble.append(p);
    }
  });

  bubble.append(el("span", "msg-time", timeStamp()));
  row.append(bubble);
  ui.chatLog.append(row);
  scrollToBottom();
}

/** What Rubi says aloud for a message (sources, notes and links are skipped). */
function speechFor(parts) {
  return parts
    .filter(p => ["text", "answer", "suggest"].includes(p.type) || (p.type === "list" && p.speech))
    .map(p => (p.speech !== undefined ? p.speech : p.text))
    .join(" ");
}

function showTyping() {
  const row = el("div", "msg msg--bot typing");
  row.setAttribute("aria-label", `${BOT_NAME} is typing`);
  const bubble = el("div", "bubble");
  for (let i = 0; i < 3; i++) bubble.append(el("span", "dot"));
  row.append(bubble);
  ui.chatLog.append(row);
  scrollToBottom();
  return row;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Queue a bot message: typing dots, then the message, then speech. */
function botSay(parts) {
  botQueue = botQueue.then(async () => {
    const length = parts.reduce((sum, p) => sum + String(p.text || "").length, 0);
    const typing = showTyping();
    await wait(350 + Math.min(length * 8, 900));
    typing.remove();
    renderBotMessage(parts);

    const spoken = speechFor(parts);
    if (spoken) {
      ui.caption.textContent = cleanForSpeech(spoken);
      speak(spoken);
    }
  }).catch(err => console.error("Could not show message:", err));
  return botQueue;
}

/* =====================================================================
 * 10. START-UP
 * ===================================================================== */
function bindUi() {
  ui.chatLog = document.getElementById("chatLog");
  ui.form = document.getElementById("chatForm");
  ui.input = document.getElementById("userInput");
  ui.muteBtn = document.getElementById("muteBtn");
  ui.voiceStatus = document.getElementById("voiceStatus");
  ui.caption = document.getElementById("speechCaption");
  ui.avatarPanel = document.getElementById("avatarPanel");
  ui.avatarImg = document.getElementById("avatarImg");
  ui.padStatus = document.getElementById("padStatus");

  // Bot name in the page title and headers
  document.title = `${BOT_NAME} | Rebana Ubi Guide`;
  document.querySelectorAll("[data-bot-name]").forEach(node => { node.textContent = BOT_NAME; });

  // Missing avatar file: show the bot's initial instead of a broken image
  ui.avatarImg.addEventListener("error", () => {
    ui.avatarImg.replaceWith(el("div", "avatar-fallback", BOT_NAME.charAt(0)));
  });

  ui.form.addEventListener("submit", event => {
    event.preventDefault();
    const text = ui.input.value;
    ui.input.value = "";

    if (text.trim() === "") {
      // The empty-name rule needs a reply; in normal chat, just nudge.
      if (state.stage === "askName") handleNameAnswer("");
      else botSay([{ type: "text", text: `Type a question about the rebana ubi, ${state.userName}, or "menu" to see my topics.` }]);
      return;
    }

    stopSpeaking();
    addUserMessage(text);
    try {
      handleUserMessage(text);
    } catch (err) {
      console.error(err);
      botSay([{ type: "text", text: "Oops, something went wrong on my side. Could you try asking that another way?" }]);
    }
  });

  ui.muteBtn.addEventListener("click", () => setMuted(!speech.muted));

  // The drum zones (inner, outer) and the rhythm button
  document.querySelectorAll("#panelDrum [data-sound]").forEach(pad => {
    pad.addEventListener("click", () => playDrum(pad.dataset.sound));
  });

  // Tabs: click, or Left/Right arrow keys between the tab buttons
  ui.tabs = { chat: document.getElementById("tabChat"), drum: document.getElementById("tabDrum") };
  Object.keys(ui.tabs).forEach(name => {
    ui.tabs[name].addEventListener("click", () => switchTab(name));
    ui.tabs[name].addEventListener("keydown", event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const next = name === "chat" ? "drum" : "chat";
        switchTab(next);
        ui.tabs[next].focus();
      }
    });
  });

  // Keyboard drum: A = outer, S = inner, D = rhythm while the Drum tab is open
  const PAD_KEYS = { a: "outer", s: "inner", d: "rhythm" };
  document.addEventListener("keydown", event => {
    const drumOpen = !document.getElementById("panelDrum").hidden;
    const kind = PAD_KEYS[event.key.toLowerCase()];
    if (!drumOpen || !kind || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof HTMLInputElement) return;   // never steal typing
    event.preventDefault();
    playDrum(kind);
  });
}

/** Show the "chat" or "drum" tab. */
function switchTab(name) {
  Object.keys(ui.tabs).forEach(tabName => {
    const selected = tabName === name;
    const tab = ui.tabs[tabName];
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
  });
  if (name === "chat") {
    ui.input.focus();
    scrollToBottom();
  } else if (document.activeElement === ui.input) {
    ui.tabs.drum.focus();     // leave the hidden text box so the A/S/D keys work
  }
}

function startConversation() {
  botSay([{ type: "text", text: `${timeGreeting()}! I'm ${BOT_NAME}, short for "rebana ubi". I'm your guide to the rebana ubi, the traditional Malay drum.` }]);
  botSay([{ type: "text", text: "Before we begin, what's your name?" }]);
  ui.input.focus();
}

bindUi();
buildIndexes();
initSpeech();
window.addEventListener("load", startConversation);   // Rubi speaks first
