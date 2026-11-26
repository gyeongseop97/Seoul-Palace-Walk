"""python scripts/bake-cheomseongdae-stone.py <heritage STL> <output.webp>; needs NumPy and Pillow."""
import re
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

W,H=1024,896
source=Path(sys.argv[1]).read_text()
raw=np.fromstring(" ".join(re.findall(r"vertex\s+([^\n]+)",source)),sep=" ").reshape(-1,3,3)
raw=raw[(raw[:,:,2]<20400).all(axis=1)]
p=(raw-[28853.2265625,-20087.1835938,17438.64208985])*(9.17/9259.7558594)
x,y,z=p.transpose(2,0,1)
x,z=np.cos(.105)*x+np.sin(.105)*z,-np.sin(.105)*x+np.cos(.105)*z
u=(np.arctan2(x,z)/(2*np.pi)+.5)*W
u=np.where((np.ptp(u,axis=1)[:,None]>W/2)&(u<W/2),u+W,u)
row=(1-y/9.17)*(H-1)
r=np.hypot(x,z)
depth=np.zeros((H,W),dtype=np.float32)
for us,vs,rs in zip(u,row,r):
    ux,uy=us[1:]-us[0];vx,vy=vs[1:]-vs[0];det=ux*vy-uy*vx
    if abs(det)<1e-7:continue
    xmin,xmax=int(np.ceil(us.min())),int(np.floor(us.max()))
    ymin,ymax=max(0,int(np.ceil(vs.min()))),min(H-1,int(np.floor(vs.max())))
    if xmax<xmin or ymax<ymin:continue
    iy,ix=np.mgrid[ymin:ymax+1,xmin:xmax+1]
    a=((ix-us[0])*vy-(iy-vs[0])*uy)/det;b=((iy-vs[0])*ux-(ix-us[0])*vx)/det
    mask=(a>=0)&(b>=0)&(a+b<=1)
    value=rs[0]+a*(rs[1]-rs[0])+b*(rs[2]-rs[0])
    tid=(iy[mask],ix[mask]%W);depth[tid]=np.maximum(depth[tid],value[mask])

def blur(field,size):
    lo,hi=field.min(),field.max()
    if hi-lo<1e-8:return field
    pad=int(size*3)+1
    scaled=np.uint8(np.clip((field-lo)/(hi-lo)*255,0,255))
    wrap=np.pad(scaled,((0,0),(pad,pad)),mode="wrap")
    return lo+(hi-lo)*(np.asarray(Image.fromarray(wrap).filter(ImageFilter.GaussianBlur(size)))[:,pad:-pad]/255)

# The relief is the measured outermost radius at each angle and height. Remove
# the taper before enhancing local recessed joints, keeping their true positions.
profile=np.median(depth,axis=1,keepdims=True)
valid=profile[:,0]>.4
profile[:,0]=np.interp(np.arange(H),np.flatnonzero(valid),profile[valid,0])
relief=np.clip(np.where(depth>.4,depth,profile)-profile,-.17,.17)
valley=np.clip((blur(relief,4)-relief)*1.4+(blur(relief,13)-relief)*.55,0,.12)
row_score=np.quantile(valley,.68,axis=1)
def pix(height):return round((1-height/9.17)*(H-1))
rng=np.random.default_rng(9217)
stone=np.zeros((H,W),dtype=np.float32)
rows=[pix(8.22)]
for guess in np.linspace(8.22,.51,28)[1:-1]:
    j=pix(guess);near=np.arange(max(rows[-1]+16,j-9),j+10)
    rows.append(int(near[np.argmax(row_score[near])]))
rows.append(pix(.51))
for i,(first,last) in enumerate(zip(rows,rows[1:])):
    score=np.mean(valley[first+3:last-3],axis=0)
    count=round(float(profile[(first+last)//2,0])*2*np.pi/.77)
    step=W/count
    edges=[]
    for j in range(count):
        guess=(j+.48*(i%2))*step
        candidates=np.arange(round(guess-step*.33),round(guess+step*.33))
        edges.append(int(candidates[np.argmax(score[candidates%W])]))
    for j,e in enumerate(edges):
        end=edges[j+1] if j+1<count else edges[0]+W
        stone[first:last,np.arange(e,end)%W]=rng.uniform(-16,15)
stone=blur(stone,1.55)
def clouds(gridx,gridy):
    seed=rng.integers(0,256,(gridy,gridx),dtype=np.uint8)
    # Periodic in azimuth.
    tile=Image.fromarray(np.column_stack((seed[:,-1],seed,seed[:,0]))).resize((W+2*W//gridx,H),Image.Resampling.BICUBIC)
    return (np.asarray(tile)[:,W//gridx:W//gridx+W].astype(np.float32)-127)/65
large=clouds(36,37);small=clouds(129,137);lichen=clouds(51,57)
grit=rng.normal(0,3.15,(H,W))
weather=np.maximum(0,lichen-.65)*np.linspace(.45,1.4,H)[:,None]
grain=large*5.6+small*3.4+grit+stone-valley*275
channels=[np.clip(232+grain+weather*channel,105,255) for channel in [-4,-4,-11]]
body=np.stack(channels,axis=-1).astype(np.uint8)
plain=np.clip(230+large[:128]*6+small[:128]*5+grit[:128],155,255).astype(np.uint8)
atlas=np.concatenate((np.repeat(plain[:,:,None],3,axis=2),body))
Image.fromarray(atlas).save(sys.argv[2],quality=89,method=6)
