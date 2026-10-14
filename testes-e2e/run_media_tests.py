import os, shutil, subprocess, sys, time, urllib.request, struct, zlib
ROOT="/home/claude/ppv"; MEDIA=f"{ROOT}/public/media"; ENV={**os.environ,"PLAYWRIGHT_BROWSERS_PATH":"/opt/pw-browsers"}
def png(path,c):
    w,h=64,80; raw=b"".join(b"\x00"+bytes(list(c)*w) for _ in range(h))
    def ch(t,d):
        x=struct.pack(">I",len(d))+t+d; return x+struct.pack(">I",zlib.crc32(t+d)&0xffffffff)
    open(path,"wb").write(b"\x89PNG\r\n\x1a\n"+ch(b"IHDR",struct.pack(">IIBBBBB",w,h,8,2,0,0,0))+ch(b"IDAT",zlib.compress(raw))+ch(b"IEND",b""))
def mp4(path):
    subprocess.run(["ffmpeg","-loglevel","error","-y","-f","lavfi","-i","testsrc=duration=1:size=160x284:rate=10","-pix_fmt","yuv420p","-movflags","+faststart",path],check=True)
FIX=[]
def put(rel,kind,c=(30,160,220)):
    p=f"{MEDIA}/{rel}"; os.makedirs(os.path.dirname(p),exist_ok=True)
    (mp4 if kind=="mp4" else (lambda q: png(q,c)) if kind=="png" else (lambda q: open(q,"w").write("x")))(p); FIX.append(p)
for rel,kind in [("gallery/giro-360.mp4","mp4"),("gallery/giro-360.png","png"),("gallery/Pacote-Vid.MP4","mp4"),("gallery/espelho-provador.png","png"),("avatars/carolinaa.png","png"),("gallery/x.mov","txt"),
 ("styles/ugc.png","png"),("styles/pov.mp4","mp4"),("avatars/carolina.png","png"),("avatars/f-bia.png","png"),("avatars/m-joao-pedro.png","png"),("products/calca-feminina.png","png"),
 ("library/roupas-infantis.mp4","mp4"),("library/video-0.png","png"),("hacks/frutas-ex1.mp4","mp4"),("interactions/espelho.png","png"),("poses/cintura.png","png"),("hands/sem-maos.png","png")]: put(rel,kind)
def wait(url,t=60):
    for _ in range(t*2):
        try: urllib.request.urlopen(url,timeout=2); return True
        except Exception: time.sleep(0.5)
    return False
def run(cmd,env_extra,label):
    print(f"\n######## {label}",flush=True); r=subprocess.run(cmd,cwd="/home/claude",env={**ENV,**env_extra},capture_output=True,text=True,timeout=280)
    lines=[l for l in r.stdout.splitlines() if l.startswith(("FAIL","ALL OK","FAILED")) or "Traceback" in l or "Error" in l]; print("\n".join(lines) or r.stdout[-400:]+r.stderr[-400:],flush=True); return "ALL OK" in r.stdout
good=True
try:
    # 1) servidor de desenvolvimento
    dev=subprocess.Popen(["npx","vite","--config","vite.config.ts","--port","5190","--host","127.0.0.1","--strictPort"],cwd=ROOT,stdout=open("/tmp/dev_run.log","w"),stderr=subprocess.STDOUT,env=ENV)
    assert wait("http://127.0.0.1:5190/"), "dev não subiu"
    good&=run(["python3","e2e_media3.py"],{"APP_URL":"http://127.0.0.1:5190/","MEDIA_DIR":MEDIA,"WATCH":"1"},"DEV: mídia por caminho + observador + console")
    good&=run(["python3","e2e_trendly2.py"],{"APP_URL":"http://127.0.0.1:5190/"},"DEV: fluxos UGC/POV/Provador/avatares/produtos")
    dev.terminate(); dev.wait(timeout=10)
    # 2) build de produção com os mesmos arquivos
    b=subprocess.run(["npm","run","build"],cwd=ROOT,capture_output=True,text=True,env=ENV,timeout=200); print("\n######## build com fixtures:", "OK" if b.returncode==0 else "FALHOU\n"+b.stdout[-800:])
    wl=[l for l in (b.stdout+b.stderr).splitlines() if "media/" in l]; print("avisos do build:", wl)
    good&=b.returncode==0
    prev=subprocess.Popen(["npx","vite","preview","--config","vite.config.ts","--port","5191","--host","127.0.0.1","--strictPort"],cwd=ROOT,stdout=open("/tmp/prev_run.log","w"),stderr=subprocess.STDOUT,env=ENV)
    assert wait("http://127.0.0.1:5191/"), "preview não subiu"
    good&=run(["python3","e2e_media3.py"],{"APP_URL":"http://127.0.0.1:5191/","MEDIA_DIR":MEDIA},"PRODUÇÃO (preview): mídia por caminho + console")
    prev.terminate(); prev.wait(timeout=10)
    # 3) publicado em subcaminho, como o GitHub Pages
    shutil.rmtree("/tmp/site",ignore_errors=True); shutil.copytree(f"{ROOT}/dist","/tmp/site/meu-repo")
    srv=subprocess.Popen(["python3","-m","http.server","5192","--bind","127.0.0.1"],cwd="/tmp/site",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); assert wait("http://127.0.0.1:5192/meu-repo/")
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        br=pw.chromium.launch(); pg=br.new_page(); bad=[]; pg.on("response",lambda r: bad.append(f"{r.status} {r.url}") if r.status>=400 and "googleapis" not in r.url else None)
        pg.route("https://generativelanguage.googleapis.com/**",lambda r: r.fulfill(status=200,headers={"access-control-allow-origin":"*"},content_type="application/json",body='{"models":[{"name":"models/gemini-3.6-flash","supportedGenerationMethods":["generateContent"]}]}'))
        pg.goto("http://127.0.0.1:5192/meu-repo/"); pg.evaluate("localStorage.setItem('ppv:gemini-key','AIzaSyA1234567890abcdefghijklmnopqrstuv1')")
        pg.goto("http://127.0.0.1:5192/meu-repo/#/trendly/reels"); pg.reload(); pg.wait_for_selector(".tl-style img",timeout=15000)
        src="";loaded=False
        for _ in range(24):
            src=pg.locator(".tl-style img").first.evaluate("e=>e.currentSrc"); loaded=pg.locator(".tl-style img").first.evaluate("e=>e.naturalWidth>0")
            if src and loaded: break
            pg.wait_for_timeout(250)
        print("\n######## SUBCAMINHO (/meu-repo/): imagem em",src.split(':5192')[1],"| carregou:",loaded,"| respostas com erro:",bad or "nenhuma")
        good&=loaded and "/meu-repo/media/styles/ugc.png" in src and not bad; br.close()
    srv.terminate()
finally:
    for f in FIX:
        try: os.remove(f)
        except Exception: pass
    b=subprocess.run(["npm","run","build"],cwd=ROOT,capture_output=True,text=True,env=ENV,timeout=200)
    print("\n######## fixtures removidos; rebuild limpo:", "OK" if b.returncode==0 else "FALHOU", flush=True)
print("\nRESULTADO FINAL:", "TUDO OK" if good else "HOUVE FALHAS", flush=True)
