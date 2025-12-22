import asyncio
import json
import logging
from typing import Dict, Set
import websockets
from websockets.server import WebSocketServerProtocol
from websockets.exceptions import ConnectionClosedOK, ConnectionClosedError

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")

# oda -> bağlantı seti
ROOMS: Dict[str, Set[WebSocketServerProtocol]] = {}
# bağlantı -> meta (kullanıcı adı, oda)
CONN_META: Dict[WebSocketServerProtocol, Dict[str, str]] = {}

async def join_room(ws: WebSocketServerProtocol, room: str, username: str):
    if room not in ROOMS:
        ROOMS[room] = set()
    ROOMS[room].add(ws)
    CONN_META[ws] = {"room": room, "username": username}
    logging.info(f"{username} joined room={room}")
    await ws.send(json.dumps({
        "type": "system",
        "event": "joined",
        "room": room,
        "message": f"{username} odaya katıldı"
    }))

async def leave_room(ws: WebSocketServerProtocol):
    meta = CONN_META.get(ws)
    if not meta:
        return
    room = meta.get("room")
    username = meta.get("username")
    if room in ROOMS and ws in ROOMS[room]:
        ROOMS[room].remove(ws)
        if not ROOMS[room]:
            del ROOMS[room]
    del CONN_META[ws]
    logging.info(f"{username} left room={room}")

async def broadcast_to_room(room: str, payload: dict, exclude: WebSocketServerProtocol | None = None):
    targets = ROOMS.get(room, set()).copy()
    for peer in targets:
        if peer is exclude:
            continue
        try:
            await peer.send(json.dumps(payload))
        except Exception as e:
            logging.warning(f"broadcast error: {e}")

async def handler(ws: WebSocketServerProtocol):
    try:
        async for raw in ws:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send(json.dumps({"type":"error","message":"invalid json"}))
                continue

            mtype = msg.get("type")

            if mtype == "join":
                room = msg.get("room") or "general"
                username = msg.get("username") or "anon"
                await join_room(ws, room, username)
                continue

            if mtype == "chat":
                meta = CONN_META.get(ws)
                if not meta:
                    await ws.send(json.dumps({"type":"error","message":"join required"}))
                    continue
                room = meta["room"]
                username = meta["username"]

                # Sunucu ŞİFRE ÇÖZMEZ, sadece iletir.
                out = {
                    "type": "chat",
                    "room": room,
                    "from": username,
                    "cipher": msg.get("cipher"),  # { name: 'caesar', counter: n, ... }
                    "payload": msg.get("payload"), # base64 (şifreli baytlar)
                    "ts": msg.get("ts")
                }
                await broadcast_to_room(room, out, exclude=ws)
                continue

            if mtype == "signal":
                meta = CONN_META.get(ws)
                if not meta:
                    continue
                room = meta["room"]
                username = meta["username"]

                # Sinyali odadaki diğerlerine ilet
                out = {
                    "type": "signal",
                    "subtype": msg.get("subtype"), # 'pub_key' veya 'session_key'
                    "from": username,
                    "payload": msg.get("payload"),
                    "target": msg.get("target") # Eğer özel bir kişiye gidiyorsa (Opsiyonel)
                }
                await broadcast_to_room(room, out, exclude=ws)
                continue

            if mtype == "ping":
                await ws.send(json.dumps({"type":"pong"}))
                continue

            await ws.send(json.dumps({"type":"error","message":"unknown type"}))

    except (ConnectionClosedOK, ConnectionClosedError):
        pass
    finally:
        await leave_room(ws)

async def main():
    host = "127.0.0.1"
    port = 8765
    logging.info(f"WS relay starting at ws://{host}:{port}")
    async with websockets.serve(handler, host, port):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Bye")