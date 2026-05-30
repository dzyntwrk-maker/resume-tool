# Automation Scripts — Fiverr Delivery Package

Thank you for your purchase! Below is a guide to each script included in this package.

---

## 1. `file-renamer.py` — Bulk File Renamer

Rename hundreds of files in seconds using patterns.

**Features:**
- Add prefix or suffix to all filenames
- Sequential numbering (file_001.jpg, file_002.jpg…)
- Date-stamp files with today's date
- Find & replace text within filenames
- Preview changes before applying (dry-run mode)

**Usage:**
```bash
python file-renamer.py /path/to/folder --prefix "project_"
python file-renamer.py /path/to/folder --suffix "_final"
python file-renamer.py /path/to/folder --sequential --start 1
python file-renamer.py /path/to/folder --date-stamp
python file-renamer.py /path/to/folder --find "old" --replace "new"
python file-renamer.py /path/to/folder --prefix "img_" --dry-run
```

---

## 2. `folder-sorter.py` — Automatic Folder Organizer

Drop files into a chaotic folder and this script sorts them into clean subfolders by type.

**Sorts into:**
- Images/ (jpg, png, gif, webp, svg…)
- Documents/ (pdf, docx, xlsx, txt…)
- Videos/ (mp4, mov, avi…)
- Audio/ (mp3, wav, flac…)
- Archives/ (zip, rar, tar…)
- Code/ (py, js, html, css…)
- Other/ (everything else)

**Usage:**
```bash
python folder-sorter.py /path/to/messy/folder
python folder-sorter.py /path/to/folder --dry-run
python folder-sorter.py /path/to/folder --no-other
```

---

## 3. `web-scraper.py` — Webpage Link & Data Scraper

Scrapes all links, anchor text, and metadata from any public webpage and exports to CSV.

**Features:**
- Extracts page title, meta description, all links with anchor text
- No external dependencies — uses Python stdlib only
- Exports clean CSV ready for Excel/Sheets

**Usage:**
```bash
python web-scraper.py https://example.com
python web-scraper.py https://news.ycombinator.com --limit 50
python web-scraper.py https://example.com --output results.csv
```

---

## 4. `csv-cleaner.py` — CSV Data Cleaner

Cleans messy spreadsheet exports automatically.

**What it fixes:**
- Trims leading/trailing whitespace from all cells
- Fills empty cells with a configurable value (default: "N/A")
- Removes fully duplicate rows
- Removes empty rows
- Normalizes headers (strips whitespace)

**Usage:**
```bash
python csv-cleaner.py messy_data.csv
python csv-cleaner.py data.csv --output clean.csv --fill "N/A"
python csv-cleaner.py data.csv --dedup-cols "email,name"
```

---

## Requirements

- Python 3.7+ (no pip install needed for most scripts)
- `web-scraper.py` uses stdlib only

## Support

Questions? Reach out via Fiverr message. Revisions included within 7 days.
