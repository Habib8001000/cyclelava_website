# Hostinger Auto-Deployment Guide (Git to Hostinger Pipeline)

Jab bhi aap `master` branch me push karein ge, aapki website automatically Hostinger par live ho jayegi.

---

## Method 1: GitHub Actions CI/CD Pipeline (Recommended - Already Configured)

Hamne `.github/workflows/deploy.yml` file bana di hai. Ab sirf GitHub par 3 Secrets add karne hain:

### Step 1: Hostinger se FTP Details lein
1. **Hostinger hPanel** me login karein.
2. Apne domain (`cyclelava.com`) ke dashboard me jayein.
3. Search bar me **FTP Accounts** likhein ya **Files > FTP Accounts** par click karein.
4. Wahan aapko yeh 3 cheezein milengi:
   - **FTP Host / IP** (e.g. `ftp.cyclelava.com` ya IP address)
   - **FTP Username**
   - **FTP Password** (agar bhool gaye hain to 'Change Password' par click karke naya set kar lein)

### Step 2: GitHub Repository me Secrets add karein
1. Apni GitHub repository open karein.
2. **Settings** tab par click karein.
3. Left sidebar me **Secrets and variables** > **Actions** par click karein.
4. **New repository secret** par click karke yeh 3 secrets add karein:

| Secret Name | Value |
|---|---|
| `FTP_SERVER` | Hostinger ka FTP Host ya IP |
| `FTP_USERNAME` | Hostinger ka FTP Username |
| `FTP_PASSWORD` | Hostinger ka FTP Password |

### Step 3: Master me Push karein!
Jab bhi aap terminal me yeh likhenge:
```bash
git add .
git commit -m "update website"
git push origin master
```
GitHub Actions khud bakhud chal paregi aur 30 seconds me Hostinger ke `public_html/` folder me sara code deploy kar degi!

---

## Method 2: Hostinger ka Built-in Git Webhook (Alternative)
Agar aap bina GitHub Actions ke direct Hostinger se link karna chahte hain:
1. Hostinger hPanel me **Advanced > Git** par jayein.
2. Repository URL dalein (`https://github.com/username/cyclelava.git`).
3. Branch select karein: `master`.
4. Hostinger aapko ek **Webhook URL** dega.
5. GitHub Repo > **Settings > Webhooks > Add webhook** me ja kar woh URL paste kar dein.
6. Content type: `application/json` select karein aur save kar lein.
