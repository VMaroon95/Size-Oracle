# 🔮 Size-Oracle — Universal Size Advisor v2.0

> A privacy-first Chrome extension that recommends your clothing size on major shopping sites — all processing happens locally on your device.

<!-- ![Size-Oracle Logo](icons/icon128.png) -->

## ✨ What's New in v2.0

### 🌟 Glassmorphism UI Overhaul
- **Modern Design** — Sleek semi-transparent interface with blur effects
- **Dynamic Fit Visualization** — Interactive sliders showing where your measurements sit within size ranges
- **Confidence Ring** — Color-coded confidence indicator with hover explanations (Green: 90%+, Yellow: 70-89%, Red: <70%)

### 🧠 Smart Fit Intelligence
- **Auto-Detection** — Automatically scans e-commerce pages for size charts and tables
- **Contextual Fit Descriptions** — "Snug Fit", "Perfect Fit", "Roomy Fit" based on your exact position in size ranges
- **Body Shape Analysis** — Personalized recommendations based on your proportions

### 👥 Multi-Profile Support
- **Multiple Users** — Save profiles for "Self", "Partner", or custom profiles
- **Quick Switching** — Seamlessly switch between profiles for different people
- **Individual Preferences** — Each profile maintains its own fit preferences and measurements

## Features

### Core Functionality
- **🔮 Smart Size Recommendations** — Automatically detects size charts and matches them to your measurements
- **📏 Multi-Measurement Matching** — Compares chest, waist, hips, and inseam with weighted scoring
- **🌐 Universal Support** — Works on 100+ shopping sites including Amazon, Zara, H&M, ASOS, SHEIN, Nike, and more
- **🔒 100% Private** — All data stored locally in your browser. Zero network requests. Zero tracking.

### Advanced Features
- **📐 Unit Conversion** — Seamlessly switch between inches and centimeters
- **🎯 Enhanced Confidence Scoring** — See exactly how well each size matches with detailed breakdowns
- **💡 Smart Recommendations** — Body shape-aware suggestions and fit preference guidance
- **📊 Visual Fit Mapping** — See exactly where your measurements fall within size ranges
- **🔄 Auto-Save** — Measurements automatically save as you type

### User Experience
- **✨ Glassmorphism Design** — Modern, elegant interface with purple crystal ball branding
- **🎪 Non-Intrusive UI** — Floating confidence indicator and expandable details
- **👤 Profile Management** — Add, rename, and delete multiple user profiles
- **📈 Recommendation History** — Track your past size recommendations

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select the `Size-Oracle/` folder
5. The extension icon should appear in your toolbar

## How It Works

### 1. Set Up Your Profile(s)
- Click the Size-Oracle extension icon
- Choose a profile (Self, Partner, or create custom)
- Enter your measurements: chest, waist, hips, inseam, height, shoe size
- Select your preferred fit (Fitted, Regular, Relaxed)

### 2. Shop with Confidence
- Browse any supported clothing site
- Size-Oracle automatically detects size information
- View your confidence ring showing prediction accuracy
- See dynamic fit visualizations for each measurement

### 3. Get Smart Recommendations
- Receive contextual fit descriptions (Snug, Perfect, Roomy)
- Get body shape-specific advice
- View detailed breakdowns of why each size was recommended

### Enhanced Scoring System

| Fit Level | Description | Visual Indicator |
|-----------|-------------|------------------|
| Perfect Fit | Within optimal range | ✅ Green confidence ring |
| Snug Fit | Lower end of size range | 🟡 Yellow with "Snug" label |
| Roomy Fit | Upper end of size range | 🔵 Blue with "Roomy" label |
| Size Up | Below size range | ⚠️ Orange warning |
| Size Down | Above size range | ⚠️ Orange warning |

### Body Shape Intelligence
Size-Oracle analyzes your measurements to provide shape-specific advice:
- **Hourglass**: Balanced proportions, most fits work well
- **Pear**: Hip-focused sizing with waist considerations
- **Apple**: Chest/waist focused recommendations
- **Athletic**: Slightly relaxed fits preferred
- **Rectangle**: Proportional sizing across measurements

## Supported Sites (100+)

### Major E-commerce
- **Amazon** (`amazon.com`, `amazon.co.uk`, etc.)
- **SHEIN** (`shein.com`)
- **Temu** (`temu.com`)
- **AliExpress** (`aliexpress.com`)
- **eBay** (`ebay.com`)

### Fast Fashion
- **Zara** (`zara.com`)
- **H&M** (`hm.com`)
- **Uniqlo** (`uniqlo.com`)
- **Forever 21** (`forever21.com`)
- **Pull & Bear** (`pull-and-bear.com`)

### Department Stores
- **Nordstrom** (`nordstrom.com`)
- **Macy's** (`macys.com`)
- **Target** (`target.com`)
- **Walmart** (`walmart.com`)

### Athletic Brands
- **Nike** (`nike.com`)
- **Adidas** (`adidas.com`)
- **Under Armour** (`underarmour.com`)
- **Lululemon** (`lululemon.com`)

### Premium & Luxury
- **SSENSE** (`ssense.com`)
- **Farfetch** (`farfetch.com`)
- **Net-A-Porter** (`net-a-porter.com`)

*And 80+ more sites with universal size chart detection*

## Privacy

**Size-Oracle v2.0 remains 100% private.** Your measurements are stored in `chrome.storage.local` on your device and never transmitted anywhere. The new auto-detection features work entirely client-side. There are no analytics, no tracking, no external API calls. See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Tech Stack

- **Manifest V3** Chrome Extension
- **Vanilla JavaScript** (no dependencies)
- **Modern CSS** with glassmorphism effects
- **Chrome Storage API** for local data persistence
- **Advanced DOM parsing** for universal size detection

## v2.0 Technical Improvements

### Enhanced Auto-Detection
- **Multi-strategy scanning** — Tables, modals, JSON-LD, known patterns
- **Smart keyword matching** — Detects size information in any language
- **Dynamic content handling** — Works with SPAs and lazy-loaded content

### Improved Performance
- **Efficient caching** — Size charts cached for faster subsequent visits
- **Background processing** — Non-blocking size detection
- **Memory optimization** — Minimal resource usage

### Code Architecture
- **Modular design** — Separated concerns for UI, detection, and matching
- **Error resilience** — Graceful degradation on unsupported sites
- **Extensible patterns** — Easy to add new site support

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

### Development Setup
1. Fork the repository
2. Make your changes
3. Test on multiple supported sites
4. Ensure all functionality works
5. Submit a pull request

## Changelog

### v2.0.0 (Latest)
- ✨ **UI/UX Overhaul**: Glassmorphism design with dynamic fit visualization
- 🧠 **Smart Mapping**: Enhanced fit descriptions and body shape analysis
- 👥 **Multi-Profile Support**: Multiple user profiles with quick switching
- 🔍 **Auto-Detection**: Automatic size chart scanning and detection
- 📊 **Visual Indicators**: Confidence rings and fit range sliders
- 🎨 **Modern Design**: Purple crystal ball branding with blur effects

### v1.0.0
- Initial release with basic size recommendations
- Support for major shopping sites
- Privacy-focused local storage

## License

[MIT License](LICENSE)

---

**Built with 💜 by Varun Meda**  
*Making online shopping stress-free, one size at a time*