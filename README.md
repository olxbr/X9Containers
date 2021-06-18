# X9Containers
Docker containers to finger pointing pesky breaches from your running images.

It's nothing really new: X9Containers use existing tools to find malwares and vulnerabilities using [Trivy](https://github.com/aquasecurity/trivy) and [ClamAV](https://github.com/Cisco-Talos/clamav) in a [multi-stage building approach](https://docs.docker.com/develop/develop-images/multistage-build/), copying the whole filesystem to be analyzed at each stage.

The analysis occur during building, so it can run into the intermediate container, where we hope to find things dynamically.

X9 it is a popular slang among Brazilians wich can be expressed as whistleblower.

Said that...

<img src="./point.png" width="380" height="313"> ... let's point!

### Usage

Intended to just print each vulnerability scanner output to the standard output:

```sh
# You need to choose the appropriate Dockerfile which will run on top of the target image container
curl https://raw.githubusercontent.com/olxbr/X9Containers/main/debian.X9.Dockerfile --output X9.Dockerfile

# Where IMAGE=${TARGET_IMAGE}:${VERSION} is the target image for scanning
docker build -f X9.Dockerfile -t suspectimage --build-arg IMAGE=${TARGET_IMAGE}:${VERSION} --quiet .
docker create --name suspectcontainer suspectimage
docker cp suspectcontainer:/scans ./scans

# Do whatever you need with the artifacts, in this case it will only be printed
for i in scans/* ; do \
  cat $$i ; \
  echo "********** END OF $$i ********** ; \
done
```
