# JARVIS Personal Assistant

A responsive dark command center with private accounts, tasks, notes, in-app reminders, and saved interface preferences. The assistant interprets a small set of deterministic commands; it does not use a language model, external datasets, paid providers, or live information feeds.

## Important implementation differences

This workspace supports TypeScript, React 19, TanStack Start, Tailwind CSS 4, Better Auth, and SQLite, not Python or Streamlit. This is a functioning web app on that supported stack. There is no Python application or requirements.txt, and `streamlit run` will not run this project.

SQLite is managed by MonstarX in preview and uses a Cloudflare D1 binding named `DB` when published. It is **not an offline, local SQLite file app**. Native accounts and persistence use the workspace's managed infrastructure. No external AI or notification provider is called by JARVIS features. A completely standalone offline Python/Streamlit deliverable would require a separate implementation outside this workspace's fixed runtime.

## Use the app

1. Open the preview. The public dashboard is explicitly labeled fictional and does not contain another user's records.
2. Choose Create your workspace. Enter a name, a phone number, an email address, and a password of at least eight characters. Phone numbers accept 8–15 digits, an optional leading `+`, and common formatting such as `+1 (202) 555-0148`.
3. Phone entry is **contact information, not identity verification**. Login uses email and password. No phone verification or SMS service is used.
4. Add tasks, assign low/medium/high priorities, edit them, complete them, or delete them. Status filters remain in the page address.
5. Create private notes, edit or delete them, and search titles and contents. The search remains in the page address.
6. Set a reminder title, date, and time. Review Upcoming or Past & due reminders. Delete a reminder when it is no longer needed.
7. In Settings, update your profile, choose cyan or violet accents, or reduce interface motion. Save to retain these choices across visits.
8. To permanently delete your account and its private records, open Settings, choose Delete account, and type `DELETE`. This removes account credentials and sessions as well as the profile, tasks, notes, and reminders. This action cannot be undone. The enforcement uses SQLite foreign-key cascades in one owner-scoped deletion; do not disable foreign keys in a self-hosted database.

Sign out is available from the sidebar. On a phone, open the navigation menu first. A returning signed-in visitor opening Login can see their email and sign out to switch accounts.

## Supported commands

Enter these on the dashboard:

- `Add a task to finish my assignment.` — saves a medium-priority pending task.
- `Show my pending tasks.` — opens the pending task filter.
- `Create a note.` — opens the new-note editor; supply a title and contents before saving.
- `Show my reminders.` — opens reminders.
- `Mark my assignment as completed.` — completes a unique pending match.

Matching ignores case and punctuation. Exact task titles take precedence; if a partial phrase matches multiple pending tasks, JARVIS asks for a more specific title instead of guessing. Unsupported commands show examples without modifying your data. Commands require sign-in and are not a general-purpose chatbot.

## JARVIS spoken replies

Open the speaker icon in the top bar and choose **Preview voice**. Sign in with a completed profile and turn on **Speak assistant replies** to hear command responses on the dashboard and Tasks. This opt-in preference is saved to your account; previewing does not enable automatic replies. Choose an installed voice from the menu; that voice selection lasts for this page session. **Stop** interrupts playback, and turning spoken replies off also stops it.

Speech uses only browser-reported on-device voices (`localService`), not Siri's proprietary voice, an external AI, or a paid speech provider. Spoken reply playback does not activate the microphone. Opt-in voice input is described below; there is no wake word. If no local voice is available, install a voice in your device's speech settings and reload, or continue using typed replies. Some browsers require a direct user gesture for audio: use Preview voice first. Typed responses remain visible when playback is blocked.

Manual checks: preview, enable, submit commands on both dashboard and Tasks, follow a command's navigation while it speaks, stop mid-sentence, mute, reload to check the saved preference, and sign out to stop playback. Check an unsupported browser or a device without installed local voices for fallback guidance.

## Speak commands to JARVIS

On the dashboard or Tasks, tap **Speak command**, allow microphone access, and say an English command such as “Add a task to finish my assignment.” The transcript appears in the editable command box. Tap **Stop listening** if needed, review or correct the text, and press **Send command**. Speech never submits a command automatically. Existing text is kept and dictation is appended. Enable **Speak assistant replies** separately to hear the response.

Recognition requires a secure page and a browser implementing on-device SpeechRecognition with `processLocally` and language availability checks. This support is not universal, including across Chrome versions and devices. JARVIS never falls back to remote browser recognition. Unsupported devices show typing guidance. If offered, **Download English speech pack** explicitly downloads a browser-managed language model; downloading needs internet, but recognition runs on-device. Microphone access is requested only after tapping the control. There is no wake word, background listening, uploaded recording, or stored audio. Each session ends after one utterance or at most 30 seconds; editing, submitting, or leaving the command control aborts recognition.

Manual checks on a supported real device: grant permission, dictate and edit a command, confirm nothing saves before Send, then send and reload Tasks to verify persistence. Stop mid-utterance, deny permission, try silence/no microphone, leave the page while listening, and confirm typing still works in an unsupported browser. If a pack is missing, test download success/failure. Check spoken replies still play after sending. Build checks cannot verify real microphone input or browser-managed speech packs.

## Notification workspace on Android and Mac

Open Notifications in the sidebar (or mobile navigation). Manually paste text from a notification, then choose Prepare reply & title. JARVIS uses transparent keyword templates, not AI or external services. Review and edit the reply, copy it, and paste it into the original app yourself. Nothing is sent automatically. Sensitive/security keywords suppress reply suggestions; this is a limited safeguard, not a comprehensive sensitive-data detector.

Review the title and explicitly approve saving a task, note, or future in-app reminder. Tasks and reminders save only the title; notes save the pasted text too. These records use the existing private managers and persist across visits. Unsaved text and reply drafts clear when you leave or reload. Remove passwords, verification codes, and private financial details before pasting.

This website does not automatically read notifications on either platform. No Android companion, macOS desktop companion, notification listener, or source-app integration is included. Android capture would need separate permission-based native software; macOS does not provide universal access to other apps' notifications.

Manual checks: try a meeting notification, a deadline, a question, and a security-code message. Edit and copy a reply, then approve each save type and reload its manager to confirm persistence. Try empty text, missing titles, past reminder times, clipboard restrictions, and a narrow screen. No reply should be sent automatically.

## Reminder time zones and limitations

The creation form detects your browser's IANA time zone. A reminder stores a UTC instant and the detected zone, and displays the scheduled time in that saved zone even when you travel. The server verifies the chosen calendar date and local time against the zone and rejects past, malformed, or nonexistent daylight-saving times. When a clock repeats an hour, the browser chooses the first occurrence. Choose another time if this is not the intended occurrence.

Reminders are **in-app only**. They never send push notifications, SMS, email, or background alerts. The reminder page updates its upcoming/past classification while open. The dashboard refreshes its snapshot when revisited or reloaded. No delivery guarantee or alarm behavior is implied.

## Local development of an exported project

1. Use Project header → Settings → Export to download the complete project, including its generated package manifest, Vite configuration, and managed helpers. Keep those managed files; copying only application routes is insufficient.
2. Install Node.js 24 LTS (recommended) and npm.
3. In the exported project folder, run `npm install`, then `npm run dev`, and open the local address printed by Vite.
4. Configure the backend runtime and Better Auth environment using the exported project's hosting instructions. Auth uses `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`; do not commit secrets. A local frontend needs access to the managed backend or an appropriately provisioned Cloudflare runtime with a `DB` binding. A bare Node process with no backend configuration can render public pages but cannot provide working accounts and persistence.
5. For Cloudflare hosting, apply the native authentication migration before the numbered app migrations. MonstarX provisions the native authentication tables in its own deployment flow. The app migrations do not independently recreate those managed tables.

The app is immediately runnable in this workspace without local setup. For a deployment using the existing workspace infrastructure, use Project header → Publish. This README does not claim that an unconfigured export is a standalone offline install.

## Basic unit tests

The dependency-free test suite imports the actual command parser, task matcher, and input validators. It does not create accounts or change stored records.

With Node.js 22.6+ (24 LTS recommended), run:

`node --experimental-strip-types --test src/tests/unit.test.mjs`

Coverage includes all five requested command phrases, polite/case variants, unsupported commands, exact/ambiguous/missing task matching, phone normalization and invalid phone formats, and required-text validation. Node's built-in test runner prints pass/fail results and exits unsuccessfully on failures. These tests are not a replacement for signed-in browser QA.

## Manual acceptance checks

Use fictional data and a disposable account for destructive checks:

- Register with a formatted phone number; reload and verify the profile. Confirm that blank names and invalid phones are rejected.
- Sign out and sign in again. A second account must not see the first account's tasks, notes, or reminders. Direct protected page visits while signed out should return to Login.
- Add, edit, complete, filter, and delete a task; reload after each save.
- Create two notes, search for text in one, edit it, and delete it; reload to confirm persistence.
- Set a future reminder. Confirm that it appears on both Reminders and the dashboard with its saved zone. Try a past time and an invalid date. Check midnight boundaries and daylight-saving transitions in a real browser; do not simulate them by changing stored production data.
- Save cyan/violet and reduced-motion preferences; revisit the dashboard and reload to confirm.
- Delete only the disposable account. Verify that its old session cannot open protected pages, its old password no longer signs in, and all linked private records are removed. Check that a different account is unchanged.
- Try narrow screens, keyboard navigation, dialog cancellation, and slow/failed saves. Errors should appear near the action without pretending the save succeeded.

Build/type checks render signed-out pages and compile the application. They cannot verify signed-in interactions, receive emails, or prove account deletion in a real browser. Run Project header → QA → Run QA now for independent browser checks, or exercise the manual cases above.

## Structure and data handling

- `src/routes/`: dashboard, login, tasks, notes, reminders, and settings.
- `src/components/`: shared navigation, circular assistant visual, and accessible native dialog.
- `src/server/`: authorized server functions with per-user queries and writes.
- `src/lib/`: pure deterministic command and validation helpers plus managed services.
- `src/db/schema.ts` and `migrations/`: app data definitions and applied SQLite migrations.
- `src/tests/unit.test.mjs`: basic unit tests.

All private server operations require a valid native session and scope records to that account. Public sample content is fictional and is never inserted into a new account. Required inputs and lengths are validated on the server; errors are displayed in the UI. Database failures can still prevent saves, so check the success feedback before leaving an editor.
