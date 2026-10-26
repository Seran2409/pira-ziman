"""Friendlier voice: pitch and melody changes for the raw MMS recordings (16 kHz mono, float32).

- f0_track(): F0 per 5 ms frame (normalised autocorrelation, voicing threshold, median smoothing)
- psola(): TD-PSOLA. Raises pitch and widens the melody (intonation range) while keeping the
  spectral envelope, so the voice stays the same person but sounds livelier.
- smile(): a small resampling step that lifts formants and pitch together by a few percent, like
  speaking with a smile (shorter vocal tract). Duration is restored by ffmpeg atempo (WSOLA) later.

Time-domain methods keep harmonics sharp, which phase-vocoder shifters (rubberband) smear.
"""
import numpy as np

SR = 16000
HOP = 80  # 5 ms


def f0_track(y, sr=SR, fmin=70, fmax=400, thr=0.5):
    win = int(0.03 * sr)
    n = max(0, (len(y) - win) // HOP + 1)
    f0 = np.zeros(n)
    lo, hi = int(sr / fmax), int(sr / fmin)
    for i in range(n):
        x = y[i * HOP:i * HOP + win]
        x = x - x.mean()
        e = np.sqrt((x ** 2).mean())
        if e < 0.008:
            continue
        ac = np.correlate(x, x, 'full')[win - 1:]
        # normalise by overlapping energy (unbiased)
        ac = ac / (np.arange(win, 0, -1) + 1e-9) * win
        if ac[0] <= 0:
            continue
        seg = ac[lo:hi] / ac[0]
        k = int(np.argmax(seg))
        if seg[k] < thr:
            continue
        # parabolic refinement
        j = lo + k
        if 1 <= j < len(ac) - 1:
            a, b, c = ac[j - 1], ac[j], ac[j + 1]
            d = 0.5 * (a - c) / (a - 2 * b + c + 1e-12)
            j = j + float(np.clip(d, -0.5, 0.5))
        f0[i] = sr / j
    # median smoothing over voiced frames, remove isolated voiced frames and octave jumps
    v = f0 > 0
    out = f0.copy()
    for i in range(n):
        if not v[i]:
            continue
        a, b = max(0, i - 3), min(n, i + 4)
        w = f0[a:b][v[a:b]]
        if len(w) < 3:
            out[i] = 0
            continue
        m = np.median(w)
        if abs(np.log2(f0[i] / m)) > 0.4:
            out[i] = m
    return out


def pitch_marks(y, f0, sr=SR):
    """analysis marks: pitch-synchronous in voiced parts (at waveform peaks), every 5 ms elsewhere"""
    marks, periods = [], []
    t = 0
    n = len(y)
    while t < n:
        fi = min(len(f0) - 1, t // HOP) if len(f0) else 0
        f = f0[fi] if len(f0) else 0
        if f > 0:
            T = sr / f
            # snap to the largest |peak| within +-T/3 of the predicted position
            a, b = int(max(0, t - T / 3)), int(min(n, t + T / 3 + 1))
            if b > a:
                t = a + int(np.argmax(np.abs(y[a:b])))
            marks.append(t); periods.append(T)
            t = int(round(t + T))
        else:
            marks.append(t); periods.append(HOP)
            t += HOP
    return np.array(marks), np.array(periods)


def psola(y, f0, shift=1.0, expand=1.0, sr=SR):
    """pitch * shift, melody range * expand (in log-F0 around the utterance median). Same duration."""
    if not np.any(f0 > 0) or (shift == 1.0 and expand == 1.0):
        return y.copy()
    voiced = f0[f0 > 0]
    ref = np.exp(np.median(np.log(voiced)))
    ma, _ = pitch_marks(y, f0, sr)
    n, K = len(y), len(ma)
    # local period of each analysis mark = actual spacing to its neighbours
    gap = np.diff(ma).astype(float)
    P = np.empty(K)
    P[0] = gap[0] if K > 1 else HOP
    P[-1] = gap[-1] if K > 1 else HOP
    if K > 2:
        P[1:-1] = (gap[:-1] + gap[1:]) / 2
    ratio = np.ones(K)
    for i, m in enumerate(ma):
        f = f0[min(len(f0) - 1, m // HOP)]
        if f > 0:
            ratio[i] = shift * np.exp((expand - 1) * np.log(f / ref))
    out = np.zeros(n + 2 * int(sr / 50))
    wsum = np.zeros_like(out)
    t, i = float(ma[0]), 0
    while t < n:
        while i + 1 < K and abs(ma[i + 1] - t) < abs(ma[i] - t):
            i += 1
        m = ma[i]
        L = max(8, int(round(P[i])))
        a, b = max(0, m - L), min(n, m + L)
        g = y[a:b]
        w = np.hanning(2 * L + 1)[(a - (m - L)):(a - (m - L)) + len(g)]
        s = int(round(t)) - (m - a)
        if s >= 0 and s + len(g) <= len(out):
            out[s:s + len(g)] += g * w
            wsum[s:s + len(g)] += w
        step = (ma[i + 1] - ma[i]) if i + 1 < K else P[i]   # forward spacing: identity when ratio == 1
        t += step / ratio[i]
    wsum[wsum < 1e-3] = 1.0
    return (out / wsum)[:n].astype(np.float32)


def friendly(y, shift=1.12, expand=1.25, sr=SR):
    f0 = f0_track(y, sr)
    return psola(y, f0, shift=shift, expand=expand, sr=sr)
