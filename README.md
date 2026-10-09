# Metro Girlies Thanksgiving RSVP

An invitation page with the menu, an RSVP form and a live "Who's coming" list.
Guests don't need any account. Replies are saved to a Google Sheet that only you can edit.

- **When:** Monday, October 12, 2026 at 5:00 PM
- **Where:** 506-6468 Willingdon Ave

## What guests can do

- Say yes, maybe or no (everyone RSVPs for themselves)
- Pick a sambal for the ayam daun jeruk: matah, bawang or both
- Vote on dessert: the hosts bake the salt bread and ice cream and everyone chips in for supplies, or guests bring dessert (solo or teamed up with a friend)
- Add allergies or a note (only you see this, in the sheet)
- Send again under the same name to update their answer

## Setup (about 10 minutes)

### 1. Make the Google Sheet

1. Go to [sheets.new](https://sheets.new) and name it something like "Thanksgiving RSVPs".
2. Open **Extensions → Apps Script**.
3. Delete what's in `Code.gs` and paste in everything from [`apps-script/Code.gs`](apps-script/Code.gs). Save.

### 2. Turn it into a web link

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as:** Me, and **Who has access:** Anyone.
4. Click **Deploy**, then allow the permissions Google asks for. (Google may warn that the app is unverified. That's normal for your own script: choose **Advanced → Go to project**.)
5. Copy the **Web app URL**. It ends in `/exec`.
6. Open [`config.js`](config.js) and paste the URL between the quotes:

   ```js
   window.RSVP_ENDPOINT = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```

### 3. Put the site online with GitHub Pages

```bash
git remote add origin https://github.com/<your-username>/thanksgiving-rsvp.git
git push -u origin main
```

Then on GitHub, go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, and save.
After a minute your link is `https://<your-username>.github.io/thanksgiving-rsvp/`. Send that to everyone.

### 4. Test it

Open the link, send an RSVP with your own name, and check it shows up in the sheet and under "Who's coming".
Send it again with a different answer to check it updates the same row.

## Good to know

- Anyone with the link can see the names and choices in "Who's coming". Notes stay private in the sheet.
- To remove a reply, delete its row in the sheet.
- If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the same URL keeps working.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page |
| `styles.css` | Colors, fonts and layout |
| `stickers.js` | The food sticker drawings |
| `app.js` | The RSVP form and the replies list |
| `config.js` | Where your Google Sheet link goes |
| `apps-script/Code.gs` | The script that saves RSVPs to the sheet |
