"""Sound design for the app recordings: raw 16 kHz WAVs (gen_mms.py) -> finished MP3s.

Usage: encode_mms.py ITEMS_JSON [RAWDIR] [OUTDIR]     (defaults: audio_build/raw, audio_build/mms)
Only encodes raw files that are newer than their MP3. PIRA_FORCE=1 re-encodes all (after a voice/chain change).

Steps per recording
1. Voice character (voice_fx.py): TD-PSOLA raises the pitch a little and widens the melody,
   a small "smile" step lifts formants and pitch together (resample + atempo). See VOICE.
2. Cleanup with ffmpeg: high-pass, denoise, less boxiness, a touch of warmth, presence for
   consonants, softer top end, de-esser, gentle compression, limiter (about -16 LUFS, peaks < -1 dB),
   short fades so nothing clicks.
3. MP3 24 kHz, 64 kbit/s, low-pass at 8 kHz (the voice model itself stops at 8 kHz).

Changing VOICE or the chains only needs this script again, not a new synthesis.
"""
import json, os, subprocess, sys, tempfile, wave
from concurrent.futures import ProcessPoolExecutor
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_mms import name_for
import voice_fx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # source/
VOICES = {
    'sauber': dict(smile=1.0, shift=1.0, expand=1.0),
    'freundlich': dict(smile=1.06, shift=1.06, expand=1.2),        # about +2 semitones, livelier melody, slight smile
    'hell': dict(smile=1.15, shift=1.39, expand=1.15),             # experimental: higher, female-like
}
VOICE = VOICES[os.environ.get('PIRA_VOICE', 'freundlich')]
PRE = 'highpass=f=80,afftdn=nr=12:nf=-38:tn=1'
POST = ','.join([
    'equalizer=f=350:t=q:w=1.0:g=-2.5',    # less boxy
    'equalizer=f=140:t=q:w=1.2:g=1.0',     # a little warmth
    'equalizer=f=2600:t=q:w=1.0:g=2.0',    # consonant clarity
    'highshelf=f=7000:g=-1.5',             # softer, less fizzy top
    'deesser=i=0.3:m=0.5:f=0.5',
    'volume=5dB',
    'acompressor=threshold=0.1:ratio=2.5:attack=6:release=120:makeup=2.6',
    'alimiter=limit=0.89:attack=2:release=40:level=0',
    'afade=t=in:d=0.012,areverse,afade=t=in:d=0.035,areverse'])
SR = 16000


def chain(v=VOICE):
    k = v['smile']
    up = 'aresample=24000:resampler=soxr:precision=28'
    # smile: play faster (pitch and formants * k), upsample, then restore the duration with atempo (WSOLA).
    # Note: soxr placed after atempo hangs ffmpeg 6.1, so the resampler always comes first.
    mid = f'asetrate={SR * k:.0f},{up},atempo={1 / k:.6f}' if k != 1 else up
    return f'{PRE},{mid},{POST}'


def load(p):
    w = wave.open(p)
    return np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768


def encode_one(args):
    raw, out = args
    y = load(raw)
    if (VOICE['shift'], VOICE['expand']) != (1.0, 1.0):
        y = voice_fx.psola(y, voice_fx.f0_track(y), shift=VOICE['shift'], expand=VOICE['expand'])
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf:
        tmp = tf.name
    try:
        with wave.open(tmp, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-af', chain(),
                        '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '64k', '-cutoff', '8000',
                        out + '.tmp.mp3'], check=True, timeout=120)
        os.replace(out + '.tmp.mp3', out)
    finally:
        os.remove(tmp)
    return out


def main():
    items = json.load(open(sys.argv[1], encoding='utf-8'))
    rawdir = sys.argv[2] if len(sys.argv) > 2 else ROOT + '/audio_build/raw'
    outdir = sys.argv[3] if len(sys.argv) > 3 else ROOT + '/audio_build/mms'
    os.makedirs(outdir, exist_ok=True)
    force = os.environ.get('PIRA_FORCE') == '1'   # re-encode everything, e.g. after changing VOICE or the chains
    jobs, missing, current = [], 0, 0
    for _, t in items:
        n = name_for(t)
        raw, mp3 = f'{rawdir}/{n}.wav', f'{outdir}/{n}.mp3'
        if not os.path.exists(raw):
            missing += 1
            continue
        if not force and os.path.exists(mp3) and os.path.getmtime(mp3) >= os.path.getmtime(raw):
            current += 1
            continue
        jobs.append((raw, mp3))
    with ProcessPoolExecutor(int(os.environ.get('PIRA_JOBS', os.cpu_count() or 2))) as ex:
        for i, _ in enumerate(ex.map(encode_one, jobs, chunksize=8), 1):
            if i % 500 == 0:
                print(f'encoded {i}/{len(jobs)}', flush=True)
    print(f'encoded {len(jobs)}, already current {current}, without raw {missing}, voice {VOICE}', flush=True)


if __name__ == '__main__':
    main()
