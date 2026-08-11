# Connecting Your RSVP Form to a Google Sheet

Your RSVP form now sends every submission to a Google Sheet using a free
Google Apps Script "web app" as the backend — no server or hosting needed
beyond your existing site.

## 1. Create the Sheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name it something like **"Jane & Nicholas — RSVPs"**.
3. You can leave it empty — the script creates the header row automatically.

## 2. Add the Script
1. In the Sheet, go to **Extensions → Apps Script**.
2. Delete any placeholder code in the editor.
3. Open the `Code.gs` file from this delivery and paste its entire contents in.
4. Click the disk icon (or **Ctrl/Cmd+S**) to save. Give the project any name.

## 3. Deploy as a Web App
1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Google will ask you to authorize the script — click through the
   "Google hasn't verified this app" warning (this is expected, since it's
   your own private script) and allow access.
6. Copy the **Web app URL** shown — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

## 4. Connect It to Your Site
1. Open `script.js`.
2. Find this line near the top:
   ```js
   const GOOGLE_SHEET_ENDPOINT = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
3. Replace the placeholder text with the URL you copied, e.g.:
   ```js
   const GOOGLE_SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
4. Save and re-upload `script.js` to your site.

## 5. Test It
1. Open your invitation site, scroll to **Confirm Your Attendance**.
2. Submit a test response.
3. Check your Google Sheet — a new row should appear within a couple of
   seconds, with columns: Timestamp, Full Name, Phone Number, Attending,
   Message.

## Notes
- If you ever edit `Code.gs` again, you must create a **new deployment**
  (or use "Manage deployments → Edit → New version") for the changes to
  go live — saving alone isn't enough.
- The form will silently fail with an on-page error message if the
  endpoint URL is still the placeholder or if the request can't reach
  Google (e.g. no internet), so guests always get feedback.
- Each RSVP submission is a normal row, so you can filter/sort/sum
  attendance directly in Sheets, or connect it to Google Data Studio /
  Looker Studio for a live dashboard if you'd like.
