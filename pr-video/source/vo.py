import pyopenjtalk, numpy as np, wave, json, sys
M='/usr/share/hts-voice/nitech-jp-atr503-m001/nitech_jp_atr503_m001.htsvoice'
F='/usr/local/lib/python3.11/dist-packages/pyopenjtalk/htsvoice/mei_normal.htsvoice'
L=json.load(open('lines.json',encoding='utf-8'))
res=[]
E={}
for k,p in (('m',M),('f',F)): E[k]=pyopenjtalk.HTSEngine(p.encode())
for i,l in enumerate(L):
    e=E[l['who']]; e.set_speed(l.get('speed',1.0)); e.add_half_tone(l.get('tone',0.0))
    labels=pyopenjtalk.extract_fullcontext(l['text'])
    x=e.synthesize(labels); sr=e.get_sampling_frequency(); e.refresh()
    e.add_half_tone(-l.get('tone',0.0))
    x=np.asarray(x,dtype=np.float64); x=x/np.max(np.abs(x))*0.9
    # trim leading/trailing silence
    nz=np.where(np.abs(x)>0.02)[0]; x=x[max(0,nz[0]-200):nz[-1]+2000]
    with wave.open(f'vo/{i:02d}.wav','wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((x*32767).astype('<i2').tobytes())
    d=len(x)/sr
    print(f"{i:02d} {l['who']} {l['at']:5.2f}+{d:4.2f}={l['at']+d:5.2f} /{l['until']:5.2f} {'OVER' if l['at']+d>l['until'] else ''} {l['text']}")
