import numpy as np, wave, json
SR=44100; N=int(40*SR)
def rd(p):
    w=wave.open(p); sr=w.getframerate(); ch=w.getnchannels()
    x=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(float)/32767
    x=x.reshape(-1,ch)
    if sr!=SR:
        n=int(len(x)*SR/sr); idx=np.linspace(0,len(x)-1,n)
        x=np.stack([np.interp(idx,np.arange(len(x)),x[:,c]) for c in range(x.shape[1])],1)
    if x.shape[1]==1: x=np.repeat(x,2,1)
    return x
def fit(x):
    y=np.zeros((N,2)); y[:min(N,len(x))]=x[:N]; return y
bgm=fit(rd('bgm.wav')); sfx=fit(rd('sfx.wav'))
voice=np.zeros((N,2)); active=np.zeros(N)
for i,l in enumerate(json.load(open('lines.json',encoding='utf-8'))):
    v=rd(f'vo/{i:02d}.wav'); s=int(l['at']*SR); e=min(N,s+len(v))
    pan=0.42 if l['who']=='f' else 0.58
    voice[s:e,0]+=v[:e-s,0]*(1-pan)*2; voice[s:e,1]+=v[:e-s,1]*pan*2
    active[max(0,s-int(.15*SR)):min(N,e+int(.25*SR))]=1
# smooth ducking envelope
k=int(0.12*SR); ker=np.ones(k)/k; duck=np.convolve(active,ker,'same')
bg_gain=1-0.55*duck
mix=bgm*0.55*bg_gain[:,None] + sfx*0.55 + voice*0.95
mix/=np.max(np.abs(mix))*1.05
with wave.open('mix.wav','wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
