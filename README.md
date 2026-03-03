# 🔮 Size Oracle — Universal Size Advisor

**Privacy-first Chrome extension that recommends your clothing size on 100+ shopping sites. All processing happens locally — your measurements never leave your device.**

![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/License-Non--Commercial-red?style=flat-square)

---

## Features

- **Smart Size Recommendations** — Automatically detects size charts and matches to your measurements
- **Numeric & Letter Size Support** — Shows size numbers (0, 2, 4, 6...) on sites like H&M and Zara, letters (S, M, L) everywhere else — automatically
- **Multi-Profile Support** — Save profiles for yourself, partner, kids — switch instantly
- **Body Shape Analysis** — Personalized recommendations based on your proportions (hourglass, pear, apple, athletic)
- **Multi-Measurement Matching** — Chest, waist, hips, inseam, and shoe size with weighted scoring
- **Fit Preference** — Fitted, Regular, or Relaxed — adjusts recommendations accordingly
- **100% Private** — All data stored locally. Zero network requests. Zero tracking.

## How It Works

### On the Page
- **Price Badge** — Confidence score for the **currently selected size** appears right below the product price
- **Floating Button (FAB)** — Bottom-right corner always shows your **best matching size** with highest confidence (stays fixed regardless of what size you select)
- Sites using number sizes (H&M, Zara bottoms, Gap, Levi's, etc.) automatically show numeric recommendations instead of letters

### In the Popup
- Click the extension icon or FAB to open the **measurement dashboard**
- Enter body measurements (chest, waist, hips, inseam) and shoe size
- Switch between profiles, units (inches/cm), gender, and fit preference

## Numeric Size Intelligence

Size Oracle automatically detects whether a site uses letter sizes (S, M, L) or numeric sizes (0, 2, 4, 6...) and displays the recommendation in the format the site actually uses:

| Site | Size Format | Example Output |
|------|------------|----------------|
| Amazon | Letters | `M (85%)` |
| Nike | Letters | `L (92%)` |
| H&M | US Numbers | `8-10 (77%)` |
| Zara (bottoms) | EU Numbers | `40-42 (81%)` |
| Levi's | US Numbers | `32-34 (88%)` |
| Gap (bottoms) | US Numbers | `8-10 (77%)` |

No configuration needed — it just works.

## Supported Sites (100+)

**Major E-commerce:** Amazon, SHEIN, Temu, AliExpress, eBay, Walmart, Target, Etsy  
**Fast Fashion:** Zara, H&M, Uniqlo, Forever 21, Mango, Pull & Bear, Bershka  
**Department Stores:** Nordstrom, Macy's, Bloomingdale's, JCPenney, Kohl's  
**Athletic:** Nike, Adidas, Under Armour, Lululemon, Gymshark, Fabletics  
**Casual:** Levi's, Gap, Old Navy, American Eagle, Abercrombie, Express  
**Premium:** SSENSE, Farfetch, Net-A-Porter, Revolve, Shopbop  
**Luxury:** Gucci, Louis Vuitton, Prada, Burberry, Balenciaga  
**Plus Size:** Torrid, Lane Bryant, Eloquii  
**Shoes:** Zappos, DSW, Foot Locker, Steve Madden  

## Installation

1. Clone or download this repository
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top-right)
4. Click **Load unpacked** → select the `Size-Oracle/` folder

## Scoring Algorithm

Uses a **difference-from-median** scoring system with weighted measurements:

| Measurement | Weight |
|-------------|--------|
| Chest | 40% |
| Waist | 35% |
| Hips | 20% |
| Inseam | 5% |

Confidence is calibrated so that a perfect match scores ~98%, and ±2 inches from median scores ~40%.

## Privacy

Your measurements are stored in `chrome.storage.local` and never transmitted anywhere. No analytics, no tracking, no external API calls. See [PRIVACY.md](PRIVACY.md).

## Tech Stack

- Chrome Extension (Manifest V3)
- Vanilla JavaScript (zero dependencies)
- Chrome Storage API for local persistence
- DOM mutation observers for real-time size detection

---

## Attribution

- [Measuring-tape icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/measuring-tape)

---

**Built by [Varun Meda](https://github.com/VMaroon95)** — making online shopping stress-free, one size at a time.
