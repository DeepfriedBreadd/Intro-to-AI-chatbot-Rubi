/* =====================================================================
 * knowledge.js — Rubi's knowledge base (the "expert" part of the system)
 * ---------------------------------------------------------------------
 * Loaded with a plain <script> tag BEFORE bot.js, so the constants below
 * become globals that bot.js can read. No fetch(), no server needed.
 *
 * Contents
 *   1. SYNONYM_GROUPS  – word groups used by the NLP layer. Every variant
 *                        is rewritten to its canonical word before matching.
 *   2. KNOWLEDGE_BASE  – one object per topic:
 *        topic    : display name, also used as the node name in `related`
 *        keywords : core words for the topic (strong match, weight 3)
 *        synonyms : extra words/phrases users may type (weaker match, weight 2)
 *        related  : links to other topics = edges of the Chapter 2
 *                   semantic network. Rubi suggests these as follow-ups.
 *        answer   : the reply text
 *        source   : APA 7th reference for the answer
 *   3. SOURCES        – the sources from "Source Links.txt".
 *
 * ABOUT THE CONTENT
 *   Answers are written from the sources in Source Links.txt (read on
 *   29 October 2026) and paraphrased into plain English. Each `source`
 *   lists the APA 7th references the answer draws on, separated by " | ".
 *   Where sources disagree (e.g. size), the answer says so. Check every
 *   answer against your own reading before submission.
 * ===================================================================== */

/* ---------------------------------------------------------------------
 * 1. SYNONYM GROUPS
 *    canonical word : [variants the user might type]
 *    Multi-word variants ("made of") are matched as phrases first, so
 *    "what is it made of" becomes "what is it material" and not "make".
 *    A few Malay words are included for local users.
 * ------------------------------------------------------------------- */
const SYNONYM_GROUPS = {
  rebanaubi:    ["rebana ubi", "rebana-ubi", "rebana", "rubi", "this drum", "the drum", "drum", "drums", "instrument", "gendang"],
  history:      ["history", "historical", "origin", "origins", "originate", "originated", "past", "background", "ancient", "invented", "beginning", "began", "sejarah", "asal"],
  name:         ["name", "named", "called", "etymology", "meaning", "means", "mean", "term", "nama", "maksud"],
  region:       ["region", "regions", "state", "states", "location", "located", "place", "places", "area", "areas", "negeri", "come from", "comes from", "came from"],
  part:         ["part", "parts", "component", "components", "structure", "anatomy", "piece", "pieces", "body", "shell", "bahagian"],
  material:     ["material", "materials", "made of", "made from", "made out of", "wood", "wooden", "timber", "hide", "leather", "kayu", "kulit", "bahan"],
  size:         ["size", "sizes", "big", "large", "huge", "heavy", "weight", "weigh", "weighs", "tall", "height", "diameter", "dimension", "dimensions", "saiz", "berat", "besar"],
  make:         ["make", "made", "making", "makes", "build", "built", "building", "construct", "constructed", "construction", "craft", "crafted", "crafting", "produce", "produced", "manufacture", "buat", "membuat"],
  craftsman:    ["craftsman", "craftsmen", "craftsperson", "maker", "makers", "artisan", "artisans", "master craftsman", "master craftsmen", "builder", "builders", "tukang", "pembuat", "adiguru"],
  decoration:   ["decoration", "decorations", "decorate", "decorated", "design", "designs", "paint", "painted", "colour", "colours", "color", "colors", "motif", "motifs", "ornament", "ornaments", "carving", "carvings", "hiasan", "corak"],
  sound:        ["sound", "sounds", "tone", "tones", "pitch", "loud", "loudness", "volume", "noise", "boom", "bunyi"],
  tuning:       ["tuning", "tune", "tuned", "tighten", "tightened", "tension", "wedge", "wedges", "adjust", "adjusted"],
  play:         ["play", "playing", "played", "plays", "player", "players", "technique", "techniques", "stroke", "strokes", "drumming", "drummer", "drummers", "bermain", "palu", "pukul"],
  rhythm:       ["rhythm", "rhythms", "pattern", "patterns", "beat", "beats", "tempo", "groove", "irama", "rentak"],
  performance:  ["performance", "performances", "perform", "performed", "ensemble", "troupe", "competition", "competitions", "contest", "festival", "festivals", "event", "events", "occasion", "occasions", "ceremony", "ceremonies", "celebration", "pertandingan", "persembahan", "pesta"],
  significance: ["significance", "significant", "culture", "cultural", "importance", "important", "role", "symbol", "symbolic", "symbolism", "heritage", "identity", "budaya", "warisan"],
  preservation: ["preservation", "preserve", "preserved", "conserve", "conservation", "survive", "survival", "nowadays", "modern", "future", "endangered", "decline", "protect", "revive", "revival", "sustain", "pemuliharaan"],
  museum:       ["museum", "museums", "muzium", "exhibit", "exhibition", "display", "displayed", "collection", "collections", "gallery", "see one", "see it", "view one"],
  learn:        ["learn", "learning", "lesson", "lessons", "class", "classes", "teach", "teacher", "course", "courses", "beginner", "beginners", "practice", "practise", "belajar", "kelas"]
};

/* ---------------------------------------------------------------------
 * 2. KNOWLEDGE BASE
 *    `related` must use the exact `topic` names below. bot.js checks the
 *    links on load and warns in the browser console if one is wrong.
 *    Update the links so they match your Chapter 2 semantic network.
 * ------------------------------------------------------------------- */
const KNOWLEDGE_BASE = [
  {
    topic: "Overview",
    keywords: ["overview", "introduction", "intro", "definition", "define", "describe", "description", "basics", "general"],
    synonyms: ["explain", "summary", "in general", "general information"],
    related: ["Name and meaning", "History", "Parts", "Playing technique"],
    answer: "The rebana ubi is a large traditional Malay drum from Kelantan, on the east coast of Peninsular Malaysia. It is a membranophone: a single face of buffalo hide stretched over a hollow wooden body. It is the largest drum in the rebana family and the only one brightly decorated on both its body and its face. It is played in groups for celebrations, especially after the rice harvest, as well as for ceremonies and competitions.",
    source: "PUSAKA. (n.d.). Rebana ubi (Kelantan). Retrieved October 29, 2026, from https://www.pusaka.org/communities-rebana-ubi | Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/ | Dewan Bahasa dan Pustaka. (n.d.). Ubi. In Pusat Rujukan Persuratan Melayu. Retrieved October 29, 2026, from https://prpm.dbp.gov.my/Cari1?d=371752&keyword=Ubi"
  },
  {
    topic: "Name and meaning",
    keywords: ["name", "ubi", "etymology"],
    synonyms: ["why ubi", "why is it called", "what does ubi", "word"],
    related: ["Overview", "Parts", "History"],
    answer: "In the Kamus Dewan dictionary, \"ubi\" means a tuber or edible root, as in ubi kayu (cassava). The word \"rebana\" may come from the Arabic \"rabbana\", meaning \"our Lord\" (Pauline Fan, 2014, as cited in Siti Hajar Abdul Halim, 2024). DBP's term list describes the rebana ubi as a one-faced drum shaped like a vase. None of the sources I have explains exactly why the drum is called \"ubi\", so treat any explanation you hear with care.",
    source: "Dewan Bahasa dan Pustaka. (n.d.). Ubi. In Pusat Rujukan Persuratan Melayu. Retrieved October 29, 2026, from https://prpm.dbp.gov.my/Cari1?d=371752&keyword=Ubi | Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/"
  },
  {
    topic: "History",
    keywords: ["history"],
    synonyms: ["how old", "when was", "long ago", "evolve", "evolved", "develop", "developed"],
    related: ["Region", "Cultural significance", "Craftsmen"],
    answer: "The rebana ubi is thought to date from around the 1890s, and its origins are linked to Islamic culture. It is said to have been brought to the Malay Peninsula by Arab traders when the region was a busy centre of trade. In the past it was a way to send messages: it was played on a hilltop with different beats for different news, such as a wedding invitation or a danger warning, and some accounts say it marked prayer times. Over time it became an instrument for entertainment, ceremonies and harvest festivals.",
    source: "Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/ | Akhi Sahrul. (n.d.). The uniqueness of rebana ubi Kelantan. Qiadah: Majalah Korporat PMBK, (17), 58. Retrieved October 29, 2026, from https://www.pmbk.gov.my/majalah_qiadah/online_read/qiadah_17/files/basic-html/page58.html | Kraftangan Malaysia. (n.d.-a). Allahyarham Tuan Haji Mahmood bin Abdul Latif: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/allahyarham-tuan-haji-mahmood-bin-abdul-latif"
  },
  {
    topic: "Region",
    keywords: ["region"],
    synonyms: ["where", "which state", "where is it from", "popular", "malaysia", "kelantan", "terengganu", "kota bharu", "pasir mas", "east coast"],
    related: ["History", "Performances and festivals", "Museums and collections"],
    answer: "The rebana ubi belongs to the east coast of Peninsular Malaysia, especially Kelantan, where it was seen as part of the state's identity. Communities that still make and play it include Kampung Baru Pupuk, home of master craftsman Mat Yaacob bin Awang Besar, and Banggol Perdana in Pasir Mas, home of the Amok Perdana group. Today it is often performed at Gelanggang Seni in Kota Bharu.",
    source: "PUSAKA. (n.d.). Rebana ubi (Kelantan). Retrieved October 29, 2026, from https://www.pusaka.org/communities-rebana-ubi | Akhi Sahrul. (n.d.). The uniqueness of rebana ubi Kelantan. Qiadah: Majalah Korporat PMBK, (17), 58. Retrieved October 29, 2026, from https://www.pmbk.gov.my/majalah_qiadah/online_read/qiadah_17/files/basic-html/page58.html | Kraftangan Malaysia. (n.d.-b). Encik Mat Yaacob bin Awang Besar: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/encik-mat-yaacob-bin-awang-besar"
  },
  {
    topic: "Parts",
    keywords: ["part"],
    synonyms: ["consist", "consists", "skin", "head", "rope", "rattan", "frame"],
    related: ["Materials", "Size and weight", "Tuning and sound", "Decoration"],
    answer: "A rebana ubi has nine main components: two layers of buffalo hide that form the drum face, a cover for the face, the temelang (the hollow wooden body), rattan, rope, the baji (wooden wedges), a stand for the drum and a holder for the wedges. The hide is tightened by 14 large wedges and 14 small wedges (baji anak), slotted between the body and a rattan ring at the bottom of the drum called the peleting.",
    source: "Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/"
  },
  {
    topic: "Materials",
    keywords: ["material"],
    synonyms: ["what kind of wood", "which wood", "type of wood", "animal", "buffalo", "merbau", "leban"],
    related: ["Parts", "Making the drum"],
    answer: "The body is cut from a block of merbau wood. Makers prefer merbau darah because it is dense, strong and does not rot easily. The face is the hide of a male buffalo over two years old: buffalo hide is thicker than cow hide, tears less easily and gives a better sound. The wedges are made of leban wood, and manau and sega emas rattan and nylon rope hold the hide in place. Master craftsman Mat Yaacob also lists tapang, mubor or laban wood for the body, plus paint for decoration.",
    source: "Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/ | Kraftangan Malaysia. (n.d.-b). Encik Mat Yaacob bin Awang Besar: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/encik-mat-yaacob-bin-awang-besar"
  },
  {
    topic: "Size and weight",
    keywords: ["size"],
    synonyms: ["how big", "how heavy", "how large", "measure", "measurement", "carry", "carried"],
    related: ["Parts", "Playing technique"],
    answer: "Sources give slightly different sizes. PUSAKA and PMBK's Qiadah magazine describe the drum as almost 1 metre high with a face about 70 cm across. The rebana ubi made by Mat Yaacob in Kraftangan Malaysia's collection is 78 cm high and 60 cm wide. In one study, the top of the body measured 76.2 cm (30 inches) across. The solid merbau body makes it heavy, but none of the sources I checked gives a reliable weight.",
    source: "PUSAKA. (n.d.). Rebana ubi (Kelantan). Retrieved October 29, 2026, from https://www.pusaka.org/communities-rebana-ubi | Akhi Sahrul. (n.d.). The uniqueness of rebana ubi Kelantan. Qiadah: Majalah Korporat PMBK, (17), 58. Retrieved October 29, 2026, from https://www.pmbk.gov.my/majalah_qiadah/online_read/qiadah_17/files/basic-html/page58.html | Kraftangan Malaysia. (n.d.-c). Koleksi kraf. Muzium Kraf. Retrieved October 29, 2026, from https://mycraftmuseum.com/koleksi-kraf/ | Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/"
  },
  {
    topic: "Making the drum",
    keywords: ["make"],
    synonyms: ["process", "steps", "how long", "procedure", "handmade"],
    related: ["Materials", "Craftsmen", "Decoration"],
    answer: "Making a rebana ubi takes skill and patience. The buffalo hide is dried in the sun for three to four days, pounded soft and punched with holes. A merbau block is turned on a lathe and hollowed out to form the body, and 14 large and 14 small wedges are cut from leban wood. The hide is then fitted, tied with nylon rope and rattan, and the wedges are hammered in while the maker tunes the drum. Tying the dried, stretched hide onto the body, called \"mengambil\", is the hardest step. Machines now help with cutting, but makers once used hand saws and axes, and an experienced maker could finish a drum in about a month.",
    source: "Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/ | Kraftangan Malaysia. (n.d.-b). Encik Mat Yaacob bin Awang Besar: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/encik-mat-yaacob-bin-awang-besar | Kraftangan Malaysia. (n.d.-a). Allahyarham Tuan Haji Mahmood bin Abdul Latif: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/allahyarham-tuan-haji-mahmood-bin-abdul-latif | PUSAKA. (n.d.). Rebana ubi (Kelantan). Retrieved October 29, 2026, from https://www.pusaka.org/communities-rebana-ubi"
  },
  {
    topic: "Craftsmen",
    keywords: ["craftsman"],
    synonyms: ["who makes", "who made", "who builds", "famous", "expert", "experts", "master", "pak mud", "mat yaacob", "mahmood", "pak isa"],
    related: ["Making the drum", "Preservation", "Museums and collections"],
    answer: "Kraftangan Malaysia has named two Kelantanese master craftsmen (Adiguru Kraf) of the rebana ubi. Allahyarham Tuan Haji Mahmood bin Abdul Latif (1930 to 1998), known as Pak Mud, learned the craft from his father, led the Kampung Sokor rebana group for about 15 years and was appointed in 1996. Encik Mat Yaacob bin Awang Besar, born in 1942 in Kampung Baru Pupuk, began playing at the age of 12 and was appointed in 2006. He is known for his skill at tying the hide onto the drum. In Pasir Mas, makers such as Pak Isa and the late Pak Ya have taught young people with the Amok Perdana group.",
    source: "Kraftangan Malaysia. (n.d.-a). Allahyarham Tuan Haji Mahmood bin Abdul Latif: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/allahyarham-tuan-haji-mahmood-bin-abdul-latif | Kraftangan Malaysia. (n.d.-b). Encik Mat Yaacob bin Awang Besar: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/encik-mat-yaacob-bin-awang-besar | PUSAKA. (n.d.). Rebana ubi (Kelantan). Retrieved October 29, 2026, from https://www.pusaka.org/communities-rebana-ubi"
  },
  {
    topic: "Decoration",
    keywords: ["decoration"],
    synonyms: ["look like", "looks like", "appearance", "beautiful", "pretty", "coat of arms", "crown", "kijang", "moon", "star"],
    related: ["Making the drum", "Cultural significance"],
    answer: "The rebana ubi is the only rebana decorated on both its body and its face. Drums are painted in bright colours with geometric or nature motifs. Many are topped with a large carved Kelantan coat of arms: a crown, a pair of kijang (barking deer), a crescent moon and a five-pointed star. Some drums carry the emblem of their group or village. Decoration also counts in competitions, where drums are judged on their decoration as well as their sound.",
    source: "PUSAKA. (n.d.). Rebana ubi (Kelantan). Retrieved October 29, 2026, from https://www.pusaka.org/communities-rebana-ubi | Dewan Bahasa dan Pustaka. (n.d.). Ubi. In Pusat Rujukan Persuratan Melayu. Retrieved October 29, 2026, from https://prpm.dbp.gov.my/Cari1?d=371752&keyword=Ubi | Kraftangan Malaysia. (n.d.-b). Encik Mat Yaacob bin Awang Besar: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/encik-mat-yaacob-bin-awang-besar | Akhi Sahrul. (n.d.). The uniqueness of rebana ubi Kelantan. Qiadah: Majalah Korporat PMBK, (17), 58. Retrieved October 29, 2026, from https://www.pmbk.gov.my/majalah_qiadah/online_read/qiadah_17/files/basic-html/page58.html"
  },
  {
    topic: "Tuning and sound",
    keywords: ["tuning", "sound"],
    synonyms: ["how does it sound", "what does it sound like", "how loud", "hear", "heard"],
    related: ["Parts", "Playing technique", "Rhythms"],
    answer: "The drum is tuned while the hide is being fitted. The maker ties the first layer of hide with nylon rope, slots in the 14 large and 14 small wedges, then strikes the skin until it gives the bright, ringing sound they want before tightening and knotting the rope. The second layer is tuned the same way, with the wedges hammered in to tighten the rattan. The rebana ubi is loud and its sound carries a long way, which is why it was once used to send messages between villages.",
    source: "Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/ | Kraftangan Malaysia. (n.d.-a). Allahyarham Tuan Haji Mahmood bin Abdul Latif: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/allahyarham-tuan-haji-mahmood-bin-abdul-latif"
  },
  {
    topic: "Playing technique",
    keywords: ["play"],
    synonyms: ["how to play", "how do you play", "how is it played", "hold", "position", "stick", "sticks", "hands"],
    related: ["Rhythms", "Tuning and sound", "Learning to play"],
    answer: "The rebana ubi is either hung up or stood upright on the ground, and the skin is struck with the hand or a padded beater. It is played in pairs, traditionally at night in the open. In competitions, two people play each drum, standing on either side of it: the player on the right strikes with the left hand, and the player on the left strikes with the right hand.",
    source: "Dewan Bahasa dan Pustaka. (n.d.). Ubi. In Pusat Rujukan Persuratan Melayu. Retrieved October 29, 2026, from https://prpm.dbp.gov.my/Cari1?d=371752&keyword=Ubi | Kraftangan Malaysia. (n.d.-a). Allahyarham Tuan Haji Mahmood bin Abdul Latif: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/allahyarham-tuan-haji-mahmood-bin-abdul-latif | Akhi Sahrul. (n.d.). The uniqueness of rebana ubi Kelantan. Qiadah: Majalah Korporat PMBK, (17), 58. Retrieved October 29, 2026, from https://www.pmbk.gov.my/majalah_qiadah/online_read/qiadah_17/files/basic-html/page58.html"
  },
  {
    topic: "Rhythms",
    keywords: ["rhythm"],
    synonyms: ["song", "songs", "music", "musical", "lagu"],
    related: ["Playing technique", "Performances and festivals"],
    answer: "Rebana ubi music is played as an ensemble. A team usually has six drums and 12 players, all playing different rhythms together, and older members traditionally lead the group as a mark of respect. In the past, different beats carried different messages between villages. The sources I have don't name the individual rhythm patterns.",
    source: "Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/ | Akhi Sahrul. (n.d.). The uniqueness of rebana ubi Kelantan. Qiadah: Majalah Korporat PMBK, (17), 58. Retrieved October 29, 2026, from https://www.pmbk.gov.my/majalah_qiadah/online_read/qiadah_17/files/basic-html/page58.html"
  },
  {
    topic: "Performances and festivals",
    keywords: ["performance"],
    synonyms: ["when is it played", "where is it played", "groups", "team", "teams", "audience", "wedding", "weddings", "harvest", "gelanggang seni", "ttewas bano", "harvest festival"],
    related: ["Rhythms", "Region", "Cultural significance"],
    answer: "The rebana ubi is played at ceremonies and celebrations, especially after the rice harvest, as well as for fun and in competitions between villages. Harvest festivals could run from afternoon until late at night, sometimes until dawn, with a competition called \"ttewas bano\" judging the best sound and decoration. Today it is often performed at Gelanggang Seni in Kota Bharu, and at the 2024 Festival Kesenian Rakyat Kelate in Bachok it featured in the \"Simfoni Pergendangan Kelantan\" with other Kelantanese drums. Drums are also ordered for royal installations and official openings.",
    source: "PUSAKA. (n.d.). Rebana ubi (Kelantan). Retrieved October 29, 2026, from https://www.pusaka.org/communities-rebana-ubi | Akhi Sahrul. (n.d.). The uniqueness of rebana ubi Kelantan. Qiadah: Majalah Korporat PMBK, (17), 58. Retrieved October 29, 2026, from https://www.pmbk.gov.my/majalah_qiadah/online_read/qiadah_17/files/basic-html/page58.html | Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/ | Jabatan Kebudayaan dan Kesenian Negara. (2024, August 3). Festival Kesenian Rakyat Kelate 2024 (FKRK) di Pantai Irama, Bachok rancakkan Tahun Melawat Kelantan 2024 [Press release No. 15/2024]. https://portal.jkkn.gov.my/images/berita_media/kenyataan-media/malay/2024/SIARAN_MEDIA_BIL_15_2024_-_FESTIVAL_KESENIAN_RAKYAT_KELATE.pdf | Kraftangan Malaysia. (n.d.-b). Encik Mat Yaacob bin Awang Besar: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/encik-mat-yaacob-bin-awang-besar"
  },
  {
    topic: "Cultural significance",
    keywords: ["significance"],
    synonyms: ["why is it important", "why important", "community", "communities", "society", "pride", "unity"],
    related: ["History", "Performances and festivals", "Preservation"],
    answer: "The rebana ubi was seen as part of Kelantan's identity and is regarded as a unique intangible heritage of the state. Kelantanese Malays believe each drum has its own name and spirit, which gives it a special power of sound to create harmony with its surroundings. It brought communities together at harvest festivals, weddings and village competitions, and once linked villages as a way of sending messages.",
    source: "Akhi Sahrul. (n.d.). The uniqueness of rebana ubi Kelantan. Qiadah: Majalah Korporat PMBK, (17), 58. Retrieved October 29, 2026, from https://www.pmbk.gov.my/majalah_qiadah/online_read/qiadah_17/files/basic-html/page58.html | Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/ | PUSAKA. (n.d.). Rebana ubi (Kelantan). Retrieved October 29, 2026, from https://www.pusaka.org/communities-rebana-ubi"
  },
  {
    topic: "Preservation",
    keywords: ["preservation"],
    synonyms: ["still played", "still made", "young people", "youth", "dying", "disappear", "disappearing", "government", "support"],
    related: ["Craftsmen", "Learning to play", "Museums and collections"],
    answer: "The tradition is under pressure. Economic pressures and a lack of sustained training have reduced interest in making the drum, and only a handful of masters remain in Kelantan. Many young people prefer modern instruments such as guitars and drum kits. Efforts to keep it alive include Kraftangan Malaysia's training schemes, community groups such as Amok Perdana restoring 150-year-old drums and teaching young people, and cultural festivals organised by JKKN. One study even recommends digital games and simulations to interest young people, much like the Drum tab on this site!",
    source: "PUSAKA. (n.d.). Rebana ubi (Kelantan). Retrieved October 29, 2026, from https://www.pusaka.org/communities-rebana-ubi | Kraftangan Malaysia. (n.d.-b). Encik Mat Yaacob bin Awang Besar: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/encik-mat-yaacob-bin-awang-besar | Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. https://discol.umk.edu.my/id/eprint/14252/ | Jabatan Kebudayaan dan Kesenian Negara. (2024, August 3). Festival Kesenian Rakyat Kelate 2024 (FKRK) di Pantai Irama, Bachok rancakkan Tahun Melawat Kelantan 2024 [Press release No. 15/2024]. https://portal.jkkn.gov.my/images/berita_media/kenyataan-media/malay/2024/SIARAN_MEDIA_BIL_15_2024_-_FESTIVAL_KESENIAN_RAKYAT_KELATE.pdf"
  },
  {
    topic: "Museums and collections",
    keywords: ["museum"],
    synonyms: ["where can i see", "where to see", "visit", "where can i find"],
    related: ["Preservation", "Craftsmen", "Region"],
    answer: "Kraftangan Malaysia's craft collection (Muzium Kraf) lists a rebana ubi made in 2006 by master craftsman Mat Yaacob bin Awang Besar. It is 78 cm high and made of buffalo hide and merbau wood. To see and hear the drum being played, look for performances at Gelanggang Seni in Kota Bharu and at cultural festivals in Kelantan.",
    source: "Kraftangan Malaysia. (n.d.-c). Koleksi kraf. Muzium Kraf. Retrieved October 29, 2026, from https://mycraftmuseum.com/koleksi-kraf/ | Akhi Sahrul. (n.d.). The uniqueness of rebana ubi Kelantan. Qiadah: Majalah Korporat PMBK, (17), 58. Retrieved October 29, 2026, from https://www.pmbk.gov.my/majalah_qiadah/online_read/qiadah_17/files/basic-html/page58.html"
  },
  {
    topic: "Learning to play",
    keywords: ["learn"],
    synonyms: ["can i learn", "get started", "where to learn", "join", "amok perdana", "noralam"],
    related: ["Playing technique", "Rhythms", "Preservation"],
    answer: "The best way to learn is with a community group or a master. In Pasir Mas, the Amok Perdana group led by Noralam Majid brings masters together to teach young people to play and make the drum. Master craftsman Mat Yaacob has trained interested locals in his workshop, including through Kraftangan Malaysia training schemes. Because the rebana ubi is played in pairs and in ensembles, expect to learn as part of a group.",
    source: "PUSAKA. (n.d.). Rebana ubi (Kelantan). Retrieved October 29, 2026, from https://www.pusaka.org/communities-rebana-ubi | Kraftangan Malaysia. (n.d.-b). Encik Mat Yaacob bin Awang Besar: Adiguru Kraf Rebana Ubi. Retrieved October 29, 2026, from https://kraftangan.gov.my/en/info/master-craftsmen/encik-mat-yaacob-bin-awang-besar"
  }
];

/* ---------------------------------------------------------------------
 * 3. SOURCES — from "Source Links.txt". Rubi lists these when the user
 * asks for sources or references. `apa` is shown before the URL.
 * ------------------------------------------------------------------- */
const SOURCES = [
  { id: 1, apa: "Kraftangan Malaysia. (n.d.-b). Encik Mat Yaacob bin Awang Besar: Adiguru Kraf Rebana Ubi.", url: "https://kraftangan.gov.my/en/info/master-craftsmen/encik-mat-yaacob-bin-awang-besar" },
  { id: 2, apa: "Kraftangan Malaysia. (n.d.-a). Allahyarham Tuan Haji Mahmood bin Abdul Latif: Adiguru Kraf Rebana Ubi.", url: "https://kraftangan.gov.my/en/info/master-craftsmen/allahyarham-tuan-haji-mahmood-bin-abdul-latif" },
  { id: 3, apa: "Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection.", url: "https://discol.umk.edu.my/id/eprint/14252/" },
  { id: 4, apa: "Siti Hajar Abdul Halim. (2024). Persepsi masyarakat di Kampung Gelang Mas, Pasir Mas, Kelantan terhadap alat muzik rebana ubi [Undergraduate final year project report, Universiti Malaysia Kelantan]. UMK Digital Special Collection. (full-text PDF)", url: "https://discol.umk.edu.my/id/eprint/14252/1/Siti%20Hajar%20Binti%20Abdul%20Halim.pdf" },
  { id: 5, apa: "PLACEHOLDER (Jurnal Arkeologi Malaysia article 232: the site returned a server error on 29 October 2026, so it has not been read or used)", url: "https://www.arkeologimalaysia.org.my/jurnalarkeologi/index.php/jurnalarkeologi/article/view/232/0" },
  { id: 6, apa: "Jabatan Kebudayaan dan Kesenian Negara. (n.d.). JKKN Kelantan.", url: "https://portal.jkkn.gov.my/index.php/ms/jkkn-kelantan" },
  { id: 7, apa: "Jabatan Kebudayaan dan Kesenian Negara. (2024, August 3). Festival Kesenian Rakyat Kelate 2024 (FKRK) di Pantai Irama, Bachok rancakkan Tahun Melawat Kelantan 2024 [Press release No. 15/2024].", url: "https://portal.jkkn.gov.my/images/berita_media/kenyataan-media/malay/2024/SIARAN_MEDIA_BIL_15_2024_-_FESTIVAL_KESENIAN_RAKYAT_KELATE.pdf" },
  { id: 8, apa: "PUSAKA. (n.d.). Rebana ubi (Kelantan).", url: "https://www.pusaka.org/communities-rebana-ubi" },
  { id: 9, apa: "Dewan Bahasa dan Pustaka. (n.d.). Ubi. In Pusat Rujukan Persuratan Melayu.", url: "https://prpm.dbp.gov.my/Cari1?d=371752&keyword=Ubi" },
  { id: 10, apa: "Kraftangan Malaysia. (n.d.-c). Koleksi kraf. Muzium Kraf.", url: "https://mycraftmuseum.com/koleksi-kraf/" },
  { id: 11, apa: "Akhi Sahrul. (n.d.). The uniqueness of rebana ubi Kelantan. Qiadah: Majalah Korporat PMBK, (17), 58.", url: "https://www.pmbk.gov.my/majalah_qiadah/online_read/qiadah_17/files/basic-html/page58.html" }
];
