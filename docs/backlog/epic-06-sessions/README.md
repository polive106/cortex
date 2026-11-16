# E6: Session history

A sidebar in the web UI lists the signed-in user's earlier sessions, most recent first, so they can reopen, rename, or delete one. eve has no route that lists sessions, so companion records each session's activity in a session index in Upstash Redis (ADR-0013) and serves it from `/eve/<agent>/sessions`.

| ID | Title | Complexity | Status |
|----|-------|------------|--------|
| E6-US01 | Session index domain and adapters | L | Done |
| E6-US02 | Session recording hook and sessions route | M | Done |
| E6-US03 | Session sidebar with rename and delete | M | Done |
