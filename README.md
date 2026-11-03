# Tramontana

Source for **https://giampieroriggio.com/tramontana**.

Every push to `main` automatically uploads the changed files to the web server over FTP
(see `.github/workflows/deploy.yml`). Only changed files are sent, so deploys are fast.

## One-time setup

1. **Create the repo** on GitHub (e.g. `tramontana`) and push this folder to it,
   together with your site files (`index.html`, css, images…) at the top level.
2. **Add the FTP details as secrets**: repo → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*:

   | Secret            | Example                        |
   |-------------------|--------------------------------|
   | `FTP_SERVER`      | `ftp.giampieroriggio.com`      |
   | `FTP_USERNAME`    | your FTP user                  |
   | `FTP_PASSWORD`    | your FTP password              |
   | `FTP_SERVER_DIR`  | `/public_html/tramontana/` (must end with `/`) |

3. Push any change (or go to *Actions* → *Deploy* → *Run workflow*). Watch the run in the *Actions* tab.

## Notes

- If the run fails with a TLS/FTPS error, change `protocol: ftps` to `protocol: ftp` in the workflow.
- The first deploy uploads everything; after that only changes are synced
  (the action keeps a small `.ftp-deploy-sync-state.json` file on the server — don't delete it).
- Files deleted in the repo are also deleted on the server.
