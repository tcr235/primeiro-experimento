# Backend (Express + TypeScript)

Simple CRUD API for questions and alternatives.

Run locally:

1. cd backend
2. npm install
3. npm run dev

API endpoints:

- GET /questions
- POST /questions { description, alternatives? }
- PUT /questions/:id { description?, alternatives? }
- DELETE /questions/:id

Data is saved to `backend/data/questions.json`.
