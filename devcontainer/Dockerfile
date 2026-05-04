FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV NVM_DIR=/usr/local/nvm
ENV PATH=/root/.foundry/bin:${PATH}

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        ca-certificates \
        curl \
        git \
        jq \
        make \
        build-essential \
        pkg-config \
        libssl-dev \
        python3 \
        python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN curl -L https://foundry.paradigm.xyz | bash \
    && foundryup \
    && ln -sf /root/.foundry/bin/anvil /usr/local/bin/anvil \
    && ln -sf /root/.foundry/bin/cast /usr/local/bin/cast \
    && ln -sf /root/.foundry/bin/forge /usr/local/bin/forge

RUN mkdir -p "${NVM_DIR}" \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash \
    && bash -lc 'source "$NVM_DIR/nvm.sh" \
        && nvm install 22 \
        && nvm alias default 22 \
        && nvm use default \
        && npm i -g @graphprotocol/graph-cli \
        && ln -sf "$(which node)" /usr/local/bin/node \
        && ln -sf "$(which npm)" /usr/local/bin/npm \
        && ln -sf "$(which npx)" /usr/local/bin/npx \
        && ln -sf "$(which graph)" /usr/local/bin/graph'

WORKDIR /workspace

CMD ["/bin/bash"]
