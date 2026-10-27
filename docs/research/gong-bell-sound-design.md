# Gong / bell sound design for a calm interval timer

Research notes, October 2026. The question: what do primary sources say about designing the bell sounds for this app (`assets/bell.wav` for White, `assets/black.wav` for Black, both synthesised by `scripts/synthesize-bell.mjs` and played by `src/usePhaseSound.ts`)? Every claim below is linked to its source. Claims I couldn't trace to a primary source are marked **[unverified]**. Statements marked **[inference]** are my own reasoning from the cited sources, not something a source says.

## Summary of recommendations

1. **Let the bell ring longer: about 3–4.5 s per file, not 1.2–1.6 s.** Real struck metal rings for many seconds. Singing bowls last 40–50 s ([Kim & Choi 2023](https://doi.org/10.3390/ijerph20126180)). Carillon-bell decay times are "of the same order" as a 12 s recording ([Carvalho, Debut & Antunes 2021](https://doi.org/10.1186/s40494-021-00620-2)). Risset's classic synthetic bell defaults to a 4 s note ([Pure Data D07 example](https://github.com/pure-data/pure-data/blob/master/doc/3.audio.examples/D07.additive.pd)). The upper limit of about 4.5 s comes from this app: the shortest bound is 5 s and `ringFromTop` restarts the same player, so a longer file could be cut off by its own next ring **[inference]**. Give the fundamental a T60 of roughly 3–4 s (decay constant τ ≈ 0.45–0.6 s). Let the tail fall to about −50 to −60 dB below the peak before a short final fade **[inference]**.
2. **Higher partials should decay faster, and the current model already does this. Keep that rule.** Bell measurements and synthesis models agree on it ([Carvalho et al. 2021](https://doi.org/10.1186/s40494-021-00620-2); [CCCBR Towers & Belfries Committee](https://cccbr.org.uk/wp-content/uploads/2016/03/sound-control-notes.pdf); the relative durations in [Risset's bell](https://github.com/pure-data/pure-data/blob/master/doc/3.audio.examples/D07.additive.pd) fall from 1 to 0.075 as frequency rises).
3. **Add beating, the main thing the synthesis lacks.** Split two or three of the lowest partials into pairs about 0.5–3 Hz apart. Real bells and bowls have these "modal pairs", and the slow warble they cause is a defining part of their sound. Measured splits: 1.4–1.6 Hz on a singing bowl ([Imbery, Jensen & Weber, DAGA 2014](https://pub.dega-akustik.de/DAGA_2014/data/articles/000254.pdf)), 6.68 Hz on another bowl ([Kim & Choi 2023](https://doi.org/10.3390/ijerph20126180)), 2.5 Hz on a small handbell ([Csound manual, modal ratios table](https://csound.com/manual/misc/modalfreq/)). Risset's synthetic bell detunes its pairs by +1 Hz and +1.7 Hz ([Pd D07](https://github.com/pure-data/pure-data/blob/master/doc/3.audio.examples/D07.additive.pd)).
4. **Pick one coherent partial model.** For a singing-bowl or "rin" character, use bowl ratios of about 1 : 2.7–2.8 : 4.8–5.2 : 7.5–8.2 : 10.6–11.7 (three bowls, [Csound manual](https://csound.com/manual/misc/modalfreq/)). For a church-bell character, use 0.5 : 1 : 1.2 : 1.5 : 2 (hum, prime, tierce, quint, nominal; [Young, Collier & Stearns, Physics Today](https://physicstoday.aip.org/quick-study/what-did-the-liberty-bell-sound-like)). The current set is a hybrid; see the last section.
5. **Keep the fundamental at or below about 1 kHz, and put several strong partials in 1–4 kHz.** Patterson's warning guidelines put the fundamental at 150–1000 Hz, with at least four prominent components in 1.0–4.0 kHz and all prominent components within 0.5–5.0 kHz ([Patterson 1982, CAA Paper 82017](https://www.pdn.cam.ac.uk/system/files/documents/AuditoryWarningSystems_CAA82017.pdf)). A higher pitch is judged more urgent ([Edworthy, Loxley & Dennis 1991](https://doi.org/10.1177/001872089103300206), summarised by [Suied, Susini & McAdams 2008](https://www.mcgill.ca/mpcl/files/mpcl/suied_2008_jepappl.pdf)). White's D6 (1175 Hz) is above that range. Moving White to about 600–900 Hz would make it calmer, while its upper partials still carry it on a phone speaker **[inference]**. Black at D5 (587 Hz) is already inside the range.
6. **Use slow repetition for a calm cue.** Patterson: non-urgent warnings should have pulse gaps over 300 ms, and urgent ones under 150 ms ([CAA 82017, App. C](https://www.pdn.cam.ac.uk/system/files/documents/AuditoryWarningSystems_CAA82017.pdf)). Rate is the strongest single driver of urgency ([Hellier, Edworthy & Dennis 1993](https://doi.org/10.1177/001872089303500408), as summarised by [Suied et al. 2008](https://www.mcgill.ca/mpcl/files/mpcl/suied_2008_jepappl.pdf)). White's echo at 160 ms sits near the urgent end. Drop it or move it beyond about 300 ms. Black's second strike at 320 ms is just inside "non-urgent"; 400–600 ms would be calmer **[inference]**.
7. **Keep a fast strike but soften its brightness rather than lengthening the ramp.** A real clapper is in contact for 0.2–3 ms ([Carvalho et al. 2021](https://doi.org/10.1186/s40494-021-00620-2)), so a 20–30 ms ramp would stop it sounding like a bell. Patterson's 20–30 ms onsets are meant for alarms at high levels. He says startle risk is minimal below 90 dB SPL when the level rises at under 1 dB/ms ([CAA 82017 §2.1.1](https://www.pdn.cam.ac.uk/system/files/documents/AuditoryWarningSystems_CAA82017.pdf)). To be calm, lower the strike's high-partial energy (a "softer mallet") instead; Material describes a softer attack as "more ambient" ([Material Design, Sound attributes](https://web.archive.org/web/20191118135354/https://material.io/design/sound/sound-attributes.html)).
8. **Match the two sounds by loudness and keep peak headroom.** The two files already match: both reach a maximum momentary loudness of about −13.3 LUFS, with true peaks of about −3 dBTP (my measurement, below). Keep them matched when regenerating, by normalising to loudness rather than to peak **[inference]**. Stay below −1 dBTP ([EBU R 128](https://tech.ebu.ch/docs/r/r128.pdf)). Leave the overall level to the system volume ([Apple HIG, Playing audio](https://developer.apple.com/design/human-interface-guidelines/playing-audio)).
9. **Keep the format: mono 16-bit linear-PCM WAV.** If these sounds are ever reused as iOS notification sounds, Apple requires linear PCM, IMA4, µLaw or aLaw in an aiff, wav or caf file, under 30 s long ([UNNotificationSound](https://developer.apple.com/documentation/usernotifications/unnotificationsound)).
10. **Keep the current playback mode.** Playing through the silent switch and mixing with other audio matches Apple's guidance; details are in section 4.

## 1. Acoustics of real bells, bowls and gongs

### Partial structure

- **Church bells.** The five main partials of a tuned Western bell are the hum, prime (fundamental), tierce, quint and nominal. Their ideal ratios are 0.5, 1.0, 1.2, 1.5 and 2.0 relative to the prime ([Young, Collier & Stearns, "What did the Liberty Bell sound like?", Physics Today](https://physicstoday.aip.org/quick-study/what-did-the-liberty-bell-sound-like)). A measured replica came out at 0.54, 1.00, 1.18, 1.58 and 1.93 (same source). The nominal is the tuning reference, and on most church bells it lies at 500–1200 Hz ([CCCBR Towers & Belfries Committee, *Sound control in belltowers*](https://cccbr.org.uk/wp-content/uploads/2016/03/sound-control-notes.pdf)). The perceived pitch is a subjective "strike note" ([Physics Today](https://physicstoday.aip.org/quick-study/what-did-the-liberty-bell-sound-like)). The strike note is not necessarily the frequency of any one partial **[unverified: secondary sources only]**.
- **Singing bowls.** A bowl's struck sound is strongly inharmonic ([Wilkerson, Serafin & Ng, ICMC 2002](https://ccrma.stanford.edu/~carmenng/250b/icmc2002.pdf)). Measured partials of a bowl 21 cm across: 186, 551, 1007, 1627 and 2337 Hz, which is 1 : 2.96 : 5.41 : 8.75 : 12.56 ([Wilkerson et al., Table 1](https://ccrma.stanford.edu/~carmenng/250b/icmc2002.pdf)). A compiled table in the Csound manual gives three Tibetan bowls (180, 152 and 140 mm) at 1 : 2.78 : 5.18 : 8.16 : 11.66 : 15.64 : 19.99, 1 : 2.66 : 4.84 : 7.52 : 10.64 : 14.21 : 18.14, and 1 : 2.77 : 5.12 : 7.81 : 10.78 ([Csound manual, Appendix "Modal Frequency Ratios"](https://csound.com/manual/misc/modalfreq/)). That table is a student compilation that the manual labels "caveat emptor". Squat bowls mainly vibrate in their (n,0) rim modes ([Terwagne & Bush 2011, *Nonlinearity* 24 R51, arXiv:1106.6348](https://arxiv.org/abs/1106.6348)).
- **Bars, for comparison.** A uniform free-free bar (glockenspiel or aluminium bar) has partials at 1 : 2.756 : 5.40 : 8.93. That follows from the Euler–Bernoulli beam roots (βL = 4.730, 7.853, 10.996, so (7.853/4.730)² = 2.756 and (10.996/4.730)² = 5.404); the Csound table gives 1 : 2.756 : 5.423 : 8.988 for an aluminium bar ([Csound manual](https://csound.com/manual/misc/modalfreq/)). The first few bowl ratios sit close to the bar ratios, which matters for how the current asset reads (see the last section).
- **Gongs.** I found no primary source on gong partials that I could read in full. **[unverified]** Fletcher & Rossing, *The Physics of Musical Instruments*, and Rossing, *Science of Percussion Instruments*, are the standard references, but I could not access them.

### Degenerate modes split into pairs, which makes them beat

- A perfectly symmetric bell would have its modes in identical pairs. Real bells are not perfectly symmetric, so each pair splits into two slightly different frequencies, and these beat. Campanologists call this beating "warble" ([Carvalho, Debut & Antunes 2021, *Heritage Science* 9:154](https://doi.org/10.1186/s40494-021-00620-2)). The Physics Today authors note that the near-matched pitches "beat with one another and contribute a subtle harshness" ([Physics Today](https://physicstoday.aip.org/quick-study/what-did-the-liberty-bell-sound-like)).
- Singing bowls get "their characteristic beating sound due to paired partial tones … so called modal pairs" from being hand-hammered. For example, one bowl had pairs at 85.5 / 87.1 Hz and 173.1 / 174.5 Hz ([Imbery, Jensen & Weber, DAGA 2014](https://pub.dega-akustik.de/DAGA_2014/data/articles/000254.pdf)). Another bowl had a 6.68 Hz split at its fundamental of 482.61 Hz ([Kim & Choi 2023](https://doi.org/10.3390/ijerph20126180)). In the bowl studied by Terwagne & Bush, the split peaks are "separated by several Hz" ([arXiv:1106.6348](https://arxiv.org/abs/1106.6348)).
- A small handbell in the Csound table has every partial doubled: 1312.0/1314.5, 2353.3/2362.9, 3306.5/3309.4 Hz, and so on ([Csound manual](https://csound.com/manual/misc/modalfreq/)).

### Decay

- In bells, high-frequency partials decay quickly. In the synthesised and measured carillon bell, "the highest frequencies decay very quickly and the lower ones slowly emerge from the bright initial sound until only the hum-note remains" ([Carvalho et al. 2021](https://doi.org/10.1186/s40494-021-00620-2)). The church-bell guidance agrees: the nominal and quint are "high-intensity and short duration", while the hum, prime and tierce are "lower intensity but of long duration" ([CCCBR](https://cccbr.org.uk/wp-content/uploads/2016/03/sound-control-notes.pdf)).
- How long they ring:
  - Carillon-bell decay times are "of the same order" as the 12 s recordings used to measure them ([Carvalho et al. 2021](https://doi.org/10.1186/s40494-021-00620-2)).
  - A struck singing bowl "decays exponentially and lasts for about 50 s" ([Kim & Choi 2023](https://doi.org/10.3390/ijerph20126180)).
  - Bowl recordings for directivity analysis were taken 45 s long ([Imbery et al. 2014](https://pub.dega-akustik.de/DAGA_2014/data/articles/000254.pdf)).
  - A bowl's resonances "show a long decay time" ([Wilkerson et al. 2002](https://ccrma.stanford.edu/~carmenng/250b/icmc2002.pdf)).
- I found no open primary source tabulating T60 per partial for small bells. **[unverified]**

### The strike

- A bell's clapper is modelled with Hertzian contact. The contact time is "usually in the range 0.2–0.5 ms", which "causes the excitation of a wide frequency range". The authors' own simulated impact had a contact time of about 3 ms, which they describe as matching typical real impacts ([Carvalho et al. 2021](https://doi.org/10.1186/s40494-021-00620-2)).
- For bowls, "the force of the blow, the hardness of the striking object and the point of percussion" control tone and volume ([Wilkerson et al. 2002](https://ccrma.stanford.edu/~carmenng/250b/icmc2002.pdf)). A wooden mallet excites several modes at once; rubbing locks onto the lowest mode and its harmonics ([Terwagne & Bush 2011](https://arxiv.org/abs/1106.6348)).
- **[inference]** A softer or heavier mallet stays in contact longer, which puts less energy into high partials. In synthesis, that means lowering the starting amplitude of the high partials, not slowing the attack ramp.

## 2. Synthesis approaches

- **Modal synthesis** treats the sound as a sum of exponentially damped sinusoids, h(t) = Σ Aₙ·e^(−ωₙζₙt)·sin(ωₙ√(1−ζₙ²)t), each with its own frequency, damping and amplitude. Carvalho et al. identify these parameters from measurements and then resynthesise bells from them ([Carvalho et al. 2021, eq. 4](https://doi.org/10.1186/s40494-021-00620-2)). `synthesize-bell.mjs` is a five-mode instance of this model.
- **Risset's additive bell** (Risset & Mathews 1969) uses 11 partials, each with its own amplitude, duration and frequency, and a simple attack/decay envelope ([Puckette, *Theory and Techniques of Electronic Music*, Risset bell example](https://msp.ucsd.edu/techniques/latest/book-html/node71.html)). The Pd source lists the parameters as (amplitude, relative duration, relative frequency, detune in Hz) ([D07.additive.pd](https://github.com/pure-data/pure-data/blob/master/doc/3.audio.examples/D07.additive.pd)):

  | relative freq | detune | amplitude | relative duration |
  |---|---|---|---|
  | 0.56 | 0 | 1 | 1 |
  | 0.56 | +1 Hz | 0.67 | 0.9 |
  | 0.92 | 0 | 1 | 0.65 |
  | 0.92 | +1.7 Hz | 1.8 | 0.55 |
  | 1.19 | 0 | 2.67 | 0.32 |
  | 1.7 | 0 | 1.67 | 0.35 |
  | 2 | 0 | 1.46 | 0.25 |
  | 2.74 | 0 | 1.33 | 0.2 |
  | 3 | 0 | 1.33 | 0.15 |
  | 3.76 | 0 | 1 | 0.1 |
  | 4.07 | 0 | 1.33 | 0.075 |

  The default note is 4000 ms at MIDI 72 (same file). Three design moves stand out:
  - The lowest partials (0.56, 0.92) sit below the nominal pitch, like a bell's hum and prime.
  - Two of the low partials are doubled with 1 Hz and 1.7 Hz detunes, which produces beating.
  - Duration shrinks steadily as partial frequency rises.
- **Physical models of bowls** use one pair of digital waveguides per partial. The two delay lines differ by about three samples, which reproduces the beating ([Wilkerson et al. 2002](https://ccrma.stanford.edu/~carmenng/250b/icmc2002.pdf), building on Essl & Cook's banded waveguides). The strike excitation was taken from the residual left after inverse-filtering a real strike (same source).
- **Julius O. Smith's CCRMA pages** (*Physical Audio Signal Processing*) cover modal and waveguide synthesis in general. The "Bell Modeling" page I could reach only cites Karjalainen et al., so I don't draw any bell-specific parameters from it ([pasp05 Bell_Modeling](https://ccrma.stanford.edu/~jos/pasp05/Bell_Modeling.html)).

What matters for a convincing, non-harsh bell, from the sources above:
- inharmonic partials;
- per-partial decay, faster for higher partials;
- split pairs that beat slowly;
- a broadband but brief strike;
- partial amplitudes that settle the perceived pitch. For inharmonic sounds the pitch "does depend on the relative amplitude of the components" ([Patterson 1982 §3.3.1](https://www.pdn.cam.ac.uk/system/files/documents/AuditoryWarningSystems_CAA82017.pdf)).

Physics Today attributes the "subtle harshness" to near-matched pairs ([Physics Today](https://physicstoday.aip.org/quick-study/what-did-the-liberty-bell-sound-like)). So keep the splits slow, a few Hz at most, and below fast roughness rates **[inference]**.

## 3. Being noticed without startling

### Warning-sound research, applied in reverse

Patterson's guidelines for flight-deck warnings ([CAA Paper 82017, 1982](https://www.pdn.cam.ac.uk/system/files/documents/AuditoryWarningSystems_CAA82017.pdf), Appendix C and §§1–3):

- **Level:** prominent components should sit 15–25 dB above the masked threshold set by background noise.
- **Onset and offset:** 20–30 ms, rounded and concave-down. Pulses should last 100–150 ms.
- **Startle:** "When the onset rises slower than 1 dB/ms … and if the final level is under 90 dB SPL, the chance of a startle reaction is minimal." Abrupt onsets "are not justified" for attention: "the change does not need to cause a startle reaction in order to capture attention".
- **Escalation:** to be "arresting but not startling", start the warning at a comparatively low level and raise the level over successive pulses.
- **Spacing:** gaps under 150 ms for urgent warnings, over 300 ms for non-urgent ones.
- **Spectrum:** components within 0.5–5.0 kHz. The fundamental should be 150–1000 Hz, with at least four prominent components in 1.0–4.0 kHz.
- **Small speakers:** "A pocket radio with a small speaker transmits very little energy in the region below 300 Hz", but listeners still hear the pitch because "it is the harmonics … transmitted by the small speaker, that carry the pitch" (residue pitch, §3.2.1).

Edworthy, Loxley & Dennis found that fundamental frequency, harmonic series, envelope shape, delayed harmonics, speed, rhythm, pitch range and melodic structure all affect perceived urgency ([Human Factors 33(2) 1991, abstract](https://doi.org/10.1177/001872089103300206)). The directions of these effects come from a peer-reviewed summary, not the original paper: "the faster the rate, the higher the pitch, and … the more randomly irregular the frequencies of the harmonics, the greater the perceived urgency". Hellier et al. (1993) later found rate to be "the most efficient parameter to communicate urgency" ([Suied, Susini & McAdams 2008, *J. Exp. Psych.: Applied* 14(3)](https://www.mcgill.ca/mpcl/files/mpcl/suied_2008_jepappl.pdf)). Suied et al. also measured that reaction time falls as the inter-onset interval shortens. **[unverified: I did not read the 1991 or 1993 full texts.]**

**[inference] Applied in reverse for a calm cue:**
- a moderate, not high, fundamental;
- a single strike or slowly spaced strikes;
- a decaying (falling) envelope;
- inharmonicity that is structured (a fixed bell-like set of ratios) rather than random.

**[unverified]** IEC 60601-1-8 (medical alarm signals) is paywalled. I did not read it and make no claims from it.

### Platform guidance

- **Apple HIG, Playing audio** ([link](https://developer.apple.com/design/human-interface-guidelines/playing-audio)):
  - In silent mode, a device "plays only the audio that people explicitly initiate, like media playback, alarms, and audio/video messaging".
  - "The system volume always governs the final output". Apps should adjust only relative levels.
  - "Don't make people stop listening to music from another app if you don't need to."
- **Material Design, Sound** (archived 2019 pages; the live m2.material.io pages need JavaScript):
  - Notifications "should generally be shorter than hero sounds and crafted in a way that is suitable for being played multiple times". They "should be designed to be audible from a variable range of user distances".
  - Alarms and timers "can accommodate … gentler or more abrupt sounds" ([Applying sound to UI](https://web.archive.org/web/2019/https://material.io/design/sound/applying-sound-to-ui.html)).
  - "Use softer, quieter timbres for low-priority sounds". "Brighter sounds feel louder". Muted timbres can be hard to hear in busy places.
  - "A softer attack is more ambient". "A longer decay feels large and slow".
  - Delay (echo) "should be used purposefully and sparingly" ([Sound attributes](https://web.archive.org/web/20191118135354/https://material.io/design/sound/sound-attributes.html)).

## 4. Playback on phones

- **Small-speaker frequency response.** I found no primary measurement of current iPhone or Android loudspeaker responses. **[unverified]** The only primary statement I have is Patterson's pocket-radio remark above, from 1982. The design consequence still holds: put prominent energy at 0.5–5 kHz and rely on upper partials to carry pitch ([CAA 82017](https://www.pdn.cam.ac.uk/system/files/documents/AuditoryWarningSystems_CAA82017.pdf)). Both current assets keep every partial above 587 Hz, so this is not a problem today. It would matter if someone added a bell-like "hum" an octave below the fundamental.
- **Loudness and peaks.**
  - EBU R 128 targets −23 LUFS for programmes, with a maximum true peak of −1 dBTP ([EBU R 128-2023](https://tech.ebu.ch/docs/r/r128.pdf)).
  - For short-form content, the short-term loudness (3 s window) should not exceed −18 LUFS ([EBU R 128 s1](https://tech.ebu.ch/docs/r/r128s1.pdf)).
  - These are broadcast norms for whole programmes, so their absolute targets don't carry over to a one-off cue played at the user's chosen volume. Two things do apply: the −1 dBTP ceiling, and using loudness (ITU-R BS.1770 K-weighting, [ITU-R BS.1770](https://www.itu.int/rec/R-REC-BS.1770)) rather than peak to match the two phase sounds **[inference]**.
- **Length and endings.**
  - iOS falls back to the default sound when a notification sound file is 30 s or longer ([UNNotificationSound](https://developer.apple.com/documentation/usernotifications/unnotificationsound)).
  - Within the app, the real limit is the 5 s shortest bound (`SHORTEST_BOUND_SECONDS` in `src/setup.ts`). If only one phase is enabled, its player is restarted from the top by `ringFromTop` (`src/bell.ts`) every ≥5 s.
  - A fade should come only after the tail is already quiet. Cutting a decay short is audible as an unnatural stop **[inference]**.
- **Format.** Linear PCM in WAV, CAF or AIFF is accepted for iOS system and notification sounds ([UNNotificationSound](https://developer.apple.com/documentation/usernotifications/unnotificationsound)). Mono at 44.1 kHz and 16 bits is ample for a cue. The files are small (106 KB and 141 KB), so compression gains little.

## 5. What meditation-timer apps do (practice, not evidence)

I could not reach a first-party help page from Insight Timer or similar apps. The only descriptions I found are third-party, so I draw nothing from them. They mention recorded bells "of varying size and metal compositions", a configurable 1–20 s delay between repeated strikes, and ringing through the silent switch ([AppleVis listing of Insight Timer](https://applevis.com/comment/2381)). **[unverified]**

## How the current assets compare

All figures are from `scripts/synthesize-bell.mjs`, the `afinfo` output, and my own analysis script. I measured loudness with a hand-written BS.1770 K-weighting filter and estimated true peak with 4× sinc interpolation, so treat those values as approximate.

| | White `bell.wav` | Black `black.wav` |
|---|---|---|
| Fundamental | 1175 Hz (D6) | 587 Hz (D5) |
| Partials (Hz) | 1175, 2362, 3243, 4782, 6345 | 587, 1180, 1620, 2389, 3170 |
| Partial T60 (6.91·τ) | 2.4, 1.5, 1.1, 0.7, 0.4 s | 3.4, 2.1, 1.5, 1.0, 0.6 s |
| File length | 1.2 s | 1.6 s |
| Level when the 50 ms fade starts | about −26 dB below the first strike (computed) | about −17 dB below (computed) |
| Peak in the last 50 ms, relative to file peak | −32 dB | −25 dB |
| Strike pattern | strike, plus echo at 160 ms (×0.25) | strikes at 0 and 320 ms (×0.85), plus echo at 480 ms |
| Max momentary loudness | −13.3 LUFS | −13.3 LUFS |
| Sample peak / approx. true peak | −3.1 dBFS / −2.9 dBTP | −3.1 dBFS / −3.1 dBTP |

What already fits the sources:
- inharmonic partials, each decaying on its own, with higher partials decaying faster ([Carvalho et al.](https://doi.org/10.1186/s40494-021-00620-2), [CCCBR](https://cccbr.org.uk/wp-content/uploads/2016/03/sound-control-notes.pdf), [Risset/Pd](https://github.com/pure-data/pure-data/blob/master/doc/3.audio.examples/D07.additive.pd));
- a brief strike (2 ms, consistent with the 0.2–3 ms clapper contact);
- prominent energy within Patterson's 0.5–5 kHz region. White's 5th partial is slightly above it, at 6.3 kHz;
- the two sounds are loudness-matched and peak below −1 dBTP;
- the playback mode matches the Apple HIG;
- the two phases are told apart by both pitch and rhythm.

Where they diverge:
- **Too short for a bell.** The fundamental's own T60 is 2.4 s (White) and 3.4 s (Black), but the files end at 1.2 and 1.6 s. Black is cut while still only about 17 dB below its strike, and the 50 ms fade turns that into an audible stop **[inference]**. Real bells and bowls ring for 10–50 s; Risset's bell lasts 4 s.
- **No beating.** Every partial is a single sine, so the tone is static. Modal pairs are the most characteristic feature of real bells and bowls.
- **Hybrid partial set.** The ratios 1 : 2.01 : 2.76 : 4.07 : 5.4 mix two models:
  - 2.76 and 5.4 match a free-free bar or a bowl's 2nd and 3rd modes (2.66–2.78 and 4.84–5.18).
  - 2.01 and 4.07 echo Risset's partials at 2 and 4.07.
  - The result reads closer to a glockenspiel or bowl than a church bell, which is fine for a "soft bell". Continuing the bowl series (about 8, 11.5) or adding Risset's sub-partials would give a fuller, more bowl-like or bell-like body **[inference]**.
- **White's pitch is high for a calm cue.** 1175 Hz is above Patterson's 1000 Hz upper bound for warning fundamentals, and higher pitch reads as more urgent (Edworthy).
- **White's echo at 160 ms** is close to Patterson's under-150 ms "urgent" spacing. A real bell has no such discrete echo, and Material advises using delay sparingly.
- **Peak-normalised, not loudness-normalised.** `toWav` scales each file to a 0.7 peak. The resulting loudness match is a side effect of that, not something the script guarantees.

## Sources

Primary or peer-reviewed sources that I read:
- Carvalho M., Debut V., Antunes J. (2021). Physical modelling techniques for the dynamical characterization and sound synthesis of historical bells. *Heritage Science* 9. https://doi.org/10.1186/s40494-021-00620-2
- Imbery C., Jensen B., Weber R. (2014). Spectral Directivity of Singing Bowls. DAGA 2014, Oldenburg. https://pub.dega-akustik.de/DAGA_2014/data/articles/000254.pdf
- Kim S.-C., Choi M.-J. (2023). Does the Sound of a Singing Bowl Synchronize Meditational Brainwaves in the Listeners? *IJERPH* 20(12):6180. https://doi.org/10.3390/ijerph20126180 ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10298245/))
- Terwagne D., Bush J. W. M. (2011). Tibetan singing bowls. *Nonlinearity* 24 R51. https://arxiv.org/abs/1106.6348
- Wilkerson C., Serafin S., Ng C. (2002). Physical Model Synthesis and Performance Mappings of Bowl Resonators. ICMC 2002. https://ccrma.stanford.edu/~carmenng/250b/icmc2002.pdf
- Young J., Collier S., Stearns A. What did the Liberty Bell sound like? *Physics Today* Quick Study. https://physicstoday.aip.org/quick-study/what-did-the-liberty-bell-sound-like
- Central Council of Church Bell Ringers, Towers & Belfries Committee. Sound control in belltowers (notes). https://cccbr.org.uk/wp-content/uploads/2016/03/sound-control-notes.pdf
- Patterson R. D. (1982). Guidelines for auditory warning systems on civil aircraft. CAA Paper 82017. https://www.pdn.cam.ac.uk/system/files/documents/AuditoryWarningSystems_CAA82017.pdf
- Suied C., Susini P., McAdams S. (2008). Evaluating Warning Sound Urgency With Reaction Times. *J. Exp. Psych.: Applied* 14(3). https://www.mcgill.ca/mpcl/files/mpcl/suied_2008_jepappl.pdf
- Edworthy J., Loxley S., Dennis I. (1991). *Human Factors* 33(2) 205–231, abstract only. https://doi.org/10.1177/001872089103300206
- Hellier E., Edworthy J., Dennis I. (1993). *Human Factors* 35(4) 693–706, abstract only. https://doi.org/10.1177/001872089303500408

Synthesis references (source code and manuals):
- Pure Data, `doc/3.audio.examples/D07.additive.pd` (Risset bell parameters). https://github.com/pure-data/pure-data/blob/master/doc/3.audio.examples/D07.additive.pd
- Puckette M. *Theory and Techniques of Electronic Music*, Risset bell section. https://msp.ucsd.edu/techniques/latest/book-html/node71.html
- Csound manual, Modal Frequency Ratios. https://csound.com/manual/misc/modalfreq/
- Smith J. O. *Physical Audio Signal Processing* (2005 ed.), Bell Modeling. https://ccrma.stanford.edu/~jos/pasp05/Bell_Modeling.html

Platform and standards documents:
- Apple Human Interface Guidelines, Playing audio. https://developer.apple.com/design/human-interface-guidelines/playing-audio
- Apple Developer, UNNotificationSound. https://developer.apple.com/documentation/usernotifications/unnotificationsound
- Material Design (2019 archive), Applying sound to UI. https://web.archive.org/web/2019/https://material.io/design/sound/applying-sound-to-ui.html
- Material Design (2019 archive), Sound attributes. https://web.archive.org/web/20191118135354/https://material.io/design/sound/sound-attributes.html
- EBU R 128-2023. https://tech.ebu.ch/docs/r/r128.pdf; EBU R 128 s1 (short-form). https://tech.ebu.ch/docs/r/r128s1.pdf
- ITU-R BS.1770. https://www.itu.int/rec/R-REC-BS.1770

Not verified (not accessible or not primary): Fletcher & Rossing, *The Physics of Musical Instruments*; Rossing, *Science of Percussion Instruments*; Inácio, Henrique & Antunes (2006), *Acta Acustica*; IEC 60601-1-8; Risset & Mathews (1969), *Physics Today*; phone loudspeaker frequency-response measurements; first-party meditation-app help pages.
