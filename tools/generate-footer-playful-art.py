"""Draw the original Common mascots and Morrow sticker accents as alpha bitmaps.

No reference pixels are sampled. The authored paths and palette below are the
editable source. Output is supersampled and reduced for smooth alpha edges.
"""
from pathlib import Path
from math import sin, cos, pi
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "public/art/footer"
OUT.mkdir(parents=True, exist_ok=True)
S = 3
INK = "#202022"
CREAM = "#fff7e5"


def canvas(size=(360, 360)):
    im = Image.new("RGBA", (size[0] * S, size[1] * S))
    return im, ImageDraw.Draw(im)


def path(draw, start, segments, fill):
    points = [start]
    at = start
    for a, b, end in segments:
        for j in range(1, 31):
            t = j / 30
            points.append(((1-t)**3*at[0]+3*(1-t)**2*t*a[0]+3*(1-t)*t*t*b[0]+t**3*end[0],
                           (1-t)**3*at[1]+3*(1-t)**2*t*a[1]+3*(1-t)*t*t*b[1]+t**3*end[1]))
        at = end
    draw.polygon([(int(x*S), int(y*S)) for x, y in points], fill=fill)


def ellipse(draw, box, fill):
    draw.ellipse(tuple(int(v*S) for v in box), fill=fill)


def line(draw, pts, fill, width):
    draw.line([(int(x*S), int(y*S)) for x,y in pts], fill=fill, width=int(width*S), joint="curve")
    r = width/2
    for x, y in (pts[0], pts[-1]):
        ellipse(draw, (x-r, y-r, x+r, y+r), fill)


def save(im, name):
    im.resize((im.width//S, im.height//S), Image.Resampling.LANCZOS).save(OUT / (name + ".webp"), quality=92, method=6)


# Sprout: a soft asymmetric oval with a tilted leaf, freckled cheeks, no antenna.
im, d = canvas()
path(d, (58, 198), [((28,101),(109,49),(203,60)),((302,69),(326,153),(302,232)),
                   ((275,323),(113,336),(70,273)),((51,252),(57,227),(58,198))], INK)
path(d, (157,69), [((151,35),(179,8),(225,15)),((222,54),(194,76),(157,69))], INK)
ellipse(d,(105,124,145,190),CREAM); ellipse(d,(209,127,249,193),CREAM)
ellipse(d,(112,145,129,180),INK); ellipse(d,(216,147,233,182),INK)
d.arc((135*S,172*S,222*S,233*S), 13, 165, fill=CREAM, width=7*S)
for x,y in [(95,204),(108,209),(251,208),(265,202)]: ellipse(d,(x-3,y-3,x+3,y+3),CREAM)
save(im,"playful-colony-sprout")

# Fold: a little rounded envelope shaped pal, with an upward wave.
im, d = canvas()
path(d,(78,123), [((50,111),(30,89),(40,60)),((44,46),(59,47),(65,62)),
                  ((64,84),(73,85),(94,89)),((125,49),(218,54),(262,89)),
                  ((276,101),(280,159),(270,185)),((269,209),(281,218),(300,213)),
                  ((326,198),(336,226),(308,245)),((291,256),(277,254),(267,249)),
                  ((245,278),(113,281),(80,250)),((49,218),(56,145),(78,123))],INK)
ellipse(d,(112,112,151,159),CREAM); ellipse(d,(206,112,245,159),CREAM)
ellipse(d,(129,126,144,151),INK); ellipse(d,(223,126,238,151),INK)
path(d,(131,185), [((158,213),(205,213),(229,181)),((229,235),(150,238),(131,185))],CREAM)
line(d,[(106,261),(95,301),(73,305)],INK,18)
line(d,[(236,264),(250,300),(272,300)],INK,18)
save(im,"playful-colony-fold")

# Pebble: a pill shaped friend looking sideways, cropped against the card edge.
im, d = canvas()
path(d,(47,224), [((9,157),(55,97),(122,77)),((157,50),(169,30),(208,49)),
                  ((226,51),(249,87),(271,112)),((317,142),(334,214),(302,261)),
                  ((259,325),(93,302),(47,224))],INK)
ellipse(d,(81,130,152,197),CREAM);ellipse(d,(195,125,266,192),CREAM)
ellipse(d,(118,134,146,188),INK);ellipse(d,(232,128,259,185),INK)
d.arc((139*S,190*S,230*S,244*S),0,180,fill=CREAM,width=7*S)
save(im,"playful-colony-pebble")

# The studio's own sticker grammar: four simple die-cut marks.
im,d=canvas((240,240))
pts=[]
for i in range(20):
    a=-pi/2+i*pi/10; r=105 if i%2==0 else 82
    pts.append((120+cos(a)*r,120+sin(a)*r))
d.polygon([(int(x*S),int(y*S)) for x,y in pts],fill="#e7bff5")
path(d,(127,39), [((119,69),(107,98),(97,125)),((114,124),(120,122),(132,121)),
                  ((122,149),(111,181),(105,204)),((135,171),(156,138),(166,111)),
                  ((149,110),(140,109),(126,109)),((129,87),(135,61),(127,39))],"#7c2d72")
save(im,"playful-sticker-spark")

im,d=canvas((240,240))
ellipse(d,(11,11,229,229),"#b7d9b9")
d.arc((28*S,28*S,212*S,212*S),0,360,fill="#164e40",width=3*S)
ellipse(d,(67,71,90,113),"#164e40");ellipse(d,(150,71,173,113),"#164e40")
d.arc((54*S,91*S,186*S,181*S),7,173,fill="#164e40",width=7*S)
save(im,"playful-sticker-smile")

im,d=canvas((240,240))
pts=[]
for i in range(16):
    a=-pi/2+i*pi/8;r=113 if i%2==0 else 70
    pts.append((120+cos(a)*r,120+sin(a)*r))
d.polygon([(int(x*S),int(y*S)) for x,y in pts],fill="#ff824f")
ellipse(d,(73,73,167,167),CREAM)
ellipse(d,(99,99,141,141),"#bd3b1e")
save(im,"playful-sticker-sun")

im,d=canvas((240,240))
path(d,(32,137), [((69,57),(159,54),(213,113)),((224,120),(224,135),(211,147)),
                  ((163,206),(66,204),(32,137))],CREAM)
ellipse(d,(88,78,164,188),INK);ellipse(d,(105,93,144,167),"#7b91f6")
save(im,"playful-sticker-eye")
print("Generated seven original alpha assets in",OUT)
