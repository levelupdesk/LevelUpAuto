# Security Policy

## Reporting a vulnerability

Level Up Inc (LevelUpWorld) reviews security reports for this repository in private. Do not open a public GitHub issue, pull request, discussion, or commit that describes a suspected vulnerability.

Send the report to **security@levelupworld.com**. Include:

- What the issue is and the impact you believe it has
- Steps to reproduce, or a proof of concept
- The affected component (API, web app, mobile app, or shared library) and any relevant URLs or commit SHAs
- How to reach you if we need more detail, and whether you want to be credited

If private vulnerability reporting is enabled on this repository, you can also use GitHub's **Report a vulnerability** form (Security tab). That path stays private as well.

We acknowledge new reports within 3 business days and send a status update within 7 days of that acknowledgement. When we accept a report, we will work on a fix and agree a disclosure timeline with you before any public write-up. When we decline a report, we will explain why.

Give us time to ship a fix before publishing details. Do not access another person's data, disrupt the service, or run scans that degrade availability.

## Scope

This policy covers the LevelUpAuto and Alset source in this repository: the API server, web apps, mobile app, and shared libraries.

Out of scope:

- Vulnerabilities in third-party services we do not operate
- Social engineering, physical attacks, and denial-of-service volume testing
- Issues that require a secret which was never committed to this repository

## Supported versions

Security fixes land on the default branch (`main`). This repository is not published as a set of long-term versioned releases, so older snapshots are not maintained separately.
