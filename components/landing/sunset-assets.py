"""Prepare the owner's painting and photo-derived motion masks without generating art.

python components/landing/sunset-assets.py painting.png orange-photo.jpg leaf-photo.jpg public/landing
Offline preparation needs Pillow, NumPy and OpenCV. Runtime needs only the PNGs.
"""
from pathlib import Path
import argparse
import sys

local = Path(__file__).resolve().parents[2] / "out/iteration/landing-python"
if local.exists():
    sys.path.insert(0, str(local))
import cv2
import numpy as np
from PIL import Image, PngImagePlugin

ORANGE_ORIGIN = "https://commons.wikimedia.org/wiki/File:Orange_(1).jpg"
LEAF_ORIGIN = "https://commons.wikimedia.org/wiki/File:Clementine_orange.jpg"

def save(path, pixels, description):
    info = PngImagePlugin.PngInfo()
    info.add_text("Source", "Owner-supplied painted forest reference, 5 November 2026; orange photograph by Renee Comet / National Cancer Institute, public domain; citrus leaf photograph by Petr Kratochvil, CC0.")
    info.add_text("impeccable:prompt", f"Origin: Owner-supplied painting. Artwork rights remain with its owner. Orange: {ORANGE_ORIGIN}, Renee Comet / National Cancer Institute, public domain. Leaf: {LEAF_ORIGIN}, Petr Kratochvil, CC0. No image generation was used. Processing: {description}\n\n" + Path(__file__).read_text(encoding="utf-8"))
    Image.fromarray(pixels).save(path, pnginfo=info, optimize=True)

def prepare(painting, orange_photo, leaf_photo, destination):
    destination.mkdir(parents=True, exist_ok=True)
    original = np.array(Image.open(painting).convert("RGB"))
    height, width = original.shape[:2]
    if (width, height) != (736, 920):
        raise ValueError("This preparation matches the owner's 736 x 920 painting.")
    photo = Image.open(orange_photo).convert("RGB")
    photo.thumbnail((900, 900))
    fruit = np.array(photo)
    saturation = cv2.cvtColor(fruit, cv2.COLOR_RGB2HSV)[:, :, 1]
    contours, _ = cv2.findContours((saturation > 45).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    silhouette = np.zeros(saturation.shape, np.uint8)
    cv2.drawContours(silhouette, [max(contours, key=cv2.contourArea)], -1, 255, -1)
    x, y, w, h = cv2.boundingRect(silhouette)
    rgba = np.dstack((fruit, cv2.GaussianBlur(silhouette, (3, 3), .6)))[y:y+h, x:x+w]

    # Select the upper citrus leaf from the actual photograph. The region only
    # excludes the second leaf; the alpha follows its photographed green edge.
    leaf_pixels = np.array(Image.open(leaf_photo).convert("RGB").resize((960, 640), Image.Resampling.LANCZOS))
    hsv = cv2.cvtColor(leaf_pixels, cv2.COLOR_RGB2HSV)
    leaf_alpha = ((hsv[:, :, 0] >= 30) & (hsv[:, :, 0] <= 95) & (hsv[:, :, 1] > 30)).astype(np.uint8) * 255
    region = np.zeros((640, 960), np.uint8)
    cv2.fillPoly(region, [np.array([(319, 147), (393, 88), (620, 121), (608, 159), (540, 184), (449, 164), (392, 168), (350, 171), (320, 170)])], 255)
    leaf_alpha = cv2.GaussianBlur(cv2.bitwise_and(leaf_alpha, region), (3, 3), .5)
    lx, ly, lw, lh = cv2.boundingRect(leaf_alpha)
    leaf = Image.fromarray(np.dstack((leaf_pixels, leaf_alpha))[ly:ly+lh, lx:lx+lw])
    leaf.thumbnail((round(w * .6), round(w * .6)), Image.Resampling.LANCZOS)
    leaf = leaf.rotate(18, Image.Resampling.BICUBIC, expand=True)
    fruit_top = 180
    fruit_with_leaf = Image.new("RGBA", (w + 90, h + fruit_top))
    fruit_with_leaf.alpha_composite(Image.fromarray(rgba), (0, fruit_top))
    fruit_with_leaf.alpha_composite(leaf, (round(w * .45), 60))
    bounds = fruit_with_leaf.getbbox()
    fruit_with_leaf = fruit_with_leaf.crop(bounds)
    save(destination / "sunset-orange.png", np.array(fruit_with_leaf), "Actual fruit silhouette with a real citrus leaf and stem extracted from Petr Kratochvil's CC0 photograph; softly antialiased alpha edges.")

    # Remove only the painted red disk, preserving the birds crossing it.
    erase = np.zeros((height, width), np.uint8)
    roi = original[401:442, 350:391]
    red = (roi[:, :, 0] > 190) & (roi[:, :, 1] < 125) & (roi[:, :, 2] < 145)
    erase[401:442, 350:391] = red.astype(np.uint8) * 255
    erase = cv2.dilate(erase, np.ones((3, 3), np.uint8))
    clean = cv2.inpaint(original, erase, 5, cv2.INPAINT_TELEA)
    clean_sky = clean.copy()
    bird_mask = np.zeros((height, width), np.uint8)
    birds = original[406:469, 246:472]
    bird_mask[406:469, 246:472] = ((birds.max(axis=2) < 87) & (birds[:, :, 2] < 77)).astype(np.uint8) * 255
    fruit_size = 35
    fruit_scale = fruit_size / w
    fruit_image = fruit_with_leaf.resize((round(fruit_with_leaf.width * fruit_scale), round(fruit_with_leaf.height * fruit_scale)), Image.Resampling.LANCZOS)
    plate = Image.fromarray(clean).convert("RGBA")
    at = (370 - fruit_size // 2, 421 - fruit_size // 2 - round((fruit_top - bounds[1]) * fruit_scale))
    plate.alpha_composite(fruit_image, at)
    clean = np.array(plate.convert("RGB"))
    clean[bird_mask > 0] = original[bird_mask > 0]

    # Grow each dark ink seed along the actual painted wing, then unmatte it
    # against the reconstructed sky. No replacement bird artwork is drawn.
    count, labels, stats, _ = cv2.connectedComponentsWithStats(bird_mask)
    ink = np.zeros((height, width), np.uint8)
    bird_bounds = []
    for index in range(1, count):
        bx, by, bw, bh, area = stats[index]
        if area < 3:
            continue
        left, top = max(0, bx - 5), max(0, by - 5)
        right, bottom = min(width, bx + bw + 5), min(height, by + bh + 5)
        patch = original[top:bottom, left:right]
        candidates = ((patch.max(axis=2) < 135) & (patch[:, :, 2] < 132)).astype(np.uint8)
        _, regions = cv2.connectedComponents(candidates)
        seed_regions = np.unique(regions[(labels[top:bottom, left:right] == index) & (regions > 0)])
        silhouette = np.isin(regions, seed_regions).astype(np.uint8) * 255
        ink[top:bottom, left:right] = np.maximum(ink[top:bottom, left:right], silhouette)
        px, py, pw, ph = cv2.boundingRect(silhouette)
        bird_bounds.append((left + px, top + py, pw, ph))
    erase_birds = cv2.dilate(ink, np.ones((3, 3), np.uint8))
    flight = Image.fromarray(cv2.inpaint(clean_sky, erase_birds, 3, cv2.INPAINT_TELEA)).convert("RGBA")
    flight.alpha_composite(fruit_image, at)
    flight_plate = np.array(flight.convert("RGB"))
    base = flight_plate.astype(np.float32)
    actual = clean.astype(np.float32)
    opacity = np.clip(np.max((base - actual) / np.maximum(base, 1), axis=2), 0, 1)
    opacity[(erase_birds == 0) | (opacity < .08)] = 0
    opacity *= cv2.GaussianBlur(ink.astype(np.float32) / 255, (3, 3), .55)
    # Restrict edge decontamination to the painting's dark ink palette, rather
    # than carrying neighbouring orange or sky colors into a moving wing.
    pigment = np.clip((actual - base * (1 - opacity[:, :, None])) / np.maximum(opacity[:, :, None], .001), 0, 100)
    bird_rgba = np.dstack((pigment.astype(np.uint8), (opacity * 255).astype(np.uint8)))
    columns, tile_width, tile_height = 4, 64, 48
    atlas_rows = (len(bird_bounds) + columns - 1) // columns
    atlas = np.zeros((atlas_rows * tile_height, columns * tile_width, 4), np.uint8)
    bird_motion = np.zeros((height, width), np.uint8)
    instances = []
    for index, (bx, by, bw, bh) in enumerate(bird_bounds):
        cx, cy = bx + bw / 2, by + bh / 2
        left, top = round(cx - tile_width / 2), round(cy - tile_height / 2)
        crop = bird_rgba[top:top + tile_height, left:left + tile_width].copy()
        # Keep the neighbouring flock members out of each padded atlas cell.
        own = np.zeros((tile_height, tile_width), np.uint8)
        own[max(0, by-top-1):min(tile_height, by-top+bh+1), max(0, bx-left-1):min(tile_width, bx-left+bw+1)] = 255
        crop[:, :, 3] = np.minimum(crop[:, :, 3], own)
        ay, ax = index // columns * tile_height, index % columns * tile_width
        atlas[ay:ay + tile_height, ax:ax + tile_width] = crop
        bird_motion[max(0, by-4):min(height, by+bh+4), max(0, bx-2):min(width, bx+bw+2)] = 255
        # The crop can have a half-pixel center; record its exact mapping.
        instances.append([left + tile_width / 2, top + tile_height / 2, bw / 2, round(index * .73, 2)])
    bird_source = Path(__file__).with_name("reference-birds.ts")
    bird_source.write_text(
        "/** Source-painting bird bounds, generated by sunset-assets.py. */\n"
        f"export const REFERENCE_BIRD_ATLAS = {{ columns: {columns}, rows: {atlas_rows}, tileWidth: {tile_width}, tileHeight: {tile_height}, imageWidth: {width}, imageHeight: {height} }} as const;\n\n"
        "/** Each tuple is source center X/Y, wing half-span and phase offset. */\n"
        "export const REFERENCE_BIRDS = " + str(instances) + " as const;\n", encoding="utf-8")

    seed = np.full((height, width), cv2.GC_PR_BGD, np.uint8)
    luminance = original.mean(axis=2) / 255
    rows = np.arange(height)[:, None] / height
    seed[(rows > .64) & (luminance < .4)] = cv2.GC_PR_FGD
    seed[(rows > .88) & (luminance < .22)] = cv2.GC_FGD
    seed[:580] = cv2.GC_BGD
    cv2.grabCut(original, seed, None, np.zeros((1, 65)), np.zeros((1, 65)), 4, cv2.GC_INIT_WITH_MASK)
    trees = np.where((seed == cv2.GC_FGD) | (seed == cv2.GC_PR_FGD), 1.0, 0.0).astype(np.float32)
    trees = cv2.GaussianBlur(trees, (3, 3), .7)
    clouds = np.clip(1 - trees, 0, 1)
    # Motion is strongest at the crowns and fades towards rooted foreground trunks.
    crown_weight = np.clip((.96 - rows) / .3, 0, 1)
    moving_trees = trees * crown_weight
    still = np.zeros((height, width), np.uint8)
    alpha = np.array(fruit_image)[:, :, 3]
    fh, fw = alpha.shape
    still[at[1]:at[1]+fh, at[0]:at[0]+fw] = np.maximum(still[at[1]:at[1]+fh, at[0]:at[0]+fw], alpha)
    guard = cv2.GaussianBlur(cv2.dilate(still, np.ones((7, 7), np.uint8)), (5, 5), .8)
    clouds *= 1 - guard / 255
    save(destination / "sunset-scene.png", clean, "Exact painting retained; red disk inpainted locally and replaced with the real orange and photographed citrus leaf. Original birds remain in front.")
    save(destination / "sunset-flight-scene.png", flight_plate, "Same painted scene and real orange; bird ink inpainted locally to supply the background beneath independently flapping wings. Static fallback retains the original birds.")
    save(destination / "sunset-birds.png", atlas, "Individual bird pigments and alpha extracted from the actual painting, unmatted against the reconstructed sky and arranged in padded atlas cells. No new illustration.")
    save(destination / "sunset-birds-motion-mask.png", bird_motion, "Tight original bird bounds plus four vertical pixels protect motion-test samples from wing occlusion; body centers remain anchored.")
    save(destination / "sunset-clouds-mask.png", (clouds * 255).astype(np.uint8), "Painting-derived sky matte excludes the forest and stationary fruit; clouds can flow behind the extracted birds.")
    save(destination / "sunset-trees-mask.png", (moving_trees * 255).astype(np.uint8), "GrabCut follows actual tree silhouettes; crown-weighted wind leaves foreground roots anchored.")
    save(destination / "sunset-still-mask.png", guard, "Actual fruit and leaf alpha, expanded to protect them from displaced sky samples. Birds occupy their own animated layer.")
    save(destination / "sunset-empty-mask.png", np.zeros((height, width), np.uint8), "Empty flower layer; this painting has forest instead of flowers.")
    print(f"Prepared {width} x {height} painting, real orange and aligned wind masks.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("painting", type=Path)
    parser.add_argument("orange_photo", type=Path)
    parser.add_argument("leaf_photo", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    prepare(args.painting, args.orange_photo, args.leaf_photo, args.destination)
