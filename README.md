# Cautious Telegram (prototype)

Début d'implémentation d'une app style Discord en modèle client/server.

## Ce qui est déjà construit

- Serveur Node.js + Express + Socket.IO
- Channels texte en temps réel (MVP)
- Historique en mémoire par channel
- API HTTP minimale pour lister/créer des channels
- **Scaffold de signalisation WebRTC** (`call:join`, `webrtc:signal`) pour préparer audio/vidéo/partage d'écran

## Lancer le projet

```bash
npm install
npm start
```

Puis ouvrir: <http://localhost:3000>

## Prochaines étapes vers l'objectif Discord-like

1. Persistance PostgreSQL (users/servers/channels/messages)
2. Auth JWT + permissions
3. SFU WebRTC (LiveKit/mediasoup) + TURN (coturn)
4. Screen share 1080p60 avec simulcast/SVC + adaptation bitrate
5. Observabilité (latence, packet loss, jitter, CPU)
