import {writeFileSync} from 'fs';

export interface X9Options {
  clamav: boolean;
  trivy: boolean;
  trivySeverity: string | null | undefined;
  minimalSeverity: string;
  baseImage: string;
}

export function generate(options: X9Options): string {
  var dockerfile = `FROM ${options.baseImage} as base

FROM alpine:3.13 as base-stage
COPY --from=base / ../base-root
`;
  var tail = '';

  if (options.trivy) {
    dockerfile += `\nFROM base-stage as trivy-stage
WORKDIR /scans
COPY --from=aquasec/trivy:latest /usr/local/bin/trivy /usr/local/bin/trivy
RUN trivy filesystem --ignore-unfixed --severity ${options.trivySeverity} --exit-code 0 --no-progress /base-root | tee image-vulnerabilities-trivy.txt\n`;
    tail += 'COPY --from=trivy-stage /scans/image-vulnerabilities-trivy.txt ./image-vulnerabilities-trivy.txt\n';
  }

  if (options.clamav) {
    dockerfile += `\nFROM base-stage as clamscan-stage
WORKDIR /scans
RUN apk update && apk upgrade && apk add --no-cache clamav-libunrar clamav
RUN freshclam
RUN clamscan -ri /base-root >> recursive-root-dir-clamscan.txt || true\n`;
    tail += 'COPY --from=clamscan-stage /scans/recursive-root-dir-clamscan.txt ./recursive-root-dir-clamscan.txt\n';
  }

  dockerfile += `\nFROM alpine:3.13 as final-stage
WORKDIR /scans
${tail}`;
  return dockerfile;
}

export function saveDockerfile(content: string) {
  writeFileSync('./X9.Dockerfile', content, {flag: 'w+', encoding: 'utf8'});
}
