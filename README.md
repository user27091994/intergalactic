This repository contains an implementation presented in our paper:

"An LLM-Driven Framework for System-Aware Attack Code Generation"

Authors: Ortal Lavi, Ahmed Elmisery, Ewa Seroczyńska, Igor Podoski, and Andres Murillo.

Publication: Workshop on AI for Cybersecurity (WAITI), ACSAC 2026.

If you use this repository or build upon our work, please cite our paper.

# Intergalactic GNS3 Export

This repository contains the extracted artifacts needed to recreate the `Intergalactic` topology in GNS3.

Included:

- `gns3_project/topology.gns3`: normalized from a live GNS3 project.
- `gns3_project/docker_configs/`: per-node command lists used to configure Docker nodes.
- `gns3_project/router_configs/`: router/firewall command list.
- `attack_scenario/`: the natural-language network description and attack steps.
- `environment/container_dockerfiles/`: only the Docker build contexts used by this topology.
- `environment/qemu_images/`: the OpenWrt base disk used by the router node.

## 1. Install GNS3

Use GNS3 2.2.53.
You also need Docker available to GNS3.

## 2. Set Up The GNS3 Project

1. Build the custom Docker images from `environment/container_dockerfiles/` using the tags listed in `environment/container_dockerfiles/dockerfiles.yaml`.
2. Make sure the upstream image `gns3/openvswitch:latest` is available to GNS3 for the `main-switch` node.
3. Import `environment/qemu_images/openwrt-22.03.0-x86-64-generic-ext4-combined.img` into GNS3.
4. Create the required templates in GNS3:
   - `intergalactic-vpn` -> `intergalactic-vpn:latest`
   - `intergalactic-hacker` -> `intergalactic-hacker:latest`
   - `alpine-openvpn` -> `alpine-3.18-openvpn:latest`
   - `storage-server` -> `storage-server:latest`
   - `Open vSwitch` -> `gns3/openvswitch:latest`
   - `OpenWrt 22.03.0` -> imported OpenWrt image
   - built-in `Ethernet switch` for the shared untrusted network segment
5. Open `gns3_project/topology.gns3` in GNS3. If GNS3 reports missing templates, create them first and reopen the project.
6. Start the nodes and apply the node-specific commands from:
   - `gns3_project/router_configs/office-router-firewall.txt`
   - `gns3_project/docker_configs/*.txt`
7. Use `attack_scenario/network_description_nl.txt` and `attack_scenario/attack_steps_nl.json` only as scenario reference data. They are not required for GNS3 to draw the topology.

## Notes

- `topology.gns3` was extracted from a live project and cleaned up to remove Docker container IDs and personal inventory details.
- The topology avoids host-specific GNS3 cloud and NAT dependencies. The external side is a closed lab segment implemented as a built-in `Ethernet switch` named `internet-gw`.
- The VPN gateway and attacker use fixed IPs on `192.168.122.0/24`, the router WAN is `192.168.122.2`, and generated VPN profiles point to `192.168.122.10`.
- The original VPN PKI archive was removed from this public export. Recreate VPN certificates locally if you need a working tunnel.
- This repo is meant for disclosure of topology inputs and configs, not for one-command deployment.
- If opening `gns3_project/topology.gns3` fails because your GNS3 server does not reuse the embedded template IDs, manually recreate the nodes with the names and template mapping listed above, wire them according to `topology.gns3`, then apply the commands from `gns3_project/router_configs/` and `gns3_project/docker_configs/`.
- If you want real outbound internet access from the lab, replace the `internet-gw` switch with your own GNS3 `NAT` or `Cloud` design and update the static gateways in `office-router-firewall.txt`, `intergalactic-vpn-gw.txt`, and `intergalactic-hacker.txt` to match your environment.
