import csv
from datetime import datetime, timedelta, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile

# Cross sections in STATION_MAPPING in useRasData.ts.
STATION_SECTIONS = {72518, 4423, 22019, 6019, 54578, 6812, 93590, 54108}
BANGKOK = timezone(timedelta(hours=7))


def write_station_csv(source: Path, run_date: str) -> Path:
    archive = source.parent / "archive"
    archive.mkdir(exist_ok=True)
    target = archive / f"output_ras_stations_{run_date}.csv"
    temporary = None

    try:
        with source.open(encoding="utf-8-sig", newline="") as raw:
            reader = csv.reader(raw)
            header = next(reader)
            cross_section = header.index("Cross Section")

            with NamedTemporaryFile(
                mode="w", encoding="utf-8", newline="", dir=archive, delete=False
            ) as output:
                temporary = Path(output.name)
                writer = csv.writer(output)
                writer.writerow(header)
                for row in reader:
                    if len(row) != len(header):
                        continue
                    try:
                        section = float(row[cross_section])
                    except ValueError:
                        continue
                    if section in STATION_SECTIONS:
                        writer.writerow(row)

        temporary.replace(target)
        return target
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def publish_station_csv(source: Path) -> Path:
    return write_station_csv(source, datetime.now(BANGKOK).date().isoformat())
