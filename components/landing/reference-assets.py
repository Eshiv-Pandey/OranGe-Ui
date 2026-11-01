"""Rebuild the supplied landscape's clean plate and conservative motion masks.

Usage: python reference-assets.py reference.png public/landing
Requires Pillow, numpy and opencv-python-headless for offline asset preparation.
No image generation service or runtime image processing is used.
"""
from pathlib import Path
import argparse
import sys

local = Path(__file__).resolve().parents[2] / 'out/iteration/landing-python'
if local.exists():
    sys.path.insert(0, str(local))

import cv2
import numpy as np
from PIL import Image, PngImagePlugin


def provenance(path, description):
    return (
        'Origin: Owner-supplied landscape reference for orange UI, 1 November 2026.\n'
        'Source dimensions: 1199 x 805. Original artwork rights remain with its owner.\n'
        'No image generation service was used.\n'
        f'Asset: {path.name}\nProcessing: {description}\n'
        'The exact deterministic processing recipe follows. This is preparation '
        'code, not a generation prompt. Paths in the recipe are project-relative.\n\n'
        + Path(__file__).read_text(encoding='utf-8')
    )


def save(path, array, description):
    info = PngImagePlugin.PngInfo()
    info.add_text('Source', 'User-supplied landing reference image-5.png, 1 November 2026')
    info.add_text('Processing', description)
    # This standard key is recognized by the Impeccable provenance scanner.
    info.add_text('impeccable:prompt', provenance(path, description))
    Image.fromarray(array).save(path, pnginfo=info, optimize=True)


def prepare(source, destination):
    destination.mkdir(parents=True, exist_ok=True)
    image = np.array(Image.open(source).convert('RGB'))
    height, width = image.shape[:2]
    if (width, height) != (1199, 805):
        raise ValueError('This mask recipe is aligned to the 1199 x 805 supplied reference.')

    # Only the baked-in interface is removed. The figure and scene remain photographic.
    erase = np.zeros((height, width), np.uint8)
    cv2.rectangle(erase, (358, 16), (842, 82), 255, -1)
    cv2.rectangle(erase, (726, 534), (879, 590), 255, -1)
    for x1, y1, x2, y2, threshold in [
        (40, 480, 208, 531, 135), (41, 544, 356, 580, 124),
        (725, 628, 1164, 774, 128), (40, 750, 298, 773, 124),
        (383, 750, 510, 773, 124),
    ]:
        crop = image[y1:y2, x1:x2]
        letters = (np.min(crop, axis=2) > threshold).astype(np.uint8) * 255
        letters = cv2.dilate(letters, np.ones((7, 7), np.uint8), iterations=1)
        erase[y1:y2, x1:x2] = np.maximum(erase[y1:y2, x1:x2], letters)
    erase[608:613, :] = 255
    erase[802:, :] = 255
    clean = cv2.inpaint(image, erase, 7, cv2.INPAINT_NS)
    texture_source = clean.copy()

    # Large controls concealed the photograph. Neighboring flower/fog texture
    # is Poisson-blended into those occlusions; this avoids letter-shaped fills
    # and the rectangular streak that ordinary inpainting leaves in a pill.
    def restore_texture(source_box, destination_box):
        nonlocal clean
        sx1,sy1,sx2,sy2 = source_box
        dx1,dy1,dx2,dy2 = destination_box
        patch = cv2.resize(texture_source[sy1:sy2,sx1:sx2], (dx2-dx1,dy2-dy1), interpolation=cv2.INTER_CUBIC)
        matte = np.zeros(patch.shape[:2],np.uint8)
        matte[3:-3,3:-3] = 255
        clean = cv2.seamlessClone(patch,clean,matte,((dx1+dx2)//2,(dy1+dy2)//2),cv2.NORMAL_CLONE)
    restore_texture((368,475,697,583),(32,477,361,585))
    restore_texture((904,532,1057,588),(726,534,879,590))
    restore_texture((40,599,481,747),(727,628,1168,776))
    restore_texture((40,714,514,740),(40,749,514,775))

    # The nav occupied empty distant sky. Restore its low-frequency color field
    # from the clean sky immediately above/below, with the original fine grain.
    x1, x2, y1, y2 = 350, 850, 10, 92
    top = cv2.GaussianBlur(image[2:10, x1:x2].mean(axis=0)[None].astype(np.uint8), (31, 1), 0)[0]
    bottom = cv2.GaussianBlur(image[91:99, x1:x2].mean(axis=0)[None].astype(np.uint8), (31, 1), 0)[0]
    mix = np.linspace(0, 1, y2-y1)[:, None, None]
    sky = top[None] * (1-mix) + bottom[None] * mix
    rng = np.random.default_rng(20261101)
    sky += rng.normal(0, .55, sky.shape[:2])[..., None]
    edge = np.ones((y2-y1, x2-x1), np.float32)
    edge[:8] *= np.linspace(0, 1, 8)[:, None]
    edge[-8:] *= np.linspace(1, 0, 8)[:, None]
    edge[:, :8] *= np.linspace(0, 1, 8)
    edge[:, -8:] *= np.linspace(1, 0, 8)
    clean[y1:y2, x1:x2] = (sky*edge[...,None] + clean[y1:y2,x1:x2]*(1-edge[...,None])).astype(np.uint8)

    # GrabCut follows the actual silhouette. The mask is expanded enough that
    # no displaced sky sample can borrow pixels from the stationary person.
    person = np.zeros((height, width), np.uint8)
    roi = np.ascontiguousarray(image[239:414, 575:651])
    seed = np.full(roi.shape[:2], cv2.GC_BGD, np.uint8)
    seed[5:167, 10:66] = cv2.GC_PR_FGD
    seed[13:36, 29:47] = cv2.GC_FGD
    seed[48:123, 24:48] = cv2.GC_FGD
    seed[124:151, 31:43] = cv2.GC_FGD
    bg, fg = np.zeros((1,65), np.float64), np.zeros((1,65), np.float64)
    cv2.grabCut(roi, seed, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
    silhouette = np.where((seed == cv2.GC_FGD) | (seed == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    person[239:414,575:651] = silhouette
    guard = cv2.dilate(person, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25,25)))
    guard = cv2.GaussianBlur(guard, (9,9), 1.5)

    # The terrain boundary follows the photograph; within it, flower hue and
    # fine luminance choose real flower heads instead of polygon-shaped patches.
    land = np.zeros((height,width), np.uint8)
    cv2.fillPoly(land, [np.array([(0,414),(164,404),(325,397),(450,378),(539,354),
        (580,359),(650,357),(735,367),(797,378),(872,391),(966,396),(1017,417),
        (1080,459),(1140,483),(1198,498),(1198,804),(0,804)])], 255)
    land = cv2.GaussianBlur(land, (21,21), 4)
    rgb = clean.astype(np.float32)/255
    r,g,b = rgb[:,:,0], rgb[:,:,1], rgb[:,:,2]
    purple = np.clip((b-g)*10+.24,0,1) * np.clip((r-g)*15+.45,0,1)
    light = np.clip((np.max(rgb,axis=2)-.11)*5,0,1)
    flowers = purple * light * (land/255) * (1-guard/255)
    flowers = cv2.GaussianBlur(flowers, (5,5), .9)
    # Luminance strengthens displacement at the bright heads and anchors dark stems.
    clouds = (1-land/255) * (1-guard/255)
    clouds[:96] *= np.linspace(.05, .45, 96)[:,None]
    clouds[96:150] *= np.linspace(.45, 1, 54)[:,None]
    clouds = cv2.GaussianBlur(clouds, (9,9), 1.3)
    clouds *= 1-guard/255
    grass = (land/255) * (1-purple) * (1-guard/255)
    grass *= np.clip((g-r)*10+.3,0,1)

    save(destination/'reference-scene.png', clean, 'Photographic base; baked-in interface removed by deterministic inpainting. Figure and landscape retained.')
    save(destination/'reference-flowers-mask.png', (flowers*255).astype(np.uint8), 'Photo-derived purple/luminance flower-head mask; dark stems anchored; person excluded.')
    save(destination/'reference-clouds-mask.png', (clouds*255).astype(np.uint8), 'Sky and cloud motion matte excluding photographed terrain and dilated person silhouette.')
    save(destination/'reference-person-mask.png', guard, 'GrabCut from actual figure pixels with a 12-pixel protective expansion and a 1.5-pixel feather.')
    save(destination/'reference-grass-mask.png', (grass*255).astype(np.uint8), 'Photo-derived green grass mask; person and flower heads excluded.')
    save(destination/'reference-person-silhouette.png', person, 'Unexpanded GrabCut subject matte for verification and future layer exports.')
    print(f'Prepared {width} x {height} aligned scene and masks in {destination}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('reference', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    prepare(args.reference, args.destination)
