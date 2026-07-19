# คู่มือปล่อยเวอร์ชันใหม่ (Auto-Update ผ่าน GitHub Releases)

ระบบอัปเดตอัตโนมัติของแอปใช้ **electron-updater** ดึงไฟล์จาก **GitHub Releases**
ของ repo `lottelotte2000/Pos` (เป็น public จึงไม่ต้องใช้ token ในฝั่งแอปลูกค้า)

---

## 🔑 ตั้งครั้งเดียว: สร้าง GitHub Token

Token นี้ใช้ตอน **build เท่านั้น** (สำหรับอัปไฟล์ขึ้น Release) **ไม่ได้ฝังลงในแอป**

1. ไปที่ <https://github.com/settings/tokens> → **Tokens (classic)** → **Generate new token (classic)**
2. ตั้งชื่อ เช่น `pos-release` → เลือก scope **`repo`** → Generate → **คัดลอก token เก็บไว้**
3. ตั้งเป็น environment variable บนเครื่องที่ใช้ build:

   **แบบถาวร (แนะนำ)** — เปิด PowerShell แล้วรัน (จากนั้น **ปิด-เปิด terminal ใหม่**):
   ```powershell
   setx GH_TOKEN "ghp_xxxxxxxxxxxxxxxxxxxx"
   ```

   **แบบเฉพาะรอบนี้** — ใช้ชั่วคราวในหน้าต่างปัจจุบัน:
   ```powershell
   $env:GH_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxx"
   ```

> ⚠️ อย่า commit token ลง git เด็ดขาด

---

## 🚀 ทุกครั้งที่จะปล่อยเวอร์ชันใหม่ (3 ขั้นตอน)

### 1) เพิ่มเลขเวอร์ชัน
แก้ `version` ใน `package.json` เช่น `4.5.0` → `4.5.1`
หรือใช้คำสั่ง:
```powershell
npm version patch --no-git-tag-version    # 4.5.0 -> 4.5.1
npm version minor --no-git-tag-version    # 4.5.0 -> 4.6.0
```

> ⚠️ **สำคัญมาก:** ถ้าไม่เพิ่มเลขเวอร์ชัน แอปที่ติดตั้งอยู่จะ **ไม่เห็นอัปเดต**
> (electron-updater อัปเดตเฉพาะเมื่อเวอร์ชันใหม่ **สูงกว่า** ที่ติดตั้งอยู่)

### 2) Build + อัปขึ้น GitHub อัตโนมัติ
```powershell
npm run release
```
คำสั่งนี้จะ: build หน้าเว็บ → สร้าง installer → **อัปโหลดขึ้น GitHub Releases ให้เอง**
โดยอัป 3 ไฟล์ที่ระบบอัปเดตต้องใช้:
- `POS System Setup X.Y.Z.exe`
- `POS System Setup X.Y.Z.exe.blockmap`
- `latest.yml` ← ไฟล์ที่บอกว่าเวอร์ชันล่าสุดคืออะไร

### 3) กด Publish ที่ GitHub (คลิกเดียว)
ไปที่ <https://github.com/lottelotte2000/Pos/releases> → จะเห็น release ใหม่เป็น **Draft**
→ กด **Edit** → **Publish release**

> ตราบใดที่ยังเป็น Draft **ลูกค้าจะยังไม่เห็นอัปเดต** (ถือเป็นจุดตรวจก่อนปล่อยจริง)
>
> ถ้าอยากให้ปล่อยอัตโนมัติโดยไม่ต้องกดเอง: แก้ `package.json` →
> `build.publish.releaseType` จาก `"draft"` เป็น `"release"`

---

## 🧪 วิธีทดสอบว่าอัปเดตทำงาน

1. ติดตั้งแอปเวอร์ชันเก่ากว่าไว้ในเครื่อง (เช่น 4.5.0)
2. ปล่อยเวอร์ชันใหม่ตามขั้นตอนข้างบน (เช่น 4.5.1) และกด Publish แล้ว
3. เปิดแอป → ระบบจะเช็คอัตโนมัติ หรือกดปุ่ม **"ตรวจสอบอัปเดต"** ในหน้า **ตั้งค่าระบบ**
4. จะเห็นกล่องแจ้งเตือนมุมขวาล่าง + แถบดาวน์โหลด → กด **"อัปเดตและรีสตาร์ททันที"**
   (ระบบจะ **สำรองฐานข้อมูลอัตโนมัติ** ก่อนติดตั้ง)

---

## ⚠️ เครื่องที่ติดตั้งเวอร์ชันเก่าไว้แล้ว (สำคัญ)

แอปจะ "จำ" ที่อยู่เซิร์ฟเวอร์อัปเดตตั้งแต่ตอน build ดังนั้น:

- เครื่องที่ติดตั้ง **4.2.0 / 4.3.0 / 4.5.0 (build เดิม)** → ยังเช็คอัปเดตจาก **Netlify** อยู่
- เครื่องที่ติดตั้งเวอร์ชันที่ build **หลังจากเปลี่ยน config นี้** → เช็คจาก **GitHub Releases**

**วิธีย้ายเครื่องเก่ามาใช้ GitHub (ทำครั้งเดียว):**
1. `npm run release` สร้างเวอร์ชันใหม่ (เช่น 4.5.1) — ตัวนี้ฝัง config GitHub ไว้แล้ว
2. เอา 3 ไฟล์จาก `dist_electron/` (exe, blockmap, latest.yml) **อัปขึ้น Netlify อีกครั้งเดียว**
3. เครื่องเก่าจะอัปเดตเป็น 4.5.1 ผ่าน Netlify → หลังจากนั้นมันจะเช็ค GitHub เองทุกรอบถัดไป

> ถ้ายังไม่เคยเอาไปติดตั้งที่ร้านจริง ข้ามขั้นตอนนี้ได้เลย

---

## 🧰 คำสั่งที่เกี่ยวข้อง

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run electron:dev` | รันโหมดพัฒนา |
| `npm run electron:build` | build installer **อย่างเดียว** (ไม่อัปขึ้น GitHub) |
| `npm run release` | build **+ อัปขึ้น GitHub Releases** |

---

## 🩺 แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `Error: GitHub Personal Access Token is not set` | ยังไม่ได้ตั้ง `GH_TOKEN` หรือยังไม่ได้เปิด terminal ใหม่หลัง `setx` |
| แอปไม่เห็นอัปเดต | ยังไม่ได้กด **Publish** (ยังเป็น Draft) / ลืมเพิ่มเลขเวอร์ชัน |
| `Update ... is not available (latest version: X)` | เวอร์ชันบนเซิร์ฟเวอร์ยังเก่ากว่าที่ติดตั้ง — ตรวจว่า `latest.yml` อัปขึ้นแล้ว |
| ติดตั้งแล้วเปิดไม่ขึ้น / จอขาว | ต้อง build ด้วยเครื่องที่มี binary ของ better-sqlite3 ตรงกับ Electron (`npm install` จะรัน `postinstall` ให้อัตโนมัติ) |
| Windows เตือน "ผู้พัฒนาไม่รู้จัก" | ยังไม่ได้ทำ code signing — กด **More info → Run anyway** (ไม่กระทบ auto-update) |
