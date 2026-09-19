export interface ReleaseMetadata {
  commitSha: string | null;
  branch: string | null;
  deploymentId: string | null;
  snapshotId: string | null;
  serviceName: string | null;
  environmentName: string | null;
  erc13ProtocolVersion: "1.0.0";
  productionTestGate: "npm-test-before-build";
}

export function getReleaseMetadata(): ReleaseMetadata {
  return {
    commitSha: process.env.RAILWAY_GIT_COMMIT_SHA ?? null,
    branch: process.env.RAILWAY_GIT_BRANCH ?? null,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID ?? null,
    snapshotId: process.env.RAILWAY_SNAPSHOT_ID ?? null,
    serviceName: process.env.RAILWAY_SERVICE_NAME ?? null,
    environmentName: process.env.RAILWAY_ENVIRONMENT_NAME ?? null,
    erc13ProtocolVersion: "1.0.0",
    productionTestGate: "npm-test-before-build"
  };
}
