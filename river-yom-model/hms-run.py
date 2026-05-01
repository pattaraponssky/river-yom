from datetime import datetime, timedelta
from hms.model import Project
from hms import Hms
import locale

# --- Automatic Date and Time Settings ---
today = datetime.today()

# Set the locale to English to ensure month names are in English
try:
    locale.setlocale(locale.LC_TIME, 'en_US.UTF-8')
except locale.Error:
    try:
        locale.setlocale(locale.LC_TIME, 'en_US')
    except locale.Error:
        print("Warning: Could not set locale to English. Month names may be incorrect.")

# Start and End dates
start_date_flow = (today - timedelta(days=7)).strftime("%d %B %Y")
end_date_flow = today.strftime("%d %B %Y")

start_date_precip = (today - timedelta(days=7)).strftime("%d %B %Y")
end_date_precip = (today + timedelta(days=6)).strftime("%d %B %Y")

gage_time = "07:00"

# DSS date format for Pathname
dss_start_date_raw = (today - timedelta(days=7)).strftime("%d%b%Y")
dss_start_date = dss_start_date_raw[:2] + dss_start_date_raw[2].upper() + dss_start_date_raw[3:]

dss_end_date_flow_raw = today.strftime("%d%b%Y")
dss_end_date_flow = dss_end_date_flow_raw[:2] + dss_end_date_flow_raw[2].upper() + dss_end_date_flow_raw[3:]

dss_end_date_precip_raw = (today + timedelta(days=6)).strftime("%d%b%Y")
dss_end_date_precip = dss_end_date_precip_raw[:2] + dss_end_date_precip_raw[2].upper() + dss_end_date_precip_raw[3:]

# Reset the locale if needed, though not strictly necessary here
locale.setlocale(locale.LC_TIME, '')

# --- File Paths ---
forecast_file = r"C:\xampp\htdocs\swoc-model\HMS_Thachin\forecast\Forecast_1.forecast"
gage_file = r"C:\xampp\htdocs\swoc-model\HMS_Thachin\Thachin_Basin.gage"

# --- Update Forecast File (This part is already correct) ---
try:
    with open(forecast_file, "r") as file:
        lines = file.readlines()

    new_lines = []
    for line in lines:
        stripped_line = line.strip()
        if stripped_line.startswith("Start Date:"):
            new_lines.append("     Start Date: {}\n".format(start_date_flow))
        elif stripped_line.startswith("Start Time:"):
            new_lines.append("     Start Time: {}\n".format(gage_time))
        elif stripped_line.startswith("Forecast Date:"):
            new_lines.append("     Forecast Date: {}\n".format(end_date_flow))
        elif stripped_line.startswith("Forecast Time:"):
            new_lines.append("     Forecast Time: {}\n".format(gage_time))
        elif stripped_line.startswith("End Date:"):
            new_lines.append("     End Date: {}\n".format(end_date_precip))
        elif stripped_line.startswith("End Time:"):
            new_lines.append("     End Time: {}\n".format(gage_time))
        else:
            new_lines.append(line)

    with open(forecast_file, "w") as file:
        file.writelines(new_lines)

    print("Updated forecast file '{}' successfully!".format(forecast_file))

except FileNotFoundError:
    print("Error: File '{}' not found.".format(forecast_file))
except Exception as e:
    print("An error occurred while updating '{}': {}".format(forecast_file, e))

# --- Update Gage File (REVISED CODE) ---
try:
    with open(gage_file, "r") as file:
        lines = file.readlines()

    new_lines_gage = []
    in_gage_block = False
    in_variant_block = False
    gage_type = None
    current_gage_name = None

    for line in lines:
        stripped_line = line.strip()

        if stripped_line.startswith("Gage:"):
            in_gage_block = True
            gage_type = None
            current_gage_name = stripped_line.split(":", 1)[1].strip()
            new_lines_gage.append(line)

        elif in_gage_block and stripped_line.startswith("Gage Type:"):
            if "Flow" in line:
                gage_type = "Flow"
            elif "Precipitation" in line:
                gage_type = "Precipitation"
            new_lines_gage.append(line)

        elif in_gage_block and stripped_line.startswith("Pathname:"):
            cleaned_gage_name = current_gage_name.replace(" ", "")
            if gage_type == "Precipitation":
                dss_path = "     Pathname: //{}/PRECIP-INC/{} - {}/1Day/GAGE/\n".format(
                    cleaned_gage_name, dss_start_date, dss_end_date_precip)
            elif gage_type == "Flow":
                dss_path = "     Pathname: //{}/FLOW/{} - {}/1Day/GAGE/\n".format(
                    cleaned_gage_name, dss_start_date, dss_end_date_flow)
            else:
                dss_path = line
            new_lines_gage.append(dss_path)

        elif stripped_line.startswith("Variant:"):
            in_variant_block = True
            new_lines_gage.append(line)

        elif in_variant_block and stripped_line.startswith("Start Time:"):
            if gage_type == "Flow":
                new_lines_gage.append("         Start Time: {}, {}\n".format(start_date_flow, gage_time))
            elif gage_type == "Precipitation":
                new_lines_gage.append("         Start Time: {}, {}\n".format(start_date_precip, gage_time))
            else:
                new_lines_gage.append(line)

        elif in_variant_block and stripped_line.startswith("End Time:"):
            if gage_type == "Flow":
                new_lines_gage.append("         End Time: {}, {}\n".format(end_date_flow, gage_time))
            elif gage_type == "Precipitation":
                new_lines_gage.append("         End Time: {}, {}\n".format(end_date_precip, gage_time))
            else:
                new_lines_gage.append(line)

        elif stripped_line.startswith("End Variant:"):
            in_variant_block = False
            new_lines_gage.append(line)

        elif stripped_line == "End:":
            in_gage_block = False
            gage_type = None
            current_gage_name = None
            new_lines_gage.append(line)
        else:
            new_lines_gage.append(line)

    with open(gage_file, "w") as file:
        file.writelines(new_lines_gage)

    print("Updated gage file '{}' successfully!".format(gage_file))

except FileNotFoundError:
    print("Error: File '{}' not found.".format(gage_file))
except Exception as e:
    print("An error occurred while updating '{}': {}".format(gage_file, e))

# --- Run HEC-HMS Forecast ---
try:
    myProject = Project.open(r"C:\xampp\htdocs\swoc-model\HMS_Thachin\Thachin_Basin.hms")
    myProject.computeForecast("Forecast 1")
    myProject.close()
    Hms.shutdownEngine()
    print("Forecast computation completed successfully!")
except Exception as e:
    print("HEC-HMS execution failed: {}".format(e))