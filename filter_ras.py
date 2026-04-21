import pandas as pd

# ----------------- ตั้งค่าที่นี่ -----------------
file_path = '/Users/dan/yom-river-rigth/web-river-yom/river-yom/public/ras-output/output_ras.csv'  # เปลี่ยนเป็นชื่อไฟล์ของคุณ
selected_cross_sections = [170764, 142824, 125488, 84876, 55628]   # ← ใส่ Cross Section ที่ต้องการที่นี่

# อ่านไฟล์ CSV
df = pd.read_csv(file_path)

# คัดเลือกเฉพาะ Cross Section ที่ต้องการ
df_selected = df[df['Cross Section'].isin(selected_cross_sections)]

# แสดงผล
print(f"คัดเลือกได้ {len(df_selected)} แถว")
print(df_selected)

# บันทึกเป็นไฟล์ใหม่ (ถ้าต้องการ)
df_selected.to_csv('/Users/dan/yom-river-rigth/web-river-yom/river-yom/public/ras-output/selected_ras.csv', index=False)
print("บันทึกไฟล์สำเร็จ: /Users/dan/yom-river-rigth/web-river-yom/river-yom/public/ras-output/selected_ras.csv")