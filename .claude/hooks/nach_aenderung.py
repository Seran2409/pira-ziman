#!/usr/bin/env python3
"""PostToolUse hook (Edit|Write): keeps the app buildable after every change.

- source/src/*      -> rebuild source/dist/pira-ziman.html and check the JavaScript syntax (node --check)
- source/**/*.py    -> Python compile check
On a problem: message on stderr and exit 2, which Claude Code shows to Claude (the edit itself stays).
Silent on success. Skips the JS check when node is not installed.
"""
import json, os, py_compile, re, shutil, subprocess, sys, tempfile

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
path = (data.get('tool_input') or {}).get('file_path') or ''
root = os.environ.get('CLAUDE_PROJECT_DIR') or os.getcwd()
rel = os.path.relpath(os.path.abspath(path), root).replace(os.sep, '/') if path else ''
src = os.path.join(root, 'source')


def fail(msg):
    print(msg, file=sys.stderr)
    sys.exit(2)


if rel.startswith('source/') and rel.endswith('.py'):
    try:
        py_compile.compile(os.path.join(root, rel), doraise=True)
    except py_compile.PyCompileError as e:
        fail(f'Python-Syntaxfehler in {rel}:\n{e.msg}')
    sys.exit(0)

if not rel.startswith('source/src/'):
    sys.exit(0)

r = subprocess.run([sys.executable, os.path.join(src, 'build.py')], capture_output=True, text=True, cwd=src)
if r.returncode:
    fail(f'build.py ist nach der Änderung an {rel} fehlgeschlagen:\n{(r.stderr or r.stdout)[-1500:]}')

node = shutil.which('node')
if not node:
    sys.exit(0)
html = open(os.path.join(src, 'dist', 'pira-ziman.html'), encoding='utf-8').read()
scripts = re.findall(r'<script>\n(.*?)\n</script>', html, re.S)
if not scripts:
    sys.exit(0)
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
    f.write(scripts[-1])
    tmp = f.name
try:
    r = subprocess.run([node, '--check', tmp], capture_output=True, text=True)
finally:
    os.remove(tmp)
if r.returncode:
    err = r.stderr.replace(tmp, 'pira-ziman.html <script>')
    fail(f'JavaScript-Syntaxfehler nach der Änderung an {rel}. Die Zeilennummern beziehen sich auf das '
         f'zusammengesetzte Skript in source/dist/pira-ziman.html:\n{err[-1500:]}')
sys.exit(0)
