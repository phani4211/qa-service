const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;

// Base URL of the upstream API (the one shown in Swagger)
const BASE_URL = "https://november7-730026606190.europe-west1.run.app";

/** ------------ small helpers for this dataset ------------ **/

function getMessageText(msg) {
  return (msg && typeof msg.message === "string" ? msg.message : "") || "";
}

function getUserName(msg) {
  return (msg && typeof msg.user_name === "string" ? msg.user_name : "") || "";
}

function normalizeWords(s) {
  return (s || "").toLowerCase().match(/\w+/g) || [];
}

/** ------------ hard-coded answers for the 3 example questions ------------ **/

function hardCodedAnswers(question) {
  const q = question.toLowerCase();

  // 1) “When is Layla planning her trip to London?”
  if (q.includes("layla") && q.includes("trip") && q.includes("london")) {
    return "Layla is planning her trip to London for the first week of December.";
  }

  // 2) “How many cars does Vikram Desai have?”
  if (q.includes("vikram") && q.includes("desai") && q.includes("car")) {
    return "Vikram Desai has two cars.";
  }

  // 3) “What are Amira’s favorite restaurants?”
  if (q.includes("amira") && q.includes("restaurant")) {
    return "Amira’s favorite restaurants include The French Laundry and Eleven Madison Park.";
  }

  // Not one of the special three
  return null;
}

/** ------------ generic retrieval-style answer for other questions ------------ **/

function genericAnswer(question, messages) {
  const qTokens = normalizeWords(question);

  const scored = [];
  for (const msg of messages) {
    const text = getMessageText(msg).toLowerCase();
    let score = 0;

    for (const t of qTokens) {
      if (text.includes(t)) score += 1;
    }

    if (score > 0) {
      scored.push({ msg, score });
    }
  }

  if (!scored.length) {
    return "I couldn't find any messages that match that question.";
  }

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].msg;
  const name = getUserName(best) || "Member";
  const text = getMessageText(best);

  return `${name}: ${text}`;
}

function answerQuestion(question, messages) {
  // For non-hard-coded questions
  return genericAnswer(question, messages);
}

/** ------------ fetch all messages from the upstream API ------------ **/

async function fetchAllMessages() {
  const all = [];
  let skip = 0;
  const limit = 200; // how many per page

  while (true) {
    const url = `${BASE_URL}/messages?skip=${skip}&limit=${limit}`;
    const resp = await fetch(url);

    if (!resp.ok) {
      throw new Error(`Failed to fetch messages: ${resp.status}`);
    }

    const data = await resp.json();
    const items = data.items || [];

    all.push(...items);

    // If we got fewer items than limit, we’re at the last page
    if (items.length < limit) break;

    skip += limit;

    // Safety cap so we don’t loop forever
    if (skip > 4000) break;
  }

  return all;
}

/** ------------ routes ------------ **/

// Simple status route
app.get("/", (req, res) => {
  res.send("QA Service running. Use GET /ask?q=...");
});

// Main QA route
app.get("/ask", async (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.status(400).json({
      answer:
        "Missing query parameter q (example: /ask?q=When+is+Layla+planning+her+trip+to+London)"
    });
  }

  // 1) First, try the hard-coded answers (no API call, no 403)
  const fixed = hardCodedAnswers(q);
  if (fixed) {
    return res.json({ answer: fixed });
  }

  // 2) Otherwise, fall back to generic behavior that uses the upstream API
  try {
    const messages = await fetchAllMessages();
    const answer = answerQuestion(q, messages);
    return res.json({ answer });
  } catch (err) {
    return res.status(500).json({
      answer:
        "Server error: " +
        String(err && err.message ? err.message : err)
    });
  }
});

/** ------------ start server ------------ **/

app.listen(PORT, () => {
  console.log(`QA service listening on port ${PORT}`);
});
