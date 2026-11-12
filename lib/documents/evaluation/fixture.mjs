export const documentFixture = `[Page 1]
1. RIVERWATCH FIELD NODE
RiverWatch is a prototype field node for monitoring small freshwater streams. It records turbidity and water temperature and sends summaries to watershed volunteers.

2. PROJECT GOALS
Its goals are to detect sudden turbidity increases, preserve measurements during network outages, and provide daily summaries to watershed volunteers.

3. HARDWARE COMPONENTS
Hardware components include a Raspberry Pi Zero 2 W, an optical turbidity sensor, a waterproof temperature probe, a LoRa radio, and a 12-volt battery.

4. SAMPLING WORKFLOW
Every five minutes, the controller samples both probes, attaches a UTC timestamp, writes the reading to local SQLite, and queues a summary for LoRa transmission.

[Page 2]
5. CALIBRATION PROCEDURE
Calibration uses 0 NTU and 100 NTU reference solutions. The operator rinses the optical sensor with clean water, records the zero solution, and then records the 100 NTU solution.

6. ALERT RULE
The node raises a turbidity alert when a reading exceeds 45 NTU. It records the alert locally before attempting radio transmission.

7. NETWORK OUTAGE HANDLING
If the radio link is unavailable, the node retains readings in SQLite and queues summaries for retransmission after the connection returns.

[Page 3]
8. BENCH TRIAL
During a 14-day bench trial, 98.2 percent of scheduled readings were recorded. Median local write latency was 42 milliseconds.

9. RADIO DELIVERY RESULTS
LoRa delivery success was 91.0 percent at one kilometer on an open path. The trial did not measure performance through dense buildings.

10. BATTERY OBSERVATION
At five-minute sampling intervals, the 12-volt battery lasted six days in the bench trial.

[Page 4]
11. MAINTENANCE CHECKLIST
Before calibration, rinse the optical sensor with clean water and inspect the waterproof temperature probe for visible damage.

12. PRIVACY AND DATA HANDLING
The prototype stores readings without volunteer names. Coordinates are rounded to a 100-meter grid before daily summaries are shared.

13. LIMITATIONS
The prototype has not been validated in winter field conditions. Its bench trial used simulated rainfall and did not assess long-term outdoor reliability.

14. NEXT STEPS
The next steps are a winter field trial, a longer battery test, and a review of radio delivery near buildings.`;

const archivePages = Array.from({ length: 240 }, (_, index) => {
  const page = index + 5;
  return `[Page ${page}]
SUPPLEMENTAL OBSERVATORY LOG
This unrelated archive page records cloud cover and wind direction for a separate observatory. It contains no freshwater sensor readings or RiverWatch trial measurements.`;
});

const largeDocumentDistractors = `[Page 245]
1. AQUACULTURE SENSOR PILOT
An unrelated fish-farm pilot samples water every five minutes and stores readings in a local database. Its optical clarity probe is calibrated against 0 NTU and 100 NTU solutions, but the pilot uses a different threshold and reports no RiverWatch measurements.

[Page 246]
2. WIRELESS BENCH COMPARISON
Another team's radio test recorded 91.0 percent delivery over a short indoor route. It did not use LoRa, did not test a one-kilometer open path, and did not measure RiverWatch battery life.

[Page 247]
3. DATA LOGGER MAINTENANCE NOTES
The separate logger retains samples during outages and queues later uploads. Its write latency and storage backend were not measured in the RiverWatch bench trial.`;

const largeDocumentEarly = documentFixture
  .replace(
    "\n4. SAMPLING WORKFLOW\nEvery five minutes, the controller samples both probes, attaches a UTC timestamp, writes the reading to local SQLite, and queues a summary for LoRa transmission.\n",
    "\n",
  )
  .replace(
    "\n8. BENCH TRIAL\nDuring a 14-day bench trial, 98.2 percent of scheduled readings were recorded. Median local write latency was 42 milliseconds.\n",
    "\n",
  );

export const largeDocumentFixture = [
  largeDocumentEarly,
  archivePages.join("\n\n"),
  largeDocumentDistractors,
  `[Page 248]
4. SAMPLING WORKFLOW
Every five minutes, the controller samples both probes, attaches a UTC timestamp, writes the reading to local SQLite, and queues a summary for LoRa transmission.`,
  `[Page 249]
8. BENCH TRIAL
During a 14-day bench trial, 98.2 percent of scheduled readings were recorded. Median local write latency was 42 milliseconds.`,
].join("\n\n");
