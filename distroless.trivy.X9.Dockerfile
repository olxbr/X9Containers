ARG IMAGE
ARG BASE_IMAGE

FROM $IMAGE as base

FROM $BASE_IMAGE as base-stage
COPY --from=base / ../base-root

FROM base-stage as trivy-stage
ARG TRIVY_SEVERITY
WORKDIR /scans
COPY --from=aquasec/trivy:latest /usr/local/bin/trivy /usr/local/bin/trivy
RUN trivy filesystem --ignore-unfixed --severity $TRIVY_SEVERITY --exit-code 0 --no-progress /base-root | tee image-vulnerabilities-trivy.txt

FROM $BASE_IMAGE as final-stage
WORKDIR /scans
COPY --from=trivy-stage /scans/image-vulnerabilities-trivy.txt ./image-vulnerabilities-trivy.txt
