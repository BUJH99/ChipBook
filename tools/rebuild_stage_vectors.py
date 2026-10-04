#!/usr/bin/env python3
"""Rebuild one reviewed stage at a time from its measured PNG reference.

Coordinates deliberately follow the source illustrations, not a generic theme.
No default/all-stage operation: compare the requested stage before proceeding.
"""
from __future__ import annotations

import argparse
import base64
import math
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "stage-detail"
INK = "#0a1948"
WIRE = "#102c5f"
BLUE = "#0876fa"


def attrs(**values: object) -> str:
    return " ".join(f'{key.replace("_", "-")}="{escape(str(value), quote=True)}"' for key, value in values.items() if value is not None)


class Drawing:
    def __init__(self, width: int, height: int, viewbox: str, title: str, description: str):
        font = base64.b64encode((ROOT / "assets/fonts/ChipBookDiagramReference.woff2").read_bytes()).decode("ascii")
        self.parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="{viewbox}" role="img" aria-labelledby="title desc" data-font-system="reference">',
            f'<title id="title">{escape(title)}</title>', f'<desc id="desc">{escape(description)}</desc>',
            '<defs>',
            '<linearGradient id="block" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edf6ff"/><stop offset="1" stop-color="#dcecff"/></linearGradient>',
            '<linearGradient id="header" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#f5faff"/><stop offset="1" stop-color="#edf6ff"/></linearGradient>',
            '<linearGradient id="badge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e8f5ff"/><stop offset="1" stop-color="#dcefff"/></linearGradient>',
            '<linearGradient id="progress" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#eef7ff"/><stop offset=".55" stop-color="#68b0ff"/><stop offset="1" stop-color="#268aff"/></linearGradient>',
            '<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="15" markerHeight="15" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#102c5f"/></marker>',
            '<marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#0876fa"/></marker>',
            '</defs>',
            '<style id="reference-typography">'+f"@font-face{{font-family:'ChipBook Diagram Reference';src:url(data:font/woff2;base64,{font}) format('woff2');font-style:normal;font-weight:100 900;}}"+"text{font-family:'ChipBook Diagram Reference',Arial,sans-serif;fill:#0a1948}path,line,polyline{stroke-linejoin:round;stroke-linecap:round}</style>",
            f'<rect x="0" y="0" width="{width}" height="1200" fill="#fff"/>']

    def element(self, tag: str, **values: object) -> None:
        self.parts.append(f'<{tag} {attrs(**values)}/>')

    def rect(self, x: float, y: float, w: float, h: float, fill: str = "url(#block)", stroke: str = WIRE, sw: float = 2.4, r: float = 0, **extra: object) -> None:
        self.element("rect", x=x, y=y, width=w, height=h, rx=r, fill=fill, stroke=stroke, stroke_width=sw, **extra)

    def path(self, d: str, stroke: str = WIRE, sw: float = 2.5, fill: str = "none", end: bool = False, **extra: object) -> None:
        marker = extra.pop("marker_end", "url(#arrow)" if end else None)
        self.element("path", d=d, stroke=stroke, stroke_width=sw, fill=fill, marker_end=marker, **extra)

    def line(self, x1: float, y1: float, x2: float, y2: float, **extra: object) -> None:
        self.path(f"M{x1} {y1}L{x2} {y2}", **extra)

    def text(self, x: float, y: float, text: str, size: float = 29, weight: int = 400, anchor: str = "middle", color: str = INK, **extra: object) -> None:
        self.parts.append(f'<text {attrs(x=x, y=y, font_size=size, font_weight=weight, text_anchor=anchor, style=f"fill:{color}", **extra)}>{escape(text)}</text>')

    def circle(self, x: float, y: float, r: float, fill: str = WIRE, **extra: object) -> None:
        self.element("circle", cx=x, cy=y, r=r, fill=fill, **extra)

    def group(self, name: str) -> None:
        self.parts.append(f'<g id="{name}">')

    def end(self) -> None:
        self.parts.append('</g>')

    def save(self, name: str) -> None:
        (OUT / name).write_text("\n".join(self.parts + ["</svg>", ""]), encoding="utf-8")
        print(f"[vector] {name}")


def rtl_overview() -> None:
    d = Drawing(1647, 777, "0 88 1647 777", "Architecture to RTL hierarchy and synchronous datapath", "A system architecture is expressed as a top-level RTL hierarchy and register-to-register datapath. Clock and active-low reset are separate signals.")
    d.group("architecture")
    d.rect(44, 116, 479, 578, "#fff", "#7da8da", 1.8, 12, stroke_dasharray="8 7")
    d.text(283, 181, "System Architecture", 40, 700)
    d.rect(162, 230, 306, 435, sw=3.2)
    d.text(315, 280, "SOC", 36, 700)
    for y, name in [(311, "CPU"), (404, "DMA"), (495, "UART")]:
        d.rect(200, y, 240, 76, sw=3)
        d.text(320, y+49, name, 33, 600)
    for y in (596, 613, 630): d.circle(321, y, 3.6)
    d.text(103, 402, "clk", 31)
    d.line(67, 419, 158, 419, end=True, sw=2.7)
    d.text(104, 499, "rst_n", 31)
    d.line(67, 517, 158, 517, end=True, sw=2.7)
    d.end()
    d.path("M534 428H590V410L628 450L590 489V471H534Z", stroke="none", fill="url(#progress)")
    d.group("rtl-hierarchy")
    d.rect(640, 116, 966, 720, "#fff", "#7da8da", 1.8, 12, stroke_dasharray="8 7")
    d.text(1124, 178, "Top RTL Module Hierarchy", 40, 700)
    d.rect(988, 205, 293, 72, sw=3.1)
    d.text(1135, 252, "top (RTL)", 35, 650)
    d.path("M1135 278V300H835V340 M1135 300H1378V340 M1111 300V340", sw=3.1)
    for cx in (835,1111,1378): d.line(cx, 314, cx, 339, end=True, sw=3.1)
    for x, name in [(726,"cpu"),(1003,"dma"),(1280,"uart")]:
        d.rect(x, 342, 217, 105, sw=3.1)
        d.text(x+108.5, 388, name, 34, 600)
        d.text(x+108.5, 422, "(rtl)", 30)
    for x in (1528,1546,1564): d.circle(x, 394, 3.6)
    d.end()
    d.group("synchronous-submodule")
    d.rect(670, 483, 905, 322, "#fff", "#80b4ee", 1.8, 11, stroke_dasharray="8 6")
    d.text(1121, 523, "Typical RTL Submodule (Internal Structure)", 30, 650)
    d.text(738, 573, "clk", 31, anchor="end")
    d.text(748, 621, "rst_n", 29, anchor="end")
    d.line(756, 563, 1430, 563, sw=2.8)
    d.line(756, 604, 1501, 604, sw=2.8)
    for x in (860,1430):
        d.line(x,563,x,635,end=True,sw=2.8)
        d.circle(x,563,6)
    for x in (941,1501):
        d.line(x,604,x,635,end=True,sw=2.8)
        d.circle(x,604,6)
    for x in (824,1386):
        d.rect(x,637,154,126,sw=3)
        d.text(x+34,683,"D",29)
        d.text(x+120,683,"Q",29)
        d.text(x+77,735,"REG",32,650)
    d.path("M1052 622L1313 657V741L1052 777Z",fill="url(#block)",sw=3)
    d.text(1181,700,"Combinational",30,600)
    d.text(1181,734,"Logic",30,600)
    d.line(979,700,1049,700,end=True,sw=3)
    d.line(1314,700,1383,700,end=True,sw=3)
    d.end()
    d.save("rtl-overview.svg")


def rtl_detail() -> None:
    d=Drawing(2020,541,"0 113 2020 541","RTL hierarchy, clock and reset, datapath and interface","Four scenes retain the source diagram layout: RTL module hierarchy, clocked register behavior, a flip-flop and ALU datapath, and IP ports with a register map.")
    for i,(x,title) in enumerate([(18,"Hierarchy"),(517,"Clock / Reset"),(1016,"Datapath"),(1515,"Interface")],1):
        d.rect(x,141,487,484,"#fff","#bfdfff",1.2,12)
        d.rect(x+18,157,451,81,"url(#header)","none",0,12)
        d.circle(x+68,196,39,"url(#badge)",stroke="#bedfff",stroke_width=1.4)
        d.text(x+68,211,f"{i:02d}",42,650,color=BLUE)
        d.text(x+135,212,title,43,700,anchor="start")
    d.group("module-hierarchy")
    d.rect(179,278,168,59,stroke="#075ae2",sw=2.3)
    d.text(263,317,"top",30)
    d.path("M263 338V359 M120 396V359H408V396 M263 359V396",sw=2.5,stroke="#17232b")
    for x,name,cx in [(58,"cpu",114),(205,"dma",263),(352,"uart",410)]:
        d.rect(x,397,117,57,stroke="#075ae2",sw=2.3)
        d.text(x+58.5,434,name,28)
        d.path(f"M{cx} 455V484M{cx-40} 513V484H{cx+36}V513",sw=2.3,stroke="#17232b")
        for leafx in (cx-65,cx+11): d.rect(leafx,513,50,42,sw=2)
    d.end()
    d.group("clock-reset-waveforms")
    d.rect(689,271,66,303,"url(#header)","none",0,9)
    d.line(718,279,718,574,stroke=BLUE,sw=1.8,stroke_dasharray="8 7")
    for x,y,text in [(583,339,"clk"),(611,436,"rst_n"),(569,523,"q")]: d.text(x,y,text,29,anchor="end")
    d.path("M590 354H623V309H669V354H718V309H760V354H805V309H850V354H897V309H943V354H976",sw=2.4)
    d.path("M604 447H661V397H976",sw=2.4)
    d.path("M604 534H718V491H805V534H897V491H976",sw=2.4)
    d.path("M718 350V311",stroke=BLUE,sw=2,marker_end="url(#arrow-blue)")
    d.text(718,605,"rising edge",27,color=BLUE)
    d.end()
    d.group("registered-datapath")
    d.text(1040,386,"D",28)
    d.line(1034,401,1080,401,end=True,sw=2.4)
    for x in (1084,1349):
        d.rect(x,344,90,120,sw=2.3)
        d.text(x+23,389,"D",25)
        d.text(x+67,389,"Q",25)
        d.text(x+45,433,"DFF",28,500)
        d.path(f"M{x+37} 464L{x+45} 451L{x+53} 464",fill="#fff",sw=2)
    d.line(1176,401,1214,401,end=True,sw=2.3)
    d.path("M1216 326L1307 360V444L1216 479Z",fill="url(#block)",sw=2.3)
    d.text(1260,414,"ALU",29,500)
    d.line(1309,401,1347,401,end=True,sw=2.3)
    d.line(1440,401,1482,401,end=True,sw=2.3)
    d.text(1476,385,"Q",28)
    d.text(1061,541,"clk",29,anchor="end")
    d.line(1068,534,1394,534,sw=2.3)
    for x in (1129,1394): d.line(x,533,x,465,sw=2.3);d.circle(x,534,4.5)
    d.end()
    d.group("ip-interface-register-map")
    d.rect(1647,278,120,282,stroke="#0c4bba",sw=2.2)
    for y,name in [(327,"clk"),(377,"rst_n"),(423,"valid")]:
        d.text(1596,y+8,name,27,anchor="end")
        d.line(1606,y,1645,y,end=True,sw=2.3)
    d.text(1627,477,"data[31:0]",24,anchor="end")
    d.line(1631,470,1645,470,end=True,sw=2.3)
    d.text(1596,530,"ready",27,anchor="end")
    d.line(1646,521,1606,521,end=True,sw=2.3)
    d.text(1707,426,"my_ip",32,600)
    d.rect(1787,261,200,291,"#fff","#bfdfff",1.3,8)
    d.rect(1788,262,198,47,"url(#header)","none",0,7)
    d.rect(1788,310,198,38,"url(#header)","none",0)
    for y in (309,348,389,429,469,509): d.line(1788,y,1986,y,stroke="#cbe4f9",sw=1.2)
    d.line(1874,310,1874,551,stroke="#cbe4f9",sw=1.2)
    d.text(1887,293,"Register Map",26,600)
    d.text(1831,338,"Addr",26,550)
    d.text(1930,338,"Name",26,550)
    for y,address,name in [(377,"0x00","CTRL"),(417,"0x04","STATUS"),(457,"0x08","DATA"),(497,"0x0C","INT_EN"),(538,"...","...")]:
        d.text(1831,y,address,25)
        d.text(1930,y,name,25)
    d.end()
    d.save("rtl-detail.svg")


def spec_palette(d: Drawing) -> None:
    for name,c1,c2 in [('spec-blue','#e4f4ff','#cae4fc'),('spec-green','#e7f9ed','#daf0e3'),('spec-purple','#f0ebff','#e5ddfa'),('spec-orange','#fff5e6','#ffeacc')]:
        d.parts.append(f'<defs><linearGradient id="{name}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>')


def reference_icon(d: Drawing, kind: str, x: float, y: float, s: float = 1, color: str = BLUE) -> None:
    """Small outline icons measured in a local 64 x 64 coordinate system."""
    d.parts.append(f'<g transform="translate({x} {y}) scale({s})">')
    def p(path: str, **kw: object) -> None: d.path(path,stroke=color,sw=4,**kw)
    if kind=='chip':
        d.rect(12,12,40,40,'#fff',color,4,1)
        d.rect(23,23,18,18,'url(#spec-blue)','none',0)
        for a in (17,27,37,47): p(f'M{a} 5V11 M{a} 53V59 M5 {a}H11 M53 {a}H59')
    elif kind=='memory':
        d.rect(5,16,54,32,'none',color,4,1)
        for a in (15,29,43):d.rect(a,24,6,14,color,'none',0)
        for a in (15,28,41,52):p(f'M{a} 44V49')
    elif kind in ('power','power-outline'):p('M38 6L17 34H31L24 58L46 27H33Z',fill=color if kind=='power' else 'none')
    elif kind=='gauge':
        p('M4 45A28 28 0 0 1 60 45 M4 45H11 M53 45H60 M32 17V23 M13 25L18 29 M51 25L46 29 M32 45L46 27')
        d.circle(32,45,5,color)
    elif kind=='people':
        d.circle(32,21,12,'none',stroke=color,stroke_width=4)
        p('M32 35C17 35 10 45 10 58H54C54 45 47 35 32 35 M10 16C1 22 3 32 12 35 M4 39C-2 43 -3 51 -2 55 M54 16C63 22 61 32 53 35 M59 39C66 44 66 50 66 55')
    elif kind=='document':
        p('M13 3H37L54 21V61H13Z M37 3V21H54 M23 31H33 M23 40H42 M23 49H31')
    elif kind=='target':
        p('M45 7A29 29 0 1 0 58 25 M42 21A17 17 0 1 0 46 31 M32 35L60 7 M52 6L58 10L60 17L66 10L60 6L58 0Z')
        d.circle(32,35,5,color)
    elif kind=='car':
        p('M10 24L17 10H46L54 24 M6 25H58V44H6Z M17 45V51 M47 45V51')
        for cx in (17,47):d.circle(cx,36,4,'none',stroke=color,stroke_width=3)
    elif kind=='phone':
        d.rect(16,5,32,51,'none',color,4,1)
        p('M17 48H47 M26 10H37')
    elif kind=='server':
        for yy in (8,31):
            d.rect(8,yy,48,18,'none',color,4,1);d.circle(18,yy+9,2.7,color);p(f'M43 {yy+9}H47')
        p('M12 26V31 M51 26V31')
    elif kind=='network':
        p('M32 15L13 46H51Z')
        for cx,cy in ((32,15),(13,46),(51,46)):d.circle(cx,cy,8,'#fff',stroke=color,stroke_width=4)
    elif kind=='arrows':p('M8 38H35 M8 38L18 28 M8 38L18 48 M54 24H27 M54 24L44 14 M54 24L44 34')
    d.end()


def spec_overview() -> None:
    d=Drawing(1665,782,'0 98 1665 782','Requirements, PPA and SoC architecture','The original product requirements panel feeds a CPU, memory, interconnect and peripheral architecture. Power, performance and area constrain that architecture.')
    spec_palette(d)
    d.rect(49,128,449,551,'url(#header)',BLUE,2.8,14)
    d.text(274,190,'Product Requirements',36,700)
    for y,icon,labels in [(222,'document',['Functional','Requirements']),(373,'people',['Application / Market','Requirements']),(522,'target',['Target Use Cases'])]:
        d.rect(76,y,395,132,'#fff','#d2e5fc',2,13)
        reference_icon(d,icon,104,y+29,1.08)
        for j,t in enumerate(labels):d.text(204,y+(73 if len(labels)==1 else 56+j*35),t,28,650,anchor='start')
    d.rect(563,127,1056,538,'#fff','#67a6fa',2,13,stroke_dasharray='12 8')
    d.path('M497 395H545V376L581 413L545 450V430H497Z',stroke='none',fill='url(#progress)')
    d.text(1090,179,'SoC Architecture',36,700)
    for x,w,name,fill,color in [(626,424,'CPU','spec-blue','#399aff'),(1153,408,'Memory','spec-green','#48c38a')]:
        d.rect(x,202,w,95,f'url(#{fill})',color,2.3,9);d.text(x+w/2,261,name,34,700)
    d.rect(626,354,935,89,'url(#spec-blue)','#399aff',2.3,9)
    d.text(1094,411,'Interconnect',34,650)
    for x,w,name,sub,fill,color in [(626,284,'Peripherals','(UART / I2C / SPI)','spec-purple','#9c7cff'),(937,283,'Accelerator','(AI / DSP)','spec-orange','#ffb35d'),(1247,314,'IO','(PCIe / USB / Ethernet)','spec-blue','#399aff')]:
        d.rect(x,502,w,113,f'url(#{fill})',color,2.2,9)
        d.text(x+w/2,550,name,29,650);d.text(x+w/2,589,sub,27)
    for x,y1,y2 in [(837,302,350),(1356,302,350),(768,448,498),(1079,448,498),(1405,448,498)]:
        d.line(x,y1,x,y2,stroke=BLUE,sw=5,marker_start='url(#arrow-blue)',marker_end='url(#arrow-blue)')
    for x in (744,1079,1425):
        d.line(x,735,x,684,stroke=BLUE,sw=8)
        d.path(f'M{x} 666L{x-17} 690H{x+17}Z',stroke='none',fill=BLUE)
    d.rect(565,736,1054,115,'#f4f9ff','#99bde9',2.4,13)
    d.text(599,805,'PPA Constraints',30,700,anchor='start')
    for x,icon,label,tx in [(894,'power-outline','Power',969),(1087,'gauge','Performance',1175),(1387,'chip','Area',1480)]:
        reference_icon(d,icon,x,763,1.05);d.text(tx,805,label,28,anchor='start')
    d.save('spec-overview.svg')


def spec_detail() -> None:
    d=Drawing(2017,581,'0 101 2017 581','Use cases, PPA balance, hierarchy and interfaces','Four unframed scenes reproduce the source: application types feed SoC scope, the PPA triangle balances design, an SoC expands into blocks, and an interconnect links those blocks.')
    spec_palette(d)
    for x in (507,1009,1510):d.line(x,129,x,654,stroke='#cfe5ff',sw=1.5)
    for y,icon,name in [(150,'car','Automotive'),(279,'phone','Mobile'),(409,'server','Data Center'),(538,'people','Consumer')]:
        d.rect(32,y,140,105,'url(#header)','#93bcfa',1.7,11)
        reference_icon(d,icon,72,y+13,.9)
        d.text(102,y+86,name,22,550)
    d.rect(264,225,215,305,'#fff','#91bdff',1.7,11,stroke_dasharray='8 6')
    d.text(371,266,'SoC',28,650)
    d.rect(280,289,183,107,'url(#spec-blue)','#5c9bff',1.7,11);d.text(371,351,'Core Function',24,550)
    d.rect(280,411,183,98,'url(#header)','#add2ff',1.7,11)
    d.text(371,454,'External',24,550);d.text(371,480,'Interfaces',24,550)
    for yy,ty in [(202,307),(331,363),(463,424),(590,482)]:
        mid=(yy+ty)/2
        d.path(f'M173 {yy}H201Q220 {yy} 220 {yy+(18 if ty>yy else -18)}V{ty+(-18 if ty>yy else 18)}Q220 {ty} 239 {ty}H260',stroke=BLUE,sw=2.4,marker_end='url(#arrow-blue)')
    d.path('M610 523L756 247L904 523Z',stroke='#599aff',sw=4)
    d.path('M650 273Q573 327 578 420 M863 273Q936 325 935 420 M681 569Q756 602 831 569',stroke='#e3f1ff',sw=10)
    d.circle(756,420,81,'url(#header)')
    d.text(756,416,'Balanced',25,650);d.text(756,443,'Design',25,650)
    for x,y,r,fill,color,icon,label,iy,ty in [(756,246,92,'spec-blue','#399aff','gauge','Performance',182,272),(610,506,78,'spec-green','#43c68c','power','Power',457,538),(902,506,78,'spec-purple','#9771ff','chip','Area',457,539)]:
        d.circle(x,y,r,f'url(#{fill})',stroke=color,stroke_width=1.7)
        scale=.83 if icon=='chip' else 1.05
        reference_icon(d,icon,x-32*scale,iy,scale,BLUE if icon=='gauge' else '#09ab83' if icon=='power' else '#7944e2')
        d.text(x,ty,label,26,650)
    d.rect(1131,215,261,85,'url(#spec-blue)',BLUE,1.8,10);d.text(1261,267,'SoC',34,650)
    d.path('M1261 301V351H1113Q1102 351 1102 364V399 M1261 351H1408Q1421 351 1421 364V399 M1261 351V399',stroke=BLUE,sw=2.3)
    for cx in (1102,1261,1421):d.line(cx,374,cx,399,stroke=BLUE,sw=2.3,marker_end='url(#arrow-blue)')
    for x,w,name,fill,color,icon in [(1038,134,'CPU','spec-blue','#399aff','chip'),(1189,145,'Memory','spec-green','#44cb99','memory'),(1350,135,'Peripheral','spec-orange','#ffaa40','chip')]:
        d.rect(x,407,w,136,f'url(#{fill})',color,1.5,11)
        reference_icon(d,icon,x+w/2-30,428,.94,BLUE if icon=='chip' else '#0bb38e')
        d.text(x+w/2,520,name,24,550)
    for x,y,w,h,name,fill,color,icon in [(1537,245,119,113,'CPU','header','#4b9bff','chip'),(1537,406,119,115,'DMA','header','#8fc4ff','arrows'),(1861,245,128,113,'Memory','spec-green','#43c891','memory'),(1861,406,128,115,'Peripheral','spec-orange','#ffaa40','chip')]:
        d.rect(x,y,w,h,f'url(#{fill})',color,1.7,10)
        reference_icon(d,icon,x+w/2-24,y+16,.75,'#09aa86' if name=='Memory' else BLUE)
        d.text(x+w/2,y+94,name,22,550)
    d.rect(1697,234,122,289,'url(#header)',BLUE,1.8,11)
    reference_icon(d,'network',1728,328,.95)
    d.text(1758,416,'Interconnect',20,550)
    for x1,x2 in ((1659,1693),(1823,1857)):
        for yy in (301,462):d.line(x1,yy,x2,yy,stroke=BLUE,sw=2.4,marker_start='url(#arrow-blue)',marker_end='url(#arrow-blue)')
    d.save('spec-detail.svg')


def dv_chip(d: Drawing,x: float,y: float,w: float,h: float,sw: float=3) -> None:
    pin=max(10,w*.095)
    for f in ((.18,.50,.82) if w<200 else (.16,.33,.50,.67,.84)):
        cx=x+w*f
        d.rect(cx-pin/2,y-pin,pin,pin,'#f4f9ff','#0d2136',sw,1)
        d.rect(cx-pin/2,y+h,pin,pin,'#f4f9ff','#0d2136',sw,1)
    for f in ((.25,.50,.75) if w<200 else (.22,.42,.62,.82)):
        cy=y+h*f
        d.rect(x-pin,cy-pin/2,pin,pin,'#f4f9ff','#0d2136',sw,1)
        d.rect(x+w,cy-pin/2,pin,pin,'#f4f9ff','#0d2136',sw,1)
    d.rect(x,y,w,h,'url(#block)','#0d2136',sw,max(8,w*.06))


def dv_overview() -> None:
    d=Drawing(1666,775,'0 103 1666 775','Functional verification loop','Driver stimulus goes to the DUT and reference model. Monitor observations and expected transactions meet at the scoreboard. Debug feeds back to the DUT.')
    d.parts.append('<defs><marker id="dv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="31" markerHeight="31" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2084ff"/></marker><marker id="dv-red" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="31" markerHeight="31" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#ff1735"/></marker></defs>')
    for path in ('M373 277H672','M991 277H1292','M216 387V745H282','M591 745H898','M1452 387V745H1208'):
        d.path(path,stroke='#2084ff',sw=9,marker_end='url(#dv-arrow)')
    d.path('M1031 630V517H833V419',stroke='#ff1735',sw=4.5,stroke_dasharray='14 12',marker_end='url(#dv-red)')
    for x,y,w,h,label in [(60,161,312,225,'Driver'),(1295,161,313,225,'Monitor'),(284,633,306,215,'Reference model'),(900,630,305,214,'Scoreboard')]:
        d.rect(x,y,w,h,'url(#block)',BLUE,5.5,17)
        d.text(x+w/2,y+69 if y<200 else y+64,label,39 if label in ('Driver','Monitor') else 36,700)
    dv_chip(d,703,161,261,229,4.7);d.text(834,295,'DUT',44,750)
    d.path('M183 257H237L260 279V343Q260 350 253 350H182Q175 350 175 343V265Q175 257 183 257Z M237 257V279H260 M198 295H237 M198 311H237 M198 327H237',stroke=BLUE,sw=5.5)
    d.circle(1452,295,32,'none',stroke=BLUE,stroke_width=6)
    d.line(1475,319,1496,341,stroke=BLUE,sw=10)
    d.parts.append('<g transform="translate(388 722)">')
    d.path('M41 1H57L60 13L70 17L80 10L92 22L85 33L90 42L101 45V59L88 62L84 72L91 83L80 94L68 87L58 91L55 103H40L37 91L27 87L16 93L5 81L12 70L8 60L-4 57V43L9 40L13 29L6 18L18 7L29 15L38 11Z',stroke=BLUE,sw=6)
    d.circle(49,50,17,'none',stroke=BLUE,stroke_width=6);d.end()
    d.path('M1048 808H1005Q997 808 997 800V725Q997 716 1005 716H1072Q1081 716 1081 725V756 M1019 743H1059 M1019 763H1051 M1019 781H1038',stroke=BLUE,sw=6)
    d.circle(1084,797,29,'#f3f9ff',stroke=BLUE,stroke_width=6)
    d.path('M1069 796L1079 806L1097 786',stroke=BLUE,sw=6)
    for x,y,t,size in [(518,254,'Stimulus',34),(1133,256,'Observed',34),(138,577,'Stimulus',32),(739,695,'Expected',31),(739,728,'transactions',31),(1541,706,'Observed',31),(1555,738,'transactions',31)]:d.text(x,y,t,size,600,color=BLUE)
    d.text(960,486,'Debug',33,600,color='#ff1735')
    d.save('dv-overview.svg')


def dv_detail() -> None:
    d=Drawing(2076,647,'0 44 2076 647','Testbench, simulation, debug and coverage','Four reference-matched panels: test scenarios and DUT loop, time-aligned digital waveforms, highlighted mismatch with debug loop, and coverage bins.')
    d.parts.append('<g transform="scale(1.013671875)">')
    for i,(x,title) in enumerate([(25,'Testbench'),(530,'Simulation'),(1034,'Debug'),(1544,'Coverage')],1):
        d.rect(x,73,481,581,'#fff','#65aeff',2,6)
        d.rect(x+1,74,479,82,'url(#header)','none',0,5)
        d.circle(x+49,118,33,'#2985ff')
        d.text(x+49,132,str(i),39,650,color='#fff')
        d.text(x+108,131,title,36,700,anchor='start',color='#00168c' if i in (2,4) else INK)
    d.rect(47,223,165,320,'#fff','#61a9ff',1.7,10)
    d.rect(48,224,163,44,'url(#header)','none',0,10)
    d.text(130,255,'Test Scenarios',22,650)
    for y,t in [(278,'Initialization'),(330,'Directed test'),(382,'Random test'),(434,'Corner case'),(486,'Sequence')]:
        d.rect(60,y,139,41,'#fff','#c7dced',1.5,11);d.text(129.5,y+28,t,20,450)
    for x,y,w,h,lines in [(250,170,205,83,['Testbench','(Driver)']),(249,549,204,83,['Monitor','(Scoreboard)'])]:
        d.rect(x,y,w,h,'url(#block)','#58a2ff',1.8,8)
        for j,t in enumerate(lines):d.text(x+w/2,y+33+j*27,t,23,600)
    dv_chip(d,284,341,134,113,2.5);d.text(351,409,'DUT',29,700)
    for path in ('M352 254V321','M351 470V542','M212 397H265','M454 590H470V397H438'):
        d.path(path,stroke=BLUE,sw=3,marker_end='url(#arrow-blue)')
    d.text(362,290,'Stimulus',22,400,anchor='start')
    d.text(339,511,'Response',22,400,anchor='end')
    d.text(462,503,'Check',22,400,anchor='end')
    for x in (654,739,816,891,966):d.line(x,172,x,552,stroke='#c2c8d3',sw=1.4,stroke_dasharray='8 6')
    for y,t in [(247,'clk'),(325,'rst_n'),(404,'din [7:0]'),(489,'dout [7:0]')]:d.text(637,y,t,22,500,anchor='end')
    d.path('M654 256H677V218H713V256H749V218H785V256H821V218H857V256H893V218H929V256H966',stroke=INK,sw=2.7)
    d.path('M654 334H710V296H966',stroke=INK,sw=2.7)
    for y in (371,458):
        d.line(654,y+24,966,y+24,stroke=INK,sw=1.8)
        for x,w,t in [(661,82,'00'),(742,76,'12'),(818,75,'34'),(893,75,'56')]:
            d.path(f'M{x+9} {y}H{x+w-9}Q{x+w-3} {y} {x+w} {y+24}Q{x+w-3} {y+47} {x+w-9} {y+47}H{x+9}Q{x+3} {y+47} {x} {y+24}Q{x+3} {y} {x+9} {y}Z',stroke=INK,sw=1.6,fill='#f9fbff')
            d.text(x+w/2,y+32,t,23,450)
    d.line(654,553,990,553,end=True,sw=2)
    for x,t in [(654,'0'),(739,'20'),(816,'40'),(891,'60'),(966,'80')]:d.line(x,545,x,563,stroke=INK,sw=1.4);d.text(x,588,t,20)
    d.text(816,622,'Time (ns)',22,500)
    d.rect(1302,206,49,187,'#fff2ef','#ff595f',1.5,5,stroke_dasharray='7 7')
    d.path('M1160 272H1185V239H1220V272H1253V239H1286V272H1314V239H1348V272H1374V239H1409V272H1443V239H1478V272H1491',stroke=BLUE,sw=2.7)
    d.path('M1160 346H1185V313H1220V346H1253V313H1286V346H1320V354M1330 354V346H1348V313H1374V346H1409V313H1443V346H1478V313H1491',stroke='#ff3443',sw=2.7)
    d.path('M1320 364V370H1328V364',stroke='#ff3443',sw=2)
    d.text(1145,276,'Expected',22,500,anchor='end',color=BLUE)
    d.text(1145,348,'Actual',22,500,anchor='end',color='#ff3443')
    d.text(1109,413,'Mismatch',22,500,color='#ff3443')
    d.line(1326,450,1326,407,stroke='#ff3443',sw=1.5)
    d.path('M1326 406L1321 413H1331Z',fill='#ff3443',stroke='none')
    d.rect(1202,450,249,47,'#fff1ee','#ff6673',1.3,5)
    d.text(1326,482,'Mismatch @ 120ns',23,600,color='#991e25')
    d.path('M1453 532V548Q1453 579 1422 579H1135Q1102 579 1102 547V522',stroke='#218aff',sw=3.5)
    d.path('M1092 537L1102 521L1112 537',stroke='#218aff',sw=3.5)
    d.text(1286,563,'Debug & Fix',22,600,color=BLUE)
    for y,t,covered in [(177,'Normal',6),(316,'Boundary',4),(454,'Error',2)]:
        d.rect(1573,y,427,122,'#fff','#b4d8fb',1.4,10)
        d.rect(1574,y+1,425,58,'url(#header)','none',0,9)
        d.text(1592,y+41,t,29,650,anchor='start')
        for k in range(9):d.rect(1593+k*44,y+67,35,35,'#3495ff' if k<covered else '#e2ebf2','none',0,4)
    d.rect(1591,596,34,35,'#2985ff','none',0,4);d.text(1638,622,'Covered',22,400,anchor='start')
    d.rect(1791,597,34,35,'#d9e4ed','none',0,4);d.text(1838,622,'Uncovered',22,400,anchor='start')
    for x in (494,994,1506):
        d.rect(x-3,343,48,45,'#fff','none',0)
        d.path(f'M{x} 357H{x+22}V345L{x+49} 366L{x+22} 387V374H{x}Z',stroke='none',fill='#268cff')
    d.end();d.save('dv-detail.svg')


def logic_gate(d: Drawing,kind: str,x: float,y: float,w: float,h: float,sw: float=2.7,fill: str='url(#block)') -> None:
    if kind=='and':path=f'M{x} {y}H{x+w*.48}C{x+w*1.17} {y} {x+w*1.17} {y+h} {x+w*.48} {y+h}H{x}Z'
    elif kind in ('or','xor'):
        path=f'M{x} {y}Q{x+w*.66} {y-h*.1} {x+w} {y+h*.5}Q{x+w*.66} {y+h*1.1} {x} {y+h}Q{x+w*.29} {y+h*.5} {x} {y}Z'
        if kind=='xor':d.path(f'M{x-10} {y}Q{x+w*.29-10} {y+h*.5} {x-10} {y+h}',sw=sw)
    else:path=f'M{x} {y}L{x+w*.80} {y+h*.5}L{x} {y+h}Z'
    d.path(path,sw=sw,fill=fill)
    if kind=='not':d.circle(x+w*.92,y+h*.5,w*.10,'#fff',stroke=WIRE,stroke_width=sw)


def synthesis_ff(d: Drawing,x: float,y: float,w: float,h: float) -> None:
    d.rect(x,y,w,h,'url(#block)',WIRE,2.7)
    d.text(x+w*.22,y+h*.43,'D',24);d.text(x+w*.73,y+h*.43,'Q',24)
    d.path(f'M{x} {y+h*.66}L{x+18} {y+h*.77}L{x} {y+h*.88}',sw=2.7)


def synthesis_overview() -> None:
    d=Drawing(1665,814,'0 63 1665 814','RTL, constraints and library to gate-level netlist','The source layout compares behavioral RTL and a standard-cell netlist, with library and SDC inputs above the synthesis arrow. Clock nets remain separate from data signals.')
    spec_palette(d)
    for x,w,t,tx in [(370,495,'Standard-cell library',473),(890,407,'SDC constraints',1004)]:
        d.rect(x,92,w,209,'url(#header)','#2787ff',2.7,15)
        reference_icon(d,'document',x+21,111,.99)
        d.text(tx,148,t,34,650,anchor='start')
    logic_gate(d,'and',407,205,64,60)
    logic_gate(d,'or',522,205,66,60);d.line(588,235,607,235,sw=2.5)
    logic_gate(d,'not',647,208,54,56)
    synthesis_ff(d,748,181,79,93)
    d.path('M976 244H1004V208H1034V244H1064V208H1093V244H1121',stroke=BLUE,sw=3.5)
    d.path('M1163 187H1209L1228 207V261Q1228 270 1219 270H1163Q1154 270 1154 261V196Q1154 187 1163 187Z M1209 187V207H1228 M1171 209H1200 M1171 229H1211 M1171 249H1200',stroke=BLUE,sw=4)
    d.path('M603 302V325Q603 343 621 343H804Q833 343 833 373V438 M1063 302V325Q1063 343 1045 343H861Q833 343 833 373',stroke='#2a8aff',sw=8)
    d.path('M813 436H853L833 467Z',fill='#2a8aff',stroke='none')
    d.rect(33,382,654,466,'url(#header)','#77baff',2.2,20)
    d.text(65,442,'Behavioral RTL',39,700,anchor='start')
    d.rect(67,470,372,276,'#f8fbff','#7eb9ff',1.5,13,stroke_dasharray='7 7')
    d.rect(457,470,200,335,'#f8fbff','#7eb9ff',1.5,13,stroke_dasharray='7 7')
    d.text(98,507,'Logic',31,600,anchor='start',color=BLUE);d.text(485,507,'Registers',31,600,anchor='start',color=BLUE)
    d.text(96,575,'a',31);d.text(96,644,'b',31);d.text(89,791,'clk',30)
    d.path('M121 567H212 M176 567V648H218 M121 638H204V672H217 M284 554H317V596H344 M283 662H317V622H344 M404 607H474V570H514 M474 607V709H514 M121 782H495V607H514 M495 782V748H514',sw=2.4)
    for x,y in [(176,567),(474,607),(495,748)]:d.circle(x,y,5.5)
    logic_gate(d,'and',213,520,73,69)
    logic_gate(d,'or',212,628,74,69)
    logic_gate(d,'buffer',344,570,75,74)
    synthesis_ff(d,514,528,93,102);synthesis_ff(d,514,668,93,103)
    for yy in (568,710):d.line(608,yy,657,yy,end=True,sw=2.8)
    d.path('M705 558H893V521L965 608L893 693V656H705Z',fill='#2889ff',stroke='none')
    d.text(833,621,'Synthesis',37,700,color='#fff')
    d.rect(980,382,654,466,'url(#spec-green)','#83dfad',2.2,20)
    d.text(1017,442,'Gate-level netlist',39,700,anchor='start')
    d.text(1022,548,'a',30);d.text(1022,634,'b',30);d.text(1024,803,'clk',30)
    d.path('M1051 538H1164 M1103 538V713H1170 M1051 624H1170 M1135 624V560H1164 M1232 624H1250V654H1150V690H1170 M1237 543H1266V575H1299 M1242 703H1266V601H1299 M1372 588H1406V562H1448 M1406 588V704H1448 M1051 792H1427V598H1448 M1427 792V748H1448',sw=2.5)
    for x,y in [(1103,538),(1135,624),(1406,588),(1427,748)]:d.circle(x,y,5.5)
    logic_gate(d,'and',1165,508,73,69)
    logic_gate(d,'not',1171,598,59,52)
    logic_gate(d,'or',1171,668,74,69)
    logic_gate(d,'or',1295,554,78,69)
    synthesis_ff(d,1448,514,96,109);synthesis_ff(d,1448,667,96,109)
    for yy in (560,714):d.line(1545,yy,1605,yy,end=True,sw=2.8)
    d.save('synthesis-overview.svg')


def synthesis_detail() -> None:
    d=Drawing(2073,672,'0 33 2073 672','Elaboration, mapping, optimization and timing','RTL becomes register and operator structures, maps to a standard-cell library, is optimized without changing behavior, and is checked for setup and hold timing.')
    d.parts.append('<g transform="scale(1.01220703125)">')
    for i,(x,w,title) in enumerate([(20,477,'Elaboration'),(527,482,'Mapping'),(1034,491,'Optimization'),(1550,478,'Timing')],1):
        d.rect(x,61,w,631,'#fff','#d5eaff',1.5,13)
        d.rect(x+1,62,w-2,84,'url(#header)','none',0,12)
        d.circle(x+56,105,34,'#c2e6ff',stroke='#a0ceff',stroke_width=1.5)
        d.text(x+56,120,f'{i:02d}',40,650,color='#0763f8')
        d.text(x+123,118,title,42,700,anchor='start')
    d.rect(45,170,426,208,'#f5faff','#c4e2ff',1.5,12)
    code=[(62,208,[('always','#0763f8'),(' @(',INK),('posedge','#0763f8'),(' clk) ',INK),('begin','#0763f8')]),(89,238,[('if','#0763f8'),(' (!rst_n)',INK)]),(117,268,[("cnt <= 8'd0;",INK)]),(89,298,[('else if','#0763f8'),(' (en)',INK)]),(127,328,[('cnt <= cnt + 1;',INK)]),(62,358,[('end','#0763f8')])]
    for x,y,segments in code:
        d.parts.append(f'<text x="{x}" y="{y}" font-size="24" font-weight="400" style="font-family:Consolas,\'Courier New\',monospace">'+''.join(f'<tspan style="fill:{color}">{escape(t)}</tspan>' for t,color in segments)+'</text>')
    d.path('M239 390H272V416H288L255 448L222 416H239Z',fill='url(#progress)',stroke='none')
    d.rect(176,460,168,169,'url(#block)',WIRE,2.5,6)
    for y,t in [(522,'Register'),(555,'&'),(588,'Operators')]:d.text(260,y,t,27,450)
    for y,t in [(494,'rst_n'),(543,'en'),(592,'clk')]:d.text(100,y+8,t,26,400,anchor='end');d.line(109,y,172,y,sw=2.5,end=True)
    d.line(346,536,385,536,sw=2.5,end=True);d.text(394,544,'cnt[7:0]',25,400,anchor='start')
    d.rect(602,170,334,139,'#f5faff','#c4e2ff',1.5,12)
    d.circle(749,242,43,'url(#block)',stroke=WIRE,stroke_width=2.7)
    d.line(733,242,765,242,sw=2.5);d.line(749,226,749,258,sw=2.5)
    for y,t in [(223,'a'),(263,'b')]:d.text(628,y+8,t,26);d.line(650,y,704,y,sw=2.5,end=True)
    d.line(793,242,857,242,sw=2.5,end=True);d.text(874,250,'sum',26,anchor='start')
    d.path('M747 317H778V344H795L763 375L731 344H747Z',fill='url(#progress)',stroke='none')
    d.rect(570,369,397,299,'#fff','#75aef3',1.5,9,stroke_dasharray='7 7')
    for y,kind,label in [(389,'and','AND2_X1'),(467,'or','OR2_X1'),(543,'xor','XOR2_X1')]:
        logic_gate(d,kind,674 if kind=='and' else 666,y,70 if kind=='and' else 79,65,2.4)
        d.line(643,y+16,675,y+16,sw=2.3);d.line(643,y+47,675,y+47,sw=2.3)
        d.line(746,y+32,775,y+32,sw=2.3);d.text(793,y+40,label,28,400,anchor='start')
    d.text(769,650,'Standard-cell library',28,450)
    for y,h in [(170,178),(444,179)]:d.rect(1062,y,436,h,'#f5faff','#c4e2ff',1.4,12)
    d.text(1080,207,'Before',29,650,anchor='start',color='#0763f8');d.text(1180,207,'(redundant gates)',27,400,anchor='start')
    d.text(1080,482,'After',29,650,anchor='start',color='#0763f8');d.text(1153,482,'(optimized)',27,400,anchor='start')
    d.text(1089,289,'in',27);d.text(1467,288,'out',27)
    d.line(1119,282,1180,282,sw=2.4,end=True);logic_gate(d,'not',1183,241,74,80,2.7)
    d.line(1259,282,1308,282,sw=2.4,end=True);logic_gate(d,'not',1311,241,75,80,2.7)
    d.line(1389,282,1437,282,sw=2.4,end=True)
    d.path('M1256 374H1289V401H1305L1273 432L1241 401H1256Z',fill='url(#progress)',stroke='none')
    d.text(1091,563,'in',27);d.text(1455,563,'out',27)
    d.line(1123,554,1422,554,sw=2.5,end=True)
    d.text(1598,274,'clk',29);d.text(1598,364,'data',29);d.text(1597,464,'q',29)
    d.path('M1646 271H1685V231H1740V271H1794V231H1850V271H1910V231H1965V271H2001',stroke='#1c6dff',sw=2.5)
    d.path('M1646 353H1701 M1701 353L1717 327H1802L1818 353L1802 378H1717Z M1802 353L1818 328H1930L1945 353L1930 378H1818Z M1945 353H2001',stroke=INK,sw=2.5)
    d.parts.append('<defs><pattern id="timing-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><line x1="0" y1="0" x2="0" y2="6" stroke="#93b6e7" stroke-width="1.2"/></pattern></defs>')
    d.path('M1804 353L1819 330H1897V376H1819Z',stroke='none',fill='url(#timing-hatch)')
    d.path('M1646 460H1798L1812 428H2001',stroke=INK,sw=2.5)
    for x,y1,y2 in [(1794,212,553),(1735,298,530),(1740,298,530),(1895,298,530),(1901,298,530)]:d.line(x,y1,x,y2,stroke='#79a6df',sw=1.5,stroke_dasharray='7 6')
    for x1,x2 in [(1743,1789),(1799,1894)]:d.line(x1,512,x2,512,sw=2.8,end=True,marker_start='url(#arrow)')
    d.text(1740,566,'Setup',28);d.text(1888,566,'Hold',28)
    for x in (487,990,1504):d.path(f'M{x} 339H{x+27}V319L{x+60} 359L{x+27} 399V379H{x}Z',fill='url(#progress)',stroke='none')
    d.end();d.save('synthesis-detail.svg')


def scan_mux(d: Drawing,x: float,y: float,w: float,h: float) -> None:
    d.path(f'M{x} {y}L{x+w} {y+h*.19}V{y+h*.81}L{x} {y+h}Z',sw=1.8,fill='#eff7ff')
    d.text(x+w*.47,y+h*.37,'0',20);d.text(x+w*.47,y+h*.78,'1',20)


def dft_overview() -> None:
    d=Drawing(1666,789,'0 82 1666 789','Scan insertion and multi-power-domain intent','The normal register chain gains scan multiplexers and scan enable. Always-on and power-gated domains are joined through level shifting and isolation cells, with distinct signal nets.')
    d.parts.append('<defs><linearGradient id="dft-green"><stop stop-color="#f2fff7"/><stop offset="1" stop-color="#e8faf0"/></linearGradient></defs>')
    d.text(59,161,'DFT:',41,750,anchor='start',color=BLUE);d.text(152,161,'Scan Chain',41,750,anchor='start')
    d.text(904,161,'Power Intent:',41,750,anchor='start',color=BLUE);d.text(1158,161,'Multi-Power Domains',41,750,anchor='start')
    d.line(871,110,871,843,stroke='#adc9e9',sw=1.3,stroke_dasharray='7 7')
    for x,w in [(22,828),(891,753)]:d.rect(x,188,w,634,'#fff','#b3cde9',1.3,13,stroke_dasharray='8 6')
    for y,h in [(201,244),(533,276)]:d.rect(36,y,800,h,'url(#header)','none',0,19)
    d.text(67,238,'Functional Flip-Flops (Normal Mode)',28,600,anchor='start')
    d.text(66,569,'Scan Chain (Test Mode)',29,600,anchor='start')
    for x in (157,350,625):
        d.rect(x,286,119,111,'url(#block)',WIRE,2.3)
        d.text(x+24,350,'D',27,450);d.text(x+95,350,'Q',27,450)
    for x1,x2 in [(94,154),(277,347),(470,518),(580,622),(745,790)]:d.line(x1,341,x2,341,stroke='#0870e8',sw=2.4,marker_end='url(#arrow-blue)')
    d.text(72,350,'D',28);d.text(809,350,'Q',28)
    for x in (534,550,566):d.circle(x,342,2.3)
    d.path('M421 457H449V493H464L435 522L406 493H421Z',fill='url(#progress)',stroke='none')
    d.text(492,496,'Scan Insertion',29,600,anchor='start',color=BLUE)
    for mx,fx in [(175,225),(393,438),(603,647)]:
        scan_mux(d,mx,638,30,85)
        d.rect(fx,632,82 if fx<600 else 76,97,'url(#block)',WIRE,2.1)
        d.text(fx+16,690,'D',22);d.text(fx+61,690,'Q',22)
        d.line(mx+31,681,fx-1,681,sw=2)
        d.text(mx-22,602,'D',22)
        d.path(f'M{mx-22} 611V658H{mx-1}',sw=1.9,end=True)
    d.text(47,709,'Scan In',23,450,anchor='start')
    for p in ['M125 702H173','M308 681H334V702H391','M576 702H601','M724 681V702H744']:
        d.path(p,stroke=BLUE,sw=2,marker_end='url(#arrow-blue)')
    d.line(521,681,527,681,stroke=BLUE,sw=2)
    for x in (536,551,566):d.circle(x,682,2.5)
    d.text(751,709,'Scan Out',22,450,anchor='start')
    d.path('M191 721V774H615V714 M406 716V774',stroke=BLUE,sw=2.2)
    for x in (191,406,615):d.circle(x,774,4.8,BLUE)
    d.text(179,779,'Scan Enable (SE)',19,500,anchor='end',color=BLUE)
    for x,w,fill,stroke,title,sub in [(905,258,'url(#block)','#78b7ff','Domain A','(Always On)'),(1355,274,'url(#dft-green)','#76ddb2','Domain B','(Power Gated)')]:
        d.rect(x,211,w,504,fill,stroke,1.4,16,stroke_dasharray='7 7')
        color='#0354c9' if x==905 else '#129a8d'
        d.text(x+w/2,253,title,31,600,color=color);d.text(x+w/2,286,sub,27,500,color=color)
    for x,y in [(967,360),(967,513),(1456,360),(1456,517)]:
        d.rect(x,y,95,94,'none',WIRE,2.3);d.text(x+47.5,y+58,'FF',27,500)
    for path in ['M922 407H967','M1063 407H1217','M1301 407H1453','M1553 407H1612','M922 560H967','M1063 560H1125V636H1221','M1306 645H1397V564H1453','M1553 564H1612']:
        d.path(path,sw=2.3,end=path not in ('M922 407H967','M922 560H967'))
    d.path('M1220 368L1301 407L1220 445Z',sw=2.5,fill='#f5faff')
    d.text(1249,417,'LS',26,550)
    d.text(1260,332,'Level',24,550);d.text(1260,357,'Shifter',24,550)
    logic_gate(d,'and',1224,611,82,68,2.5,'#f5faff');d.text(1262,654,'ISO',24,500)
    d.text(1260,593,'Isolation',24,550)
    d.line(1260,738,1260,681,sw=2.2,end=True);d.text(1263,767,'ISO_EN',24,500)
    d.save('dft-overview.svg')


def dft_detail() -> None:
    d=Drawing(1991,734,'0 41 1991 734','Scan insertion, power intent, constraints and sanity check','Four measured source panels show the scan mux chain, power-domain level shifting and isolation, separate functional and scan clocks, and connectivity checks.')
    for i,(x,w,title) in enumerate([(24,476,'Scan insertion'),(512,477,'Power intent'),(1001,476,'Constraints'),(1490,478,'Sanity check')],1):
        d.rect(x,72,w,675,'#fff','#75b6ff',1.3,12)
        d.rect(x+1,73,w-2,76,'url(#header)','none',0,11)
        d.rect(x+24,83,70,57,'#0874ff','none',0,23)
        d.text(x+59,125,str(i),40,650,color='#fff')
        d.text([163,672,1159,1653][i-1],125,title,41,700,anchor='start')
    for mx,fx in [(107,154),(235,281),(371,414)]:
        scan_mux(d,mx,261,28,136)
        d.rect(fx,290,49,91,'#f7fbff',WIRE,1.8)
        d.text(fx+11,335,'D',20);d.text(fx+36,335,'Q',20)
        d.line(mx+29,330,fx-2,330,sw=2,end=True)
        d.line(mx+14,240,mx+14,270,sw=1.9)
        d.text(mx+35,229,'Scan MUX',21)
    d.text(53,299,'D',23);d.line(74,291,104,291,sw=2,end=True)
    d.text(53,378,'SI',23);d.line(74,369,104,369,stroke=BLUE,sw=2,marker_end='url(#arrow-blue)')
    for p in ('M204 330H217V368H233','M351 369H369','M464 330H493'):
        d.path(p,stroke=BLUE,sw=1.9,marker_end='url(#arrow-blue)')
    for x in (338,349,360):d.circle(x,330,3)
    d.text(482,374,'SO',23)
    d.path('M75 497H385V399 M120 497V399 M248 497V399',stroke=BLUE,sw=2.3)
    for x in (120,248,385):d.line(x,421,x,399,stroke=BLUE,sw=2.1,marker_end='url(#arrow-blue)')
    for x in (120,248):d.circle(x,497,4.8,BLUE)
    d.text(54,506,'SE',23)
    d.rect(45,606,434,118,'#fff','#bfdcff',1.3,12)
    for y,t,col in [(640,'Functional path (SE = 0)',WIRE),(684,'Scan path (SE = 1)',BLUE)]:
        d.line(73,y,146,y,stroke=col,sw=2.5,marker_end='url(#arrow)' if col==WIRE else 'url(#arrow-blue)');d.text(173,y+8,t,22,400,anchor='start')
    for x,w,name,voltage,fill,col in [(528,210,'PD_A','VDD_A','#f4faff','#4f9dff'),(771,199,'PD_B','VDD_B','#f1fcf5','#4ed6a0')]:
        d.rect(x,211,w,307,fill,col,1.4,10,stroke_dasharray='6 5')
        d.text(x+w/2,194,name,27,600,color=BLUE if x<600 else '#00a66e')
        d.text(x+w/2,240,voltage,23,500);d.circle(x+w/2,254,5)
        d.line(x+w/2,255,x+w/2,294,sw=2.2)
    d.path('M557 316C553 293 580 288 602 299C621 286 641 294 647 309C669 310 673 331 661 345C675 371 654 389 635 385C616 401 591 391 585 387C562 392 544 377 549 355C536 343 541 321 557 316Z',stroke=BLUE,sw=2.4,fill='#e7f4ff')
    d.path('M847 316C843 293 870 288 892 299C911 286 931 294 936 309C958 310 962 331 950 345C964 371 943 389 924 385C905 401 880 391 874 387C851 392 833 377 838 355C825 343 831 321 847 316Z',stroke='#00a77a',sw=2.4,fill='#e7f9ef')
    for x,col in [(606,INK),(894,'#00855e')]:d.text(x,339,'Logic',26,550,color=col);d.text(x,369,'A' if x<700 else 'B',25,600,color=col)
    for p in ('M667 344H712','M781 344H830','M613 391V453H704','M789 453H885V391'):d.path(p,sw=2.5,end=True)
    d.rect(715,314,65,60,'#fff',WIRE,2.2);d.text(747,353,'LS',27,500)
    d.rect(707,424,81,57,'#fff',WIRE,2.2);d.text(747,463,'ISO',27,500)
    d.line(747,538,747,484,sw=2.2,end=True);d.text(747,568,'ISO_EN',24)
    d.rect(533,606,435,118,'#fff','#bfdcff',1.3,12)
    for y,name,t in [(617,'LS','Level shifter'),(670,'ISO','Isolation (power-off)')]:
        d.rect(569,y,56,42,'#fff',WIRE,2.2);d.text(597,y+30,name,26);d.text(661,y+30,t,22,400,anchor='start')
    d.text(1029,201,'Functional clock',23,450,anchor='start')
    d.path('M1089 213V250H1130V213H1170V250H1211V213H1252V250H1292V213H1333V250H1360',sw=2.5)
    d.text(1365,238,'FUNC_CLK',21,500,anchor='start')
    d.text(1029,305,'Test clock',23,450,anchor='start')
    d.path('M1071 354H1094V318H1131V354H1170V318H1209V354H1247V318H1287V354H1321V318H1355V354H1381',stroke=BLUE,sw=2.5)
    d.text(1367,339,'SCAN_CLK',21,500,anchor='start',color=BLUE)
    d.path('M1206 387L1254 412V489L1206 513Z',fill='url(#block)',sw=2.4)
    d.text(1136,430,'0',24);d.text(1136,481,'1',24);d.text(1073,462,'Mode',24)
    d.line(1160,421,1203,421,sw=2.2,end=True);d.line(1160,472,1203,472,stroke=BLUE,sw=2.2,marker_end='url(#arrow-blue)')
    d.line(1256,454,1332,454,sw=2.3,end=True);d.text(1359,462,'CLK',23)
    d.line(1230,539,1230,503,stroke=BLUE,sw=2.2,marker_end='url(#arrow-blue)');d.text(1230,569,'TEST_MODE',23)
    d.rect(1022,608,434,117,'#fff','#bfdcff',1.3,12)
    for y,t,col in [(656,'Functional clock (test_mode = 0)',WIRE),(702,'Scan clock (test_mode = 1)',BLUE)]:
        d.path(f'M1043 {y}H1058V{y-19}H1079V{y}H1100V{y-19}H1120V{y}H1143',stroke=col,sw=2.3)
        d.text(1165,y-3,t,20,400,anchor='start')
    d.text(1741,194,'Scan chain connectivity',25,450)
    d.path('M1568 308V240H1691 M1782 240H1898V308',stroke=BLUE,sw=1.8,stroke_dasharray='5 7',marker_start='url(#arrow-blue)',marker_end='url(#arrow-blue)')
    d.rect(1692,207,88,64,'#f6fbff',BLUE,2.4,11)
    d.path('M1711 239Q1736 208 1762 239Q1736 269 1711 239Z',stroke=BLUE,sw=2.6)
    d.circle(1736,239,13,'none',stroke=BLUE,stroke_width=2.8);d.circle(1736,239,5,BLUE)
    for x in (1577,1696,1829):
        d.rect(x,315,60,62,'#f5faff',WIRE,2.2);d.text(x+30,355,'FF',23,500)
    for x1,x2 in [(1534,1574),(1639,1693),(1758,1767),(1813,1827),(1891,1919)]:d.line(x1,345,x2,345,stroke=BLUE,sw=2.2,marker_end='url(#arrow-blue)')
    for x in (1773,1788,1803):d.circle(x,345,4.5,BLUE)
    d.text(1516,354,'SI',23);d.text(1941,342,'SO',24)
    for x,w,name,col in [(1517,147,'PD_A','#3d96ff'),(1779,148,'PD_B','#55d49e')]:
        d.rect(x,448,w,163,'#f5fcfa',col,1.3,9,stroke_dasharray='5 5')
        d.text(x+w/2,479,name,25,600,color=BLUE if name=='PD_A' else '#00a56f')
    for x,y,w,h,label in [(1545,513,72,72,'FF'),(1677,519,80,59,'ISO'),(1812,513,71,72,'FF')]:
        d.rect(x,y,w,h,'#fff',WIRE,2.3);d.text(x+w/2,y+h/2+9,label,25,500)
    for x1,x2 in ((1618,1674),(1758,1809)):d.line(x1,549,x2,549,stroke=BLUE,sw=2.3,marker_end='url(#arrow-blue)')
    d.circle(1916,510,22,'#00aa77');d.path('M1905 510L1913 518L1928 502',stroke='#fff',sw=4)
    d.text(1723,653,'Domain crossing isolation check',24,450)
    d.save('dft-detail.svg')


def physical_die(d: Drawing,x: float,y: float,w: float,h: float,stage: str,key: str) -> None:
    """Source-specific die geometry shared by the four successive physical scenes."""
    d.parts.append(f'<g transform="translate({x} {y}) scale({w/425} {h/444})">')
    if key=='overview':
        d.path('M24 0H401Q413 0 413 13V14H415Q425 14 425 24V420Q425 430 415 430H413V431Q413 444 401 444H24Q12 444 12 431V430H10Q0 430 0 420V24Q0 14 10 14H12V13Q12 0 24 0Z',sw=2.6,fill='#fff')
    else:
        d.path('M18 0H407L425 18V426L407 444H18L0 426V18Z',sw=2.2,fill='#fff')
        d.path('M0 18H18V0 M407 0V18H425 M0 426H18V444 M407 444V426H425',sw=1.4)
    d.rect(24,26,376,391,'#fcfeff','#aebbd0',1.2,4)
    for px in (33,59,86,113,293,320,346,373):
        for py in (7,424):d.rect(px,py,16,15,'#e1eaf2',WIRE,1.4,1)
    for py in (44,75,105,322,352,382):
        for px in (4,407):d.rect(px,py,16,17,'#e1eaf2',WIRE,1.4,1)
    for tx,ty in [(211,20),(211,439),(12,228),(413,228)]:d.text(tx,ty,'IO',20,600)
    cross='M37 142H194V38H249V142H387V308H249V405H185V308H37Z'
    if stage=='floorplan':
        d.path(cross,stroke='#7a8ead',sw=1.2,fill='#fafcfe',stroke_dasharray='5 4')
        for sx in (90,315):d.rect(sx,137,16,176,'#c9e8ff','none',0)
        d.rect(30,283,365,18,'#c9e8ff','none',0)
        d.rect(193,31,57,22,'#c9e8ff','none',0,opacity='.6')
        d.rect(185,397,67,18,'#c9e8ff','none',0,opacity='.6')
        d.text(212,228,'Std. Cell Area',21,450,color='#445c80')
    else:
        for cy in range(139,309,10):
            for cx in range(37,387,23):d.rect(cx,cy,20,7,'#bcdcf6','#7ab7e7',.75)
        for cy in list(range(40,139,10))+list(range(309,409,10)):
            for cx in (193,216,239):d.rect(cx,cy,20,7,'#bcdcf6','#7ab7e7',.75)
    if stage=='routing':
        d.parts.append(f'<defs><clipPath id="routes-{key}"><path d="M30 132H190V32H252V132H392V313H255V413H180V313H30Z"/></clipPath></defs>')
        d.parts.append(f'<g clip-path="url(#routes-{key})">')
        for j in range(14):
            cx=184+j*5;yy=153+(j%7)*15;turn=40+(j*23)%330
            d.path(f'M{cx} 28V{yy}H{turn}V{yy+34}H{388-j*2}',stroke='#1bb98b',sw=1.5,opacity='.87')
            d.path(f'M{cx} 414V{306-j*8}H{50+j*23}V{143+(j%4)*10}',stroke='#22b684',sw=1.4,opacity='.8')
        for j in range(7):
            yy=149+j*21
            d.path(f'M31 {yy}H{203+j*6}V{36+j*3} M{391-j*5} 135V{290-j*12}H{198+j*6}V413',stroke='#3ba8ca',sw=1.1,opacity='.8')
        for j,cx in enumerate((46,56,67,81,104,326,339,352,366,378)):
            d.path(f'M{cx} 134V{184+j*9}H{193+j*5}V410 M{cx+3} 310V{160+j*7}H{197+j*4}V31',stroke='#1ab985',sw=1.5,opacity='.88')
        for p in ('M43 128V272H211V396H275','M51 130V180H209V30','M218 31V191H380V301','M38 222H389','M32 280H384','M51 194H196V407','M240 34V396H276'):
            d.path(p,stroke='#ff941d',sw=3)
        d.path('M218 28V414 M238 31V414 M31 208H392 M31 224H392 M110 128V220H336V128',stroke='#137cf1',sw=6)
        d.path('M218 31V413 M34 208H389',stroke='#fff',sw=1,stroke_dasharray='8 8')
        for cx,cy in ((110,220),(218,220),(238,208),(336,220)):d.circle(cx,cy,6,BLUE)
        d.end()
    for mx,my,mw,mh,name,sub,fill,stroke in [(37,38,151,92,'CPU','(Logic Core)','spec-blue','#51a7ff'),(257,38,130,92,'SRAM',None,'spec-green','#7dcc9b'),(37,318,141,87,'DSP',None,'spec-purple','#9887ed'),(257,318,130,87,'PLL',None,'spec-blue','#51a7ff')]:
        d.rect(mx,my,mw,mh,f'url(#{fill})',stroke,1.3)
        d.text(mx+mw/2,my+(43 if sub else 55),name,23,600)
        if sub:d.text(mx+mw/2,my+68,sub,19,450)
    if stage=='cts':
        d.path('M218 90V350 M93 154V193H341V146 M93 291V251H337V296',stroke='#1288ff',sw=6)
        for cx,cy in ((218,90),(218,193),(218,350),(93,154),(341,146),(93,291),(337,296)):d.circle(cx,cy,7,BLUE)
    d.end()


def database_icon(d: Drawing,x: float,y: float,s: float=1,color: str=BLUE) -> None:
    d.parts.append(f'<g transform="translate({x} {y}) scale({s})">')
    d.path('M4 13V53C4 69 47 69 47 53V13 M4 27C4 43 47 43 47 27 M4 40C4 56 47 56 47 40',stroke=color,sw=4)
    d.element('ellipse',cx=25.5,cy=13,rx=21.5,ry=10.5,fill='#fff',stroke=color,stroke_width=4)
    d.end()


def physical_overview() -> None:
    d=Drawing(1666,930,'0 3 1666 930','Physical design from netlist to routed layout','Source-matched physical design overview with input files, a routed die, extracted RC, output reports and a timing/ECO feedback loop.')
    spec_palette(d)
    d.text(833,75,'Physical Design',59,800)
    d.text(833,127,'Transform a netlist into a manufacturable physical layout',31,450,color='#485f87')
    d.rect(31,169,369,574,'#f4f9ff','#b5d8ff',1.6,13)
    d.text(55,212,'INPUT',30,750,anchor='start',color=BLUE)
    for y,h,icon,title,lines in [(236,110,'document','Netlist',['Logic description','(Verilog / VHDL)']),(357,112,'document','Constraints',['Timing, power, area','(SDC, MMMC, etc.)']),(482,112,'document','UPF',['Power intent','(isolation, retention, etc.)']),(606,116,'database','Design kit / Target',['Process library, tech files,','DRC/LVS rules, PPA targets'])]:
        d.rect(46,y,312,h,'#fff','#d1e5fc',1.5,11)
        if icon=='database':database_icon(d,63,y+16,1.02)
        else:reference_icon(d,icon,54,y+16,1.02)
        d.text(136,y+37,title,24,650,anchor='start')
        for j,t in enumerate(lines):d.text(136,y+64+j*26,t,17.5 if y==606 else 20,400,anchor='start',color='#4a638b')
    for yy in (289,407,537,664):
        if yy<453:p=f'M359 {yy}H368Q381 {yy} 381 {yy+13}V440Q381 453 395 453H420'
        else:p=f'M359 {yy}H368Q381 {yy} 381 {yy-13}V466Q381 453 395 453H420'
        d.path(p,stroke=BLUE,sw=3.5)
    d.path('M410 442L421 453L410 464',stroke=BLUE,sw=4)
    d.rect(429,385,110,152,'#fff','#cce1fa',1.6,11)
    reference_icon(d,'document',449,401,1.05)
    d.text(484,498,'Gate-level',22,550);d.text(484,521,'netlist',22,550)
    d.rect(683,170,317,51,'#c9e5ff','none',0,12);d.text(841,205,'Physical Design',31,700,color=BLUE)
    physical_die(d,606,233,455,414,'routing','overview')
    for xx in (545,1073):d.path(f'M{xx} 438H{xx+28}V426L{xx+49} 452L{xx+28} 477V465H{xx}Z',fill='url(#progress)',stroke='none')
    d.rect(1128,384,115,142,'#fff','#cce1fa',1.6,11)
    database_icon(d,1160,397,1.02)
    d.text(1185,485,'Extracted',22,550);d.text(1185,511,'RC',22,550)
    d.rect(1302,172,336,478,'#f5fcf8','#a1e7cd',1.6,13)
    d.text(1327,216,'OUTPUT',30,750,anchor='start',color='#00b184')
    for y,h,title,lines,iconcol in [(244,118,'Placed / Routed DB',['Physical layout database','(DEF / DB)'],'#00b184'),(379,118,'Extracted RC',['Parasitic data','(SPEF)'],'#00b184'),(513,118,'Reports',['Timing, power, IR drop,','congestion, etc.'],BLUE)]:
        d.rect(1324,y,298,h,'#fff','#bcebdd',1.5,11)
        reference_icon(d,'document',1335,y+22,1.05,iconcol)
        d.text(1417,y+38,title,22,650,anchor='start')
        for j,t in enumerate(lines):d.text(1417,y+67+j*27,t,18.5,400,anchor='start',color='#4a638b')
    for yy in (327,452,563):
        d.path(f'M1244 452H1263Q1276 452 1276 {440 if yy<452 else 465}V{yy}H1314',stroke='#00bf88',sw=4)
        d.path(f'M1304 {yy-10}L1315 {yy}L1304 {yy+10}',stroke='#00bf88',sw=4)
    d.rect(590,692,490,89,'#fff','#c6dcf7',1.7,10)
    d.circle(618,718,6,BLUE);d.line(619,718,674,718,stroke=BLUE,sw=4)
    d.text(691,726,'Clock (CLK)',20,450,anchor='start')
    d.line(816,718,874,718,stroke='#ff941d',sw=4);d.text(893,726,'Power (PWR)',20,450,anchor='start')
    d.line(615,752,674,752,stroke='#17b98b',sw=4);d.text(691,760,'Signal',20,450,anchor='start')
    d.rect(815,742,49,21,'#d0e1ed','#7a9ebf',1.7,1);d.text(893,760,'Standard Cell (routed)',18,400,anchor='start')
    d.path('M1185 527V845Q1185 862 1167 862H1023',stroke=BLUE,sw=5)
    d.text(1203,769,'Timing, IR, congestion',23,450,anchor='start',color=BLUE)
    d.text(1203,798,'→ ECO',23,450,anchor='start',color=BLUE)
    d.rect(646,828,377,76,'url(#spec-blue)',BLUE,1.8,12)
    d.text(834,862,'Timing / ECO',28,700,color='#064ca6');d.text(834,887,'Analyze timing, fix violations, iterate',20,400,color='#3f5c8c')
    for yy in (790,657):d.path(f'M834 {yy+36}V{yy}M824 {yy+10}L834 {yy}L844 {yy+10}',stroke='#2d8efa',sw=4)
    d.save('physical-overview.svg')


def physical_detail() -> None:
    d=Drawing(1983,693,'0 61 1983 693','Floorplan, placement, clock tree and routing','The same CPU/SRAM/DSP/PLL floorplan progresses through placement, clock-tree synthesis and dense signal/power routing. The die outline, IO pads and macro positions follow the original four-scene illustration.')
    spec_palette(d)
    for i,(x,w,title,stage,tx) in enumerate([(25,425,'Floorplan','floorplan',130),(526,430,'Placement','placement',623),(1027,430,'CTS','cts',1130),(1531,429,'Routing','routing',1635)],1):
        d.text(x+4,132,f'{i:02d}',59,700,anchor='start',color=BLUE)
        d.text(tx,130,title,52,700,anchor='start')
        physical_die(d,x,168,w,444,stage,f'detail-{i}')
    for xx in (465,969,1472):d.path(f'M{xx} 379H{xx+25}V365L{xx+47} 390L{xx+25} 414V401H{xx}Z',fill='url(#progress)',stroke='none')
    d.rect(123,644,61,31,'#fff','#7a8ead',1.3,0,stroke_dasharray='5 4')
    d.text(207,666,'Standard-cell area',22,400,anchor='start',color='#465f86')
    d.rect(123,695,61,31,'#c9e8ff','none',0)
    d.text(207,718,'Power plan (rings / stripes)',22,400,anchor='start',color='#465f86')
    d.save('physical-detail.svg')


def signoff_gradients(d: Drawing) -> None:
    d.parts.append('<defs><radialGradient id="ir-map" cx="65%" cy="55%" r="70%"><stop stop-color="#ee1400"/><stop offset=".16" stop-color="#ff6300"/><stop offset=".32" stop-color="#fff400"/><stop offset=".50" stop-color="#96ed25"/><stop offset=".69" stop-color="#04dce1"/><stop offset=".85" stop-color="#0095ff"/><stop offset="1" stop-color="#004de5"/></radialGradient><linearGradient id="heat-scale" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f80000"/><stop offset=".22" stop-color="#ffad00"/><stop offset=".44" stop-color="#edff00"/><stop offset=".62" stop-color="#49e877"/><stop offset=".79" stop-color="#08c4ff"/><stop offset="1" stop-color="#0034ff"/></linearGradient><linearGradient id="em-flow" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#8ce77b"/><stop offset=".25" stop-color="#ffff53"/><stop offset=".6" stop-color="#ff5e0b"/><stop offset=".8" stop-color="#ffc014"/><stop offset="1" stop-color="#ebef4b"/></linearGradient><pattern id="spacing-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="7" height="7" fill="#ffe3bb"/><line y2="7" stroke="#ff9d4b" stroke-width="2"/></pattern><marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="19" markerHeight="19" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#f51924"/></marker></defs>')


def framed_heatmap(d: Drawing,x: float,y: float,w: float,h: float,key: str) -> None:
    d.parts.append(f'<g transform="translate({x} {y}) scale({w/180} {h/260})">')
    d.path('M10 0H170V10H180V250H170V260H10V250H0V10H10Z',sw=1.4,fill='#fff')
    d.rect(15,17,150,226,'url(#ir-map)',WIRE,1)
    for cx in (13,29,45,62,86,113,131,148,162):
        for cy in (3,248):d.rect(cx,cy,8,9,'#fff',WIRE,.9,1)
    for cy in range(27,234,22):
        for cx in (3,169):d.rect(cx,cy,7,10,'#fff',WIRE,.9,1)
    for cx in range(16,166,12):d.line(cx,18,cx,242,stroke='#085ac5',sw=.7,opacity='.55')
    for cy in range(20,243,12):d.line(15,cy,164,cy,stroke='#085ac5',sw=.7,opacity='.45')
    for j in range(13):
        xx=24+j*9;yy=25+(j*37)%170
        d.path(f'M{xx} 25V{yy}H{min(160,xx+18)}V{min(237,yy+23)}H{xx-8}V239',stroke='#174ec4',sw=.8,opacity='.32')
    d.end()


def em_map(d: Drawing,x: float,y: float,w: float,h: float,key: str) -> None:
    d.parts.append(f'<g transform="translate({x} {y}) scale({w/100} {h/160})"><defs><clipPath id="em-{key}"><rect width="100" height="160"/></clipPath></defs><g clip-path="url(#em-{key})">')
    d.rect(0,0,100,160,'#006bff','none',0)
    for p,sw in [('M0 68H62V-5',12),('M10 165V100H81V-5',10),('M-5 99H105',9)]:d.path(p,stroke='url(#em-flow)',sw=sw)
    for j in range(8):
        d.path(f'M-2 {51+j*3}H{45+j*3}V-3 M{2+j*3} 163V{110-j*2}H103',stroke='#8ee9ff' if j%3 else '#eef882',sw=.65,opacity='.8')
    for p in ('M0 51H43 M38 48L43 51L38 54','M0 68H66V43 M62 47L66 43L69 47','M0 84H43 M39 81L43 84L39 87','M99 101H33 M37 98L33 101L37 104','M80 3V30 M77 25L80 30L83 25','M11 155V111 M8 116L11 111L14 116'):
        d.path(p,stroke='#fff',sw=1.2)
    d.end();d.end()


def signoff_layout(d: Drawing,x: float,y: float,w: float,h: float) -> None:
    d.parts.append(f'<g transform="translate({x} {y}) scale({w/360} {h/330})">')
    d.path('M25 0H335Q343 0 343 8V17H352Q360 17 360 25V305Q360 313 352 313H343V322Q343 330 335 330H25Q17 330 17 322V313H8Q0 313 0 305V25Q0 17 8 17H17V8Q17 0 25 0Z',sw=3,fill='#fff')
    d.rect(28,24,305,281,'#fafcff',WIRE,2)
    d.rect(36,37,289,260,'#58c5df',WIRE,1.3)
    for row in range(58):
        cx=38.0;cell=0
        while cx<323:
            cw=[3.1,5.2,8.5,4.2,10.2][(row*17+cell*7)%5]
            cw=min(cw,324-cx)
            palette=['#0876d4','#168edf','#77bce2','#32a5d5','#769aca'] if cx<170 else ['#31b7d4','#77dcb5','#c2e36b','#6abda4','#2ca6d6'] if row<30 else ['#0f82d1','#449ebd','#8ccfbe','#77b0d6','#70dcd1']
            ci=int(abs(math.sin(row*13.17+cell*6.73))*20)%5
            d.rect(cx,39+row*4.4,cw-.45,3.65,palette[ci],'#1768af',.3)
            cx+=cw;cell+=1
    for j in range(21):
        cx=43+j*13.2;cy=47+(j*37)%240
        d.path(f'M{cx} 39V{cy}H{40+(j*19)%270}V292',stroke='#0968e5',sw=1.5)
        d.path(f'M38 {43+j*12}H{55+(j*17)%250}V{45+(j*23)%230}H324',stroke='#0781d4',sw=1.1)
    for p in ('M47 42V146H310V289','M37 183H315','M41 196H314V61H176V286H322','M61 40V164H300','M178 37V286H320'):
        d.path(p,stroke='#ffb532',sw=4)
    for p in ('M92 37V298 M112 37V293 M184 37V293 M208 37V298 M37 161H325 M37 171H325 M37 189H325'):
        d.path(p,stroke='#0268df',sw=5)
    for px in range(44,322,30):
        for py in (6,310):d.rect(px,py,12,13,'#edf5ff',WIRE,1.5)
    for py in (44,73,107,155,178,222,254,277):
        for px in (8,340):d.rect(px,py,13,13,'#edf5ff',WIRE,1.5)
    d.end()


def signoff_overview() -> None:
    d=Drawing(1665,938,'0 5 1665 938','Signoff timing, physical and power integrity checks','A routed layout branches to STA, DRC/LVS and IR/EM checks. The reviewed results feed the release document for final approval.')
    signoff_gradients(d)
    d.rect(31,18,233,69,'url(#badge)','none',0,14);d.text(58,72,'Signoff',53,750,anchor='start')
    d.text(58,120,'Timing, physical, and power integrity checks for final approval',28,400,anchor='start')
    signoff_layout(d,50,307,359,330)
    d.text(230,678,'Routed Layout',30,700);d.text(230,711,'(Complete Design)',27,400,color='#4a638b')
    for yy in (252,502,765):
        if yy<465:p=f'M416 465H451Q470 465 470 447V271Q470 252 489 252H568'
        elif yy==502:p='M416 465H451Q470 465 470 484V502H568'
        else:p='M416 465H451Q470 465 470 484V746Q470 765 489 765H568'
        d.path(p,stroke=BLUE,sw=5.5);d.path(f'M556 {yy-12}L568 {yy}L556 {yy+12}',stroke=BLUE,sw=5.5)
    for y,h,title,sub,tx in [(152,220,'STA','Timing Analysis',723),(392,236,'DRC / LVS','Physical Verification',811),(648,266,'IR / EM','Power Integrity',762)]:
        d.rect(576,y,637,h,'#fff','#94c9ff',2.8,19)
        d.rect(577,y+1,635,50,'url(#block)','none',0,18)
        d.text(608,y+40,title,40,750,anchor='start',color='#0661de');d.text(tx,y+35,sub,25,400,anchor='start',color='#4b648d')
    d.text(620,258,'CLK',25,650,anchor='start');d.text(620,305,'Data',25,650,anchor='start')
    d.path('M709 258H750V226H807V258H870V226H927V258H989V226H1047V258H1110V226H1159',sw=2.5)
    d.rect(766,270,331,52,'#e1f2ff','none',0,10)
    d.line(709,296,1159,296,sw=2.5)
    for x in (793,1035):d.path(f'M{x} 272L{x+40} 296L{x} 320Z',stroke='#0765e5',sw=2.7,fill='#cbe5ff')
    d.text(894,351,'Verify timing meets constraints',23,400,color='#4a638b')
    d.text(726,478,'DRC (Design Rules)',22,500);d.text(1035,478,'LVS (Connectivity)',22,500)
    d.rect(619,496,69,49,'url(#block)','#1787f8',2);d.rect(766,496,69,49,'url(#block)','#1787f8',2)
    d.line(697,522,757,522,stroke='#ff332e',sw=2.5)
    d.path('M705 514L697 522L705 530 M749 514L757 522L749 530',stroke='#ff332e',sw=2.5)
    d.text(728,574,'Min. Spacing',21,400,color='#4a638b')
    d.line(893,467,893,569,stroke='#c1dfff',sw=2)
    for x in (949,1103):
        logic_gate(d,'and',x,496,48,51,2.4,'#fff');d.circle(x+52,521.5,3,'#fff',stroke=WIRE,stroke_width=1.8)
        for yy in (514,530):d.line(x-19,yy,x-1,yy,sw=2)
        d.line(x+55,521.5,x+70,521.5,sw=2)
    d.path('M1031 522H1069 M1038 515L1031 522L1038 529 M1062 515L1069 522L1062 529',stroke='#3e255d',sw=2.5)
    d.text(1065,576,'Layout vs. Schematic',21,400,color='#4a638b')
    d.text(894,611,'Verify physical rules and connectivity',23,400,color='#4a638b')
    d.text(619,728,'IR-Drop (Voltage Integrity)',21,500,anchor='start')
    d.text(960,728,'EM (Current Density)',21,500,anchor='start')
    framed_heatmap(d,619,743,232,115,'overview');em_map(d,936,742,231,117,'overview')
    d.line(893,724,893,841,stroke='#c1dfff',sw=2)
    d.text(894,895,'Verify power integrity and current reliability',23,400,color='#4a638b')
    for yy in (252,500,765):
        if yy<500:p='M1215 252H1277Q1296 252 1296 271V480Q1296 500 1316 500H1409'
        elif yy==500:p='M1215 500H1409'
        else:p='M1215 765H1277Q1296 765 1296 746V519Q1296 500 1316 500H1409'
        d.path(p,stroke=BLUE,sw=5.5)
    d.path('M1396 488L1409 500L1396 512',stroke=BLUE,sw=5.5)
    d.path('M1446 382H1553L1599 427V575Q1599 586 1588 586H1446Q1432 586 1432 575V395Q1432 382 1446 382Z M1553 382V416Q1553 427 1564 427H1599 M1468 460H1520 M1468 486H1570 M1468 512H1570 M1468 537H1552',stroke='#0863df',sw=7,fill='#ecf6ff')
    d.text(1517,637,'Release Document',31,700)
    d.text(1517,677,'Signoff Report',27,400,color='#4a638b');d.text(1517,708,'(Final Approval)',27,400,color='#4a638b')
    d.save('signoff-overview.svg')


def signoff_detail() -> None:
    d=Drawing(2017,661,'0 91 2017 661','STA, DRC/LVS, IR/EM and release approval','Four source-matched signoff scenes cover timing windows, spacing and connectivity, power integrity maps, and an approved release checklist. A failed check returns to ECO.')
    signoff_gradients(d)
    for i,(x,w,title,tx) in enumerate([(31,424,'STA',153),(508,464,'DRC / LVS',624),(1020,519,'IR / EM',1132),(1579,410,'Release',1695)],1):
        d.rect(x,120,w,485,'#fff','#89c0ff',1.5,14)
        d.rect(x+1,121,w-2,85,'url(#header)','none',0,13)
        d.circle(x+56,165,32,'#087aff');d.text(x+56,179,str(i),40,650,color='#fff')
        d.text(tx,179,title,44,750,anchor='start')
    d.rect(91,440,323,95,'url(#header)','none',0,16)
    d.text(49,321,'CLK',27,500,anchor='start');d.text(49,403,'D',27,500,anchor='start')
    d.circle(245,322,26,'#dff0ff')
    d.path('M109 320H141V275H191V320H245V275H298V320H350V275H400V320H434',stroke='#0b4c9d',sw=2.7)
    d.path('M89 399H160L169 370H348L362 399H439',stroke=BLUE,sw=2.8)
    d.path('M166 370H350L339 413H171Z',stroke=BLUE,sw=2.8,fill='#c9e5ff')
    for x,y1,y2 in [(160,413,479),(245,247,494),(350,414,480)]:d.line(x,y1,x,y2,stroke='#549cf9',sw=1.4,stroke_dasharray='6 6')
    d.line(162,466,243,466,stroke=BLUE,sw=2.2,marker_start='url(#arrow-blue)',marker_end='url(#arrow-blue)')
    d.line(279,466,350,466,stroke=BLUE,sw=2.2,marker_end='url(#arrow-blue)');d.circle(356,466,3.4,BLUE)
    d.text(177,509,'Setup',29,650,color=BLUE);d.text(338,509,'Hold',29,650,color=BLUE)
    for x,w in [(526,220),(758,198)]:d.rect(x,219,w,367,'#fff','#c4def8',1.3,12)
    d.text(544,257,'DRC',32,700,anchor='start');d.text(778,257,'LVS',32,700,anchor='start')
    d.text(642,299,'Min. Spacing',25,600,color=BLUE)
    d.path('M534 450H648V494H736V519H630V476H534Z',stroke='#24b878',sw=2.2,fill='#d5f3d7')
    d.rect(554,351,40,220,'url(#block)','#1547ff',2.8)
    d.rect(686,351,25,220,'url(#block)','#1547ff',2.8)
    d.rect(596,375,73,38,'url(#spacing-hatch)','#ff8b4c',1.2)
    for x in (611,669):d.line(x,310,x,409,stroke='#43a2ff',sw=1.3,stroke_dasharray='6 6')
    d.line(613,327,668,327,stroke=BLUE,sw=2.2,marker_start='url(#arrow-blue)',marker_end='url(#arrow-blue)')
    for y,label in [(302,'Layout'),(476,'Netlist')]:
        logic_gate(d,'not',794,y+2,45,47,2.6,'#fff');logic_gate(d,'and',884,y,43,54,2.6,'#fff')
        d.line(776,y+27,793,y+27,sw=2.4);d.line(840,y+27,883,y+27,sw=2.4);d.line(928,y+27,944,y+27,sw=2.4)
        d.text(858,y+85,label,24,400)
    d.line(858,409,858,447,stroke=BLUE,sw=4,marker_start='url(#arrow-blue)',marker_end='url(#arrow-blue)')
    for x,w in [(1038,248),(1298,224)]:d.rect(x,219,w,367,'#fff','#c4def8',1.3,12)
    d.text(1054,257,'IR-Drop',32,700,anchor='start');d.text(1316,257,'EM',32,700,anchor='start')
    framed_heatmap(d,1040,283,173,254,'detail');em_map(d,1311,284,135,257,'detail')
    for x,w in [(1232,22),(1462,16)]:
        d.rect(x,326,w,179,'url(#heat-scale)','none',0)
        d.text(x+w/2+8,312,'High',22);d.text(x+w/2+8,534,'Low',22)
    d.rect(1580,207,408,397,'#f0fdf9','none',0,13)
    for y,h,t in [(219,95,'Approved layout'),(332,95,'Signoff report'),(448,108,'Tapeout checklist')]:
        d.rect(1598,y,372,h,'#fff','#a8e6dc',1.3,13)
        reference_icon(d,'document',1605,y+15,1.05)
        d.text(1703,y+56,t,24 if t=='Tapeout checklist' else 25.5,600,anchor='start')
        d.circle(1929,y+47,22,'#27bb77');d.path(f'M1918 {y+47}L1926 {y+55}L1940 {y+40}',stroke='#fff',sw=4.5)
    d.path('M1788 606V668Q1788 689 1767 689H349',stroke='#f51924',sw=3.5,stroke_dasharray='13 8',marker_end='url(#arrow-red)')
    d.text(1064,674,'Fail',29,650,color='#f51924')
    d.rect(138,651,202,72,'#fff5f5','#ff7886',1.4,14)
    d.parts.append('<g transform="translate(176 667) scale(.4)">')
    d.path('M41 1H57L60 13L70 17L80 10L92 22L85 33L90 42L101 45V59L88 62L84 72L91 83L80 94L68 87L58 91L55 103H40L37 91L27 87L16 93L5 81L12 70L8 60L-4 57V43L9 40L13 29L6 18L18 7L29 15L38 11Z',stroke='none',fill='#ef2e36');d.circle(49,50,21,'#fff5f5');d.end()
    d.text(274,699,'ECO',34,750,color='#ec1420')
    d.line(239,649,239,601,stroke='#f51924',sw=3.5,stroke_dasharray='12 7',marker_end='url(#arrow-red)')
    for x in (462,977,1535):d.path(f'M{x} 365H{x+20}V346L{x+38} 371L{x+20} 395V377H{x}Z',fill='#0787ff',stroke='none')
    d.save('signoff-detail.svg')


def tapeout_layers(d: Drawing,x: float,y: float,w: float,h: float,labels: str) -> None:
    colors=['#ff8d2c','#08b678','#2085ff','#8051ed','#d44beb','#ff4b58','#369aff','#98a8ba','#9faabc']
    names=['M7','M6','M5','M4','M3','M2','M1','CONT','SUB']
    d.parts.append(f'<g transform="translate({x} {y}) scale({w/338} {h/383})">')
    for i in reversed(range(9)):
        yy=i*41;col=colors[i]
        d.path(f'M0 {yy+55}L60 {yy}H338L278 {yy+55}Z',stroke=col,sw=2.7,fill=col,fill_opacity='.18')
        d.parts.append(f'<g transform="matrix(1 0 -1.09 1 60 {yy})">')
        for row,cy in enumerate((12,29,44)):
            for j in range(8):
                cx=25+j*28
                if (i+j+row)%5!=1:d.rect(cx,cy-1,14+(j%3)*4,10,col,col,1.8,fill_opacity='.18',opacity='.9')
        for p in ('M26 16H95V31H141V20H204','M43 43H111V13H168V40H228','M79 21V42H162V28H236'):
            d.path(p,stroke=col,sw=2.3,opacity='.8')
        if i>=7:
            for cx in range(43,240,28):
                d.path(f'M{cx} 19V37',stroke='#8194a9',sw=4)
                for cy in (19,37):d.element('ellipse',cx=cx,cy=cy,rx=5,ry=2.6,fill='#a2b1c1',stroke='#8194a9',stroke_width=1)
        d.end()
    d.end()
    for i,(name,col) in enumerate(zip(names,colors)):
        yy=y+(i*41+45)*h/383
        if labels=='swatch':
            d.rect(x-81,yy-16,17,18,col,'none',0,3);d.text(x-54,yy,name,22,500,anchor='start',color=col)
        else:
            d.text(x-75,yy-6,name,21,600,anchor='start',color=INK if i<7 else '#6f879d')
            d.line(x-36,yy-12,x-7,yy-12,stroke='#7893ac',sw=1.3);d.circle(x-7,yy-12,2.3,col)


def gds_document(d: Drawing,x: float,y: float,w: float,h: float) -> None:
    d.parts.append(f'<g transform="translate({x} {y}) scale({w/170} {h/228})">')
    d.path('M15 0H121L170 49V190H0V15Q0 0 15 0Z',stroke='#0c69fa',sw=3.6,fill='#f4faff')
    d.path('M121 0V36Q121 49 134 49H170Z',stroke='#0c69fa',sw=3.2,fill='#93caff')
    reference_icon(d,'chip',40,62,1.4)
    d.rect(72,94,25,25,'#4b9df5','none',0)
    d.rect(-20,172,210,55,'#0875ff','none',0,13);d.text(85,211,'GDSII / OASIS',28,650,color='#fff')
    d.end()


def release_folders(d: Drawing,x: float,y: float,w: float,h: float) -> None:
    d.parts.append(f'<g transform="translate({x} {y}) scale({w/270} {h/188})">')
    d.path('M15 0H81Q86 0 95 13H209Q225 13 225 29V155Q225 173 208 173H15Q0 173 0 155V17Q0 0 15 0Z',stroke='#0873ff',sw=4,fill='url(#block)')
    d.path('M30 26H100L113 13H210Q224 13 224 27H225Q240 27 240 44V164Q240 182 223 182H30Q13 182 13 164V43Q13 26 30 26Z',stroke='#0873ff',sw=3.8,fill='#b9deff')
    d.path('M49 56H129Q135 56 141 42H252Q270 42 270 60V172Q270 188 253 188H49Q33 188 33 172V73Q33 56 49 56Z',stroke='#0873ff',sw=3.8,fill='url(#header)')
    d.text(152,133,'Tapeout_v1.0',30,650,color='#0568f6');d.end()


def photomask_tile(d: Drawing,x: float,y: float,w: float,h: float,variant: int=0) -> None:
    d.parts.append(f'<g transform="translate({x} {y}) scale({w/64} {h/64})">')
    d.rect(0,0,64,64,'#edf4fa','#294d73',1.6)
    d.rect(4,4,56,56,'none','#567fa5',1.1)
    for p in ('M8 8H54V56H10V13H49V51H15V18H44V46H20V24H39V40H26V29H34V35','M7 27H12V48H27V55H45V48H53V31H48V18H36V9','M23 5V15H30V20 M5 37H16V29H22 M58 24H52V9H43','M7 55H14V58 M46 57V53H57V44'):
        d.path(p,stroke='#436c94',sw=1.3)
    d.rect(26,27,11,11,'#c5d8e9','#31587c',1.3)
    for cx,cy in ((12,14),(48,49),(22,45),(45,23)):d.rect(cx,cy,3,3,'#436c94','none',0)
    d.end()


def foundry_building(d: Drawing,x: float,y: float) -> None:
    d.parts.append(f'<g transform="translate({x} {y})">')
    d.path('M-10 224H391L346 246L12 239Z',stroke='none',fill='#e3ecf7')
    d.path('M0 91L29 81L78 96V208H0Z',sw=2.4,fill='#d9e7f4')
    d.path('M29 81V208 M33 113L78 102V113L33 124Z',sw=2.3,fill='#8db4d7')
    d.path('M294 65L345 87V208H294Z',sw=2.4,fill='#b8cce1')
    d.path('M60 56L238 1L295 30V208H60Z',sw=2.6,fill='#dce8f4')
    d.path('M238 1L295 30V208H238Z',sw=2.6,fill='#afc6de')
    d.path('M73 142L115 132V208H73Z M130 125L222 108V208H130Z',sw=2.3,fill='#89aace')
    for yy in range(144,205,6):d.line(77,yy,111,yy-7,stroke='#567da6',sw=1)
    for yy in range(129,205,6):d.line(135,yy,218,yy-15,stroke='#567da6',sw=1)
    d.text(149,86,'Foundry',36,700,transform='rotate(-11 149 86)')
    d.line(-4,208,346,208,sw=2.2);d.end()


def tilted_photomask(d: Drawing) -> None:
    d.path('M1678 510L1994 492L2009 494L1977 526L1692 529L1628 519Z',stroke='none',fill='#dce7f4')
    d.path('M1736 334L1983 315L1991 321L1962 542L1680 519L1675 513Z',fill='#9bb8d4',sw=2.5)
    d.path('M1736 334L1983 315L1954 536L1675 513Z',fill='#dfebf5',sw=2.6)
    # Tile corners follow the same perspective as the reference mask plane.
    def xy(u: float,v: float) -> tuple[float,float]:
        top=(1745+u*(1967-1745),350+u*(334-350));bottom=(1704+u*(1940-1704),493+u*(512-493))
        return top[0]*(1-v)+bottom[0]*v,top[1]*(1-v)+bottom[1]*v
    def projected(points: list[tuple[float,float]],close: bool=False,fill: str='none',sw: float=1.5) -> None:
        values=[xy(u,v) for u,v in points]
        path='M'+'L'.join(f'{a:.2f} {b:.2f}' for a,b in values)+('Z' if close else '')
        d.path(path,stroke='#315879',sw=sw,fill=fill)
    for row in range(3):
        for col in range(4):
            u=col*.25;v=row/3;uw=.222;vh=.294
            def pts(coords):return [(u+a*uw,v+b*vh) for a,b in coords]
            projected(pts([(0,0),(1,0),(1,1),(0,1)]),True,'#e8f1f8',2)
            projected(pts([(.12,.14),(.38,.14),(.38,.3),(.2,.3),(.2,.58),(.4,.58),(.4,.76),(.16,.76),(.16,.6)]),sw=1.7)
            projected(pts([(.64,.4),(.8,.4),(.8,.2),(.52,.2),(.52,.14),(.9,.14),(.9,.5),(.72,.5)]),sw=1.7)
            projected(pts([(.4,.63),(.26,.63),(.26,.84),(.57,.84),(.57,.92),(.12,.92),(.12,.5),(.33,.5)]),sw=1.7)
            projected(pts([(.6,.65),(.83,.65),(.83,.83),(.64,.83),(.64,.89),(.93,.89),(.93,.65),(.74,.65)]),sw=1.7)
            projected(pts([(.37,.40),(.60,.40),(.60,.63),(.37,.63)]),True,'#bed2e5',1.3)
    d.parts.append('<defs><clipPath id="mask-glint"><path d="M1736 334L1983 315L1954 536L1675 513Z"/></clipPath></defs><g clip-path="url(#mask-glint)">')
    for p in ('M1660 520L1845 320H1858L1678 520Z','M1740 531L1921 317H1947L1768 534Z','M1794 539L1974 315H1984L1807 539Z'):d.path(p,stroke='none',fill='#fff',opacity='.24')
    d.end()
    for cx,cy in ((1748,345),(1967,330),(1694,498),(1940,518)):
        d.element('ellipse',cx=cx,cy=cy,rx=5.5,ry=5,fill='#88a9c9',stroke='#315879',stroke_width=2,transform=f'rotate(-30 {cx} {cy})')


def tapeout_overview() -> None:
    d=Drawing(1665,564,'0 195 1665 564','Approved layers to GDSII/OASIS and foundry handoff','The original layer stack becomes a GDSII/OASIS file, a versioned release package with signoff documents, and a photomask handoff.')
    spec_palette(d)
    for x,title in [(120,'Approved layout'),(542,'GDSII / OASIS'),(886,'Release package'),(1311,'Foundry handoff')]:d.text(x,251,title,39,700,anchor='start')
    tapeout_layers(d,117,293,338,382,'swatch')
    gds_document(d,568,340,170,228)
    release_folders(d,894,284,270,188)
    d.rect(889,492,281,239,'#fff','#b3ceef',2.2,12,stroke_dasharray='8 6')
    for y,kind,t in [(510,'doc','GDSII / OASIS'),(557,'check','Signoff report'),(602,'check','Release checklist'),(647,'doc','Version info')]:
        if kind=='doc':reference_icon(d,'document',912,y-1,.56)
        else:
            d.rect(918,y,26,28,'#fff',BLUE,3.5,2);d.path(f'M924 {y+13}L930 {y+19}L939 {y+8}',stroke=BLUE,sw=3)
        d.text(974,y+24,t,23,400,anchor='start')
    for xx in (980,994,1008):d.circle(xx,705,2.6)
    for xx in (468,780,1190):d.path(f'M{xx} 439H{xx+41}V422L{xx+72} 453L{xx+41} 485V467H{xx}Z',fill='url(#progress)',stroke='none')
    for x,y,w,h in [(1353,305,275,236),(1330,318,284,240),(1305,333,289,240)]:
        d.rect(x+4,y+4,w,h,'#e0e5ec','none',0,5)
        d.rect(x,y,w,h,'#bfcee1','#243b5b',3,4)
    d.rect(1283,350,292,238,'#f5f8fc','#203551',3.2,5)
    for row in range(2):
        for col in range(3):photomask_tile(d,1317+col*78,388+row*86,71,78,row*3+col)
    for x,y in [(1301,369),(1556,369),(1301,571),(1556,571)]:d.path(f'M{x-6} {y}H{x+6} M{x} {y-6}V{y+6}',stroke='#344b6a',sw=2.4)
    for yy in (362,568):d.rect(1426,yy,10,10,'#152944','none',0)
    d.save('tapeout-overview.svg')


def tapeout_detail() -> None:
    d=Drawing(2171,624,'0 41 2171 624','Export, release package and foundry handoff','Three source-matched scenes show the stack of layout layers, versioned release folders and documents, and a foundry with a perspective photomask.')
    spec_palette(d)
    d.parts.append('<g transform="scale(1.06005859375)">')
    for i,(x,w,title,tx) in enumerate([(22,658,'Export',165),(698,652,'Release Package',839),(1368,658,'Foundry Handoff',1508)],1):
        d.rect(x,66,w,533,'#fff','#b1d5ff',2,17)
        d.text(x+33,133,f'{i:02d}',61,700,anchor='start',color=BLUE)
        d.text(tx,128,title,51,700,anchor='start')
    tapeout_layers(d,130,177,278,367,'leader')
    gds_document(d,494,257,140,205)
    release_folders(d,752,195,251,203)
    for y,label,fill,col in [(418,'v1.0','#2d91ff','#fff'),(465,'v0.9','#e7edf5','#415c81'),(511,'v0.8','#e7edf5','#415c81')]:
        d.rect(781,y,104,36,fill,'#d1ddeb' if label!='v1.0' else 'none',2,18);d.text(833,y+26,label,25,500,color=col)
    for xx in (817,829,841):d.circle(xx,570,2.5)
    d.rect(1034,183,293,324,'#fff','#bddaff',2,14)
    for y,kind,t in [(213,'report','Signoff report'),(283,'check','Release checklist'),(355,'database','Version data'),(425,'report','...')]:
        if kind=='database':database_icon(d,1065,y,.84)
        elif kind=='check':
            d.path(f'M1068 {y}H1090L1103 {y+13}V{y+45}H1068Z M1090 {y}V{y+13}H1103 M1076 {y+26}L1083 {y+32}L1095 {y+20}',stroke=BLUE,sw=3.5)
        else:
            reference_icon(d,'document',1057,y-2,.8)
        d.text(1131,y+33,t,25,400,anchor='start')
    gds_document(d,1412,261,122,174)
    d.circle(1419,468,18,'#2593ff');d.path('M1411 468L1417 474L1428 462',stroke='#fff',sw=3)
    d.text(1447,477,'Approved',25,400,anchor='start')
    foundry_building(d,1606,161)
    tilted_photomask(d)
    d.text(1791,575,'Photomask',26,450)
    for x,y,w,h in [(417,351,61,45),(670,347,54,42),(1341,347,51,42),(1559,353,60,44)]:
        d.path(f'M{x} {y}H{x+w*.48}V{y-h*.4}L{x+w} {y+h*.35}L{x+w*.48} {y+h*1.1}V{y+h*.68}H{x}Z',fill='url(#progress)',stroke='none')
    d.end();d.save('tapeout-detail.svg')


def main() -> None:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stage",choices=["rtl","spec","dv","synthesis","dft","physical","signoff","tapeout"])
    args=parser.parse_args()
    if args.stage=="rtl": rtl_overview();rtl_detail()
    if args.stage=="spec": spec_overview();spec_detail()
    if args.stage=="dv": dv_overview();dv_detail()
    if args.stage=="synthesis": synthesis_overview();synthesis_detail()
    if args.stage=="dft": dft_overview();dft_detail()
    if args.stage=="physical": physical_overview();physical_detail()
    if args.stage=="signoff": signoff_overview();signoff_detail()
    if args.stage=="tapeout": tapeout_overview();tapeout_detail()


if __name__=="__main__": main()
