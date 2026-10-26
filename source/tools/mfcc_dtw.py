import numpy as np, wave, subprocess, os
from scipy.fft import dct
def load(p):
    w = wave.open(p); y = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32)/32768
    sr = w.getframerate()
    if sr != 16000:
        from scipy.signal import resample_poly
        y = resample_poly(y, 16000, sr).astype(np.float32)
    return y
def mfcc(y, sr=16000, n=13):
    y = np.append(y[0], y[1:] - 0.97*y[:-1])
    fl, hop = 400, 160
    nfr = 1 + max(0, (len(y)-fl)//hop)
    fr = np.stack([y[i*hop:i*hop+fl] for i in range(nfr)]) * np.hamming(fl)
    P = np.abs(np.fft.rfft(fr, 512))**2
    mel = lambda f: 2595*np.log10(1+f/700); imel = lambda m: 700*(10**(m/2595)-1)
    pts = imel(np.linspace(mel(60), mel(7600), 28)); bins = np.floor(513*pts/sr*2/2*1).astype(int)
    bins = np.floor((512+1)*pts/sr).astype(int)
    fb = np.zeros((26, 257))
    for m in range(1,27):
        for k in range(bins[m-1], bins[m]): fb[m-1,k] = (k-bins[m-1])/max(1,bins[m]-bins[m-1])
        for k in range(bins[m], bins[m+1]): fb[m-1,k] = (bins[m+1]-k)/max(1,bins[m+1]-bins[m])
    E = np.log(P @ fb.T + 1e-8)
    energy = E.mean(1)
    keep = energy > energy.max() - 6   # drop silence frames
    C = dct(E, type=2, axis=1, norm='ortho')[:, 1:n]
    C = C[keep]
    return (C - C.mean(0)) / (C.std(0) + 1e-6)
def dtw(a, b):
    D = np.sqrt(((a[:,None,:]-b[None,:,:])**2).sum(-1))
    n, m = D.shape; acc = np.full((n+1, m+1), np.inf); acc[0,0] = 0
    for i in range(1, n+1):
        for j in range(1, m+1):
            acc[i,j] = D[i-1,j-1] + min(acc[i-1,j], acc[i,j-1], acc[i-1,j-1])
    return acc[n,m] / (n+m)
