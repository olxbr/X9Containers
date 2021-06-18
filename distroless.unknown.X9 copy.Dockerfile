ARG IMAGE

FROM $IMAGE as base

FROM alpine:3.13 as base-stage
COPY --from=base / ../base-root

FROM base-stage as trivy-stage
WORKDIR /scans
COPY --from=aquasec/trivy:latest /usr/local/bin/trivy /usr/local/bin/trivy
RUN trivy filesystem --ignore-unfixed --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL --exit-code 0 --no-progress /base-root | tee image-vulnerabilities-trivy.txt

FROM alpine:3.13 as final-stage
WORKDIR /scans
COPY --from=trivy-stage /scans/image-vulnerabilities-trivy.txt ./image-vulnerabilities-trivy.txt
