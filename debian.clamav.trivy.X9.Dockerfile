ARG IMAGE

FROM $IMAGE as trivy-stage
ARG TRIVY_SEVERITY
WORKDIR /scans

COPY --from=aquasec/trivy:latest /usr/local/bin/trivy /usr/local/bin/trivy
RUN trivy filesystem --ignore-unfixed --severity $TRIVY_SEVERITY --exit-code 0 --no-progress --skip-files usr/local/bin/trivy / | tee image-vulnerabilities-trivy.txt

FROM $IMAGE as clamscan-stage
WORKDIR /scans

RUN apt update && apt-get install clamav -y
RUN freshclam
RUN clamscan -r -i --exclude-dir="^/sys" / >> recursive-root-dir-clamscan.txt

FROM 073521391622.dkr.ecr.us-east-1.amazonaws.com/base_images/alpine:3.14-base as final-stage
WORKDIR /scans

COPY --from=clamscan-stage /scans/recursive-root-dir-clamscan.txt ./recursive-root-dir-clamscan.txt
COPY --from=trivy-stage /scans/image-vulnerabilities-trivy.txt ./image-vulnerabilities-trivy.txt
