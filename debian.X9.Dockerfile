ARG IMAGE

FROM $IMAGE as clamscan-stage
WORKDIR /scans

RUN apt update && apt-get install clamav -y
RUN freshclam
RUN clamscan -r -i --exclude-dir="^/sys" / >> recursive-root-dir-clamscan.txt

FROM $IMAGE as trivy-stage
WORKDIR /scans

RUN apt update && apt-get install curl -y
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
RUN trivy filesystem --exit-code 0 --no-progress / | tee image-vulnerabilities-trivy.txt

# ... more stages ...

FROM alpine:3.13 as final-stage
WORKDIR /scans

COPY --from=clamscan-stage /scans/recursive-root-dir-clamscan.txt ./recursive-root-dir-clamscan.txt
COPY --from=trivy-stage /scans/image-vulnerabilities-trivy.json ./image-vulnerabilities-trivy.txt
