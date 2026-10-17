# Example: «Франкенштейн написали на спор» (1:34, 1080×1920)

A talking-head phone video (iPhone, 4K H.264), cut to the on-topic part, cropped to 9:16, with phrase-level captions and ~20 graphic beats. The original footage, transcript and the film clip are **not** in the repo — only the structure, so you can reuse the components.

## Scenes (reel time → component)

| Time | Phrase | Component | Notes |
|---|---|---|---|
| 0:00 | «А вы знали… на спор?» | `Sticker` (Frankenstein 1831 frontispiece) + `ReelCaptions emphasize` | the punch phrase is a yellow-marker caption, not a stamp |
| 0:04 | «1816 год… год без лета» | `YearWithoutSummer` | user: "a bit cheap" — better idea: frost + calendar |
| 0:09 | «извергается вулкан… пепел… катаклизм» | `Cataclysm` (full screen) | volcano → ash blackout → Pompeii, growing shake; liked a lot |
| 0:15 | «температура в июле… ниже нуля» | `Frost` | must stay subtle and creep in over ~2.4 s |
| 0:20 | «нечего делать» | `MonocleGuy mood="bored"` | the recurring meme character |
| 0:23 | «Байрон» / «Джоном Полидори» | `Sticker` portraits | portraits appear on first mention |
| 0:37 | «чета Шелли, Перси и Мэри» | `Sticker` ×2 | |
| 0:42 | «компашка сидит у Байрона, скучает» | `VillaRain` (full screen) | «Вилла Диодати, 1816. День 47-й. Дождь.» |
| 0:47 | «предлагает собравшимся пари» | `BetZoom` (full screen) + vine boom | crash zoom + «Ставки!» |
| 0:50 / 0:54 | «страшилку» / «кто победил» | `Ghost`, `Trophy` | |
| 0:58 | «Байрон мухлевал» | `ByronCool` | pixel "deal with it" glasses |
| 1:05 | «оказался не самым крутым» | `FreezeFrame` + record scratch | «Это Байрон. Он ещё не знает, что проиграет.» |
| 1:08 | «Мэри Шелли написала» | `MaryWinner` (full screen) | sarcastic bubble «Мальчики, ну вы там как, дописали?», confetti |
| 1:17 | «рассказ „Вампир“» | `VampyreBook` | the real 1819 title page is unreadable at sticker size |
| 1:20 | «первый прецедент» | `MonocleGuy mood="shocked"` | «А что, так можно было?» |
| 1:22 | «не упырём из сказок» | `VampireShadow` (full screen) | Orlok shadow, silent-film flicker |
| 1:26 | «аристократом… сексуальным» | `DraculaSlot` (full screen) | user-supplied clip from *Bram Stoker's Dracula* (1992), mirrored + warm grade, muted — copyrighted, not included |
| 1:32 | «Вот такое пари» | `Scoreboard` | Mary ★, Polidori ★, Byron ✗ |

## Images used (Wikimedia Commons)

Download into the project's `public/graphics/` (ask the user first; check each licence on its Commons page):

```bash
dl() { curl -sfL -A "reels-pipeline/1.0" "https://commons.wikimedia.org/w/thumb.php?f=$(node -e 'console.log(encodeURIComponent(process.argv[1]))' "$1")&w=$3" -o "public/graphics/$2"; }
dl Frontispiece_to_Frankenstein_1831.jpg frankenstein-1831.jpg 800
dl Vesuv_Volaire.jpg vesuvius-volaire-large.jpg 2200
dl "Karl_Briullov,_The_Last_Day_of_Pompeii_(1827–1833)_(cropped).jpg" pompeii-bryullov-large.jpg 2200
dl Byron_1813_by_Phillips.jpg byron.jpg 800
dl Lord_Byron_by_Thomas_Phillips.jpg byron-large.jpg 1600
dl John_William_Polidori_by_F.G._Gainsford.jpg polidori.jpg 800
dl Percy_Bysshe_Shelley_by_Alfred_Clint.jpg percy-shelley.jpg 800
dl RothwellMaryShelley.jpg mary-shelley-large.jpg 1600
curl -sfL "https://upload.wikimedia.org/wikipedia/commons/2/25/Nosferatu_Orlok_shadow_silhouette.svg" -o public/graphics/orlok-shadow.svg
# engraving shimmers when downscaled → pre-scale:
ffmpeg -i public/graphics/frankenstein-1831.jpg -vf "scale=600:-1:flags=lanczos" -q:v 2 public/graphics/frankenstein-1831-sticker.jpg
```

Component positions assume the narrator is centred and the bottom third (y ≥ 1280) is free for small overlays; captions sit at `top: 1060`.
