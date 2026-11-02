"""Pull the latest Made Possible Facebook Page posts into journal/posts.json.

Run by .github/workflows/journal.yml on a schedule. Needs two repository secrets:
  FB_PAGE_ID     the Facebook Page's numeric ID
  FB_PAGE_TOKEN  a long-lived Page access token (see README, "Journal")

Photos are downloaded into journal/images/ because Facebook's image links expire
after a while — the site only ever points at its own copies.
"""
import io
import json
import os
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request

from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "journal"
IMG_DIR = OUT_DIR / "images"
POSTS_FILE = OUT_DIR / "posts.json"
KEEP = 24          # how many posts the site keeps
MAX_SIDE = 1000    # px, longest side of saved photos

page_id = os.environ.get("FB_PAGE_ID", "").strip()
token = os.environ.get("FB_PAGE_TOKEN", "").strip()
if not page_id or not token:
    sys.exit("FB_PAGE_ID and FB_PAGE_TOKEN must be set (repository secrets).")


def get_json(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


params = urllib.parse.urlencode({
    "fields": "message,created_time,permalink_url,full_picture",
    "limit": 50,
    "access_token": token,
})
try:
    data = get_json(f"https://graph.facebook.com/{page_id}/posts?{params}")
except urllib.error.HTTPError as e:
    detail = e.read().decode("utf-8", "replace")
    sys.exit(f"Facebook API error {e.code}: {detail}")

IMG_DIR.mkdir(parents=True, exist_ok=True)
posts = []
for p in data.get("data", []):
    message = (p.get("message") or "").strip()
    if not message:  # skip photo-only shares, cover-photo changes and the like
        continue
    post_id = p["id"].replace("/", "_")
    image = None
    if p.get("full_picture"):
        name = f"{post_id}.jpg"
        dest = IMG_DIR / name
        if not dest.exists():
            try:
                with urllib.request.urlopen(p["full_picture"], timeout=30) as r:
                    im = ImageOps.exif_transpose(Image.open(io.BytesIO(r.read()))).convert("RGB")
                im.thumbnail((MAX_SIDE, MAX_SIDE))
                im.save(dest, quality=72, optimize=True, progressive=True)
            except Exception as e:  # a missing photo shouldn't stop the whole run
                print(f"Skipped photo for {post_id}: {e}")
                dest = None
        if dest:
            image = f"journal/images/{name}"
    posts.append({
        "id": post_id,
        "date": p["created_time"],
        "text": message,
        "image": image,
        "link": p.get("permalink_url"),
    })
    if len(posts) >= KEEP:
        break

# Tidy away photos for posts that have dropped off the list (or been deleted on Facebook)
keep_imgs = {pathlib.Path(p["image"]).name for p in posts if p["image"]}
for f in IMG_DIR.glob("*.jpg"):
    if f.name not in keep_imgs:
        f.unlink()

POSTS_FILE.write_text(json.dumps(posts, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Saved {len(posts)} posts.")
