ARG REGISTRY
ARG GITLEAKS_IMAGE
ARG BASE_IMAGE
ARG TARGET_IMAGE

FROM $REGISTRY/$GITLEAKS_IMAGE as gitleaks
FROM $REGISTRY/$BASE_IMAGE as base
FROM $REGISTRY/$TARGET_IMAGE as target

FROM base as base-stage
COPY --from=target / ../base-root

FROM base-stage as gitleaks-stage
ARG WKDIR
WORKDIR /scans
COPY --from=gitleaks /usr/bin/gitleaks /usr/local/bin/gitleaks
RUN touch gitleaks-leaks-result.txt && gitleaks --quiet --path="/base-root/$WKDIR" --no-git --report="gitleaks-leaks-result.txt" --format=CSV --redact --leaks-exit-code=0

FROM base as final-stage
WORKDIR /scans
COPY --from=gitleaks-stage /scans/gitleaks-leaks-result.txt ./gitleaks-leaks-result.txt
