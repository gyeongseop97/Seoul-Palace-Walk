"""Usage: python bake-cheomseongdae-stone.py <heritage STL> <KHS 15165324 PNG> <output.webp>."""
import hashlib
import re
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

W,H=1024,896
reference=Path(sys.argv[2]).read_bytes()
# Coordinates below refer to the full-size 2,000 px render.
if hashlib.sha256(reference).hexdigest()!="3c71910974dc436ef807d5a2f93e9eb84cb793ab0dcd5dcae7437b3f5ac5dab2":
    raise ValueError("Use the original PNG downloaded from data.go.kr/data/15165324/fileData.do")
image=Image.open(sys.argv[2]).convert("RGB")
# Stone interiors exclude mortar, the window, the background and the silhouette.
patches=[(944,942,1050,969),(940,997,1056,1023),(926,1057,1004,1079),
         (970,1119,1071,1141),(916,1161,1033,1184),(970,1220,1050,1242),
         (958,1274,1050,1300),(1008,1327,1110,1347)]
def grain_sample(bounds):
    block=image.crop(bounds)
    # Remove the light gradient in the render. The game lights the geometry.
    smooth=block.filter(ImageFilter.GaussianBlur(7))
    detail=np.asarray(block,dtype=np.float32)-np.asarray(smooth,dtype=np.float32)
    stored=Image.fromarray(np.uint8(np.clip(128+detail,0,255)))
    stored=stored.resize((round(block.width*.62),round(block.height*.62)),Image.Resampling.LANCZOS)
    pixels=np.asarray(stored,dtype=np.float32)-128
    pixels=np.concatenate((pixels,pixels[:,::-1]),axis=1)
    return np.concatenate((pixels,pixels[::-1]),axis=0)
samples=[grain_sample(bounds) for bounds in patches]

def continuous_grain(height):
    gy,gx=np.mgrid[:height,:W]
    result=np.zeros((height,W,3),np.float32)
    for k,weight in [(0,.4),(3,.32),(6,.28)]:
        sample=samples[k]
        # An integral number of repeats wraps at the rear of the tower.
        sx=np.floor(gx*(round(W/sample.shape[1])*sample.shape[1]/W)).astype(int)
        result+=weight*sample[(gy+k*7)%sample.shape[0],sx%sample.shape[1]]
    return result
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
grain=continuous_grain(H)
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
        columns=np.arange(e,end)%W
        stone[first:last,columns]=rng.uniform(-10,10)
        sample=samples[rng.integers(len(samples))]
        ox,oy=rng.integers(sample.shape[1]),rng.integers(sample.shape[0])
        xx=(np.arange(end-e)+ox)%sample.shape[1]
        yy=(np.arange(last-first)+oy)%sample.shape[0]
        grain[first:last,columns]=sample[yy[:,None],xx[None,:]]
stone=blur(stone,1.55)
body=np.clip(230+grain*1.25+(stone-valley*220)[:,:,None],100,255).astype(np.uint8)
plain=np.clip(230+continuous_grain(128)*1.35,125,255).astype(np.uint8)
atlas=np.concatenate((plain,body))
Image.fromarray(atlas).save(sys.argv[3],quality=72,method=6)
