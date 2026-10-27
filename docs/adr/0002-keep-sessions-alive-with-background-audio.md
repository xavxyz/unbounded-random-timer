# A session keeps the app alive by playing a silent loop that doesn't mix

A session has to keep ringing on time while the phone is locked, and only the hold stops it. iOS keeps a locked app running only while it plays audio. So from the tap that begins a session to the hold that stops it, the app loops a silent track, and the phase sounds play on top of it. The audio session uses `doNotMix`. In exchange the session owns the lock screen's Now Playing: "Round N", the Emblem as a still image, and no controls that do anything. The cost is that starting a session pauses any music, and music started during a session interrupts it. Practitioners don't train to music, so we accepted that.

## Considered Options

- **Scheduled local notifications.** They work in Expo Go, but they can't use the phases' own sounds there, and they stay quiet when the phone is on silent or a Focus is on. A session that might not ring isn't a timer.
- **A silent loop with `mixWithOthers`.** It keeps music playing, but gives no lock-screen presence. We would have picked it if practitioners trained to music.

## Consequences

- The app stays alive only while it plays. If the loop stops, iOS suspends the app within seconds and the bells stop. Every interruption (a call, Siri, another app's audio) has to restart the loop when it ends. Phase starts that fall during an interruption go unrung.
- Leaving `active` no longer means anything to a session. Locking reports `background` even while the loop keeps the app running.
- A silent loop kept alive in the background is a known App Store review risk (guideline 2.5.4). TestFlight isn't affected.
