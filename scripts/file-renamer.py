#!/usr/bin/env python3
"""
file-renamer.py — Bulk file renamer with multiple pattern options.

Supports: prefix, suffix, sequential numbering, date-stamping, find/replace in filenames.
Multiple options can be combined in a single run.
"""

import os
import re
import argparse
from datetime import datetime
from pathlib import Path


def build_new_name(original: str, args, index: int) -> str:
    stem = Path(original).stem
    ext = Path(original).suffix

    # Find/replace first so later transforms work on the updated name
    if args.find and args.replace is not None:
        stem = stem.replace(args.find, args.replace)

    if args.prefix:
        stem = args.prefix + stem

    if args.suffix:
        stem = stem + args.suffix

    if args.date_stamp:
        date_str = datetime.now().strftime(args.date_format)
        stem = f"{stem}_{date_str}"

    if args.sequential:
        width = args.pad_width
        stem = f"{stem}_{str(index).zfill(width)}"

    if args.lowercase:
        stem = stem.lower()

    if args.uppercase:
        stem = stem.upper()

    return stem + ext


def collect_files(directory: str, pattern: str, recursive: bool) -> list[Path]:
    base = Path(directory)
    glob_fn = base.rglob if recursive else base.glob
    regex = re.compile(pattern) if pattern else None

    files = []
    for p in sorted(glob_fn("*")):
        if not p.is_file():
            continue
        if regex and not regex.search(p.name):
            continue
        files.append(p)
    return files


def main():
    parser = argparse.ArgumentParser(
        description="Bulk rename files in a folder with flexible patterns.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Add prefix to all .jpg files
  python file-renamer.py ./photos --prefix "vacation_" --filter "\\.jpg$"

  # Sequential numbering with zero-padding
  python file-renamer.py ./docs --sequential --pad-width 4

  # Find & replace in filenames
  python file-renamer.py ./files --find "IMG_" --replace "photo_"

  # Date-stamp + prefix (combine options freely)
  python file-renamer.py ./exports --prefix "report_" --date-stamp

  # Dry run to preview changes without renaming anything
  python file-renamer.py ./folder --prefix "new_" --dry-run
        """,
    )

    parser.add_argument("directory", help="Target directory containing files to rename")
    parser.add_argument("--prefix", metavar="TEXT", help="Add TEXT before each filename")
    parser.add_argument("--suffix", metavar="TEXT", help="Add TEXT after each filename (before extension)")
    parser.add_argument("--find", metavar="TEXT", help="Text to find in filenames")
    parser.add_argument("--replace", metavar="TEXT", help="Replacement text (use with --find; default: empty string)")
    parser.add_argument("--sequential", action="store_true", help="Append sequential number to each filename")
    parser.add_argument("--pad-width", type=int, default=3, metavar="N", help="Zero-pad width for sequential numbers (default: 3)")
    parser.add_argument("--date-stamp", action="store_true", help="Append current date/time to each filename")
    parser.add_argument("--date-format", default="%Y%m%d", metavar="FMT", help="strftime format for date stamp (default: %%Y%%m%%d)")
    parser.add_argument("--lowercase", action="store_true", help="Convert filenames to lowercase")
    parser.add_argument("--uppercase", action="store_true", help="Convert filenames to uppercase")
    parser.add_argument("--filter", metavar="REGEX", dest="filter_pattern", help="Only rename files whose names match this regex")
    parser.add_argument("--recursive", action="store_true", help="Recurse into subdirectories")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without actually renaming")

    args = parser.parse_args()

    if not os.path.isdir(args.directory):
        parser.error(f"Directory not found: {args.directory}")

    if not any([args.prefix, args.suffix, args.find is not None, args.sequential, args.date_stamp, args.lowercase, args.uppercase]):
        parser.error("Specify at least one rename operation (--prefix, --suffix, --find, --sequential, --date-stamp, --lowercase, --uppercase)")

    if args.find is not None and args.replace is None:
        args.replace = ""

    files = collect_files(args.directory, args.filter_pattern, args.recursive)

    if not files:
        print("No matching files found.")
        return

    print(f"{'DRY RUN — ' if args.dry_run else ''}Processing {len(files)} file(s) in: {args.directory}\n")
    print(f"  {'ORIGINAL':<45} -> NEW NAME")
    print("  " + "-" * 75)

    renamed = 0
    skipped = 0

    for i, filepath in enumerate(files, start=1):
        new_name = build_new_name(filepath.name, args, i)
        new_path = filepath.parent / new_name

        if new_path == filepath:
            print(f"  {filepath.name:<45}    (unchanged)")
            skipped += 1
            continue

        if new_path.exists():
            print(f"  {filepath.name:<45} -> SKIPPED ('{new_name}' already exists)")
            skipped += 1
            continue

        print(f"  {filepath.name:<45} -> {new_name}")

        if not args.dry_run:
            filepath.rename(new_path)
        renamed += 1

    print()
    action = "Would rename" if args.dry_run else "Renamed"
    print(f"{action} {renamed} file(s). Skipped {skipped}.")
    if args.dry_run:
        print("Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
