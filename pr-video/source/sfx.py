import numpy as np, wave
SR=44100; D=40.0; N=int(SR*D)
out=np.zeros((N,2)); rng=np.random.default_rng(3)
def add(s,start,g=1.0,pan=0.5):
    i=int(start*SR); j=min(N,i+len(s))
    if i<0 or i>=N: return
    out[i:j,0]+=s[:j-i]*g*(1-pan)*2; out[i:j,1]+=s[:j-i]*g*pan*2
def tt(d): return np.arange(int(d*SR))/SR
def lp(x,a):  # one-pole lowpass
    y=np.empty_like(x); v=0.0
    for i in range(len(x)): v+=a*(x[i]-v); y[i]=v
    return y
def whoosh(d=0.55,up=True):
    t=tt(d); n=rng.standard_normal(len(t))
    env=np.sin(np.pi*np.clip(t/d,0,1))**2
    # sweep brightness by mixing two filtered versions
    lo=lp(n,0.03); hi=lp(n,0.25)
    k=(t/d) if up else (1-t/d)
    return (lo*(1-k)+hi*k)*env*0.9
def pop(f=880,d=0.18):
    t=tt(d); fr=f*(1+1.2*np.exp(-t*40))
    return np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*22)*np.minimum(1,t/0.002)
def bell(f,d=1.2,g=1.0):
    t=tt(d); return g*(np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*6))*np.exp(-t*3.5)*np.minimum(1,t/0.002)
def sparkle(start,count=10,span=0.8,base=2000):
    for i in range(count):
        add(bell(base*2**(rng.uniform(0,1.3)),0.6,0.35),start+span*i/count+rng.uniform(0,0.03),0.5,rng.uniform(0.2,0.8))
def sad(start):  # two descending soft tones "ぽわん…"
    for i,f in enumerate([523.25,440.0,392.0]):
        t=tt(0.6); s=np.sin(2*np.pi*f*t+0.8*np.sin(2*np.pi*5*t))*np.exp(-t*3)*np.minimum(1,t/0.03)
        add(s,start+i*0.22,0.28)
def thud(start):
    t=tt(0.7); fr=110*np.exp(-t*3)+45
    add(np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*5),start,0.55)
def click(start,g=0.35):
    t=tt(0.04); add(lp(rng.standard_normal(len(t)),0.5)*np.exp(-t*160),start,g)
def rise(start,d=0.9):  # upward glissando shimmer
    t=tt(d); fr=400+2400*(t/d)**2
    s=np.sin(2*np.pi*np.cumsum(fr)/SR)*np.sin(np.pi*t/d)*0.35
    add(s,start,0.6)
def check(start,f=1318.5):
    add(bell(f,0.5,0.7),start,0.45); add(bell(f*1.5,0.5,0.5),start+0.07,0.35)

# ---- timeline (matches pr.html) ----
add(pop(1046),0.7,0.45)                           # 吹き出し
sparkle(1.35,5,0.4,2400)                          # 見出し
add(whoosh(0.5),3.2,0.35)                         # シーン転換
sad(3.55)                                         # お悩み
for s in (4.1,5.1,6.1): add(whoosh(0.3,False),s-0.05,0.25); add(pop(587,0.22),s+0.08,0.45)   # カード
add(whoosh(0.5),8.25,0.35)                        # 転換
add(pop(880),8.8,0.45)                            # 吹き出し
thud(9.8)                                         # 価格競争（不安）
add(pop(698),10.9,0.35)
rise(11.45,0.85)                                  # 解決へ
sparkle(12.25,14,1.1,1800)                        # 登場キラキラ
for i,f in enumerate([1046.5,1318.5,1568,2093]): add(bell(f,1.4,0.8),12.3+i*0.08,0.35,0.3+0.13*i)
add(whoosh(0.55),15.0,0.35)                       # デモへ
for s in (15.4,15.6,15.8): add(pop(1175,0.15),s,0.25)
# デモ中の操作音（入力・ボタン）
for s in [16.4,16.55,16.7,16.85,17.0,17.2,17.35,20.3,20.45,20.6,20.8,20.95,21.1,22.4,22.55,22.7]: click(s,0.18)
for s in (19.7,24.7): add(pop(988,0.2),s,0.4)     # STEP切替
click(26.2,0.45); check(26.25,1568)               # 依頼文作成
click(29.4,0.45); check(29.45,1760)               # コピー
add(whoosh(0.5),30.05,0.35)                       # オファー
for s in (30.9,31.6,32.3): check(s)
add(whoosh(0.45),34.05,0.3)
for s in (34.6,35.0,35.4): add(pop(784,0.2),s,0.35); add(bell(2093,0.4,0.4),s+0.05,0.25)
add(whoosh(0.6),37.0,0.4)                         # ラスト
sparkle(37.3,16,1.2,1800)
for i,f in enumerate([1046.5,1318.5,1568,2093,2637]): add(bell(f,1.6,0.8),37.5+i*0.09,0.35,0.2+0.15*i)
add(pop(660,0.25),38.1,0.5); click(38.12,0.3)     # ボタン
sparkle(39.0,6,0.5,2600)
# reverb-ish
rev=np.zeros_like(out)
for d,g in [(0.029,0.3),(0.053,0.25),(0.089,0.2),(0.137,0.14)]:
    k=int(d*SR); rev[k:,0]+=out[:-k,1]*g; rev[k:,1]+=out[:-k,0]*g
out=out+rev*0.6
out/=max(1.0,np.max(np.abs(out))*1.05)
with wave.open('sfx.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype('<i2').tobytes())
print('peak ok')
