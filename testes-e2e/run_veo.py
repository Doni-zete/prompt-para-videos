import os, subprocess, sys, time, urllib.request
ROOT="/home/claude/ppv"; ENV={**os.environ,"PLAYWRIGHT_BROWSERS_PATH":"/opt/pw-browsers"}
def wait(url,t=60):
    for _ in range(t*2):
        try: urllib.request.urlopen(url,timeout=2); return True
        except Exception: time.sleep(0.5)
    return False
prev=None; good=False
try:
    b=subprocess.run(["npm","run","build"],cwd=ROOT,capture_output=True,text=True,env=ENV,timeout=250); assert b.returncode==0, b.stdout[-600:]
    prev=subprocess.Popen(["npx","vite","preview","--config","vite.config.ts","--port","5260","--host","127.0.0.1","--strictPort"],cwd=ROOT,stdout=open("/tmp/prev_veo.log","w"),stderr=subprocess.STDOUT,env=ENV)
    assert wait("http://127.0.0.1:5260/"),"preview não subiu"
    r=subprocess.run(["python3",os.environ.get("TEST_SCRIPT","e2e_veo.py")],cwd="/home/claude",env={**ENV,"APP_URL":"http://127.0.0.1:5260/"},capture_output=True,text=True,timeout=250)
    print(r.stdout[-6000:]); print(r.stderr[-900:]); good=("ALL OK" in r.stdout) or ("SHOTS OK" in r.stdout)
finally:
    if prev: prev.terminate(); prev.wait(timeout=10)
sys.exit(0 if good else 1)
