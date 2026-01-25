import pandas as pd
import os

# Configuration
TELEMETRY_PATH = 'data/telemetry_phase_2.telemetries.csv'
USERS_PATH = 'data/telemetry_phase_2.users.csv'
X_MINUTES = 30 # Filter players who played LESS OR EQUAL TO this many minutes

def main():
    # 1. Load Data
    if not os.path.exists(TELEMETRY_PATH) or not os.path.exists(USERS_PATH):
        print(f"Error: Data files not found.")
        print(f"Looking for: {TELEMETRY_PATH}")
        print(f"Looking for: {USERS_PATH}")
        return

    try:
        df_telemetry = pd.read_csv(TELEMETRY_PATH)
        df_users = pd.read_csv(USERS_PATH)
        print(f"Loaded {len(df_telemetry)} telemetry rows and {len(df_users)} users.")
    except Exception as e:
        print(f"Error loading CSV files: {e}")
        return

    # 2. Key Checks
    if 'userId' not in df_telemetry.columns:
        print("Error: 'userId' column missing in telemetry.")
        return
    if '_id' not in df_users.columns:
        print("Error: '_id' column missing in users.")
        return

    # 3. Calculate Duration per User
    # Assumption: Each row in telemetry represents a 30-second window.
    # Total Active Time = Count of rows * 30 seconds
    # This naturally handles gaps because we only count time when we received data.
    
    user_activity = df_telemetry.groupby('userId').size().reset_index(name='data_points')
    user_activity['duration_seconds'] = user_activity['data_points'] * 30
    user_activity['duration_minutes'] = user_activity['duration_seconds'] / 60

    # 4. Merge with User Details (Inner Join to get names)
    # matching telemetry.userId to users._id
    
    merged_data = pd.merge(
        user_activity,
        df_users[['_id', 'firstName', 'lastName']],
        left_on='userId',
        right_on='_id',
        how='inner' # Use inner to only show users we have info for
    )

    # 5. Filter for Short Sessions
    short_playtime_players = merged_data[merged_data['duration_minutes'] <= X_MINUTES].copy()
    
    # Sort for better readability
    short_playtime_players.sort_values(by='duration_minutes', ascending=False, inplace=True)

    # 6. Display Results
    num_total_analyzed = len(merged_data)
    num_short = len(short_playtime_players)
    
    print("-" * 60)
    print(f"ANALYSIS REPORT (Threshold: {X_MINUTES} minutes)")
    print("-" * 60)
    print(f"Total users with telemetry: {len(user_activity)}")
    print(f"Total users matched with names: {num_total_analyzed}")
    print(f"Users played <= {X_MINUTES} mins: {num_short}")
    print("-" * 60)

    if num_short > 0:
        print(f"{'Name':<30} | {'Duration (m)':<15} | {'Data Points':<10}")
        print("-" * 60)
        for _, row in short_playtime_players.iterrows():
            full_name = f"{row['firstName']} {row['lastName']}"
            duration = f"{row['duration_minutes']:.1f}"
            points = row['data_points']
            print(f"{full_name:<30} | {duration:<15} | {points:<10}")
    else:
        print("No users found below the threshold.")

if __name__ == "__main__":
    main()
