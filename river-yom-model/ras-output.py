import win32com.client
import csv
from datetime import datetime, timedelta

# === เชื่อมต่อกับ HEC-RAS ===
hec = win32com.client.Dispatch("RAS630.HECRASController")

# === ระบุพาธไฟล์โครงการ HEC-RAS และไฟล์ CSV ===
project_file = r"C:\xampp\htdocs\swoc-model\RAS_Thachin\Thachin.prj"
csv_file = r"C:\xampp\htdocs\ras-output\output_ras.csv"

# === เปิดโครงการ HEC-RAS ===
hec.Project_Open(project_file)
current_project = hec.Project_Current()
if not current_project:
    print("ไม่สามารถเปิดไฟล์โครงการ HEC-RAS ได้ ตรวจสอบพาธไฟล์ .prj")
    exit()

print(f"เปิดโครงการสำเร็จ: {current_project}")

# === เตรียมโครงสร้างเก็บข้อมูล ===
data = [["Date", "River", "Reach", "Cross Section", "Water_Elevation"]]

# === ดึงจำนวนแม่น้ำทั้งหมด ===
num_rivers, river_names = hec.Geometry_GetRivers()
river_names = list(river_names)

# === ดึง Profiles ===
profiles = list(hec.Output_GetProfiles(1)[1])
num_profiles = len(profiles)
selected_rivers = [1]  # ถ้าต้องการดึงแม่น้ำ 1 กับ 2 => selected_rivers = [1, 2]

for profile_index in range(1, num_profiles):  # profile_index 0 คือ header
    profile_name = profiles[profile_index]
    try:
        profile_datetime = datetime.strptime(profile_name, "%d%b%Y %H%M")
        formatted_datetime = profile_datetime.strftime("%d/%m/%Y %H:%M")
    except ValueError:
        formatted_datetime = profile_name

    # วนลูปเฉพาะแม่น้ำที่เลือก
    for river_index in selected_rivers:
        river_name = river_names[river_index - 1]

        # ดึงจำนวน Reach ของแม่น้ำนี้
        num_reaches = hec.Geometry_GetReaches(river_index)[0]

        for reach_index in range(1, num_reaches + 1):
            reach_name = f"Reach{reach_index}"

            nodes_info = hec.Output_GetNodes(river_index, reach_index)
            num_river, num_reach, num_stations = nodes_info[:3]

            if num_stations == 0:
                continue

            nodes = list(hec.Output_GetNodes(river_index, reach_index)[3])

            for i in range(num_stations):
                water_elevation = hec.Output_NodeOutput(
                    river_index, reach_index, i + 1, None, profile_index, 2
                )[0]

                data.append([
                    formatted_datetime,
                    river_name,
                    reach_name,
                    nodes[i],
                    water_elevation
                ])
                print(f"{river_name} - {reach_name} - {nodes[i]} @ {formatted_datetime} = {water_elevation:.3f}")

# === ปิดโครงการ HEC-RAS ===
hec.Project_Close()

# === บันทึกข้อมูลลง CSV ===
with open(csv_file, mode="w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerows(data)

print(f"\nบันทึกค่าระดับน้ำลงไฟล์ CSV เรียบร้อย: {csv_file}")
