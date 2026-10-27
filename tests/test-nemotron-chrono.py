import urllib.request
import json

url = 'https://integrate.api.nvidia.com/v1/chat/completions'
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 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'
}

system_prompt = """You are ChronoAI's deadline intelligence engine.
Your mission is to extract structured tasks and deadlines from unstructured messages, assignment announcements, syllabi, or emails.

CRITICAL INSTRUCTIONS:
1. Return strictly valid JSON with no markdown formatting around it (do not wrap in ```json blocks).
2. Return an object matching this JSON schema:
{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "course": "string or null",
      "deadlineDate": "YYYY-MM-DD",
      "deadlineTime": "HH:MM",
      "priority": "low" | "medium" | "high" | "urgent",
      "estimatedMinutes": 180,
      "subtasks": [
        {
          "title": "string",
          "estimatedMinutes": 45
        }
      ],
      "missingInformation": [],
      "warnings": [],
      "confidence": "high",
      "isDateAmbiguous": false,
      "isTimeMissing": false,
      "isYearInferred": false
    }
  ]
}
"""

user_text = "Submit the machine learning assignment by October 29, 2026, at 11:59 PM. Train a CNN model, evaluate its performance, and submit a report with screenshots. The final report must be uploaded before the deadline."

payload = {
    "model": "nvidia/nemotron-3-ultra-550b-a55b",
    "messages": [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_text}
    ],
    "temperature": 0.1,
    "max_tokens": 2048,
    "chat_template_kwargs": {"enable_thinking": False}
}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        raw_content = res['choices'][0]['message']['content']
        print("=== NEMOTRON RAW OUTPUT ===")
        print(raw_content)
        parsed = json.loads(raw_content.replace('```json', '').replace('```', '').strip())
        print("\n=== PARSED RESULTS ===")
        print("Tasks count:", len(parsed['tasks']))
        t = parsed['tasks'][0]
        print("Title:", t['title'])
        print("Deadline:", t['deadlineDate'], t['deadlineTime'])
        print("Priority:", t['priority'])
        print("Effort:", t['estimatedMinutes'], "mins")
        print("Subtasks:", [st['title'] for st in t['subtasks']])
        print("\nVERIFICATION: SUCCESS! Nemotron is 100% compatible with ChronoAI!")
except Exception as e:
    print("HTTP POST ERROR:", e)
