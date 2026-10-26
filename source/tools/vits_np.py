"""Pure-numpy inference for Hugging Face VitsModel checkpoints (Meta MMS-TTS).
Mirrors transformers' modeling_vits.py (text encoder with relative attention, stochastic duration
predictor with rational-quadratic spline flows, residual coupling flow, HiFi-GAN decoder)."""
import json, struct, unicodedata, math
import numpy as np
from scipy.special import erf

F = np.float32


def load_safetensors(path):
    with open(path, 'rb') as f:
        n = struct.unpack('<Q', f.read(8))[0]
        header = json.loads(f.read(n))
        base = 8 + n
    mm = np.memmap(path, dtype=np.uint8, mode='r')
    out = {}
    for k, v in header.items():
        if k == '__metadata__':
            continue
        a, b = v['data_offsets']
        out[k] = np.frombuffer(mm[base + a: base + b].tobytes(), dtype=np.float32).reshape(v['shape'])
    return out


class Vits:
    def __init__(self, folder):
        self.cfg = json.load(open(folder + '/config.json'))
        self.vocab = json.load(open(folder + '/vocab.json', encoding='utf-8'))
        self.W = load_safetensors(folder + '/model.safetensors')
        self._cache = {}

    # ---------- parameter access ----------
    def p(self, name):
        if name in self._cache:
            return self._cache[name]
        W = self.W
        if name + '.weight' in W:
            w = W[name + '.weight']
        elif name + '.weight_g' in W:
            g, v = W[name + '.weight_g'], W[name + '.weight_v']
            norm = np.sqrt((v.astype(np.float64) ** 2).sum(axis=tuple(range(1, v.ndim)), keepdims=True))
            w = (g * v / norm).astype(F)
        else:
            raise KeyError(name)
        b = W.get(name + '.bias')
        self._cache[name] = (w, b)
        return w, b

    # ---------- primitives ----------
    def conv(self, name, x, dilation=1, padding=0, groups=1):
        w, b = self.p(name)
        if padding:
            x = np.pad(x, ((0, 0), (padding, padding)))
        cout, cin_g, K = w.shape
        T = x.shape[1] - dilation * (K - 1)
        if groups == 1:
            if K == 1:
                y = w[:, :, 0] @ x
            else:
                key = name + '#mat'
                wm = self._cache.get(key)
                if wm is None:
                    wm = np.ascontiguousarray(w.transpose(0, 2, 1).reshape(cout, K * cin_g))
                    self._cache[key] = wm
                cols = np.empty((K, x.shape[0], T), dtype=F)
                for k in range(K):
                    cols[k] = x[:, k * dilation: k * dilation + T]
                y = wm @ cols.reshape(K * x.shape[0], T)
        else:  # depthwise
            y = np.zeros((cout, T), dtype=F)
            for k in range(K):
                y += w[:, 0, k:k + 1] * x[:, k * dilation: k * dilation + T]
        if b is not None:
            y += b[:, None]
        return y

    def conv_t(self, name, x, stride, padding):
        w, b = self.p(name)  # (cin, cout, K)
        cin, cout, K = w.shape
        T = x.shape[1]
        L = (T - 1) * stride + K
        y = np.zeros((cout, L), dtype=F)
        for k in range(K):
            y[:, k: k + (T - 1) * stride + 1: stride] += w[:, :, k].T @ x
        y = y[:, padding: L - padding]
        if b is not None:
            y += b[:, None]
        return y

    def ln_ct(self, name, x, eps=1e-5):  # x (C, T), normalise over C
        w, b = self.W[name + '.weight'], self.W[name + '.bias']
        m = x.mean(0, keepdims=True)
        v = ((x - m) ** 2).mean(0, keepdims=True)
        return (x - m) / np.sqrt(v + eps) * w[:, None] + b[:, None]

    # ---------- text ----------
    def tokens(self, text):
        text = unicodedata.normalize('NFC', text).lower()
        text = text.replace('’', "'").replace('`', "'")
        ids = [self.vocab[c] for c in text if c in self.vocab]
        out = [0] * (len(ids) * 2 + 1)
        out[1::2] = ids
        return np.array(out, dtype=np.int64)

    # ---------- text encoder ----------
    @staticmethod
    def _rel_emb(emb, L, w):
        pad = max(L - (w + 1), 0)
        if pad:
            emb = np.pad(emb, ((pad, pad), (0, 0)))
        s = max((w + 1) - L, 0)
        return emb[s: s + 2 * L - 1]

    @staticmethod
    def _rel_to_abs(x):
        H, L, _ = x.shape
        x = np.pad(x, ((0, 0), (0, 0), (0, 1))).reshape(H, L * 2 * L)
        x = np.pad(x, ((0, 0), (0, L - 1))).reshape(H, L + 1, 2 * L - 1)
        return x[:, :L, L - 1:]

    @staticmethod
    def _abs_to_rel(x):
        H, L, _ = x.shape
        x = np.pad(x, ((0, 0), (0, 0), (0, L - 1))).reshape(H, L * (2 * L - 1))
        x = np.pad(x, ((0, 0), (L, 0))).reshape(H, L, 2 * L)
        return x[:, :, 1:]

    def attention(self, pre, h):
        c = self.cfg
        H = c['num_attention_heads']; D = c['hidden_size'] // H; win = c['window_size']
        L = h.shape[0]
        lin = lambda n, x: x @ self.W[pre + n + '.weight'].T + self.W[pre + n + '.bias']
        q = (lin('q_proj', h) * D ** -0.5).reshape(L, H, D).transpose(1, 0, 2)
        k = lin('k_proj', h).reshape(L, H, D).transpose(1, 0, 2)
        v = lin('v_proj', h).reshape(L, H, D).transpose(1, 0, 2)
        sc = q @ k.transpose(0, 2, 1)
        rk = self._rel_emb(self.W[pre + 'emb_rel_k'][0], L, win)
        sc = sc + self._rel_to_abs(q @ rk.T)
        sc = sc - sc.max(-1, keepdims=True)
        pr = np.exp(sc); pr /= pr.sum(-1, keepdims=True)
        o = pr @ v
        rv = self._rel_emb(self.W[pre + 'emb_rel_v'][0], L, win)
        o = o + self._abs_to_rel(pr) @ rv
        o = o.transpose(1, 0, 2).reshape(L, H * D)
        return lin('out_proj', o)

    def text_encoder(self, ids):
        c = self.cfg
        h = self.W['text_encoder.embed_tokens.weight'][ids] * math.sqrt(c['hidden_size'])
        h = h.astype(F)
        for i in range(c['num_hidden_layers']):
            pre = f'text_encoder.encoder.layers.{i}.'
            a = self.attention(pre + 'attention.', h)
            h = self.ln_ct(pre + 'layer_norm', (h + a).T).T
            x = h.T
            k = c['ffn_kernel_size']
            pl, pr = (k - 1) // 2, k // 2
            y = self.conv(pre + 'feed_forward.conv_1', np.pad(x, ((0, 0), (pl, pr))))
            y = np.maximum(y, 0)
            y = self.conv(pre + 'feed_forward.conv_2', np.pad(y, ((0, 0), (pl, pr))))
            h = self.ln_ct(pre + 'final_layer_norm', (h + y.T).T).T
        hs = h.T  # (C, L)
        stats = self.conv('text_encoder.project', hs)
        fs = c['flow_size']
        return hs, stats[:fs], stats[fs:]

    # ---------- stochastic duration predictor ----------
    def dds(self, pre, x, g=None):
        c = self.cfg
        if g is not None:
            x = x + g
        K = c['duration_predictor_kernel_size']
        for i in range(c['depth_separable_num_layers']):
            d = K ** i
            h = self.conv(pre + f'convs_dilated.{i}', x, dilation=d, padding=(K * d - d) // 2, groups=x.shape[0])
            h = self.ln_ct(pre + f'norms_1.{i}', h)
            h = 0.5 * h * (1 + erf(h / np.sqrt(2)))
            h = self.conv(pre + f'convs_pointwise.{i}', h)
            h = self.ln_ct(pre + f'norms_2.{i}', h)
            h = 0.5 * h * (1 + erf(h / np.sqrt(2)))
            x = x + h.astype(F)
        return x

    @staticmethod
    def _softmax(x):
        x = x - x.max(-1, keepdims=True)
        e = np.exp(x)
        return e / e.sum(-1, keepdims=True)

    def _rq_spline_inverse(self, x, uw, uh, ud, tail):
        """x (N,), uw/uh (N,bins), ud (N,bins-1); reverse pass of the unconstrained RQ spline."""
        mbw = mbh = md = 1e-3
        out = x.copy()
        inside = (x >= -tail) & (x <= tail)
        if not inside.any():
            return out
        x = x[inside].astype(np.float64); uw = uw[inside].astype(np.float64); uh = uh[inside].astype(np.float64)
        ud = ud[inside].astype(np.float64)
        const = np.log(np.exp(1 - md) - 1)
        ud = np.pad(ud, ((0, 0), (1, 1)))
        ud[:, 0] = const; ud[:, -1] = const
        nb = uw.shape[-1]
        widths = mbw + (1 - mbw * nb) * self._softmax(uw)
        cw = np.pad(np.cumsum(widths, -1), ((0, 0), (1, 0)))
        cw = 2 * tail * cw - tail; cw[:, 0] = -tail; cw[:, -1] = tail
        widths = cw[:, 1:] - cw[:, :-1]
        der = md + np.logaddexp(0, ud)
        heights = mbh + (1 - mbh * nb) * self._softmax(uh)
        ch = np.pad(np.cumsum(heights, -1), ((0, 0), (1, 0)))
        ch = 2 * tail * ch - tail; ch[:, 0] = -tail; ch[:, -1] = tail
        heights = ch[:, 1:] - ch[:, :-1]
        loc = ch.copy(); loc[:, -1] += 1e-6
        idx = (x[:, None] >= loc).sum(-1) - 1
        r = np.arange(len(x))
        icw, ibw, ich = cw[r, idx], widths[r, idx], ch[r, idx]
        delta = heights / widths
        idel = delta[r, idx]; ider = der[r, idx]; ider1 = der[:, 1:][r, idx]; ih = heights[r, idx]
        i1 = ider + ider1 - 2 * idel
        i2 = x - ich
        i3 = i2 * i1
        a = ih * (idel - ider) + i3
        b = ih * ider - i3
        cc = -idel * i2
        disc = b ** 2 - 4 * a * cc
        root = (2 * cc) / (-b - np.sqrt(np.maximum(disc, 0)))
        out[inside] = (root * ibw + icw).astype(F)
        return out

    def conv_flow_reverse(self, pre, x, g):
        c = self.cfg
        nb = c['duration_predictor_flow_bins']; tail = c['duration_predictor_tail_bound']; fc = c['hidden_size']
        first, second = x[0:1], x[1:2]
        h = self.conv(pre + 'conv_pre', first)
        h = self.dds(pre + 'conv_dds.', h, g)
        h = self.conv(pre + 'conv_proj', h)  # (3nb-1, T)
        h = h.T  # (T, 3nb-1)
        uw = h[:, :nb] / math.sqrt(fc); uh = h[:, nb:2 * nb] / math.sqrt(fc); ud = h[:, 2 * nb:]
        s2 = self._rq_spline_inverse(second[0], uw, uh, ud, tail)
        return np.concatenate([first, s2[None]], 0)

    def durations(self, hs, rng, noise_scale_w):
        pre = 'duration_predictor.'
        x = self.conv(pre + 'conv_pre', hs)
        x = self.dds(pre + 'conv_dds.', x)
        x = self.conv(pre + 'conv_proj', x)
        T = hs.shape[1]
        z = (rng.standard_normal((2, T)) * noise_scale_w).astype(F)
        for i in [4, 3, 2, 'ea']:
            z = z[::-1].copy()
            if i == 'ea':
                t, ls = self.W[pre + 'flows.0.translate'], self.W[pre + 'flows.0.log_scale']
                z = (z - t) * np.exp(-ls)
            else:
                z = self.conv_flow_reverse(pre + f'flows.{i}.', z, x)
        return z[0]  # log duration

    # ---------- flow ----------
    def wavenet(self, pre, x, n_layers):
        c = self.cfg
        hsz = c['hidden_size']; K = c['wavenet_kernel_size']
        out = np.zeros_like(x)
        for i in range(n_layers):
            d = c['wavenet_dilation_rate'] ** i
            h = self.conv(pre + f'in_layers.{i}', x, dilation=d, padding=(K * d - d) // 2)
            acts = np.tanh(h[:hsz]) * (1 / (1 + np.exp(-h[hsz:])))
            rs = self.conv(pre + f'res_skip_layers.{i}', acts.astype(F))
            if i < n_layers - 1:
                x = x + rs[:hsz]
                out = out + rs[hsz:]
            else:
                out = out + rs
        return out

    def flow_reverse(self, z):
        c = self.cfg
        half = c['flow_size'] // 2
        for i in reversed(range(c['prior_encoder_num_flows'])):
            z = z[::-1].copy()
            pre = f'flow.flows.{i}.'
            first, second = z[:half], z[half:]
            h = self.conv(pre + 'conv_pre', first)
            h = self.wavenet(pre + 'wavenet.', h, c['prior_encoder_num_wavenet_layers'])
            mean = self.conv(pre + 'conv_post', h)
            z = np.concatenate([first, second - mean], 0)
        return z

    # ---------- HiFi-GAN ----------
    def decoder(self, x):
        c = self.cfg
        slope = c['leaky_relu_slope']
        lrelu = lambda h, s=slope: np.where(h > 0, h, h * s).astype(F)
        h = self.conv('decoder.conv_pre', x, padding=3)
        nk = len(c['resblock_kernel_sizes'])
        for i, (u, k) in enumerate(zip(c['upsample_rates'], c['upsample_kernel_sizes'])):
            h = lrelu(h)
            h = self.conv_t(f'decoder.upsampler.{i}', h, u, (k - u) // 2)
            acc = None
            for j, (ks, dil) in enumerate(zip(c['resblock_kernel_sizes'], c['resblock_dilation_sizes'])):
                pre = f'decoder.resblocks.{i * nk + j}.'
                r = h
                for m, d in enumerate(dil):
                    t = lrelu(r)
                    t = self.conv(pre + f'convs1.{m}', t, dilation=d, padding=(ks * d - d) // 2)
                    t = lrelu(t)
                    t = self.conv(pre + f'convs2.{m}', t, padding=(ks - 1) // 2)
                    r = r + t
                acc = r if acc is None else acc + r
            h = acc / nk
        h = lrelu(h, 0.01)
        h = self.conv('decoder.conv_post', h, padding=3)
        return np.tanh(h[0])

    # ---------- full ----------
    def synth(self, text, seed=0, noise_scale=None, noise_scale_w=None, speaking_rate=None):
        c = self.cfg
        ns = c['noise_scale'] if noise_scale is None else noise_scale
        nw = c['noise_scale_duration'] if noise_scale_w is None else noise_scale_w
        sr = c['speaking_rate'] if speaking_rate is None else speaking_rate
        rng = np.random.default_rng(seed)
        ids = self.tokens(text)
        if len(ids) < 3:
            return np.zeros(0, dtype=F)
        hs, m, logs = self.text_encoder(ids)
        logw = self.durations(hs, rng, nw)
        dur = np.ceil(np.exp(logw) * (1.0 / sr)).astype(int)
        dur = np.maximum(dur, 0)
        if dur.sum() < 1:
            dur[len(dur) // 2] = 1
        m = np.repeat(m, dur, axis=1); logs = np.repeat(logs, dur, axis=1)
        z = m + rng.standard_normal(m.shape).astype(F) * np.exp(logs) * ns
        z = self.flow_reverse(z.astype(F))
        return self.decoder(z.astype(F))
