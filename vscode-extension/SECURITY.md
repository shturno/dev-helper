# Security Policy

## Overview
This extension was designed with security and privacy as a top priority. All user data is stored locally and never sent to third parties. The extension implements strict input validation and sanitization at every entry point, including all webview messages and CRUD operations.

## Key Security Measures
- **Input Sanitization:** All user input is sanitized and validated before being stored or rendered, using robust utility functions (`sanitizeHtml`, `isValidInput`, etc.).
- **Webview Security:** All messages from the webview are validated and sanitized before processing. Webview scripts use nonces and secure options to prevent XSS.
- **No External Data Leaks:** No sensitive user data is sent to external URLs or third-party scripts. Only trusted CDNs (e.g., Chart.js, codicons) are used for static assets.
- **Least Privilege:** The extension manifest (`package.json`) is reviewed to ensure only necessary permissions and contributions are declared.
- **Sensitive Operations:** All file access and globalState updates are protected and never expose user data externally.
- **Automated Security Tests:** Utilities for input validation and sanitization are covered by automated unit tests.

## Reporting Vulnerabilities
If you discover a security vulnerability, please open an issue or contact the maintainer directly. We take all reports seriously and will address them promptly.

---
_Last updated: 2025-05-28
