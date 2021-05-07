# X9Containers
Docker containers to finger pointing pesky breaches from your running images.

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
