import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
require('reflect-metadata');

const ROOT_DIR = path.resolve(process.cwd());
const EXPORTS_DIR = path.join(ROOT_DIR, 'exports');
const SCREENSHOTS_DIR =
  process.env.SCREENSHOTS_DIR || path.join(EXPORTS_DIR, 'visual-verification');

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function findBrowser() {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Aucun navigateur Chromium/Chrome/Edge trouvé sur le système.');
}

function createStaticServer(rootDir, { spaFallback = false, expoDynamicRoutes = false } = {}) {
  return http.createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', 'http://localhost');
    let relPath = decodeURIComponent(reqUrl.pathname).replace(/^\/+/, '');
    if (!relPath) relPath = 'index.html';

    const candidates = [path.join(rootDir, relPath)];
    if (!path.extname(relPath)) {
      candidates.push(path.join(rootDir, `${relPath}.html`));
      candidates.push(path.join(rootDir, relPath, 'index.html'));
    }

    if (expoDynamicRoutes) {
      if (relPath.startsWith('service/')) {
        candidates.push(path.join(rootDir, 'service', '[id].html'));
      } else if (relPath.startsWith('transaction/')) {
        candidates.push(path.join(rootDir, 'transaction', '[id].html'));
      }
    }

    if (spaFallback) {
      candidates.push(path.join(rootDir, 'index.html'));
    }

    let chosen = null;
    for (const c of candidates) {
      const resolved = path.resolve(c);
      if (resolved.startsWith(path.resolve(rootDir)) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        chosen = resolved;
        break;
      }
    }

    if (!chosen) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Not Found: ${relPath}`);
      return;
    }

    const ext = path.extname(chosen).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(chosen).pipe(res);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', (e) => reject(e.error || new Error('CDP WS open error')), {
        once: true,
      });
    });

    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id !== undefined) {
        const entry = this.pending.get(msg.id);
        if (entry) {
          this.pending.delete(msg.id);
          if (msg.error) {
            entry.reject(new Error(`${msg.error.message} (${msg.error.code})`));
          } else {
            entry.resolve(msg.result);
          }
        }
      } else if (msg.method) {
        const key = `${msg.sessionId || ''}:${msg.method}`;
        const set = this.listeners.get(key);
        if (set) {
          for (const fn of set) fn(msg.params);
        }
      }
    });
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }

  on(method, fn, sessionId = '') {
    const key = `${sessionId}:${method}`;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key).add(fn);
    return () => this.listeners.get(key)?.delete(fn);
  }

  close() {
    this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function launchChrome() {
  const browserPath = findBrowser();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paiementbj-cdp-'));
  const proc = spawn(
    browserPath,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      '--disable-background-timer-throttling',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );

  const wsUrl = await new Promise((resolve, reject) => {
    let stderr = '';
    const timer = setTimeout(() => {
      reject(new Error(`Timeout lancement Chrome headless. Stderr:\n${stderr}`));
    }, 15000);

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });

    proc.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome arrêté prématurément (code ${code}). Stderr:\n${stderr}`));
    });
  });

  return { proc, wsUrl, userDataDir };
}

async function runCheck(cdp, sessionId, config) {
  const { name, url, viewport, screenshotName, customStep } = config;
  await cdp.send(
    'Emulation.setDeviceMetricsOverride',
    {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.dpr || 2,
      mobile: Boolean(viewport.mobile),
    },
    sessionId
  );

  const consoleErrors = [];
  const exceptions = [];
  const httpErrors = [];
  const failedRequests = [];
  const reqUrls = new Map();

  const offLog = cdp.on(
    'Runtime.consoleAPICalled',
    (params) => {
      if (params.type === 'error') {
        const txt = (params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        consoleErrors.push(txt);
      }
    },
    sessionId
  );
  const offExc = cdp.on(
    'Runtime.exceptionThrown',
    (params) => {
      const msg = params.exceptionDetails?.exception?.description || params.exceptionDetails?.text;
      exceptions.push(msg);
    },
    sessionId
  );
  const offReq = cdp.on(
    'Network.requestWillBeSent',
    (params) => {
      reqUrls.set(params.requestId, params.request.url);
    },
    sessionId
  );
  const offResp = cdp.on(
    'Network.responseReceived',
    (params) => {
      const respUrl = params.response.url;
      if (params.response.status >= 400 && respUrl.startsWith('http://localhost')) {
        httpErrors.push(`${params.response.status} ${respUrl}`);
      }
    },
    sessionId
  );
  const offFail = cdp.on(
    'Network.loadingFailed',
    (params) => {
      const failedUrl = reqUrls.get(params.requestId) || params.requestId;
      if (failedUrl.startsWith('http://localhost')) {
        failedRequests.push(`${params.errorText} ${failedUrl}`);
      }
    },
    sessionId
  );

  try {
    let loaded = false;
    const offLoad = cdp.on(
      'Page.loadEventFired',
      () => {
        loaded = true;
      },
      sessionId
    );
    await cdp.send('Page.navigate', { url }, sessionId);
    const start = Date.now();
    while (!loaded && Date.now() - start < 15000) {
      await sleep(50);
    }
    offLoad();

    // Attendre que les indicateurs de chargement initiaux disparaissent (max 8s)
    const spinStart = Date.now();
    while (Date.now() - spinStart < 8000) {
      const spinRes = await cdp.send(
        'Runtime.evaluate',
        {
          returnByValue: true,
          expression: `(() => {
            const text = (document.body?.innerText || '').trim();
            const isLoading =
              text.includes('Chargement du catalogue') ||
              text.includes('Chargement des paramètres') ||
              text.includes('Chargement des services');
            return text.length > 40 && !isLoading;
          })()`,
        },
        sessionId
      );
      if (spinRes.result?.value) break;
      await sleep(120);
    }

    if (customStep) {
      await customStep(cdp, sessionId);
    }

    // Attendre le décodage des <img> ET précharger les background-image (React Native Web <Image>)
    await sleep(300);
    const evalRes = await cdp.send(
      'Runtime.evaluate',
      {
        returnByValue: true,
        awaitPromise: true,
        expression: `(async () => {
          await document.fonts?.ready;
          const imgs = Array.from(document.images || []);
          await Promise.all(
            imgs.map((img) =>
              img.complete
                ? Promise.resolve()
                : new Promise((res) => {
                    img.addEventListener('load', res, { once: true });
                    img.addEventListener('error', res, { once: true });
                    setTimeout(res, 4000);
                  })
            )
          );
          const bgUrls = new Set();
          for (const el of Array.from(document.querySelectorAll('*'))) {
            const bg = window.getComputedStyle(el).backgroundImage;
            if (bg && bg !== 'none') {
              const matches = bg.matchAll(/url\\(["']?([^"')]+)["']?\\)/g);
              for (const m of matches) {
                if (m[1] && !m[1].startsWith('data:')) bgUrls.add(m[1]);
              }
            }
          }
          const brokenBgImages = [];
          await Promise.all(
            Array.from(bgUrls).map(
              (src) =>
                new Promise((res) => {
                  const probe = new Image();
                  probe.onload = () => res();
                  probe.onerror = () => {
                    brokenBgImages.push(src);
                    res();
                  };
                  probe.src = src;
                  setTimeout(res, 4000);
                })
            )
          );
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const brokenImages = imgs
            .filter((img) => !img.complete || img.naturalWidth === 0)
            .map((img) => img.src);
          const svgs = Array.from(document.querySelectorAll('svg')).length;
          const text = (document.body?.innerText || '').trim();
          const overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          return {
            title: document.title,
            textLen: text.length,
            snippet: text.replace(/\\s+/g, ' ').slice(0, 220),
            totalImages: imgs.length + bgUrls.size,
            brokenImages: [...brokenImages, ...brokenBgImages],
            svgCount: svgs,
            overflowX,
            rootChildCount: document.getElementById('root')?.childElementCount ?? document.body.childElementCount,
          };
        })()`,
      },
      sessionId
    );

    const metrics = evalRes.result.value;
    const shot = await cdp.send(
      'Page.captureScreenshot',
      { format: 'png' },
      sessionId
    );
    const outPath = path.join(SCREENSHOTS_DIR, `${screenshotName}.png`);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));

    const filteredConsoleErrors = consoleErrors.filter(
      (e) => !e.includes('fonts.googleapis.com') && !e.includes('fonts.gstatic.com')
    );

    let fullTextOk = true;
    if (config.mustContain?.length) {
      const fullRes = await cdp.send(
        'Runtime.evaluate',
        { returnByValue: true, expression: `document.body?.innerText || ''` },
        sessionId
      );
      const fullText = fullRes.result?.value || '';
      fullTextOk = config.mustContain.every((needle) => fullText.includes(needle));
    }

    const ok =
      exceptions.length === 0 &&
      filteredConsoleErrors.length === 0 &&
      httpErrors.length === 0 &&
      failedRequests.length === 0 &&
      metrics.brokenImages.length === 0 &&
      metrics.textLen > 40 &&
      metrics.overflowX <= 4 &&
      fullTextOk;

    return {
      name,
      url,
      ok,
      fullTextOk,
      screenshot: outPath,
      viewport,
      metrics,
      exceptions,
      consoleErrors: filteredConsoleErrors,
      httpErrors,
      failedRequests,
    };
  } finally {
    offLog();
    offExc();
    offReq();
    offResp();
    offFail();
  }
}

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require(path.join(EXPORTS_DIR, 'paiementbj-api', 'dist', 'src', 'app.module.js'));
  const { configureApp } = require(path.join(EXPORTS_DIR, 'paiementbj-api', 'dist', 'src', 'app.setup.js'));
  const { hashPasswordScrypt } = require(
    path.join(EXPORTS_DIR, 'paiementbj-api', 'dist', 'src', 'common', 'password-hash.util.js')
  );

  const adminEmail = 'admin@paiement.bj';
  const adminPass = 'AdminVisualVerify2026!';
  process.env.NODE_ENV = 'test';
  process.env.API_PREFIX = 'v1';
  process.env.DATABASE_URL = 'postgresql://disabled:disabled@127.0.0.1:1/disabled?connect_timeout=1';
  process.env.JWT_ACCESS_SECRET = 'visual-verify-jwt-secret-paiementbj-64-chars-minimum-ok-0123';
  process.env.ADMIN_BOOTSTRAP_EMAIL = adminEmail;
  process.env.ADMIN_BOOTSTRAP_PASSWORD_HASH = hashPasswordScrypt(adminPass);
  process.env.ADMIN_BOOTSTRAP_NAME = 'Gouvernance Paiement BJ';
  process.env.ADMIN_BOOTSTRAP_ROLE = 'SUPERADMIN';

  const apiApp = await NestFactory.create(AppModule, { rawBody: true, logger: false });
  configureApp(apiApp);
  await apiApp.listen(4000, '127.0.0.1');

  const webServer = createStaticServer(path.join(EXPORTS_DIR, 'paiementbj-web'), {
    expoDynamicRoutes: true,
    spaFallback: true,
  });
  const adminServer = createStaticServer(path.join(EXPORTS_DIR, 'paiementbj-admin'), {
    spaFallback: true,
  });
  const distServer = createStaticServer(path.join(EXPORTS_DIR, 'paiementbj-distribution'), {
    spaFallback: true,
  });

  await new Promise((r) => webServer.listen(4101, '127.0.0.1', r));
  await new Promise((r) => adminServer.listen(4102, '127.0.0.1', r));
  await new Promise((r) => distServer.listen(4103, '127.0.0.1', r));

  const chrome = await launchChrome();
  const cdp = new CdpClient(chrome.wsUrl);
  await cdp.connect();

  try {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Network.enable', {}, sessionId);

    const mobileVp = { width: 390, height: 844, dpr: 2, mobile: true };
    const desktopVp = { width: 1440, height: 900, dpr: 1, mobile: false };

    const waitForSelector = async (client, sid, selector, timeoutMs = 10000) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const res = await client.send(
          'Runtime.evaluate',
          { returnByValue: true, expression: `Boolean(document.querySelector(${JSON.stringify(selector)}))` },
          sid
        );
        if (res.result?.value) return true;
        await sleep(120);
      }
      return false;
    };

    const checks = [
      {
        name: 'Web Citoyen — Accueil (Mobile 390x844)',
        url: 'http://localhost:4101/',
        viewport: mobileVp,
        screenshotName: '01_web_citizen_home_mobile',
        mustContain: ['Paiement BJ', 'Services les plus demandés', 'SBEE'],
      },
      {
        name: 'Web Citoyen — Accueil (Desktop 1440x900)',
        url: 'http://localhost:4101/',
        viewport: desktopVp,
        screenshotName: '02_web_citizen_home_desktop',
        mustContain: ['Paiement BJ', 'Convention en attente'],
      },
      {
        name: 'Web Citoyen — Catalogue Services (Mobile)',
        url: 'http://localhost:4101/services',
        viewport: mobileVp,
        screenshotName: '03_web_citizen_services',
        mustContain: ['Catalogue des Services', 'SBEE', 'SONEB', 'Convention en attente'],
      },
      {
        name: 'Web Citoyen — Formulaire SBEE (Mobile)',
        url: 'http://localhost:4101/service/srv_sbee_prepaye',
        viewport: mobileVp,
        screenshotName: '04_web_citizen_sbee',
        mustContain: ['SBEE', 'Test Sandbox'],
      },
      {
        name: 'Web Citoyen — Service bloqué SONEB honnête (Mobile)',
        url: 'http://localhost:4101/service/srv_soneb_facture',
        viewport: mobileVp,
        screenshotName: '05_web_citizen_soneb_blocked',
        mustContain: ['SONEB', 'Convention en attente'],
      },
      {
        name: 'Web Citoyen — Connexion +229 & Consentement APDP (Mobile)',
        url: 'http://localhost:4101/auth',
        viewport: mobileVp,
        screenshotName: '06_web_citizen_auth',
        mustContain: ['+229'],
      },
      {
        name: 'Web Citoyen — Assistance & Réclamations (Mobile)',
        url: 'http://localhost:4101/support',
        viewport: mobileVp,
        screenshotName: '07_web_citizen_support',
        mustContain: ['Assistance'],
      },
      {
        name: 'Web Citoyen — Profil & Accessibilité (Mobile)',
        url: 'http://localhost:4101/profile',
        viewport: mobileVp,
        screenshotName: '08_web_citizen_profile',
        mustContain: ['Profil Citoyen'],
      },
      {
        name: 'Back-Office Admin — Connexion RBAC (Desktop)',
        url: 'http://localhost:4102/',
        viewport: desktopVp,
        screenshotName: '09_web_admin_login',
        mustContain: ['Back-Office Gouvernance'],
      },
      {
        name: 'Back-Office Admin — Tableau de bord authentifié (Desktop)',
        url: 'http://localhost:4102/',
        viewport: desktopVp,
        screenshotName: '10_web_admin_dashboard',
        mustContain: ['Tableau de bord de gouvernance', 'État réel des passerelles partenaires'],
        customStep: async (client, sid) => {
          await client.send(
            'Runtime.evaluate',
            {
              awaitPromise: true,
              expression: `(() => {
                const emailInput = document.querySelector('input[type="email"]');
                const passInput = document.querySelector('input[type="password"]');
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                setter.call(emailInput, ${JSON.stringify(adminEmail)});
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                setter.call(passInput, ${JSON.stringify(adminPass)});
                passInput.dispatchEvent(new Event('input', { bubbles: true }));
                document.querySelector('form button[type="submit"]').click();
              })()`,
            },
            sid
          );
          await waitForSelector(client, sid, '.admin-sidebar', 10000);
          await sleep(500);
        },
      },
      {
        name: 'Back-Office Admin — Gouvernance Catalogue Services (Desktop)',
        url: 'http://localhost:4102/',
        viewport: desktopVp,
        screenshotName: '11_web_admin_catalog',
        mustContain: ['Catalogue', 'SBEE', 'SONEB'],
        customStep: async (client, sid) => {
          await waitForSelector(client, sid, '.admin-sidebar nav button', 10000);
          await client.send(
            'Runtime.evaluate',
            {
              expression: `(() => {
                const btns = Array.from(document.querySelectorAll('nav button'));
                const catBtn = btns.find((b) => b.textContent.includes('Catalogue'));
                if (catBtn) catBtn.click();
              })()`,
            },
            sid
          );
          await sleep(600);
        },
      },
      {
        name: 'API Backend — Documentation OpenAPI Swagger (Desktop)',
        url: 'http://localhost:4000/api/docs',
        viewport: desktopVp,
        screenshotName: '12_api_swagger_docs',
        mustContain: ['Paiement BJ — API Interopérabilité'],
      },
      {
        name: 'Portail Distribution Stores — Vue Desktop (1440x900)',
        url: 'http://localhost:4103/',
        viewport: desktopVp,
        screenshotName: '13_web_distribution_desktop',
        mustContain: [
          'Paiement BJ',
          'Google Play',
          'App Store',
          'Un seul point d’accès',
          'Zéro portefeuille interne',
          'Justificatifs centralisés',
        ],
      },
      {
        name: 'Portail Distribution Stores — Vue Mobile (390x844)',
        url: 'http://localhost:4103/',
        viewport: mobileVp,
        screenshotName: '14_web_distribution_mobile',
        mustContain: ['Paiement BJ', 'Google Play', 'App Store', 'bj.paiement.app'],
      },
      {
        name: 'Portail Distribution Stores — Modale honnête Google Play (Desktop)',
        url: 'http://localhost:4103/',
        viewport: desktopVp,
        screenshotName: '15_web_distribution_modal',
        mustContain: ['Google Play — Publication en cours de préparation', 'bj.paiement.app'],
        customStep: async (client, sid) => {
          await client.send(
            'Runtime.evaluate',
            {
              expression: `(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const playBtn = btns.find((b) => b.textContent.includes('Google Play'));
                if (playBtn) playBtn.click();
              })()`,
            },
            sid
          );
          await waitForSelector(client, sid, '[role="dialog"]', 5000);
          await sleep(250);
        },
      },
    ];

    const results = [];
    for (const check of checks) {
      const res = await runCheck(cdp, sessionId, check);
      results.push(res);
      console.log(
        `${res.ok ? 'PASS' : 'FAIL'} | ${res.name} | text=${res.metrics.textLen} | imgs=${res.metrics.totalImages} (broken=${res.metrics.brokenImages.length}) | overflowX=${res.metrics.overflowX}`
      );
      if (!res.ok) {
        console.error('  Détails échec:', JSON.stringify(res, null, 2));
      }
    }

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'visual-report.json'),
      JSON.stringify(results, null, 2),
      'utf8'
    );

    const allOk = results.every((r) => r.ok);
    if (!allOk) {
      process.exitCode = 1;
    }
  } finally {
    await cdp.send('Browser.close').catch(() => {});
    cdp.close();
    if (!chrome.proc.killed) {
      chrome.proc.kill('SIGKILL');
    }
    await sleep(250);
    try {
      fs.rmSync(chrome.userDataDir, { recursive: true, force: true });
    } catch {
      // Chrome sur Windows peut maintenir brièvement un verrou sur Crashpad/metrics
    }
    webServer.close();
    adminServer.close();
    distServer.close();
    await apiApp.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
