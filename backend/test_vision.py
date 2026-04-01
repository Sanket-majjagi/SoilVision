from dotenv import load_dotenv
load_dotenv()
import requests, os, base64

# Minimal valid PNG (1x1 red pixel)
import struct, zlib

def make_png():
    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
    raw = b'\x00\xff\x00\x00'
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

b64 = base64.b64encode(make_png()).decode()
headers = {'Authorization': f'Bearer {os.getenv("OPENROUTER_API_KEY")}'}
payload = {
    'model': 'google/gemini-2.0-flash-001',
    'messages': [{'role': 'user', 'content': [
        {'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{b64}'}},
        {'type': 'text', 'text': 'What color is this image? One word.'}
    ]}]
}
r = requests.post('https://openrouter.ai/api/v1/chat/completions', headers=headers, json=payload, timeout=30)
print('Status:', r.status_code)
print('Full response:', r.json())