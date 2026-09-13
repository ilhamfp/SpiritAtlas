# Native spoon stirring correction

The owner confirmed real movement on public ebc0579 but reported that it moved the glass instead of stirring the drink. The passive real trace owner-debug-live.json contains 113 armed movement snapshots: GPU circulation remained zero while vessel tilt reached its 0.25 rad bound. This is an input mapping mismatch, not a missing deployed connection.

A separate, explicitly armed Stir-stage mode now routes bias-corrected angular velocity to the spoon and existing TypeGPU circulation. It uses a 2 degree/second deadband, 45 ms smoothing, dominant-axis hysteresis and a 6 rad/second spoon limit. Static tilt adds no stirring. The 100 ms input pulse releases on missing reports, while the existing 250 ms stream timeout, focus loss, stage/reset and local takeover disarm. Move-glass and pour modes remain available separately. No quantities or GPU solver code changed.

Local Vite production preview, 13 September 2026: build passed; 8 motion setup/native stir/stream regression tests passed in 20.2 seconds, including actual GPU response/reversal/settling and upright glass. The native boundary check separately passed, followed by the complete three-vessel preparation/result-preservation check (10.0 seconds). Actual desktop 1440 and phone 390 screenshots were inspected, with no horizontal overflow. Protocol fixtures are test inputs, not physical-device acceptance.

New physical stirring validation must use the deployed correction and an owner gesture. Earlier real movement recordings prove the original hardware connection only. Physical tilt-pour and motion-onset timing remain separately unverified.
