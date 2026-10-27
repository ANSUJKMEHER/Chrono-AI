from openai import OpenAI
import json

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="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"
)

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
      "confidence": "high"
    }
  ]
}
"""

user_text = "Submit the machine learning assignment by October 29, 2026, at 11:59 PM. Train a CNN model, evaluate its performance, and submit a report with screenshots. The final report must be uploaded before the deadline."

try:
    completion = client.chat.completions.create(
        model="nvidia/nemotron-3-ultra-550b-a55b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ],
        temperature=0.1,
        max_tokens=2048,
        extra_body={"chat_template_kwargs": {"enable_thinking": False}}
    )
    res_text = completion.choices[0].message.content
    print("OUTPUT SUCCESS:")
    print(res_text)
    
    # Try parsing JSON
    clean_json = res_text.replace("```json", "").replace("```", "").strip()
    data = json.loads(clean_json)
    print("VALID JSON PARSED! Task title:", data["tasks"][0]["title"])
except Exception as e:
    print("FAILED:", e)
