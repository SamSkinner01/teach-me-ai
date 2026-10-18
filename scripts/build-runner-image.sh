#!/usr/bin/env bash
# Build the sandbox image that compiles and runs learner code (Python, rustc, g++),
# with the MNIST files baked in at /data/mnist for the capstone.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$ROOT/scripts/fetch_mnist.py"
rm -rf "$ROOT/runner-image/mnist"
mkdir -p "$ROOT/runner-image/mnist"
cp "$ROOT"/data/mnist/raw/* "$ROOT/runner-image/mnist/"
docker build -t "${TMAI_RUNNER_IMAGE:-teach-me-ai-runner:latest}" "$ROOT/runner-image"
