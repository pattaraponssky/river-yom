import win32com.client
import os
import time
import re
from datetime import datetime, timedelta
import subprocess
#  กำหนดพาธไฟล์ .p01 ของแผนปัจจุบัน
p01_file = r"C:\xampp\htdocs\river-yom-model\RAS_YOM\YOM.p05"

today = datetime.today()
start_date = (today - timedelta(days=7)).strftime("%d%b%Y,07.00").upper()  # 7 days before
end_date = (today + timedelta(days=6)).strftime("%d%b%Y,06.00").upper()  # 6 days ahead


print("Start date:", start_date)
print("End date:", end_date)

# start_date = "02APR2025,00.00"
# end_date = "15APR2025,00.00"

with open(p01_file, "r", encoding="utf-8") as file:
    lines = file.readlines()

for i, line in enumerate(lines):
    if line.startswith("Simulation Date="):
        lines[i] = f"Simulation Date={start_date},{end_date}\n"
        print(f" Updated Simulation Date to: {start_date} - {end_date}")

with open(p01_file, "w", encoding="utf-8") as file:
    file.writelines(lines)

print(" Successfully updated .p01 file.")


RAS_PROJECT = r"C:\xampp\htdocs\river-yom-model\RAS_YOM\YOM.prj"
RAS_PROJECT = os.path.abspath(RAS_PROJECT)
print(f" Using project file: {RAS_PROJECT}")

RAS_VERSIONS = ["RAS630.HECRASController"]
ras = None

for version in RAS_VERSIONS:
    try:
        ras = win32com.client.Dispatch(version)
        print(f" Connected to HEC-RAS using {version}")
        break
    except Exception as e:
        print(f" Failed to connect using {version}: {e}")
        continue

if ras is None:
    print(" Failed to connect to any HEC-RAS version.")
    exit()

try:
    ras.ShowRas()
    time.sleep(2)  
    ras.Project_Open(RAS_PROJECT)

    if not ras.Project_Current():
        print(" No project is currently open!")
        exit()
    else:
        print(f" Project '{ras.Project_Current()}' is open.")

   
    plans_info = ras.Plan_Names()
    if isinstance(plans_info, tuple) and len(plans_info) > 1:
        plans = plans_info[1]  
    else:
        print(" Error: Unexpected plan structure received.")
        exit()

    print(f" Available Plans: {plans}")

    if not ras.PlanOutput_IsCurrent():
        ras.Plan_SetCurrent(plans[0])
    print(f" Current plan set to: {plans[0]}")

    geom_file = ras.CurrentGeomFile()
    flow_file = ras.CurrentUnSteadyFile()
    plan_file = ras.CurrentPlanFile()
    print(f" Geometry File: {geom_file}")
    print(f" Unsteady Flow File: {flow_file}")
    print(f" Plan File: {plan_file}")

    print(f" Running Unsteady Flow Analysis for Plan: {plans[0]} ...")
    success, code, message, _ = ras.Compute_CurrentPlan(None, None, True)

    print(f" Computation Result: {success}, Code: {code}, Message: {message}")

    if success:
        print(" Unsteady Flow Analysis completed successfully.")
    else:
        print(f" Error while running Unsteady Flow Analysis: {message}")

    try:
        ras.QuitRas()
        time.sleep(3)
        print("HEC-RAS closed successfully.")
    except Exception as e:
        print(f"Warning: Could not close HEC-RAS properly: {e}")

    try:
        import win32com.client
        import pythoncom
        del ras
        pythoncom.CoUninitialize()
    except Exception:
        pass

    try:
        subprocess.run("taskkill /F /IM ras.exe", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run("taskkill /F /IM hec-ras.exe", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("Force-closed all HEC-RAS processes.")
    except Exception as e:
        print(f"Could not kill processes: {e}")

except Exception as e:
    print(f" Error while running Unsteady Flow Analysis: {e}")
    exit()
