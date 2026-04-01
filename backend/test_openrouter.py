from dotenv import load_dotenv
import os, requests
load_dotenv()
r = requests.post('https://openrouter.ai/api/v1/chat/completions',
  headers={'Authorization': f'Bearer {os.getenv("OPENROUTER_API_KEY")}'},
  json={'model': 'google/gemini-2.0-flash-001', 'messages': [{'role': 'user', 'content': 'Say hello in one word'}]}
)
print('Status:', r.status_code)
print('Response:', r.json()['choices'][0]['message']['content'])