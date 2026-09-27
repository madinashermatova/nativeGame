# 🩸 Meat Runner

Super Meat Boy uslubidagi tezkor platformer o'yin — **sof JavaScript** va **HTML5 Canvas** asosida, hech qanday tashqi framework yoki 
kutubxonasiz yozilgan.


## 🎮 O'yin haqida


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
- 🎨 Original pixel-art uslubidagi qahramon
- 🪚 Aylanadigan arra g'ildiraklari (obstacle)
- 🏭 Background — statik va siljiydigan parallax qatlamlar
- 💀 Tez respawn — o'lim jazolamaydi, darrov qayta urinasiz
- 📈 10 ta mustaqil level, har biri o'z xaritasi va foni bilan

## 📁 Loyiha tuzilmasi

```
nativeGame/
├── index.html
├── assets/
│   └── images/          # player, dushmanlar, arra, background spritelari
└── js/
    ├── main.js           # o'yin loop va level boshqarish
    ├── player.js         # player fizikasi (barcha levellar uchun umumiy)
    ├── levels.js         # level xaritalari va konfiguratsiyasi
    ├── camera.js         # kamera harakati
    ├── render.js         # chizish (rendering)
    ├── input.js           # klaviatura boshqarish
    └── utils.js          # yordamchi funksiyalar
```

## 🚀 Ishga tushirish

Loyiha hech qanday build-tool yoki dependency talab qilmaydi:

```bash
git clone https://github.com/madinashermatova/nativeGame.git
cd nativeGame
```

So'ngra `index.html` faylini brauzerda oching, yoki local server orqali ishga tushiring (ES6 modullar `file://` protokolida ba'zi brauzerlarda ishlamasligi mumkin):

```bash
# Python bilan:
python3 -m http.server 8000

# Node.js bilan (http-server o'rnatilgan bo'lsa):
npx http-server
```
Keyin brauzerda `http://localhost:8000` manzilini oching.

## 🛠️ Yangi level qo'shish

`js/levels.js` faylidagi `levels` massiviga yangi obyekt qo'shing:

```javascript
{
  background: "./assets/images/bg.png",
  playerStart: { x: 50, y: 250 },
  rows: [
    "................................",
    "..####..........................",
    "...............................E",
    "################################",
  ],
}
```

`#` — devor/platforma, `E` — level oxiri (manzil/exit), `.` — bo'sh joy.

## 🗺️ Rejalar

## 📄 Litsenziya

MIT — erkin foydalanish, o'zgartirish va ulashish mumkin.
