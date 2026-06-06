import socketio
import asyncio  # NEW: Required to fake the AI processing delay

# Initialize the Socket.IO server with ASGI support for FastAPI
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

active_users = {}
reverse_users = {} # To look up seat by socket_id
 

def get_partner_sid(sid):
    seat = reverse_users.get(sid)
    if not seat:
        return None
    partner = '14B' if seat == '12A' else '12A'
    return active_users.get(partner)
 
@sio.event
async def connect(sid, environ):
    print(f"🟢 Client Connected: {sid}")
@sio.event

async def disconnect(sid):
    print(f"🔴 Client Disconnected: {sid}")
    seat = reverse_users.get(sid)
    if seat:
        # UPDATED: Find the partner BEFORE deleting the user from the dictionary!
        partner = '14B' if seat == '12A' else '12A'
        partner_sid = active_users.get(partner)
        del active_users[seat]
        del reverse_users[sid]
        # Notify strictly the partner that this person disconnected
        if partner_sid:
            await sio.emit('partner_disconnected', to=partner_sid)
 
# ==========================================

# NEW: INITIAL REGISTRATION

# ==========================================

@sio.on('register_seat')
async def handle_register_seat(sid, seat):
    active_users[seat] = sid
    reverse_users[sid] = seat
    print(f"💺 Seat {seat} registered with SID: {sid}")
 
# ==========================================

# 1. MATCHMAKING HANDSHAKE

# ==========================================

@sio.on('request_match')
async def handle_request_match(sid, data):
    seat = data.get('seat')
    survey = data.get('survey')
    # Register the user who clicked "Find Match"
    active_users[seat] = sid
    reverse_users[sid] = seat
    print(f"🔍 Seat {seat} is looking for a match...")
    await asyncio.sleep(2.5)
 
    # For now, we statically route to the other seat
    target_seat = '14B' if seat == '12A' else '12A'
    target_sid = active_users.get(target_seat)
    if target_sid:
        print(f"💌 Sending match request to {target_seat}")
        await sio.emit('receive_match_request', {'fromSeat': seat}, to=target_sid)
    else:
        print(f"⚠️ Target seat {target_seat} is not online yet.")
 
@sio.on('respond_to_match')
async def handle_respond_to_match(sid, data):
    accept = data.get('accept')
    from_seat = data.get('fromSeat') # The person saying Yes/No
    to_seat = data.get('toSeat')     # The person who originally asked
    # Register the user who accepted/declined
    active_users[from_seat] = sid
    reverse_users[sid] = from_seat
    target_sid = active_users.get(to_seat)
    if target_sid:
        if accept:
            print(f"✅ Seat {from_seat} accepted the match with {to_seat}!")
            await sio.emit('match_request_accepted', to=target_sid)
        else:
            print(f"❌ Seat {from_seat} declined the match.")
            await sio.emit('match_request_declined', to=target_sid)

@sio.on('cancel_match_request')
async def handle_cancel_match_request(sid, data):
    seat = data.get('seat')
    target_seat = '14B' if seat == '12A' else '12A'
    target_sid = active_users.get(target_seat)
    
    if target_sid:
        print(f"🚫 Seat {seat} cancelled their match request.")
        # Tell the partner's screen to instantly close the request popup
        await sio.emit('match_request_cancelled', to=target_sid)
 
# ==========================================

# 2. CHAT & DRAWING SYNC

# ==========================================

@sio.on('send_message')
async def handle_send_message(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid:
        await sio.emit('receive_message', data.get('message'), to=partner_sid)
 
@sio.on('draw_stroke')

async def handle_draw_stroke(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid:
        await sio.emit('receive_draw', data.get('point'), to=partner_sid)

@sio.on('clear_board')
async def handle_clear_board(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid:
        await sio.emit('receive_clear_board', to=partner_sid)
 
@sio.on('send_guess')
async def handle_send_guess(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid:
        await sio.emit('receive_guess', data.get('guess'), to=partner_sid)
 
# ==========================================

# 3. GAME STATE & TURN LOCKS

# ==========================================

@sio.on('send_artillery_move')
async def handle_artillery_move(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid:
        await sio.emit('receive_artillery_move', data.get('move'), to=partner_sid)

@sio.on('send_artillery_position')
async def handle_artillery_position(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid:
        # Pass the new position (x coordinate) to the partner's screen
        await sio.emit('receive_artillery_position', data.get('position'), to=partner_sid)
 
@sio.on('game_session_update')
async def handle_session_update(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid:
        await sio.emit('partner_game_update', {
            'game': data.get('game'),
            'action': data.get('action')
        }, to=partner_sid)
 
    # If starting a game, reset the turn to whoever clicked start!
    if data.get('action') == 'start':
        seat = reverse_users.get(sid)
        # Send the turn lock to BOTH players so they sync up
        await sio.emit('turn_update', seat, to=sid)
        if partner_sid:
            await sio.emit('turn_update', seat, to=partner_sid)
 
# Custom event to let games manually switch turns

@sio.on('switch_turn')
async def handle_switch_turn(sid, data):
    next_seat = data.get('nextSeat')
    partner_sid = get_partner_sid(sid)
    # Emit the turn flip to both screens instantly
    await sio.emit('turn_update', next_seat, to=sid)
    if partner_sid:
        await sio.emit('turn_update', next_seat, to=partner_sid)
 