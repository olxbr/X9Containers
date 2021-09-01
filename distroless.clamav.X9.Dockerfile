ARG IMAGE

FROM $IMAGE as base

FROM 073521391622.dkr.ecr.us-east-1.amazonaws.com/base_images/alpine:3.14-base as base-stage
COPY --from=base / ../base-root

FROM base-stage as clamscan-stage
WORKDIR /scans
RUN apk update && apk upgrade && apk add --no-cache clamav-libunrar clamav
RUN freshclam
RUN clamscan -ri /base-root >> recursive-root-dir-clamscan.txt

FROM 073521391622.dkr.ecr.us-east-1.amazonaws.com/base_images/alpine:3.14-base as final-stage
WORKDIR /scans
COPY --from=clamscan-stage /scans/recursive-root-dir-clamscan.txt ./recursive-root-dir-clamscan.txt
