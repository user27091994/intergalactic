FROM alpine:3.18

RUN apk add openvpn curl openssh shadow

RUN ssh-keygen -A

RUN sed -ie 's/AllowTcpForwarding no/AllowTcpForwarding yes/' /etc/ssh/sshd_config

ENTRYPOINT ["/usr/sbin/sshd", "-D"]