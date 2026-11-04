/**
 * The India skyline band that runs along the bottom of the footer.
 *
 * `public/images/footer.png` ends on a row of monuments, and that band is the
 * thing that makes the reference memorable. It is redrawn here as SVG rather
 * than shipped as a bitmap , the same call made for ref3's cartouche in
 * <PosterCard> (see design/references/README.md). A drawing scales to any
 * width without a second asset, costs about 6 KB of markup instead of 60 KB of
 * image, and , the part that actually matters , takes its colours from CSS
 * custom properties, so the whole band retunes for dark mode for free.
 *
 * Left to right: Qutub Minar, the Alai Darwaza beside it, Jama Masjid, India
 * Gate, the Taj Mahal, a pair of temple shikharas, and the Red Fort running off
 * the right edge. The order is roughly the reference's, which is roughly a
 * drive south-west across Delhi and on to Agra.
 *
 * Everything is composed from six primitives below rather than authored as one
 * blob of path data, so the monuments stay legible as code and a change to, say,
 * how a dome bulges applies to all eleven of them at once.
 */

/** Ground line. Every monument is measured up from here. */
const G = 230;

/** viewBox is 1800 x 230 , about 7.8:1, so the band stays a band on wide screens. */
const W = 1800;

/** SVG takes any precision; 1dp keeps the emitted markup readable. */
const n = (v: number) => Math.round(v * 10) / 10;

/**
 * A Mughal onion dome: widest below its middle, pinched at the neck, drawn to a
 * rounded point. The control points are fractions of the dome's own size, so one
 * curve serves everything from the Taj's crown to a 9px kiosk cap.
 */
function domePath(cx: number, baseY: number, rx: number, h: number) {
  const a = baseY - h;
  return [
    `M${n(cx - rx)} ${n(baseY)}`,
    `C${n(cx - rx * 1.09)} ${n(baseY - h * 0.5)} ${n(cx - rx * 0.94)} ${n(baseY - h * 0.83)} ${n(cx - rx * 0.34)} ${n(baseY - h * 0.95)}`,
    `C${n(cx - rx * 0.16)} ${n(baseY - h * 0.99)} ${n(cx - rx * 0.06)} ${n(a)} ${n(cx)} ${n(a)}`,
    `C${n(cx + rx * 0.06)} ${n(a)} ${n(cx + rx * 0.16)} ${n(baseY - h * 0.99)} ${n(cx + rx * 0.34)} ${n(baseY - h * 0.95)}`,
    `C${n(cx + rx * 0.94)} ${n(baseY - h * 0.83)} ${n(cx + rx * 1.09)} ${n(baseY - h * 0.5)} ${n(cx + rx)} ${n(baseY)}`,
    "Z",
  ].join(" ");
}

/** A pointed arch. `y` is the apex; the jambs run straight to `y + h`. */
function archPath(x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const spring = y + h * 0.44;
  return [
    `M${n(x)} ${n(y + h)}`,
    `V${n(spring)}`,
    `Q${n(x)} ${n(y + h * 0.07)} ${n(cx)} ${n(y)}`,
    `Q${n(x + w)} ${n(y + h * 0.07)} ${n(x + w)} ${n(spring)}`,
    `V${n(y + h)}`,
    "Z",
  ].join(" ");
}

/** The saw-tooth merlons along a fort wall. Flat underside, pointed top. */
function merlonPath(x: number, w: number, y: number, h: number, count: number) {
  const step = w / count;
  let d = `M${n(x)} ${n(y + h)}`;
  for (let i = 0; i < count; i++) {
    const x0 = x + i * step;
    d += ` L${n(x0 + step / 2)} ${n(y)} L${n(x0 + step)} ${n(y + h)}`;
  }
  return `${d} Z`;
}

/** Stem, ball and spike. `s` scales the whole thing off the dome it caps. */
function Finial({ cx, y, fill, s = 1 }: { cx: number; y: number; fill: string; s?: number }) {
  return (
    <g fill={fill}>
      <rect x={n(cx - 1.1 * s)} y={n(y - 13 * s)} width={n(2.2 * s)} height={n(13 * s)} />
      <circle cx={n(cx)} cy={n(y - 14 * s)} r={n(2.6 * s)} />
      <path d={`M${n(cx)} ${n(y - 23 * s)} l${n(2 * s)} ${n(6 * s)} h${n(-4 * s)} Z`} />
    </g>
  );
}

/** Dome + drum + finial, the unit every domed thing here is built from. */
function Dome({
  cx,
  baseY,
  rx,
  h,
  fill,
  drum,
  finial,
}: {
  cx: number;
  baseY: number;
  rx: number;
  h: number;
  fill: string;
  drum?: string;
  /** The kalash atop the dome. Defaults to the dome's own colour; set to
   *  marigold on the hero domes for the gilded glint the reference carries. */
  finial?: string;
}) {
  return (
    <>
      {drum && (
        <rect
          x={n(cx - rx * 0.86)}
          y={n(baseY - 1)}
          width={n(rx * 1.72)}
          height={7}
          fill={drum}
        />
      )}
      <path d={domePath(cx, baseY, rx, h)} fill={fill} />
      <Finial cx={cx} y={baseY - h} fill={finial ?? fill} s={Math.max(0.45, rx / 34)} />
    </>
  );
}

/** An open kiosk: two posts, a lintel, a dome. */
function Chhatri({
  cx,
  baseY,
  w,
  h,
  fill,
}: {
  cx: number;
  baseY: number;
  w: number;
  h: number;
  fill: string;
}) {
  const post = Math.max(2, w * 0.13);
  return (
    <>
      <rect x={n(cx - w / 2)} y={n(baseY - h)} width={n(post)} height={n(h)} fill={fill} />
      <rect x={n(cx + w / 2 - post)} y={n(baseY - h)} width={n(post)} height={n(h)} fill={fill} />
      <rect x={n(cx - w / 2 - 1.5)} y={n(baseY - h - 3)} width={n(w + 3)} height={3.5} fill={fill} />
      <Dome cx={cx} baseY={baseY - h - 3} rx={w * 0.47} h={w * 0.62} fill={fill} />
    </>
  );
}

/** A tapered tower with banded storeys and a kiosk on top. */
function Minaret({
  cx,
  baseY,
  h,
  wBase,
  wTop,
  fill,
  band,
  bands = 3,
}: {
  cx: number;
  baseY: number;
  h: number;
  wBase: number;
  wTop: number;
  fill: string;
  band: string;
  bands?: number;
}) {
  const top = baseY - h;
  return (
    <>
      <path
        d={`M${n(cx - wBase / 2)} ${n(baseY)} L${n(cx - wTop / 2)} ${n(top)} L${n(cx + wTop / 2)} ${n(top)} L${n(cx + wBase / 2)} ${n(baseY)} Z`}
        fill={fill}
      />
      {Array.from({ length: bands }, (_, i) => {
        const t = (i + 1) / (bands + 1);
        const y = baseY - h * t;
        const w = wBase + (wTop - wBase) * t;
        return (
          <rect
            key={i}
            x={n(cx - w / 2 - 1)}
            y={n(y)}
            width={n(w + 2)}
            height={3}
            fill={band}
          />
        );
      })}
      <Chhatri cx={cx} baseY={top} w={wTop * 1.6} h={wTop * 0.8} fill={fill} />
    </>
  );
}

/** A run of identical arches, used for arcades and colonnades. */
function Arcade({
  x,
  y,
  w,
  h,
  count,
  fill,
  gap = 0.28,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
  fill: string;
  gap?: number;
}) {
  const step = w / count;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <path
          key={i}
          d={archPath(x + i * step + (step * gap) / 2, y, step * (1 - gap), h)}
          fill={fill}
        />
      ))}
    </>
  );
}

export function MonumentSkyline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${G}`}
      className={`portfolio-monument-skyline ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* ---------------- Qutub Minar ---------------- */}
      {/* Five storeys, each a slightly narrower trapezoid than the one below,
          separated by the overhanging balconies that make the real tower read
          as stacked rather than simply tapered. */}
      <g>
        {(
          [
            [G, 178, 34, 28],
            [174, 130, 27, 22],
            [126, 90, 21, 17],
            [86, 58, 16, 13],
            [54, 36, 12, 10],
          ] as const
        ).map(([yb, yt, hb, ht], i) => (
          <path
            key={i}
            d={`M${n(80 - hb)} ${n(yb)} L${n(80 - ht)} ${n(yt)} L${n(80 + ht)} ${n(yt)} L${n(80 + hb)} ${n(yb)} Z`}
            fill="var(--portfolio-fx-sand)"
          />
        ))}
        {/* Flutes on the lowest storey, as on the original. */}
        {[-24, -12, 0, 12, 24].map((dx) => (
          <rect
            key={dx}
            x={n(80 + dx - 0.9)}
            y={182}
            width={1.8}
            height={48}
            fill="var(--portfolio-fx-sand-d)"
          />
        ))}
        {(
          [
            [174, 36],
            [126, 29],
            [86, 23],
            [54, 18],
          ] as const
        ).map(([y, hw]) => (
          <rect
            key={y}
            x={n(80 - hw)}
            y={n(y)}
            width={n(hw * 2)}
            height={5}
            fill="var(--portfolio-fx-sand-d)"
          />
        ))}
        <Dome cx={80} baseY={36} rx={11} h={15} fill="var(--portfolio-fx-sand-d)" finial="var(--portfolio-desi-marigold)" />
      </g>

      {/* ---------------- Alai Darwaza ---------------- */}
      <g>
        <rect x={140} y={160} width={152} height={70} fill="var(--portfolio-fx-sand)" />
        <rect x={136} y={156} width={160} height={7} fill="var(--portfolio-fx-sand-d)" />
        <Dome cx={216} baseY={156} rx={38} h={50} fill="var(--portfolio-fx-brown)" drum="var(--portfolio-fx-brown)" finial="var(--portfolio-desi-marigold)" />
        <path d={archPath(194, 180, 44, 50)} fill="var(--portfolio-fx-sand-d)" />
        <path d={archPath(152, 198, 22, 32)} fill="var(--portfolio-fx-sand-d)" />
        <path d={archPath(258, 198, 22, 32)} fill="var(--portfolio-fx-sand-d)" />
        <Chhatri cx={148} baseY={156} w={20} h={12} fill="var(--portfolio-fx-sand-d)" />
        <Chhatri cx={284} baseY={156} w={20} h={12} fill="var(--portfolio-fx-sand-d)" />
      </g>

      {/* ---------------- Jama Masjid ---------------- */}
      {/* The three domes and the tall striped minarets are the whole silhouette;
          the arcade along the plinth is what keeps it from reading as a castle. */}
      <g>
        <Minaret
          cx={322}
          baseY={G}
          h={172}
          wBase={20}
          wTop={13}
          fill="var(--portfolio-fx-stone)"
          band="var(--portfolio-fx-stone-d)"
        />
        <Minaret
          cx={618}
          baseY={G}
          h={172}
          wBase={20}
          wTop={13}
          fill="var(--portfolio-fx-stone)"
          band="var(--portfolio-fx-stone-d)"
        />
        <rect x={300} y={198} width={340} height={32} fill="var(--portfolio-fx-stone)" />
        <Arcade x={302} y={202} w={336} h={28} count={13} fill="var(--portfolio-fx-stone-d)" />
        <rect x={380} y={150} width={180} height={50} fill="var(--portfolio-fx-stone)" />
        <Dome cx={400} baseY={172} rx={25} h={32} fill="var(--portfolio-fx-stone)" drum="var(--portfolio-fx-stone-d)" finial="var(--portfolio-desi-marigold)" />
        <Dome cx={540} baseY={172} rx={25} h={32} fill="var(--portfolio-fx-stone)" drum="var(--portfolio-fx-stone-d)" finial="var(--portfolio-desi-marigold)" />
        <Dome cx={470} baseY={152} rx={43} h={58} fill="var(--portfolio-fx-stone)" drum="var(--portfolio-fx-stone-d)" finial="var(--portfolio-desi-marigold)" />
        {/* Ribs down the crown. */}
        {[-26, -13, 0, 13, 26].map((dx) => (
          <rect
            key={dx}
            x={n(470 + dx - 0.7)}
            y={110}
            width={1.4}
            height={42}
            fill="var(--portfolio-fx-stone-d)"
          />
        ))}
        <path d={archPath(444, 152, 52, 78)} fill="var(--portfolio-fx-stone-d)" />
      </g>

      {/* ---------------- India Gate ---------------- */}
      {/* The stepped cornice is the recognisable part , three slabs, each set
          back from the one below. */}
      <g fill="var(--portfolio-fx-sand)">
        <rect x={684} y={134} width={192} height={96} />
        <rect x={676} y={120} width={208} height={15} />
        <rect x={690} y={107} width={180} height={14} />
        <rect x={706} y={96} width={148} height={12} />
      </g>
      <rect x={676} y={132} width={208} height={4} fill="var(--portfolio-fx-sand-d)" />
      <path d={archPath(750, 148, 60, 82)} fill="var(--portfolio-fx-sand-d)" />

      {/* ---------------- Taj Mahal ---------------- */}
      <g>
        <Minaret
          cx={936}
          baseY={206}
          h={90}
          wBase={13}
          wTop={9}
          fill="var(--portfolio-fx-white)"
          band="var(--portfolio-fx-stone-d)"
          bands={2}
        />
        <Minaret
          cx={1114}
          baseY={206}
          h={90}
          wBase={13}
          wTop={9}
          fill="var(--portfolio-fx-white)"
          band="var(--portfolio-fx-stone-d)"
          bands={2}
        />
        <rect x={920} y={206} width={210} height={24} fill="var(--portfolio-fx-white)" />
        <rect x={920} y={206} width={210} height={3} fill="var(--portfolio-fx-stone-d)" />
        <rect x={962} y={160} width={126} height={46} fill="var(--portfolio-fx-white)" />
        <Dome cx={988} baseY={172} rx={15} h={19} fill="var(--portfolio-fx-white)" finial="var(--portfolio-desi-marigold)" />
        <Dome cx={1062} baseY={172} rx={15} h={19} fill="var(--portfolio-fx-white)" finial="var(--portfolio-desi-marigold)" />
        <Dome cx={1025} baseY={162} rx={34} h={52} fill="var(--portfolio-fx-white)" drum="var(--portfolio-fx-stone-d)" finial="var(--portfolio-desi-marigold)" />
        <path d={archPath(1005, 168, 40, 62)} fill="var(--portfolio-fx-stone-d)" />
        <path d={archPath(968, 188, 18, 42)} fill="var(--portfolio-fx-stone-d)" />
        <path d={archPath(1064, 188, 18, 42)} fill="var(--portfolio-fx-stone-d)" />
      </g>

      {/* ---------------- Temple shikharas ---------------- */}
      {/* Curvilinear towers: the profile bows outward before it draws in, which
          is what separates a nagara shikhara from a plain spire. Each is capped
          by an amalaka disc and a kalash. */}
      <g>
        <rect x={1146} y={208} width={132} height={22} fill="var(--portfolio-fx-amber-d)" />
        {(
          [
            [1182, 30, 122],
            [1246, 21, 152],
          ] as const
        ).map(([cx, hw, apexY]) => (
          <g key={cx}>
            <path
              d={`M${n(cx - hw)} 208 Q${n(cx - hw * 0.96)} ${n(apexY + (208 - apexY) * 0.42)} ${n(cx - hw * 0.28)} ${n(apexY)} L${n(cx + hw * 0.28)} ${n(apexY)} Q${n(cx + hw * 0.96)} ${n(apexY + (208 - apexY) * 0.42)} ${n(cx + hw)} 208 Z`}
              fill="var(--portfolio-fx-amber)"
            />
            {[0.28, 0.5, 0.72].map((t) => {
              const y = apexY + (208 - apexY) * t;
              const w = hw * (0.28 + 0.72 * t) * 2;
              return (
                <rect
                  key={t}
                  x={n(cx - w / 2)}
                  y={n(y)}
                  width={n(w)}
                  height={2.5}
                  fill="var(--portfolio-fx-amber-d)"
                />
              );
            })}
            <ellipse cx={n(cx)} cy={n(apexY - 2)} rx={n(hw * 0.42)} ry={4} fill="var(--portfolio-fx-amber-d)" />
            <Finial cx={cx} y={apexY - 5} fill="var(--portfolio-fx-amber-d)" s={0.8} />
          </g>
        ))}
      </g>

      {/* ---------------- Red Fort ---------------- */}
      {/* Deliberately runs off the right edge: the wall is famously longer than
          any one view of it, and a band that stops short reads as a cut-out. */}
      <g>
        <rect x={1290} y={178} width={W - 1290} height={52} fill="var(--portfolio-fx-red)" />
        <path d={merlonPath(1290, W - 1290, 168, 11, 34)} fill="var(--portfolio-fx-red)" />
        <rect x={1290} y={214} width={W - 1290} height={16} fill="var(--portfolio-fx-red-d)" />

        {/* Gate towers. */}
        {[1332, 1596].map((cx) => (
          <g key={cx}>
            <rect x={n(cx - 27)} y={130} width={54} height={100} fill="var(--portfolio-fx-red)" />
            <path d={merlonPath(cx - 27, 54, 122, 9, 5)} fill="var(--portfolio-fx-red)" />
            <rect x={n(cx - 31)} y={152} width={62} height={5} fill="var(--portfolio-fx-red-d)" />
            <Chhatri cx={cx} baseY={122} w={30} h={17} fill="var(--portfolio-fx-red)" />
          </g>
        ))}

        {/* Diwan-i-Aam: the one pale thing on the wall, which is what stops the
            fort reading as a single red slab. */}
        <rect x={1372} y={152} width={184} height={30} fill="var(--portfolio-fx-red)" />
        <rect x={1376} y={156} width={176} height={26} fill="var(--portfolio-fx-card)" />
        <Arcade x={1378} y={158} w={172} h={24} count={9} fill="var(--portfolio-fx-red)" gap={0.22} />

        <Chhatri cx={1462} baseY={152} w={34} h={19} fill="var(--portfolio-fx-red)" />
        <Chhatri cx={1706} baseY={168} w={40} h={22} fill="var(--portfolio-fx-red)" />
        <Arcade x={1630} y={192} w={150} h={38} count={6} fill="var(--portfolio-fx-red-d)" gap={0.3} />
      </g>

      {/* Ground. Ties every base together and stops the monuments floating. */}
      <rect x={0} y={224} width={W} height={6} fill="var(--portfolio-fx-ground)" />
    </svg>
  );
}
