<?php

namespace App\Libraries;

class FlowRatingCurve
{
    /** Convert water level (ม.รทก.) to discharge (m³/s). */
    public static function discharge(string $station, $waterLevel): ?float
    {
        if (!is_numeric($waterLevel) || !is_finite((float) $waterLevel)) {
            return null;
        }

        $levels = [
            'Y.15' => [33.343, 36.152, 36.435, 36.740, 37.433, 38.287, 39.534, 41.318, 44.240, 46.600, 49.757],
            'Y.50' => [31.895, 33.325, 33.473, 33.696, 34.250, 34.956, 36.161, 37.960, 41.776, 43.969, 46.558],
            'Y.16' => [30.289, 33.310, 33.419, 33.566, 33.951, 34.510, 35.689, 37.475, 41.477, 43.379, 45.813],
            'Y.64' => [31.300, 33.310, 33.417, 33.560, 33.929, 34.467, 35.632, 37.423, 41.458, 43.358, 45.804],
            'Y.51' => [30.291, 33.308, 33.410, 33.536, 33.827, 34.212, 35.214, 36.845, 40.457, 42.132, 44.567],
            'Y.17' => [30.280, 31.118, 31.468, 31.818, 32.501, 33.259, 34.347, 35.806, 39.635, 41.072, 43.271],
        ];
        if (!isset($levels[$station])) {
            return null;
        }
        $flows = [0.0, 2.0, 5.0, 10.0, 25.0, 50.0, 100.0, 200.0, 500.0, 1000.0, 2000.0];
        $points = array_map(null, $levels[$station], $flows);
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
