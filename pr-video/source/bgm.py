import numpy as np, wave
SR=44100; D=40.0; N=int(SR*D); t=np.arange(N)/SR
out=np.zeros((N,2))
def hz(n): return 440*2**((n-69)/12)
def add(sig,start,pan=0.5,g=1.0):
    i=int(start*SR); j=min(N,i+len(sig)); 
    if i>=N: return
    out[i:j,0]+=sig[:j-i]*g*(1-pan); out[i:j,1]+=sig[:j-i]*g*pan
def pad(notes,start,dur):
    n=int(dur*SR); tt=np.arange(n)/SR
    env=np.minimum(1,tt/0.8)*np.minimum(1,(dur-tt)/0.9); env=np.clip(env,0,1)
    s=sum(np.sin(2*np.pi*hz(m)*tt)*0.6+np.sin(2*np.pi*hz(m)*1.003*tt)*0.4 for m in notes)/len(notes)
    add(s*env*0.16,start,0.5)
def bell(m,start,g=0.22,pan=0.5):
    n=int(2.2*SR); tt=np.arange(n)/SR
    s=(np.sin(2*np.pi*hz(m)*tt)+0.35*np.sin(2*np.pi*hz(m)*2*tt)+0.12*np.sin(2*np.pi*hz(m)*3.01*tt))*np.exp(-tt*2.6)*np.minimum(1,tt/0.004)
    add(s*g,start,pan)
def bass(m,start,dur,g=0.18):
    n=int(dur*SR); tt=np.arange(n)/SR
    s=np.sin(2*np.pi*hz(m)*tt)*np.minimum(1,tt/0.05)*np.exp(-tt*0.6)
    add(s*g,start)
beat=60/84  # 84bpm
bar=beat*4
# section A (problem/affinity) 0-12.3: softer, minor
progA=[(57,[57,60,64]),(53,[53,57,60]),(48,[55,60,64]),(55,[55,59,62])]   # Am F C G
progB=[(48,[55,60,64]),(55,[55,59,62]),(57,[57,60,64]),(53,[53,57,60])]   # C G Am F
tt0=0.0; k=0
while tt0<D:
    bright = tt0>=12.0
    root,ch=(progB if bright else progA)[k%4]
    dur=bar
    pad([c+12 for c in ch],tt0,dur+0.6)
    bass(root-12,tt0,dur,0.20 if bright else 0.14)
    arp=[ch[0]+24,ch[1]+24,ch[2]+24,ch[1]+24] if bright else [ch[0]+24,ch[2]+24]
    step=beat/2 if bright else beat
    for i in range(int(dur/step)):
        bell(arp[i%len(arp)],tt0+i*step,0.10 if bright else 0.08,0.35+0.3*(i%2))
    tt0+=dur; k+=1
# chimes at reveal and ending
for i,m in enumerate([84,88,91,96]): bell(m,12.3+i*0.07,0.16,0.3+0.13*i); bell(m,37.3+i*0.07,0.16,0.7-0.13*i)
# soft pops on entrances
for s in [0.7,4.1,5.1,6.1,8.8,30.9,31.6,32.3,34.6,35.0,35.4,38.1]: bell(91,s,0.07,0.5)
# simple stereo reverb (feedback delays)
rev=np.zeros_like(out)
for d,g in [(0.031,0.35),(0.047,0.3),(0.071,0.25),(0.113,0.2),(0.173,0.16),(0.251,0.12)]:
    k=int(d*SR); rev[k:,0]+=out[:-k,1]*g; rev[k:,1]+=out[:-k,0]*g
mix=out+rev*0.8
# fades
fade=np.ones(N); fi=int(0.4*SR); fo=int(2.2*SR)
fade[:fi]=np.linspace(0,1,fi); fade[-fo:]=np.linspace(1,0,fo)
mix*=fade[:,None]
mix/=np.max(np.abs(mix))*1.12
with wave.open('bgm.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype('<i2').tobytes())
print('ok')
