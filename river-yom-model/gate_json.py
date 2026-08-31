import pandas as pd
import json
import os
from datetime import datetime, date

# === Configuration ===
# BASE_DIR = r"/Users/dan/web-rid3/ras-output"
BASE_DIR = r"C:\xampp\htdocs\river-yom\ras-output"
csv_input_path = os.path.join(BASE_DIR, "gate_output.csv")

# Configuration สำหรับประตูระบายน้ำแต่ละประเภท
GATE_CONFIGS = [
    {
        "input_col": "wst",
        "num_gates": 7,
        "suffix": "wst",
        "station_code": "wst",
        "station_name": "ปตร.วังสะตือ",
    },
    {
        "input_col": "tng",
        "num_gates": 5,
        "suffix": "tng",
        "station_code": "tng",
        "station_name": "ปตร.ท่านางงาม",
    },
    {
        "input_col": "kpk",
        "num_gates": 1,
        "suffix": "kpk",
        "station_code": "kpk",
        "station_name": "ปตร.คลองปลากด",
    },
]

def process_gate_data(df_input: pd.DataFrame, config: dict):

    input_col = config["input_col"]
    num_gates = config["num_gates"]
    station_code = config["station_code"]
    station_name = config["station_name"]
    suffix = config["suffix"]

    merged_data = []
    current_block_start_index = 0
    df = df_input.copy()

    print(f"\n--- เริ่มประมวลผล: {input_col} ({num_gates} ประตู) ---")

    previous_end_time = None  # ใช้ต่อช่วงเวลา

    while current_block_start_index < len(df):
        start_time = df.iloc[current_block_start_index]["DateTime"]

        # ✅ ถ้ามี block ก่อนหน้า ให้เริ่ม block นี้ต่อจากเวลาจบเดิม
        if previous_end_time and start_time > previous_end_time:
            start_time = previous_end_time

        current_values_for_block = []
        current_block_end_index = current_block_start_index

        while current_block_end_index < len(df):
            current_time = df.iloc[current_block_end_index]["DateTime"]
            current_ht = df.iloc[current_block_end_index][input_col]

            if pd.isna(current_ht):
                current_block_end_index += 1
                continue

            # ถ้าเป็นแถวแรกของ block
            if current_block_end_index == current_block_start_index:
                current_values_for_block.append(current_ht)
                current_block_end_index += 1
                continue

            prev_ht = df.iloc[current_block_end_index - 1][input_col]
            diff = abs(current_ht - prev_ht)

            # ✅ เงื่อนไขจบ block ถ้าเป็นเวลา 09:00 ของวันถัดไป
            if (
                current_time.date() > df.iloc[current_block_start_index]["DateTime"].date()
                and current_time.hour == 9
                and current_time.minute == 0
            ):
                current_values_for_block.append(current_ht)
                current_block_end_index += 1
                break

            # ✅ เงื่อนไขจบ block ถ้าค่าเปลี่ยนเกิน 0.5 หลังจาก 3 ชั่วโมง
            duration = (current_time - df.iloc[current_block_start_index]["DateTime"]).total_seconds() / 3600
            if duration > 3 and diff >= 0.5:
                break

            current_values_for_block.append(current_ht)
            current_block_end_index += 1

        if not current_values_for_block:
            current_block_start_index = current_block_end_index
            continue

        end_time = df.iloc[current_block_end_index - 1]["DateTime"]
        avg_ht = round(sum(current_values_for_block) / len(current_values_for_block), 1)
        duration_hours = (end_time - start_time).total_seconds() / 3600
        final_hour_value = round(duration_hours, 2)

        output_entry = {
            "station_code": station_code,
            "station_name": station_name,
            "dt_begin": start_time.strftime("%Y-%m-%d %H:%M"),
            "dt_end": end_time.strftime("%Y-%m-%d %H:%M"),
            "hour": final_hour_value,
            "gate_open": num_gates,
        }

        for i in range(1, num_gates + 1):
            output_entry[f"gate{i}_ht"] = avg_ht

        merged_data.append(output_entry)

        previous_end_time = end_time
        current_block_start_index = current_block_end_index

    # === Save Output ===
    json_output_path = os.path.join(BASE_DIR, f"gate_open_{suffix}.json")
    csv_output_path = os.path.join(BASE_DIR, f"gate_open_{suffix}.csv")

    with open(json_output_path, "w", encoding="utf-8") as f:
        json.dump(merged_data, f, indent=2, ensure_ascii=False)

    df_output = pd.DataFrame(merged_data)
    df_output.to_csv(csv_output_path, index=False, encoding="utf-8-sig")

    print(f"✅ บันทึกไฟล์ gate_open_{suffix}.json และ gate_open_{suffix}.csv (จำนวน {len(merged_data)} รายการ) เรียบร้อยแล้ว")

# === Script Execution ===
try:
    df = pd.read_csv(csv_input_path)
    df.columns = df.columns.str.strip()
    df["DateTime"] = pd.to_datetime(df["DateTime"], format="%d/%m/%Y %H:%M")

    current_date = datetime.now().date()
    filter_start_datetime = datetime(current_date.year, current_date.month, current_date.day, 9, 0)
    df_filtered = df[df["DateTime"] >= filter_start_datetime].copy()
    df_filtered.reset_index(drop=True, inplace=True)

    if df_filtered.empty:
        print("⚠️ ไม่มีข้อมูลตั้งแต่วันที่ปัจจุบันเป็นต้นไป ไม่สามารถทำการคำนวณได้")
    else:
        for config in GATE_CONFIGS:
            process_gate_data(df_filtered, config)

except FileNotFoundError:
    print(f"❌ ERROR: ไม่พบไฟล์อินพุตที่ {csv_input_path}")
except Exception as e:
    print(f"❌ เกิดข้อผิดพลาดที่ไม่คาดคิด: {e}")
