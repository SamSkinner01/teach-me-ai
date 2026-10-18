#!/usr/bin/env bash
# Build the sandbox image that compiles and runs learner code (Python, rustc, g++).
set -euo pipefail
cd "$(dirname "$0")/../runner-image"
docker build -t "${TMAI_RUNNER_IMAGE:-teach-me-ai-runner:latest}" .
