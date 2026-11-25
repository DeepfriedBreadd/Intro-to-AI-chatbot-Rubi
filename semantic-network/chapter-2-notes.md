# Chapter 2: Knowledge Representation (draft notes)

Draft material for the semantic network section. Rewrite it in your own words for the report.

**Figure:** `rebana-ubi-semantic-network.drawio` (editable in draw.io), `semantic-network.png` (high resolution, for Word) or `semantic-network.svg` (scales without blurring). Every concept is a circle labelled with one or two key words, and every relation is a single term, as the lecturer asked; the full detail behind each short label is in the links table below. The older version with the five menu areas shaded (`semantic-network-with-areas.png`) uses the previous long labels and boxes, so leave it out of the report.

## What the network shows

The semantic network represents what Rubi knows about the rebana ubi as **nodes** (concepts) joined by **labelled arrows** (relations). Each arrow reads *subject → relation → object*, for example *Drum face → made-of → Buffalo hide*.

The central node is **Rebana Ubi**, connected to 36 other nodes. Related nodes sit near each other in the diagram, and they fall into five groups. For the chatbot, these groups became the five areas in the opening menu (`SECTIONS` in `knowledge.js`), so the knowledge representation and the program share one structure. The groups are not drawn in the figure, because they are a menu design choice rather than part of semantic network notation.

| Area (group of nodes) | Nodes | Chatbot topics it covers |
|---|---|---|
| The basics | Musical instrument, Membranophone, Rebana family, Kelantan, East Coast of Peninsular Malaysia, Arab traders (c. 1890s), Name | Overview, Name and meaning, History, Region |
| The drum's body | Size, Decoration, Drum face, Body (temelang), Rattan ring (peleting), Wedges (baji), Buffalo hide, Merbau wood, Rattan and rope, Leban wood | Parts, Materials, Size and weight, Decoration |
| The craft | Master craftsmen (Adiguru Kraf), Mat Yaacob bin Awang Besar, Tuan Haji Mahmood, Kraftangan Malaysia, Making process, Steps, Mengambil | Making the drum, Craftsmen |
| Sound and play | Two players, Hand or padded beater, Ensemble, Rhythms, Messages between villages, Tuning | Tuning and sound, Playing technique, Rhythms, Learning to play |
| Culture and heritage | Performances, harvest festivals and competitions, Gelanggang Seni, Kelantan identity and heritage, Preservation, Muzium Kraf collection, Training and community groups | Performances and festivals, Cultural significance, Preservation, Museums and collections |

## Relation types

| Relation | Meaning | Example |
|---|---|---|
| is-a | class membership (inheritance) | Rebana Ubi is-a Rebana family is-a Membranophone is-a Musical instrument |
| has-part | the object is a component of the subject | Rebana Ubi has-part Wedges |
| made-of | the material a part is made from | Body made-of Merbau wood |
| made-by | who makes the subject | Rebana Ubi made-by Master craftsmen |
| has-size, decorated-with, has-name | attributes of the drum | Rebana Ubi has-size 1 Metre |
| originates-from, located-in, brought-by | origin and place | Rebana Ubi originates-from Kelantan |
| played-by, played-in, strikes-with, produces | how it is played | Rebana Ubi played-in Ensemble produces Rhythms |
| played-at, held-at, symbol-of, preserved-by, supported-by | cultural role | Rebana Ubi symbol-of Kelantan identity |
| used-for, performs, has-steps, includes, carried, appoints | process and purpose | Wedges used-for Tuning |

The *is-a* chain shows **inheritance**. Because the rebana ubi is a membranophone, it inherits that class's properties: it makes sound from a stretched skin.

## Every link and its source

| Subject | Relation | Object | Source |
|---|---|---|---|
| Rebana Ubi | is-a | Rebana family | PUSAKA (n.d.); Siti Hajar Abdul Halim (2024) |
| Rebana family | is-a | Membranophone | Siti Hajar Abdul Halim (2024); DBP (n.d.) |
| Membranophone | is-a | Musical instrument | Siti Hajar Abdul Halim (2024) |
| Rebana Ubi | originates-from | Kelantan | PUSAKA (n.d.); Akhi Sahrul (n.d.) |
| Kelantan | located-in | East Coast, Peninsular Malaysia | PUSAKA (n.d.) |
| Rebana Ubi | brought-by | Arab traders (c. 1890s) | Siti Hajar Abdul Halim (2024) |
| Rebana Ubi | has-name | rebana + ubi ("ubi" = tuber, root) | DBP (n.d.); Siti Hajar Abdul Halim (2024) |
| Rebana Ubi | has-size | Size: about 1 m high, face about 70 cm | PUSAKA (n.d.); Akhi Sahrul (n.d.) |
| Rebana Ubi | decorated-with | Bright paint, Kelantan coat of arms | PUSAKA (n.d.) |
| Rebana Ubi | has-part | Drum face, Body (temelang), Rattan ring (peleting), Wedges | Siti Hajar Abdul Halim (2024) |
| Drum face | made-of | Buffalo hide | Siti Hajar Abdul Halim (2024); Kraftangan Malaysia (n.d.-b) |
| Body | made-of | Merbau wood | Siti Hajar Abdul Halim (2024); PUSAKA (n.d.) |
| Rattan ring | made-of | Manau and sega emas rattan, nylon rope | Siti Hajar Abdul Halim (2024) |
| Wedges | made-of | Leban wood | Siti Hajar Abdul Halim (2024) |
| Wedges | used-for | Tuning | Siti Hajar Abdul Halim (2024) |
| Rebana Ubi | made-by | Master craftsmen (Adiguru Kraf) | Kraftangan Malaysia (n.d.-a, n.d.-b) |
| Mat Yaacob bin Awang Besar | is-a | Adiguru Kraf | Kraftangan Malaysia (n.d.-b) |
| Tuan Haji Mahmood | is-a | Adiguru Kraf | Kraftangan Malaysia (n.d.-a) |
| Kraftangan Malaysia | appoints | Adiguru Kraf | Kraftangan Malaysia (n.d.-a, n.d.-b) |
| Adiguru Kraf | performs | Making process | Kraftangan Malaysia (n.d.-b) |
| Making process | has-steps | Dry hide, turn body, cut wedges, fit and tune | Siti Hajar Abdul Halim (2024) |
| Making process | includes | Mengambil (hardest step) | Kraftangan Malaysia (n.d.-b) |
| Rebana Ubi | played-by | Two players, one on each side | Akhi Sahrul (n.d.) |
| Two players | strikes-with | Hand or padded beater | DBP (n.d.) |
| Rebana Ubi | played-in | Ensemble: 6 drums, 12 players | Siti Hajar Abdul Halim (2024); Akhi Sahrul (n.d.) |
| Ensemble | produces | Rhythms | Siti Hajar Abdul Halim (2024) |
| Rhythms | carried | Messages between villages | Akhi Sahrul (n.d.); Siti Hajar Abdul Halim (2024) |
| Rebana Ubi | played-at | Performances, harvest festivals and competitions | PUSAKA (n.d.); Akhi Sahrul (n.d.) |
| Performances | held-at | Gelanggang Seni, Kota Bharu | Akhi Sahrul (n.d.) |
| Rebana Ubi | symbol-of | Kelantan identity and intangible heritage | Akhi Sahrul (n.d.); Siti Hajar Abdul Halim (2024) |
| Kelantan heritage | preserved-by | Preservation | PUSAKA (n.d.) |
| Preservation | includes | Muzium Kraf collection | Kraftangan Malaysia (n.d.-c) |
| Preservation | supported-by | Training and community groups (Amok Perdana) | PUSAKA (n.d.); Kraftangan Malaysia (n.d.-b) |

Full APA 7th references are in `knowledge.js` and the chatbot's "sources" reply.

## How the chatbot uses the network (mapping design to program)

1. **Areas → menu.** The five groups of nodes are the `SECTIONS` in `knowledge.js`. The opening menu lists them, and typing an area name (for example "the craft") lists that area's topics.
2. **Nodes → topics.** Each topic in `KNOWLEDGE_BASE` answers questions about one group of nodes, as shown in the first table. For example, the Materials topic covers the four *made-of* links.
3. **Links → follow-up suggestions.** Each topic's `related` field is taken straight from the arrows: two topics are related when an arrow joins one of their nodes (table below). For example, *Wedges → used-for → Tuning* links Parts and Tuning and sound, and *Master craftsmen → performs → Making process* links Craftsmen and Making the drum. After every answer Rubi suggests up to three linked topics. "Tell me more" moves to the nearest topic not yet visited, walking outwards along the network: direct links first, then topics two steps away. Because the central node is the hub, many topics link only to Overview, and the walk carries on through it to the next unvisited topic.
4. **Links → better matching.** When a question could match two topics, a topic linked to the previous one gets +1 in `scoreTopics()`. This is how the network makes the conversation flow along related ideas.

### Which topic answers each node

| Topic | Nodes |
|---|---|
| Overview | REBANA UBI (central node), Musical instrument, Membranophone (drum with a skin), Rebana family |
| Name and meaning | Name: rebana + ubi (‘ubi’ = tuber, root) |
| History | Arab traders (c. 1890s), Messages between villages (in the past) |
| Region | Kelantan, East Coast, Peninsular Malaysia |
| Parts | Drum face (2 layers), Body (temelang), Rattan ring (peleting), Wedges: 14 baji + 14 baji anak |
| Materials | Buffalo hide, Merbau wood, Manau and sega emas rattan, nylon rope, Leban wood |
| Size and weight | Size: about 1 m high, face about 70 cm across |
| Making the drum | Making process, Dry hide → turn body on lathe → cut wedges → fit, tie and tune, ‘Mengambil’: tying the hide on (hardest step) |
| Craftsmen | Master craftsmen (Adiguru Kraf), Mat Yaacob bin Awang Besar (b. 1942), Tuan Haji Mahmood, ‘Pak Mud’ (1930–1998), Kraftangan Malaysia |
| Decoration | Bright paint and the Kelantan coat of arms |
| Tuning and sound | Tuning: wedges are hammered in to tighten |
| Playing technique | Two players, one on each side, Hand or padded beater |
| Rhythms | Ensemble: 6 drums, 12 players, Rhythms |
| Performances and festivals | Performances, harvest festivals, competitions, Gelanggang Seni, Kota Bharu |
| Cultural significance | Kelantan identity and intangible heritage |
| Preservation | Preservation |
| Museums and collections | Muzium Kraf collection |
| Learning to play | Training and community groups (Amok Perdana) |

### Topic links in `knowledge.js` (generated from the arrows)

| Topic | Related topics |
|---|---|
| Overview | Name and meaning, History, Region, Parts, Size and weight, Craftsmen, Decoration, Playing technique, Rhythms, Performances and festivals, Cultural significance |
| Name and meaning | Overview |
| History | Rhythms, Overview |
| Region | Overview |
| Parts | Materials, Tuning and sound, Overview |
| Materials | Parts |
| Size and weight | Overview |
| Making the drum | Craftsmen |
| Craftsmen | Making the drum, Overview |
| Decoration | Overview |
| Tuning and sound | Parts |
| Playing technique | Overview |
| Rhythms | History, Overview |
| Performances and festivals | Overview |
| Cultural significance | Preservation, Overview |
| Preservation | Cultural significance, Museums and collections, Learning to play |
| Museums and collections | Preservation |
| Learning to play | Preservation |

Overview is listed last in each topic's links, so follow-ups go further out along the network before coming back to the centre.

If you change the diagram, regenerate the links with `python build_network.py --related` and copy them into the `related` fields in `knowledge.js`, so the report and the program stay consistent.

## Editing the diagram

**In draw.io (easiest):** open [app.diagrams.net](https://app.diagrams.net), choose **File → Open from → Device** and pick `rebana-ubi-semantic-network.drawio`. Drag nodes to move them and double-click any circle or arrow to edit its text. For Word, use **File → Export as → PNG** at 200% zoom.

The draw.io file is black and white. If it looks inverted (white lines on black), that's draw.io's dark theme re-colouring the screen; exports stay black on white. You can switch with **Extras → Appearance → Light**. `semantic-network.png` and `semantic-network.svg` match it: same layout, also black and white.

**From the script:** node positions, labels and links are also in `build_network.py`. After editing, run:

```bash
python build_network.py
```

That rewrites `semantic-network.svg`, `semantic-network.png` (drawn with Microsoft Edge) and the `.drawio` file, and overwrites any changes made in draw.io, so pick one way of editing.
