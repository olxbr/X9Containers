# X9Containers
Docker containers to finger pointing pesky breaches from your running images

### Usage

Intended to just print each vulnerability scanner output to the standard output:

```sh
curl https://raw.githubusercontent.com/olxbr/X9Containers/main/debian.X9.Dockerfile --output X9.Dockerfile
docker build -f X9.Dockerfile -t suspectimage --build-arg IMAGE=${TARGET_IMAGE}:${VERSION} --quiet .
docker create --name suspectcontainer suspectimage
docker cp suspectcontainer:/scans ./scans
for i in scans/* ; do \
	cat $$i ; \
	echo "********** END OF $$i ********** ; \
done
```
