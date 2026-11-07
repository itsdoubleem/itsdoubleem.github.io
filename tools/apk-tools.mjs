/* Reading an APK with the Android SDK's aapt2 and apksigner, for the sync and the release command. */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { permissionsOf, signersOf } from './sync-lib.mjs';

function sdkTool(name) {
  for (const sdk of [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, `${homedir()}/Library/Android/sdk`]) {
    const tools = sdk && `${sdk}/build-tools`;
    if (!tools || !existsSync(tools)) continue;
    for (const v of readdirSync(tools).sort().reverse()) {
      if (existsSync(`${tools}/${v}/${name}`)) return `${tools}/${v}/${name}`;
    }
  }
  throw new Error(`${name} not found — it ships with the Android SDK build-tools`);
}

const badging = (file) => execFileSync(sdkTool('aapt2'), ['dump', 'badging', file], { encoding: 'utf8' });

export const inspectPermissions = (file) => permissionsOf(badging(file));

/** { versionName, permissions, signers } of an APK on disk. */
export function inspectApk(file) {
  const b = badging(file);
  return {
    versionName: b.match(/versionName='([^']+)'/)?.[1],
    permissions: permissionsOf(b),
    signers: signersOf(execFileSync(sdkTool('apksigner'), ['verify', '--print-certs', file], { encoding: 'utf8' })),
  };
}
