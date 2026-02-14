
import type { Dispatch, SetStateAction } from 'react';

// สร้างเมนู toggle สำหรับแสดง/ซ่อน marker แต่ละประเภท
export const createToggleMenu = (
  label: string,
  value: string,
  initialCheck: boolean,
  onChange: Dispatch<SetStateAction<boolean>>
) => {
  return new window.longdo.MenuBar({
    button: [
      {
        label,
        value,
        type: window.longdo.ButtonType.Toggle,
        check: initialCheck,
      },
    ],
    label: '📌 แสดงข้อมูล',
    change: (item: { check: boolean }) => {
      onChange(!!item?.check);
    },
  });
};

// ฟังก์ชันลบ marker ทั้งหมด (ใช้ร่วมกันได้)
export const removeAllMarkers = (map: any, ...markerRefs: React.MutableRefObject<any[]>[]) => {
  if (!map) return;
  markerRefs.forEach((ref) => {
    ref.current.forEach((marker: any) => {
      map.Overlays.remove(marker);
    });
    ref.current = [];
  });
};