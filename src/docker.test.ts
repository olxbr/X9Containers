import * as docker from './docker';

describe('can generate dockefile', () => {
  test.each([
    [
      {
        trivy: false,
        clamav: true,
        minimalSeverity: 'UNKNOWN',
        baseImage: 'example:0.0.1'
      } as docker.X9Options,
      `FROM example:0.0.1 as base

FROM alpine:3.13 as base-stage
COPY --from=base / ../base-root

FROM base-stage as clamscan-stage
WORKDIR /scans
RUN apk update && apk upgrade && apk add --no-cache clamav-libunrar clamav
RUN freshclam
RUN clamscan -ri /base-root >> recursive-root-dir-clamscan.txt || true

FROM alpine:3.13 as final-stage
WORKDIR /scans
COPY --from=clamscan-stage /scans/recursive-root-dir-clamscan.txt ./recursive-root-dir-clamscan.txt
`
    ]
  ])('given parameters %p: ', (options: docker.X9Options, expected: string) => {
    const trivySeverity = docker.generate(options);
    expect(trivySeverity).toEqual(expected);
  });
});
