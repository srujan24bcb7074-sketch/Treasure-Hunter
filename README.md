# Anime Treasure Hunt

Current build: core team sessions + database + protected QR stage progression.

## Run

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Create `.env` from `.env.example` and keep secrets private.

Set unique random values for QR2_TOKEN through QR5_TOKEN. The physical QR codes will use the corresponding scanner URL. Do not publish the token values separately.

Current flow: Welcome → Story → Registration → Clue 1 → Clue 2 → Clue 3 → Clue 4 → Clue 5. Admin controlled.

The QR API verifies the logged-in team's current stage before advancing it and records stage timestamps in PostgreSQL.

`/qr-test` is a temporary development helper and should be removed before deployment.
