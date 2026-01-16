import pandas as pd
import numpy as np

# อ่านไฟล์ CSV
file_path = '/Users/dan/web-wangyang/frontend/public/data/ground_station5.csv'  # เปลี่ยนเป็น path ของไฟล์ CSV ของคุณ
df = pd.read_csv(file_path)

# ฟังก์ชันในการทำ Interpolation และลดจำนวนแถวให้เหลือ 35 ค่า
def reduce_to_35_values(df):
    # ทำ Interpolation ให้ทุกคอลัมน์เหลือ 35 ค่า
    new_df = df.apply(lambda x: np.interp(np.linspace(0, len(x)-1, 35), np.arange(len(x)), x), axis=0)
    return new_df

# เรียกใช้ฟังก์ชัน
df_reduced = reduce_to_35_values(df)

# บันทึกผลลัพธ์ลงในไฟล์ CSV ใหม่
output_path = 'output_reduced5.csv'  # ตั้งชื่อไฟล์ผลลัพธ์
df_reduced.to_csv(output_path, index=False)

print(f"ไฟล์ CSV ใหม่ถูกบันทึกที่: {output_path}")
