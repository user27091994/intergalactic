FROM alpine:3.18

RUN apk add \
    python3 \
    py3-pip \
    curl \
    tmux \
    openvpn \
    nmap \
    grep \
    openssh \
    sshpass \
    john \
    sqlite

WORKDIR /app

RUN pip3 install flask-unsign