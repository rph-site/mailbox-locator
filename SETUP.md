# Blue Boxes setup

Prepared October 9, 2026. App version: 2026-10-09.9.

The Airtable workspace, base, table and nine owner supplied mailbox records are ready. The three demonstration records have been deleted.

Base: Blue Boxes | Mailbox Locator

Table: Mailboxes

Open the base: https://airtable.com/appFUVid8cEGQvoaD/tbl0a1FHvC7meUYmG

## 1. Create the Airtable token

1. Open https://airtable.com/create/tokens and select Create new token.
2. Name it Blue Boxes Map Read.
3. Add only the scope `data.records:read`.
4. Under Access, select only Blue Boxes | Mailbox Locator. Do not grant access to every workspace or base.
5. Create the token and copy its value. Keep it private. You will enter it in Cloudflare as a secret. Do not put it in GitHub, the HTML file, or the app.

## 2. Upload the prepared files to GitHub

The app can remain on GitHub Pages. The data service runs separately in Cloudflare.

1. If you have not created your GitHub Pages repository, create a public repository called mailbox-locator and initialize it with a README.
2. Extract this ZIP on your computer.
3. In your GitHub repository select Add file, then Upload files.
4. Upload these three files directly into the root of the repository: `index.html`, `worker.js` and `wrangler.jsonc`. Upload the files themselves, not the enclosing folder and not the ZIP. The Worker code contains base and field IDs, but no token.
5. Commit the files to main. If index.html already exists, replace it.
6. If Pages is not enabled yet, open Settings, Pages. Choose Deploy from a branch, main, / (root), then Save.
7. Wait for the Pages deployment in Actions to show a green check. Open the published HTTPS app URL and confirm version 2026-10-09.9.

## 3. Publish the connection service in Cloudflare

1. Sign in or create an account at https://dash.cloudflare.com/ . You do not need to transfer a domain to Cloudflare.
2. Open Workers & Pages, then Create application. Choose the option to import an existing GitHub repository.
3. Authorize GitHub when prompted and select the repository holding the three files from step 2.
4. Use `blue-boxes-data` for the Worker name. It must match the supplied wrangler.jsonc file.
5. Use the main branch and the repository root. No build command is needed. The deploy command is `npx wrangler deploy`.
6. Deploy and wait for a successful build. Copy the published workers.dev URL shown for the Worker.
7. The Worker may report Setup incomplete until the secret in the next step has been added. That is expected.

If the dashboard offers different choices, send a screenshot of that screen. Do not change the supplied code to make a template fit.

## 4. Add the token and allowed website

Open Workers & Pages, your blue-boxes-data Worker, Settings, Variables and Secrets.

| Type | Name | Value |
| :--- | :--- | :--- |
| Secret | AIRTABLE_TOKEN | Paste the private Airtable token created in step 1 |
| Text | ALLOWED_ORIGIN | Your app's origin, such as https://YOUR_USERNAME.github.io |

The origin includes HTTPS and the domain. It does not include the repository path or a trailing slash. If you use a custom domain, enter its exact origin instead.

Select Deploy to apply these settings. The token should be a Secret, not Text. The token stays in Cloudflare and is never sent to the phone.

Only the mailbox data returned by this service is public. Name, address, coordinates, pickup schedules and notes are all included. CORS limits browser connections to your chosen website. It does not make mailbox data private or add a login.

## 5. Connect the app

1. Open the Worker URL in a browser. You should see JSON containing `source`, `fetchedAt` and `mailboxes`. If it reports an error, correct the Cloudflare settings before continuing.
2. Open the GitHub Pages app on your phone.
3. Enter your MapTiler key when asked. This is a different credential from the Airtable token.
4. Open Filters, then Mailbox data.
5. Paste the published Worker URL and tap Connect. You can paste its root URL. The app adds /mailboxes automatically.
6. Inside Filters, the data status should change to Data: Airtable with a date and time.
7. Allow phone location permission, or use place search.

Send the public Worker URL and GitHub Pages app URL in this conversation. Do not send the Airtable token. These URLs allow the live connection to be checked.

## Maintaining your mailbox list

Each record is one mailbox. Fill in Name, Address, Latitude, Longitude and the seven daily pickup columns. Enter coordinates as numbers. Check Active to show the mailbox.

Daily pickup times accept `5:00 PM` or `17:00`. Enter the LAST pickup for that day. Enter `TBD` for unknown or unconfirmed days. Leave a day blank only for confirmed no pickup. Unknown schedules display as Unknown and are excluded by the pickup time filter. Clear filters to show every mailbox, or turn off Hide to see dimmed locations. Midnight is `12:00 AM` or `00:00`. Noon is `12:00 PM` or `12:00`.

Notes appear in the mailbox detail card. Uncheck Active to remove a mailbox from the map without deleting it. There are no demonstration entries.

After changes, open Filters and tap Refresh data. The service caches responses for up to five minutes. The data timestamp shows when Airtable was fetched. The top refresh button and Refresh data in Filters bypass that cache and request current Airtable records.

You can also send new mailbox information in the conversation where the app was built and have the Airtable records updated there. Index uploads are required only for changes to the app itself.

Do not rename or delete the Mailboxes table fields without updating the connection service. Field IDs are used to reduce dependence on names, but deleting and recreating a field changes its ID.

At more than 150 active mailboxes, the app shows a notice to review clustering and data loading.

## Map controls and detail cards

The map has no top summary panel. A compact refresh icon at the top right requests current Airtable data. It shows a loading state while fetching, and a short success or failure message afterward. Filters and the active center remain unchanged. If no service is connected, it opens Mailbox data setup. Three compact icon buttons in the bottom right open Filters, recenter on My location, and Fit mailboxes. Mailbox symbols are half their previous diameter, with a larger invisible tap area.

Closest distance, result counts, hidden counts, current center, Back to my location and data status are inside Filters. The closest pin still has a green ring and label on the map.

Opening a mailbox card keeps at least 42 percent of the map visible. The selected mailbox has an amber ring and the map moves it into the visible area above the card. Scroll within the card for the full weekly schedule and notes. Tap outside or use Close to dismiss.

## Directions and supplied schedules

Open a mailbox card and tap Get directions. Google Maps opens driving directions to the exact latitude and longitude. Google Maps chooses the starting location from your device when available. A searched place in the locator is not used as the route origin. No Google Maps API key is required.

Maitland Concourse weekday pickups are 9:00 AM and 5:00 PM. Garbaldis/Crunch weekday pickups are assumed to be 11:00 AM and 5:00 PM. The daily schedule stores the last pickup. Earlier pickups are preserved in Notes. The 2964 St Rd 434 weekday 4:45 and Saturday 3:30 times are assumed to mean PM.

All unspecified days, including Sundays, are TBD. Fern Park has no confirmed schedule. Postal street addresses were not provided for most locations, so Address contains the supplied location description. Directions use coordinates rather than these descriptions.

For this refresh update, replace both index.html and worker.js in the GitHub repository. Confirm the Pages deployment and Cloudflare Worker deployment succeed. The updated Worker is needed to bypass the cache. Your existing token secret stays in Cloudflare.

## Failures and recovery

Invalid active rows are skipped and the app reports how many were skipped. Check their name, address, coordinates and every pickup value. Inactive rows are not an error.

On a connection failure, the app keeps its last saved mailbox copy and labels it as saved data. Check its timestamp before relying on a schedule. If no saved copy exists, the app shows no mailbox data. It does not silently substitute sample locations.

MapTiler and data service settings are saved in the current browser. A different browser or phone needs its own setup. If browser storage is unavailable, settings work for that visit only.

## What was tested

The HTML scripts and Worker pass syntax checks. Map logic was checked with fake coordinates and times, including all six radius choices, pickup boundaries, weekends, closest selection and combined filters.

The app was exercised in Chromium at 390 by 844, 320 by 568, and landscape 844 by 390. Half size symbols, compact controls and the selected pin staying above the shortened detail card were checked. Manual refresh was checked for requesting fresh data, disabled controls while loading, preserved filters and map center, updated pins, and failure recovery. Cache bypass and subsequent cache replacement were tested with the Worker. Pin taps, detail cards, dismissal, filters, saved settings and horizontal overflow were checked. Data service tests cover time normalization, active filtering, invalid rows, pagination, cache behavior, request methods, CORS and safe upstream errors.

A mocked feed verified connection setup, refreshing, saved data after failure, empty data, invalid entry warnings and disconnecting to an empty map. Actual Airtable writes were verified by reading back all nine active records and the deletion of the three sample records. Directions URLs, coordinates, driving mode, unknown schedules and pickup filtering were checked. Google Maps opening through the link was checked with a simulated destination page.

The deployed Worker was checked successfully at https://blue-boxes-data.kelley-c00.workers.dev/mailboxes and returned nine mailbox records with zero skipped. Its browser origin is https://rph-site.github.io. Live MapTiler tiles and geocoding, actual phone GPS, iPhone Safari and Google Maps app handoff still require a live check.

## Official references

Airtable tokens: https://support.airtable.com/articles/9934989703-creating-personal-access-tokens

Cloudflare dashboard setup: https://developers.cloudflare.com/workers/get-started/dashboard/

Cloudflare build settings: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/

Cloudflare secrets: https://developers.cloudflare.com/workers/configuration/secrets/

GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

Google Maps directions URLs: https://developers.google.com/maps/documentation/urls/get-started

## Install on Android

Upload index.html, manifest.webmanifest, sw.js, icon-192.png, icon-512.png, and icon-maskable-512.png into the same GitHub repository folder. Upload the individual files, not the ZIP or enclosing folder. The Worker does not need to change for this update. If the previous refresh update is not deployed yet, also upload its worker.js.

Wait for GitHub Pages to deploy successfully. On Android, open the published HTTPS app in Chrome and confirm Version: 2026-10-09.9. Open Filters and tap Install on Android. If no installation prompt appears, open Chrome's three dot menu and choose Add to home screen or Install app, then confirm.

The home screen app is named Blue Boxes and uses the same blue collection mailbox as the map pins. A separate maskable icon keeps the mailbox visible with Android's different icon shapes. Installed launches open without the usual browser address bar. Android may ask for location permission again. Enter the MapTiler key and data service URL again only if the installed app asks for them.

The service worker caches app files and Leaflet when available. Current map tiles, place search and Airtable refresh need an internet connection. On a data failure the existing saved data behavior still applies. API requests are never served from the service worker cache.

Future HTML changes are fetched from the network when the app opens online. The refresh icon updates mailbox data, not the application code. Close and reopen the app after publishing a code update and check the version string.

Android package installation and the final launcher icon appearance require a check on your phone. Manifest paths, PNG sizes, installation controls, service worker registration and API cache exclusion were checked in Chromium.

Manifest reference: https://web.dev/articles/add-manifest
