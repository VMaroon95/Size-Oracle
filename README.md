# 🔮 Size-Oracle — Universal Size Advisor

> A privacy-first Chrome extension that recommends your clothing size on major shopping sites — all processing happens locally on your device.

<!-- ![Size-Oracle Logo](icons/icon128.png) -->

## Features

- **🔮 Smart Size Recommendations** — Automatically detects size charts and matches them to your measurements
- **📏 Multi-Measurement Matching** — Compares chest, waist, hips, and inseam with weighted scoring
- **🌐 Multi-Site Support** — Works on Zara, H&M, ASOS, Nordstrom, Gap, Uniqlo, and more
- **🔒 100% Private** — All data stored locally in your browser. Zero network requests. Zero tracking.
- **📐 Unit Conversion** — Seamlessly switch between inches and centimeters
- **🎯 Confidence Scoring** — See exactly how well each size matches with per-measurement breakdowns
- **✨ Non-Intrusive UI** — Floating badge near the "Add to Cart" button, expandable for details

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select the `size-oracle/` folder
5. Add your icon files to the `icons/` folder (16, 48, 128px PNGs)

## How It Works

1. **Save Your Profile** — Click the extension icon and enter your measurements (chest, waist, hips, inseam)
2. **Shop Normally** — Browse any supported clothing site
3. **Get Recommendations** — Size-Oracle automatically detects size charts and shows a floating badge with your recommended size
4. **View Details** — Click the badge to see confidence scores and per-measurement fit breakdown

### Scoring System

| Fit Level | Condition | Score |
|-----------|-----------|-------|
| Perfect | Within size range | 100% |
| Close | Within 1 inch | 80% |
| Acceptable | Within 2 inches | 60% |
| Poor | More than 2 inches off | 20% |

Measurements are weighted: Waist (35%), Chest (30%), Hips (25%), Inseam (10%).

## Supported Sites

- Zara (`zara.com`)
- H&M (`hm.com`)
- ASOS (`asos.com`)
- Nordstrom (`nordstrom.com`)
- Gap (`gap.com`)
- Uniqlo (`uniqlo.com`)

Generic size chart detection also works on many other sites.

## Privacy

**Size-Oracle collects zero data.** Your measurements are stored in `chrome.storage.local` on your device and never transmitted anywhere. There are no analytics, no tracking, no external API calls. See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Screenshots

<!-- Add screenshots here -->
<!-- ![Popup](screenshots/popup.png) -->
<!-- ![Badge](screenshots/badge.png) -->
<!-- ![Panel](screenshots/panel.png) -->

## Tech Stack

- Manifest V3 Chrome Extension
- Vanilla JavaScript (no dependencies)
- Modern JS (async/await, optional chaining)
- Chrome Storage API

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[MIT License](LICENSE)

---

Built by **Varun Meda**
