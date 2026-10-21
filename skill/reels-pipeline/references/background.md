# Замена фона (background replacement)

Работает через `@remotion/video-matting` (`npx remotion add @remotion/video-matting`): человек отделяется в прозрачный VP9 WebM, между ним и новым фоном кладём что угодно.

## Как получить слой с человеком
1. Исходник из мессенджера (Telegram и т. п.) — VFR: сначала `ffmpeg -i in.mp4 -vf fps=30 -fps_mode cfr -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 192k src-cfr.mp4`, иначе рендер падает с «No frame found at position…». Лучше — оригинал с телефона.
2. Положить клип в `public/…`, сделать композицию с `<Video name="…" src=…>`, открыть в Studio → выделить слой → Inspector → **Remove background** → модель → Remove. Studio запишет `<имя>-no-background.webm` в корень `public/` и **подменит src в коде** — перенести файл в нужную папку и вернуть src.
   - Node-путь (`scripts/remove-bg.mts`, `separateVideoLayers`) на встроенной Intel UHD падал с `0xC000001D` (illegal instruction в нативном ONNX/WebGPU) — на таких машинах использовать Studio (WebGPU браузера). На машинах с нормальной GPU скрипт удобнее (batch).
3. Привести результат к CFR с сохранением альфы: `ffmpeg -c:v libvpx-vp9 -i fg.webm -vf fps=30 -fps_mode cfr -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 18 -row-mt 1 -an fg-cfr.webm` (декодер `-c:v libvpx-vp9` перед `-i` обязателен, иначе альфа теряется).

## Какая модель
| Модель | Размер | Скорость (Intel UHD, 720p) | Качество |
|---|---|---|---|
| `modnet` | 26 МБ | ~1,3 кадр/с (10 с видео ≈ 4 мин) | волосы хорошо; **белые принты/светлые пятна на одежде принимает за фон — дыры** |
| `ben2-base` | 219 МБ | ~0,1 кадр/с (10 с ≈ 50 мин) | дыр нет, края естественнее; для целого ролика на слабой машине непрактично |

Проверка качества: наложить кадры на ярко-розовый (`color=c=0xff00cc`) — дыры и ореолы видны сразу. Советовать пользователю: однотонная одежда без белых принтов; для частой замены фона — хромакей.

## Варианты (компонент `components/BgVariants.tsx`, `BgVariantScene variant=…`)
`original`, `blur` (боке; лёгкий двойной контур, т.к. размывается оригинал с человеком), `spotlight` (фон ч/б и темнее), `solid`, `gradient` (живой), `painting` (картина/фото с наездом), `text-behind` (крупный текст за головой — сильный рилс-приём), `rays` (графика за спиной), `outline` (человек-стикер с белой обводкой), `parallax` (фон едет, человек приближается), `duotone`, `swap` (смена фона по ходу, например на склейках). `BgShowcase` — витрина всех по 2 с.
Для фильтров (blur, обводка) использовать `OffthreadVideo` (`transparent` для альфы) — на `@remotion/media <Video>` CSS-фильтры в рендере не применялись.
