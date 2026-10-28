"""
Build submission/CICD from a real GitHub Actions run.

    GH_TOKEN=... python tools/make_cicd_artifact.py [run_id]

The script talks to the GitHub REST API, lists every job/step of the run that
was triggered by the latest push to `main` and stores the interesting log
excerpts in submission/CICD (the deliverable for task 23).
"""
import json
import os
import re
import sys
import urllib.request

API = "https://api.github.com"
REPO = os.environ.get("GH_REPO", "laxmikant-kadam/cars-dealership-capstone")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "submission", "CICD")

# Lines we always want to keep when trimming a job log.
KEEP = re.compile(
    r"(Run |Successfully|Successfully built|Successfully tagged|"
    r"Found \d+ test|Ran \d+ tests|^OK$|Creating an optimized|Compiled successfully|"
    r"collected \d+ items|\d+ passed|Building |naming to |writing image|"
    r"DONE|ERROR|FAILED|Error:|##\[error\]|npm run build|python -m pytest|"
    r"python manage\.py test|docker/build-push-action|Logging in to |"
    r"The project was built|File sizes|main\.[0-9a-f]+\.(js|css))"
)


class _StripAuthOnRedirect(urllib.request.HTTPRedirectHandler):
    """Job logs redirect to a pre-signed blob URL that rejects our token."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        new = super().redirect_request(req, fp, code, msg, headers, newurl)
        if new is not None:
            new.headers.pop("Authorization", None)
            new.unredirected_hdrs.pop("Authorization", None)
        return new


opener = urllib.request.build_opener(_StripAuthOnRedirect)


def api(path, raw=False):
    token = os.environ["GH_TOKEN"].strip()
    request = urllib.request.Request(
        f"{API}{path}",
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "cars-dealership-ci-artifact",
        },
    )
    with opener.open(request, timeout=60) as response:
        data = response.read().decode("utf-8", "replace")
    return data if raw else json.loads(data)


ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")


def strip_timestamp(line):
    # "2026-10-28T16:17:53.8944576Z " prefix added by the logs endpoint
    return ANSI.sub("", re.sub(r"^\d{4}-\d\d-\d\dT[\d:.]+Z ", "", line))


def excerpt(log_text, limit=45):
    lines = [strip_timestamp(l).rstrip() for l in log_text.splitlines()]
    picked = [l for l in lines if l.strip() and KEEP.search(l)]
    # de-duplicate consecutive identical lines, keep the tail (the interesting part)
    deduped = []
    for line in picked:
        if not deduped or deduped[-1] != line:
            deduped.append(line)
    return deduped[-limit:]


def main():
    run_id = sys.argv[1] if len(sys.argv) > 1 else None
    if run_id is None:
        runs = api(f"/repos/{REPO}/actions/runs?branch=main&per_page=1")["workflow_runs"]
        run_id = runs[0]["id"]
    run = api(f"/repos/{REPO}/actions/runs/{run_id}")
    jobs = api(f"/repos/{REPO}/actions/runs/{run_id}/jobs")["jobs"]

    blocks = []
    blocks.append("TASK 23 - CICD (GitHub Actions)")
    blocks.append("=" * 33)
    blocks.append("")
    blocks.append("Pipeline definition : .github/workflows/ci.yml")
    blocks.append(f"Repository          : https://github.com/{REPO}")
    blocks.append(f"Workflow            : {run['name']} ({run['path']})")
    blocks.append(f"Run number          : #{run['run_number']}  (run id {run['id']})")
    blocks.append(f"Trigger             : {run['event']}")
    blocks.append(f"Branch              : {run['head_branch']}")
    blocks.append(f"Commit              : {run['head_sha']}  \"{run['head_commit']['message'].splitlines()[0]}\"")
    blocks.append(f"Started / finished  : {run['created_at']} -> {run['updated_at']}")
    blocks.append(f"Result              : {run['status']} / {run['conclusion'].upper()}")
    blocks.append(f"Run URL             : {run['html_url']}")
    blocks.append("")
    blocks.append("Pipeline stages")
    blocks.append("---------------")
    for job in jobs:
        blocks.append(
            f"  [{job['conclusion'] or job['status']}] {job['name']}  ({job['started_at']} -> {job['completed_at']})"
        )
        for step in job["steps"]:
            blocks.append(f"        - {step['number']:>2}. {step['name']:<40} {step['conclusion'] or step['status']}")
    blocks.append("")
    blocks.append("Job logs (trimmed to the build/test summary lines)")
    blocks.append("--------------------------------------------------")
    for job in jobs:
        log = api(f"/repos/{REPO}/actions/jobs/{job['id']}/logs", raw=True)
        blocks.append("")
        blocks.append(f"### {job['name']}  ->  {job['conclusion'].upper()}")
        blocks.append(f"    {job['html_url']}")
        blocks.append("")
        for line in excerpt(log):
            blocks.append(f"    {line}")
    blocks.append("")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as handle:
        handle.write("\n".join(blocks))
    print(f"wrote {OUT} ({len(blocks)} lines)")


if __name__ == "__main__":
    main()
