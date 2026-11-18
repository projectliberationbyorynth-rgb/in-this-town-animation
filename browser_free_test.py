"""Browser-free, CPU-rendered 3D proof-of-concept (not final episode quality)."""
import os
import subprocess
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

HERE = Path(__file__).resolve().parent
WIDTH, HEIGHT, FPS, FRAMES = 640, 360, 12, 36

def cuboid(ax, x, y, z, sx, sy, sz, color):
    p = [(x-sx/2,y-sy/2,z), (x+sx/2,y-sy/2,z),
         (x+sx/2,y+sy/2,z), (x-sx/2,y+sy/2,z)]
    q = [(a,b,c+sz) for a,b,c in p]
    faces = [[p[k] for k in (0,1,2,3)], [q[k] for k in (0,1,2,3)]]
    for k in range(4):
        j=(k+1)%4
        faces.append([p[k],p[j],q[j],q[k]])
    ax.add_collection3d(Poly3DCollection(faces, facecolors=color, edgecolors='#353c50', linewidths=.65))

def frame(i):
    fig = plt.figure(figsize=(WIDTH/100, HEIGHT/100), dpi=100, facecolor='#b5ddf2')
    ax = fig.add_axes([0,0,1,1], projection='3d', computed_zorder=False)
    ax.set_facecolor('#b5ddf2')
    ax.view_init(elev=16, azim=-63+i*0.28)
    cuboid(ax,0,0,-.13,18,14,.12,'#9abb99')
    cuboid(ax,0,1,-.065,15,2.5,.08,'#b4b9af')
    for j,(x,c) in enumerate([(-5,'#edb7a4'),(-2.7,'#d4c3df'),(2.7,'#e5caa1'),(5,'#bbdbbd')]):
        cuboid(ax,x,4,0,1.9,1.9,2.7+(j%2)*.45,c)
        cuboid(ax,x,4,2.7+(j%2)*.45,2.1,2.1,.4,'#8b6571')
    t=i/(FRAMES-1)
    x=-2+2.4*t
    cuboid(ax,x,0,0,.5,.38,1.1,'#294866')  # Leo's shirt
    cuboid(ax,x,0,1.1,.78,.5,.72,'#ffd6b4') # head
    cuboid(ax,x-.2,0,1.83,.4,.54,.20,'#ed4c5b') # red hair
    cuboid(ax,x+.2,0,1.83,.4,.54,.20,'#26c586') # green hair
    swing=.15 if i%12<6 else -.15
    cuboid(ax,x-.17,0,0,.18,.28,.55+swing,'#294866')
    cuboid(ax,x+.17,0,0,.18,.28,.55-swing,'#294866')
    ax.text(x,0,2.35,'$0',color='#142539',fontsize=18,ha='center',weight='bold')
    ax.set(xlim=(-6.7,6.7),ylim=(-5,7),zlim=(0,6))
    ax.set_box_aspect((13.4,12,6))
    ax.set_axis_off()
    fig.canvas.draw()
    import numpy as np
    buffer=np.asarray(fig.canvas.buffer_rgba())[:,:,:3]
    plt.close(fig)
    return buffer.tobytes()

def main():
    target=HERE/'browser_free_3d_test.mp4'
    cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pixel_format','rgb24',
         '-video_size',f'{WIDTH}x{HEIGHT}','-framerate',str(FPS),'-i','-',
         '-c:v','libx264','-pix_fmt','yuv420p','-crf','22',str(target)]
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    try:
        for i in range(FRAMES):
            p.stdin.write(frame(i))
        p.stdin.close()
        if p.wait()!=0:
            raise RuntimeError('FFmpeg encoder failed')
    finally:
        if p.poll() is None:
            p.kill()
    print(target)

if __name__=='__main__':main()
