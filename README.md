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
  --quiet .
docker create --name suspectcontainer suspectimage
docker cp suspectcontainer:/scans ./scans

# Do whatever you need with the reports inside scans directory and do your own post execution cleanup:
for i in scans/* ; do \
  cat $i ; \
  echo "********** END OF $i ********** ; \
done
```
