# QA Service

Simple Node/Express service that answers natural-language questions about member messages.

Run locally:
1. Ensure Node.js >= 18 is installed.
2. In the project folder:
   npm install
   npm start
3. Query:
   GET http://localhost:3000/ask?q=When+is+Layla+planning+her+trip+to+London?
   GET http://localhost:3000/ask?q=How%20many%20cars%20does%20Vikram%20Desai%20have
   GET http://localhost:3000/ask?q=What%20are%20Amira%E2%80%99s%20favorite%20restaurants


Output:
{ "answer": "..." }

Notes / alternatives considered:
- Use a lightweight retrieval + rule-based extractor (chosen) for simplicity and zero-cost deployment.
- Use embeddings + semantic search (e.g., OpenAI embeddings or FAISS) for much better relevance.
- Build custom NER and relation extraction to extract dates/locations for precise answers.

Data insights:
- The service assumes messages include text and member.displayName. Some messages may store text under different keys (content, body, note) — code attempts to handle common variants.
- Inconsistent naming or abbreviated member names may reduce matching accuracy.
- Dates in free text vary in format; extracting exact dates reliably requires a date parser / normalized timeline.

Deployment:

- This app can be deployed to Cloud Run, Heroku, or Vercel. Ensure PORT is honored and Node >=18 available.
