# Cloudflare setup — iHealth Hub (IG)

This guide is for **bringing the platform back online** after a few days away (for example when you open your PC again). Follow the steps **in order**. Your **public URL** is:

**https://app.ihealthhub.in**

That address reaches your machine through **Cloudflare Tunnel** (`cloudflared`). The app itself runs on your **desktop** (API + web UI on one port, usually **4000**).

---

## What you set up once (reference)

| Piece | Purpose |
|--------|--------|
| **Domain** | `ihealthhub.in` on Cloudflare (nameservers pointed to Cloudflare). |
| **Cloudflare Zero Trust** | Free plan; tunnel created (e.g. name `ihealth-home`). |
| **`cloudflared`** | Installed on Windows; **Windows service** “Cloudflared” runs the connector. |
| **Public hostname** | In the tunnel: **`app`** → **`ihealthhub.in`** → service **`http://localhost:4000`**. |
| **iHealth app** | From repo root: `npm run serve` builds the web app and starts the API on **port 4000**. |

---

## Cold start — check these in order

Do **not** skip steps; if something fails, fix it before moving on.

### 1. Machine and network

- [ ] Turn on the **PC** that hosts the app.
- [ ] Connect to the **internet** (Wi‑Fi or Ethernet).
- [ ] **Disable sleep** for long sessions if the PC used to go to sleep and drop connections (optional but helps).

### 2. Local app (iHealth)

- [ ] Open a terminal **as your normal user** (not necessarily Administrator).
- [ ] Go to your project folder, for example:
  ```bash
  cd D:\iHealth
  ```
- [ ] Install dependencies if you never did or after pulling changes:
  ```bash
  npm install
  ```
- [ ] Apply database migrations if the project was updated:
  ```bash
  npm run db:migrate
  ```
- [ ] Start the **single-port** app (builds web + API):
  ```bash
  npm run serve
  ```
- [ ] Leave this terminal **open** while the site should be live.

### 3. Confirm locally

- [ ] On the **same PC**, open a browser: **http://localhost:4000**
- [ ] You should see the iHealth Hub UI (sign-in, etc.).  
  If this fails, fix **localhost** first — the tunnel cannot work until the app responds here.

### 4. Cloudflare Tunnel (connector)

- [ ] **Windows service**: Press `Win + R`, type `services.msc`, find **Cloudflared** — status should be **Running**.  
  If it is **Stopped**, right‑click → **Start**. Set **Startup type** to **Automatic** if you want it after every reboot.
- [ ] **Alternative** (if you did not install a service): open **PowerShell**, `cd` to the folder with `cloudflared`, and run the **`tunnel run --token …`** command Cloudflare gave you (leave the window open).

### 5. Cloudflare dashboard (quick sanity check)

- [ ] Log in to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Connectors** → your tunnel.
- [ ] The connector should show **Connected** / healthy.

### 6. Public URL

- [ ] On **another device** (phone on **cellular** is a good test) or a browser: open  
  **https://app.ihealthhub.in**
- [ ] You should get the same app as localhost (sign-in page first, per current routing).

---

## If something is wrong

| Symptom | What to check |
|--------|----------------|
| **502 / Bad gateway** | `npm run serve` not running, or wrong port. Tunnel must point to **`http://localhost:4000`** (or whatever port the terminal prints). |
| **Tunnel disconnected** | Cloudflared service stopped — start it in **services.msc**, or run `cloudflared` manually again. |
| **DNS / does not load** | Domain still on Cloudflare; wait a few minutes after DNS changes. Confirm **Public hostname** `app.ihealthhub.in` exists on the tunnel. |
| **“Missing authorization” or API errors** | Sign in again; token is in browser **local storage** for the site origin. |

---

## Security reminders

- The **tunnel token** is sensitive — anyone with it could attach a connector to your tunnel. Do not share it or commit it to git.
- **Admin access** is controlled by your **database user role** and **seed** / account setup — not by Cloudflare alone.

---

## One-line summary

**PC on → `npm run serve` → localhost:4000 OK → Cloudflared running → open https://app.ihealthhub.in**

---

*Document version: written for iHealth Hub self-hosted + Cloudflare Tunnel. Update the public URL or paths if your deployment changes.*
