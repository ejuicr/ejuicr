"""Offline SSH-client boundary check; never connects to a host or uses a real key."""

import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("deploy-mothership.sh")
IMAGE = "ghcr.io/ejuicr/ejuicr@sha256:" + "a" * 64
SHA = "b" * 40


class SSHClientTest(unittest.TestCase):
    def test_pinned_identity_arguments_cleanup_and_rejection(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            mock = root / "ssh"
            mock.write_text("#!/usr/bin/env python3\n"
                            "import json, os, pathlib, sys\n"
                            "pathlib.Path(os.environ['CAPTURE']).write_text(json.dumps(sys.argv[1:]))\n")
            mock.chmod(0o755)
            capture = root / "capture.json"
            env = {**os.environ, "PATH": f"{root}:{os.environ['PATH']}",
                   "TMPDIR": str(root), "CAPTURE": str(capture),
                   "DEPLOY_IMAGE": IMAGE, "GITHUB_SHA": SHA,
                   "DEPLOY_HOST": "ssh.example.invalid", "DEPLOY_SSH_KEY": "test-only-key",
                   "DEPLOY_KNOWN_HOSTS": "test-only-pinned-host"}
            subprocess.run(["bash", str(SCRIPT)], env=env, check=True)
            args = json.loads(capture.read_text())
            self.assertEqual(args[-2:], ["ejuicr-deploy@ssh.example.invalid", f"deploy {SHA} {IMAGE}"])
            self.assertIn("StrictHostKeyChecking=yes", args)
            self.assertIn("GlobalKnownHostsFile=/dev/null", args)
            self.assertIn("IdentitiesOnly=yes", args)
            self.assertEqual(args[:2], ["-F", "/dev/null"])
            self.assertFalse(Path(args[args.index("-i") + 1]).exists())
            for name, value in (("DEPLOY_IMAGE", "ghcr.io/other/app:latest"),
                                ("DEPLOY_HOST", "-oProxyCommand=bad"),
                                ("GITHUB_SHA", SHA + "; id"), ("DEPLOY_SSH_KEY", ""),
                                ("DEPLOY_KNOWN_HOSTS", "")):
                capture.unlink(missing_ok=True)
                result = subprocess.run(["bash", str(SCRIPT)], env={**env, name: value})
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(capture.exists())


if __name__ == "__main__":
    unittest.main()
