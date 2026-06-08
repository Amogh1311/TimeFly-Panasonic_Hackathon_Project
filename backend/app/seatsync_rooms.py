import socketio
import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from ai_layer.cosine_matchmaker import calculate_match_score

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# --- THE LOBBY DATABASES ---
active_users = {}        # Maps seat -> socket_id
reverse_users = {}       # Maps socket_id -> seat
submitted_surveys = {}   # Maps seat -> survey_data (Acts like your JSON file)
waiting_pool = set()     # Set of seats currently looking for a match
active_matches = {}      # Maps seat_A -> seat_B (Bi-directional)


def get_partner_sid(sid):
    seat = reverse_users.get(sid)
    if not seat: return None
    partner_seat = active_matches.get(seat)
    if partner_seat: return active_users.get(partner_seat)
    return None

async def trigger_matchmaking_sweep():
    """
    The Brain of the Lobby. Sweeps the waiting pool, finds the best pairs, 
    and groups them up automatically. Leaves the odd-ones-out pending!
    """
    if len(waiting_pool) < 2:
        return # Not enough people to make a match yet

    best_score = -1
    best_pair = (None, None)

    # Compare everyone currently in the waiting pool
    waiting_list = list(waiting_pool)
    for i in range(len(waiting_list)):
        for j in range(i + 1, len(waiting_list)):
            seat1 = waiting_list[i]
            seat2 = waiting_list[j]
            score = calculate_match_score(submitted_surveys[seat1], submitted_surveys[seat2])
            
            if score > best_score:
                best_score = score
                best_pair = (seat1, seat2)

    seat_A, seat_B = best_pair
    if seat_A and seat_B:
        print(f"🎯 Auto-Sweep paired {seat_A} and {seat_B} (Score: {best_score}%)")
        
        # Remove them from the pool so they don't get double-booked
        waiting_pool.remove(seat_A)
        waiting_pool.remove(seat_B)

        # Send the popup request to Seat B
        sid_B = active_users.get(seat_B)
        if sid_B:
            await sio.emit('receive_match_request', {'fromSeat': seat_A, 'score': best_score}, to=sid_B)

# ==========================================
# SOCKET EVENTS
# ==========================================
@sio.event
async def connect(sid, environ):
    print(f"🟢 Client Connected: {sid}")

@sio.event
async def disconnect(sid):
    seat = reverse_users.get(sid)
    if seat:
        partner_seat = active_matches.get(seat)
        partner_sid = active_users.get(partner_seat) if partner_seat else None

        # Clean up memory
        if seat in active_users: del active_users[seat]
        if sid in reverse_users: del reverse_users[sid]
        if seat in waiting_pool: waiting_pool.remove(seat)
        
        # Break active links
        if seat in active_matches:
            del active_matches[seat]
            if partner_seat in active_matches:
                del active_matches[partner_seat]
                # FIX: We deleted the line that forced the partner back into the pool here!

        if partner_sid:
            await sio.emit('partner_disconnected', to=partner_sid)

@sio.on('register_seat')
async def handle_register_seat(sid, seat):
    active_users[seat] = sid
    reverse_users[sid] = seat

# 1. NEW: STEP ONE - SUBMIT
@sio.on('submit_survey')
async def handle_submit_survey(sid, data):
    seat = data.get('seat')
    survey = data.get('survey')
    submitted_surveys[seat] = survey
    print(f"📝 Seat {seat} saved their profile to the database.")

# 2. NEW: STEP TWO - FIND MATCH
@sio.on('request_match')
async def handle_request_match(sid, data):
    seat = data.get('seat')
    # Re-register just in case
    active_users[seat] = sid
    reverse_users[sid] = seat
    
    waiting_pool.add(seat)
    print(f"🔍 Seat {seat} entered waiting pool. Total waiting: {len(waiting_pool)}")
    
    # Run the sweep instantly to check if anyone else is waiting!
    await asyncio.sleep(1) # Dramatic pause
    await trigger_matchmaking_sweep()

@sio.on('respond_to_match')
async def handle_respond_to_match(sid, data):
    accept = data.get('accept')
    from_seat = data.get('fromSeat') # The receiver (B)
    to_seat = data.get('toSeat')     # The sender (A)

    target_sid = active_users.get(to_seat)

    if accept:
        print(f"✅ Linking {from_seat} and {to_seat}")
        active_matches[from_seat] = to_seat
        active_matches[to_seat] = from_seat
        if target_sid:
            await sio.emit('match_request_accepted', {'partnerSeat': from_seat}, to=target_sid)
    else:
        print(f"❌ Match declined.")
        if target_sid:
            await sio.emit('match_request_declined', to=target_sid)

@sio.on('cancel_match_request')
async def handle_cancel_match_request(sid, data):
    seat = data.get('seat')
    if seat in waiting_pool:
        waiting_pool.remove(seat)
    
    for s_id in list(active_users.values()):
        if s_id != sid:
            await sio.emit('match_request_cancelled', {'fromSeat': seat}, to=s_id)

@sio.on('terminate_match')
async def handle_terminate_match(sid, data):
    """Called when users click Disconnect manually"""
    seat = reverse_users.get(sid)
    if seat in active_matches:
        partner = active_matches[seat]
        partner_sid = active_users.get(partner)

        del active_matches[seat]
        if partner in active_matches:
            del active_matches[partner]

        if partner_sid:
            await sio.emit('partner_disconnected', to=partner_sid)

        # FIX: We deleted the line that forced them back into the pool here!
        print(f"🛑 Match between {seat} and {partner} terminated. Both users are now idle.")

# (KEEP ALL THE OTHER GAME/CHAT EVENTS EXACTLY THE SAME AS BEFORE)
@sio.on('send_message')
async def handle_send_message(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid: await sio.emit('receive_message', data.get('message'), to=partner_sid)
 
@sio.on('draw_stroke')
async def handle_draw_stroke(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid: await sio.emit('receive_draw', data.get('point'), to=partner_sid)

@sio.on('clear_board')
async def handle_clear_board(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid: await sio.emit('receive_clear_board', to=partner_sid)
 
@sio.on('send_guess')
async def handle_send_guess(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid: await sio.emit('receive_guess', data.get('guess'), to=partner_sid)

@sio.on('send_artillery_move')
async def handle_artillery_move(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid: await sio.emit('receive_artillery_move', data.get('move'), to=partner_sid)

@sio.on('send_artillery_position')
async def handle_artillery_position(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid: await sio.emit('receive_artillery_position', data.get('position'), to=partner_sid)
 
@sio.on('game_session_update')
async def handle_session_update(sid, data):
    partner_sid = get_partner_sid(sid)
    if partner_sid:
        await sio.emit('partner_game_update', {'game': data.get('game'), 'action': data.get('action')}, to=partner_sid)
    if data.get('action') == 'start':
        seat = reverse_users.get(sid)
        await sio.emit('turn_update', seat, to=sid)
        if partner_sid: await sio.emit('turn_update', seat, to=partner_sid)
 
@sio.on('switch_turn')
async def handle_switch_turn(sid, data):
    next_seat = data.get('nextSeat')
    partner_sid = get_partner_sid(sid)
    await sio.emit('turn_update', next_seat, to=sid)
    if partner_sid: await sio.emit('turn_update', next_seat, to=partner_sid)