#!/usr/bin/env python3
"""SessionStart hook: a short, current status of the project as context for Claude (plain stdout)."""
import json, os, re, subprocess

root = os.environ.get('CLAUDE_PROJECT_DIR') or os.getcwd()
src = os.path.join(root, 'source')


def sh(*cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, cwd=root, timeout=10).stdout.strip()
    except Exception:
        return ''


def count(d, ext):
    p = os.path.join(src, d)
    return sum(1 for f in os.listdir(p) if f.endswith(ext)) if os.path.isdir(p) else 0


lines = ['Pira Ziman · Projektstand']
branch = sh('git', 'branch', '--show-current')
dirty = [l for l in sh('git', 'status', '--porcelain').splitlines() if l.strip()]
lines.append(f'- Git: Branch {branch or "?"}, ' + (f'{len(dirty)} Datei(en) geändert, vor dem Veröffentlichen committen' if dirty else 'alles committet'))
lines.append('- Letzte Commits: ' + ' | '.join(sh('git', 'log', '--oneline', '-3').splitlines()))
bp = os.path.join(src, 'tools', 'build_pages.py')
if os.path.exists(bp):
    m = re.search(r"VERSION = '([^']+)'", open(bp, encoding='utf-8').read())
    lines.append(f'- Service-Worker-Version: {m.group(1) if m else "?"} (vor jedem Push erhöhen)')
try:
    n_items = len(json.load(open(os.path.join(src, 'audio_build', 'items.json'), encoding='utf-8')))
except Exception:
    n_items = 0
lines.append(f'- Audio: {n_items} Sprechtexte, {count("audio_build/raw", ".wav")} Rohaufnahmen, '
             f'{count("audio_build/mms", ".mp3")} fertige MP3s, {count("dist/audio", ".js")} Banken in dist/audio, '
             f'{count("../audio", ".js")} Banken online')
voice = os.path.exists(os.path.join(src, 'voice', 'model.safetensors'))
lines.append('- Stimmmodell source/voice/: ' + ('vorhanden' if voice else 'fehlt (nur nötig für neue Aufnahmen, siehe .claude/rules/audio.md)'))
lines.append('- Live: https://seran2409.github.io/pira-ziman/')
print('\n'.join(lines))
