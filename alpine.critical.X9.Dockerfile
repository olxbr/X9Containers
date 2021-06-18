ARG IMAGE

FROM $IMAGE as trivy-stage
WORKDIR /scans

COPY --from=aquasec/trivy:latest /usr/local/bin/trivy /usr/local/bin/trivy
RUN trivy filesystem --ignore-unfixed --severity CRITICAL --exit-code 0 --no-progress --skip-files usr/local/bin/trivy / | tee image-vulnerabilities-trivy.txt

FROM $IMAGE as clamscan-stage
WORKDIR /scans

RUN apk update && apk upgrade && apk add --no-cache clamav-libunrar clamav
RUN freshclam
RUN clamscan -r -i --exclude-dir="^/sys" / >> recursive-root-dir-clamscan.txt

FROM alpine:3.13 as final-stage
WORKDIR /scans

COPY --from=clamscan-stage /scans/recursive-root-dir-clamscan.txt ./recursive-root-dir-clamscan.txt
COPY --from=trivy-stage /scans/image-vulnerabilities-trivy.txt ./image-vulnerabilities-trivy.txt
