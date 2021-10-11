# X9Containers
Collection of Docker containers to finger pointing pesky breaches from your running images.

It's nothing really new: X9Containers use existing tools to find malwares, vulnerabilities and secrets using [Trivy](https://github.com/aquasecurity/trivy), [ClamAV](https://github.com/Cisco-Talos/clamav) and [GitLeaks](https://github.com/zricethezav/gitleaks) in a [multi-stage building approach](https://docs.docker.com/develop/develop-images/multistage-build/), copying the whole filesystem to be analyzed at each stage - at `distroless.` suffix.

But the analysis can also occur during building, so it can run into the intermediate container, where we hope to find things dynamically - at non `distroless.` suffix.

"X9" it is a popular slang among Brazilians which means "whistleblower".

Said that...

<img src="./point.png" width="380" height="313"> ... let's point!

### Usage

This snippet is intended to just print each report to the standard output, so grab a drink and figure out a best use case based on your needs:

```sh
# You need to choose the appropriate Dockerfile which will run on top of the target image container
curl https://raw.githubusercontent.com/olxbr/X9Containers/main/distroless.clamav.trivy.gitleaks.X9.Dockerfile --output X9.Dockerfile

# ARGS are for:
# - REGISTRY is the exactly registry that contains all images used in this analysis
# - *_IMAGE are Docker images in said registry
# - TARGET_IMAGE it is a local build image chosen for analysis
# - TRIVY_SEVERITY is a Trivy comma separated threat level. See https://aquasecurity.github.io/trivy/v0.20.0/vulnerability/examples/filter/
# - WKDIR is the workdir used to held all your application stuff
docker build -f X9.Dockerfile -t suspectimage \
  --build-arg REGISTRY=${REGISTRY} \                                        # docker.io
  --build-arg CLAMAV_IMAGE=${CLAMAV_IMAGE}:${CLAMAV_IMAGE_VERSION} \        # clamav/clamav:latest
  --build-arg TRIVY_IMAGE=${TRIVY_IMAGE}:${TRIVY_IMAGE_VERSION} \           # aquasec/trivy:latest
  --build-arg GITLEAKS_IMAGE=${GITLEAKS_IMAGE}:${GITLEAKS_IMAGE_VERSION} \  # zricethezav/gitleaks:latest
  --build-arg BASE_IMAGE=${ALPINE_IMAGE}:${ALPINE_IMAGE_VERSION} \          # alpine:latest
  --build-arg TARGET_IMAGE=${TARGET_IMAGE}:${TARGET_IMAGE_VERSION} \        # my/super/suspect/docker/local/builded/image:latest
  --build-arg TRIVY_SEVERITY=${TRIVY_SEVERITY} \                            # CRITICAL
  --build-arg WKDIR=${TRIVY_SEVERITY} \                                     # app
  --quiet \
  .
docker create --name suspectcontainer suspectimage
docker cp suspectcontainer:/scans ./scans

# Do whatever you need with the reports inside scans directory and do your own post execution cleanup:
for i in scans/* ; do \
  cat $i ; \
  printf "\n\n********** END OF $i **********\n\n" ; \
done
```

Sample output

```
repo,line,commit,offender,leakURL,rule,tags,commitMsg,author,email,file,date
,REDACTED,,REDACTED,,AWS Access Key,"key, AWS",,,,aaaa.txt,0001-01-01T00:00:00Z


********** END OF scans/gitleaks-leaks-result.txt **********

2021-10-11T01:12:21.287Z	INFO	Need to update DB
2021-10-11T01:12:21.287Z	INFO	Downloading DB...
2021-10-11T01:12:24.437Z	INFO	Detecting Debian vulnerabilities...

debuerreotype (debian 11.0)
===========================
Total: 2 (CRITICAL: 2)

+-----------+------------------+----------+-------------------+------------------+--------------------------------------+
|  LIBRARY  | VULNERABILITY ID | SEVERITY | INSTALLED VERSION |  FIXED VERSION   |                TITLE                 |
+-----------+------------------+----------+-------------------+------------------+--------------------------------------+
| libssl1.1 | CVE-2021-3711    | CRITICAL | 1.1.1k-1          | 1.1.1k-1+deb11u1 | openssl: SM2 Decryption              |
|           |                  |          |                   |                  | Buffer Overflow                      |
|           |                  |          |                   |                  | -->avd.aquasec.com/nvd/cve-2021-3711 |
+-----------+                  +          +                   +                  +                                      +
| openssl   |                  |          |                   |                  |                                      |
|           |                  |          |                   |                  |                                      |
|           |                  |          |                   |                  |                                      |
+-----------+------------------+----------+-------------------+------------------+--------------------------------------+


********** END OF scans/image-vulnerabilities-trivy.txt **********


----------- SCAN SUMMARY -----------
Known viruses: 8570581
Engine version: 0.103.3
Scanned directories: 1566
Scanned files: 7410
Infected files: 0
Data scanned: 339.71 MB
Data read: 205.54 MB (ratio 1.65:1)
Time: 126.512 sec (2 m 6 s)
Start Date: 2021:10:11 01:13:46
End Date:   2021:10:11 01:15:52


********** END OF scans/recursive-root-dir-clamscan.txt **********
```
