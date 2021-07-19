import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as context from './context';
import * as x9 from './x9';

async function run(): Promise<void> {
  try {
    let inputs: context.Inputs = await context.getInputs();
    await x9.checkImageThreats(inputs);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
