<?php
namespace App\Models;

use CodeIgniter\Model;

class FlowForecastModell extends Model
{
    protected $table = 'flow_forecast';
    protected $primaryKey = null;
    protected $useAutoIncrement = false;

    protected $allowedFields = [
        'sta_code',
        'datetime',
        'wl',
        'discharge'
    ];

    protected $returnType = 'array';

    // ดึงข้อมูลตามสถานี
    public function getByStation($sta_code)
    {
        return $this->where('sta_code', $sta_code)
                    ->orderBy('datetime', 'DESC')
                    ->findAll();
    }

    public function getLastDays($days = 7)
    {
        $date = date("Y-m-d H:i:s", strtotime("-$days days"));
        
        return $this->where('datetime >=', $date)
                    ->orderBy('sta_code ASC, datetime DESC')
                    ->findAll();
    }

    // ดึงข้อมูลวันนี้ของสถานีที่ระบุ
    public function getTodayByStationCodes($staCodes)
    {
        $today = date("Y-m-d");

        return $this->whereIn('sta_code', $staCodes)
                    ->like('datetime', $today)
                    ->orderBy('datetime', 'ASC')
                    ->findAll();
    }

    // ดึงปีที่มีข้อมูล
    public function getYears($sta_code)
    {
        return $this->select("DISTINCT YEAR(datetime) AS year")
                    ->where('sta_code', $sta_code)
                    ->orderBy('year', 'DESC')
                    ->findAll();
    }

    public function getFlowForecastDataByCode($sta_code)
    {
        return $this->db->table('flow_forecast')
            ->where('sta_code', $sta_code)
            ->get()
            ->getResultArray();
    }

    // ดึงข้อมูลจาก flowForecast_data ตาม sta_code และช่วงปี
    public function getFlowForecastDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        return $this->db->table('flow_forecast')
            ->where('sta_code', $sta_code)
            ->where("YEAR(datetime) >=", $startYear)
            ->where("YEAR(datetime) <=", $endYear)
            ->orderBy('datetime', 'ASC')
            ->get()
            ->getResultArray();
    }
}
