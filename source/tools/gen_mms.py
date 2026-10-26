"""Synthesise items with the MMS Kurmanji VITS voice (numpy). Usage: gen_mms.py ITEMS_JSON RAWDIR SHARD NSHARDS

Writes raw 16 kHz WAVs only. Clarity (v2): calmer sampling (lower noise), single words picked as the
most typical of three takes. Voice character, cleanup and MP3 encoding happen in encode_mms.py."""
import sys, os, re, json, hashlib, subprocess, wave, time
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vits_np import Vits

PARAMS = dict(noise_scale=float(os.environ.get('PIRA_NS', 0.42)), noise_scale_w=float(os.environ.get('PIRA_NSW', 0.5)))
TAKES_WORD, TAKES_PHRASE = int(os.environ.get('PIRA_TAKES_WORD', 3)), int(os.environ.get('PIRA_TAKES_PHRASE', 1))

RATE_PHRASE, RATE_WORD = 0.92, 0.85
SR = 16000
ONES = ['sifir', 'yek', 'du', 'sê', 'çar', 'pênc', 'şeş', 'heft', 'heşt', 'neh', 'deh', 'yazdeh', 'dazdeh', 'sêzdeh',
        'çardeh', 'pazdeh', 'şanzdeh', 'hevdeh', 'hejdeh', 'nozdeh']
TENS = ['', '', 'bîst', 'sî', 'çil', 'pêncî', 'şêst', 'heftê', 'heştê', 'nod']
VOW = 'aeêiîouû'


def num_ku(n):
    if n < 20: return ONES[n]
    if n < 100:
        t, u = divmod(n, 10); return TENS[t] + ('' if u == 0 else ' û ' + ONES[u])
    if n < 1000:
        h, r = divmod(n, 100); s = 'sed' if h == 1 else ONES[h] + ' sed'
        return s + ('' if r == 0 else ' û ' + num_ku(r))
    if n < 1000000:
        th, r = divmod(n, 1000); s = 'hezar' if th == 1 else num_ku(th) + ' hezar'
        return s + ('' if r == 0 else ' û ' + num_ku(r))
    m, r = divmod(n, 1000000); return num_ku(m) + ' milyon' + ('' if r == 0 else ' û ' + num_ku(r))


def spell_numbers(t):
    def rep(mo):
        words = num_ku(int(mo.group(1)))
        suf = mo.group(2) or ''
        if suf:
            if words[-1] in VOW and suf[0] in VOW: words += 'y'
            words += suf
        return words
    t = re.sub(r'(\d+)%', lambda m: 'ji sedî ' + num_ku(int(m.group(1))), t)
    return re.sub(r'(\d+)([a-zçêîûşA-ZÇÊÎÛŞ]*)', rep, t)


def chunks(text):
    """split into (chunk, pause_after_seconds)"""
    t = spell_numbers(text)
    t = re.sub(r'[„“"«»()\[\]]', ' ', t)
    parts = re.split(r'([.!?…;:]+|,|\s[–—-]\s)', t)
    out = []
    for i in range(0, len(parts), 2):
        seg = parts[i].strip()
        sep = parts[i + 1] if i + 1 < len(parts) else ''
        if not re.search(r'[a-zçêîûş]', seg, re.I):
            continue
        pause = 0.12 if sep.strip() in (',', '–', '—', '-') else 0.3
        out.append((seg, pause))
    return out


def trim(y, thr=0.012):
    idx = np.where(np.abs(y) > thr)[0]
    if not len(idx): return y
    a = max(0, idx[0] - int(0.03 * SR)); b = min(len(y), idx[-1] + int(0.06 * SR))
    return y[a:b]


def medoid(takes):
    """the take closest to all others (MFCC + DTW): avoids one-off glitches"""
    if len(takes) < 3: return takes[0]
    from mfcc_dtw import mfcc, dtw
    M = [mfcc(t) for t in takes]
    cost = [sum(dtw(M[i], M[j]) for j in range(len(M)) if j != i) for i in range(len(M))]
    return takes[int(np.argmin(cost))]


def render(v, text, word):
    rate = RATE_WORD if word else RATE_PHRASE
    n_takes = TAKES_WORD if word else TAKES_PHRASE
    pieces = []
    cs = chunks(text)
    for j, (seg, pause) in enumerate(cs):
        seed = int(hashlib.md5(seg.encode()).hexdigest()[:8], 16)
        y = medoid([trim(v.synth(seg, seed=seed + k, speaking_rate=rate, **PARAMS)) for k in range(n_takes)])
        pieces.append(y)
        if j < len(cs) - 1:
            pieces.append(np.zeros(int(pause * SR), dtype=np.float32))
    if not pieces: return None
    y = np.concatenate(pieces)
    voiced = y[np.abs(y) > 0.02]
    rms = np.sqrt((voiced ** 2).mean()) if len(voiced) else 0.1
    y = y * min(0.125 / max(rms, 1e-4), 0.97 / max(np.abs(y).max(), 1e-4))
    y = np.concatenate([np.zeros(int(0.04 * SR), np.float32), y.astype(np.float32), np.zeros(int(0.08 * SR), np.float32)])
    return y


def name_for(text):
    return hashlib.md5(('mms1|' + text).encode('utf-8')).hexdigest()


def write_wav(path, y, sr=SR):
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
    with wave.open(path + '.tmp', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
    os.replace(path + '.tmp', path)


def main():
    """Synthesise raw 16 kHz WAVs (no processing) into RAWDIR. Sound design happens in encode_mms.py,
    so it can be changed without synthesising again."""
    items_path, rawdir, shard, nsh = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    os.makedirs(rawdir, exist_ok=True)
    items = json.load(open(items_path, encoding='utf-8'))
    v = Vits(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'voice'))
    todo = [(k, t) for i, (k, t) in enumerate(items) if i % nsh == shard]
    # texts that already have a finished MP3 (e.g. restored with unpack_banks.py) are skipped unless PIRA_FORCE=1
    mmsdir = os.environ.get('PIRA_MMS_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'audio_build', 'mms'))
    force = os.environ.get('PIRA_FORCE') == '1'
    t0 = time.time(); done = 0
    for k, t in todo:
        out = os.path.join(rawdir, name_for(t) + '.wav')
        if os.path.exists(out) and os.path.getsize(out) > 0:
            continue
        if not force and os.path.exists(os.path.join(mmsdir, name_for(t) + '.mp3')):
            continue
        y = render(v, t, word=(' ' not in k))
        if y is None:
            continue
        write_wav(out, y)
        done += 1
        if done % 50 == 0:
            print(f'shard {shard}: {done}/{len(todo)} in {time.time() - t0:.0f}s', flush=True)
    print(f'shard {shard}: finished {done} new in {time.time() - t0:.0f}s', flush=True)


if __name__ == '__main__':
    main()
