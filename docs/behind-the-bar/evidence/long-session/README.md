# Eight-hour laptop sessions

The owner requested a longer session after the 20-minute helper expiry made /pair unreachable. The default is now 8 hours. BTB_SESSION_HOURS accepts whole hours from 1 to 24. The native reader duration follows the same setting and accepts up to 24 hours; packet validation and same-tab pairing storage share that 24-hour upper bound. The pairing page displays the actual expiry rather than a stale relative 20-minute promise. Native freshness remains 250 ms, and focus loss, expiry and restart still disarm.

Native reader build and presence check pass on the actual M4 Pro (two sensors). Web build passes. All 21 targeted native-stream and pairing-recovery tests pass in 28.3 seconds, including eight-hour pairing→reload preservation and eight-hour expiry→disarm→forget. The protocol rejects expired and over 24-hour reports. Five invalid helper settings (0,25,NaN,1.5,empty) were rejected before launching a reader.

Public deployment and new real-helper health evidence follow after publication. No simulated clock test is described as eight hours of elapsed physical runtime.
