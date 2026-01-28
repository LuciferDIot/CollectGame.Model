
import pandas as pd
import json
import random
import os
import sys

TELEMETRY_PATH = 'data/telemetry_phase_2.telemetries.csv'
DEATHS_PATH = 'data/telemetry_phase_2.deathevents.csv'
OUTPUT_PATH = 'anfis-demo-ui/lib/data/examples.json'

def load_data():
    print("Reading CSVs...")
    try:
        df_telem = pd.read_csv(TELEMETRY_PATH)
        df_deaths = pd.read_csv(DEATHS_PATH)
        
        # Convert timestamps
        if 'timestamp' in df_telem.columns:
            df_telem['timestamp'] = pd.to_datetime(df_telem['timestamp'])
        if 'timestamp' in df_deaths.columns:
            df_deaths['timestamp'] = pd.to_datetime(df_deaths['timestamp'])
            
        return df_telem, df_deaths
    except Exception as e:
        print(f"Error reading CSVs: {e}")
        return None, None

def group_deaths_by_user(df_deaths):
    deaths_by_user = {}
    if df_deaths is None or df_deaths.empty:
        return deaths_by_user
        
    for uid, group in df_deaths.groupby('userId'):
        deaths = []
        for _, row in group.iterrows():
            deaths.append({
                "timestamp": row['timestamp'], # datetime object
                "str_timestamp": str(row['timestamp']),
                "location": row.get('location', 'Unknown'),
                "cause": row.get('cause', 'Unknown')
            })
        deaths_by_user[uid] = deaths
    return deaths_by_user

def extract_features(row):
    # Mapping snake_case or whatever exists to camelCase
    features = {
        "enemiesHit": row.get('enemiesHit', row.get('enemies_hit', 0)),
        "damageDone": row.get('damageDone', row.get('damage_done', 0)),
        "timeInCombat": row.get('timeInCombat', row.get('time_in_combat', 0)),
        "kills": row.get('kills', 0),
        "itemsCollected": row.get('itemsCollected', row.get('items_collected', 0)),
        "pickupAttempts": row.get('pickupAttempts', row.get('pickup_attempts', 0)),
        "timeNearInteractables": row.get('timeNearInteractables', row.get('time_near_interactables', 0)),
        "distanceTraveled": row.get('distanceTraveled', row.get('distance_traveled', 0)),
        "timeSprinting": row.get('timeSprinting', row.get('time_sprinting', 0)),
        "timeOutOfCombat": row.get('timeOutOfCombat', row.get('time_out_of_combat', 0))
    }
    
    # Sanitize
    for k in features:
        try:
            features[k] = float(features[k])
            if pd.isna(features[k]): features[k] = 0
        except:
            features[k] = 0
            
    return features

def find_matching_deaths(uid, session_time, deaths_by_user):
    matched_deaths = []
    if uid in deaths_by_user:
        user_deaths = deaths_by_user[uid]
        for d in user_deaths:
            # check time delta
            delta = (d['timestamp'] - session_time).total_seconds()
            # If death is within last 3 hours or next 30 mins (liberal window around session)
            if -10800 <= delta <= 1800:
                matched_deaths.append({
                    "timestamp": d['str_timestamp'],
                    "location": d['location'],
                    "cause": d['cause']
                })
    return matched_deaths

def process_sessions(df_telem, deaths_by_user):
    sid_col = 'sessionId' if 'sessionId' in df_telem.columns else 'userId'
    # Group by sessionId to get distinct sessions (taking last row for cumulative stats)
    df_sessions = df_telem.sort_values('timestamp').groupby(sid_col).last().reset_index()
    
    valid_sessions = []
    for _, row in df_sessions.iterrows():
        uid = row.get('userId')
        session_time = row['timestamp']
        sid = row[sid_col]
        
        deaths = find_matching_deaths(uid, session_time, deaths_by_user)
        features = extract_features(row)
        
        valid_sessions.append({
            "sessionId": str(sid),
            "userId": str(uid),
            "timestamp": str(session_time),
            "features": features,
            "deaths": deaths
        })
        
    print(f"Total processed sessions: {len(valid_sessions)}")
    return valid_sessions

def balance_dataset(valid_sessions):
    sessions_with_deaths = [s for s in valid_sessions if len(s['deaths']) > 0]
    sessions_without_deaths = [s for s in valid_sessions if len(s['deaths']) == 0]
    
    print(f"Sessions with deaths found: {len(sessions_with_deaths)}")
    
    selected = []
    # 1. Prioritize sessions with deaths (Take up to 30)
    if sessions_with_deaths:
        count = min(30, len(sessions_with_deaths))
        if len(sessions_with_deaths) > count:
            selected.extend(random.sample(sessions_with_deaths, count))
        else:
            selected.extend(sessions_with_deaths)
            
    # 2. Fill rest with non-death sessions to reach 50
    needed = 50 - len(selected)
    if needed > 0 and sessions_without_deaths:
        count = min(needed, len(sessions_without_deaths))
        selected.extend(random.sample(sessions_without_deaths, count))
    
    random.shuffle(selected)
    return selected

def save_examples(examples):
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(examples, f, indent=2)
    print(f"Saved {len(examples)} examples to {OUTPUT_PATH}")

def generate_examples():
    df_telem, df_deaths = load_data()
    if df_telem is None: return

    deaths_by_user = group_deaths_by_user(df_deaths)
    valid_sessions = process_sessions(df_telem, deaths_by_user)
    
    final_examples = balance_dataset(valid_sessions)
    save_examples(final_examples)

if __name__ == "__main__":
    generate_examples()
