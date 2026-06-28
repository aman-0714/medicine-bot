# MediScan — AI Health Guardian

Your personal health profile + allergen scanner, built with React Native (Expo).

## What it does

- Stores your health profile securely on-device (blood group, allergies, medications, conditions, emergency contacts)
- Scans food labels, medicine boxes, and menus using your camera + Claude AI
- Instantly warns you if anything matches your allergy or medication profile
- Shows a QR emergency card that first responders can scan, without exposing insurance details

## Setup

This project has two parts: the **app** (React Native / Expo) and a small **server** (Express) that talks to the Anthropic API. The server exists so your API key never ships inside the app — keys embedded in client code can be extracted from a compiled app.

### 1. Start the server

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and add your real key from https://console.anthropic.com:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Then run it:

```bash
npm start
```

You should see `✅ medicine_bot server running on http://localhost:3000`. Leave this running.

### 2. Point the app at the server

Open `src/screens/ScanScreen.js` and check the `SCAN_API_URL` constant near the top:

- **iOS simulator** → `http://localhost:3000` (default, no change needed)
- **Android emulator** → `http://10.0.2.2:3000`
- **Physical phone via Expo Go** → your computer's LAN IP, e.g. `http://192.168.1.50:3000` (phone and computer must be on the same Wi-Fi). Find your IP with `ipconfig getifaddr en0` on Mac.

### 3. Install and run the app

```bash
cd ..        # back to medicine_bot/ root
npm install
npx expo start
```

Scan the QR code in your terminal with the Expo Go app on your phone.

The first time you open the Scan tab, you'll be asked for camera permission — this is configured in `app.json`.

## Project structure

```
medicine_bot/
├── App.js                          # Navigation + tab bar
├── index.js                        # Expo entry point
├── app.json                        # Expo config (camera permission strings, etc.)
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js           # Dashboard with quick actions
│   │   ├── ProfileScreen.js        # Health profile editor
│   │   ├── ScanScreen.js           # Camera + AI allergen scanner
│   │   └── EmergencyScreen.js      # QR emergency card
│   ├── components/
│   │   ├── TagInput.js             # Add/remove tag lists
│   │   └── AlertCard.js            # Danger / warning / safe cards
│   ├── storage/
│   │   └── profileStorage.js       # Encrypted SecureStore wrapper
│   └── utils/
│       └── allergenChecker.js      # Keyword-based allergen matching
├── server/
│   ├── index.js                    # Express server, holds the API key
│   ├── package.json
│   └── .env.example                # Copy to .env and fill in your key
```

## Phase roadmap

- [x] Phase 1 — Health profile (encrypted on-device storage)
- [x] Phase 2 — Camera + AI label scanning
- [x] Phase 3 — Emergency QR card
- [ ] Phase 4 — Medication reminders, pollen alerts
- [ ] Phase 5 — Smart glasses Bluetooth integration

## Known limitations

- **Allergen matching is keyword-based, not medical-grade.** It will miss alternate ingredient names, translated labels, and indirect warnings like "may contain traces of." A disclaimer is shown on every scan result for this reason — don't remove it.
- **NFC emergency access (from the original concept) isn't implemented.** The npm package `expo-nfc` is an abandoned placeholder (no real functionality), and the working alternative, `react-native-nfc-manager`, requires ejecting from Expo Go into a custom native build. The QR code in the Emergency tab covers the same use case for now.
- **The `/scan` server route has no rate limiting or auth.** Fine for local testing. Before deploying it anywhere public, add at minimum a rate limiter (e.g. `express-rate-limit`) so a leaked server URL can't be used to burn through your API quota.
