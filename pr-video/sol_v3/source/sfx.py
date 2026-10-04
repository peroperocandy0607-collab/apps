import numpy as np, wave
from scipy.signal import lfilter, butter
SR=44100; D=56.7; N=int(SR*D); rng=np.random.default_rng(9)
out=np.zeros((N,2))
def tt(d): return np.arange(int(d*SR))/SR
def lpf(x,fc,o=2): b,a=butter(o,fc/(SR/2)); return lfilter(b,a,x)
def hpf(x,fc,o=2): b,a=butter(o,fc/(SR/2),'high'); return lfilter(b,a,x)
def bpf(x,lo,hi,o=2): b,a=butter(o,[lo/(SR/2),hi/(SR/2)],'band'); return lfilter(b,a,x)
def put(s,start,g=1.0,pan=0.5):
    i=int(round(start*SR))
    if i>=N: return
    j=min(N,i+len(s)); out[i:j,0]+=s[:j-i]*g*(1-pan)*2; out[i:j,1]+=s[:j-i]*g*pan*2
def whoosh(d=0.45,bright=1.0):
    t=tt(d); n=rng.standard_normal(len(t)); env=np.sin(np.pi*t/d)**3
    lo=lpf(n,600); hi=bpf(n,1500,9000*bright if 9000*bright<20000 else 19000)
    k=t/d; return (lo*(1-k)+hi*k*0.8)*env*1.2
def impact(g=1.0):
    t=tt(1.8); f=35+90*np.exp(-t*9); boom=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*2.2)
    crack=hpf(rng.standard_normal(len(t)),2500)*np.exp(-t*18)*0.6
    tail=lpf(rng.standard_normal(len(t)),1200)*np.exp(-t*3)*0.25
    return (boom*1.1+crack+tail)*g
def hit(g=1.0):  # punchy thud for slams/stamps
    t=tt(0.4); f=60+140*np.exp(-t*30); s=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
    return (s+bpf(rng.standard_normal(len(t)),800,4000)*np.exp(-t*40)*0.5)*g
def shing(f0=2400,d=1.2):
    t=tt(d); s=sum(np.sin(2*np.pi*f0*r*t+r)*np.exp(-t*(3+r))/ (1+i) for i,r in enumerate([1,1.47,2.09,2.76,3.43]))
    return (s*0.35+hpf(rng.standard_normal(len(t)),6000)*np.exp(-t*25)*0.3)*np.minimum(1,t/0.003)
def zap(f0=300,f1=2400,d=0.22):  # rising digital "!?"
    t=tt(d); f=f0*(f1/f0)**(t/d); s=np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*0.3+np.sin(2*np.pi*np.cumsum(f)/SR)*0.5
    return lpf(s,5000)*np.exp(-t*6)
def blip(f=880,d=0.12):
    t=tt(d); return np.sin(2*np.pi*f*t)*np.exp(-t*30)*np.minimum(1,t/0.002)
def drop_down(d=0.9):  # gloom "bwomp"
    t=tt(d); f=220*(0.4)**(t/d); s=np.sin(2*np.pi*np.cumsum(f)/SR)+0.4*np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))
    return lpf(s,900)*np.exp(-t*2.5)*0.7
def glitch(d=0.25):
    t=tt(d); s=np.zeros(len(t))
    for k in range(6):
        a=int(k*len(t)/6); b=a+int(len(t)/12); f=rng.uniform(300,2500)
        s[a:b]=np.sign(np.sin(2*np.pi*f*t[a:b]))*0.4
    return lpf(s,6000)
def drip():
    t=tt(0.15); f=600+1400*(t/0.15); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*25)
def click(g=0.4):
    t=tt(0.03); return hpf(rng.standard_normal(len(t)),2000)*np.exp(-t*200)*g
def rev_cym(d=0.6):
    t=tt(d); return hpf(rng.standard_normal(len(t)),4000)*(t/d)**3*0.7
def sparkle(start,n=10,span=0.7):
    for i in range(n): put(shing(rng.uniform(3000,6000),0.5),start+span*i/n,0.12,rng.uniform(.2,.8))

# ---- S1-3
put(whoosh(0.45),0.15,0.35,0.3)
for s,p in ((0.8,.3),(1.1,.7),(1.5,.75)): put(blip(990 if p<.5 else 1320),s,0.35,p)
put(whoosh(0.3,1.2),0.7,0.3,0.7)
put(drip(),1.42,0.35,0.6)
put(hit(1.2),1.1,0.75); put(drop_down(0.8),1.15,0.45); put(zap(900,250,0.25),1.12,0.25,0.6)
put(hit(1.0),2.5,0.6); put(zap(),2.55,0.4,0.6)
for s in (2.6,2.85,3.3,3.5,3.75): put(whoosh(0.25,1.3),s-0.06,0.28,0.7); put(hit(0.6),s+0.05,0.35,0.65)
put(impact(0.6),3.95,0.6)
put(glitch(),4.68,0.25)
put(drop_down(),4.9,0.5)
put(click(),5.0,0.6); put(whoosh(0.35),5.0,0.25)
# ---- transition & drop
put(whoosh(0.7,1.4),6.6,0.55)
put(rev_cym(0.55),6.75,0.4)
put(impact(1.0),7.28,0.9)
put(hit(1.0),7.6,0.6); put(whoosh(0.3),7.85,0.25); put(whoosh(0.4),7.98,0.25,0.7)
put(shing(2200,1.4),8.2,0.35); sparkle(8.2,8,0.8)
put(blip(1175,0.15),8.25,0.35,0.3)
# ---- steps
put(whoosh(0.4),11.05,0.35)
for s in (11.25,18.2,24.25,29.7,35.65,41.85):
    put(whoosh(0.3,1.3),s-0.08,0.3,0.3); put(shing(2600,0.9),s+0.15,0.22,0.4)
for s in (11.6,14.8,18.5,21.0,24.6,30.0,32.0,36.0,42.2): put(blip(1318,0.12),s,0.32,0.75); put(click(0.5),s,0.5,0.75)
put(impact(0.8),32.0,0.75); sparkle(32.0,14,1.0); put(zap(400,3000,0.18),32.05,0.3,0.8)
# ---- points
put(whoosh(0.7,1.4),47.3,0.5); put(impact(0.9),47.95,0.8)
put(hit(1.0),48.1,0.55)
for s,p in ((48.45,.3),(48.85,.7),(49.2,.5),(49.5,.5)): put(hit(1.1),s,0.7,p); put(shing(3200,0.4),s+0.02,0.15,p)
put(whoosh(0.4),49.55,0.3); put(blip(1175,0.15),50.0,0.35,0.7)
# ---- end
put(whoosh(0.45),52.5,0.35,0.3)
put(shing(1800,1.6),52.9,0.35,0.65)
put(hit(1.0),53.2,0.6); put(whoosh(0.35),53.5,0.25)
sparkle(53.6,12,1.4)
rev=np.zeros_like(out)
for d,g in [(0.029,.3),(0.053,.25),(0.089,.2),(0.137,.15),(0.211,.1)]:
    k=int(d*SR); rev[k:,0]+=out[:-k,1]*g; rev[k:,1]+=out[:-k,0]*g
out=out+rev*0.5; out/=max(1,np.max(np.abs(out))*1.05)
with wave.open('sfx.wav','wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((out*32767).astype('<i2').tobytes())
print('ok')
