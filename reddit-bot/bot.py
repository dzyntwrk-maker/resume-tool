"""
Dizzy Inc — Reddit Bot
Subreddit automation tool for community management.
Features: karma tracking, auto-moderation, scheduled posts, welcome DMs, keyword auto-responder
"""

import os
import json
import logging
import time
import threading
from datetime import datetime, timezone
from collections import defaultdict
from pathlib import Path

import praw
import schedule
from dotenv import load_dotenv

# ── Setup ──────────────────────────────────────────────────────────────────────

load_dotenv()

BASE_DIR = Path(__file__).parent
LOG_FILE = BASE_DIR / "bot.log"
CONFIG_FILE = BASE_DIR / "config.json"
SCHEDULE_FILE = BASE_DIR / "schedule.json"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("dizzy-reddit-bot")


# ── Config helpers ─────────────────────────────────────────────────────────────

def load_config() -> dict:
    with open(CONFIG_FILE) as f:
        return json.load(f)


def load_schedule() -> list:
    with open(SCHEDULE_FILE) as f:
        return json.load(f)


# ── Reddit client ──────────────────────────────────────────────────────────────

def get_reddit() -> praw.Reddit:
    return praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        username=os.getenv("REDDIT_USERNAME"),
        password=os.getenv("REDDIT_PASSWORD"),
        user_agent=os.getenv("REDDIT_USER_AGENT", "DizzyBot/1.0 by Dizzy_Inc"),
    )


# ── Feature: Karma Tracker ─────────────────────────────────────────────────────

class KarmaTracker:
    """Tracks top contributors and posts a weekly leaderboard."""

    def __init__(self, reddit: praw.Reddit, config: dict):
        self.reddit = reddit
        self.cfg = config
        self.subreddit_name: str = config["subreddit"]
        self.karma_cfg: dict = config.get("karma_tracker", {})
        self.scores: dict[str, int] = defaultdict(int)

    def _scan_recent_posts(self):
        sub = self.reddit.subreddit(self.subreddit_name)
        limit = self.karma_cfg.get("scan_posts_limit", 100)
        for submission in sub.new(limit=limit):
            self.scores[submission.author.name if submission.author else "[deleted]"] += (
                submission.score
            )
            for comment in submission.comments.list():
                if hasattr(comment, "author") and comment.author:
                    self.scores[comment.author.name] += comment.score

    def post_leaderboard(self):
        if not self.karma_cfg.get("enabled", False):
            return
        log.info("Karma Tracker: scanning recent posts…")
        self._scan_recent_posts()
        top_n = self.karma_cfg.get("leaderboard_size", 10)
        top = sorted(self.scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
        if not top:
            log.info("Karma Tracker: no data to post.")
            return

        lines = ["## Weekly Karma Leaderboard\n"]
        lines.append("| Rank | User | Score |")
        lines.append("|------|------|-------|")
        for rank, (user, score) in enumerate(top, 1):
            lines.append(f"| #{rank} | u/{user} | {score} |")
        lines.append(
            f"\n*Posted automatically by the subreddit bot. "
            f"Week ending {datetime.now(timezone.utc).strftime('%Y-%m-%d')}.*"
        )
        body = "\n".join(lines)
        title = self.karma_cfg.get(
            "post_title", "[Weekly] Top Contributors Leaderboard"
        )

        sub = self.reddit.subreddit(self.subreddit_name)
        post = sub.submit(title=title, selftext=body)
        post.mod.distinguish(how="yes")
        post.mod.sticky(state=True, bottom=True)
        log.info("Karma Tracker: leaderboard posted → %s", post.shortlink)
        self.scores.clear()


# ── Feature: Auto-Moderator ────────────────────────────────────────────────────

class AutoModerator:
    """Removes low-karma posts and auto-flairs submissions by keyword."""

    def __init__(self, reddit: praw.Reddit, config: dict):
        self.reddit = reddit
        self.cfg = config
        self.subreddit_name: str = config["subreddit"]
        self.automod_cfg: dict = config.get("auto_moderator", {})

    def check_new_submissions(self):
        if not self.automod_cfg.get("enabled", False):
            return
        sub = self.reddit.subreddit(self.subreddit_name)
        karma_threshold: int = self.automod_cfg.get("karma_threshold", 0)
        flair_rules: list = self.automod_cfg.get("flair_rules", [])
        removal_reason: str = self.automod_cfg.get(
            "removal_reason",
            "Your post has been removed because your account karma is below the required threshold.",
        )

        for submission in sub.new(limit=25):
            author = submission.author
            if author is None:
                continue

            # Karma gate
            if submission.author.comment_karma + submission.author.link_karma < karma_threshold:
                submission.mod.remove()
                try:
                    submission.author.message(
                        subject="Post removed — karma requirement",
                        message=removal_reason,
                    )
                except Exception as exc:
                    log.warning("AutoMod: could not DM %s — %s", author.name, exc)
                log.info(
                    "AutoMod: removed post by u/%s (karma below %d)",
                    author.name,
                    karma_threshold,
                )
                continue

            # Auto-flair by keyword
            if not submission.link_flair_text:
                title_lower = submission.title.lower()
                body_lower = (submission.selftext or "").lower()
                for rule in flair_rules:
                    keywords = [kw.lower() for kw in rule.get("keywords", [])]
                    if any(kw in title_lower or kw in body_lower for kw in keywords):
                        try:
                            submission.mod.flair(
                                text=rule["flair_text"],
                                css_class=rule.get("css_class", ""),
                            )
                            log.info(
                                "AutoMod: flaired '%s' → [%s]",
                                submission.title[:60],
                                rule["flair_text"],
                            )
                        except Exception as exc:
                            log.warning("AutoMod: flair error — %s", exc)
                        break


# ── Feature: Scheduled Posts ───────────────────────────────────────────────────

class ScheduledPoster:
    """Posts content according to schedule.json."""

    def __init__(self, reddit: praw.Reddit, config: dict):
        self.reddit = reddit
        self.cfg = config
        self.subreddit_name: str = config["subreddit"]
        self.sched_cfg: dict = config.get("scheduled_posts", {})

    def _post(self, entry: dict):
        sub = self.reddit.subreddit(self.subreddit_name)
        try:
            post = sub.submit(
                title=entry["title"],
                selftext=entry.get("body", ""),
                flair_text=entry.get("flair"),
            )
            if entry.get("sticky", False):
                post.mod.sticky(state=True, bottom=True)
            if entry.get("distinguish", True):
                post.mod.distinguish(how="yes")
            log.info("ScheduledPoster: posted '%s' → %s", entry["title"], post.shortlink)
        except Exception as exc:
            log.error("ScheduledPoster: failed to post '%s' — %s", entry["title"], exc)

    def register_jobs(self):
        if not self.sched_cfg.get("enabled", False):
            return
        entries = load_schedule()
        for entry in entries:
            day = entry.get("day", "").lower()
            time_str = entry.get("time", "09:00")
            job_fn = lambda e=entry: self._post(e)

            day_map = {
                "monday": schedule.every().monday,
                "tuesday": schedule.every().tuesday,
                "wednesday": schedule.every().wednesday,
                "thursday": schedule.every().thursday,
                "friday": schedule.every().friday,
                "saturday": schedule.every().saturday,
                "sunday": schedule.every().sunday,
            }
            if day in day_map:
                day_map[day].at(time_str).do(job_fn)
                log.info(
                    "ScheduledPoster: registered '%s' every %s at %s",
                    entry["title"],
                    day,
                    time_str,
                )
            elif day == "daily":
                schedule.every().day.at(time_str).do(job_fn)
                log.info(
                    "ScheduledPoster: registered '%s' daily at %s", entry["title"], time_str
                )
            else:
                log.warning("ScheduledPoster: unknown day '%s' for entry '%s'", day, entry["title"])


# ── Feature: Welcome DMs ───────────────────────────────────────────────────────

class WelcomeDM:
    """Sends a welcome DM to new subreddit members."""

    def __init__(self, reddit: praw.Reddit, config: dict):
        self.reddit = reddit
        self.cfg = config
        self.subreddit_name: str = config["subreddit"]
        self.welcome_cfg: dict = config.get("welcome_dm", {})
        self._seen_file = BASE_DIR / ".welcomed_users.json"
        self._seen: set = self._load_seen()

    def _load_seen(self) -> set:
        if self._seen_file.exists():
            with open(self._seen_file) as f:
                return set(json.load(f))
        return set()

    def _save_seen(self):
        with open(self._seen_file, "w") as f:
            json.dump(list(self._seen), f)

    def check_new_members(self):
        if not self.welcome_cfg.get("enabled", False):
            return
        sub = self.reddit.subreddit(self.subreddit_name)
        template: str = self.welcome_cfg.get(
            "message_template",
            "Welcome to r/{subreddit}! We're glad to have you here.",
        )
        subject: str = self.welcome_cfg.get("subject", "Welcome to the community!")

        try:
            for member in sub.new_members(limit=50):
                username = member.name
                if username in self._seen:
                    continue
                msg = template.format(
                    subreddit=self.subreddit_name,
                    username=username,
                    date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                )
                try:
                    member.message(subject=subject, message=msg)
                    log.info("WelcomeDM: sent to u/%s", username)
                except Exception as exc:
                    log.warning("WelcomeDM: could not DM u/%s — %s", username, exc)
                self._seen.add(username)
            self._save_seen()
        except Exception as exc:
            log.error("WelcomeDM: error checking new members — %s", exc)


# ── Feature: Keyword Auto-Responder ───────────────────────────────────────────

class KeywordResponder:
    """Replies to posts/comments that contain configured trigger keywords."""

    def __init__(self, reddit: praw.Reddit, config: dict):
        self.reddit = reddit
        self.cfg = config
        self.subreddit_name: str = config["subreddit"]
        self.responder_cfg: dict = config.get("keyword_responder", {})
        self._replied_file = BASE_DIR / ".replied_ids.json"
        self._replied: set = self._load_replied()

    def _load_replied(self) -> set:
        if self._replied_file.exists():
            with open(self._replied_file) as f:
                return set(json.load(f))
        return set()

    def _save_replied(self):
        with open(self._replied_file, "w") as f:
            json.dump(list(self._replied), f)

    def _match(self, text: str, triggers: list[str]) -> bool:
        text_lower = text.lower()
        return any(t.lower() in text_lower for t in triggers)

    def scan(self):
        if not self.responder_cfg.get("enabled", False):
            return
        rules: list = self.responder_cfg.get("rules", [])
        if not rules:
            return

        sub = self.reddit.subreddit(self.subreddit_name)

        # Check new submissions
        for submission in sub.new(limit=25):
            if submission.id in self._replied:
                continue
            text = f"{submission.title} {submission.selftext or ''}"
            for rule in rules:
                if self._match(text, rule["triggers"]):
                    try:
                        reply = submission.reply(rule["response"])
                        reply.mod.distinguish(how="yes")
                        log.info(
                            "KeywordResponder: replied to post '%s' with rule '%s'",
                            submission.title[:60],
                            rule.get("name", "unnamed"),
                        )
                    except Exception as exc:
                        log.warning("KeywordResponder: reply failed — %s", exc)
                    self._replied.add(submission.id)
                    break

        # Check new comments
        for comment in sub.comments(limit=50):
            if comment.id in self._replied:
                continue
            if not hasattr(comment, "body"):
                continue
            for rule in rules:
                if self._match(comment.body, rule["triggers"]):
                    try:
                        reply = comment.reply(rule["response"])
                        reply.mod.distinguish(how="yes")
                        log.info(
                            "KeywordResponder: replied to comment by u/%s with rule '%s'",
                            comment.author.name if comment.author else "unknown",
                            rule.get("name", "unnamed"),
                        )
                    except Exception as exc:
                        log.warning("KeywordResponder: reply failed — %s", exc)
                    self._replied.add(comment.id)
                    break

        self._save_replied()


# ── Main loop ──────────────────────────────────────────────────────────────────

def run_schedule_thread():
    while True:
        schedule.run_pending()
        time.sleep(30)


def main():
    log.info("=" * 60)
    log.info("Dizzy Inc Reddit Bot starting up…")
    log.info("=" * 60)

    config = load_config()
    reddit = get_reddit()

    # Verify auth
    me = reddit.user.me()
    log.info("Authenticated as u/%s", me.name)

    # Instantiate features
    karma_tracker = KarmaTracker(reddit, config)
    auto_mod = AutoModerator(reddit, config)
    scheduled_poster = ScheduledPoster(reddit, config)
    welcome_dm = WelcomeDM(reddit, config)
    keyword_responder = KeywordResponder(reddit, config)

    # Register scheduled jobs
    scheduled_poster.register_jobs()

    # Register weekly karma leaderboard
    if config.get("karma_tracker", {}).get("enabled", False):
        leaderboard_day = config["karma_tracker"].get("post_day", "sunday")
        leaderboard_time = config["karma_tracker"].get("post_time", "18:00")
        day_map = {
            "monday": schedule.every().monday,
            "tuesday": schedule.every().tuesday,
            "wednesday": schedule.every().wednesday,
            "thursday": schedule.every().thursday,
            "friday": schedule.every().friday,
            "saturday": schedule.every().saturday,
            "sunday": schedule.every().sunday,
        }
        if leaderboard_day in day_map:
            day_map[leaderboard_day].at(leaderboard_time).do(karma_tracker.post_leaderboard)
            log.info(
                "Karma Tracker: leaderboard scheduled every %s at %s",
                leaderboard_day,
                leaderboard_time,
            )

    # Start schedule thread
    sched_thread = threading.Thread(target=run_schedule_thread, daemon=True)
    sched_thread.start()
    log.info("Scheduler thread started.")

    # Poll interval (seconds)
    poll_interval = config.get("poll_interval_seconds", 60)
    log.info("Polling every %d seconds. Press Ctrl+C to stop.", poll_interval)

    try:
        while True:
            try:
                auto_mod.check_new_submissions()
                welcome_dm.check_new_members()
                keyword_responder.scan()
            except praw.exceptions.PRAWException as exc:
                log.error("PRAW error during poll cycle: %s", exc)
            except Exception as exc:
                log.error("Unexpected error during poll cycle: %s", exc)
            time.sleep(poll_interval)
    except KeyboardInterrupt:
        log.info("Bot stopped by user.")


if __name__ == "__main__":
    main()
