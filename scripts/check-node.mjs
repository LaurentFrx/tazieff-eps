const required = { major: 20, minor: 9, patch: 0 };

function parseVersion(version) {
  const [major, minor, patch] = version.split(".").map((part) => Number(part));
  return { major: major || 0, minor: minor || 0, patch: patch || 0 };
}

function isAtLeast(current, min) {
  if (current.major !== min.major) {
    return current.major > min.major;
  }
  if (current.minor !== min.minor) {
    return current.minor > min.minor;
  }
  return current.patch >= min.patch;
}

const current = parseVersion(process.versions.node);

if (!isAtLeast(current, required)) {
  console.error(
    `Node ${required.major}.${required.minor}.${required.patch}+ required. ` +
      `Detected ${process.versions.node}. Please upgrade Node to run dev server.`,
  );
  process.exit(1);
}
