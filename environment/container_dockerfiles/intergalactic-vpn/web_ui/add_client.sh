#!/bin/bash

SERVER_IP=$1

CLIENT_NAME=$2

EASY_RSA=/usr/share/easy-rsa/easyrsa

cd /etc/openvpn

EASYRSA_REQ_CN=${CLIENT_NAME} $EASY_RSA --batch gen-req ${CLIENT_NAME} nopass

$EASY_RSA --batch sign-req client ${CLIENT_NAME}

CA=`cat pki/ca.crt`

CERT=`cat pki/issued/${CLIENT_NAME}.crt`

KEY=`openssl rsa -in pki/private/${CLIENT_NAME}.key -out -`

cat << EOF
client
dev tun
proto udp
remote ${SERVER_IP} 1194
resolv-retry infinite
nobind
persist-key
persist-tun

# SSL/TLS options
<ca>
${CA}
</ca>

<cert>
${CERT}
</cert>

<key>
${KEY}
</key>

cipher AES-256-CBC
auth SHA256
comp-lzo

verb 3

# end of file
EOF