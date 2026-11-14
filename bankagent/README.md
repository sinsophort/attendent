# Dash Board Report Bank GO/7 — GitHub Pages Web App Package (v3.6.91)

កញ្ចប់ឯកសារនេះត្រូវបានរចនាឡើងសម្រាប់បង្ហោះលើ **GitHub Pages** ដើម្បី៖
1. **បាំងរបារអក្សរព្រមានខាងលើរបស់ Google Apps Script** (`This application was created by a Google Apps Script user...`) មិនឱ្យឃើញអក្សរ ១០០% ទាំងលើកុំព្យូទ័រ និងទូរស័ព្ទដៃ។
2. **បង្ហាញផ្ទាំង Loading និង Logo GO/7 ដ៏ស្រស់ស្អាត** នៅពេលបើកកម្មវិធីដំបូង។
3. **គាំទ្រការដំឡើងជាកម្មវិធីលើទូរស័ព្ទ (PWA - Add to Home Screen)** ជាមួយរូបតំណាង (App Icon) ផ្លូវការរបស់ **GO/7**។

---

## 📁 ឯកសារនៅក្នុងកញ្ចប់នេះ (Included Files)
- `index.html` — ឯកសារគោលដែលភ្ជាប់ជាមួយ Google Apps Script Web App (`https://script.google.com/macros/s/AKfycbzHdD2qdkV_3wcpic4kb0z5a01YTBHImanFEWssz5-Ssj2DjbL5iioaJdZFi5T-CW-O_Q/exec`) រួមជាមួយប្រព័ន្ធបាំងរបារខាងលើ និងផ្ទាំង Loading។
- `manifest.json` — ឯកសារកំណត់រចនាសម្ព័ន្ធ PWA សម្រាប់ទូរស័ព្ទ iPhone និង Android។
- `sw.js` — Service Worker សម្រាប់ជួយឱ្យបើកផ្ទាំងដំបូងបានលឿន។
- `favicon.svg` & `favicon.ico` — រូប Logo លើរបារ Tab របស់ Browser។
- `assets/logo.png` & `assets/logo.svg` — រូបភាព Logo កម្រិតច្បាស់របស់ប្រព័ន្ធ GO/7។
- `assets/icon-192.png`, `assets/icon-512.png`, `assets/apple-touch-icon.png` — រូបតំណាងកម្មវិធីសម្រាប់អេក្រង់ទូរស័ព្ទ។

---

## 🚀 របៀបដាក់បញ្ចូលក្នុង GitHub (How to Upload to GitHub)
1. ពន្លា (Extract / Unzip) ឯកសារ `GO7_Bank_System_GitHub_WebApp_v3.6.91.zip`។
2. ចូលទៅកាន់ Repository របស់អ្នកនៅលើ **GitHub** រួចចុច **Add file > Upload files**។
3. អូសឯកសារ និងថតឯកសារទាំងអស់ (`index.html`, `manifest.json`, `sw.js`, `favicon.svg`, `favicon.ico`, និងថត `assets/`) ចូលទៅក្នុង Repository រួចចុច **Commit changes**។
4. ចូលទៅកាន់ **Settings > Pages** ជ្រើសរើស Branch `main` រួចចុច **Save**។
