<?php

namespace App\Libraries;

// Compatibility for callers using the original Y.15 helper.
class Y15RatingCurve
{
    public static function discharge($waterLevel): ?float
    {
        return FlowRatingCurve::discharge('Y.15', $waterLevel);
    }
}
