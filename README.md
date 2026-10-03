# 🩸 Meat Runner

Super Meat Boy uslubidagi tezkor platformer o'yin — **sof JavaScript** va **HTML5 Canvas** asosida, hech qanday tashqi framework yoki 
kutubxonasiz yozilgan.


## 🎮 O'yin haqida

Qizil jonivor Bandage Girl'ni qutqarish uchun **10 ta levelni** bosib o'tadi: tikanlar, arralar, lava, lazerlar, arvohlar va
nihoyat boss jangi. Har bir level o'z mexanikasi, ovozi va ko'rinishiga ega, ular bir-biriga o'xshamaydi.

**Qoidalar**
- Har bir level **10 jon** bilan boshlanadi. Har o'limda bitta jon ketadi; jon tugasa o'sha level boshidan boshlanadi.
- Dorichalar (bint) va ruhlar **+1 jon** beradi (eng ko'pi 15).
- Checkpointlar o'limdan keyin shu joydan davom ettiradi.
- Vaqtga bog'liq tuzoqlar oldindan ogohlantiradi (miltillash, shiqillash, ovoz), shuning uchun o'yin adolatli.

| # | Level | Qisqacha |
|---|---|---|
| 1 | Birinchi qadam | Quyosh botishi, tikanlar va birinchi sakrashlar |
| 2 | Olov va suv | Oyli o'rmon, olov va suv, arralar, qulaydigan bloklar |
| 3 | Foundry | Zavod: presslar, lazerlar, eritilgan metall |
| 4 | Toxic Waste | Zaharli suv, tomchilar, gaz va ko'tarilayotgan suyuqlik |
| 5 | Industrial | Pastdan tepaga ko'tarilish, bug', elektr, arralar |
| 6 | Arvohlar dahmazi | Qorong'i qabr: skeletlar, ko'rshapalaklar, arvohlar, soya quvuvi |
| 7 | Cho'g'lanma minora | Tepaga chiqish, ko'tarilayotgan lava, olov purkagichlar |
| 8 | Tortish laboratoriyasi | Portallar tortishni teskari qiladi, shiftda yuriladi |
| 9 | Zaharli qo'ziqorinlar | Ortingizdan quvlovchilar zaharli qo'ziqorinda qotib qoladi |
| 10 | Yakuniy qutqaruv | Sinov yo'li va boss jangi, so'ng qizni ozod qilish va tabrik ekrani |


## 🕹️ Boshqaruv

| Tugma | Amal |
|---|---|
| `A` / `←` | Chapga yurish |
| `D` / `→` | O'ngga yurish |
| `W` / `↑` / `Space` | Sakrash |

Boshqaruvda **coyote time** va **jump buffering** kabi "professional feel" mexanikalari qo'llangan — sakrash harakati platformadan
tushib ketgandan keyin ham bir necha millisekund kechikish bilan ishlaydi, bu esa o'yinni ancha "silliq" his qildiradi.

## ✨ Xususiyatlar

- 🏃 Aniq va sezgir platformer fizikasi (acceleration, friction, coyote time, jump buffer)
- 🎨 Qahramon, 1–2 va 6–10-levellar to'liq kodda chiziladi (rasm yo'q); 3–5-levellar WebP atlaslardan foydalanadi
- 🪚 Har xil tuzoqlar: arralar, lazerlar, portallar, qulaydigan platformalar, lava, presslar va boshqalar
- 👾 Dushmanlar: skeletlar, ko'rshapalaklar, arvohlar, quvlovchi mavjudotlar va boss
- 🔊 Hamma ovoz Web Audio bilan sintez qilinadi (audio fayl yo'q); tuzoq va dushmanlar joylashuvga qarab eshitiladi
- 🌫️ Qahramon ortidan chang va tutun chiqadi, har bir level o'z rangida
- 🏭 Parallax fonlar, yorug'lik va qorong'ilik effektlari
- 💀 Tez respawn, checkpointlar, har levelda to'liq jonlar
- 📈 10 ta mustaqil level, oxirida tabrik ekrani (salyut va fanfara)

## 📁 Loyiha tuzilmasi

```
├── index.html, style.css
├── assets/
│   ├── images/            # faqat 3–5-levellar: atlas-l3/l4/l5.webp, l3/l4/l5-bg.webp (generatsiya)
│   └── source/            # 3–5-level asl rasmlari — o'yin ularni to'g'ridan-to'g'ri yuklamaydi
├── tools/
│   ├── sprites.mjs        # qaysi rasmdan qaysi bo'lak (crop) kerakligi
│   └── build-assets.mjs   # source/ → WebP atlaslar + js/atlas-data.js
├── js/
│   ├── main.js            # o'yin sikli, faqat level interfeysi orqali ishlaydi
│   ├── level.js           # loadLevel: xarita, runtime, rasmlarni oldindan yuklash
│   ├── world.js           # tile to'qnashuv to'ri (solid)
│   ├── player.js          # umumiy fizika, o'lim/respawn
│   ├── physics.js, input.js, audio.js, blood.js, transition.js
│   ├── assets.js          # rasmlarni kerak bo'lganda yuklash, atlas sprite'lari
│   ├── gfx.js             # sprite chizish, keshlangan glow/filtr, zarrachalar
│   ├── renderer.js        # o'yinchi, Bandage Girl (finalda), HUD, Game Over
│   ├── hero-art.js        # qahramon: kodda chiziladi, ezilish/cho'zilish, ko'z qisish
│   ├── scenery.js         # 1-level (quyosh botishi) va 2-level (oyli o'rmon) foni, menyu foni
│   ├── menu-art.js        # menyu foni (canvas)
│   ├── ending.js          # g'alaba ekrani: tong, salyut, statistika, fanfara
│   └── levels/
│       ├── index.js       # LEVELS ro'yxati va level modul interfeysi
│       ├── classic*.js    # tile-xaritali levellar (1, 2)
│       ├── foundry*, toxic*, industrial*   # 3, 4, 5-levellar: mantiq / render / audio
│       └── crypt*, cinder*, gravity*, myco*, finale*   # 6–10-levellar (to'liq kodda), synth.js — umumiy ovoz yordamchilari
```

## 🚀 Ishga tushirish

O'yinning o'zi build talab qilmaydi — istalgan statik server yetarli (ES modullar `file://` da ishlamaydi):

```bash
npx http-server        # yoki: python3 -m http.server 8000
```

Faqat 3–5-level rasmlarini qayta yig'ish kerak bo'lsa (`assets/source` yoki `tools/sprites.mjs` o'zgarganda):

```bash
npm install
npm run assets
```

## 🖼️ Rasmlar

Faqat 3–5-levellar rasmdan foydalanadi (qolgan hamma narsa kodda chiziladi). Asl rasmlar `assets/source/` da turadi va o'yinga yuborilmaydi. `npm run assets` ulardan faqat kerakli bo'laklarni kesib oladi.
Har bir bo'lak ekranda eng katta chiziladigan o'lchamining 4 barobaridan oshmaydigan qilib kichraytiriladi
va har bir level uchun bitta WebP atlasga yig'iladi. Har bir level faqat o'z atlasini yuklaydi, keyingi level atlasi esa oldindan yuklab qo'yiladi.
Yangi sprite qo'shish uchun uni `tools/sprites.mjs` ga yozing va `npm run assets` ni ishga tushiring.

## 🛠️ Yangi level qo'shish

Har bir level — `js/levels/index.js` dagi `LEVELS` massivining bitta elementi. Interfeys o'sha faylning boshida tasvirlangan.
Oddiy tile-xaritali level uchun `classic-maps.js` ga xarita qo'shib, uni `LEVELS` ga qo'shing:

```javascript
classicLevel('YANGI LEVEL', MAPS.newMap, 'forest'),   // tema: meadow | forest
```

Xarita belgilari: `#` devor, `B` qulaydigan blok, `P` start, `E` chiqish darvozasi, `C` bint,
`^` `v` tikan, `W` arra, `M` harakatlanuvchi arra, `J` tramplin, `F` olov, `U` suv.

O'ziga xos mexanikali level uchun `defineLevel({...})` bilan `create`, `step`, `damage`, `interact`, `drawWorld` va boshqa
funksiyalarni bering. `main.js` va `player.js` ga tegish shart emas.
