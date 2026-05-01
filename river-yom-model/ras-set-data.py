import requests
from datetime import datetime
from collections import defaultdict
import re

def fetch_thachin_stages():
    """
    ดึงข้อมูลระดับน้ำรายชั่วโมงย้อนหลัง 7 วัน จาก API
    """
    url = "https://swocthachin.rid.go.th/swoc-api/api/flow_hourly_data_last_7_days"
    
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        if data.get("status") != "success":
            print("API status ไม่ใช่ success")
            return {}
        
        print(f"ช่วงเวลา: {data.get('start')} ถึง {data.get('end')}")
        
        groups = defaultdict(list)
        for record in data["data"]:
            sta = record.get("sta_code")
            wl_str = record.get("wl")
            if sta and wl_str:
                try:
                    wl = float(wl_str)
                    groups[sta].append(wl)
                except ValueError:
                    continue
        
        # ไม่ต้อง sort เพราะ API เรียงตามเวลาแล้ว (จากบนลงล่าง = เก่า → ใหม่)
        station_wl = {sta: values for sta, values in groups.items()}
        
        for sta, vals in station_wl.items():
            print(f"สถานี {sta}: {len(vals)} ค่า (ตัวอย่าง 5 ค่าแรก: {vals[:5]})")
        
        return station_wl
    
    except Exception as e:
        print(f"ดึง API ไม่ได้: {e}")
        return {}


def replace_observed_stage(file_path, station_wl_dict):
    """
    แทนที่ Observed Stage Hydrograph ด้วยข้อมูลใหม่จาก API
    ใช้ state machine เพื่อข้ามข้อมูลเก่าได้แม่นยำขึ้น
    """
    station_order = ["T.10", "T.13", "T.15", "T.1", "T.14"]  # ตามลำดับในไฟล์ของคุณ

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    i = 0
    observed_count = 0
    replaced = 0

    while i < len(lines):
        line = lines[i].rstrip('\n')  # เก็บไว้แบบไม่ตัดช่องว่างนำหน้า
        new_lines.append(lines[i])     # copy บรรทัดเดิมก่อน

        if "Observed Stage and Flow Hydrograph=" in line:
            observed_count += 1

            if observed_count > len(station_order):
                print(f"เจอ Observed Hydrograph เกินจำนวนสถานีที่กำหนด ({observed_count})")
                i += 1
                continue

            sta = station_order[observed_count - 1]
            print(f"กำลังแทนที่จุดที่ {observed_count} → สถานี {sta}")

            if sta not in station_wl_dict or not station_wl_dict[sta]:
                print(f"ไม่มีข้อมูลสำหรับ {sta} → ข้ามการแทนที่")
                i += 1
                continue

            wl_list = station_wl_dict[sta]
            num_values = len(wl_list)

            if num_values < 50:  # ป้องกันข้อมูลสั้นเกินไป
                print(f"Warning: {sta} มีแค่ {num_values} ค่า → ข้าม")
                i += 1
                continue

            # แทนที่จำนวนค่าในบรรทัด header
            new_lines[-1] = re.sub(r'=\s*\d+', f'= {num_values}', lines[i])

            # ------------------- ข้ามข้อมูลเก่าทั้งหมด -------------------
            i += 1
            skipped = 0
            while i < len(lines):
                current = lines[i].strip()
                # ถ้าเจอบรรทัดที่ "ไม่น่าจะเป็นข้อมูลตัวเลข" → หยุดข้าม
                if not current:
                    # บรรทัดว่าง → ยังข้ามต่อได้
                    i += 1
                    skipped += 1
                    continue

                # เช็คว่ามีคำสำคัญที่บอกว่าไม่ใช่ข้อมูล hydrograph
                if any(kw in current for kw in ['DSS File', 'DSS Path', 'Use DSS', 'Boundary Location', 'Rule Operation', 'Interval', 'Fixed Start', 'Is Critical']):
                    break

                # หรือเริ่มด้วยตัวเลข/จุด/ขีด แต่ indent น้อยมาก (header หรือคำสั่ง)
                if not lines[i].startswith('    '):  # สมมติข้อมูลจริง indent 4 ช่อง
                    break

                # ถ้าเป็นตัวเลขจริง ๆ → ข้าม
                i += 1
                skipped += 1

            print(f"  ข้ามข้อมูลเก่าไปแล้ว {skipped} บรรทัด")

            # ------------------- เขียนข้อมูลใหม่ -------------------
            for j in range(0, num_values, 5):
                chunk = wl_list[j:j+5]
                
                # Format แต่ละค่าให้กว้าง 16 ตัวอักษรพอดี
                formatted = [f"{val:.2f}".rjust(16) for val in chunk]
                
                # รวมเป็น string เดียว
                line_str = "".join(formatted)
                
                # ตัดช่องว่างนำหน้าทั้งหมดออกก่อน
                trimmed = line_str.lstrip()
                
                # เช็คว่าค่าแรกของบรรทัดนี้เป็นค่าติดลบหรือไม่
                # (ดูตัวอักษรแรกหลังตัดช่องว่าง)
                if trimmed and trimmed[0] == '-':
                    indent = "   "   # indent 3 ช่อง สำหรับบรรทัดที่เริ่มด้วยลบ
                else:
                    indent = "    "  # indent 4 ช่อง สำหรับบรรทัดปกติ
                
                # เติม indent ที่เหมาะสม แล้วต่อด้วยข้อมูล
                new_lines.append(indent + trimmed + "\n")

            replaced += 1

                

            replaced += 1

            # ไม่ต้อง i+=1 เพราะข้ามไปแล้ว

        else:
            i += 1

    # if replaced > 0:
    #     timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    #     new_path = file_path.replace(".u0", f"_updated_{timestamp}.u0")  # รองรับ .u01 .u06 ฯลฯ
    #     with open(new_path, 'w', encoding='utf-8') as f:
    #         f.writelines(new_lines)
    #     print(f"\nสำเร็จ! แทนที่ {replaced} สถานีเรียบร้อย")
    #     print(f"ไฟล์ใหม่ → {new_path}")
    # else:
    #     print("\nไม่มีการแทนที่ใด ๆ (ตรวจสอบ path ไฟล์ / ลำดับสถานี / ข้อมูล API)")
    
    if replaced > 0:
        # เขียนทับไฟล์เดิมเลย
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        
        print(f"สำเร็จ! แทนที่ {replaced} จุด และเขียนทับไฟล์เดิมเรียบร้อย → {file_path}")
    else:
        print("ไม่มีการแทนที่ใด ๆ (ไม่มีข้อมูลใหม่หรือไม่เจอจุดที่ต้องการ)")

    return replaced


# ------------------ รัน ------------------
if __name__ == "__main__":
    latest_data = fetch_thachin_stages()
    
    if latest_data:
        # เปลี่ยน path นี้เป็นไฟล์จริงของคุณ
        # input_file = "/Users/dan/SWOC ท่าจีน/web-thachin/swoc-model/Thachin.u06"  # แก้ path ตามจริง
        input_file = r"C:\xampp\htdocs\swoc-model\RAS_Thachin\Thachin.u06"
        replace_observed_stage(input_file, latest_data)
    else:
        print("ไม่สามารถดึงข้อมูลจาก API ได้ กรุณาตรวจสอบการเชื่อมต่อหรือ API status")