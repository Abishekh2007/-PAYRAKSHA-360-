"""Pure-stdlib shield icon generator for PAYRAKSHA 360.
Creates packaging/payraksha.ico with sizes 256, 128, 64, 48, 32, 16.
No Pillow or third-party deps required.
"""
import math
import struct
import zlib
import os
from pathlib import Path


# ─── Colour helpers ─────────────────────────────────────────────────────────

def hex_colour(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


TOP_COLOUR = hex_colour("38bdf8")
BOT_COLOUR = hex_colour("0c4a6e")
OUTLINE_COLOUR = hex_colour("e0f2fe")


def lerp_colour(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


# ─── Geometry ────────────────────────────────────────────────────────────────

def in_shield(x: float, y: float, w: float, h: float) -> float:
    """Returns coverage [0,1] for a single (fractional) pixel inside a shield shape.
    Shield: width=w, height=h, origin top-left.
    Flat top with rounded corners (radius ~8% of width), straight sides to 55% height,
    then a quadratic curve to the bottom centre.
    """
    cx = w / 2
    r = w * 0.08  # corner radius
    split = 0.55  # straight→curve transition

    # Normalised coords
    nx = x / w  # 0..1
    ny = y / h  # 0..1

    # Upper rectangle with rounded corners (flat top)
    if ny <= split:
        # Inside padded rect
        in_rect = (r <= x <= w - r) or (
            (0 <= x < r and r <= y <= h * split) or
            (w - r < x <= w and r <= y <= h * split)
        )
        # Rounded corners at top
        if nx < r / w and ny < r / h:
            dx = x - r
            dy = y - r
            return 1.0 if (dx * dx + dy * dy) <= r * r else 0.0
        if nx > 1 - r / w and ny < r / h:
            dx = x - (w - r)
            dy = y - r
            return 1.0 if (dx * dx + dy * dy) <= r * r else 0.0
        if r / w <= nx <= 1 - r / w or ny >= r / h:
            return 1.0
        return 0.0
    else:
        # Lower triangular/curve region
        # At y = split*h the full width is available; it narrows to a point at (cx, h)
        fy = (ny - split) / (1 - split)  # 0 at split, 1 at bottom
        # Available half-width at this y: linear from w/2 down to 0
        hw = (w / 2) * (1 - fy)
        left = cx - hw
        right = cx + hw
        if left <= x <= right:
            return 1.0
        return 0.0


def shield_coverage_ss(px: int, py: int, size: int, ss: int = 4) -> float:
    """Antialiased shield coverage for pixel (px,py) in an [size x size] canvas."""
    w = size * 0.78
    h = size * 0.88
    ox = (size - w) / 2
    oy = (size - h) / 2 + size * 0.02

    total = 0.0
    for si in range(ss):
        for sj in range(ss):
            sx = px + (si + 0.5) / ss
            sy = py + (sj + 0.5) / ss
            total += in_shield(sx - ox, sy - oy, w, h)
    return total / (ss * ss)


def outline_coverage_ss(px: int, py: int, size: int, thick: float, ss: int = 4) -> float:
    """Coverage of the outline ring (shield - eroded shield)."""
    w = size * 0.78
    h = size * 0.88
    ox = (size - w) / 2
    oy = (size - h) / 2 + size * 0.02

    total = 0.0
    for si in range(ss):
        for sj in range(ss):
            sx = px + (si + 0.5) / ss
            sy = py + (sj + 0.5) / ss
            x = sx - ox
            y = sy - oy
            outer = in_shield(x, y, w, h)
            # Erode by `thick` pixels: shrink the shape
            inner = in_shield(x - thick * (x / w - 0.5) * 2,
                              y - thick * (y / h - 0.5) * 2,
                              w - thick * 2, h - thick * 2) if (outer > 0) else 0.0
            total += max(0.0, outer - inner)
    return min(1.0, total / (ss * ss))


def checkmark_coverage_ss(px: int, py: int, size: int, thick: float, ss: int = 4) -> float:
    """Coverage of a bold checkmark centred in the shield."""
    # Checkmark: two line segments.
    # Start: left arm of tick.  Knee: middle. End: right arm (longer, going up-right).
    scale = size / 256.0
    # Positions as fractions of size
    x1 = size * 0.28
    y1 = size * 0.55
    xk = size * 0.42
    yk = size * 0.70
    x2 = size * 0.72
    y2 = size * 0.38

    def dist_to_seg(px_, py_, ax, ay, bx, by):
        dx = bx - ax
        dy = by - ay
        if dx == 0 and dy == 0:
            return math.hypot(px_ - ax, py_ - ay)
        t = max(0.0, min(1.0, ((px_ - ax) * dx + (py_ - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px_ - (ax + t * dx), py_ - (ay + t * dy))

    total = 0.0
    for si in range(ss):
        for sj in range(ss):
            qx = px + (si + 0.5) / ss
            qy = py + (sj + 0.5) / ss
            d1 = dist_to_seg(qx, qy, x1, y1, xk, yk)
            d2 = dist_to_seg(qx, qy, xk, yk, x2, y2)
            d = min(d1, d2)
            if d < thick:
                total += 1.0
            elif d < thick + 1.0:
                total += thick + 1.0 - d
    return min(1.0, total / (ss * ss))


# ─── PNG encoding ───────────────────────────────────────────────────────────

def _chunk(name: bytes, data: bytes) -> bytes:
    c = struct.pack(">I", len(data)) + name + data
    c += struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)
    return c


def encode_png(pixels: list[list[tuple[int, int, int, int]]], width: int, height: int) -> bytes:
    """Encode RGBA pixels as a minimal PNG."""
    raw_rows = bytearray()
    for row in pixels:
        raw_rows.append(0)  # filter byte
        for r, g, b, a in row:
            raw_rows += bytes([r, g, b, a])

    compressed = zlib.compress(bytes(raw_rows), level=9)

    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat_data = compressed

    out = b"\x89PNG\r\n\x1a\n"
    out += _chunk(b"IHDR", ihdr_data)
    out += _chunk(b"IDAT", idat_data)
    out += _chunk(b"IEND", b"")
    return out


# ─── Render one size ─────────────────────────────────────────────────────────

def render_icon(size: int) -> bytes:
    thick_outline = max(1, size * 0.025)
    thick_check = max(1.5, size * 0.06)
    ss = 4

    pixels = []
    for py in range(size):
        row = []
        for px in range(size):
            cov = shield_coverage_ss(px, py, size, ss)
            if cov <= 0.0:
                row.append((0, 0, 0, 0))
                continue

            # Gradient colour based on y
            t = py / max(1, size - 1)
            grad = lerp_colour(TOP_COLOUR, BOT_COLOUR, t)

            # Outline
            out_cov = outline_coverage_ss(px, py, size, thick_outline, ss)
            if out_cov > 0.0:
                gr = int(grad[0] * (1 - out_cov) + OUTLINE_COLOUR[0] * out_cov)
                gg = int(grad[1] * (1 - out_cov) + OUTLINE_COLOUR[1] * out_cov)
                gb = int(grad[2] * (1 - out_cov) + OUTLINE_COLOUR[2] * out_cov)
                grad = (gr, gg, gb)

            # Checkmark (white)
            ck_cov = checkmark_coverage_ss(px, py, size, thick_check, ss)
            if ck_cov > 0.0:
                gr = int(grad[0] * (1 - ck_cov) + 255 * ck_cov)
                gg = int(grad[1] * (1 - ck_cov) + 255 * ck_cov)
                gb = int(grad[2] * (1 - ck_cov) + 255 * ck_cov)
                grad = (gr, gg, gb)

            alpha = int(cov * 255)
            row.append((grad[0], grad[1], grad[2], alpha))
        pixels.append(row)

    return encode_png(pixels, size, size)


# ─── ICO container ───────────────────────────────────────────────────────────

def build_ico(sizes: list[int]) -> bytes:
    images = [(s, render_icon(s)) for s in sizes]

    header = struct.pack("<HHH", 0, 1, len(images))
    # Each entry: width(1), height(1), colorcount(1), reserved(1), planes(2), bitcount(2), size(4), offset(4)
    entry_size = 16
    data_offset = len(header) + entry_size * len(images)

    entries = b""
    blobs = b""
    cur_offset = data_offset
    for size, png_data in images:
        w = 0 if size == 256 else size
        h = 0 if size == 256 else size
        entries += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(png_data), cur_offset)
        blobs += png_data
        cur_offset += len(png_data)

    return header + entries + blobs


def main():
    out_path = Path(__file__).parent / "payraksha.ico"
    sizes = [256, 128, 64, 48, 32, 16]
    print(f"Rendering {sizes} ...")
    ico = build_ico(sizes)
    out_path.write_bytes(ico)
    print(f"Written {out_path} ({len(ico):,} bytes)")


if __name__ == "__main__":
    main()
