from openai import OpenAI
import json

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="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"
)

# Test 1: Nemotron with enable_thinking: False
print("--- TEST 1: Nemotron with enable_thinking: False ---")
res1 = client.chat.completions.create(
    model="nvidia/nemotron-3-ultra-550b-a55b",
    messages=[
        {"role": "system", "content": 'Output strictly valid JSON: {"answer": 4}'},
        {"role": "user", "content": "What is 2+2?"}
    ],
    temperature=0.1,
    max_tokens=300,
    extra_body={"chat_template_kwargs": {"enable_thinking": False}}
)
print("Output 1:", res1.choices[0].message.content)

# Test 2: meta/llama-3.1-70b-instruct with response_format: json_object
print("\n--- TEST 2: Llama 3.1 70B with response_format ---")
res2 = client.chat.completions.create(
    model="meta/llama-3.1-70b-instruct",
    messages=[
        {"role": "system", "content": 'Output strictly valid JSON: {"answer": 4}'},
        {"role": "user", "content": "What is 2+2?"}
    ],
    temperature=0.1,
    max_tokens=300,
    response_format={"type": "json_object"}
)
print("Output 2:", res2.choices[0].message.content)
