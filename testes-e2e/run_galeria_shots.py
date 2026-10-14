import os, subprocess, sys, time, urllib.request, struct, zlib
ROOT="/home/claude/ppv"; MEDIA=f"{ROOT}/public/media"; ENV={**os.environ,"PLAYWRIGHT_BROWSERS_PATH":"/opt/pw-browsers"}; FIX=[]
def png(path,c=(30,160,220)):
    w,h=64,80; raw=b"".join(b"\x00"+bytes(list(c)*w) for _ in range(h))
    def ch(t,d):
        x=struct.pack(">I",len(d))+t+d; return x+struct.pack(">I",zlib.crc32(t+d)&0xffffffff)
    open(path,"wb").write(b"\x89PNG\r\n\x1a\n"+ch(b"IHDR",struct.pack(">IIBBBBB",w,h,8,2,0,0,0))+ch(b"IDAT",zlib.compress(raw))+ch(b"IEND",b""))
def webm(path):
    subprocess.run(["ffmpeg","-loglevel","error","-y","-f","lavfi","-i","testsrc=duration=2:size=160x284:rate=10","-pix_fmt","yuv420p","-c:v","libvpx-vp9","-b:v","200k",path],check=True)
def put(rel,kind):
    p=f"{MEDIA}/{rel}"; os.makedirs(os.path.dirname(p),exist_ok=True); (webm if kind=="webm" else png)(p); FIX.append(p)
def wait(url,t=60):
    for _ in range(t*2):
        try: urllib.request.urlopen(url,timeout=2); return True
        except Exception: time.sleep(0.5)
    return False
dev=None; good=False
try:
    import colorsys
    def colorvid(path,hue):
        r,g,bl=[int(255*x) for x in colorsys.hsv_to_rgb(hue/360,0.55,0.55)]
        subprocess.run(["ffmpeg","-loglevel","error","-y","-f","lavfi","-i",f"color=c=0x{r:02x}{g:02x}{bl:02x}:s=180x290:d=2:r=10","-vf","drawbox=x='mod(t*70,150)':y=110:w=48:h=70:color=white@0.35:t=fill,drawbox=x=0:y=230:w=180:h=60:color=black@0.45:t=fill","-pix_fmt","yuv420p","-c:v","libvpx-vp9","-b:v","150k",path],check=True)
    ids=["movimento-natural","giro-360","olhar-lento","mao-cintura","foco-look","movimento-cabelo","tapar-camera","cta-apontar","cta-carrinho","dancinha","pov-capinha","pov-cabide","pov-sapatos","toque-tecido","destaque-tecido","espelho-relax","giro-lento-look","selfie-cabelo","revelacao","energia-alta","arrumando-cabelo","desvio-lateral"]
    for n,i in enumerate(ids):
        p=f"{MEDIA}/gallery/{i}.webm"; os.makedirs(os.path.dirname(p),exist_ok=True); colorvid(p,(n*37)%360); FIX.append(p)
    for i in ["meu-giro-lateral","unboxing-novo"]:
        p=f"{MEDIA}/gallery/{i}.webm"; colorvid(p,200 if i[0]=="m" else 20); FIX.append(p)

    dev=subprocess.Popen(["npx","vite","--config","vite.config.ts","--port","5301","--host","127.0.0.1","--strictPort"],cwd=ROOT,stdout=open("/tmp/dev_gal.log","w"),stderr=subprocess.STDOUT,env=ENV)
    assert wait("http://127.0.0.1:5301/"),"dev não subiu"
    r=subprocess.run(["python3",os.environ.get("TEST_SCRIPT","shots_galeria.py")],cwd="/home/claude",env={**ENV,"APP_URL":"http://127.0.0.1:5301/"},capture_output=True,text=True,timeout=280)
    print(r.stdout[-9000:]); print(r.stderr[-900:]); good=("ALL OK" in r.stdout) or ("SHOTS OK" in r.stdout)
finally:
    if dev: dev.terminate(); dev.wait(timeout=10)
    for f in FIX:
        try: os.remove(f)
        except Exception: pass
    print("exemplos removidos:",len(FIX))
sys.exit(0 if good else 1)
