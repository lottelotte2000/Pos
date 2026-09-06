# 📋 HANDOFF — สรุปงานและสิ่งที่ต้องทำต่อ

> เอกสารส่งต่องาน (พกข้ามเครื่องได้ผ่าน git) — อัปเดตล่าสุด: 2026-09-06
> Repo: <https://github.com/lottelotte2000/Pos>

---

## 🎯 ภาพรวมโปรเจกต์
ระบบ **POS (ขายหน้าร้าน)** — Electron + React + TypeScript + Vite
- ฐานข้อมูล: **SQLite** (better-sqlite3) เก็บในเครื่อง + backup อัตโนมัติ
- ฟีเจอร์: หน้าขาย/บาร์โค้ด, สินค้า/สต็อก, บิลขาย + ยกเลิกบิล (void), รายงาน, ผู้ใช้ (admin/cashier), จอลูกค้า (จอเสริม), PromptPay QR, ใบเสร็จ PDF, import/export Excel, เสียงกำหนดเอง, **ธีมตกแต่ง**
- อัปเดตอัตโนมัติผ่าน **electron-updater + GitHub Releases**

---

## ✅ งานที่ทำเสร็จใน session ล่าสุด (ปล่อยถึง v1.2.6)

### ธีม Dragon Ball
- แก้ลูกแก้วให้แสดงดาว **1–7 ดวงครบถูกต้อง** (เดิมจำกัดไว้ 3 ดวง)
- จัดตำแหน่งดาวแบบดราก้อนบอลจริง (ลายลูกเต๋า: 3=สามเหลี่ยม, 5=ลูกเต๋าห้า, 7=แถว 2-3-2) เป็น **SVG ดาวแดง 5 แฉก**
- ดาวแผ่เต็มลูก + ลูกแก้ว **กระจายทั่วจอไม่ทับกัน** (ใช้จุดยึด + สุ่มเยื้อง)

### ธีมใหม่ "Demon Slayer" ⚔️
- โทน **ลมหายใจสายน้ำ** (ฟ้า-เขียวมิ้นท์) + ชมพูวิสทีเรีย บนพื้นชาร์โคล
- เอฟเฟกต์: **ดอกฮิบานะสีฟ้า** (SVG) + **ดาบคาตานะ** (SVG สมจริง มี hamon/tsuba/ito) + กลีบวิสทีเรียร่วง + คลื่นสายน้ำ + ลายตารางฮาโอริ + ปุ่มชำระเงินออร่าสายน้ำ
- เป็นงานวาดต้นฉบับทั้งหมด (ไม่ใช้ตัวละคร/โลโก้ลิขสิทธิ์)

### แก้บั๊กเลเยอร์
- **ย้ายเอฟเฟกต์ตกแต่งไปด้านหลังสุด** (`-z-10`) + ทำ Layout พื้นหลังโปร่ง → ตกแต่งไม่บังปุ่ม/ช่อง
- **แก้จอลูกค้าธีมไม่ขึ้น** — ย้ายพื้นหลังจอลูกค้าเป็น `-z-20` ให้เอฟเฟกต์โผล่เหนือพื้นหลัง
- **แก้ลูกแก้ว Dragon Ball บังปุ่มลบในหน้าขาย** — เปลี่ยน wrapper เป็น `-z-10`

---

## 📦 ประวัติการปล่อยเวอร์ชัน
| เวอร์ชัน | เนื้อหา | สถานะ |
|---------|--------|-------|
| 1.2.4 | ธีม Demon Slayer + ปรับ Dragon Ball + เอฟเฟกต์ไปหลัง | published |
| 1.2.5 | แก้จอลูกค้าธีมไม่ขึ้น | published |
| **1.2.6** | แก้ลูกแก้ว Dragon Ball บังปุ่มในหน้าขาย | **⚠️ Draft — รอกด Publish** |

> **ค้างอยู่:** v1.2.6 อัป installer + latest.yml + release notes ครบแล้ว เหลือกด **Publish release** ที่
> <https://github.com/lottelotte2000/Pos/releases> เพื่อให้ลูกค้าได้รับอัปเดต

---

## 🗂️ ไฟล์สำคัญที่เกี่ยวกับธีม
| ไฟล์ | หน้าที่ |
|------|--------|
| `src/context/ThemeContext.tsx` | นิยาม type ธีม + เก็บ/sync ค่าใน localStorage (`app_theme`) |
| `src/pages/SettingsPage.tsx` | ปุ่มเลือกธีมในหน้าตั้งค่า |
| `src/index.css` | พาเลตต์สีแต่ละธีม (`[data-theme=...]`) + คีย์เฟรมเอฟเฟกต์ |
| `src/components/common/ThemeDecorations.tsx` | คอมโพเนนต์เอฟเฟกต์ตกแต่งทุกธีม (ลูกแก้ว, ดอกฮิบานะ, ดาบ ฯลฯ) |
| `src/components/common/DragonBallEffects.tsx` | ออร่าตอนชำระเงินสำเร็จ |
| `src/components/common/WhatsNew.tsx` | หน้าต่าง "มีอะไรใหม่" (แก้ `WHATS_NEW_VERSION` ทุกครั้งที่ปล่อยเวอร์ชัน) |

> **การจัดเลเยอร์:** เอฟเฟกต์ตกแต่งใช้ `-z-10`, Layout พื้นหลังโปร่ง, จอลูกค้าพื้นหลัง `-z-20`
> **หมายเหตุ:** ธีมเทศกาล (Christmas/Songkran/NewYear) ยังเป็น `z-[0]` — ถ้าจะกันบังในอนาคตต้องเปลี่ยนเป็น `-z-10` ด้วย

---

## 🚀 ขั้นตอนปล่อยเวอร์ชันใหม่ (ย่อ — ดูเต็มใน `RELEASE.md`)
1. อัป `version` ใน `package.json` (+ sync `package-lock.json`: `npm install --package-lock-only --ignore-scripts`)
2. อัป `WHATS_NEW_VERSION` + เนื้อหาใน `src/components/common/WhatsNew.tsx`
3. commit + push ขึ้น `main`
4. ตั้ง token: `setx GH_TOKEN "ghp_xxx"` (ครั้งเดียว) → `npm run release` (build + อัปขึ้น GitHub เป็น draft)
5. **เขียน Release notes บน GitHub** (electron-builder เว้น body ว่าง — ต้องใส่เอง ผ่านหน้าเว็บหรือ API)
6. กด **Publish release** ที่หน้า GitHub

### รันโหมด dev / ทดสอบ
```bash
npm install
npm run dev            # เว็บอย่างเดียว (Vite :5173)
npm run electron:dev   # เว็บ + Electron desktop
```
> ทดสอบแบบไม่แตะข้อมูลจริง: ตั้ง env `POS_USERDATA_DIR` ชี้ไปโฟลเดอร์ทดสอบก่อนเปิด Electron

---

## 🔧 สิ่งที่ควรทำต่อ (เรียงตามความสำคัญ)

### เทคนิค / ความเรียบร้อย
- [ ] **ใส่ไอคอนแอป** — ตอน build ขึ้น warning "default Electron icon is used" → เพิ่ม `resources/icon.ico` (256×256)
- [ ] **อุด `.gitignore`** — `.dev-userdata/` และ `.claude/` ยังไม่ถูก ignore (เสี่ยงเผลอ commit)
- [ ] **Code signing (Windows)** — installer ไม่ได้เซ็น ลูกค้าเจอ SmartScreen เตือน
- [ ] **ตรวจ security** — `npm audit` รายงาน 35 vulnerabilities (4 critical, 26 high)
- [ ] **รวมจุดแก้เวอร์ชัน** — ตอนนี้แก้ 3 ที่ (package.json, lock, WhatsNew) → ให้ WhatsNew อ่านจาก package.json อัตโนมัติ
- [ ] **GitHub Actions CI** — push tag แล้ว build+release อัตโนมัติ (ไม่ต้องถือ token เอง)
- [ ] **เพิ่ม unit test** — ยังไม่มี test framework; จุดเสี่ยงสุดคือคำนวณเงิน/ทอน/สต็อก

### ฟีเจอร์ (ยังไม่มีในระบบ)
- [ ] **ส่วนลด (Discount)** — ต่อชิ้น/ท้ายบิล (บาท/%) — คุ้มสุด ร้านใช้ทุกวัน
- [ ] **เปิด-ปิดกะ + นับเงินลิ้นชัก** (Shift / cash reconcile)
- [ ] **แจ้งเตือนสต็อกต่ำ + จุดสั่งซื้อ** (ตอนนี้เกณฑ์ตายตัว ≤5 แค่แสดงจำนวน)
- [ ] **ระบบสมาชิก + แต้มสะสม**
- [ ] **VAT 7% + ใบกำกับภาษีอย่างย่อ**
- [ ] **ประวัติการเคลื่อนไหวสต็อก** (stock movement log)
- [ ] **สำรองข้อมูลขึ้นคลาวด์** (ปัจจุบัน backup เป็นไฟล์ในเครื่องเท่านั้น เสี่ยงข้อมูลหายถ้า disk พัง)

---

## ⚡ ทำงานต่อบนเครื่องใหม่
```bash
git clone https://github.com/lottelotte2000/Pos.git
cd Pos
npm install
```
อ่านไฟล์นี้ + `RELEASE.md` แล้วทำงานต่อได้เลย
