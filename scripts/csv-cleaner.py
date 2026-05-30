#!/usr/bin/env python3
"""
csv-cleaner.py — Clean messy CSV files automatically.

Removes duplicates, trims whitespace, normalizes empty cells, and outputs a clean copy.

Usage:
  python csv-cleaner.py <input.csv> [--output <clean.csv>] [--fill <value>]
  python csv-cleaner.py data.csv
  python csv-cleaner.py data.csv --output clean_data.csv --fill "N/A"
  python csv-cleaner.py data.csv --dedup-cols "email,name" --fill ""
"""

import csv
import sys
import argparse
from pathlib import Path

def clean_csv(input_path, output_path, fill_value="N/A", dedup_cols=None, strip_all=True):
    with open(input_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            print("Error: CSV has no headers.")
            sys.exit(1)
        fieldnames = [h.strip() for h in reader.fieldnames]
        rows = list(reader)

    print(f"Input rows    : {len(rows)}")

    # Strip whitespace from all values
    cleaned = []
    for row in rows:
        clean_row = {}
        for k, v in row.items():
            key = k.strip() if k else k
            val = v.strip() if v and strip_all else (v or "")
            clean_row[key] = val if val != "" else fill_value
        cleaned.append(clean_row)

    # Remove fully empty rows
    cleaned = [r for r in cleaned if any(v not in ("", fill_value) for v in r.values())]
    print(f"After empties : {len(cleaned)}")

    # Deduplication
    if dedup_cols:
        cols = [c.strip() for c in dedup_cols.split(",")]
        seen = set()
        deduped = []
        for row in cleaned:
            key = tuple(row.get(c, "") for c in cols)
            if key not in seen:
                seen.add(key)
                deduped.append(row)
        print(f"Dupes removed : {len(cleaned) - len(deduped)} (by columns: {', '.join(cols)})")
        cleaned = deduped
    else:
        # Full-row dedup
        seen = set()
        deduped = []
        for row in cleaned:
            key = tuple(sorted(row.items()))
            if key not in seen:
                seen.add(key)
                deduped.append(row)
        print(f"Dupes removed : {len(cleaned) - len(deduped)}")
        cleaned = deduped

    print(f"Output rows   : {len(cleaned)}")

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(cleaned)

    print(f"Saved to      : {output_path}")

def main():
    parser = argparse.ArgumentParser(
        description="Clean CSV files: trim whitespace, fill empty cells, remove duplicates.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("input", help="Input CSV file path")
    parser.add_argument("--output", "-o", help="Output file (default: <input>_clean.csv)")
    parser.add_argument("--fill", "-f", default="N/A", help="Value to fill empty cells with (default: N/A)")
    parser.add_argument("--dedup-cols", "-d", help="Comma-separated column names to deduplicate on (default: full row)")
    parser.add_argument("--no-strip", action="store_true", help="Skip whitespace stripping")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: file not found: {args.input}")
        sys.exit(1)

    output_path = Path(args.output) if args.output else input_path.with_stem(input_path.stem + "_clean")

    clean_csv(
        input_path=input_path,
        output_path=output_path,
        fill_value=args.fill,
        dedup_cols=args.dedup_cols,
        strip_all=not args.no_strip,
    )

if __name__ == "__main__":
    main()
