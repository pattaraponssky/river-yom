# file: filter_ras_forecast.py
# รันด้วย: python filter_ras_forecast.py

import csv
from datetime import datetime
from pathlib import Path

# ---------------------- ตั้งค่าตรงนี้ ----------------------
# รายการ Cross Section ที่ต้องการ (ใส่เป็น int)
TARGET_SECTIONS = {
    84876,   # T.1
    160842,  # T.10
    142824,  # T.13
    55827,   # T.14
    125488,  # T.15
    # เพิ่มได้เลย เช่น 123456,
}

# โฟลเดอร์และไฟล์ต้นฉบับ
# SOURCE_DIR = Path("/Users/dan/SWOC ท่าจีน/web-thachin/frontend/public/ras-output")
SOURCE_DIR = Path("C:/xampp/htdocs/ras-output")
SOURCE_FILE = SOURCE_DIR / "output_ras.csv"

# ไฟล์ที่ผ่านการกรองแล้ว (ให้ CI อ่านอันนี้)
OUTPUT_DIR = SOURCE_DIR / "filtered"
OUTPUT_DIR.mkdir(exist_ok=True)
OUTPUT_FILE = OUTPUT_DIR / "output_ras_filtered.csv"
# ---------------------------------------------------------

def main():
    if not SOURCE_FILE.exists():
        print(f"ไม่พบไฟล์: {SOURCE_FILE}")
        return

    print(f"กำลังอ่านไฟล์: {SOURCE_FILE.name}")
    print(f"ต้องการเฉพาะ Cross Section: {sorted(TARGET_SECTIONS)}")

    filtered_rows = 0
    total_rows = 0

    # ใช้ context manager + generator → RAM น้อยมาก แม้ไฟล์ 500MB
    with SOURCE_FILE.open('r', encoding='utf-8', newline='') as src, \
         OUTPUT_FILE.open('w', encoding='utf-8', newline='') as dst:

        reader = csv.reader(src)
        writer = csv.writer(dst)

        # เขียน header
        header = next(reader)
        writer.writerow(header)
        total_rows += 1

        target_set = TARGET_SECTIONS  # set สำหรับ lookup เร็วสุด

        for row in reader:
            total_rows += 1
            if len(row) < 5:
                continue

            try:
                cross_section = int(row[3].strip())  # คอลัมน์ Cross Section
            except ValueError:
                continue

            if cross_section in target_set:
                writer.writerow(row)
                filtered_rows += 1

            # แสดง progress ทุกๆ 100,000 แถว
            if total_rows % 100_000 == 0:
                print(f"อ่านแล้ว {total_rows:,} แถว → ผ่านการกรอง {filtered_rows:,} แถว")

    print("\nสำเร็จ!")
    print(f"   อ่านทั้งหมด: {total_rows:,} แถว")
    print(f"   เก็บเฉพาะที่ต้องการ: {filtered_rows:,} แถว")
    print(f"   บันทึกที่: {OUTPUT_FILE}")

if __name__ == "__main__":
    start = datetime.now()
    main()
    print(f"ใช้เวลาทั้งหมด: {datetime.now() - start}")