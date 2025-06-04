# Family Assistant Signaling Server

Minimal WebRTC signaling server för Family Assistant P2P sync.

## Lokal utveckling

```bash
cd signaling-server
npm install
npm run dev
```

Server körs på http://localhost:3000

## Deploy till Render (Gratis)

1. Skapa konto på [render.com](https://render.com)
2. Skapa ny "Web Service"
3. Koppla till din GitHub repo (eller skapa en ny)
4. Konfigurera:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Deploy!

Du får en URL som: `https://family-assistant-signal.onrender.com`

## Alternativ: Deploy till Railway

1. Gå till [railway.app](https://railway.app)
2. "Deploy from GitHub repo"
3. Välj repo och deploy

## Alternativ: Kör på Raspberry Pi hemma

```bash
# På din Pi
git clone [repo]
cd signaling-server
npm install
npm start
```

Sen port forward port 3000 i din router.

## API

Server hanterar bara WebSocket connections för WebRTC signaling:
- `join` - Gå med i familj
- `offer/answer` - WebRTC handshake
- `ice-candidate` - ICE candidates
- `user-joined/left` - Notifieringar

All faktisk data går direkt mellan peers via WebRTC!
