FROM alpine:3.18

RUN apk add openvpn curl openssh shadow

RUN ssh-keygen -A

ENTRYPOINT ["/usr/sbin/sshd", "-D"]