import cv2,sys,glob,os
k,n=int(sys.argv[1]),int(sys.argv[2])
sr=cv2.dnn_superres.DnnSuperResImpl_create();sr.readModel('FSRCNN_x4.pb');sr.setModel('fsrcnn',4)
for i,p in enumerate(sorted(glob.glob('praw/*.png'))):
    if i%n!=k: continue
    o='pf/'+os.path.basename(p)
    if os.path.exists(o): continue
    up=sr.upsample(cv2.imread(p)); cv2.imwrite(o,cv2.resize(up,(1501,685),interpolation=cv2.INTER_AREA))
