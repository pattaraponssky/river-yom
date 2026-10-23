from pathlib import Path
from datetime import datetime
import shutil

# วันที่ปัจจุบัน เช่น 2026-07-13
today = datetime.now().strftime("%Y-%m-%d")

# รายชื่อไฟล์ที่ต้องการสำเนา
files_to_copy = [
    r"C:\xampp\htdocs\river-yom\ras-output\output_ras.csv",
    r"C:\xampp\htdocs\river-yom\ras-output\gate_output.csv",
]

for file_path in files_to_copy:
    src = Path(file_path)

    # ตรวจสอบว่าไฟล์มีอยู่หรือไม่
    if not src.exists():
        print(f"[SKIP] ไม่พบไฟล์ : {src}")
        continue

    # สำเนาไปยังโฟลเดอร์ archive ที่อยู่ข้างไฟล์ต้นฉบับ
    archive_dir = src.parent / "archive"
    archive_dir.mkdir(parents=True, exist_ok=True)

    # สร้างชื่อไฟล์ใหม่
    # output_ras.csv -> archive\output_ras_2026-07-13.csv
    dst = archive_dir / f"{src.stem}_{today}{src.suffix}"

    # คัดลอกไฟล์
    shutil.copy2(src, dst)

    print(f"[OK] {src.name} -> {dst}")

print("เสร็จสิ้น")