"""Draws the Rubi semantic network.

Run:  python build_network.py          ->  semantic-network.svg (plain)
                                           rebana-ubi-semantic-network.drawio (plain, editable in draw.io)
      python build_network.py --areas  ->  semantic-network-with-areas.svg (shaded menu areas)
Edit the NODES / EDGES / CLUSTERS lists below to change the diagram.
"""
from html import escape
import math
import sys

SHOW_AREAS = "--areas" in sys.argv

OFFSET_Y = 70          # room for the title
W, H = 1800, 1290

# Clusters = the five areas in the chatbot menu (SECTIONS in knowledge.js)
CLUSTERS = [
    # key, x, y, w, h, title, topics, fill, stroke
    ("basics",  20,  20,  600, 400, "THE BASICS", "Overview, Name and meaning, History, Region", "#fbf3e4", "#c9a26b"),
    ("body",    660, 20, 1120, 400, "THE DRUM'S BODY", "Parts, Materials, Size and weight, Decoration", "#f6efe2", "#a9805a"),
    ("craft",   20,  680, 600, 460, "THE CRAFT", "Making the drum, Craftsmen", "#f3f0e6", "#8f8a5a"),
    ("culture", 660, 760, 480, 420, "CULTURE AND HERITAGE", "Performances and festivals, Cultural significance, Preservation, Museums and collections", "#f8ece6", "#c0775a"),
    ("sound",   1180, 520, 600, 620, "SOUND AND PLAY", "Tuning and sound, Playing technique, Rhythms, Learning to play", "#eef1ea", "#7d9070"),
]

# id: (label, x, y)
NODES = {
    "C":        ("REBANA UBI", 900, 560),
    # The basics
    "inst":     ("Musical instrument", 130, 90),
    "mem":      ("Membranophone\n(drum with a skin)", 130, 200),
    "reb":      ("Rebana family", 130, 320),
    "east":     ("East Coast,\nPeninsular Malaysia", 320, 130),
    "name":     ("Name: rebana + ubi\n(‘ubi’ = tuber, root)", 320, 310),
    "kel":      ("Kelantan", 510, 300),
    "arab":     ("Arab traders\n(c. 1890s)", 510, 110),
    # The drum's body
    "size":     ("Size: about 1 m high,\nface about 70 cm across", 770, 100),
    "deco":     ("Bright paint and the\nKelantan coat of arms", 990, 240),
    "face":     ("Drum face\n(2 layers)", 1180, 90),
    "body":     ("Body (temelang)", 1260, 185),
    "ring":     ("Rattan ring (peleting)", 1330, 280),
    "wedge":    ("Wedges: 14 baji +\n14 baji anak", 1380, 375),
    "hide":     ("Buffalo hide", 1650, 90),
    "merbau":   ("Merbau wood", 1650, 185),
    "rattan":   ("Manau and sega emas\nrattan, nylon rope", 1650, 280),
    "leban":    ("Leban wood", 1650, 375),
    # The craft
    "adiguru":  ("Master craftsmen\n(Adiguru Kraf)", 430, 790),
    "mat":      ("Mat Yaacob bin Awang\nBesar (b. 1942)", 150, 770),
    "mud":      ("Tuan Haji Mahmood,\n‘Pak Mud’ (1930–1998)", 150, 890),
    "kraft":    ("Kraftangan Malaysia", 150, 1005),
    "process":  ("Making process", 430, 935),
    "steps":    ("Dry hide → turn body on lathe →\ncut wedges → fit, tie and tune", 430, 1065),
    "meng":     ("‘Mengambil’: tying the hide\non (hardest step)", 150, 1105),
    # Culture and heritage
    "fest":     ("Performances, harvest\nfestivals, competitions", 780, 840),
    "heritage": ("Kelantan identity and\nintangible heritage", 1020, 840),
    "gel":      ("Gelanggang Seni,\nKota Bharu", 780, 960),
    "pres":     ("Preservation", 1020, 960),
    "museum":   ("Muzium Kraf\ncollection", 780, 1080),
    "groups":   ("Training and community\ngroups (Amok Perdana)", 1020, 1080),
    # Sound and play
    "players":  ("Two players,\none on each side", 1300, 780),
    "hands":    ("Hand or\npadded beater", 1640, 780),
    "ens":      ("Ensemble:\n6 drums, 12 players", 1300, 900),
    "rhythm":   ("Rhythms", 1640, 900),
    "msg":      ("Messages between\nvillages (in the past)", 1640, 1020),
    "tune":     ("Tuning: wedges are\nhammered in to tighten", 1640, 640),
}

# Tighter positions for the plain version (no areas), checked for overlapping
# boxes and for arrows that cross boxes. The --areas version keeps NODES.
COMPACT = {
    "C": (900, 560),
    "inst": (225, 160), "mem": (225, 255), "reb": (225, 355),
    "east": (425, 195), "name": (425, 345), "kel": (600, 335), "arab": (600, 175),
    "size": (790, 170), "deco": (935, 260),
    "face": (1138, 160), "body": (1206, 241), "ring": (1266, 322), "wedge": (1308, 403),
    "hide": (1538, 160), "merbau": (1538, 241), "rattan": (1538, 322), "leban": (1538, 403),
    "adiguru": (500, 755), "mat": (200, 745), "mud": (200, 845), "kraft": (215, 945),
    "process": (500, 880), "steps": (575, 1000), "meng": (300, 1040),
    "fest": (800, 800), "heritage": (1030, 800), "gel": (800, 902), "pres": (1030, 902),
    "museum": (800, 1004), "groups": (1030, 1004),
    "players": (1240, 747), "hands": (1529, 747), "ens": (1240, 849), "rhythm": (1529, 849),
    "msg": (1529, 951), "tune": (1534, 628),
}
if not SHOW_AREAS:
    # Shift so the diagram starts near the top-left, then size the page to fit
    SHIFT_X, SHIFT_Y = -60, -110
    NODES = {k: (label, COMPACT[k][0] + SHIFT_X, COMPACT[k][1] + SHIFT_Y) for k, (label, _, _) in NODES.items()}
    W, H = 1620, 1080

# (from, to, relation)
EDGES = [
    ("C", "reb", "is-a (largest member)"), ("reb", "mem", "is-a"), ("mem", "inst", "is-a"),
    ("C", "kel", "originates-from"), ("kel", "east", "located-in"),
    ("C", "arab", "said to be brought by"), ("C", "name", "has-name"),
    ("C", "size", "has-property"), ("C", "deco", "decorated-with"),
    ("C", "face", "has-part"), ("C", "body", "has-part"), ("C", "ring", "has-part"), ("C", "wedge", "has-part"),
    ("face", "hide", "made-of"), ("body", "merbau", "made-of"), ("ring", "rattan", "made-of"), ("wedge", "leban", "made-of"),
    ("C", "adiguru", "made-by"), ("mat", "adiguru", "is-a"), ("mud", "adiguru", "is-a"), ("kraft", "adiguru", "appoints"),
    ("adiguru", "process", "carries out"), ("process", "steps", "has-steps"), ("process", "meng", "includes"),
    ("C", "fest", "played-at"), ("fest", "gel", "often held at"), ("C", "heritage", "symbol-of"),
    ("heritage", "pres", "kept alive by"), ("pres", "museum", "includes"), ("pres", "groups", "supported-by"),
    ("C", "players", "played-by"), ("players", "hands", "strikes-with"),
    ("C", "ens", "played-in"), ("ens", "rhythm", "produces"), ("rhythm", "msg", "once carried"),
    ("wedge", "tune", "used-for"),
]

# Which chatbot topic (KNOWLEDGE_BASE in knowledge.js) answers questions about each node.
# The central node and its is-a chain are what the Overview topic describes.
NODE_TOPIC = {
    "C": "Overview", "inst": "Overview", "mem": "Overview", "reb": "Overview",
    "name": "Name and meaning", "arab": "History", "msg": "History",
    "kel": "Region", "east": "Region",
    "face": "Parts", "body": "Parts", "ring": "Parts", "wedge": "Parts",
    "hide": "Materials", "merbau": "Materials", "rattan": "Materials", "leban": "Materials",
    "size": "Size and weight", "deco": "Decoration",
    "process": "Making the drum", "steps": "Making the drum", "meng": "Making the drum",
    "adiguru": "Craftsmen", "mat": "Craftsmen", "mud": "Craftsmen", "kraft": "Craftsmen",
    "tune": "Tuning and sound", "players": "Playing technique", "hands": "Playing technique",
    "ens": "Rhythms", "rhythm": "Rhythms",
    "fest": "Performances and festivals", "gel": "Performances and festivals",
    "heritage": "Cultural significance", "pres": "Preservation",
    "museum": "Museums and collections", "groups": "Learning to play",
}
TOPIC_ORDER = ["Overview", "Name and meaning", "History", "Region", "Parts", "Materials", "Size and weight",
               "Making the drum", "Craftsmen", "Decoration", "Tuning and sound", "Playing technique", "Rhythms",
               "Performances and festivals", "Cultural significance", "Preservation", "Museums and collections",
               "Learning to play"]


def related_links():
    """Chatbot `related` links derived from the arrows: two topics are related when an
    arrow joins one of their nodes. Overview (the central node) is listed last, so
    follow-ups move outwards along the network before returning to the centre."""
    links = {t: set() for t in TOPIC_ORDER}
    for a, b, _ in EDGES:
        ta, tb = NODE_TOPIC[a], NODE_TOPIC[b]
        if ta != tb:
            links[ta].add(tb)
            links[tb].add(ta)
    order = lambda t: (t == "Overview", TOPIC_ORDER.index(t))
    return {t: sorted(links[t], key=order) for t in TOPIC_ORDER}


if "--related" in sys.argv:
    import json
    print(json.dumps(related_links(), indent=1))
    sys.exit()

FONT = "Segoe UI, Arial, sans-serif"

# Colours: the plain version is black and white (matching the draw.io file);
# the --areas version keeps the original colours.
if SHOW_AREAS:
    COL = dict(arrow="#6b4a33", bg="#fffdf8", title="#3b2414", muted="#7c6450", centre_fill="#c8643e",
               centre_stroke="#5c3519", centre_text="#fffaf2", node_stroke="#8a5530", text="#3b2414", label="#8a4a2a")
else:
    COL = dict(arrow="#000000", bg="#ffffff", title="#000000", muted="#000000", centre_fill="#ffffff",
               centre_stroke="#000000", centre_text="#000000", node_stroke="#000000", text="#000000", label="#000000")
CHAR_W, LINE_H, PAD_X, PAD_Y = 7.1, 17, 14, 9


def box(node_id):
    label, x, y = NODES[node_id]
    lines = label.split("\n")
    w = max(len(l) for l in lines) * CHAR_W + 2 * PAD_X
    h = len(lines) * LINE_H + 2 * PAD_Y
    if node_id == "C":
        w, h = 210, 70
    return x, y + OFFSET_Y, w, h, lines


def clip(x1, y1, x2, y2, w, h):
    """Point where the line from the centre (x1, y1) towards (x2, y2) leaves a w x h box."""
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return x1, y1
    sx = (w / 2) / abs(dx) if dx else math.inf
    sy = (h / 2) / abs(dy) if dy else math.inf
    s = min(sx, sy)
    return x1 + dx * s, y1 + dy * s


out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="{FONT}">',
       '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
       f'<path d="M0,0 L10,5 L0,10 z" fill="{COL["arrow"]}"/></marker></defs>',
       f'<rect width="{W}" height="{H}" fill="{COL["bg"]}"/>',
       f'<text x="{W/2}" y="40" text-anchor="middle" font-size="26" font-weight="700" fill="{COL['title']}">Semantic network: Rubi, the rebana ubi expert system</text>',
       f'<text x="{W/2}" y="64" text-anchor="middle" font-size="14" fill="{COL["muted"]}">'
       + ("Each shaded area is one of the five areas in the chatbot menu. " if SHOW_AREAS else "")
       + 'Arrows read: subject → relation → object.</text>']

TITLE_AT_BOTTOM = {"culture"}   # arrows from the centre enter this area from the top
WRAP_AT = {"sound": 48}          # keep this line short so the "used-for" arrow misses it


def wrap(text, width):
    """Split text into lines of at most `width` characters."""
    lines, line = [], ""
    for word in text.split(" "):
        if line and len(line) + 1 + len(word) > width:
            lines.append(line)
            line = word
        else:
            line = f"{line} {word}".strip()
    return lines + [line]


for key, x, y, w, h, title, topics, fill, stroke in (CLUSTERS if SHOW_AREAS else []):
    y += OFFSET_Y
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="{fill}" stroke="{stroke}" stroke-width="2" stroke-dasharray="8 6"/>')
    sub = wrap("Chatbot topics: " + topics, WRAP_AT.get(key, int((w - 32) / 6.1)))
    ty = y + h - 18 - 15 * len(sub) if key in TITLE_AT_BOTTOM else y + 24
    out.append(f'<text x="{x+16}" y="{ty}" font-size="15" font-weight="700" letter-spacing="1" fill="{stroke}">{escape(title)}</text>')
    for i, line in enumerate(sub):
        out.append(f'<text x="{x+16}" y="{ty + 18 + 15*i}" font-size="11.5" font-style="italic" fill="#7c6450">{escape(line)}</text>')

labels = []
for a, b, rel in EDGES:
    ax, ay, aw, ah, _ = box(a)
    bx, by, bw, bh, _ = box(b)
    x1, y1 = clip(ax, ay, bx, by, aw + 4, ah + 4)
    x2, y2 = clip(bx, by, ax, ay, bw + 8, bh + 8)
    out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{COL['arrow']}" stroke-width="1.6" marker-end="url(#arrow)"/>')
    t = 0.58 if a == "C" else 0.5
    lx, ly = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
    labels.append((lx, ly, rel))

for node_id in NODES:
    x, y, w, h, lines = box(node_id)
    if node_id == "C":
        if SHOW_AREAS:
            out.append(f'<rect x="{x-w/2}" y="{y-h/2}" width="{w}" height="{h}" rx="35" fill="{COL["centre_fill"]}" stroke="{COL["centre_stroke"]}" stroke-width="3"/>')
        else:   # an oval, like the draw.io file
            out.append(f'<ellipse cx="{x}" cy="{y}" rx="{w/2}" ry="{h/2}" fill="{COL["centre_fill"]}" stroke="{COL["centre_stroke"]}" stroke-width="3"/>')
        out.append(f'<text x="{x}" y="{y+8}" text-anchor="middle" font-size="22" font-weight="700" fill="{COL["centre_text"]}" letter-spacing="1">{lines[0]}</text>')
        continue
    out.append(f'<rect x="{x-w/2:.1f}" y="{y-h/2:.1f}" width="{w:.1f}" height="{h:.1f}" rx="10" fill="#ffffff" stroke="{COL['node_stroke']}" stroke-width="1.5"/>')
    top = y - (len(lines) - 1) * LINE_H / 2 + 5
    for i, line in enumerate(lines):
        out.append(f'<text x="{x}" y="{top + i*LINE_H:.1f}" text-anchor="middle" font-size="13" fill="{COL['text']}">{escape(line)}</text>')

# Relation labels last, on a small background so lines don't cut through them
for lx, ly, rel in labels:
    w = len(rel) * 6.3 + 10
    out.append(f'<rect x="{lx-w/2:.1f}" y="{ly-9:.1f}" width="{w:.1f}" height="16" rx="4" fill="{COL['bg']}" fill-opacity="0.92"/>')
    out.append(f'<text x="{lx:.1f}" y="{ly+3:.1f}" text-anchor="middle" font-size="11" font-style="italic" fill="{COL['label']}">{escape(rel)}</text>')

out.append(f'<text x="20" y="{H-14}" font-size="11.5" fill="{COL["muted"]}">Sources: Siti Hajar Abdul Halim (2024); PUSAKA (n.d.); Kraftangan Malaysia (n.d.-a, n.d.-b, n.d.-c); Akhi Sahrul (n.d.); Dewan Bahasa dan Pustaka (n.d.); JKKN (2024). Full references in knowledge.js.</text>')
out.append('</svg>')

svg_name = "semantic-network-with-areas.svg" if SHOW_AREAS else "semantic-network.svg"
with open(svg_name, "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("wrote", svg_name)


def write_drawio(path):
    """The plain network as a draw.io (diagrams.net) file, same layout as the SVG, in black and white."""
    attr = lambda text: escape(text, quote=True)
    node_style = ("rounded=1;whiteSpace=wrap;html=1;arcSize=20;fillColor=#FFFFFF;strokeColor=#000000;"
                  "strokeWidth=1.5;fontColor=#000000;fontSize=13;")
    centre_style = ("ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=3;"
                    "fontColor=#000000;fontSize=22;fontStyle=1;")
    edge_style = ("edgeStyle=none;html=1;endArrow=classic;endFill=1;strokeColor=#000000;strokeWidth=1.5;"
                  "fontSize=11;fontStyle=2;fontColor=#000000;labelBackgroundColor=#FFFFFF;")
    text_style = "text;html=1;align=center;verticalAlign=middle;"

    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>',
             f'<mxCell id="title" value="{attr("<b>Semantic network: Rubi, the rebana ubi expert system</b>")}" '
             f'style="{text_style}fontSize=24;fontColor=#000000;" vertex="1" parent="1">'
             f'<mxGeometry x="400" y="15" width="1000" height="35" as="geometry"/></mxCell>',
             f'<mxCell id="subtitle" value="Arrows read: subject → relation → object." '
             f'style="{text_style}fontSize=14;fontColor=#000000;" vertex="1" parent="1">'
             f'<mxGeometry x="600" y="48" width="600" height="25" as="geometry"/></mxCell>']

    for node_id in NODES:
        x, y, w, h, lines = box(node_id)
        if node_id == "C":
            w, h = 240, 80
        else:
            w += 12          # draw.io measures text a little wider than the SVG estimate
        value = "<br>".join(escape(line) for line in lines)
        style = centre_style if node_id == "C" else node_style
        cells.append(f'<mxCell id="{node_id}" value="{attr(value)}" style="{style}" vertex="1" parent="1">'
                     f'<mxGeometry x="{x - w/2:.0f}" y="{y - h/2:.0f}" width="{w:.0f}" height="{h:.0f}" as="geometry"/></mxCell>')

    for i, (a, b, rel) in enumerate(EDGES):
        # x = label position along the edge (-1 start, 0 middle, 1 end); centre edges are crowded near the centre
        label_x = 0.2 if a == "C" else 0
        cells.append(f'<mxCell id="e{i}" value="{attr(rel)}" style="{edge_style}" edge="1" parent="1" source="{a}" target="{b}">'
                     f'<mxGeometry x="{label_x}" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>')

    source_note = ("Sources: Siti Hajar Abdul Halim (2024); PUSAKA (n.d.); Kraftangan Malaysia (n.d.-a, n.d.-b, n.d.-c); "
                   "Akhi Sahrul (n.d.); Dewan Bahasa dan Pustaka (n.d.); JKKN (2024).")
    cells.append(f'<mxCell id="sources" value="{attr(source_note)}" style="text;html=1;align=left;fontSize=11;fontColor=#000000;" '
                 f'vertex="1" parent="1"><mxGeometry x="20" y="{H - 30}" width="1000" height="20" as="geometry"/></mxCell>')

    xml = (f'<mxfile host="app.diagrams.net"><diagram id="rubi-semantic-network" name="Semantic network">'
           f'<mxGraphModel dx="{W}" dy="{H}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" '
           f'fold="1" page="1" pageScale="1" pageWidth="{W}" pageHeight="{H}" background="#FFFFFF" math="0" shadow="0">'
           f'<root>{"".join(cells)}</root></mxGraphModel></diagram></mxfile>')
    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)
    print("wrote", path)


if not SHOW_AREAS:
    write_drawio("rebana-ubi-semantic-network.drawio")
