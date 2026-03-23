# primeiro-experimento

This workspace contains a small example of a questions manager: a React frontend and a Node.js (Express) backend, both in TypeScript.

Project structure suggested by AGENTS.md has been followed:

- /frontend — React + Vite + TypeScript client
- /backend — Express + TypeScript server

Quick start (from workspace root):

1. Backend

cd backend
npm install
npm run dev

Server will run at http://localhost:4000

2. Frontend

cd frontend
npm install
npm run dev

Open the Vite URL (usually http://localhost:5173) and the app will communicate with the backend on port 4000.

Notes:

- Data is stored in `backend/data/questions.json` (created automatically).
- No authentication is implemented — this is intentionally simple for now.
