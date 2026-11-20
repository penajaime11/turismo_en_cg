import json

with open(r'C:\Users\Jaime\.gemini\antigravity\brain\5a415639-288d-45e6-b66b-e58f0f4877c5\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        d = json.loads(line)
        si = d.get('step_index')
        if si and 336 <= si <= 346:
            for tc in d.get('tool_calls', []):
                print(f"Step {si} call: {tc.get('tool_name')} {tc.get('parameters')}")
