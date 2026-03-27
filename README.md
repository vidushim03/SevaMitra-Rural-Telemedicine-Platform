
  # Multilingual Telemedicine App

  This is a code bundle for Multilingual Telemedicine App. The original project is available at https://www.figma.com/design/GuxS3RpvKgvkVMbZDedFEO/Multilingual-Telemedicine-App.

  ## Running the code

  1. Install frontend deps:
  `npm i`

  2. Start signaling backend (terminal 1):
  `cd telemed-backend && npm i && npm start`

  3. Start frontend (terminal 2):
  `npm run dev`

  Defaults:
  - Frontend: `http://localhost:3000` (strict)
  - Signaling server: `http://localhost:4001`

  Optional override:
  - Set `VITE_SIGNALING_SERVER_URL` to point frontend to a different signaling backend URL.
  
