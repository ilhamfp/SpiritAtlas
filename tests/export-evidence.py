"""Preserve retained Playwright attachments outside the next run's output directory."""
import base64
import json
from pathlib import Path
import re
import shutil
import sys

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'qa/interaction-artifacts/results.json'
result = json.loads(source.read_text())
evidence = Path(sys.argv[2]) if len(sys.argv) > 2 else root / 'qa/interaction-artifacts/evidence'


def collect(suite):
    for spec in suite.get('specs', []):
        for test in spec['tests']:
            for run in test['results']:
                if run['status'] != 'passed' or not run.get('attachments'):
                    continue
                slug = re.sub(r'[^a-z0-9]+', '-', spec['title'].lower()).strip('-')[:100]
                directory = evidence / slug
                directory.mkdir(parents=True, exist_ok=True)
                (directory / 'test-provenance.json').write_text(json.dumps({
                    'title': spec['title'], 'file': spec['file'], 'line': spec['line'],
                    'startTime': run['startTime'], 'durationMs': run['duration'],
                    'status': run['status'], 'playwrightVersion': result['config']['version'],
                }, indent=2) + '\n')
                for attachment in run['attachments']:
                    if 'body' in attachment:
                        extension = {'image/png': '.png', 'application/json': '.json'}.get(attachment['contentType'], '.bin')
                        (directory / (attachment['name'] + extension)).write_bytes(base64.b64decode(attachment['body']))
                    elif attachment.get('name') == 'video':
                        shutil.copyfile(attachment['path'], directory / 'interaction-recording.webm')
    for child in suite.get('suites', []):
        collect(child)


for suite in result['suites']:
    collect(suite)
print(f'Preserved successful test attachments under {evidence}')
