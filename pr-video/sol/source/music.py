import numpy as np, wave
from scipy.signal import lfilter, butter
SR=44100; D=56.7; N=int(SR*D); rng=np.random.default_rng(5)
L=np.zeros((N,2))
def put(buf,s,start,g=1.0,pan=0.5):
    i=int(round(start*SR));
    if i>=N: return
    if i<0: s=s[-i:]; i=0
    j=min(N,i+len(s)); s=np.asarray(s)
    if s.ndim==1: buf[i:j,0]+=s[:j-i]*g*(1-pan)*2; buf[i:j,1]+=s[:j-i]*g*pan*2
    else: buf[i:j]+=s[:j-i]*g
def tt(d): return np.arange(int(d*SR))/SR
def lpf(x,fc,o=2): b,a=butter(o,fc/(SR/2)); return lfilter(b,a,x)
def hpf(x,fc,o=2): b,a=butter(o,fc/(SR/2),'high'); return lfilter(b,a,x)
def bpf(x,lo,hi,o=2): b,a=butter(o,[lo/(SR/2),hi/(SR/2)],'band'); return lfilter(b,a,x)
def hz(m): return 440*2**((m-69)/12)
BPM=120; beat=60/BPM; bar=4*beat; T0=7.25  # drop
def kick(g=1.0):
    t=tt(0.45); f=48+110*np.exp(-t*28); ph=2*np.pi*np.cumsum(f)/SR
    return (np.sin(ph)*np.exp(-t*7.5)+0.25*np.exp(-t*300)*rng.standard_normal(len(t)))*g
def clap():
    t=tt(0.35); n=rng.standard_normal(len(t)); env=np.zeros(len(t))
    for d in (0,0.011,0.022): env+=np.exp(-np.clip(t-d,0,None)*60)*(t>=d)
    env+=0.6*np.exp(-t*14)
    return bpf(n,900,5000)*env*0.6
def hat(d=0.05,g=0.3): t=tt(d); return hpf(rng.standard_normal(len(t)),7000)*np.exp(-t*(70 if d<0.1 else 14))*g
def saw(f,t,det=0):
    s=0
    for dd in (-det,0,det): s=s+(2*((f*(1+dd)*t)%1)-1)
    return s/3
def chord_stab(notes,d,cut=2500):
    t=tt(d); s=sum(saw(hz(m),t,0.006) for m in notes)/len(notes)
    env=np.minimum(1,t/0.005)*np.exp(-t*3.0)
    return lpf(s*env,cut)
def pad(notes,d,cut=1200):
    t=tt(d); s=sum(saw(hz(m),t,0.004)+0.5*np.sin(2*np.pi*hz(m)*t) for m in notes)/len(notes)
    env=np.minimum(1,t/0.6)*np.minimum(1,(d-t)/0.6); env=np.clip(env,0,1)
    return lpf(s*env,cut)
def sub(m,d):
    t=tt(d); s=np.sin(2*np.pi*hz(m)*t)+0.3*np.sin(4*np.pi*hz(m)*t)
    return s*np.minimum(1,t/0.01)*np.minimum(1,(d-t)/0.03).clip(0,1)
def pluck(m,d=0.25):
    t=tt(d); s=saw(hz(m),t,0.003); return lpf(s*np.exp(-t*14),3800)*np.minimum(1,t/0.002)

drums=np.zeros((N,2)); music=np.zeros((N,2)); bassb=np.zeros((N,2))
PROG=[(45,[57,60,64,67,71]),(41,[57,60,65,69,72]),(48,[55,60,64,67,71]),(43,[55,59,62,67,74])]  # Am9 Fmaj7 Cmaj7 G6
# ---------- intro 0..7.25 : dark pad, ticking, heartbeat
put(music,pad([45,52,57,60,64],7.6,700),-0.2,0.30)
for k in range(int(7.25/ (beat/2))+1):
    t=T0-k*beat/2
    if t<0.2: break
    put(drums,hat(0.03,0.16 if t<4.7 else 0.22),t,1,0.62 if k%2 else 0.38)
for k in range(1,15):
    t=T0-k*beat
    if t<0.25: break
    if k%2==0 or t>4.7: put(drums,kick(0.55 if t<4.7 else 0.7),t)
# plucked motif in intro (2.5~)
mot=[69,72,76,74,72,71,69,67]
for k,m in enumerate(mot*2):
    t=2.5+k*beat/2
    if t<6.7: put(music,pluck(m,0.4),t,0.10,0.3+0.4*(k%2))
# snare roll + riser
t=4.75; step=beat/2
while t<7.15:
    g=0.15+0.5*(t-4.75)/2.4; put(drums,clap(),t,g*0.7); 
    step=beat/2 if t<6.25 else beat/4 if t<6.75 else beat/8; t+=step
r=tt(2.0); rn=rng.standard_normal(len(r)); riser=(lpf(rn,800)*(1-r/2)+hpf(rn,3000)*(r/2))*(r/2)**2*0.6
put(music,riser,5.2,1.0)
# ---------- main 7.25..47.4
def groove(t0,t1,arp=True,full=True):
    nb=int(round((t1-t0)/beat))
    for b in range(nb):
        t=t0+b*beat; bi=int(round((t-T0)/beat)); ch=PROG[(bi//4)%4]
        if full: put(drums,kick(0.95),t)
        if bi%2==1: put(drums,clap(),t,0.55,0.5)
        put(drums,hat(0.04,0.13),t,1,0.4); put(drums,hat(0.18,0.11),t+beat/2,1,0.6)  # offbeat open hat
        put(drums,hat(0.03,0.07),t+beat/4,1,0.55); put(drums,hat(0.03,0.07),t+3*beat/4,1,0.45)
        # bass: offbeat pumping 8ths
        put(bassb,sub(ch[0]-12,beat/2*0.9),t+beat/2,0.55)
        put(bassb,sub(ch[0]-12,beat/2*0.5),t,0.30)
        # chord stab on offbeat
        put(music,chord_stab(ch[1],0.35,2200 if full else 1200),t+beat/2,0.16,0.5)
        if arp:
            seq=[ch[1][0]+12,ch[1][2]+12,ch[1][4]+12,ch[1][2]+12]
            for k in range(4): put(music,pluck(seq[k]+(12 if (bi%8)>=4 and k==2 else 0),0.22),t+k*beat/4,0.07,0.25+0.5*(k%2))
        if bi%4==0: put(music,pad(ch[1],bar+0.3,1500),t,0.07)
groove(T0,11.25,arp=False)
groove(11.25,29.75,arp=True)
groove(29.75,41.75,arp=True)
groove(41.75,45.75,arp=True,full=False)   # 少し抜く
groove(45.75,47.25,arp=False)
# riser to 47.95
r=tt(1.3); rn=rng.standard_normal(len(r)); put(music,hpf(rn,1500)*(r/1.3)**2*0.5,46.6)
# points 47.95..52.45
groove(47.95,52.45,arp=True)
# outro
put(music,pad([45,52,57,60,64,71],4.6,2000),52.45,0.32)
put(drums,kick(1.0),52.45); put(music,chord_stab([57,60,64,67,71],2.5,3000),52.45,0.25)
for k,m in enumerate([76,79,83,81,79,76,74,76]): put(music,pluck(m,0.5),52.95+k*beat/2,0.09,0.3+0.4*(k%2))
# sidechain on music+bass
sc=np.ones(N); 
kt=[T0+b*beat for b in range(int((47.25-T0)/beat))]+[47.95+b*beat for b in range(9)]
for t in kt:
    i=int(t*SR); n=int(0.3*SR); j=min(N,i+n); x=np.arange(j-i)/SR
    sc[i:j]=np.minimum(sc[i:j],1-0.7*np.exp(-x*12))
music*=sc[:,None]; bassb*=sc[:,None]
# simple stereo reverb on music
rev=np.zeros_like(music)
for d,g in [(0.037,.4),(0.061,.33),(0.089,.28),(0.131,.22),(0.193,.17),(0.277,.12),(0.389,.08)]:
    k=int(d*SR); rev[k:,0]+=music[:-k,1]*g; rev[k:,1]+=music[:-k,0]*g
mix=drums*0.9+bassb*0.9+music+rev*0.5
fade=np.ones(N); fade[:int(.2*SR)]=np.linspace(0,1,int(.2*SR)); fo=int(1.2*SR); fade[-fo:]=np.linspace(1,0,fo)
mix*=fade[:,None]; mix=np.tanh(mix/np.max(np.abs(mix))*1.4)/np.tanh(1.4)
with wave.open('music.wav','wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*0.89*32767).astype('<i2').tobytes())
print('ok')
