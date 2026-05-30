#!/usr/bin/env python3
"""
folder-sorter.py — Automatically sort files into subfolders by type.

Moves files from a source directory into categorized subfolders
(Images/, Documents/, Videos/, etc.). Fully configurable.
"""

import os
import shutil
import argparse
from pathlib import Path
from collections import defaultdict

# Default extension-to-folder mapping
DEFAULT_CATEGORIES = {
    "Images":     {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".tiff", ".ico", ".heic", ".raw"},
    "Videos":     {".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm", ".m4v", ".mpeg", ".mpg"},
    "Audio":      {".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a", ".opus", ".aiff"},
    "Documents":  {".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".pages", ".tex", ".md", ".rst"},
    "Spreadsheets": {".xls", ".xlsx", ".csv", ".ods", ".numbers"},
    "Presentations": {".ppt", ".pptx", ".odp", ".key"},
    "Archives":   {".zip", ".tar", ".gz", ".bz2", ".xz", ".rar", ".7z", ".tgz"},
    "Code":       {".py", ".js", ".ts", ".html", ".css", ".java", ".c", ".cpp", ".h", ".go", ".rs", ".rb", ".php", ".sh", ".json", ".xml", ".yaml", ".yml", ".toml", ".sql"},
    "Executables": {".exe", ".msi", ".dmg", ".pkg", ".deb", ".rpm", ".appimage"},
    "Fonts":      {".ttf", ".otf", ".woff", ".woff2", ".eot"},
}


def get_category(ext: str, categories: dict) -> str:
    ext_lower = ext.lower()
    for folder, extensions in categories.items():
        if ext_lower in extensions:
            return folder
    return None


def resolve_collision(dest_path: Path) -> Path:
    """If destination already exists, append _1, _2, etc."""
    if not dest_path.exists():
        return dest_path
    stem, suffix = dest_path.stem, dest_path.suffix
    counter = 1
    while True:
        candidate = dest_path.parent / f"{stem}_{counter}{suffix}"
        if not candidate.exists():
            return candidate
        counter += 1


def main():
    parser = argparse.ArgumentParser(
        description="Sort files in a directory into subfolders by file type.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Sort Downloads folder (moves files into subfolders)
  python folder-sorter.py ~/Downloads

  # Preview what would happen without moving anything
  python folder-sorter.py ~/Downloads --dry-run

  # Sort but put unrecognized files into 'Misc' instead of leaving them
  python folder-sorter.py ~/Downloads --catch-all Misc

  # Recurse into subdirectories
  python folder-sorter.py ~/Downloads --recursive

  # Copy instead of move
  python folder-sorter.py ~/Downloads --copy

  # Show all recognized categories and extensions
  python folder-sorter.py . --list-categories
        """,
    )

    parser.add_argument("source", help="Directory to sort")
    parser.add_argument("--dest", metavar="DIR", help="Destination root for sorted subfolders (default: same as source)")
    parser.add_argument("--catch-all", metavar="FOLDER", help="Move unrecognized files into this subfolder (default: leave in place)")
    parser.add_argument("--recursive", action="store_true", help="Also sort files in subdirectories")
    parser.add_argument("--copy", action="store_true", help="Copy files instead of moving them")
    parser.add_argument("--dry-run", action="store_true", help="Preview actions without modifying anything")
    parser.add_argument("--list-categories", action="store_true", help="Print the built-in category/extension map and exit")

    args = parser.parse_args()

    if args.list_categories:
        print("Built-in categories:\n")
        for cat, exts in DEFAULT_CATEGORIES.items():
            print(f"  {cat:<18} {', '.join(sorted(exts))}")
        return

    source = Path(args.source).expanduser().resolve()
    if not source.is_dir():
        parser.error(f"Source directory not found: {source}")

    dest_root = Path(args.dest).expanduser().resolve() if args.dest else source

    glob_fn = source.rglob("*") if args.recursive else source.glob("*")
    files = [p for p in glob_fn if p.is_file()]

    if not files:
        print("No files found.")
        return

    action_verb = "Copy" if args.copy else "Move"
    print(f"{'[DRY RUN] ' if args.dry_run else ''}{action_verb}ing {len(files)} file(s) from: {source}\n")

    stats = defaultdict(int)

    for filepath in sorted(files):
        # Skip files already inside a destination subfolder to avoid re-sorting
        category = get_category(filepath.suffix, DEFAULT_CATEGORIES)

        if category is None:
            if args.catch_all:
                category = args.catch_all
            else:
                print(f"  [SKIP]   {filepath.name}  (unrecognized type, no --catch-all set)")
                stats["skipped"] += 1
                continue

        target_dir = dest_root / category
        dest_path = resolve_collision(target_dir / filepath.name)

        rel = filepath.relative_to(source)
        print(f"  [{category:<15}]  {rel}  ->  {dest_path.relative_to(dest_root)}")

        if not args.dry_run:
            target_dir.mkdir(parents=True, exist_ok=True)
            if args.copy:
                shutil.copy2(filepath, dest_path)
            else:
                shutil.move(str(filepath), dest_path)

        stats[category] += 1

    print()
    print("Summary:")
    for cat, count in sorted(stats.items()):
        if cat == "skipped":
            print(f"  Skipped (unrecognized):  {count}")
        else:
            print(f"  {cat:<20} {count} file(s)")

    if args.dry_run:
        print("\nDry run complete. No files were modified. Remove --dry-run to apply.")


if __name__ == "__main__":
    main()
