import os, subprocess, sys, time, urllib.request
from PIL import Image, ImageDraw, ImageFont
ROOT="/home/claude/ppv"; MEDIA=ROOT+"/public/media"; ENV={**os.environ,"PLAYWRIGHT_BROWSERS_PATH":"/opt/pw-browsers"}; FIX=[]
def wait(url,t=60):
    for _ in range(t*2):
        try: urllib.request.urlopen(url,timeout=2); return True
        except Exception: time.sleep(0.5)
    return False
dev=None; good=False
try:
    os.makedirs(MEDIA+"/styles",exist_ok=True)
    import math
    def cover(name,c1,c2,txt,sub):
        im=Image.new("RGB",(900,1100)); d=ImageDraw.Draw(im)
        for y in range(1100):
            t=y/1100; d.line([(0,y),(900,y)],fill=tuple(int(c1[k]*(1-t)+c2[k]*t) for k in range(3)))
        d.ellipse([330,160,570,400],fill=(235,205,185)); d.ellipse([220,380,680,1200],fill=(70,55,95))
        F=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",64); G=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",30)
        d.text((450,900),txt,font=F,fill="white",anchor="mm"); d.text((450,980),sub,font=G,fill=(235,235,240),anchor="mm")
        p=MEDIA+f"/styles/{name}.png"; im.save(p); FIX.append(p)
    cover("ugc",(150,80,40),(30,20,20),"UGC","Avatar humanizado apresentando produtos")
    cover("pov",(160,40,110),(25,10,25),"POV","Vídeos em primeira pessoa")
    cover("provador",(90,50,170),(15,10,30),"Provador","Caimento da roupa em movimento")
    dev=subprocess.Popen(["npx","vite","--config","vite.config.ts","--port","5280","--host","127.0.0.1","--strictPort"],cwd=ROOT,stdout=open("/tmp/dev_layout.log","w"),stderr=subprocess.STDOUT,env=ENV)
    assert wait("http://127.0.0.1:5280/"),"dev não subiu"
    r=subprocess.run(["python3",os.environ.get("TEST_SCRIPT","e2e_layout.py")],cwd="/home/claude",env={**ENV,"APP_URL":"http://127.0.0.1:5280/"},capture_output=True,text=True,timeout=280)
    print(r.stdout[-7000:]); print(r.stderr[-900:]); good=("ALL OK" in r.stdout) or ("SHOTS OK" in r.stdout)
finally:
    if dev: dev.terminate(); dev.wait(timeout=10)
    for f in FIX:
        try: os.remove(f)
        except Exception: pass
sys.exit(0 if good else 1)
