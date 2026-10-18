# Sandbox image that compiles and runs learner code.
# Contains only the toolchains: Python 3, rustc, g++. No third-party packages,
# no crates, no network at run time (the backend starts containers with --network none).
FROM docker.io/library/fedora:44

RUN dnf -y install --setopt=install_weak_deps=False python3 rust gcc-c++ \
    && dnf clean all \
    && useradd --uid 10001 --create-home runner

USER runner
WORKDIR /tmp
ENV HOME=/tmp
