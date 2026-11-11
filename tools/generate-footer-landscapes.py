"""Original raster footer plates. Pillow only, deterministic, no reference pixels."""
from pathlib import Path
import math
import random
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "public/art/footer"
OUT.mkdir(parents=True, exist_ok=True)
R = random.Random(24117)


def engraving():
    w, h = 1800, 390
    blue, cream = (22, 61, 127), (250, 236, 205)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    def ridge(x):
        return 95 - 65 * math.exp(-((x-1240)/110)**2) - 41 * math.exp(-((x-370)/150)**2) + 8*math.sin(x/73)+5*math.sin(x/29)
    edge = [(x, ridge(x)) for x in range(0, w+1, 3)]
    d.polygon(edge + [(w,h),(0,h)], fill=cream)
    # Contour marks follow the terrain, interrupted like a cut woodblock.
    for y in range(7, h, 4):
        x = R.randint(-70, 0)
        while x < w:
            length=R.randint(9, 48)
            pts=[]
            for px in range(x, min(w,x+length), 2):
                yy = ridge(px) + y*(.50 + y/h*.5) + 3*math.sin(px/17+y/13)
                if 0 <= px < w and yy < h: pts.append((px,yy))
            if len(pts)>1:d.line(pts, fill=(*blue,R.randint(145,225)), width=1)
            x += length+R.randint(4,17)
    # Fine rock striations and paper chips along the upper cliffs.
    for _ in range(1600):
        x=R.randrange(w);y=ridge(x)+R.randrange(3,100)
        d.line([(x,y),(x+R.randint(-4,9),y+R.randint(1,7))],fill=(*blue,R.randint(80,190)),width=1)
    # Grasses and agaves are drawn in the foreground, each with a distinct gesture.
    for i in range(95):
        x=R.randrange(w);y=R.randint(190,390);size=(y/h)**2*R.randint(9,46)
        for j in range(R.randint(5,12)):
            a=R.uniform(-2.65,-.5);s=size*R.uniform(.45,1)
            pts=[(x,y),(x+math.cos(a)*s*.40,y+math.sin(a)*s*.68),(x+math.cos(a)*s,y+math.sin(a)*s)]
            d.line(pts,fill=(*blue,240),width=max(1,int(size/19)))
        d.line([(x-4,y+2),(x+8,y+2)],fill=(*blue,180),width=1)
    # A small winding footpath, rather than the reference's horse and rider.
    for i in range(10):
        y=115+i*24;cx=840+80*math.sin(i/2);width=5+i*4
        d.arc((cx-width,y-12,cx+width,y+12),0,160,fill=(*blue,190),width=1)
    im.save(OUT/"blue-hour-landscape.webp",lossless=True)


def village():
    w,h=1800,720
    sky=(250,235,201)
    im=Image.new("RGB",(w,h),sky)
    d=ImageDraw.Draw(im)
    # Broad flat-brush strokes and thin scumbled paint on the cream ground.
    for _ in range(1000):
        x=R.randrange(w);y=R.randrange(h);v=R.randrange(-5,5)
        col=tuple(max(0,min(255,c+v)) for c in sky)
        d.line([(x,y),(x+R.randint(10,130),y+R.randint(-6,6))],fill=col,width=R.randint(1,5))
    d.polygon([(620,520),(810,468),(960,454),(1070,473),(1160,430),(1350,380),(1800,440),(1800,720),(0,720),(0,584)],fill=(203,182,132))
    d.polygon([(1000,485),(1110,380),(1250,270),(1390,180),(1490,90),(1610,5),(1740,50),(1800,155),(1800,720),(870,720)],fill=(193,142,90))
    d.polygon([(0,579),(299,560),(680,590),(1080,562),(1400,600),(1800,563),(1800,720),(0,720)],fill=(210,155,90))
    # Sea visible in the valley.
    d.polygon([(655,507),(783,491),(875,468),(976,468),(1035,499),(932,520),(769,527)],fill=(133,151,180))
    d.polygon([(0,642),(340,620),(550,646),(815,615),(1200,653),(1590,606),(1800,642),(1800,720),(0,720)],fill=(195,130,73))
    # Original stepped houses, painted from far hill to foreground.
    palette=[(243,219,176),(229,169,116),(207,130,126),(133,166,151),(212,171,151),(239,204,136),(139,174,181),(225,181,153)]
    houses=[]
    for row in range(9):
        y=65+row*57
        start=1610-row*70
        for col in range(3+row//2):
            x=start+col*67+R.randrange(-10,10)
            if x>1765:continue
            hh=R.randint(41,70);ww=R.randint(43,66)
            houses.append((x,y+R.randrange(-12,12),ww,hh,palette[R.randrange(len(palette))]))
    for x,y,ww,hh,c in sorted(houses,key=lambda q:q[1]):
        # Slightly irregular walls retain the dry-brush silhouettes.
        d.polygon([(x,y),(x+ww,y-2),(x+ww+2,y+hh),(x-1,y+hh+1)],fill=c)
        d.polygon([(x+ww,y),(x+ww+11,y+6),(x+ww+10,y+hh),(x+ww,y+hh)],fill=tuple(int(v*.82) for v in c))
        d.polygon([(x-4,y-5),(x+ww+3,y-7),(x+ww+6,y+2),(x-3,y+3)],fill=R.choice([(119,74,48),(164,86,54),(142,88,57)]))
        for wx in [x+10,x+ww-18]:
            wy=y+13+R.randint(-2,3);d.rectangle((wx,wy,wx+9,wy+11),fill=(74,67,50))
        if R.random()>.4:d.rectangle((x+ww//2-5,y+hh-21,x+ww//2+6,y+hh),fill=(70,105,91))
        for _ in range(5):
            px=x+R.randrange(ww);py=y+R.randrange(hh)
            d.line([(px,py),(px+R.randint(3,12),py)],fill=tuple(min(255,v+8) for v in c),width=2)
    # Cream path threads between the houses.
    path=[(1710,56),(1674,140),(1515,204),(1550,269),(1370,333),(1410,382),(1240,445),(1278,487),(1125,545)]
    d.line(path,fill=(244,223,184),width=7,joint="curve")
    def tree(x,y,s,front=False):
        trunk=(75,76,40) if front else (109,105,56)
        d.polygon([(x-s*.065,y),(x+s*.04,y),(x+s*.045,y-s*.63),(x-s*.045,y-s*.65)],fill=trunk)
        d.line([(x,y-s*.16),(x-s*.18,y-s*.59)],fill=trunk,width=max(2,int(s*.025)))
        # Uneven clustered crowns, not repeated perfect circles.
        col=R.choice([(109,108,58),(119,123,69),(138,139,80),(99,110,61),(147,145,85)])
        for dx,dy,sz in [(-.2,-.66,.32),(.14,-.71,.34),(-.03,-.89,.33),(.32,-.61,.21)]:
            cx,cy=x+dx*s,y+dy*s
            points=[]
            for a in range(0,360,10):
                rad=sz*s*(1+R.uniform(-.10,.08));ar=a*math.pi/180
                points.append((cx+math.cos(ar)*rad,cy+math.sin(ar)*rad*.77))
            d.polygon(points,fill=col)
            for _ in range(20):
                px=cx+R.uniform(-sz*.75,sz*.75)*s;py=cy+R.uniform(-sz*.45,sz*.45)*s
                d.line([(px,py),(px+R.uniform(3,9),py-1)],fill=tuple(min(255,v+R.randrange(2,11)) for v in col),width=2)
    for x,y,s in [(1250,430,85),(1510,337,80),(1707,173,110),(1650,445,120),(1780,518,100),(1380,262,63)]:tree(x,y,s)
    for x,y,s in [(10,585,380),(171,591,275),(340,601,325),(482,606,220),(619,607,145),(102,618,185),(405,630,183)]:tree(x,y,s,True)
    # Ground marks and dry paint that pick up the countryside palette.
    for _ in range(680):
        x=R.randrange(w);y=R.randrange(592,h)
        if R.random()>.65:
            d.line([(x,y),(x+R.randint(-4,8),y-R.randint(3,12))],fill=R.choice([(135,130,67),(158,143,83),(175,146,83)]),width=R.randint(2,5))
        else:
            d.line([(x,y),(x+R.randint(3,25),y)],fill=R.choice([(212,159,97),(203,145,84),(200,150,91)]),width=R.randint(1,3))
    # A subtle real raster paper grain, no SVG filter imitation.
    pix=im.load()
    for y in range(h):
        for x in range(w):
            n=R.randrange(-3,4);c=pix[x,y];pix[x,y]=tuple(max(0,min(255,v+n)) for v in c)
    im.save(OUT/"hillside-landscape.webp",quality=91,method=6)


if __name__ == "__main__":
    engraving()
    village()
    print("Original footer landscapes saved to", OUT)
