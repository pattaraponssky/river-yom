from hec.heclib.dss import HecDss
from datetime import datetime, timedelta

file = R"C:\xampp\htdocs\rid3-model\RAS_RID03\RID03.dss"
dssfile = HecDss.open(file)

today = datetime.today()
start_date = today - timedelta(days=7)
end_date = today + timedelta(days=6)

same_month = start_date.month == end_date.month and start_date.year == end_date.year

date_part = start_date.strftime("01%b%Y")
if not same_month:
    end_date_part = end_date.strftime("01%b%Y")

paths = [
    "/Khlong Samrong Reach 1/187 INL STRUCT Gate #1/Gate Opening/{}/1Hour/Plan-01/".format(date_part),
    "/Yom River Reach 2/2796 INL STRUCT Gate #1/Gate Opening/{}/1Hour/Plan-01/".format(date_part),
    "/Yom River Reach 2/30189 INL STRUCT Gate #1/Gate Opening/{}/1Hour/Plan-01/".format(date_part)
] 

flows_start = [dssfile.get(path) for path in paths]

if not same_month:
    path_end = [
        "/Khlong Samrong Reach 1/187 INL STRUCT Gate #1/Gate Opening/{}/1Hour/Plan-01/".format(date_part),
        "/Yom River Reach 2/2796 INL STRUCT Gate #1/Gate Opening/{}/1Hour/Plan-01/".format(date_part),
        "/Yom River Reach 2/30189 INL STRUCT Gate #1/Gate Opening/{}/1Hour/Plan-01/".format(date_part)
    ]
    flows_end = [dssfile.get(path) for path in path_end]

with open(R'C:\xampp\htdocs\river-yom\ras-output\gate_output.csv', 'w') as file:
    file.write("DateTime,wst,tng,kpk\n")
    
    num_values_start = flows_start[0].numberValues

    # Write data for flows_start
    for i in range(num_values_start):
        t_start = flows_start[0].getTimes().element(i)
        date_str = t_start.date(-13)
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        date_str = date_obj.strftime("%d/%m/%Y")
        time_str = t_start.time()

        if time_str == "24:00":
            time_str = "00:00"
            date_obj += timedelta(days=1)
            date_str = date_obj.strftime("%d/%m/%Y")

        row = [date_str + " " + time_str]

        for j in range(len(flows_start)):
            row.append(str(flows_start[j].values[i]))

        file.write(",".join(row) + "\n")
    
    # Write data for flows_end if different month
    if not same_month:
        num_values_end = flows_end[0].numberValues
        for i in range(num_values_end):
            t_end = flows_end[0].getTimes().element(i)
            date_str = t_end.date(-13)
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            date_str = date_obj.strftime("%d/%m/%Y")
            time_str = t_end.time()

            if time_str == "24:00":
                time_str = "00:00"
                date_obj += timedelta(days=1)
                date_str = date_obj.strftime("%d/%m/%Y")

            row = [date_str + " " + time_str]

            for j in range(len(flows_end)):
                row.append(str(flows_end[j].values[i]))

            file.write(",".join(row) + "\n")
