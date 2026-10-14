import os, subprocess, sys, time, urllib.request, struct, zlib
ROOT="/home/claude/ppv"; MEDIA=f"{ROOT}/public/media"; ENV={**os.environ,"PLAYWRIGHT_BROWSERS_PATH":"/opt/pw-browsers"}
FIX=[]
def png(path,c):
    w,h=64,80; raw=b"".join(b"\x00"+bytes(list(c)*w) for _ in range(h))
    def ch(t,d):
        x=struct.pack(">I",len(d))+t+d; return x+struct.pack(">I",zlib.crc32(t+d)&0xffffffff)
    open(path,"wb").write(b"\x89PNG\r\n\x1a\n"+ch(b"IHDR",struct.pack(">IIBBBBB",w,h,8,2,0,0,0))+ch(b"IDAT",zlib.compress(raw))+ch(b"IEND",b""))
def vid(path,codec):
    args=["ffmpeg","-loglevel","error","-y","-f","lavfi","-i","testsrc=duration=2:size=160x284:rate=10","-pix_fmt","yuv420p"]
    args+=(["-c:v","libvpx-vp9","-b:v","200k"] if codec=="webm" else ["-c:v","libx264","-movflags","+faststart"])+[path]
    subprocess.run(args,check=True)
def put(rel,kind,c=(30,160,220)):
    p=f"{MEDIA}/{rel}"; os.makedirs(os.path.dirname(p),exist_ok=True)
    {"webm":lambda:vid(p,"webm"),"mp4":lambda:vid(p,"mp4"),"png":lambda:png(p,c)}[kind](); FIX.append(p)
def wait(url,t=60):
    for _ in range(t*2):
        try: urllib.request.urlopen(url,timeout=2); return True
        except Exception: time.sleep(0.5)
    return False
dev=None; good=False
try:
    for rel,kind in [("styles/ugc.webm","webm"),("interactions/espelho.webm","webm"),("interactions/frontal.png","png"),("poses/corpo-inteiro.webm","webm"),("poses/corpo-inteiro.png","png"),("poses/cintura.mp4","mp4"),
                     ("hands/sem-maos.webm","webm"),("avatars/carolina.webm","webm"),("avatars/fernanda.webm","webm"),("avatars/fernanda.png","png"),("products/camera-wifi.webm","webm")]: put(rel,kind)
    dev=subprocess.Popen(["npx","vite","--config","vite.config.ts","--port","5210","--host","127.0.0.1","--strictPort"],cwd=ROOT,stdout=open("/tmp/dev_vi.log","w"),stderr=subprocess.STDOUT,env=ENV)
    assert wait("http://127.0.0.1:5210/"),"dev não subiu"
    r=subprocess.run(["python3","e2e_vi.py"],cwd="/home/claude",env={**ENV,"APP_URL":"http://127.0.0.1:5210/"},capture_output=True,text=True,timeout=270)
    print(r.stdout[-3500:]); print(r.stderr[-800:]); good="ALL OK" in r.stdout
finally:
    if dev: dev.terminate(); dev.wait(timeout=10)
    for f in FIX:
        try: os.remove(f)
        except Exception: pass
    print("exemplos removidos:",len(FIX))
sys.exit(0 if good else 1)
