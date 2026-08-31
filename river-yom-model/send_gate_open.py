import csv
import json
import requests
import os

# === Configuration ===
# กำหนดการตั้งค่าสำหรับไฟล์ CSV และ URL ปลายทางแต่ละชุด
FILE_CONFIGS = [
    {
        "file_path": "../ras-output/gate_open_wst.csv",
        "url": "http://wms-rio3.rid.go.th/wangsatue/api/rid/water-data/open",
        "name": "WST Gate Data"
    },
    {
        "file_path": "../ras-output/gate_open_tng.csv",
        "url": "http://wms-rio3.rid.go.th/thanangngam/api/rid/water-data/open",
        "name": "TNG Gate Data"
    },
    {
        "file_path": "../ras-output/gate_open_kpk.csv",
        "url": "http://wms-rio3.rid.go.th/wangsatue/api/rid/water-data/open",
        "name": "KPK Gate Data"
    }
]

def send_data_to_api(file_path: str, url: str, name: str):
    data_list = []
    
    # 1. อ่านไฟล์ CSV
    try:
        with open(file_path, mode='r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # ตรวจสอบ fieldnames
            if reader.fieldnames is None:
                print(f"⚠️ {name}: ไฟล์ CSV ว่างหรือไม่มี fieldnames")
                return
            
            # กรองเฉพาะคอลัมน์ gateX_ht
            gate_ht_fields = [f for f in reader.fieldnames if f.startswith("gate") and f.endswith("_ht")]

            for row in reader:
                try:
                    hour_raw = row.get("hour", "0")
                    data_entry = {
                        "station_code": row.get("station_code"),
                        "station_name": row.get("station_name"),
                        "dt_begin": row.get("dt_begin"),
                        "dt_end": row.get("dt_end"),
                        "hour": f"{int(float(hour_raw)):02d}",
                        "gate_open": int(row.get("gate_open", 0)),
                    }

                    for field in gate_ht_fields:
                        data_entry[field] = float(row.get(field, 0.0))

                    data_list.append(data_entry)

                except Exception as e:
                    print(f"⚠️ {name}: ข้อมูล row ผิดพลาด: {e}")
                    continue

    except FileNotFoundError:
        print(f"❌ {name}: ไม่พบไฟล์ CSV ที่ {file_path}")
        return
    except Exception as e:
        print(f"❌ {name}: เกิดข้อผิดพลาดในการอ่าน CSV: {e}")
        return

    if not data_list:
        print(f"⚠️ {name}: ไม่มีข้อมูลที่จะส่ง")
        return

    # 2. ส่ง POST request
    print(f"\n🚀 {name}: กำลังส่งข้อมูล {len(data_list)} รายการไปยัง {url}...")

    try:
        response = requests.post(
            url,
            json=data_list,
            headers={"Content-Type": "application/json"},
            timeout=60
        )

        if response.status_code in (200, 201):
            print(f"✅ {name}: ส่งข้อมูลสำเร็จ (Status: {response.status_code})")
        else:
            print(f"❌ {name}: ส่งข้อมูลไม่สำเร็จ (Status: {response.status_code})")
            print(f"   Response (ตัวอย่าง): {response.text[:200]}")

    except requests.exceptions.RequestException as e:
        print(f"❌ {name}: เกิดข้อผิดพลาดในการเชื่อมต่อ: {e}")


# === Main Execution ===
if __name__ == "__main__":
    for config in FILE_CONFIGS:
        send_data_to_api(
            config["file_path"],
            config["url"],
            config["name"]
        )
