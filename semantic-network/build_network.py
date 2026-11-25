"""Draws the Rubi semantic network: every concept is a circle with one or two key words.

Run:  python build_network.py            ->  semantic-network.svg, semantic-network.png
                                             rebana-ubi-semantic-network.drawio (editable in draw.io)
      python build_network.py --related  ->  prints the chatbot `related` links derived from the arrows
Edit LABELS / EDGES / ORDER below to change the diagram. Black and white throughout.
"""
from html import escape
import math
import os
import subprocess
import sys

# id: short label (one or two key words)
LABELS = {
    "C": "Rebana Ubi",
    "inst": "Instrument", "mem": "Membranophone", "reb": "Rebana Family",
    "east": "East Coast", "name": "Ubi (Tuber)", "kel": "Kelantan", "arab": "Arab Traders",
    "size": "1 Metre", "deco": "State Crest",
    "face": "Drum Face", "body": "Body", "ring": "Rattan Ring", "wedge": "Wedges",
    "hide": "Buffalo Hide", "merbau": "Merbau Wood", "rattan": "Manau Rattan", "leban": "Leban Wood",
    "adiguru": "Adiguru Kraf", "mat": "Mat Yaacob", "mud": "Pak Mud", "kraft": "Kraftangan",
    "process": "Making", "steps": "Four Steps", "meng": "Mengambil",
    "fest": "Festivals", "heritage": "Heritage", "gel": "Gelanggang Seni", "pres": "Preservation",
    "museum": "Muzium Kraf", "groups": "Amok Perdana",
    "players": "Two Players", "hands": "Beater", "ens": "Ensemble", "rhythm": "Rhythms",
    "msg": "Messages", "tune": "Tuning",
}

# (from, to, relation): relations are one word or one hyphenated term
EDGES = [
    ("C", "reb", "is-a"), ("reb", "mem", "is-a"), ("mem", "inst", "is-a"),
    ("C", "kel", "originates-from"), ("kel", "east", "located-in"),
    ("C", "arab", "brought-by"), ("C", "name", "has-name"),
    ("C", "size", "has-size"), ("C", "deco", "decorated-with"),
    ("C", "face", "has-part"), ("C", "body", "has-part"), ("C", "ring", "has-part"), ("C", "wedge", "has-part"),
    ("face", "hide", "made-of"), ("body", "merbau", "made-of"), ("ring", "rattan", "made-of"), ("wedge", "leban", "made-of"),
    ("C", "adiguru", "made-by"), ("mat", "adiguru", "is-a"), ("mud", "adiguru", "is-a"), ("kraft", "adiguru", "appoints"),
    ("adiguru", "process", "performs"), ("process", "steps", "has-steps"), ("process", "meng", "includes"),
    ("C", "fest", "played-at"), ("fest", "gel", "held-at"), ("C", "heritage", "symbol-of"),
    ("heritage", "pres", "preserved-by"), ("pres", "museum", "includes"), ("pres", "groups", "supported-by"),
    ("C", "players", "played-by"), ("players", "hands", "strikes-with"),
    ("C", "ens", "played-in"), ("ens", "rhythm", "produces"), ("rhythm", "msg", "carried"),
    ("wedge", "tune", "used-for"),
]

# Which chatbot topic (KNOWLEDGE_BASE in knowledge.js) answers questions about each node.
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
    arrow joins one of their nodes. Overview (the central node) is listed last."""
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

# ---------------------------------------------------------------- layout
# Rebana Ubi in the middle. Its 15 direct links sit evenly on an ellipse around it
# (clockwise from the top), ordered so that the branches with many children have
# leaf neighbours. Children sit further out along the same direction.
ORDER = ["reb", "arab", "kel", "face", "body", "ring", "wedge", "deco",
         "players", "ens", "heritage", "fest", "size", "adiguru", "name"]
D, D_CENTRE = 124, 170          # circle diameters
RX, RY = 430, 345               # ellipse for the first ring
STEP = 230                      # distance from a node to its children
SPREAD = 155                    # sideways gap between siblings

children = {}
for a, b, _ in EDGES:
    parent, child = (b, a) if b == "adiguru" and a in ("mat", "mud", "kraft") else (a, b)
    children.setdefault(parent, []).append(child)

POS = {"C": (0.0, 0.0)}


def place_children(node, ux, uy):
    kids = children.get(node, [])
    tx, ty = -uy, ux                          # sideways direction
    x0, y0 = POS[node]
    for i, k in enumerate(kids):
        off = (i - (len(kids) - 1) / 2) * SPREAD
        POS[k] = (x0 + ux * STEP + tx * off, y0 + uy * STEP + ty * off)
        place_children(k, ux, uy)


for i, n in enumerate(ORDER):
    a = math.radians(-90 + i * 360 / len(ORDER))
    POS[n] = (RX * math.cos(a), RY * math.sin(a))
    d = math.hypot(*POS[n])
    place_children(n, POS[n][0] / d, POS[n][1] / d)

# Hand nudges after checking the drawing (x, y in pixels)
NUDGE = {}
for k, (dx, dy) in NUDGE.items():
    POS[k] = (POS[k][0] + dx, POS[k][1] + dy)

MARGIN = 30
xs = [p[0] for p in POS.values()]; ys = [p[1] for p in POS.values()]
OX, OY = -min(xs) + D / 2 + MARGIN, -min(ys) + D / 2 + MARGIN + 50
W = int(max(xs) - min(xs) + D + 2 * MARGIN)
H = int(max(ys) - min(ys) + D + 2 * MARGIN + 50 + 30)
P = {k: (x + OX, y + OY) for k, (x, y) in POS.items()}


def diam(n):
    return D_CENTRE if n == "C" else D


def check():
    """Report circles that overlap or sit too close, and arrows that pass through a circle."""
    problems = []
    ids = list(P)
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            dist = math.dist(P[a], P[b])
            if dist < (diam(a) + diam(b)) / 2 + 18:
                problems.append(f"close: {a}-{b} {dist:.0f}")
    for a, b, _ in EDGES:
        (x1, y1), (x2, y2) = P[a], P[b]
        for n in P:
            if n in (a, b):
                continue
            px, py = P[n]
            t = max(0, min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2)))
            if math.dist((px, py), (x1 + t * (x2 - x1), y1 + t * (y2 - y1))) < diam(n) / 2 + 4:
                problems.append(f"arrow {a}->{b} crosses {n}")
    return problems


# ---------------------------------------------------------------- drawing
FONT = "Arial, Helvetica, sans-serif"
TITLE = "Semantic network: Rubi, the rebana ubi expert system"


def text_lines(label):
    words = label.split(" ")
    return [label] if len(label) <= 11 else words


def edge_points(a, b):
    (x1, y1), (x2, y2) = P[a], P[b]
    d = math.dist((x1, y1), (x2, y2))
    ux, uy = (x2 - x1) / d, (y2 - y1) / d
    ra, rb = diam(a) / 2 + 2, diam(b) / 2 + 5
    return x1 + ux * ra, y1 + uy * ra, x2 - ux * rb, y2 - uy * rb


out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="{FONT}">',
       '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
       '<path d="M0,0 L10,5 L0,10 z" fill="#000"/></marker></defs>',
       f'<rect width="{W}" height="{H}" fill="#fff"/>',
       f'<text x="{W/2}" y="40" text-anchor="middle" font-size="28" font-weight="700" fill="#000">{escape(TITLE)}</text>']
labels = []
for a, b, rel in EDGES:
    x1, y1, x2, y2 = edge_points(a, b)
    out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#000" stroke-width="1.8" marker-end="url(#arrow)"/>')
    t = 0.5
    labels.append((x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, rel))
for n, (x, y) in P.items():
    r = diam(n) / 2
    out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#fff" stroke="#000" stroke-width="{3 if n == "C" else 1.8}"/>')
    lines = text_lines(LABELS[n])
    size = 22 if n == "C" else 15
    lh = size * 1.15
    top = y - (len(lines) - 1) * lh / 2 + size * 0.35
    for i, line in enumerate(lines):
        out.append(f'<text x="{x:.1f}" y="{top + i * lh:.1f}" text-anchor="middle" font-size="{size}" '
                   f'font-weight="{700 if n == "C" else 400}" fill="#000">{escape(line)}</text>')
for lx, ly, rel in labels:
    w = len(rel) * 7 + 10
    out.append(f'<rect x="{lx - w/2:.1f}" y="{ly - 10:.1f}" width="{w:.1f}" height="18" rx="4" fill="#fff" fill-opacity="0.95"/>')
    out.append(f'<text x="{lx:.1f}" y="{ly + 3.5:.1f}" text-anchor="middle" font-size="12.5" font-style="italic" fill="#000">{escape(rel)}</text>')
out.append(f'<text x="20" y="{H - 14}" font-size="12" fill="#000">Sources: Siti Hajar Abdul Halim (2024); PUSAKA (n.d.); Kraftangan Malaysia (n.d.a, n.d.b, n.d.c); '
           'Akhi Sahrul (n.d.); Dewan Bahasa dan Pustaka (n.d.); Jabatan Kebudayaan dan Kesenian Negara (2024).</text>')
out.append('</svg>')
with open("semantic-network.svg", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("wrote semantic-network.svg", W, H)


def write_drawio(path):
    """The same network as a draw.io file: circles, straight arrows, black and white."""
    attr = lambda s: escape(s, quote=True)
    node_style = ("ellipse;aspect=fixed;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
                  "strokeWidth=1.8;fontColor=#000000;fontSize=15;")
    centre_style = node_style.replace("strokeWidth=1.8", "strokeWidth=3").replace("fontSize=15;", "fontSize=22;fontStyle=1;")
    edge_style = ("edgeStyle=none;html=1;endArrow=classic;endFill=1;strokeColor=#000000;strokeWidth=1.8;"
                  "fontSize=12;fontStyle=2;fontColor=#000000;labelBackgroundColor=#FFFFFF;")
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>',
             f'<mxCell id="title" value="{attr("<b>" + TITLE + "</b>")}" style="text;html=1;align=center;verticalAlign=middle;'
             f'fontSize=26;fontColor=#000000;" vertex="1" parent="1"><mxGeometry x="{W/2 - 500:.0f}" y="15" width="1000" height="40" as="geometry"/></mxCell>']
    for n, (x, y) in P.items():
        d = diam(n)
        value = "<br>".join(escape(l) for l in text_lines(LABELS[n]))
        cells.append(f'<mxCell id="{n}" value="{attr(value)}" style="{centre_style if n == "C" else node_style}" vertex="1" parent="1">'
                     f'<mxGeometry x="{x - d/2:.0f}" y="{y - d/2:.0f}" width="{d}" height="{d}" as="geometry"/></mxCell>')
    for i, (a, b, rel) in enumerate(EDGES):
        cells.append(f'<mxCell id="e{i}" value="{attr(rel)}" style="{edge_style}" edge="1" parent="1" source="{a}" target="{b}">'
                     f'<mxGeometry relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>')
    note = ("Sources: Siti Hajar Abdul Halim (2024); PUSAKA (n.d.); Kraftangan Malaysia (n.d.a, n.d.b, n.d.c); "
            "Akhi Sahrul (n.d.); Dewan Bahasa dan Pustaka (n.d.); Jabatan Kebudayaan dan Kesenian Negara (2024).")
    cells.append(f'<mxCell id="sources" value="{attr(note)}" style="text;html=1;align=left;fontSize=12;fontColor=#000000;" '
                 f'vertex="1" parent="1"><mxGeometry x="20" y="{H - 32}" width="1100" height="20" as="geometry"/></mxCell>')
    xml = (f'<mxfile host="app.diagrams.net"><diagram id="rubi-semantic-network" name="Semantic network">'
           f'<mxGraphModel dx="{W}" dy="{H}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" '
           f'fold="1" page="1" pageScale="1" pageWidth="{W}" pageHeight="{H}" background="#FFFFFF" math="0" shadow="0">'
           f'<root>{"".join(cells)}</root></mxGraphModel></diagram></mxfile>')
    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)
    print("wrote", path)


write_drawio("rebana-ubi-semantic-network.drawio")

edge = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if os.path.exists(edge):
    subprocess.run([edge, "--headless", "--disable-gpu", "--force-device-scale-factor=2", f"--window-size={W},{H}",
                    "--hide-scrollbars", "--screenshot=" + os.path.abspath("semantic-network.png"),
                    "file:///" + os.path.abspath("semantic-network.svg").replace("\\", "/")], check=True, capture_output=True)
    print("wrote semantic-network.png")

for p in check():
    print("CHECK", p)
