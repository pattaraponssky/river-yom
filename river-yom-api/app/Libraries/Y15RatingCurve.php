<?php

namespace App\Libraries;

class Y15RatingCurve
{
    /** Convert water level (ม.รทก.) to discharge (m³/s). */
    public static function discharge($waterLevel): ?float
    {
        if (!is_numeric($waterLevel) || !is_finite((float) $waterLevel)) {
            return null;
        }

        // [water level, discharge]; interpolate only within the supplied curve.
        $points = [
            [33.343, 0.0], [36.152, 2.0], [36.435, 5.0],
            [36.740, 10.0], [37.433, 25.0], [38.287, 50.0],
            [39.534, 100.0], [41.318, 200.0], [44.240, 500.0],
            [46.600, 1000.0], [49.757, 2000.0],
        ];
        $level = (float) $waterLevel;
        if ($level <= $points[0][0]) {
            return 0.0;
        }
        foreach (array_slice($points, 1) as $index => $upper) {
            if ($level <= $upper[0]) {
                $lower = $points[$index];
                return $lower[1] + ($level - $lower[0])
                    * ($upper[1] - $lower[1]) / ($upper[0] - $lower[0]);
            }
        }

        return null;
    }
}
