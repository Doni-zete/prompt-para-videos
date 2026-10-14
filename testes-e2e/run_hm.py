import os, subprocess, sys, time, urllib.request, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont
ROOT="/home/claude/ppv"; MEDIA=f"{ROOT}/public/media/humano"; ENV={**os.environ,"PLAYWRIGHT_BROWSERS_PATH":"/opt/pw-browsers"}
FIX=[]; os.makedirs(MEDIA,exist_ok=True)
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def scene(w,h,realistic,seed=1):
    random.seed(seed); im=Image.new("RGB",(w,h)); d=ImageDraw.Draw(im)
    top,bot=((120,170,200),(235,200,190)) if not realistic else ((150,150,140),(110,100,95))
    for y in range(h):
        t=y/h; d.line([(0,y),(w,y)],fill=tuple(int(top[k]*(1-t)+bot[k]*t) for k in range(3)))
    # prédios ao fundo
    for i in range(7):
        x=int(i*w/6.5); d.rectangle([x,int(h*0.1),x+int(w/8),h],fill=((200,175,150) if not realistic else (120,105,92)))
    skin=(246,214,196) if not realistic else (214,170,146); cx,cy=w//2,int(h*0.42)
    d.ellipse([cx-int(w*.13),cy-int(h*.2),cx+int(w*.13),cy+int(h*.2)],fill=skin)
    d.ellipse([cx-int(w*.12),cy-int(h*.24),cx+int(w*.12),cy-int(h*.05)],fill=(70,40,30) if not realistic else (55,38,30))
    d.ellipse([cx-int(w*.2),cy+int(h*.18),cx+int(w*.2),h+int(h*.4)],fill=(20,110,120) if not realistic else (45,70,78))
    for ex in (-1,1): d.ellipse([cx+ex*int(w*.05)-9,cy-6,cx+ex*int(w*.05)+9,cy+6],fill=(40,30,25))
    if realistic:
        for _ in range(int(w*h/1800)): x,y=random.randrange(w),random.randrange(h); d.point((x,y),fill=(random.randint(60,200),)*3)
        for _ in range(26): x=cx+random.randint(-int(w*.1),int(w*.1)); y=cy+random.randint(-int(h*.15),int(h*.15)); d.ellipse([x-2,y-2,x+2,y+2],fill=(190,140,120))
        im=im.filter(ImageFilter.GaussianBlur(0.6))
    else: im=im.filter(ImageFilter.GaussianBlur(2.2))
    d=ImageDraw.Draw(im); d.text((14,h-26),"EXEMPLO · "+("realista" if realistic else "original"),font=ImageFont.truetype(FONT,16),fill="white")
    return im
def put(rel,im): p=f"{MEDIA}/{rel}"; im.save(p); FIX.append(p)
def wait(url,t=60):
    for _ in range(t*2):
        try: urllib.request.urlopen(url,timeout=2); return True
        except Exception: time.sleep(0.5)
    return False
dev=None; good=False
try:
    W,H=1280,720
    for name in ["padrao-video","padrao-imagem","vlog-caseiro"]:
        put(f"{name}-original.png",scene(W,H,False)); put(f"{name}-realista.png",scene(W,H,True))
    put("vlog-caseiro.png",scene(360,480,True,3)); put("selfie-espelho.png",scene(360,480,False,4))
    dev=subprocess.Popen(["npx","vite","--config","vite.config.ts","--port","5240","--host","127.0.0.1","--strictPort"],cwd=ROOT,stdout=open("/tmp/dev_hm.log","w"),stderr=subprocess.STDOUT,env=ENV)
    assert wait("http://127.0.0.1:5240/"),"dev não subiu"
    r=subprocess.run(["python3","e2e_hm.py"],cwd="/home/claude",env={**ENV,"APP_URL":"http://127.0.0.1:5240/"},capture_output=True,text=True,timeout=250)
    print(r.stdout[-4500:]); print(r.stderr[-700:]); good="ALL OK" in r.stdout
finally:
    if dev: dev.terminate(); dev.wait(timeout=10)
    for f in FIX:
        try: os.remove(f)
        except Exception: pass
    print("exemplos removidos:",len(FIX))
sys.exit(0 if good else 1)
