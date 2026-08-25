#!/bin/bash
# Self-contained smoke test: start server → test pipeline → report
cd /home/z/my-project
rm -f /tmp/smoke.log

# Start server
npx next dev -p 3100 > /tmp/smoke.log 2>&1 &
SERVER_PID=$!

# Wait for ready
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/ 2>/dev/null)
  if [ "$code" = "200" ]; then break; fi
  sleep 1
done
echo "SERVER: $code"

# Create project
PROJ=$(curl -s -X POST http://localhost:3100/api/projects -H "Content-Type: application/json" -d '{"name":"Gate Test","locale":"en"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['project']['id'])")
echo "PROJECT: $PROJ"

# Analyze with minimal frames (will exercise the VLM + gate logic)
ANALYZE=$(curl -s -m 180 -X POST "http://localhost:3100/api/projects/$PROJ/analyze" -H "Content-Type: application/json" -d '{
  "frames": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="],
  "duration": 30,
  "transcript": "This morning hack changes everything. Place one strip on your tongue. Let it dissolve. Feel the energy. Try it today.",
  "videoName": "ref-test.mp4"
}')
echo "$ANALYZE" | python3 -c "
import json,sys
try:
    d = json.load(sys.stdin)
    p = d.get('project', {})
    print('STATUS:', p.get('status'))
    a = d.get('analysis', {})
    print('STATS:', a.get('stats'))
    print('SUBTITLE:', a.get('subtitle'))
    f = d.get('intakeForm')
    print('INTAKE:', json.dumps(f)[:400] if f else None)
    print('GATE_MSG:', (d.get('gateMessage') or '')[:150])
    sc = a.get('scenes', [])
    if sc:
        s1 = sc[0]
        print('SCENE1:', s1.get('id'), s1.get('role'), s1.get('startSec'), '->', s1.get('endSec'), 'cuts:', s1.get('shotStartsSec'), 'evidence:', s1.get('productEvidenceNeeded'))
except Exception as e:
    print('PARSE_FAIL:', e)
    print(sys.stdin.read()[:300])
"

# Test generate blocked by gate (should 428)
GEN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:3100/api/projects/$PROJ/generate")
echo "GENERATE_BLOCKED: $GEN (expect 428)"

# Submit intake answers (using the ACTUAL field ids from the form)
FIELDS=$(echo "$ANALYZE" | python3 -c "
import json,sys
d = json.load(sys.stdin)
f = d.get('intakeForm') or {}
ids = [x['id'] for x in f.get('fields', [])]
print(json.dumps({i: 'test answer for ' + i for i in ids}))
")
INTAKE=$(curl -s -X POST "http://localhost:3100/api/projects/$PROJ/intake" -H "Content-Type: application/json" -d "{\"answers\": $FIELDS, \"attachments\": {}}")
echo "$INTAKE" | python3 -c "
import json,sys
try:
    d = json.load(sys.stdin)
    print('AFTER_INTAKE_STATUS:', d.get('project', {}).get('status'))
    print('FACTS:', json.dumps(d.get('facts', {}))[:300])
except Exception as e:
    print('INTAKE_FAIL:', e)
"

# Cleanup
kill $SERVER_PID 2>/dev/null
echo "DONE"
