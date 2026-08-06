FROM ubuntu:20.04

RUN apt update && apt install -y --no-install-recommends \
    openvpn \
    easy-rsa \
    python3 \
    python3-pip \
    supervisor \
    curl \
    sqlite3 \
 && rm -rf /var/lib/apt/lists/*


WORKDIR /app

COPY web_ui/ web_ui/
COPY pyproject.toml .
RUN pip3 install .

COPY openvpn/ /etc/openvpn/
COPY supervisor/*.conf /etc/supervisor/conf.d/

# Public export note:
# Provide locally generated VPN certificate material before building
# if you need a functional VPN server image.

ENTRYPOINT ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]


# openssl rsa -in encrypted.key -out decrypted.key
