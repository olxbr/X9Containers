import * as core from '@actions/core';
import * as docker from './docker';

export interface Inputs {
  config: docker.X9Options;
  ignoreThreats: boolean;
}

export function minimalSeverity(config: string): string {
  switch (config) {
    case 'CRITICAL':
      return 'CRITICAL';
    case 'HIGH':
      return 'HIGH,CRITICAL';
    case 'MEDIUM':
      return 'MEDIUM,HIGH,CRITICAL';
    case 'LOW':
      return 'LOW,MEDIUM,HIGH,CRITICAL';
    default:
      return 'UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL';
  }
}

export async function getInputs(): Promise<Inputs> {
  let inputs = {
    config: {
      baseImage: await core.getInput('image'),
      clamav: await core.getBooleanInput('clamavEnabled'),
      trivy: await core.getBooleanInput('trivyEnabled'),
      minimalSeverity: (await core.getInput('severity')) || 'UNKNOWN',
      trivySeverity: ''
    },
    ignoreThreats: await core.getBooleanInput('ignoreThreats')
  };

  inputs.config.trivySeverity = minimalSeverity(inputs.config.minimalSeverity);

  if (!inputs.config.clamav && !inputs.config.trivy) {
    throw new Error(`cannot have both trivy and clamav off.`);
  }

  return inputs;
}
