# Player Data Storage & Firebase Sync - Testing Guide

## Firebase Setup (Required Before Testing)

### 1. Enable Anonymous Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `com-hightopgames-firebase`
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Anonymous** in the list
5. Click **Enable**
6. Click **Save**

### 2. Initialize Firestore Database (if not already done)

1. In Firebase Console, go to **Firestore Database**
2. If you see "Get started", click it
3. Choose **Production mode** (or Test mode for development)
4. Select a region (e.g., `us-central1`)
5. Click **Enable**

### 3. Deploy Security Rules

Run these commands in your terminal:

```bash
cd "/Users/marshallsmith/Game Puzzle/App"

# Login to Firebase (if needed)
firebase login --reauth

# Deploy Firestore security rules
firebase deploy --only firestore:rules
```

You should see output like:
```
✔  firestore: rules deployed successfully
```

## Testing the Implementation

### Test 1: Verify Anonymous Authentication

1. **Build and run the app** in Xcode
2. **Open the app** - it should automatically sign in anonymously
3. **Check Xcode console** for logs:
   - Look for: `"Signed in anonymously with UID: <some-id>"`
   - If you see this, authentication is working!

### Test 2: Verify Local Data Storage

1. **Play a puzzle** - complete at least one puzzle
2. **Check local storage** - The data should be saved locally immediately
3. **Close and reopen the app** - Your progress should persist

**How to verify:**
- Complete a puzzle
- Note your stats (streak, puzzles completed)
- Force quit the app
- Reopen the app
- Your stats should still be there

### Test 3: Verify Firebase Sync (Online)

1. **Ensure you're online** (WiFi or cellular)
2. **Complete a puzzle** - This triggers a sync
3. **Check Firebase Console:**
   - Go to **Firestore Database** in Firebase Console
   - Look for a collection called `players`
   - You should see a document with your anonymous user ID
   - Click on it to see your player data

**What to look for in Firestore:**
```json
{
  "playerId": "anonymous-user-id-here",
  "createdAt": "2025-12-15T...",
  "lastSyncedAt": "2025-12-15T...",
  "stats": {
    "totalPuzzlesCompleted": 1,
    "maxStreak": 1,
    ...
  },
  "puzzleProgress": {
    "5_0": {
      "completed": true,
      "bestTime": 120,
      ...
    }
  }
}
```

### Test 4: Test Offline Mode

1. **Complete a puzzle while online** - Verify it syncs
2. **Turn on Airplane Mode** (or disable WiFi)
3. **Complete another puzzle** - Should save locally
4. **Check Xcode console** - Should see sync queue messages
5. **Turn WiFi back on**
6. **Wait 30 seconds** - Periodic sync should upload the offline data
7. **Check Firebase Console** - Both puzzles should appear

### Test 5: Test Conflict Resolution

1. **Device A:** Complete puzzle "5_0" with time 100 seconds
2. **Device B:** Complete puzzle "5_0" with time 80 seconds (better time)
3. **Both devices sync**
4. **Check Firebase Console** - Should show best time (80 seconds)
5. **Both devices should eventually show the best time**

### Test 6: Verify Activity Tracking

1. **Play multiple puzzles** in one session
2. **Background the app** (home button)
3. **Check Xcode console** - Should see session end
4. **Check Firebase Console** - Look for `activity.sessions` array with session data

### Test 7: Verify Settings Sync

1. **Change music volume** in settings
2. **Check Firebase Console** - `settings.musicVolume` should update
3. **Change SFX volume**
4. **Toggle haptics**
5. **All should sync to Firebase**

## Debugging Tips

### Check Xcode Console Logs

Look for these log messages:
- ✅ `"Signed in anonymously with UID: ..."` - Auth working
- ✅ `"Initial sync failed: ..."` - Check Firebase setup
- ✅ `"Sync failed: ..."` - Check network/Firebase rules
- ✅ `"Failed to save player data"` - Check LocalStorage plugin

### Common Issues

**Issue: "Authentication Error"**
- **Solution:** Make sure Anonymous Authentication is enabled in Firebase Console

**Issue: "Permission denied" in Firestore**
- **Solution:** Deploy security rules: `firebase deploy --only firestore:rules`

**Issue: Data not syncing**
- **Check:** Are you online?
- **Check:** Is Firestore initialized?
- **Check:** Xcode console for error messages

**Issue: "FirebaseManager not available"**
- **Solution:** Make sure the app is running on a device/simulator (not just web)
- **Solution:** Check that Firebase pods are installed: `cd container/ios/App && pod install`

### Manual Testing Commands

You can also test via Firebase Console directly:

1. **Create a test document manually:**
   - Go to Firestore Database
   - Click "Start collection"
   - Collection ID: `players`
   - Document ID: `test-user-123`
   - Add fields and save

2. **Check if rules work:**
   - Try to read/write from the app
   - Should only work if authenticated with matching UID

## Verification Checklist

- [ ] Anonymous Authentication enabled in Firebase Console
- [ ] Firestore Database created and initialized
- [ ] Security rules deployed (`firebase deploy --only firestore:rules`)
- [ ] App signs in anonymously (check console logs)
- [ ] Local data persists after app restart
- [ ] Data syncs to Firestore (check Firebase Console)
- [ ] Offline mode works (saves locally, syncs when online)
- [ ] Settings changes sync to Firebase
- [ ] Activity sessions are tracked

## Next Steps

Once everything is working:

1. **Monitor Firestore usage** in Firebase Console → Usage
2. **Set up Firebase Analytics** to track player behavior
3. **Consider adding** more data fields as needed
4. **Set up alerts** for Firestore quota limits

## Firebase Console Quick Links

- **Authentication:** https://console.firebase.google.com/project/com-hightopgames-firebase/authentication
- **Firestore Database:** https://console.firebase.google.com/project/com-hightopgames-firebase/firestore
- **Project Settings:** https://console.firebase.google.com/project/com-hightopgames-firebase/settings/general
