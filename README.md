# 🩸 Runner

Super Meat Boy uslubidagi tezkor platformer o'yin — **sof JavaScript** va **HTML5 Canvas** asosida, hech qanday tashqi framework yoki kutubxonasiz yozilgan.

## 🎮 O'yin haqida

Qahramon 10 ta levelni bosib o'tib, oxirida qamalgan Bandage Girl'ni qutqarishi kerak. Yo'lda arralar, tikanlar, lazerlar, olov va suv oqimlari, qulovchi bloklar va dushmanlar to'siq bo'ladi. O'lim jazolamaydi — darrov qayta urinasiz, lekin jonlar soni cheklangan.

- ❤️ **10 ta jon** bilan boshlanadi. Har o'limda bittadan kamayadi.
- 💀 Jonlar tugasa **Game Over** — o'yin 1-leveldan qayta boshlanadi (`Enter` bosing).
- 🪙 Levellarda tangalar (`C`) yig'ish mumkin, oxirida statistika ko'rsatiladi.
- 🏁 Oxirgi levelda Bandage Girl'ga yetsangiz o'yin yutiladi.

## 🕹️ Boshqaruv

| Tugma | Amal |
|---|---|
| `A` / `←` | Chapga yurish |
| `D` / `→` | O'ngga yurish |
| `W` / `↑` / `Space` | Sakrash |
| `Esc` | Menyuga qaytish |
| `Enter` | Game Over / g'alabadan keyin qayta boshlash |

Devorga yopishib turganda sakrab, devordan sakrash (wall jump) mumkin; devorda sirpanish sekinlashadi. Boshqaruvda **coyote time** va **jump buffering** qo'llangan — platformadan tushib ketgandan keyin ham sakrash biroz vaqt ishlaydi, sakrash tugmasi yerga tegishdan sal oldin bosilsa ham ishlaydi. Sakrash tugmasini erta qo'yib yuborsangiz sakrash pastroq bo'ladi.

## 🗺️ Levellar

| № | Nomi | Mexanika |
|---|---|---|
| 1 | Birinchi qadam | Tikanlar, tangalar, oddiy sakrash |
| 2 | Tikanlar va tramplin | Tramplinlar, qulovchi bloklar, olov/suv, aylanadigan arra, dushman |
| 3 | Devorga sakrash | Quyma sexi: pressalar, eritilgan metall, bug', lazer, harakatlanuvchi arra, checkpointlar, o'z audio va effektlari |
| 4 | Zanglagan arra | Zaharli chiqindi: kislota, gaz, tomchilar, ko'tarilib kelayotgan suyuqlik, qulovchi platformalar, checkpointlar |
| 5 | Qulovchi ko'prik | Qulovchi bloklar ustida tikanlar ustidan o'tish |
| 6 | Harakatlanuvchi arra | Oldinga-orqaga yuruvchi arralar |
| 7 | Tor yo'laklar | Aniq sakrashni talab qiladigan tor o'tishlar |
| 8 | Qizil zavod | Arralar, lazerlar va tuzoqlar aralashmasi |
| 9 | Chaqqonlik sinovi | Aniqlik va tezlik sinovi |
| 10 | Yakuniy qutqaruv | Oxirgi sinov va Bandage Girl'ni qutqarish |

3- va 4-levellar alohida modullarda (`foundry*.js`, `toxic*.js`) yozilgan, ularning rejasi `docs/` papkasida: [LEVEL3](docs/LEVEL3.md), [LEVEL4](docs/LEVEL4.md).

## ✨ Xususiyatlar

- 🏃 Aniq va sezgir platformer fizikasi (tezlanish, ishqalanish, coyote time, jump buffer)
- 🧗 Devordan sakrash va devorda sirpanish
- 🦘 Tramplinlar, qulovchi bloklar, checkpointlar
- 🪚 Aylanadigan va harakatlanuvchi arralar, tikanlar, lazerlar, olov va suv oqimlari
- 🩸 Qon zarrachalari — o'limda va yugurganda
- 🔊 Web Audio orqali yaratilgan ovozlar (tashqi audio fayllarsiz)
- 🏭 Parallax fonlar, har bir level o'z fon va uslubi bilan
- 💀 Tez respawn — o'lim jazolamaydi, darrov qayta urinasiz

## 📁 Loyiha tuzilmasi

```
nativeGame/
├── index.html            # menyu va canvas
├── style.css
├── assets/images/        # player, fonlar, 3- va 4-level spritelari
├── artifacts/            # 3- va 4-level skrinshotlari
├── docs/                 # LEVEL3.md, LEVEL4.md — level rejalari
├── tests/                # 3- va 4-level testlari
└── js/
    ├── main.js           # o'yin sikli (60 Hz fixed-step), level almashtirish
    ├── config.js         # fizika konstantalari, boshlang'ich jonlar
    ├── state.js          # umumiy o'yin holati
    ├── level.js          # level xaritalari va yuklash
    ├── player.js         # player fizikasi, o'lim, respawn
    ├── physics.js        # to'qnashuvlar
    ├── enemy.js          # dushmanlar, arralar, tuzoqlar
    ├── traps.js          # lazer logikasi
    ├── input.js          # klaviatura
    ├── audio.js          # umumiy ovozlar
    ├── renderer.js       # chizish (fon, dunyo, HUD, overlay)
    ├── assets.js         # rasmlarni yuklash
    ├── foundry*.js       # 3-level: mexanika, renderer, audio
    ├── toxic*.js         # 4-level: mexanika, renderer, audio
    └── utils.js
```

## 🚀 Ishga tushirish

Loyiha o'yin uchun hech qanday build-tool yoki dependency talab qilmaydi:

```bash
git clone https://github.com/madinashermatova/nativeGame.git
cd nativeGame
```

ES6 modullar `file://` protokolida ishlamaydi, shuning uchun local server kerak:

```bash
# Python bilan:
python3 -m http.server 8000

# Node.js bilan:
npx http-server
```

Keyin brauzerda `http://localhost:8000` manzilini oching va **Boshlash** tugmasini bosing.

## 🧪 Testlar

3- va 4-level mantig'i uchun Node testlari bor (Node 18+):

```bash
node --test tests/foundry.test.mjs tests/toxic.test.mjs
```

`tests/*.cjs` fayllari brauzerda (Playwright bilan) tekshirish uchun yordamchi skriptlar.

## 🛠️ Yangi level qo'shish

`js/level.js` dagi `levels` massiviga qatorlar ro'yxatini qo'shing. Har bir belgi bitta 16×16 katak:

| Belgi | Ma'nosi |
|---|---|
| `#` | Devor / platforma |
| `.` | Bo'sh joy |
| `P` | O'yinchi boshlanish nuqtasi |
| `G` | Level oxiri (Bandage Girl / chiqish) |
| `C` | Tanga |
| `^` `v` `<` `>` | Tikanlar (yo'nalishi bilan) |
| `B` | Qulovchi blok |
| `J` | Tramplin |
| `W` | Joyida aylanadigan arra |
| `M` | Harakatlanuvchi arra |
| `F` / `U` | Olov / suv oqimi (vaqt bilan yonib-o'chadi) |
| `L` | Lazer |
| `K` | Checkpoint |
| `E` | Dushman |

Misol:

```javascript
[
  "#..............................#",
  "#..............................#",
  "#..P......C..............G.....#",
  "################^^^^############",
  "################################",
]
```

<<<<<<< HEAD
`#` — devor/platforma, `E` — level oxiri (manzil/exit), `.` — bo'sh joy.


=======
Level qo'shilgach, oxirgi levelni tugatish avtomatik g'alaba ekranini ko'rsatadi.
>>>>>>> 7c59e97 (readme qo'shildi)
