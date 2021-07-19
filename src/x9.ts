import {readdirSync, readFileSync} from 'fs';

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as docker from './docker';
import * as context from './context';

const VIRUS_THRESHOLD = 0;
const CRITICAL_VULNS_THRESHOLD = 10;
const HIGH_VULNS_THRESHOLD = 50;
const MEDIUM_VULNS_THRESHOLD = 100;
const LOW_VULNS_THRESHOLD = 250;
const UNKNOWN_VULNS_THRESHOLD = 1000;

const TRIVY_SCAN_FILENAME = 'image-vulnerabilities-trivy.txt';
const CLAM_SCAN_FILENAME = 'recursive-root-dir-clamscan.txt';

export interface X9Config {
  image: string;
  minimalSeverity: string;
  x9ContainerDistro: string;
  ignoreThreats: boolean;
}

export interface ScanResult {
  file: string;
  content: string;
}
export interface ScanResults {
  clamReport: ScanResult | null;
  trivyReport: ScanResult | null;
}

export async function scanImage(): Promise<ScanResults> {
  const args = ['build', '-f', 'X9.Dockerfile', '-t', 'suspectimage', '.'];
  await exec
    .getExecOutput('docker', args, {
      ignoreReturnCode: true
    })
    .then(res => {
      if (res.stderr.length > 0 && res.exitCode != 0) {
        throw new Error(`buildx failed with: ${res.stderr.match(/(.*)\s*$/)![0].trim()}`);
      }
    });

  const scansFolder = './scans';
  await exec.getExecOutput('docker', ['create', '--name', 'suspectcontainer', 'suspectimage'], {
    ignoreReturnCode: true
  });
  await exec.getExecOutput('docker', ['cp', 'suspectcontainer:/scans', `${scansFolder}`], {
    ignoreReturnCode: true
  });

  // Cleanup
  await exec.getExecOutput('docker', ['stop', 'suspectcontainer'], {
    ignoreReturnCode: true
  });
  await exec.getExecOutput('docker', ['rm', 'suspectcontainer'], {
    ignoreReturnCode: true
  });

  var results: ScanResults = {
    clamReport: null,
    trivyReport: null
  };
  readdirSync(scansFolder).forEach(report => {
    const file = `${scansFolder}/${report}`;
    const content = readFileSync(file, 'utf8');
    const result: ScanResult = {file, content};

    if (report === TRIVY_SCAN_FILENAME) {
      results.trivyReport = result;
    } else if (report === CLAM_SCAN_FILENAME) {
      results.clamReport = result;
    }
  });
  return results;
}

export function processClamReport(result: ScanResult | null) {
  if (result === null) {
    throw new Error(`failed to read file: ${CLAM_SCAN_FILENAME}`);
  }
  const summary = result.content.match(/^Infected files:.*/m);
  if (summary === null || summary.length === 0) {
    throw new Error(`missing totals: ${CLAM_SCAN_FILENAME}`);
  }

  const totals = summary[0].match(/\d+/);
  if (totals === null || totals.some(value => isNaN(+value))) {
    throw new Error(`missing totals: ${CLAM_SCAN_FILENAME}`);
  }

  core.info(`ClamAV	${totals[0]}`);
  if (+totals[0] > VIRUS_THRESHOLD) {
    throw new Error(`ClamAV threat threshold exceeded: ${totals[0]}`);
  }
}

export function processTrivyReport(severity: string, result: ScanResult | null) {
  if (result === null) {
    throw new Error(`failed to read file: ${TRIVY_SCAN_FILENAME}`);
  }

  const summary = result.content.match(/^Total:.*/m);
  if (summary === null || summary.length === 0) {
    throw new Error(`missing totals: ${TRIVY_SCAN_FILENAME}`);
  }

  const totals = summary[0].match(/(\d+)/g);
  if (totals === null || totals.some(value => isNaN(+value))) {
    throw new Error(`missing totals: ${TRIVY_SCAN_FILENAME}`);
  }

  core.info(`Trivy	${summary}`);
  if (
    (severity === 'CRITICAL' && +totals[1] > CRITICAL_VULNS_THRESHOLD) ||
    (severity === 'HIGH' && (+totals[1] > HIGH_VULNS_THRESHOLD || +totals[2] > CRITICAL_VULNS_THRESHOLD)) ||
    (severity === 'MEDIUM' && (+totals[1] > MEDIUM_VULNS_THRESHOLD || +totals[2] > HIGH_VULNS_THRESHOLD || +totals[3] > CRITICAL_VULNS_THRESHOLD)) ||
    (severity === 'LOW' && (+totals[1] > LOW_VULNS_THRESHOLD || +totals[2] > MEDIUM_VULNS_THRESHOLD || +totals[3] > HIGH_VULNS_THRESHOLD || +totals[4] > CRITICAL_VULNS_THRESHOLD)) ||
    (severity === 'UNKNOWN' && (+totals[1] > UNKNOWN_VULNS_THRESHOLD || +totals[2] > LOW_VULNS_THRESHOLD || +totals[3] > MEDIUM_VULNS_THRESHOLD || +totals[4] > HIGH_VULNS_THRESHOLD || +totals[5] > CRITICAL_VULNS_THRESHOLD))
  ) {
    throw new Error(`Trivy threat threshold exceeded, total vulnerabilities found: ${+totals[0]}`);
  }
}

export async function checkImageThreats(inputs: context.Inputs): Promise<void> {
  core.startGroup('X9 will find something to blame now...');

  const dockerfile = docker.generate(inputs.config);
  docker.saveDockerfile(dockerfile);

  const results = await scanImage();

  if (inputs.ignoreThreats) {
    core.info('ignore_threats is true, skipping workflow interruption');
    return;
  }

  processClamReport(results.clamReport);
  processTrivyReport(inputs.config.minimalSeverity, results.trivyReport);
  core.info('report image threats successfully finished');
  core.endGroup();
}
